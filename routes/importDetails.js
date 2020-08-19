const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const ImportDetails = require('../models/ImportDetails')
const { verifyAccessToken } = require('../helpers/check-auth')
const { importDetailsSchema} = require('../helpers/validationSchema')
const Seller = require('../models/Seller')


// get detail of all exports
router.get('/detail', async (req, res, next)=>{
    try{
        const importDetails = await ImportDetails.find({})
        res.status(200).json({importDetails})
    }catch(error){
        next(error)
    }
})


// get total of all exports
router.get('/total', async (req, res, next)=>{
    try{
        const importDetails = await ImportDetails.find({})
        var totalMilkBought = 0
        var totalAmountPaid=0
        importDetails.forEach(importDetail=>{
            totalAmountPaid = totalAmountPaid + importDetail.amountPaid
            totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
        })
        res.status(200).json({data: "All",totalMilkBought, totalAmountPaid})
    }catch(error){
        next(error)
    }
})


// get export detail by id
router.get('/:id', async (req, res, next)=>{
    try{
        const importDetail = await ImportDetails.findById(req.params.id)
        res.status(200).json(importDetail)

    }catch(error){
        next(error)
    }
})

// get export details by date
router.get('/byDate/detail/:date', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const importDetails = await ImportDetails.find({date : date})
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})

// get total of export by date
router.get('/byDate/total/:date',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const importDetails = await ImportDetails.find({date : date})
        var totalMilkBought = 0
        var totalAmountPaid=0
        importDetails.forEach(importDetail=>{
            totalAmountPaid = totalAmountPaid + importDetail.amountPaid
            totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
        })
        
        res.status(200).json({date,totalMilkBought, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


// get detail of all exports by consumer
router.get('/byConsumer/detail/:consumerId', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized("fuck off")
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const importDetails = await ImportDetails.find({boughtFrom: req.params.consumerId})
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})


// get total exports by consumer
router.get('/byConsumer/total/:consumerId', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const importDetails = await ImportDetails.find({boughtFrom: req.params.consumerId})
        var totalMilkBought = 0
        var totalAmountPaid=0
        importDetails.forEach(importDetail=>{
            totalAmountPaid = totalAmountPaid + importDetail.amountPaid
            totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
        })
        
        res.status(200).json({consumer: consumer.name,totalMilkBought, totalAmountPaid})

    }catch(error){
        next(error)
    }
})

// get detail of all exports by consumer and date
router.get('/byConsumerAndDate/:consumerId/:date', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const importDetails = await ImportDetails.find({boughtFrom: req.params.consumerId, date: date})
        
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})

// get detail of all exports by consumer and month
router.get('/byConsumerAndMonth/detail/:consumerId/:my', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        var importDetails=[]
        const expDetails = await ImportDetails.find({boughtFrom: req.params.consumerId})
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getMonth()===month-1 && (new Date(importDetail.date)).getFullYear()===year){
                importDetails.push(importDetail)
            }
        })
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})


// get total of all exports by consumer and month
router.get('/byConsumerAndMonth/total/:consumerId/:my', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        const expDetails = await ImportDetails.find({boughtFrom: req.params.consumerId})
        var totalMilkBought = 0
        var totalAmountPaid=0
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getMonth()===month-1 && (new Date(importDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + importDetail.amountPaid
                totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
            }
        })
        res.status(200).json({consumer: consumer.name, monthyear: month+"-"+year, totalMilkBought, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


// get detail of all exports by consumer and year
router.get('/byConsumerAndYear/detail/:consumerId/:yyyy', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const year=parseInt(req.params.yyyy)
        var importDetails=[]
        const expDetails = await ImportDetails.find({boughtFrom: req.params.consumerId})
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getFullYear()===year){
                importDetails.push(importDetail)
            }
        })
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})


// get total of all exports by consumer and year
router.get('/byConsumerAndYear/total/:consumerId/:yyyy', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const consumer = await Seller.findById(req.params.consumerId)
        if(!consumer) throw createError.NotFound("Seller with given id not found.")
        const year=parseInt(req.params.yyyy)
        const expDetails = await ImportDetails.find({boughtFrom: req.params.consumerId})
        var totalMilkBought = 0
        var totalAmountPaid=0
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + importDetail.amountPaid
                totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
            }
        })
        res.status(200).json({consumer: consumer.name, year: year, totalMilkBought, totalAmountPaid})

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
        var importDetails=[]
        const expDetails = await ImportDetails.find({})
        expDetails.forEach(importDetail=>{
            //console.log((new Date(importDetail.date)).getMonth(), (new Date(importDetail.date)).getFullYear())
            if((new Date(importDetail.date)).getMonth()===month-1 && (new Date(importDetail.date)).getFullYear()===year){
                importDetails.push(importDetail)
            }
        })
        res.status(200).json({importDetails})

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
        const expDetails = await ImportDetails.find({})
        var totalMilkBought = 0
        var totalAmountPaid=0
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getMonth()===month-1 && (new Date(importDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + importDetail.amountPaid
                totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
            }
        })
        res.status(200).json({monthyear: month+"-"+year, totalMilkBought, totalAmountPaid})

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
        var importDetails=[]
        const expDetails = await ImportDetails.find({})
        expDetails.forEach(importDetail=>{
            //console.log((new Date(importDetail.date)).getMonth(), (new Date(importDetail.date)).getFullYear())
            if((new Date(importDetail.date)).getFullYear()===year){
                importDetails.push(importDetail)
            }
        })
        res.status(200).json({importDetails})

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
        const expDetails = await ImportDetails.find({})
        var totalMilkBought = 0
        var totalAmountPaid=0
        expDetails.forEach(importDetail=>{
            //console.log((new Date(importDetail.date)).getMonth(), (new Date(importDetail.date)).getFullYear())
            if((new Date(importDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + importDetail.amountPaid
                totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
            }
        })
        res.status(200).json({year,totalMilkBought, totalAmountPaid})

    }catch(error){
        console.log(error.message)
        next(error)
    }
})


// add export detail
router.post('/add',verifyAccessToken, async (req, res, next)=>{
    try{
        
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const result = await importDetailsSchema.validateAsync(req.body)
        const { amountOfMilkBought, amountPaid, boughtFrom} = result
        const newImport = new ImportDetails({
            amountOfMilkBought,
            amountPaid, 
            boughtFrom
        })

        console.log("newImport: ", newImport)
        const response = await newImport.save()
        res.status(201).json({msg: "Import detail added."})

    }catch(error){
        next(error)
    }
})


// update export detail
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        
        const result = await importDetailsSchema.validateAsync(req.body)
        const importDetail = await ImportDetails.findById(req.params.id)
        if(!importDetail) throw createError.NotFound("Import detail not found")
        const { amountOfMilkBought, amountPaid, date, boughtFrom} = result
        const newImport = new ImportDetails({
            _id: importDetail.id,
            amountOfMilkBought,
            amountPaid, 
            date, 
            boughtFrom
        })

        const response = await ImportDetails.findByIdAndUpdate(req.params.id, {$set: newImport}, {new: true})
        res.status(200).json({msg: "Import detail updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete export detail
router.delete('/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const importDetail = await ImportDetails.findById(req.params.id)
        if(!importDetail) throw createError.NotFound("Import detail not found")
        const response = await ImportDetails.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Import detail deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router