const mongoose = require("mongoose")
const {isEmail} = require("validator")

const OtpSchema = new mongoose.Schema({
    otp: {
        type: String, 
        required: [true, "Input your Otp"]
    },
    email: {
        type: String,
        required: [true, "Input your email"],
        validate: [isEmail, "Please put a valid email"]
    },
    createdA: {type: Date, default: Date.now, index: {expires: 300}}
},{timestamps: true})

const otpModel = mongoose.model("otpModel", OtpSchema)

module.exports = otpModel
