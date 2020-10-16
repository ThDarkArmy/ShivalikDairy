const mongoose = require('mongoose')

const importDetalsSchema = mongoose.Schema({
    amountOfMilkBought: {
        type: Number,
        required: true
    },

    amountPaid: {
        type: Number,
        default: 0
    },

    date: {
        type: String,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const ImportDetails = mongoose.model("ImportDetails", importDetalsSchema)

module.exports = ImportDetails