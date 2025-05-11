const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  emailEncrypted: { type: String, required: true },
  promoCode: { type: String },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
  testUntil: { type: Date },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);
