const r = require('express').Router();
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
r.use(auth);
const Notification = require('../models/Notification');
const notify = require('../notify');
const { extract } = require('../tags');

const PAGE = 15;
const U = 'username displayName avatar role';
const load = (q) => q.populate('author wall', U).populate('comments.author', U)
  .populate({ path: 'sharedFrom', populate: { path: 'author wall', select: U } });
const send = async (res, id) => res.json(await load(Post.findById(id)));
const get = async (id) => {
  const p = await Post.findById(id);
  if (!p) throw Object.assign(new Error('Post not found'), { status: 404 });
  return p;
};
const withCursor = (q, before) => (before ? { ...q, lastActivity: { $lt: new Date(before) } } : q);

// Feed: your posts, your friends' posts, posts on your/friends' walls, and any post a friend
// has commented on, so conversations show up as they happen. Newest activity first.
r.get('/feed', async (req, res) => {
  const me = req.user, ids = [me._id, ...me.friends];
  const q = { $or: [{ author: { $in: ids } }, { wall: { $in: ids } }, { 'comments.author': { $in: me.friends } }] };
  res.json(await load(Post.find(withCursor(q, req.query.before)).sort({ lastActivity: -1 }).limit(PAGE)));
});

r.get('/wall/:id', async (req, res) => {
  res.json(await load(Post.find(withCursor({ wall: req.params.id }, req.query.before)).sort({ lastActivity: -1 }).limit(PAGE)));
});

r.get('/tag/:tag', async (req, res) => {
  const q = withCursor({ tags: req.params.tag.toLowerCase() }, req.query.before);
  res.json(await load(Post.find(q).sort({ lastActivity: -1 }).limit(PAGE)));
});

// Most used hashtags over the last 7 days
r.get('/trending', async (req, res) => {
  const since = new Date(Date.now() - 7 * 864e5);
  const rows = await Post.aggregate([
    { $match: { createdAt: { $gte: since }, tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 8 },
  ]);
  res.json(rows.map((t) => ({ tag: t._id, count: t.count })));
});

r.post('/', async (req, res) => {
  const me = req.user;
  const { text = '', media = [], wall = me._id } = req.body;
  if (!text.trim() && !media.length) return res.status(400).json({ error: 'Write something or add a photo or video.' });
  const mine = String(wall) === String(me._id);
  if (!mine && !me.friends.some((f) => f.equals(wall)) && me.role !== 'admin')
    return res.status(403).json({ error: 'You can only post on your own wall or a friend\u2019s wall.' });
  const p = await Post.create({ author: me._id, wall, text: text.trim(), tags: extract(text), media: media.slice(0, 6) });
  if (!mine) await notify(wall, me._id, 'wall_post', p._id);
  send(res, p._id);
});

r.put('/:id', async (req, res) => {
  const p = await get(req.params.id);
  if (!p.author.equals(req.user._id)) return res.status(403).json({ error: 'You can only edit your own posts.' });
  p.text = (req.body.text || '').trim();
  p.tags = extract(p.text);
  if (!p.text && !p.media.length && !p.sharedFrom) return res.status(400).json({ error: 'A post needs some text or media.' });
  await p.save();
  send(res, p._id);
});

r.delete('/:id', async (req, res) => {
  const p = await get(req.params.id), me = req.user;
  if (me.role !== 'admin' && !p.author.equals(me._id) && !p.wall.equals(me._id))
    return res.status(403).json({ error: 'You cannot delete this post.' });
  await p.deleteOne();
  await Notification.deleteMany({ post: p._id });
  res.json({ ok: true });
});

r.post('/:id/like', async (req, res) => {
  const p = await get(req.params.id), me = req.user._id;
  const i = p.likes.findIndex((x) => x.equals(me));
  if (i < 0) p.likes.push(me); else p.likes.splice(i, 1);
  await p.save();
  if (i < 0) await notify(p.author, me, 'like', p._id);
  send(res, p._id);
});

r.post('/:id/comments', async (req, res) => {
  const p = await get(req.params.id), text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Write a comment first.' });
  p.comments.push({ author: req.user._id, text });
  p.lastActivity = new Date();
  await p.save();
  await notify(p.author, req.user._id, 'comment', p._id);
  if (!p.wall.equals(p.author)) await notify(p.wall, req.user._id, 'comment', p._id);
  send(res, p._id);
});

r.delete('/:id/comments/:cid', async (req, res) => {
  const p = await get(req.params.id), me = req.user;
  const c = p.comments.id(req.params.cid);
  if (!c) return res.status(404).json({ error: 'Comment not found' });
  if (me.role !== 'admin' && !c.author.equals(me._id) && !p.author.equals(me._id) && !p.wall.equals(me._id))
    return res.status(403).json({ error: 'You cannot delete this comment.' });
  p.comments.pull(c._id);
  await p.save();
  send(res, p._id);
});

r.post('/:id/share', async (req, res) => {
  let original = await get(req.params.id);
  if (original.sharedFrom) original = await get(original.sharedFrom); // always share the source post
  const text = (req.body.text || '').trim();
  const p = await Post.create({ author: req.user._id, wall: req.user._id, text, tags: extract(text), sharedFrom: original._id });
  await notify(original.author, req.user._id, 'share', original._id);
  send(res, p._id);
});

// Single post (used by notification links); keep last so it never shadows /feed, /tag, /trending
r.get('/:id', async (req, res) => {
  await get(req.params.id);
  send(res, req.params.id);
});

module.exports = r;
