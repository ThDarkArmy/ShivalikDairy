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
        type: String,
        default: (new Date()).toLocaleDateString("en-US")
    },
    

    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consumer"
    }
})

const ExportDetails = mongoose.model("ExportDetails", exportDetailsSchema)

module.exports = ExportDetails