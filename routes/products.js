const express = require('express')
const router = express.Router()
const createError = require('http-errors')
const { verifyAccessToken } = require('../helpers/check-auth')
const { productSchema} = require('../helpers/validationSchema')


const Product = require('../models/Product')

// get all products
router.get('/all',verifyAccessToken, async (req, res, next)=>{
    try{
        const products = await Product.find({}).select("-__v")
        res.status(200).json({products})
    }catch(error){
        next(error)
    }
})

// get product by id
router.get('/byId/:id',verifyAccessToken, async (req, res, next)=>{
    try{
        const product = await Product.findById(req.params.id).select("-__v")
        res.status(200).json(product)
    }catch(error){
        next(error)
    }
})

// get product by name
router.get('/byName/:name',verifyAccessToken, async (req, res, next)=>{
    try{
        const product = await Product.findOne({name: req.params.name}).select("-__v")
        res.status(200).json(product)
    }catch(error){
        next(error)
    }
})


// add product
router.post('/add', verifyAccessToken, async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to add product.")
        //console.log(req.body)
        const result = await productSchema.validateAsync(req.body)
        const {name, price} = result
        const newCalf = new Product({
            name,
            price
        })
        const savedCalf = await newCalf.save()
        res.status(201).json({msg: "Product added successfully."})

    }catch(error){
        next(error)
    }
})

// update product
router.put('/:id', verifyAccessToken, async (req, res, next)=>{
    
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update product.")
        const result = await productSchema.validateAsync(req.body)
        const {name, price} = result
       
        const product = await Product.findById(req.params.id)
        if(!product) throw createError.NotFound("Product with given id doesn't exists.")
        const newCalf = new Product({
            _id: req.params.id,
            name,
            price
        })
        const response = await Product.findByIdAndUpdate(req.params.id, {$set: newCalf}, {new: true})
        res.status(200).json({msg: "Product updated successfully."})

    }catch(error){
        next(error)
    }
})

// delete product from database
router.delete('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        if(req.payload.role!=="ADMIN") throw createError.Unauthorized("You are not authorized to update product.")
        const product = Product.findById(req.params.id)
        if(!product) return createError.NotFound("Product with given id doesn't exists!")
        const response = await Product.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Product deleted successfully."})
    }catch(error){
        next(error)
    }
})

module.exports = router