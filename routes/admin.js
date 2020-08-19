const express = require('express')
const router = express.Router()
const multer = require('multer')
const bcrypt = require('bcryptjs')
const createError = require('http-errors')

const MailSender = require('../utils/SendMail')
const ConfirmationToken = require('../models/ConfirmationToken')
const RecoveryPassword = require('../models/RecoveryPassword')
const {loginSchema, authSchema} = require('../helpers/validationSchema')
const {signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken} = require('../helpers/check-auth')
const client = require('../helpers/init_redis')
const Admin = require('../models/Admin')

// stoarge
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'files/admin/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage})

// get all admin
router.get('/', async (req, res)=>{
    try{
        const admin = await Admin.find({}).select("-__v")
        //console.log("admin",admin)
        res.status(200).json({admin: admin})
    }catch(err){
        res.status(500).json({msg: "Server Error", error: err})
    }
})

// get admin by id
router.get('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const admin = await Admin.findById(req.params.id).select("-__v -password")
        res.status(200).json(admin)
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
        let admin = await Admin.find({})
        if(admin.length>0) throw createError.Conflict("One admin already exists!")
        
        const newAdmin = new Admin({
            name,
            email,
            mobile,
            password,
            profilePic: req.file.path,
            isConfirm: false
        })

        const randomToken = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        new ConfirmationToken({token: randomToken, email: newAdmin.email}).save()
        const url = 'http://localhost:5000/admin/accountConfirmation/'+randomToken

        const confirmHtml = `Please click the link to confirm email: \n<a href=${url}>${url}<a/>`

        const mailSender = new MailSender(newAdmin.email, "Confirmation Email", confirmHtml)
        const responseMail = mailSender.sendMail()
        const cons = await newAdmin.save()
        res.status(201).json({msg: "Check your email and click confirm to activate your account.", admin: cons})
        
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
        if(!confToken) throw createError.BadRequest("Invalid Token!")
        const admin = await Admin.findOne({email: confToken.email})
        const response = await Admin.findByIdAndUpdate(admin.id, {$set: {isConfirm: true}}, {new: true})
        await ConfirmationToken.findByIdAndDelete(confToken.id)
        res.status(200).json({msg: "Account Confirmed!", response})
    }catch(error){
        next(error)
    }
})


// login
router.post('/login', async (req, res, next)=>{
    try{
        const result = await loginSchema.validateAsync(req.body)
        const {mobile, password} = result
        const admin = await Admin.findOne({mobile})
        if(!admin) throw createError.NotFound("Admin with given mobile doesn't exists.")

        if(!admin.isConfirm) throw createError.Unauthorized("Account is not confirmed yet!")

        //console.log("admin: ",admin)

        const isMatch = await bcrypt.compare(password, admin.password)
        if(isMatch){
            const accessToken = await signAccessToken(admin.id, "ADMIN")
            //const refreshToken = await signRefreshToken(admin.id)
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
        const admin = await Admin.findOne({mobile})
        if(!admin) throw createError.NotFound("Admin with given email id doesn't exists.")
        if(!admin.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        new RecoveryPassword({email: admin.email, password: password}).save()
        const url = 'http://localhost:5000/admin/confirmResetPassword/'+admin.email

        const confirmHtml = `Please click the link to confirm password reset: <a href=${url}>${url}<a/>`

        const mailSender = new MailSender(admin.email, "Password Reset Email", confirmHtml)
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
        const admin = await Admin.findOne({email: req.params.email})
        if(!admin) throw createError.NotFound("Admin with given email doesn't exists.")
        const salt = await bcrypt.genSalt(8)
        const hashedpassword = await bcrypt.hash(recoveryPassword.password, salt)
        const response = await Admin.findByIdAndUpdate(admin._id, {$set: {password: hashedpassword}}, {new: true})
        console.log(response)
        await RecoveryPassword.findByIdAndDelete(recoveryPassword._id)
        res.status(200).json({msg: "Password reset successfully!"})

    }catch(error){
        next(error)
    }
})


// update admin
router.put('/update/:id', verifyAccessToken, async (req, res, next)=>{
    const {name, email, mobile} = req.body
    try{
        const admin = await Admin.findById(req.params.id)
        if(!admin) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!admin.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const updatedConsumer = new Admin({
            _id: admin._id,
            name,
            email,
            mobile,
            password: admin.password,
            profilePic: admin.profilePic,
            isConfirm: true,
            role: admin.role,
            dateJoined: admin.dateJoined
        })

        const response = await Admin.findByIdAndUpdate(req.params.id, {$set: updatedConsumer}, {new: true})
        console.log(response)
        res.status(201).json({msg: "Admin updated successfully."})

    }catch(error){
        console.log(err)
        next(error)
    }
})


// update profile pic
router.put('/updateProfilePic/:id', verifyAccessToken, upload.single('profilePic'), async (req, res, next)=>{
    try{
        if(!req.file) throw createError.NotFound("Profile picture is required")
        const admin = await Admin.findById(req.params.id)
        if(!admin) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!admin.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const response = await Admin.findByIdAndUpdate(req.params.id, {$set: {profilePic: req.file.path}}, {new: true})
        res.status(201).json({msg: "Profile pic updated successfully"})
    }catch(error){
        next(error)
    }
})


// delete admin
router.delete('/delete/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const admin = await Admin.findById(req.params.id)
        if(!admin) throw createError.NotFound("Cosumer with given id doesn't exists!")
        const response = await Admin.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Admin deleted successfully."})
    }catch(error){
        next(error)
    }
})


module.exports = router
