const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    childId: {
      type: String,
      ref: "child",
      required: true,
    },

    isInflow: { type: Boolean },

    paymentMethod: { type: String, default: "paystack" },

    currency: {
      type: String,
      required: [true, "currency is required"],
      enum: ["NGN", "USD", "EUR", "GBP"],
    },

    status: {
      type: String,
      required: [true, "payment status is required"],
      enum: ["success", "pending", "failed"],
    },
  },
  { timestamp: true }
);

module.exports = mongoose.model("walletTransaction", walletTransactionSchema);
