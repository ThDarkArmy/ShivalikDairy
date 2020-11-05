const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')
const { expenseSchema} = require('../helpers/validationSchema')

const Expense = require('../models/Expense')


// get all expenses
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const expenses = await Expense.find({}).select("-__v")
        res.status(200).json({expenses})
    }catch(error){
        next(error)
    }
})

// get expense by id
router.get('/byId/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const expense = await Expense.findById(req.params.id).select("-__v")
        res.status(200).json(expense)
    }catch(error){
        next(error)
    }
})


// get all expense by month and year
router.get('/byMonthYear/:my',verifyAccessToken, async (req, res, next)=>{
    try{
        const expenses = await Expense.find({}).select("-__v")
        
        const my = (req.params.my).split('-')
    
        var expByMonth = []
        expenses.forEach(expense=>{
            //console.log(new Date(expense.date).getMonth()+"-"+expense.date.getFullYear())
            if(new Date(expense.date).getMonth()===parseInt(my[0])-1 && new Date(expense.date).getFullYear()===parseInt(my[1])){
                
                expByMonth.push(expense)
            }
        })
        res.status(200).json({expenses: expByMonth})
    }catch(error){
        next(error)
    }
})


// add expense
router.post('/add', verifyAccessToken, async (req, res, next)=>{
    
    try{
        
        const result = await expenseSchema.validateAsync(req.body)
        const {foodItems, medicinalItems, others} = result
        
        const newExpense = new Expense({
            foodItems, medicinalItems, others
        })

        const savedExpense = await newExpense.save()
        res.status(201).json({msg: "Expense added successfully."})

    }catch(error){
        next(error)
    }
})

// update expense
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        const result = await expenseSchema.validateAsync(req.body)
       
        const expense = await Expense.findById(req.params.id)
        if(!expense) throw createError.NotFound("Expense with given id doesn't exists.")
        const {foodItems, medicinalItems, others} = result
        
        const newExpense = new Expense({
            _id: expense._id,
            foodItems, medicinalItems, others
        })
        const response = await Expense.findByIdAndUpdate(req.params.id, {$set: newExpense}, {new: true})
        res.status(200).json({msg: "Expense updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete expense from database
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        
        const expense = await Expense.findById(req.params.id)
        if(!expense) return createError.NotFound("Expense with given id doesn't exists!")
        const response = await Expense.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Expense deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router