const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    treasuryBills: {
        type: Number,
        default: 0,
    },
    stocks: {
        type: Number,
        default: 0,
    },
    RealEstate: {
        type: Number,
        default: 0,
    },
    Shares: {
        type: Number,
        default: 0,
    },
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "child"
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
},{
    timestamps: true
})

module.exports = mongoose.model("investment", schema)

