const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const ExportDetails = require('../models/ExportDetails')
const { verifyAccessToken } = require('../helpers/check-auth')
const { exportDetailsSchema} = require('../helpers/validationSchema')
const User = require('../models/User')


// get detail of all exports
router.get('/detail', verifyAccessToken, async (req, res, next)=>{
    try{
        const exportDetails = await ExportDetails.find({}).populate("user", "-__v -password").select("-__v")
        res.status(200).json({exportDetails})
    }catch(error){
        next(error)
    }
})


// get total of all exports
router.get('/total', verifyAccessToken, async (req, res, next)=>{
    try{
        const exportDetails = await ExportDetails.find({}).select("-__v")
        var totalMilkSold = 0
        var totalAmountPaid=0
        exportDetails.forEach(exportDetail=>{
            totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
            totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
        })
        res.status(200).json({data: "All",totalMilkSold, totalAmountPaid})
    }catch(error){
        next(error)
    }
})


// get export detail by id
router.get('/byId/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const exportDetail = await ExportDetails.findById(req.params.id).populate("user", "-__v -password").select("-__v")
        res.status(200).json(exportDetail)

    }catch(error){
        next(error)
    }
})

// get export details by date
router.get('/byDate/detail/:date', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const exportDetails = await ExportDetails.find({date : date}).populate("user", "-__v -password").select("-__v")
        res.status(200).json({exportDetails})

    }catch(error){
        next(error)
    }
})

// get total of export by date
router.get('/byDate/total/:date',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const exportDetails = await ExportDetails.find({date : date})
        var totalMilkSold = 0
        var totalAmountPaid=0
        exportDetails.forEach(exportDetail=>{
            totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
            totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
        })
        
        res.status(200).json({date,totalMilkSold, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


// get detail of all exports by user
router.get('/byConsumer/detail/:consumerId', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized("fuck off")
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const exportDetails = await ExportDetails.find({user: req.params.consumerId}).populate("user", "-__v -password").select("-__v")
        res.status(200).json({exportDetails})

    }catch(error){
        next(error)
    }
})


// get total exports by user
router.get('/byConsumer/total/:consumerId', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized()
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const exportDetails = await ExportDetails.find({user: req.params.consumerId})
        var totalMilkSold = 0
        var totalAmountPaid=0
        exportDetails.forEach(exportDetail=>{
            totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
            totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
        })
        
        res.status(200).json({user: user.name,totalMilkSold, totalAmountPaid})

    }catch(error){
        next(error)
    }
})

// get detail of all exports by user and date
router.get('/byConsumerAndDate/detail/:consumerId/:date', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized()
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const exportDetails = await ExportDetails.find({user: req.params.consumerId, date: date}).populate("user", "-__v -password").select("-__v")
        
        res.status(200).json({exportDetails})

    }catch(error){
        next(error)
    }
})

// get detail of all exports by user and month
router.get('/byConsumerAndMonth/detail/:consumerId/:my', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized()
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        var exportDetails=[]
        const expDetails = await ExportDetails.find({user: req.params.consumerId}).populate("user", "-__v -password").select("-__v")
        expDetails.forEach(exportDetail=>{
            if((new Date(exportDetail.date)).getMonth()===month-1 && (new Date(exportDetail.date)).getFullYear()===year){
                exportDetails.push(exportDetail)
            }
        })
        res.status(200).json({exportDetails})

    }catch(error){
        next(error)
    }
})


