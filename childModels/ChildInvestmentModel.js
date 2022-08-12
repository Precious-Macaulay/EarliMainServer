const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    investmentType: {
        type: Strings,
        enum: ["treasuryBills", "stocks", "RealEstate", "Shares"],
        required: true,
    },
    amount: {
        type: Number,
        default: 0,
        required: true,
    },
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "child"
    },
},{
    timestamps: true
})

module.exports = mongoose.model("investment", schema)

