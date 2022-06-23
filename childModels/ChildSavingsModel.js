const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    earli: {
        type: Number,
        default: 0,
    },
    kolo: {
        type: Number,
        default: 0,
    },
    freedom: {
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

module.exports = mongoose.model("savings", schema)

