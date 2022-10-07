const ChildSavingsModel = require("../childModels/ChildSavingsModel");
const ChildModel = require("../childModels/ChildModel");
const request = require("request");
const Transaction = require("../childModels/transaction");
const WalletTransaction = require("../childModels/walletTransaction");
const { response } = require("express");

module.exports = function (agenda) {
  agenda.define("charge card", async (job) => {
    const { form, plan } = job.attrs.data;

    const options = {
      method: "POST",
      url: "https://api.paystack.co/transaction/charge_authorization",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SECRET_KEY}`,
      },
      body: JSON.stringify(form),
    };

    request(options, function (error, response) {
      if (error) throw new Error(error);
      let res = JSON.parse(response.body);
      if (!res.status) {
        console.log(res.message);
      } else {
        let ref = res.data.reference;
        const verifyOptions = {
          method: "GET",
          url: `https://api.paystack.co/transaction/verify/${ref}`,
          headers: {
            Authorization: `Bearer ${process.env.SECRET_KEY}`,
          },
        };
        request(verifyOptions, async (error, response) => {
          if (error) throw new Error(error);
          let resBody = JSON.parse(response.body);
          console.log(resBody);
          if (resBody.status) {
            let { amount, currency, status } = resBody.data;
            console.log(amount);
            if (resBody.data.status === "success") {
              const updateBalance = await ChildSavingsModel.findOneAndUpdate(
                { _id: plan._id },
                { $inc: { balance: amount } },
                { new: true }
              );
              console.log("updated");
              console.log(plan, updateBalance);
            }

            const createdWalletTransaction = await WalletTransaction.create({
              amount,
              childId: plan.childId,
              isInflow: true,
              currency,
              status,
            });

            await ChildSavingsModel.findOneAndUpdate(
              { _id: plan._id },
              { $addToSet: { savingsTransaction: createdWalletTransaction } }
            );
          } else {
            console.log(resBody.message);
          }
        });
      }
    });
  });

  agenda.define("close savings", (job) => {
    const { plan } = job.attrs.data;

    const foundPlan = ChildSavingsModel.findOneAndUpdate(
      { _id: plan._id },
      { $set: { status: "Completed" } },
      { new: true }
    );

    ChildModel.findOneAndUpdate(
      { _id: foundPlan.child },
      { $inc: { walletBalance: foundPlan.balance } }
    );
  });
};
