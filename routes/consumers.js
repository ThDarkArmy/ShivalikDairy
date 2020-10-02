const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const {verifyAccessToken} = require('../helpers/check-auth')
const User = require("../models/User")
const ExportDetails = require("../models/ExportDetails")

// get all consumer
router.get('/all',verifyAccessToken, async (req, res)=>{
    try{
        const users = await User.find({role:"CONSUMER"}).select("-__v")
        //console.log("consumers",consumers)
        res.status(200).json({users})
    }catch(err){
        res.status(500).json({msg: "Server Error", error: err})
    }
})

// get consumer details by id
router.get('/byId/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const user = await User.findById(req.params.id).select("-__v -password")
        const exportDetails = await ExportDetails.find({soldTo: req.params.consumerId})
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
