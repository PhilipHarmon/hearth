const r = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
r.use(auth);

// Conversation list: one row per person, newest first, with unread counts
r.get('/', async (req, res) => {
  const me = req.user._id;
  const rows = await Message.aggregate([
    { $match: { $or: [{ from: me }, { to: me }] } },
    { $sort: { createdAt: -1 } },
    { $group: {
        _id: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] },
        last: { $first: '$$ROOT' },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$read', false] }] }, 1, 0] } },
    } },
    { $sort: { 'last.createdAt': -1 } },
  ]);
  const users = await User.find({ _id: { $in: rows.map((x) => x._id) }, banned: false });
  const byId = Object.fromEntries(users.map((u) => [String(u._id), u.pub()]));
  res.json(rows.filter((x) => byId[String(x._id)]).map((x) => ({
    user: byId[String(x._id)],
    last: { text: x.last.text, createdAt: x.last.createdAt, mine: String(x.last.from) === String(me) },
    unread: x.unread,
  })));
});

// Open a thread (also marks their messages to you as read)
r.get('/:id', async (req, res) => {
  const me = req.user._id;
  const other = await User.findById(req.params.id);
  if (!other || other.banned) return res.status(404).json({ error: 'User not found' });
  const messages = await Message.find({ $or: [{ from: me, to: other._id }, { from: other._id, to: me }] })
    .sort({ createdAt: -1 }).limit(100);
  await Message.updateMany({ from: other._id, to: me, read: false }, { read: true });
  res.json({ user: other.pub(), messages: messages.reverse() });
});

r.post('/:id', async (req, res) => {
  const me = req.user;
  const text = (req.body.text || '').trim();
  const other = await User.findById(req.params.id);
  if (!text) return res.status(400).json({ error: 'Write a message first.' });
  if (!other || other.banned || other._id.equals(me._id)) return res.status(400).json({ error: 'You cannot message this user.' });
  if (!me.friends.some((f) => f.equals(other._id)) && me.role !== 'admin')
    return res.status(403).json({ error: 'You can only message friends.' });
  res.json(await Message.create({ from: me._id, to: other._id, text }));
});

module.exports = r;
