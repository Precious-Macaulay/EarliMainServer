const express = require('express');
const multer = require('./utils/multer');
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
} = require('./controller');

router.post('/register', RegisterUser);
router.post('/verify', VerifyOTP);
router.post('/login', LoginUsers);
router.post('/verifylogin', VerifyOTPForLogin);
router.post('/child/:id', multer, createChildAccount);
router.get('/oneparent/:id', populateChildInParents);
router.get('/allusers', getAllUsers);
router.get('/child/:id', getOneChild);

module.exports = router;
