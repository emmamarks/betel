const ErrorResponse = require('./errorResponse');
const sendEmail = require('./sendEmail');
const templateCopy = require('../models/users');
//const { sendOtp } = require('./sendotp')

exports.sendVerifyAccountEmail = async (user) =>{

    try {

        //const confirmToken = user.getConfirmAccountToken();
        let otp = ''
        const genOTP = () => {
            for (let i = 0; i <=3; i++){
                const ranVal = Math.round(Math.random()*9)
                otp += ranVal
            }
            return otp
        }

        const OTP = genOTP ()

        //await user.save()

        const message = `<h1>${OTP}</h1>
            <p>Enter the OTP to confirm your Account <br/>
            The OTP will expire in 1hr</p>
        `
        try {
            await sendEmail({
                to: user.email,
                subject: "Account Confirmation",
                text: message,
            })
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
}