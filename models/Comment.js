const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
