const express = require ('express');
const router = express.Router();

const { signup,
    login,
    forgotpassword,
    resetpassword,
    create,
    verify,
    resendLink,
    send
} = require('../controllers/auth');

const sendotp = require('../utils/otp')

const { userProfile } = require('../controllers/user');

//const { predictions } = require('../controllers/predictions');

const { protect } = require('../middleware/protect')

const { created } = require('../controllers/created');

router.route('/verify/:confirmAccountToken').post(verify);

router.route("/resend-link/").post(resendLink);

router.route('/forum').get(protect, userProfile);

router.route('/send').post(send);

router.route('/signup').post(signup);

router.route('/login').post(login);

router.route('/create').post(protect, create);

router.route('/created').get(created);

router.route('/forgotpassword').post(forgotpassword);

router.route('/resetpassword/:resetPasswordToken').put(resetpassword);

module.exports = router;