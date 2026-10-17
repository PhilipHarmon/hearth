const Notification = require('./models/Notification');

// Never notify yourself; collapse repeated unread likes from the same person on the same post.
module.exports = async (user, actor, type, post) => {
  if (!user || String(user) === String(actor)) return;
  if (type === 'like' && (await Notification.exists({ user, actor, type, post, read: false }))) return;
  await Notification.create({ user, actor, type, post });
};
