const mongoose = require('mongoose')

const sellerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    profilePic: {
        type: String,
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },

    mobile: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    dateJoined: {
        type: Date,
        default: new Date()
    },

    totalAmountOfMilkSold: {
        type: Number,
        required: true
     },
 
     totalAmountPaid: {
         type: Number,
         default: 0
     }
})


const Seller = mongoose.model("Seller", sellerSchema)

module.exports = Seller