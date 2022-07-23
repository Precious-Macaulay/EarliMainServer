const _ = require("lodash");
const request = require("request");
const card = require("./childModels/card");
const child = require("./childModels/ChildModel");
const ChildSavingsModel = require("./childModels/ChildSavingsModel");
const UserModel = require("./UserModel");
require("dotenv").config();
const schedule = require("node-schedule");
const moment = require("moment");
const agenda = require("./lib/agenda.js");

//paystack helper function
const initializePayment = (body, myCallback) => {
  const options = {
    url: "https://api.paystack.co/transaction/initialize",
    headers: {
      authorization: `Bearer ${process.env.SECRET_KEY}`,
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
    body,
  };
  const callback = (error, response, body) => {
    return myCallback(error, body);
  };
  request.post(options, callback);
};

const verifyPayment = (ref, mycallback) => {
  const options = {
    url:
      "https://api.paystack.co/transaction/verify/" + encodeURIComponent(ref),
    headers: {
      Authorization: `Bearer ${process.env.SECRET_KEY}`,
    },
  };
  const callback = (error, body) => {
    return mycallback(error, body);
  };
  request(options, callback);
};

const getPayLink = async (req, res) => {
  const userId = req.params.id;

  const foundUser = await UserModel.findById(userId);

  if (!foundUser) {
    res.status(400).json({ message: "User not found" });
  }

  const body = JSON.stringify({
    email: foundUser.email,
    amount: "10000",
    channels: ["card"],
    metadata: {
      parent_name: `${foundUser.lastname} ${foundUser.firstname}`,
      custom_filters: {
        recurring: true,
      },
    },
  });

  initializePayment(body, (error, body) => {
    if (error) {
      //handle error
      console.log(error, body);
      res.send("Failed to initialize payment");
    }
    let response = JSON.parse(body);
    console.log(response);
    res.status(200).send(response.data.authorization_url);
  });
};

const saveCard = async (req, res) => {
  const ref = req.query.reference;
  try {
    verifyPayment(ref, async (error, body) => {
      if (error) {
        //handle errors appropriately
        console.log(error);
      }
      console.log(body.body);
      let response = JSON.parse(body.body);

      const data = _.at(response.data, [
        "customer.email",
        "authorization.authorization_code",
        "authorization.bin",
        "authorization.last4",
        "authorization.exp_month",
        "authorization.card_type",
        "authorization.bank",
        "authorization.country_code",
        "authorization.brand",
        "authorization.reusable",
        "authorization.signature",
      ]);

      [
        email,
        authorization_code,
        bin,
        last4,
        exp_month,
        card_type,
        bank,
        country_code,
        brand,
        reusable,
        signature,
      ] = data;

      const newCard = {
        email,
        authorization_code,
        bin,
        last4,
        exp_month,
        card_type,
        bank,
        country_code,
        brand,
        reusable,
        signature,
      };

      const findUser = await UserModel.findOne({ email });
      console.log(findUser);
      if (!findUser) {
        console.log("user not found");
      }

      const findCard = await card.findOne({ signature });

      if (findCard) {
        console.log("card already exist");
        res.status(409).send({
          message: "card already exist",
          data: findUser,
        });
      } else {
        let createCard = await card.create(newCard);
        findUser.cards.push(createCard);
        findUser.save();
      }
      res.status(200).send("success");
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      message: "Failed to create card",
    });
  }
};

const populateCardInParents = async (req, res) => {
  try {
    const getSingleParent = await UserModel.findById(req.params.id).populate(
      "cards"
    );
    res.status(201).json({ message: "Parent data", data: getSingleParent });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//paystack charge authorization
const chargeCard = async (form, myCallback) => {
  var options = {
    url: "https://api.paystack.co/transaction/charge_authorization",
    headers: {
      Authorization: `Bearer ${process.env.SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    form,
  };
  const callback = (error, response, body) => {
    return myCallback(error, body);
  };
  request.post(options, callback);
};

const createSavingsPlan = async (req, res) => {
  const childId = req.params.childId;
  const { plan, startDate, cardId, frequency, duration, amount } = req.body;
  try {
    const findChild = await child.findById(childId);

    if (!findChild) {
      console.log("child not found");
    }

    //check if plan exist
    const childFull = findChild.populate("savings");
    let childPopulate = await childFull;
    if (childPopulate.savings.indexOf("plan") === -1) {
      console.log("you have an existing plan");
    }

    //find card
    const findCard = await card.findById(cardId);

    if (!findCard) {
      console.log("card not found");
    }

    const newPlan = await ChildSavingsModel.create({
      plan: plan,
      frequency: frequency,
      startDate: startDate,
      card: findCard,
      duration: duration,
      amount: amount,
      childId: findChild,
    });

    console.log("plan added to DB");

    console.log(newPlan);
    let durationArr = duration.split(" ");
    let durNum = parseInt(durationArr[0]);
    const startTime = new Date(startDate);
    const endTime = moment(startTime).add(durNum, durationArr[1]).format();
    const cronRule = `@${frequency}`;
    const form = {
      authorization_code: findCard.authorization_code,
      email: findCard.email,
      amount: `${parseInt(amount) * 100} `,
    };
    const job = agenda.create("chargeCard", {
      chargeCard: chargeCard,
      verifyPayment: verifyPayment,
      form: form,
    });
    job.repeatEvery(cronRule, {
      timezone: "Africa/Lagos",
      startDate: startTime,
      endDate: endTime,
    });
    await job.save();
    console.log("Done");
    res.status(200).send("Done");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPayLink,
  saveCard,
  populateCardInParents,
  createSavingsPlan,
  chargeCard,
  verifyPayment,
};
