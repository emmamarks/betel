const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
    email:{
        type: String,
        lowercase: true,
        unique: true,
    },

    date:{
        type: Date,
        default: Date.now
    },

    resetOtp: {
        type: String
    },

    resetOtpExpire: {
        type: Date
    },
    
    otp: {
        type: String
    },

    otpExpire: {
        type: Date
    },

    isVerified:{
        type: Boolean,
        default: false,
    },

    account_name:{
        type: String
    },

    account_number:{
        type: String
    },

    bank_name:{
        type: String
    },

    bank_id:{
        type: String
    },
    bank_code:{
        type: String
    }
});

otpSchema.methods.getSignedToken = function(){
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE})
}

module.exports = mongoose.model('otp', otpSchema);