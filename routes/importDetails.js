const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const ImportDetails = require('../models/ImportDetails')
const { verifyAccessToken } = require('../helpers/check-auth')
const { importDetailsSchema} = require('../helpers/validationSchema')
const User = require('../models/User')


// get detail of all imports
router.get('/detail', verifyAccessToken, async (req, res, next)=>{
    try{
        const importDetails = await ImportDetails.find({}).populate("user", "-__v -password").select("-__v")
        res.status(200).json({importDetails})
    }catch(error){
        next(error)
    }
})


// get total of all imports
router.get('/total', async (req, res, next)=>{
    try{
        const importDetails = await ImportDetails.find({}).populate("user", "-__v -password").select("-__v")
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


// get import detail by id
router.get('/:id', async (req, res, next)=>{
    try{
        const importDetail = await ImportDetails.findById(req.params.id).populate("user", "-__v -password").select("-__v")
        res.status(200).json(importDetail)

    }catch(error){
        next(error)
    }
})

// get import details by date
router.get('/byDate/detail/:date', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized()
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const importDetails = await ImportDetails.find({date : date}).populate("user", "-__v -password").select("-__v")
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})

// get total of import by date
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


// get detail of all imports by seller
router.get('/bySeller/detail/:sellerId', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized("fuck off")
        const seller = await User.findById(req.params.sellerId).populate("user", "-__v -password").select("-__v")
        if(!seller) throw createError.NotFound("User with given id not found.")
        const importDetails = await ImportDetails.find({user: req.params.sellerId}).populate("user", "-__v -password").select("-__v")
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})


// get total imports by seller
router.get('/bySeller/total/:sellerId', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const seller = await User.findById(req.params.sellerId)
        if(!seller) throw createError.NotFound("User with given id not found.")
        const importDetails = await ImportDetails.find({user: req.params.sellerId})
        var totalMilkBought = 0
        var totalAmountPaid=0
        importDetails.forEach(importDetail=>{
            totalAmountPaid = totalAmountPaid + importDetail.amountPaid
            totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
        })
        
        res.status(200).json({seller: seller.name,totalMilkBought, totalAmountPaid})

    }catch(error){
        next(error)
    }
})

// get detail of all imports by seller and date
router.get('/bySellerAndDate/detail/:sellerId/:date', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const seller = await User.findById(req.params.sellerId)
        if(!seller) throw createError.NotFound("User with given id not found.")
        const date = (new Date(req.params.date)).toLocaleDateString("en-US")
        const importDetails = await ImportDetails.find({user: req.params.sellerId, date: date}).populate("user", "-__v -password").select("-__v")
        
        res.status(200).json({importDetails})

    }catch(error){
        next(error)
    }
})

// get total of all imports by seller and month
router.get('/bySellerAndMonth/total/:sellerId/:my', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const seller = await User.findById(req.params.sellerId)
        if(!seller) throw createError.NotFound("User with given id not found.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        var importDetails=[]
        const expDetails = await ImportDetails.find({user: req.params.sellerId})
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


// get total of all imports by seller and month
router.get('/bySellerAndMonth/total/:sellerId/:my', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const seller = await User.findById(req.params.sellerId)
        if(!seller) throw createError.NotFound("User with given id not found.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        const expDetails = await ImportDetails.find({user: req.params.sellerId})
        var totalMilkBought = 0
        var totalAmountPaid=0
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getMonth()===month-1 && (new Date(importDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + importDetail.amountPaid
                totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
            }
        })
        res.status(200).json({seller: seller.name, monthyear: month+"-"+year, totalMilkBought, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


// get detail of all imports by seller and year
router.get('/bySellerAndYear/detail/:sellerId/:yyyy', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const seller = await User.findById(req.params.sellerId)
        if(!seller) throw createError.NotFound("User with given id not found.")
        const year=parseInt(req.params.yyyy)
        var importDetails=[]
        const expDetails = await ImportDetails.find({user: req.params.sellerId}).populate("user", "-__v -password").select("-__v")
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


// get total of all imports by seller and year
router.get('/bySellerAndYear/total/:sellerId/:yyyy', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN" && req.payload.role!=="SELLER") throw createError.Unauthorized()
        const seller = await User.findById(req.params.sellerId)
        if(!seller) throw createError.NotFound("User with given id not found.")
        const year=parseInt(req.params.yyyy)
        const expDetails = await ImportDetails.find({user: req.params.sellerId})
        var totalMilkBought = 0
        var totalAmountPaid=0
        expDetails.forEach(importDetail=>{
            if((new Date(importDetail.date)).getFullYear()===year){
                totalAmountPaid = totalAmountPaid + importDetail.amountPaid
                totalMilkBought = totalMilkBought + importDetail.amountOfMilkBought
            }
        })
        res.status(200).json({seller: seller.name, year: year, totalMilkBought, totalAmountPaid})

    }catch(error){
        next(error)
    }
})


//get detail of all imports by month
router.get('/byMonthYear/detail/:my',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const ar = req.params.my.split('-')
        const month = parseInt(ar[0])
        const year=parseInt(ar[1])
        var importDetails=[]
        const expDetails = await ImportDetails.find({}).populate("user", "-__v -password").select("-__v")
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


//get total of all imports by month
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



// get details of all imports by year
router.get('/byYear/detail/:yyyy',verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const year=parseInt(req.params.yyyy)
        var importDetails=[]
        const expDetails = await ImportDetails.find({}).populate("user", "-__v -password").select("-__v")
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

// get total of all imports by year
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


// add import detail
router.post('/add',verifyAccessToken, async (req, res, next)=>{
    try{
        
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        const result = await importDetailsSchema.validateAsync(req.body)
        const { amountOfMilkBought,date, amountPaid, userId} = result
        const newImport = new ImportDetails({
            amountOfMilkBought,
            amountPaid, 
            date,
            user: userId
        })

        //console.log("newImport: ", newImport)
        const response = await newImport.save()
        res.status(201).json({msg: "Import detail added."})

    }catch(error){
        next(error)
    }
})


// update import detail
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are unauthorized.")
        
        const result = await importDetailsSchema.validateAsync(req.body)
        const importDetail = await ImportDetails.findById(req.params.id)
        if(!importDetail) throw createError.NotFound("Import detail not found")
        const { amountOfMilkBought, amountPaid, date, userId} = result
        const newImport = new ImportDetails({
            _id: importDetail.id,
            amountOfMilkBought,
            amountPaid, 
            date, 
            user: userId
        })

        const response = await ImportDetails.findByIdAndUpdate(req.params.id, {$set: newImport}, {new: true})
        res.status(200).json({msg: "Import detail updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete import detail
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