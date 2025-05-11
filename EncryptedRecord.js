const mongoose = require('mongoose');

const EncryptedRecordSchema = new mongoose.Schema({
  user: String,
  recordId: String,
  encryptedData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EncryptedRecord', EncryptedRecordSchema);
