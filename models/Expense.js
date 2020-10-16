const mongoose = require('mongoose')

const expenseSchema = mongoose.Schema({
    foodItems: {
        type: Number,
        default: 0,
        required: true
    }, 
    
    medicinalItems: {
        type: Number,
        default: 0,
        required: true
    }, 

    others: {
        type: Number,
        default: 0,
        required: true
    },
    
    date: {
        type: Date,
        default:(new Date()).getMonth()+"/"+(new Date()).getDate()+"/"+(new Date()).getFullYear()
    },
})

const Expense = mongoose.model('Expense', expenseSchema)

module.exports = Expense