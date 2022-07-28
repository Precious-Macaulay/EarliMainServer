const ChildSavingsModel = require("../childModels/ChildSavingsModel");
const request = require("request");

module.exports = function (agenda) {
  agenda.define("charge card", async (job) => {
    const form = job.attrs.data;

    const verifyPayment = (ref, mycallback) => {
      const options = {
        url:
          "https://api.paystack.co/transaction/verify/" +
          encodeURIComponent(ref),
        headers: {
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
      };
      const callback = (error, body) => {
        return mycallback(error, body);
      };
      request(options, callback);
    };

    var options = {
      url: "https://api.paystack.co/transaction/charge_authorization",
      headers: {
        Authorization: `Bearer ${process.env.SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      form : form,
    };

    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
      const ref = response.body.reference;
        if (!ref) {
          console.log("no ref");
        } else {
          verifyPayment(ref, async (error, body) => {
            if (error) {
              //handle error
              console.log(error, body);
            } else {
              if (body.body.data.status !== "success") {
                console.log("payment failed");
              } else {
                const updateBalance = await ChildSavingsModel.findOneAndUpdate(
                  newPlan,
                  { $inc: { balance: amount } },
                  { new: true }
                );
                console.log(updateBalance);
              }
            }
          });
        }
    });
  });
};
