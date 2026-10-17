const r = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

r.post('/register', async (req, res) => {
  const { email = '', username = '', password = '', displayName = '' } = req.body;
  if (!email.includes('@') || password.length < 6 || !/^[a-z0-9_]{3,20}$/i.test(username))
    return res.status(400).json({ error: 'Use a valid email, a 3-20 character username (letters, numbers, underscores) and a password of 6+ characters.' });
  const taken = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
  if (taken) return res.status(409).json({ error: 'That email or username is already taken.' });
  const isAdmin = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const u = await User.create({
    email, username, displayName: displayName.trim() || username,
    role: isAdmin ? 'admin' : 'user', password: await bcrypt.hash(password, 10),
  });
  res.json({ token: sign(u), user: u.pub() });
});

r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  if (u.banned) return res.status(403).json({ error: 'This account has been suspended.' });
  res.json({ token: sign(u), user: u.pub() });
});

r.get('/me', auth, (req, res) => res.json({ user: req.user.pub() }));

module.exports = r;
