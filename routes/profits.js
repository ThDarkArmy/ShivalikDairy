const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')


const Expense = require('../models/Expense')
const Salary = require('../models/Salary')
const ImportDetails = require('../models/ImportDetails')
const ExportDetails = require('../models/ExportDetails')


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
router.get('/month-year/:my',verifyAccessToken, async (req, res, next)=>{
    try{
        const expenses = await Expense.find({}).select("-__v")
        const my = (req.params.my).split('-')
    
        var expByMonth = []
        expenses.forEach(expense=>{
            if(expense.date.getMonth()===my[0] && expense.date.getFullYear()===my[1]){
                expByMonth.push(expense)
            }
        })
        
        res.status(200).json({expenses: expByMonth})
    }catch(error){
        next(error)
    }
})



module.exports = router