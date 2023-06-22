const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  send,
  confirm,
  resendOtp,
  forgot,
  reset,
  resendPasswordOtp,
  create,
  ticket,
  one,
} = require("../controllers/auth");

const { userProfile } = require("../controllers/user");

const { profile } = require("../controllers/profile");

const { protect } = require("../middleware/protect");

const { created } = require("../controllers/created");

const { details } = require("../controllers/details");

const { listBanks, resolveAccountNumber } = require("../controllers/paystack");

router.route("/resend").post(resendOtp);

router.route("/home").get(protect, userProfile);

router.route("/send").post(send);

router.route("/signup").post(signup);

router.route("/login").post(login);

router.route("/confirm").post(confirm);

router.route("/ticket").post(ticket);

router.route("/create").post(protect, create);

router.route("/created").get(created);

router.route("/profile/:author").get(profile);

router.route("/forgot").post(forgot);

router.route("/reset").post(reset);

router.route("/resendotp").post(resendPasswordOtp);

router.route("/banks").get(listBanks);

router.route("/details/:_id").get(protect, details);

router.route("/resolve-account-number").post(resolveAccountNumber);

router.route("/one/:_id").get(one);

module.exports = router;
