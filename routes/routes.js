const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  forgotpassword,
  resetpassword,
  create,
  verify,
  resendLink,
  send,
  confirm,
  resendOtp,
  forgot,
  reset,
  otp,
  resendPasswordOtp,
} = require("../controllers/auth");

const { userProfile } = require("../controllers/user");

//const { predictions } = require('../controllers/predictions');

const { protect } = require("../middleware/protect");

const { created } = require("../controllers/created");
const { listBanks, resolveAccountNumber } = require("../controllers/paystack");

router.route("/verify/:confirmAccountToken").post(verify);

router.route("/resend-link/").post(resendLink);

router.route("/resend/").post(resendOtp);

router.route("/forum").get(protect, userProfile);

router.route("/send").post(send);

router.route("/signup").post(signup);

router.route("/login").post(login);

router.route("/confirm").post(confirm);

router.route("/create").post(protect, create);

router.route("/created").get(created);

router.route("/forgotpassword").post(forgotpassword);

router.route("/forgot").post(forgot);

router.route("/otp").post(otp);

router.route("/resendotp").post(resendPasswordOtp);

router.route("/resetpassword/:resetPasswordToken").put(resetpassword);

router.route("/reset").put(reset);
router.route("/banks").get(listBanks);
router.route("/resolve-account-number").post(resolveAccountNumber);

module.exports = router;
