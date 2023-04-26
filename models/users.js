const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    password:{
        type: String,
    },
    phone:{
        type: String,
    },
    date:{
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    confirmAccountToken: String,
    confirmAccountExpire: Date,

    isVerified:{
        type: Boolean,
        default: false,
    }
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
})

userSchema.methods.getSignedToken = function(){
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE})
}

userSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.resetPasswordExpire = Date.now() + 5 * (60 * 1000);
    return this.resetPasswordToken;
}

userSchema.methods.getConfirmAccountToken = function(){
    const confirmToken = crypto.randomBytes(20).toString('hex');
    this.confirmAccountToken = crypto.createHash('sha256').update(confirmToken).digest('hex');

    this.confirmAccountExpire = Date.now() + 5 * (60 * 1000);
    return this.confirmAccountToken;
}

module.exports = mongoose.model('user', userSchema);