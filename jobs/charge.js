const ChildSavingsModel = require("../childModels/ChildSavingsModel");
const request = require("request");

module.exports = function (agenda) {
  agenda.define("charge card", async (job) => {
    const {form, plan} = job.attrs.data;

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
      console.log(response.body);
      const ref = response.body.reference;
      if (!ref) {
        console.log("no ref");
      } else {
        const options = {
          method: "GET",
          url: `https://api.paystack.co/transaction/verify/${ref}`,
          headers: {
            Authorization:
            `Bearer ${process.env.SECRET_KEY}`,
          },
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          if (response.status) {
            const updateBalance = await ChildSavingsModel.findOneAndUpdate(
             plan,
              { $inc: { balance: amount } },
              { new: true }
            );
            console.log(updateBalance);
          } else {
            console.log("Verify payment failed");
          }
        });
      }
    });
  });
};
