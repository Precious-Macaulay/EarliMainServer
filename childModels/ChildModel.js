const mongoose = require("mongoose")

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
        required: true
    },
    lastname: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    hobbies: {
        type: String,
        required: true
    },
    savings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "savings"
    }],
    investments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "investment"
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
})

module.exports = mongoose.model("child", schema)