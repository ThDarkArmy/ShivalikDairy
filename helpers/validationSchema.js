const Joi = require('@hapi/Joi')
Joi.objectId = require('joi-objectid')(Joi)

const authSchema = Joi.object({
    name: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    password: Joi.string().min(6).required()
})

const loginSchema = Joi.object({
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    password: Joi.string().min(6).required()
})

const importDetailsSchema = Joi.object({
    amountOfMilkBought: Joi.number().min(1).required(),
    amountPaid: Joi.number().min(1),
    boughtFrom: Joi.objectId()
})

const exportDetailsSchema = Joi.object({
    amountOfMilkSold: Joi.number().min(1).required(),
    amountPaid: Joi.number().min(1),
    soldTo: Joi.objectId()
})

const salarySchema = Joi.object({
    amount: Joi.number().min(1000).required(),
    isPaid: Joi.boolean().required(),
    ofMonthYear: Joi.string().min(5).required(),
    paidTo: Joi.objectId()
})


module.exports = {
    authSchema,
    loginSchema,
    exportDetailsSchema,
    importDetailsSchema,
    salarySchema
}

