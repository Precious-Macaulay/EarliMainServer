const ChildSavingsModel = require("../childModels/ChildSavingsModel");

module.exports = function (agenda) {
  agenda.define("chargeCard", async (job) => {
    const form = job.attrs.data;

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

    await chargeCard(form, async (error, response) => {
      console.log(response);
      const ref = response.data.reference;
      if (error) {
        console.log(error);
      } else {
        if (!ref) {
          console.log("error");
        } else {
          verifyPayment(ref, async (error, body) => {
            if (error) {
              //handle error
              console.log(error, body);
              res.send("Failed to verify payment");
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
      }
    });
  });
};
