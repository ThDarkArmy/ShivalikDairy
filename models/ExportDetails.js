const mongoose = require('mongoose')

const exportDetailsSchema = mongoose.Schema({
    amountOfMilkSold: {
       type: Number,
       required: true
    },

    amountPaid: {
        type: Number,
        default: 0
    },

    date: {
        type: Date,
        required: true
    },
    

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const ExportDetails = mongoose.model("ExportDetails", exportDetailsSchema)

module.exports = ExportDetails