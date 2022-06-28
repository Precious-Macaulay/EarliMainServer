const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  imageId: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  relationship: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  savings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'savings',
    },
  ],
  investments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'investment',
    },
  ],
});

module.exports = mongoose.model('child', schema);
