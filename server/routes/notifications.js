const r = require('express').Router();
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
r.use(auth);

// Unread badges for the nav bar
r.get('/count', async (req, res) => {
  const [notifications, messages] = await Promise.all([
    Notification.countDocuments({ user: req.user._id, read: false }),
    Message.countDocuments({ to: req.user._id, read: false }),
  ]);
  res.json({ notifications, messages });
});

r.get('/', async (req, res) =>
  res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50)
    .populate('actor', 'username displayName avatar').populate('post', 'text media')));

r.post('/read', async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

module.exports = r;
