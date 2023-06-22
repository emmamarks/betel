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
   author:{
       type: mongoose.Schema.Types.ObjectId,
       ref: 'otp'
   }
})

module.exports = mongoose.model('create', prediction);
