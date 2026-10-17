const { Schema, model } = require('mongoose');
const ref = (r) => ({ type: Schema.Types.ObjectId, ref: r });

const Message = new Schema({
  from: { ...ref('User'), required: true },
  to: { ...ref('User'), required: true },
  text: { type: String, required: true, maxlength: 2000 },
  read: { type: Boolean, default: false },
}, { timestamps: true });
Message.index({ from: 1, to: 1, createdAt: -1 });
Message.index({ to: 1, read: 1 });

module.exports = model('Message', Message);
