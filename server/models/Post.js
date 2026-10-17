const { Schema, model } = require('mongoose');
const ref = (r) => ({ type: Schema.Types.ObjectId, ref: r });

const Comment = new Schema({
  author: { ...ref('User'), required: true },
  text: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

const Post = new Schema({
  author: { ...ref('User'), required: true },
  wall: { ...ref('User'), required: true }, // whose wall the post lives on
  text: { type: String, default: '', maxlength: 5000 },
  media: [{ file: String, kind: { type: String, enum: ['image', 'video'] }, _id: false }],
  tags: [{ type: String, index: true }],
  likes: [ref('User')],
  comments: [Comment],
  sharedFrom: ref('Post'),
  lastActivity: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = model('Post', Post);
