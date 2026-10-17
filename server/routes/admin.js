const r = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const { auth, admin } = require('../middleware/auth');
r.use(auth, admin);

const U = 'username displayName avatar role';

r.get('/stats', async (req, res) => {
  const [users, posts, banned, c] = await Promise.all([
    User.countDocuments(), Post.countDocuments(), User.countDocuments({ banned: true }),
    Post.aggregate([{ $group: { _id: null, n: { $sum: { $size: '$comments' } } } }]),
  ]);
  res.json({ users, posts, banned, comments: c[0]?.n || 0 });
});

r.get('/users', async (req, res) => res.json(await User.find().sort({ createdAt: -1 }).select('-password').limit(300)));

r.patch('/users/:id/ban', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role === 'admin') return res.status(400).json({ error: 'Admins cannot be suspended.' });
  u.banned = !u.banned;
  await u.save();
  res.json({ banned: u.banned });
});

r.patch('/users/:id/role', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u._id.equals(req.user._id)) return res.status(400).json({ error: 'You cannot change your own role.' });
  u.role = u.role === 'admin' ? 'user' : 'admin';
  await u.save();
  res.json({ role: u.role });
});

r.delete('/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role === 'admin') return res.status(400).json({ error: 'Admins cannot be deleted.' });
  await Post.deleteMany({ $or: [{ author: u._id }, { wall: u._id }] });
  await Post.updateMany({}, { $pull: { likes: u._id, comments: { author: u._id } } });
  await User.updateMany({}, { $pull: { friends: u._id, requests: u._id } });
  await Notification.deleteMany({ $or: [{ user: u._id }, { actor: u._id }] });
  await Message.deleteMany({ $or: [{ from: u._id }, { to: u._id }] });
  await u.deleteOne();
  res.json({ ok: true });
});

r.get('/posts', async (req, res) =>
  res.json(await Post.find().sort({ createdAt: -1 }).limit(50).populate('author wall', U)));

module.exports = r;
