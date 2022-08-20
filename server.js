const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const app = express();
const router = require("./router");
const cors = require("cors");
const Agendash = require("agendash");
const agenda = require("./lib/agenda");
const bodyParser = require("body-parser");

//middlewares
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/dash", Agendash(agenda));

const url = process.env.MONGOOSE_URL;
mongoose.connect(url).then(() => {
  console.log("Connected to DB");
});

app.get("/", (req, res) => {
  res.send("Welcome To Earli");
});

app.use("/", router);

app.listen(port, () => {
  console.log("Listening to port", port);
});
