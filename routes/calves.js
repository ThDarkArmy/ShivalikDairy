const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')
const {calfSchema} = require('../helpers/validationSchema')


const Calf = require('../models/Calf')

// get all calves
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const calves = await Calf.find({}).populate("cow", "-__v").select("-__v")
        res.status(200).json({calves})
    }catch(error){
        next(error)
    }
})

// get calf by id
router.get('/byId/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const calf = await Calf.findById(req.params.id).populate("cow", '-__v').select("-__v")
        res.status(200).json(calf)
    }catch(error){
        next(error)
    }
})

// get calf by cow
router.get('/byCow/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const calves = await Calf.find({"cow": req.params.id}).populate("cowId", '-__v').select("-__v")
        res.status(200).json({calves})
    }catch(error){
        next(error)
    }
})


// add calf
router.post('/add', verifyAccessToken, async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to add calf.")
        //console.log(req.body)
        const result = await calfSchema.validateAsync(req.body)
        const {name, dob, gender, isHealthy, cowId} = result
        const newCalf = new Calf({
            name,
            dob,
            isHealthy,
            gender,
            cow: cowId
        })
        const savedCalf = await newCalf.save()
        res.status(201).json({msg: "Calf added successfully."})

    }catch(error){
        next(error)
    }
})

// update calf
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update calf.")
        const result = await calfSchema.validateAsync(req.body)
        const {name, dob, gender, isHealthy, cowId} = result
       // console.log(req.body)
        
       
        //const preg = JSON.parse(pregnancy)
        const calf = await Calf.findById(req.params.id)
        if(!calf) throw createError.NotFound("Calf with given id doesn't exists.")
        const newCalf = new Calf({
            _id: req.params.id,
            name,
            isHealthy,
            dob,
            gender,
            cow: cowId
        })
        const response = await Calf.findByIdAndUpdate(req.params.id, {$set: newCalf}, {new: true})
        res.status(200).json({msg: "Calf updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete calf from database
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update calf.")
        const calf = Calf.findById(req.params.id)
        if(!calf) return createError.NotFound("Calf with given id doesn't exists!")
        const response = await Calf.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Calf deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router