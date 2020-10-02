const express = require('express')
const router = express.Router()
const multer = require('multer')
const bcrypt = require('bcryptjs')
const createError = require('http-errors')

const MailSender = require('../utils/SendMail')
const ConfirmationToken = require('../models/ConfirmationToken')
const User = require('../models/User')
const RecoveryPassword = require('../models/RecoveryPassword')
const {loginSchema, authSchema} = require('../helpers/validationSchema')
const {signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken} = require('../helpers/check-auth')
const client = require('../helpers/init_redis')

// stoarge
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'files/users/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage})

// get all user
router.get('/', async (req, res)=>{
    try{
        const users = await User.find({}).select("-__v -password")
        //console.log("users",users)
        res.status(200).json({users: users})
    }catch(error){
        next(error)
    }
})

// get users by role
router.get('/role/:role', verifyAccessToken, async (req, res)=>{
    try{
        const users = await User.find({role: req.params.role}).select("-__v -password")
        //console.log("users",users)
        res.status(200).json({users: users})
    }catch(error){
        next(error)
    }
})


// get user by id
router.get('/id', verifyAccessToken, async (req, res, next)=>{
    try{
        const user = await User.findById(req.payload.aud).select("-__v -password")
        res.status(200).json(user)
    }catch(errpr){
        next(error)
    }
})

// register 
router.post('/register', upload.single('profilePic'), async (req, res, next)=>{
    if(!req.file) throw createError.BadRequest("Profile photo required!")
    
    try{
        const result = await authSchema.validateAsync(req.body)

        const {name, email, mobile, password, role} = req.body
        let user = await User.findOne({email})
        
        if(user && user.isConfirm) throw createError.Conflict(email+" already registered!")
        if(user) await User.findByIdAndDelete(user.id)

        user = await User.findOne({mobile})
        if(user) throw createError.Conflict(mobile+" number already registered!")
        
        const newUser = new User({
            name,
            email,
            mobile,
            password,
            role,
            profilePic: req.file.path,
            isConfirm: false
        })

        const randomToken = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        new ConfirmationToken({token: randomToken, email: newUser.email}).save()
        const url = process.env.BASE_URL+'/users/accountConfirmation/'+randomToken

        const confirmHtml = `Please click the link to confirm email: \n<a href=${url}>${url}<a/>`

        const mailSender = new MailSender(newUser.email, "Confirmation Email", confirmHtml)
        const responseMail = mailSender.sendMail()
        //console.log(responseMail)
        const cons = await newUser.save()
        res.status(201).json({msg: "Check your email and click confirm to activate your account."})
        
    }catch(error){
        if(error.isJoi===true) error.status = 422
        console.log(error)
        next(error)
    }
})

// account confirmation
router.get('/accountConfirmation/:token', async (req, res, next)=>{
    try{
        const confToken = await ConfirmationToken.findOne({token: req.params.token})
        if(!confToken) return res.status(400).json({msg: "Invalid Token!"})
        const user = await User.findOne({email: confToken.email})
        const response = await User.findByIdAndUpdate(user._id, {$set: {isConfirm: true}}, {new: true})
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
        const user = await User.findOne({mobile})
        if(!user) throw createError.NotFound("User with given mobile doesn't exists.")
        if(!user.isConfirm) throw createError.NotFound("Account is not confirmed yet!")

        const isMatch = await bcrypt.compare(password, user.password)
        if(isMatch){
            const accessToken = await signAccessToken(user.id, user.role)
            //const refreshToken = await signRefreshToken(user.id)
            res.status(200).json({ accessToken, role: user.role})
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
        const user = await User.findOne({mobile})
        if(!user) throw createError.NotFound("User with given email id doesn't exists.")
        if(!user.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        new RecoveryPassword({email: user.email, password: password}).save()
        const url = 'http://localhost:5000/users/confirmResetPassword/'+user.email

        const confirmHtml = `Please click the link to confirm password reset: <a href=${url}>${url}<a/>`

        const mailSender = new MailSender(user.email, "Password Reset Email", confirmHtml)
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
        const user = await User.findOne({email: req.params.email})
        if(!user) throw createError.NotFound("User with given email doesn't exists.")
        const salt = await bcrypt.genSalt(8)
        const hashedpassword = await bcrypt.hash(recoveryPassword.password, salt)
        const response = await User.findByIdAndUpdate(user._id, {$set: {password: hashedpassword}}, {new: true})
        console.log(response)
        await RecoveryPassword.findByIdAndDelete(recoveryPassword._id)
        res.status(200).json({msg: "Password reset successfully!"})

    }catch(error){
        next(error)
    }
})


// update user
router.put('/update', verifyAccessToken, async (req, res, next)=>{
    const {name, email, mobile, role} = req.body
    try{
        const user = await User.findById(req.payload.aud)
        if(!user) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!user.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const updatedConsumer = new User({
            _id: user._id,
            name,
            email,
            mobile,
            password: user.password,
            profilePic: user.profilePic,
            isConfirm: true,
            role,
            dateJoined: user.dateJoined
        })

        const response = await User.findByIdAndUpdate(req.payload.aud, {$set: updatedConsumer}, {new: true})
        console.log(response)
        res.status(201).json({msg: "User updated successfully."})

    }catch(error){
        console.log(err)
        next(error)
    }
})


// update profile pic
router.put('/updateProfilePic', verifyAccessToken, upload.single('profilePic'), async (req, res, next)=>{
    try{
        if(!req.file) throw createError.NotFound("Profile picture is required")
        const user = await User.findById(req.payload.aud)
        if(!user) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!user.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const response = await User.findByIdAndUpdate(req.payload.aud, {$set: {profilePic: req.file.path}}, {new: true})
        res.status(201).json({msg: "Profile pic updated successfully"})
    }catch(error){
        next(error)
    }
})


// delete user
router.delete('/delete/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user) throw createError.NotFound("Cosumer with given id doesn't exists!")
        const response = await User.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "User deleted successfully."})
    }catch(error){
        next(error)
    }
})


module.exports = router
