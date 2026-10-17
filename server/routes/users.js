const r = require('express').Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
r.use(auth);
const notify = require('../notify');

const has = (list, id) => list.some((x) => x.equals(id));
const status = (me, u) =>
  me._id.equals(u._id) ? 'self' : has(me.friends, u._id) ? 'friends'
  : has(u.requests, me._id) ? 'sent' : has(me.requests, u._id) ? 'received' : 'none';

r.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!q) return res.json([]);
  const rx = new RegExp(q, 'i');
  const users = await User.find({ banned: false, _id: { $ne: req.user._id }, $or: [{ username: rx }, { displayName: rx }] }).limit(20);
  res.json(users.map((u) => ({ ...u.pub(), status: status(req.user, u) })));
});

r.get('/me/network', async (req, res) => {
  const me = await User.findById(req.user._id).populate('friends requests');
  res.json({ friends: me.friends.map((u) => u.pub()), requests: me.requests.map((u) => u.pub()) });
});

r.put('/me', async (req, res) => {
  const { displayName, bio, avatar, cover } = req.body;
  const u = req.user;
  if (displayName !== undefined) u.displayName = displayName.trim() || u.username;
  if (bio !== undefined) u.bio = bio;
  if (avatar) u.avatar = avatar;
  if (cover) u.cover = cover;
  await u.save();
  res.json(u.pub());
});

r.get('/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.banned) return res.status(404).json({ error: 'User not found' });
  res.json({ ...u.pub(), status: status(req.user, u), friendCount: u.friends.length });
});

const link = async (a, b) => {
  await User.updateOne({ _id: a }, { $addToSet: { friends: b }, $pull: { requests: b } });
  await User.updateOne({ _id: b }, { $addToSet: { friends: a }, $pull: { requests: a } });
};

// Send a request, or accept one if they already sent you one
r.post('/:id/friend', async (req, res) => {
  const me = req.user;
  const t = await User.findById(req.params.id);
  if (!t || t.banned || t._id.equals(me._id)) return res.status(400).json({ error: 'Cannot add this user' });
  if (has(me.friends, t._id)) return res.json({ status: 'friends' });
  if (has(me.requests, t._id)) { await link(me._id, t._id); await notify(t._id, me._id, 'friend_accept'); return res.json({ status: 'friends' }); }
  if (!has(t.requests, me._id)) await notify(t._id, me._id, 'friend_request');
  await User.updateOne({ _id: t._id }, { $addToSet: { requests: me._id } });
  res.json({ status: 'sent' });
});

// Unfriend, cancel a sent request, or decline a received one
r.delete('/:id/friend', async (req, res) => {
  const a = req.user._id, b = req.params.id;
  await User.updateOne({ _id: a }, { $pull: { friends: b, requests: b } });
  await User.updateOne({ _id: b }, { $pull: { friends: a, requests: a } });
  res.json({ status: 'none' });
});

module.exports = r;
