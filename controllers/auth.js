const User = require("../models/users");
const Otp = require("../models/otp");
const predict = require("../models/create");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const errorHandler = require("../middleware/error");
const { sendConfirmAccountEmail } = require("../utils/confirmEmail");
const { genOTP } = require("../utils/sendotp");

exports.signup = async (req, res, next) => {
  try {
    const saltPassword = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(req.body.password, saltPassword);

    const user = new User({
      ...req.body,
      password: securePassword,
    });

    const { username, email } = req.body;

    let userExists = await User.findOne({ username });
    if (userExists) {
      return errorHandler(
        { message: "username already taken", statusCode: 400 },
        res
      );
    }

    let emailExists = await User.findOne({ email });
    if (emailExists) {
      return errorHandler(
        { message: "Email already exists", statusCode: 400 },
        res
      );
    }
    await user.save();
    sendConfirmAccountEmail(user);
    sendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.verify = async (req, res, next) => {
  const { confirmAccountToken } = req.params;
  User.findOne({ confirmAccountToken }, function (err, user) {
    // not valid user
    if (!user) {
      return res.status(401).send({
        message:
          "We were unable to find a user for this verification. Please SignUp!",
      });
    }
    //user is already verified
    if (user.isVerified) {
      return res
        .status(200)
        .send({ message: "User has been already verified. Please Login" });
    }
    if (user.confirmAccountExpire < Date.now()) {
      return res.status(400).send({
        message: "Your token has expired. Please resend a new token",
        data: user,
      });
    }
    // verify user
    else {
      // change isVerified to true
      user.isVerified = true;

      user.confirmAccountToken = undefined;
      user.confirmAccountExpire = undefined;

      user.save(function (err) {
        // error occur
        if (err) {
          return res.status(500).send(err.message);
        }
        // account successfully verified
        else {
          return res
            .status(200)
            .send({ message: "Your account has been successfully verified" });
        }
      });
    }
  });
};

exports.confirm = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!email || !otp) {
      return res
        .status(422)
        .send({ message: "Email and OTP are required" });
    }
    let user = await Otp.findOne({ otp, email });

    if (!user) {
      return res
        .status(401)
        .send({ message: "check your mail or get new otp" });
    }
    if (user.isVerified) {
      return res.status(201).send({
        message: "user has been already verified. Please Continue Registration",
      });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).send({
        message: "otp has expired. Please request a new otp",
        data: user,
      });
    } else {
      user.isVerified = true;

      user.otp = undefined;
      user.otpExpire = undefined;

      user.save(function (err) {
        // error occur
        if (err) {
          return res.status(500).send(err.message);
        }
        // account successfully verified
        else {
          return res.status(200).send({
            message:
              "Your account has been successfully verified. Please Continue Registration",
          });
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.resendLink = function (req, res, next) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return res.status(500).send({
        message: "An error occured. Please try again",
      });
    }
    if (user.isVerified) {
      return res.status(201).send({
        message: "This account has been already verified. Please log in.",
      });
    }
    // send verification link
    sendConfirmAccountEmail(user);
    res.status(200).json({
      success: true,
      message: "Email Sent",
    });
  });
};

exports.resendOtp = function (req, res, next) {
  Otp.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return res.status(500).send({
        message: "An error occured. Please try again",
      });
    }
    // user has been already verified
    if (user === user.isVerified) {
      return res.status(201).send({
        message: "This account has been already verified. Please log in.",
      });
    } else {
      const OTP = genOTP();

      const sendVerifyAccountEmail = async (user) => {
        try {
          const message = `<h1>${OTP}</h1>
            <p>Enter the OTP to continue your Registration <br/>
            The OTP will expire in 1hr</p>
          `;
          try {
            sendEmail({
              to: user.email,
              subject: "Account Confirmation",
              text: message,
            });
          } catch (error) {
            console.log(error);
          }
        } catch (error) {
          next(error);
        }
      };
      user.otp = OTP;
      user.otpExpire = Date.now() + 5 * (60 * 1000);
      user.save();
      sendVerifyAccountEmail(user);

      res.status(200).json({
        success: true,
        message: "otp re-sent, enter new otp",
        data: user,
      });
    }
  });
};

