const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const {verifyAccessToken} = require('../helpers/check-auth')
const User = require("../models/User")
const ExportDetails = require("../models/ExportDetails")
const Product = require("../models/Product")


// get all consumer
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const users = await User.find({role:"CONSUMER"}).select("-__v")
        //console.log("consumers",consumers)
        res.status(200).json({users})
    }catch(error){
        next(error)
    }
})

// get all defaulters
router.get('/defaulters', verifyAccessToken, async (req, res, next)=>{
    try{
        const users = await User.find({role:"CONSUMER"}).select("-__v -password")
        const milk = await Product.findOne({name: "milk"})
        const price = milk.price
        let defaulters = []
        for(i=0;i<users.length;i++){
            const exportDetails = await ExportDetails.find({user: users[i].id})
        
            var totalMilkSold = 0
            var totalAmountPaid=0

            exportDetails.forEach(exportDetail=>{
                totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
                totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
            })

            var left = totalMilkSold * price - totalAmountPaid
            if(left>1000){
                defaulters.push(users[i])
            }
            console.log("left", left)
        }
        return res.status(200).json({users: defaulters})

    }catch(error){
        next(error)
    }
})

// get consumer details by id
router.get('/byId/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const user = await User.findById(req.params.id).select("-__v -password")
        const exportDetails = await ExportDetails.find({user: req.params.id})
    
        var totalMilkSold = 0
        var totalAmountPaid=0
        exportDetails.forEach(exportDetail=>{
            totalAmountPaid = totalAmountPaid + exportDetail.amountPaid
            totalMilkSold = totalMilkSold + exportDetail.amountOfMilkSold
        })
        const {name, email, profilePic, mobile, dateJoined, _id} = user
        const consumer = {
            _id,
            name,
            email,
            profilePic,
            mobile,
            dateJoined,
            totalAmountOfMilkBought: totalMilkSold,
            totalAmountPaid
        }
    
        res.status(200).json(consumer)
    }catch(errpr){
        next(error)
    }
})


module.exports = router