// get total of all exports by user and month
router.get('/byConsumerAndMonth/total/:consumerId/:my', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized()
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        const expDetails = await ExportDetails.find({user: req.params.consumerId})
        var totalMilkSold = 0
        var totalAmountPaid=0
        expDetails.forEach(exportDetail=>{
            if((new Date(exportDetail.date)).getMonth()===month-1 && (new Date(exportDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
                totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
            }
        })
        res.status(200).json({user: user.name, monthyear: month+"-"+year, totalMilkSold, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


// get detail of all exports by user and year
router.get('/byConsumerAndYear/detail/:consumerId/:yyyy', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized()
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const year=parseInt(req.params.yyyy)
        var exportDetails=[]
        const expDetails = await ExportDetails.find({user: req.params.consumerId}).populate("user", "-__v -password").select("-__v")
        expDetails.forEach(exportDetail=>{
            if((new Date(exportDetail.date)).getFullYear()===year){
                exportDetails.push(exportDetail)
            }
        })
        res.status(200).json({exportDetails})

    }catch(error){
        next(error)
    }
})


// get total of all exports by user and year
router.get('/byConsumerAndYear/total/:consumerId/:yyyy', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="CONSUMER") throw createError.Unauthorized()
        const user = await User.findById(req.params.consumerId)
        if(!user) throw createError.NotFound("User with given id not found.")
        const year=parseInt(req.params.yyyy)
        const expDetails = await ExportDetails.find({user: req.params.consumerId})
        var totalMilkSold = 0
        var totalAmountPaid=0
        expDetails.forEach(exportDetail=>{
            if((new Date(exportDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
                totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
            }
        })
        res.status(200).json({user: user.name, year: year, totalMilkSold, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


//get detail of all exports by month
router.get('/byMonthYear/detail/:my',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        var exportDetails=[]
        const expDetails = await ExportDetails.find({}).populate("user", "-__v -password").select("-__v")
        expDetails.forEach(exportDetail=>{
            //console.log((new Date(exportDetail.date)).getMonth(), (new Date(exportDetail.date)).getFullYear())
            if((new Date(exportDetail.date)).getMonth()===month-1 && (new Date(exportDetail.date)).getFullYear()===year){
                exportDetails.push(exportDetail)
            }
        })
        res.status(200).json({exportDetails})

    }catch(error){
        console.log(error.message)
        next(error)
    }
})


//get total of all exports by month
router.get('/byMonthYear/total/:my',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        const expDetails = await ExportDetails.find({})
        var totalMilkSold = 0
        var totalAmountPaid=0
        expDetails.forEach(exportDetail=>{
            if((new Date(exportDetail.date)).getMonth()===month-1 && (new Date(exportDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
                totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
            }
        })
        res.status(200).json({monthyear: month+"-"+year, totalMilkSold, totalAmountPaid})

    }catch(error){
        console.log(error.message)
        next(error)
    }
})



// get detils of all exports by year
router.get('/byYear/detail/:yyyy',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const year=parseInt(req.params.yyyy)
        var exportDetails=[]
        const expDetails = await ExportDetails.find({}).populate("user", "-__v -password").select("-__v")
        expDetails.forEach(exportDetail=>{
            //console.log((new Date(exportDetail.date)).getMonth(), (new Date(exportDetail.date)).getFullYear())
            if((new Date(exportDetail.date)).getFullYear()===year){
                exportDetails.push(exportDetail)
            }
        })
        res.status(200).json({exportDetails})

    }catch(error){
        console.log(error.message)
        next(error)
    }
})

// get total of all exports by year
router.get('/byYear/total/:yyyy',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const year=parseInt(req.params.yyyy)
        const expDetails = await ExportDetails.find({})
        var totalMilkSold = 0
        var totalAmountPaid=0
        expDetails.forEach(exportDetail=>{
            //console.log((new Date(exportDetail.date)).getMonth(), (new Date(exportDetail.date)).getFullYear())
            if((new Date(exportDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
                totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
            }
        })
        res.status(200).json({year,totalMilkSold, totalAmountPaid})

    }catch(error){
        console.log(error.message)
        next(error)
    }
})


// add export detail
router.post('/add',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const result = await exportDetailsSchema.validateAsync(req.body)
        const { amountOfMilkSold, amountPaid,date, user} = result
        const newExport = new ExportDetails({
            amountOfMilkSold,
            amountPaid, 
            date,
            user
        })

        const response = await newExport.save()
        res.status(201).json({msg: "Export detail added."})

    }catch(error){
        next(error)
    }
})


// update export detail
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        
        const result = await exportDetailsSchema.validateAsync(req.body)
        const exportDetail = await ExportDetails.findById(req.params.id)
        if(!exportDetail) throw createError.NotFound("Export detail not found")
        const { amountOfMilkSold, amountPaid, date, user} = result
        const newExport = new ExportDetails({
            amountOfMilkSold,
            amountPaid, 
            date, 
            user
        })

        const response = await ExportDetails.findByIdAndUpdate(req.params.id, {$set: newExport}, {new: true})
        res.status(200).json({msg: "Export detail updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete export detail
router.delete('/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const exportDetail = await ExportDetails.findById(req.params.id)
        if(!exportDetail) throw createError.NotFound("Export detail not found")
        const response = await ExportDetails.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Export detail deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router