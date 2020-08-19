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
        default: (new Date()).toLocaleDateString("en-US")
    },

    boughtFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller"
    }
})

const ImportDetails = mongoose.model("ImportDetails", importDetalsSchema)

module.exports = ImportDetails