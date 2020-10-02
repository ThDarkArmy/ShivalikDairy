const mongoose = require('mongoose')

const cowSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true, 
        unique: true
    },
    age: {
        type: Number,
        required: true,
    },
    isProductive: {
        type: Boolean,
        required: true,
        default: false
    },

    amountOfMilk: {
        type: Number,
        required: true,
    }, 

    isPregnant: {
        type: Boolean,
        required: true,
        default: false
    },
    pregnantFrom: {
        type: Date,
        default: null
    },
    isHealthy: {
        type: Boolean,
        required: true,
        default: true
    }
})

const Cow = mongoose.model("Cow", cowSchema)

module.exports = Cow