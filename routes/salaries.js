const express = require('express')
const createError = require('http-errors')
const {salarySchema} = require('../helpers/validationSchema')
const Salary = require('../models/Salary')
const {verifyAccessToken} = require('../helpers/check-auth')

const router = express.Router()

// get all salaries
router.get('/', async (req, res, next)=>{
    try{
        const salaries = await Salary.find({}).select("-__v")
        res.status(200).json({salaries})

    }catch(error){
        next(error)
    }
})


// get all salary details by employee
router.get('/:employeeId', verifyAccessToken, async (req, res, next)=>{
    try{
        const salaries = await Salary.find({paidTo: req.params.employeeId}).select("-__v")
        res.status(200).json({salaries})

    }catch(error){
        next(error)
    }
})

// get all salary details by month 
router.get('/:monthYear', (req, res, next)=>{
    try{
        const allSalaries = await Salary.find({}).select("-__v")
        var salaries =[]
        allSalaries.forEach(salary=>{
            if(salary.ofMonthAndYear===req.params.id){
                salaries.push(salary)
            }
        })
        res.status(200).json({salaries})

    }catch(error){
        next(error)
    }
})

// get all salary details by year
router.get('/year', (req, res, next)=>{
    try{

    }catch(error){
        next(error)
    }
})


// add salary
router.post('/add', verifyAccessToken, (req, res, next)=>{
    try{
    if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
    const result = salarySchema.validateAsync(req.body)
    const {amount, isPaid, ofMonthAndYear, paidTo} = result
    const newSalary = new Salary({
        amount,
        isPaid,
        ofMonthAndYear,
        paidTo
    })

    const response = await newSalary.save()
    res.status(201).json({msg: "salary added successfully."})

    }catch(error){
        next(error)
    }
})


// update salary
router.put('/:id', async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const salary = await Salary.findById(req.params.id)
        if(!salary) throw createError.NotFound("Salary with given id not found!")
        const result = salarySchema.validateAsync(req.body)
        const {amount, isPaid, ofMonthAndYear, paidTo} = result
        const newSalary = new Salary({
            _id: salary.id,
            amount,
            isPaid,
            ofMonthAndYear,
            paidTo
        })

        const response = await Salary.findByIdAndUpdate(req.params.id, {$set: newSalary}, {new : true})
        res.status(201).json({msg: "salary updated successfully."})

    }catch(error){
        next(error)
    }
})


// delete salary
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const salary = await Salary.findById(req.params.id)
        if(!salary) throw createError.NotFound("Salary with given id not found!")
        const response = await Salary.findByIdAndDelete(req.params.id)
        res.status(201).json({msg: "salary deleted successfully."})

    }catch(error){
        next(error)
    }
})


module.exports = router