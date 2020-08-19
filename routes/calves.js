const express = require('express')
const router = express.Router()
const multer = require('multer')
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')

// stoarge
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'files/calves/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage})

const Calf = require('../models/Calf')

// get all calves
router.get('/', async (req, res, next)=>{
    try{
        const calves = await Calf.find({}).populate("childOf").select()
        res.status(200).json({calves})
    }catch(error){
        next(error)
    }
})

// get calf by id
router.get('/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const calf = await Calf.findById(req.params.id).populate("childOf")
        res.status(200).json(calf)
    }catch(error){
        next(error)
    }
})

// add calf
router.post('/add', verifyAccessToken, upload.single('profilePic'), async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to add calf.")
        if(!req.file) throw createError.BadRequest("Profile pic required!")
        const {name, dob, gender, isHealthy, childOf} = req.body
        const newCalf = new Calf({
            name,
            dob,
            isHealthy,
            gender,
            childOf
        })
        const savedCow = await newCalf.save()
        res.status(201).json(savedCow)

    }catch(error){
        next(error)
    }
})

// update calf
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update calf.")
        const {name, age, pregnancy, isHealthy, isProductive, amountOfMilk} = req.body
       // console.log(req.body)
        
       
        //const preg = JSON.parse(pregnancy)
        const calf = await Calf.findById(req.params.id)
        if(!calf) throw createError.NotFound("Calf with given id doesn't exists.")
        const newCalf = new Calf({
            _id: req.params.id,
            name,
            age,
            pregnancy,
            isProductive,
            isHealthy,
            amountOfMilk
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