exports.resendPasswordOtp = function (req, res, next) {
  Otp.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      return res.status(500).send({
        message: "An error occured. Please try again",
      });
    }

    const OTP = genOTP();

    const sendVerifyAccountEmail = async (user) => {
      try {
        const message = `<h1>${OTP}</h1>
          <p>Enter the OTP to change your password  <br/>
          The OTP will expire in 5 mins</p>
        `;
        try {
          sendEmail({
            to: user.email,
            subject: "Password Reset",
            text: message,
          });
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        next(error);
      }
    };
    user.resetOtp = OTP;
    user.resetOtpExpire = Date.now() + 5 * (60 * 1000);
    user.save();
    sendVerifyAccountEmail(user);

    res.status(200).json({
      success: true,
      message: "otp re-sent, enter new otp",
      data: user,
    });
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await User.findOne({ username });

    if (!user.isVerified) {
      return errorHandler(
        {
          message:
            "Email not verified, click on the link sent to your mail to verify your account",
          statusCode: 400,
        },
        res
      );
    }

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        sendToken(user, 200, res);
      } else {
        return errorHandler(
          { message: "Username or Password Incorrect", statusCode: 400 },
          res
        );
      }
    } else {
      return errorHandler(
        { message: "User does not exist, Please Sign up", statusCode: 400 },
        res
      );
    }
  } catch (error) {
    return errorHandler(
      { message: "User exists not, Please Register", statusCode: 504 },
      res
    );
  }
};

exports.create = async (req, res, next) => {
  try {
    const prediction = new predict({
      ...req.body,
      author: req.user._id,
    });
    await prediction.save();
    return res.status(201).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
};

exports.send = async (req, res, next) => {
  const OTP = genOTP();
  try {
    const { email } = req.body;

    let emailExists = await Otp.findOne({ email });
    if (emailExists) {
      return errorHandler(
        {
          message: "Email already exists, Log in to your account",
          statusCode: 400,
        },
        res
      );
    }
    const user = new Otp({
      ...req.body,
      otp: OTP,
      otpExpire: Date.now() + 5 * (60 * 1000),
    });

    await user.save();

    const sendVerifyAccountEmail = async (user) => {
      try {
        await user.save();

        const message = `<h1>${OTP}</h1>
          <p>Enter the OTP to continue your Registration <br/>
          The OTP will expire in 5 mins</p>
        `;
        try {
          sendEmail({
            to: user.email,
            subject: "Account Confirmation",
            text: message,
          });
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        next(error);
      }
    };
    sendVerifyAccountEmail(user);

    return res.status(200).json({
      success: true,
      data: "Email Sent",
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotpassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return errorHandler(
        { message: "user not found, kindly register", statusCode: 404 },
        res
      );
    }

    const resetToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/passwordreset/${resetToken}`;
    const message = `<h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password</p>
            <a href = ${resetUrl} clicktracking = off> ${resetUrl}</a>
        `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({
        success: true,
        data: "Email Sent",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return errorHandler({ message: "invalid email", statusCode: 500 }, res);
    }
  } catch (error) {
    next(error);
  }
};

exports.forgot = async (req, res, next) => {
  const { email } = req.body;
  try {
     if (!email) {
       return errorHandler(
         { message: "Email is required", statusCode: 422 },
         res
       );
     }
    const user = await Otp.findOne({ email });

    if (!user) {
      return errorHandler(
        { message: "user not found, kindly register", statusCode: 404 },
        res
      );
    }
    const OTP = genOTP();

    const sendVerifyAccountEmail = async (user) => {
      try {
        await user.save();

        const message = `<h1>${OTP}</h1>
          <p>Enter the OTP to change your password <br/>
          The OTP will expire in 5 mins</p>
        `;
        try {
          sendEmail({
            to: user.email,
            subject: "Password Reset",
            text: message,
          });
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        console.log(error);
      }
    };
    user.resetOtp = OTP;
    user.resetOtpExpire = Date.now() + 5 * (60 * 1000);
    await user.save();
    sendVerifyAccountEmail(user);

    return res.status(200).json({
      success: true,
      data: "Email Sent",
    });
  } catch (error) {
    next(error);
  }
};

exports.otp = async (req, res, next) => {
  try {
    const { resetOtp, email } = req.body;
    if (!resetOtp || !email)
      return res.status(422).send({
        message: "Email and OTP are required",
      });
    let user = await Otp.findOne({ resetOtp, email });

    if (!user) {
      return res
        .status(401)
        .send({ message: "check your mail or get new otp" });
    }

    if (user.resetOtpExpire < Date.now()) {
      return res.status(400).send({
        message: "otp has expired. Please request a new otp",
      });
    }
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;

    user.save(function (err) {
      // error occur
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      // account successfully verified
      else {
        return res
          .status(200)
          .send({ message: "Password Changed successfully" });
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.resetpassword = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .send("Invalid reset token. Please resend your password reset token");
    }

    const saltPassword = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(req.body.password, saltPassword);
    user.password = securePassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(201).json({
      success: true,
      data: "Password Reset Success",
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.reset = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetOtp,
      resetOtpExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .send("Invalid reset token. Please resend your password reset token");
    }

    const saltPassword = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(req.body.password, saltPassword);
    user.password = securePassword;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;

    await user.save();

    return res.status(201).json({
      success: true,
      data: "Password Reset Success",
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
  });
};
