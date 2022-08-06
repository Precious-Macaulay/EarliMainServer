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
  res.status(200).send(body);
};

const saveCard = async (req, res) => {
  try {
    const ref = req.query.reference;
    verifyPayment(ref, async (error, body) => {
      if (error) {
        //handle errors appropriately
        console.log(error);
        res.status(400).send("failed to verify payment");
      } else {
        console.log(body.body);
        let response = JSON.parse(body.body);

        const data = _.at(response.data, [
          "customer.email",
          "authorization.authorization_code",
          "authorization.bin",
          "authorization.last4",
          "authorization.exp_month",
          "authorization.exp_year",
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
          exp_year,
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
          exp_year,
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
          return res.status(400).json("invalid user");
        } else {
          const findCard = await card.findOne({ signature });
          if (findCard) {
            console.log("card already exist");
            return res.status(409).json({
              message: "card already exist",
              data: findUser,
            });
          } else {
            let createCard = await card.create(newCard);
            findUser.cards.push(createCard);
            findUser.save();
            return res.status(200).json("Card added successfully");
          }
        }
      }
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
    res.status(201).send({ message: "Parent data", data: getSingleParent });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createSavingsPlan = async (req, res) => {
  try {
    const childId = req.params.childId;
    const { plan, startDate, cardId, frequency, duration, amount } = req.body;
    console.log(req.body);
    const findChild = await child.findById(childId);

    if (!findChild) {
      console.log("child not found");
      res.status(404).send("Child not found");
    } else {
      //find card
      const findCard = await card.findById(cardId);
      console.log(findCard);

      if (!findCard) {
        console.log("card not found");
        console.log(cardId);
        return res.status(400).json("invalid card");
      } else {
        const newPlan = await ChildSavingsModel.create({
          plan: plan,
          frequency: frequency,
          startDate: startDate,
          card: findCard,
          duration: duration,
          amount: amount,
          childId: findChild,
        });

        findChild.savings.push(newPlan);
        findChild.save();

        console.log("plan added to DB", newPlan);
        //add plan
        let durationArr = duration.split(" ");
        let durNum = parseInt(durationArr[0]);
        const startTime = new Date(startDate);
        const endTime = moment(startTime).add(durNum, durationArr[1]).format();
        const cronRule = `@${frequency}`;
        const form = {
          authorization_code: findCard.authorization_code,
          email: findCard.email,
          amount: parseInt(amount) * 100,
        };
        console.log(form, startTime);
        //schedule job
        const job = agenda.create("charge card", {
          form: form,
          plan: newPlan,
        });
        job.repeatEvery(cronRule, {
          timezone: "Africa/Lagos",
          startDate: startTime,
          endDate: endTime,
        });
        await job.save();

        job.run((err, job) => {
          console.log(err, job, "i am running fast");
        });

        console.log("Job schedule successfully");
        return res.status(200).json({
          message: "Plan Created Successfully",
        });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPayLink,
  saveCard,
  populateCardInParents,
  createSavingsPlan,
  verifyPayment,
};
