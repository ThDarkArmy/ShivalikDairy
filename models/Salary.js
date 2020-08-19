const mongoose = require('mongoose')

const salarySchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true
    }, 
    
    isPaid: {
        type: Boolean,
        default: false
    },
    ofMonthAndYear: {
        type: String
    },
    datePaid: {
        type: String,
        default: (new Date()).toLocaleDateString("en-US")
    },

    paidTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    }
})

const Salary = mongoose.model('Salary', salarySchema)

module.exports = Salary