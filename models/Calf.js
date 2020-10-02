const mongoose = require('mongoose')

const calfSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    isHealthy: {
        type: Boolean,
        default: true
    },
    gender: {
        type: String,
        required: true
    },

    cow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cow"
    }
})

const Calf = mongoose.model("Calf", calfSchema)

module.exports = Calf