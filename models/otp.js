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
    }
});

module.exports = mongoose.model('otp', otpSchema);