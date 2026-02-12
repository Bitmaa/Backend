const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file: { type: String, required: true },
  caption: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users who liked
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
