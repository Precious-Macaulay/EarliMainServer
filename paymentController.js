const _ = require("lodash");
const request = require("request");
const CardModel = require("./childModels/card");
const ChildModel = require("./childModels/ChildModel");
const ChildSavingsModel = require("./childModels/ChildSavingsModel");
const UserModel = require("./UserModel");
require("dotenv").config();
const moment = require("moment");
const agenda = require("./lib/agenda.js");
const Transaction = require("./childModels/transaction");
const WalletTransaction = require("./childModels/walletTransaction");
const ChildInvestmentModel = require("./childModels/ChildInvestmentModel");

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
          const findCard = await CardModel.findOne({ signature });
          if (findCard) {
            console.log("card already exist");
            return res.status(409).json({
              message: "card already exist",
              data: findUser,
            });
          } else {
            let createCard = await CardModel.create(newCard);
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
    const findChild = await ChildModel.findById(childId);

    if (!findChild) {
      console.log("child not found");
      res.status(404).send("Child not found");
    } else {
      //find card
      const findCard = await CardModel.findById(cardId);
      console.log(findCard);

      if (!findCard) {
        console.log("card not found");
        console.log(cardId);
        return res.status(400).json("invalid card");
      } else {
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

        const newPlan = await ChildSavingsModel.create({
          plan: plan,
          frequency: frequency,
          startDate: startDate,
          endDate: moment(new Date(endTime)).format("DD/MM/YYYY"),
          status: "Active",
          card: findCard,
          duration: duration,
          amount: amount,
          childId: findChild,
        });

        findChild.savings.push(newPlan);
        findChild.save();

        console.log("plan added to DB", newPlan);
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
          skipImmediate: true,
        });
        await job.save();

        agenda.schedule(endTime, "close savings", { plan: newPlan });
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

const getFund = async (req, res) => {
  try {
    const childId = req.params.childId;

    const foundChild = await ChildModel.findById(childId);

    if (!foundChild) {
      res.status(400).json({ message: "Child not found" });
    }

    const body = JSON.stringify({
      email: foundUser.email,
      metadata: {
        child_name: `${foundChild.lastname} ${foundChild.firstname}`,
        child_id: foundChild._id,
      },
    });
    res.status(200).send(body);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createWalletTransaction = async (childId, status, currency, amount) => {
  try {
    // create wallet transaction
    const walletTransaction = await WalletTransaction.create({
      amount,
      childId,
      isInflow: true,
      currency,
      status,
    });
    return walletTransaction;
  } catch (error) {
    console.log(error);
  }
};

const createTransaction = async (
  childId,
  id,
  status,
  currency,
  amount,
  customer
) => {
  try {
    // create transaction
    const transaction = await Transaction.create({
      childId,
      transactionId: id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone_number,
      amount,
      currency,
      paymentStatus: status,
      paymentGateway: "paystack",
    });
    return transaction;
  } catch (error) {
    console.log(error);
  }
};

const updateChildWallet = async (
  childId,
  amount,
  createdWalletTransaction,
  createdTransaction
) => {
  try {
    const condition = { _id: childId };
    // update wallet
    await ChildModel.findOneAndUpdate(condition, {
      $addToSet: { walletTransactions: createdWalletTransaction },
    });
    await ChildModel.findOneAndUpdate(condition, {
      $addToSet: { transactions: createdTransaction },
    });
    const wallet = await ChildModel.findOneAndUpdate(
      condition,
      { $inc: { walletBalance: amount } },
      { new: true }
    );
    return wallet;
  } catch (error) {
    console.log(error);
  }
};

const fundAChild = async (req, res) => {
  const ref = req.query.reference;
  verifyPayment(ref, async (error, body) => {
    if (error) {
      //handle errors appropriately
      console.log(error);
      res.status(400).send("failed to verify payment");
    } else {
      console.log(body.body);
      let response = JSON.parse(body.body);
      const { status, currency, id, amount, customer, metadata } =
        response.data.data;

      // check if transaction id already exist

      const transactionExist = await Transaction.findOne({ transactionId: id });

      if (transactionExist) {
        return res.status(409).send("Transaction Already Exist");
      }

      // check if child exist in our database
      const child = await ChildModel.findOne({ _id: metadata.child_id });

      // create wallet transaction
      const createdWalletTransaction = await createWalletTransaction(
        child._id,
        status,
        currency,
        amount
      );

      // create transaction
      const createdTransaction = await createTransaction(
        child._id,
        id,
        status,
        currency,
        amount,
        customer
      );

      const wallet = await updateChildWallet(
        child._id,
        amount,
        createdWalletTransaction,
        createdTransaction
      );

      return res.status(200).json({
        response: "wallet funded successfully",
        data: wallet,
      });
    }
  });
};

const createInvestment = async (req, res) => {
  const { childId } = req.params.childId;
  const { investmentType, amount, duration, interest } = req.body;

  try {
    const foundChild = await ChildModel.findById(childId);
    if (!foundChild) {
      res.send(400).send({ message: "Child not found" });
    }
    if (foundChild.walletBalance < amount) {
      res.send(400).send({ message: "insufficient fund , fund child wallet" });
    }

    foundChild.update({ $inc: { walletBalance: -amount } });

    const newInvestment = await ChildInvestmentModel.create({
      investmentType,
      amount,
      balance: amount,
      duration,
      interest,
      status: "Active",
      child: foundChild,
    });

    res.status(200).send({
      message: "Investment created successfully",
      data: newInvestment,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSavings = async (req, res) => {
  const savingsId = req.params.savingsid;

  try {
    const foundPlan = await ChildSavingsModel.findById(savingsId)
      .populate("card")
      .populate("savingsTransaction")
      .populate("childId");
    if (!foundPlan) {
      res.status(400).send({ message: "invalid savings id" });
    }

    res.status(200).send({ data: foundPlan });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllChildBalance = (child) => {
  const allSavingsBalance = child.savings.map((savings) => {
    return savings.balance;
  });

  const allInvestmentsBalance = child.investments.map((investment) => {
    return investment.balance;
  });

  console.log(allInvestmentsBalance, allSavingsBalance);

  const totalSavings =
    allSavingsBalance.length > 0
      ? allSavingsBalance.reduce((previous, current) => previous + current)
      : 0;
  const totalInvestment =
    allInvestmentsBalance.length > 0
      ? allInvestmentsBalance.reduce((previous, current) => previous + current)
      : 0;

  const walletBalance = child.walletBalance;

  return { totalSavings, totalInvestment, walletBalance };
};

const getChildTotals = async (req, res) => {
  try {
    const { childId } = req.params;
    const foundChild = await ChildModel.findById(childId)
      .populate("savings")
      .populate("investments");

    if (!foundChild) {
      res.status(400).send({ message: "child not found" });
    }

    const { totalSavings, totalInvestment, walletBalance } =
      getAllChildBalance(foundChild);

    res
      .status(200)
      .send({ data: { totalSavings, totalInvestment, walletBalance } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getParentTotals = async (req, res) => {
  try {
    const { parentId } = req.params;

    const foundParent = await UserModel.findById(parentId).populate("children");

    if (!foundParent) {
      res.status(400).send({ message: "Parent not found" });
    }
    console.log(foundParent.children);

    const allChildBalanceArr = await Promise.all(
      foundParent.children.map(async (childId) => {
        const child = await ChildModel.findById(childId._id)
          .populate("savings")
          .populate("investments");
        const { totalSavings, totalInvestment, walletBalance } =
          getAllChildBalance(child);
        console.log({ totalSavings, totalInvestment });
        return { totalSavings, totalInvestment };
      })
    );

    const { totalSavings, totalInvestment } = allChildBalanceArr.reduce(
      (prev, curr) => {
        return {
          totalSavings: prev.totalSavings + curr.totalSavings,
          totalInvestment: prev.totalInvestment + curr.totalInvestment,
        };
      }
    );

    res.status(200).send({ totalSavings, totalInvestment });
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
  getFund,
  fundAChild,
  createInvestment,
  getSavings,
  getChildTotals,
  getParentTotals,
};
