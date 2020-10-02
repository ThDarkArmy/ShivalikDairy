const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const Seller = require('../models/Seller')
const {verifyAccessToken} = require('../helpers/check-auth')
const User = require("../models/User")
const ImportDetails = require("../models/ImportDetails")

// get all seller
router.get('/all',verifyAccessToken, async (req, res)=>{
    try{
        const users = await User.find({role:"CONSUMER"}).select("-__v")
        //console.log("consumers",consumers)
        res.status(200).json({users})
    }catch(err){
        res.status(500).json({msg: "Server Error", error: err})
    }
})

// get seller details by id
router.get('/byId/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const user = await User.findById(req.params.id).select("-__v -password")
        const importDetails = await ImportDetails.find({soldTo: req.params.consumerId})
        var totalMilkSold = 0
        var totalAmountPaid=0

        importDetails.forEach(importDetail=>{
            totalAmountPaid = totalAmountPaid + importDetail.amountPaid
            totalMilkSold = totalMilkSold + importDetail.amountOfMilkBought
        })
        
        const {name, email, profilePic, mobile, dateJoined} = user
        const seller = new Seller({
            name,
            email,
            profilePic,
            mobile,
            dateJoined,
            totalAmountOfMilkSold: totalMilkSold,
            totalAmountPaid
        })
        res.status(200).json(seller)
    }catch(errpr){
        next(error)
    }
})


module.exports = router
