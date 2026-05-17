const mongoose = require('mongoose');

const resultSettingsSchema = new mongoose.Schema({
  gridCols: {
    type: Number,
    enum: [2, 3, 4],
    default: 3
  }
}, { timestamps: true });

module.exports = mongoose.model('ResultSettings', resultSettingsSchema);
