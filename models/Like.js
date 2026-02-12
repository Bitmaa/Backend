const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Like', LikeSchema);
