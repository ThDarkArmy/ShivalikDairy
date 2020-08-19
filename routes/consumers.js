const express = require('express')
const router = express.Router()
const multer = require('multer')
const bcrypt = require('bcryptjs')
const createError = require('http-errors')

const MailSender = require('../utils/SendMail')
const ConfirmationToken = require('../models/ConfirmationToken')
const Consumer = require('../models/Consumer')
const RecoveryPassword = require('../models/RecoveryPassword')
const {loginSchema, authSchema} = require('../helpers/validationSchema')
const {signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken} = require('../helpers/check-auth')
const client = require('../helpers/init_redis')

// stoarge
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'files/consumers/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage})

// get all consumer
router.get('/', async (req, res)=>{
    try{
        const consumers = await Consumer.find({}).select("-__v")
        //console.log("consumers",consumers)
        res.status(200).json({consumers: consumers})
    }catch(err){
        res.status(500).json({msg: "Server Error", error: err})
    }
})

// get consumer by id
router.get('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const consumer = await Consumer.findById(req.params.id).select("-__v -password")
        res.status(200).json(consumer)
    }catch(errpr){
        next(error)
    }
})

// register 
router.post('/register', upload.single('profilePic'), async (req, res, next)=>{
    
    try{
        if(!req.file) throw createError.BadRequest("Profile photo required!")
        const result = await authSchema.validateAsync(req.body)

        const {name, email, mobile, password} = req.body
        let consumer = await Consumer.findOne({email})
        if(consumer) throw createError.Conflict(email+" already registered!")

        consumer = await Consumer.findOne({mobile})
        if(consumer) throw createError.Conflict(mobile+" number already registered!")
        
        const newConsumer = new Consumer({
            name,
            email,
            mobile,
            password,
            profilePic: req.file.path,
            isConfirm: false
        })

        const randomToken = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        new ConfirmationToken({token: randomToken, email: newConsumer.email}).save()
        const url = 'http://localhost:5000/consumers/accountConfirmation/'+randomToken

        const confirmHtml = `Please click the link to confirm email: \n<a href=${url}>${url}<a/>`

        const mailSender = new MailSender(newConsumer.email, "Confirmation Email", confirmHtml)
        const responseMail = mailSender.sendMail()
        const cons = await newConsumer.save()
        res.status(201).json({msg: "Check your email and click confirm to activate your account.", consumer: cons})
        
    }catch(error){
        if(error.isJoi===true) error.status = 422
        //console.log(error)
        next(error)
    }
})

// account confirmation
router.get('/accountConfirmation/:token', async (req, res, next)=>{
    try{
        const confToken = await ConfirmationToken.findOne({token: req.params.token})
        if(!confToken) return res.status(400).json({msg: "Invalid Token!"})
        const consumer = await Consumer.findOne({email: confToken.email})
        const response = await Consumer.findByIdAndUpdate(consumer._id, {$set: {isConfirm: true}}, {new: true})
        await ConfirmationToken.findByIdAndDelete(confToken._id)
        res.status(200).json({msg: "Account Confirmed!"})
    }catch(error){
        next(error)
    }
})


// login
router.post('/login', async (req, res, next)=>{
    try{
        const result = loginSchema.validateAsync(req.body)
        const {mobile, password} = req.body
        const consumer = await Consumer.findOne({mobile})
        if(!consumer) throw createError.NotFound("Consumer with given mobile doesn't exists.")
        if(!consumer.isConfirm) throw createError.NotFound("Account is not confirmed yet!")

        const isMatch = await bcrypt.compare(password, consumer.password)
        if(isMatch){
            const accessToken = await signAccessToken(consumer.id, "Consumer")
            //const refreshToken = await signRefreshToken(consumer.id)
            res.status(200).json({ accessToken})
        }else{
            throw createError.Unauthorized("Username/Password Invalid.")
        }

    }catch(error){
        if(error.isJoi===true) return next(createError.Unauthorized("Username/Password invalid."))
        next(error)
    }
})

// accessToken
router.get('/acccessToken/:refreshToken', async (req, res, next)=>{
    try {
        const { refreshToken } = req.body
        if (!refreshToken) throw createError.BadRequest()
        const userId = await verifyRefreshToken(refreshToken)
  
        const accessToken = await signAccessToken(userId)
        const refToken = await signRefreshToken(userId)
        res.status(201).json({ accessToken: accessToken, refreshToken: refToken })
    }catch (error) {
        next(error)
    }
})


