const Joi = require('@hapi/Joi')
Joi.objectId = require('joi-objectid')(Joi)

const authSchema = Joi.object({
    name: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(),
})

const loginSchema = Joi.object({
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    password: Joi.string().min(6).required()
})

const productSchema = Joi.object({
    name: Joi.string().min(3).required(),
    price: Joi.number().min(1).required(),
})

const noticeSchema = Joi.object({
    title: Joi.string().min(3).required(),
    description: Joi.string().min(20).required(),
    
})

const importDetailsSchema = Joi.object({
    amountOfMilkBought: Joi.number().min(1).required(),
    amountPaid: Joi.number().min(1),
    userId: Joi.objectId(),
    date: Joi.date().allow(null)
})

const exportDetailsSchema = Joi.object({
    amountOfMilkSold: Joi.number().min(1).required(),
    amountPaid: Joi.number().min(1),
    userId: Joi.objectId(),
    date: Joi.date().allow(null)
})

const salarySchema = Joi.object({
    amount: Joi.number().min(1000).required(),
    isPaid: Joi.boolean().required(),
    ofMonthAndYear: Joi.string().min(5).required(),
    userId: Joi.objectId()
})

const cowSchema = Joi.object({
    name: Joi.string().min(3).required(),
    age: Joi.number().min(1).required(),
    isProductive: Joi.boolean().required(),
    amountOfMilk: Joi.number().min(1).required(),
    isPregnant: Joi.boolean().required(),
    isHealthy:  Joi.boolean().required(),
    pregnantFrom: Joi.date().allow(null)
})

const calfSchema = Joi.object({
    name: Joi.string().min(3).required(),
    dob: Joi.date().required(),
    isHealthy:  Joi.boolean().required(),
    cowId: Joi.objectId(),
    gender: Joi.string().min(3).required()
})

const expenseSchema = Joi.object({
    medicinalItems: Joi.number().min(0).required(),
    foodItems: Joi.number().min(0).required(),
    others: Joi.number().min(0).required(),
})


module.exports = {
    authSchema,
    loginSchema,
    exportDetailsSchema,
    importDetailsSchema,
    salarySchema,
    cowSchema,
    calfSchema,
    productSchema,
    expenseSchema,
    noticeSchema
}

