const mongoose = require('mongoose')

const cowSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true, 
        unique: true
    },
    profilePic: {
        type: String,
    },
    age: {
        type: Number
    },
    isProductive: {
        type: Boolean,
        default: false
    },

    amountOfMilk: {
        type: Number
    }, 
    pregnancy: {
        isPregnant: {
            type: Boolean,
            default: false
        },
        pregnancyDuration: {
            type: Number,
            default: 0
        }
    },
    isHealthy: {
        type: Boolean,
        default: true
    }
})

const Cow = mongoose.model("Cow", cowSchema)

module.exports = Cow