// logout
router.delete('/logout',verifyAccessToken, async (req, res, next)=>{
    try {
        // const { refreshToken, accessToken } = req.body
        // if (!refreshToken) throw createError.BadRequest()
        // const userId = await verifyRefreshToken(refreshToken)
        // client.DEL(userId, (err, val) => {
        //   if (err) {
        //     console.log(err.message)
        //     throw createError.InternalServerError()
        //   }
        //   console.log(val)
        //   res.sendStatus(204)
        // })
        const userId = req.payload.aud
        client.DEL(userId, (err, val)=>{
            if(err){
                console.log(err.message)
                throw createError.InternalServerError()
            }
            //console.log(val)
            res.sendStatus(204)
        })

    }catch(error) {
        next(error)
    }
})


// reset password
router.put('/resetPassword', verifyAccessToken, async (req, res)=>{
    try{
        const password = req.body.password
        const mobile = req.body.mobile
        const consumer = await Consumer.findOne({mobile})
        if(!consumer) throw createError.NotFound("Consumer with given email id doesn't exists.")
        if(!consumer.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        new RecoveryPassword({email: consumer.email, password: password}).save()
        const url = 'http://localhost:5000/consumers/confirmResetPassword/'+consumer.email

        const confirmHtml = `Please click the link to confirm password reset: <a href=${url}>${url}<a/>`

        const mailSender = new MailSender(consumer.email, "Password Reset Email", confirmHtml)
        const responseMail = mailSender.sendMail()
        console.log(responseMail)
        res.status(200).json({msg: "Check your email to confirm password reset!"})
    }catch(error){
        next(error)
    }
})


// confirm reset password
router.get('/confirmResetPassword/:email', async (req, res, next)=>{
    try{
        const recoveryPassword = await RecoveryPassword.findOne({email: req.params.email})
        if(!recoveryPassword) throw createError.NotFound("No recovery password found for given email.")
        const consumer = await Consumer.findOne({email: req.params.email})
        if(!consumer) throw createError.NotFound("Consumer with given email doesn't exists.")
        const salt = await bcrypt.genSalt(8)
        const hashedpassword = await bcrypt.hash(recoveryPassword.password, salt)
        const response = await Consumer.findByIdAndUpdate(consumer._id, {$set: {password: hashedpassword}}, {new: true})
        console.log(response)
        await RecoveryPassword.findByIdAndDelete(recoveryPassword._id)
        res.status(200).json({msg: "Password reset successfully!"})

    }catch(error){
        next(error)
    }
})


// update consumer
router.put('/update/:id', verifyAccessToken, async (req, res, next)=>{
    const {name, email, mobile} = req.body
    try{
        const consumer = await Consumer.findById(req.params.id)
        if(!consumer) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!consumer.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const updatedConsumer = new Consumer({
            _id: consumer._id,
            name,
            email,
            mobile,
            password: consumer.password,
            profilePic: consumer.profilePic,
            isConfirm: true,
            role: consumer.role,
            dateJoined: consumer.dateJoined
        })

        const response = await Consumer.findByIdAndUpdate(req.params.id, {$set: updatedConsumer}, {new: true})
        console.log(response)
        res.status(201).json({msg: "Consumer updated successfully."})

    }catch(error){
        console.log(err)
        next(error)
    }
})


// update profile pic
router.put('/updateProfilePic/:id', verifyAccessToken, upload.single('profilePic'), async (req, res, next)=>{
    try{
        if(!req.file) throw createError.NotFound("Profile picture is required")
        const consumer = await Consumer.findById(req.params.id)
        if(!consumer) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!consumer.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const response = await Consumer.findByIdAndUpdate(req.params.id, {$set: {profilePic: req.file.path}}, {new: true})
        res.status(201).json({msg: "Profile pic updated successfully"})
    }catch(error){
        next(error)
    }
})


// delete consumer
router.delete('/delete/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const consumer = await Consumer.findById(req.params.id)
        if(!consumer) throw createError.NotFound("Cosumer with given id doesn't exists!")
        const response = await Consumer.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Consumer deleted successfully."})
    }catch(error){
        next(error)
    }
})


module.exports = router
