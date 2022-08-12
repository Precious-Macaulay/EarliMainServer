const mongoose = require("mongoose");

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
    ref: "user",
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  walletTransaction: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "walletTransaction"
      },
    ],
  },
  transactions: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
      },
    ],
  },
  savings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "saving",
    },
  ],
  investments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "investment",
    },
  ],
});

const ChildModel = mongoose.model("child", schema);
module.exports = ChildModel;
