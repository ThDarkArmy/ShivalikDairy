const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')
const { salarySchema} = require('../helpers/validationSchema')

const Salary = require('../models/Salary')
const User = require('../models/User')

// get all salaries
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const salaries = await Salary.find({}).select("-__v")
        res.status(200).json({salaries})
    }catch(error){
        next(error)
    }
})

// get salary by id
router.get('/byId/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const salary = await Salary.findById(req.params.id).select("-__v")
        res.status(200).json(salary)
    }catch(error){
        next(error)
    }
})


// get all employees
router.get('/employees',verifyAccessToken, async (req, res, next)=>{
    try{
        const users = await User.find({role:"EMPLOYEE"}).select("-__v")
        //console.log("consumers",consumers)
        res.status(200).json({users})
    }catch(error){
        next(error)
    }
})

// get salary by employee
router.get('/employee-details/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const month = (new Date()).getMonth()
        const year = (new Date()).getFullYear()
        const salary = await Salary.findOne({user: req.params.id, ofMonthAndYear: month+"-"+year})
        const user = await User.findById(req.params.id).select("-__v -password")
        var salaryStatus = 'unpaid';
        if(salary){
            salaryStatus = 'paid'
        }
        const {name, email, profilePic, mobile, dateJoined, _id} = user
        const employee = {
            _id,
            name,
            email,
            profilePic,
            mobile,
            dateJoined,
            salaryStatus: salaryStatus
        }
    
        res.status(200).json(employee)
    }catch(error){
        next(error)
    }
})


// add salary
router.post('/add', verifyAccessToken, async (req, res, next)=>{
    
    try{

        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to pay salary.")
        
        const result = await salarySchema.validateAsync(req.body)
        const {amount, isPaid, ofMonthAndYear, userId} = result
        const salary = await Salary.findOne({user: userId, ofMonthAndYear: ofMonthAndYear})
        console.log(salary)
        if(salary!==null) throw createError.Conflict("Salary is already paid for this month.")
        
        const newSalary = new Salary({
            amount,
            isPaid,
            ofMonthAndYear,
            user: userId
        })

        const savedSalary = await newSalary.save()
        res.status(201).json({msg: "Salary paid successfully."})

    }catch(error){
        next(error)
    }
})

// update salary
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update salary.")
        const result = await salarySchema.validateAsync(req.body)
       
        const salary = await Salary.findById(req.params.id)
        if(!salary) throw createError.NotFound("Salary with given id doesn't exists.")
        const {amount, isPaid, ofMonthAndYear, userId} = result
        const newSalary = new Salary({
            amount,
            isPaid,
            ofMonthAndYear,
            user: userId
        })
        const response = await Salary.findByIdAndUpdate(req.params.id, {$set: newSalary}, {new: true})
        res.status(200).json({msg: "Salary updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete salary from database
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update salary.")
        const salary = await Salary.findById(req.params.id)
        if(!salary) return createError.NotFound("Salary with given id doesn't exists!")
        const response = await Salary.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Salary deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router