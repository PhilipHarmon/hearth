const { Schema, model } = require('mongoose');

const User = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 20 },
  displayName: { type: String, trim: true, maxlength: 40 },
  password: { type: String, required: true },
  bio: { type: String, default: '', maxlength: 300 },
  avatar: String,
  cover: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  banned: { type: Boolean, default: false },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  requests: [{ type: Schema.Types.ObjectId, ref: 'User' }], // incoming friend requests
}, { timestamps: true });

User.methods.pub = function () {
  return {
    _id: this._id, username: this.username, displayName: this.displayName || this.username,
    bio: this.bio, avatar: this.avatar, cover: this.cover, role: this.role,
  };
};

module.exports = model('User', User);
