// Photos and videos are stored in MongoDB GridFS, so they survive Render redeploys
// (Render's disk is wiped on every deploy).
const r = require('express').Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const { auth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, f, cb) =>
    /^(image|video)\//.test(f.mimetype) ? cb(null, true) : cb(new Error('Only images and videos can be uploaded')),
});
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' });

r.post('/', auth, (req, res) =>
  upload.single('file')(req, res, (err) => {
    if (err || !req.file) return res.status(400).json({ error: err?.message || 'No file received' });
    const stream = bucket().openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype, metadata: { owner: req.user._id },
    });
    Readable.from(req.file.buffer).pipe(stream)
      .on('error', () => res.status(500).json({ error: 'Upload failed' }))
      .on('finish', () => res.json({
        file: stream.id.toString(),
        kind: req.file.mimetype.startsWith('video') ? 'video' : 'image',
      }));
  })
);

// Public by unguessable id so <img>/<video> tags work; supports Range requests for video seeking.
r.get('/:id', async (req, res) => {
  const _id = new mongoose.Types.ObjectId(req.params.id);
  const [f] = await bucket().find({ _id }).toArray();
  if (!f) return res.sendStatus(404);
  const size = f.length;
  let start = 0, end = size - 1;
  res.set({ 'Content-Type': f.contentType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable' });
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    if (m[1] === '') start = Math.max(size - Number(m[2]), 0);
    else { start = Number(m[1]); if (m[2]) end = Math.min(Number(m[2]), size - 1); }
    if (start > end) return res.status(416).set('Content-Range', `bytes */${size}`).end();
    res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`);
  }
  res.set('Content-Length', end - start + 1);
  bucket().openDownloadStream(_id, { start, end: end + 1 }).pipe(res);
});

module.exports = r;
