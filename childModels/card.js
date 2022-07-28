const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  authorization_code : {
    type: String,
    required: true,
  },bin : {
    type: String,
    required: true
  },last4 : {
    type: String,
    required: true
  },exp_month : {
    type: String,
    required: true
  },exp_year : {
    type: String,
    required: true
  },card_type : {
    type: String,
    required: true
  },bank : {
    type: String,
    required: true
  },country_code : {
    type: String,
    required: true
  },brand : {
    type: String,
    required: true
  },reusable : {
    type: String,
    required: true
  },signature : {
    type: String,
    required: true
  },
});


module.exports = mongoose.model("card", cardSchema);
