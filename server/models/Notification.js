const { Schema, model } = require('mongoose');
const ref = (r) => ({ type: Schema.Types.ObjectId, ref: r });

const Notification = new Schema({
  user: { ...ref('User'), required: true },   // who receives it
  actor: { ...ref('User'), required: true },  // who caused it
  type: { type: String, enum: ['like', 'comment', 'share', 'wall_post', 'friend_request', 'friend_accept'], required: true },
  post: ref('Post'),
  read: { type: Boolean, default: false },
}, { timestamps: true });
Notification.index({ user: 1, createdAt: -1 });

module.exports = model('Notification', Notification);
