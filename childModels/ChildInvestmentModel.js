const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    investmentType: {
      type: String,
      enum: ["treasuryBills", "stocks", "RealEstate", "Shares"],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    interest: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum : ["Active", "Completed"],
      required: true
    },
    duration: {
        type: String,
        require: true
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "child",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("investment", schema);
