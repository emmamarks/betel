const User = require("../models/users");
const predict = require("../models/create");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const errorHandler = require("../middleware/error");
const { genOTP } = require("../utils/sendotp");

exports.signup = async (req, res, next) => {
  try {
    const {
      account,
      email,
      bankCode,
      bankId,
      accountName,
      bankName,
      password,
      username
    } = req.body;
    
    if (
      !account ||
      !email ||
      !bankCode ||
      !bankId ||
      !accountName ||
      !bankName ||
      !username ||
      !password
    
    )
    return res
      .status(422)
      .json({ message: "Some required data are missing" }
    );

    let userExists = await User.findOne({ username });
    if (userExists) {
      return errorHandler(
        { message: "username already taken", statusCode: 400 },
        res
      );
    }

    const user = await User.findOne({ email });
    if (!user)
    return res.status(400).json({ message: "User not found, please sign up" });

    user.account_name = accountName;
    user.account_number = account;
    user.bank_name = bankName;
    user.bank_id = bankId;
    user.bank_code = bankCode;
    const saltPassword = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(password, saltPassword);
    user.username = username
    user.password = securePassword;

    await user.save();
    sendToken(user, 201, res);
    return
  } catch (error) {
    next(error);
  }
};

exports.confirm = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!email || !otp) {
      return res.status(422).send({ message: "Email and OTP are required" });
    }
    let user = await User.findOne({ otp, email });

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
    }
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
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = function (req, res, next) {
  User.findOne({ email: req.body.email }, function (err, user) {
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
            The OTP will expire in 5 min</p>
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
  User.findOne({ email: req.body.email }, function (err, user) {
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
    //sendVerifyAccountEmail(user);

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

exports.send = async (req, res, next) => {
  
  const OTP = genOTP();
  try {
    const { email } = req.body;
    let emailExists = await User.findOne({ email });

    if (emailExists){
      if (emailExists.isVerified === true) {
        return errorHandler(
          {
            message: "email already verified, Register/Login",
            statusCode: 402,
          },
          res
        );
      }
      if (emailExists.otp){
        return errorHandler(
          {
            message: "use otp sent to mail or resend otp",
            statusCode: 406,
          },
          res
        );
      }
    }

    const user = new User({
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

exports.forgot = async (req, res, next) => {
  const { email } = req.body;
  try {

    const user = await User.findOne({ email });
    if (!user) {
      return errorHandler(
        { message: "user not found, kindly register",
          statusCode: 404
        },
        res
      );
    }

    if (!user.password) {
      return errorHandler(
        { message: "Password not found, Kindly Complete your Registration",
          statusCode: 403
        },
        res
      );
    }

    if (user.otp) {
      return errorHandler(
        {
          message: "Check mail to verify your account",
          statusCode: 400,
        },
        res
      );
    }

    if (user.resetOtp) {
      return errorHandler(
        {
          message: 
          "use password reset otp sent to your mail to change your password",
          statusCode: 401,
        },
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
          next (error);
        }
      } catch (error) {
        next (error);
      }
    };
    user.resetOtp = OTP;
    user.resetOtpExpire = Date.now() + 5 * (60 * 1000);
    await user.save();
    //sendVerifyAccountEmail(user);

    return res.status(200).json({
      success: true,
      data: "Email Sent",
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.reset = async (req, res, next) => {
  try {
    const { resetOtp,
      password
    } = req.body;
    if (!resetOtp || !password)
      return res.status(422).send({
        message: "Fill all fields",
      });

    let user = await User.findOne({ resetOtp });
    if (!user) {
      return res
        .status(401)
        .send({ message: "check your mail or get new otp" });
    }

    if (user.resetOtpExpire < Date.now()) {
      return res.status(400).send({
        message: "otp has expired. Please request a new otp",
        data: user,
      });
    }

    if(user){
      const saltPassword = await bcrypt.genSalt(10);
      const securePassword = await bcrypt.hash(password, saltPassword);

      user.resetOtp = undefined;
      user.resetOtpExpire = undefined;
      user.password = securePassword;
    }
    

    user.save(function (err) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      else {
        return res
          .status(200)
          .send({
            message: "Password Changed Successfully",
            success: true,
            data: user,
          });
      }
    });
  } catch (error) {
    next(error);
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

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
    data: user
  });
};
