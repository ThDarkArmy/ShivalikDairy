const mongoose = require('mongoose')

const calfSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    profilePic: {
        type: String,
    },
    dob: {
        type: String
    },
    isHealthy: {
        type: Boolean,
        default: true
    },
    gender: {
        type: String
    },

    childOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cow"
    }
})

const Calf = mongoose.model("Calf", calfSchema)

module.exports = Calf