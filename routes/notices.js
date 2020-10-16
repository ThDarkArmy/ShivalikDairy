const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')
const { noticeSchema} = require('../helpers/validationSchema')

const Notice = require('../models/Notice')


// get all notices
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const notices = await Notice.find({}).select("-__v")
        res.status(200).json({notices})
    }catch(error){
        next(error)
    }
})


// get notice by id
router.get('/byId/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const notice = await Notice.findById(req.params.id).select("-__v")
        res.status(200).json(notice)
    }catch(error){
        next(error)
    }
})


// get notice by title
router.get('/by-title/:title',verifyAccessToken, async (req, res, next)=>{
    try{
        const notices = await Notice.find({title: req.params.title}).select("-__v")
        res.status(200).json({notices})
    }catch(error){
        next(error)
    }
})


// add notice
router.post('/add', verifyAccessToken, async (req, res, next)=>{
    
    try{
        
        const result = await noticeSchema.validateAsync(req.body)
        const {title, description} = result
        
        const newNotice = new Notice({
            title, description
        })

        const savedNotice = await newNotice.save()
        res.status(201).json({msg: "Notice added successfully."})

    }catch(error){
        next(error)
    }
})

// update notice
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        const result = await noticeSchema.validateAsync(req.body)
       
        const notice = await Notice.findById(req.params.id)
        if(!notice) throw createError.NotFound("Notice with given id doesn't exists.")
        const {title, description} = result
        
        const newNotice = new Notice({
            title, description
        })
        const response = await Notice.findByIdAndUpdate(req.params.id, {$set: newNotice}, {new: true})
        res.status(200).json({msg: "Notice updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete notice from database
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        
        const notice = await Notice.findById(req.params.id)
        if(!notice) return createError.NotFound("Notice with given id doesn't exists!")
        const response = await Notice.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Notice deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router