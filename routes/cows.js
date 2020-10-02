const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')
const Cow = require('../models/Cow')
const {cowSchema} = require('../helpers/validationSchema')

// get all cows
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const cows = await Cow.find({}).select("-__v")
        res.status(200).json({cows})
    }catch(error){
        next(error)
    }
})

// get cow by id
router.get('/byId/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const cow = await Cow.findById(req.params.id).select("-__v")
        res.status(200).json(cow)
    }catch(error){
        next(error)
    }
})

// add cow
router.post('/add',verifyAccessToken, async (req, res, next)=>{
    
    try{
        //console.log(req.payload.role)
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to add cow.")
        const result = await cowSchema.validateAsync(req.body)
        const {name, age, isPregnant,  pregnantFrom, isHealthy, isProductive, amountOfMilk} = result
        const cow = await Cow.findOne({name})
        if(cow) throw createError.Conflict("Cow name already exists.")
        const newCow = new Cow({
            name,
            age,
            isPregnant,
            pregnantFrom,
            isProductive,
            isHealthy,
            amountOfMilk
        })
        const savedCow = await newCow.save()
        res.status(201).json({msg: "Cow added successfully."})

    }catch(error){
        next(error)
    }
})

// update cow
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update cow.")
        const result = await cowSchema.validateAsync(req.body)
        const {name, age, isPregnant,  pregnantFrom, isHealthy, isProductive, amountOfMilk} = result
       // console.log(req.body)
       
        //const preg = JSON.parse(pregnancy)
        const cow = await Cow.findById(req.params.id)
        if(!cow) throw createError.NotFound("Cow with given id doesn't exists.")
        const newCow = new Cow({
            _id: req.params.id,
            name,
            age,
            isPregnant,
            pregnantFrom,
            isProductive,
            isHealthy,
            amountOfMilk
        })
        const response = await Cow.findByIdAndUpdate(req.params.id, {$set: newCow}, {new: true})
        res.status(200).json({msg: "Cow updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete cow from database
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update cow.")
        const cow = Cow.findById(req.params.id)
        if(!cow) return createError.NotFound("Cow with given id doesn't exists!")
        const response = await Cow.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Cow deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router