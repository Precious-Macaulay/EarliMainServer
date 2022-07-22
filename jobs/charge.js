const ChildSavingsModel = require("../childModels/ChildSavingsModel");
const { chargeCard, verifyPayment } = require("../paymentController");

module.exports = function (agenda) {
  agenda.define("chargeCard", async (job) => {
    chargeCard(job.attrs.data.form, async (error, response) => {
      if (error) {
        console.log(error);
      }
      console.log(response);
      const ref = response.data.reference;
      if (!ref) {
        console.log("error");
      }
      verifyPayment(ref, async (error, body) => {
        if (error) {
          //handle error
          console.log(error, body);
          res.send("Failed to initialize payment");
        }
        if (body.body.data.status !== "success") {
          console.log("payment failed");
        }
        const updateBalance = await ChildSavingsModel.findOneAndUpdate(
          newPlan,
          { $inc: { balance: amount } },
          { new: true }
        );
        console.log(updateBalance);
      });
    });
  });
};
