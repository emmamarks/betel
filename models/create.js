const mongoose = require('mongoose');

const prediction = new mongoose.Schema({
    description:{
        type: String,
    },
    amount:{
        type: String,
    },
    time:{
        type: Date,
    },
    date:{
        type: Date,
        default: Date.now
    },
    ticket:{
        type: String,
    },
    email1:{
        type: String,
    },
    email2:{
        type: String,
    },
    paid1:{
        type: Boolean,
        default: false,
    },
    paid2:{
        type: Boolean,
        default: false,
    },
    author:{
       type: mongoose.Schema.Types.ObjectId,
       ref: 'otp'
   }
})

module.exports = mongoose.model('create', prediction);