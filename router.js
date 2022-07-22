const express = require("express");
const multer = require("./utils/multer");
const router = express.Router();

const {
  RegisterUser,
  VerifyOTP,
  VerifyOTPForLogin,
  LoginUsers,
  getAllUsers,
  createChildAccount,
  populateChildInParents,
  getOneChild,
} = require("./controller");
const {
  getPayLink,
  saveCard,
  populateCardInParents,
  createSavingsPlan,
} = require("./paymentController");

router.post("/register", RegisterUser);
router.post("/verify", VerifyOTP);
router.post("/login", LoginUsers);
router.post("/verifylogin", VerifyOTPForLogin);
router.post("/child/:id", multer, createChildAccount);
router.post("/cardlink/:id", getPayLink);
router.post("/createplan/:childId", createSavingsPlan);
router.get("/oneparent/:id", populateChildInParents);
router.get("/parentcards/:id", populateCardInParents);
router.get("/allusers", getAllUsers);
router.get("/child/:id", getOneChild);
router.get("/paystack/callback", saveCard);

module.exports = router;
