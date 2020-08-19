const express = require('express')
const router = express.Router()
const multer = require('multer')
const bcrypt = require('bcryptjs')
const createError = require('http-errors')

const MailSender = require('../utils/SendMail')
const ConfirmationToken = require('../models/ConfirmationToken')
const Employee = require('../models/Employee')
const RecoveryPassword = require('../models/RecoveryPassword')
const {loginSchema, authSchema} = require('../helpers/validationSchema')
const {signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken} = require('../helpers/check-auth')
const client = require('../helpers/init_redis')

// stoarge
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'files/employees/')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage})

// get all employee
router.get('/', async (req, res)=>{
    try{
        const employees = await Employee.find({}).select("-__v")
        //console.log("employees",employees)
        res.status(200).json({employees: employees})
    }catch(err){
        res.status(500).json({msg: "Server Error", error: err})
    }
})

// get employee by id
router.get('/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const employee = await Employee.findById(req.params.id).select("-__v -password")
        res.status(200).json(employee)
    }catch(error){
        next(error)
    }
})

// register 
router.post('/register', upload.single('profilePic'), async (req, res, next)=>{
    if(!req.file) throw createError.BadRequest("Profile photo required!")
    
    try{
        const result = await authSchema.validateAsync(req.body)

        const {name, email, mobile, password} = req.body
        let employee = await Employee.findOne({email})
        if(employee) throw createError.Conflict(email+" already registered!")

        employee = await Employee.findOne({mobile})
        if(employee) throw createError.Conflict(mobile+" number already registered!")
        
        const newEmployee = new Employee({
            name,
            email,
            mobile,
            password,
            profilePic: req.file.path,
            isConfirm: false
        })

        const randomToken = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        new ConfirmationToken({token: randomToken, email: newEmployee.email}).save()
        const url = 'http://localhost:5000/employees/accountConfirmation/'+randomToken

        const confirmHtml = `Please click the link to confirm email: \n<a href=${url}>${url}<a/>`

        const mailSender = new MailSender(newEmployee.email, "Confirmation Email", confirmHtml)
        const responseMail = mailSender.sendMail()
        const cons = await newEmployee.save()
        res.status(201).json({msg: "Check your email and click confirm to activate your account.", employee: cons})
        
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
        const employee = await Employee.findOne({email: confToken.email})
        const response = await Employee.findByIdAndUpdate(employee._id, {$set: {isConfirm: true}}, {new: true})
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
        const employee = await Employee.findOne({mobile})
        if(!employee) throw createError.NotFound("Employee with given mobile doesn't exists.")
        if(!employee.isConfirm) throw createError.NotFound("Account is not confirmed yet!")

        const isMatch = await bcrypt.compare(password, employee.password)
        if(isMatch){
            const accessToken = await signAccessToken(employee.id)
            //const refreshToken = await signRefreshToken(employee.id)
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
        const employee = await Employee.findOne({mobile})
        if(!employee) throw createError.NotFound("Employee with given email id doesn't exists.")
        if(!employee.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        new RecoveryPassword({email: employee.email, password: password}).save()
        const url = 'http://localhost:5000/employees/confirmResetPassword/'+employee.email

        const confirmHtml = `Please click the link to confirm password reset: <a href=${url}>${url}<a/>`

        const mailSender = new MailSender(employee.email, "Password Reset Email", confirmHtml)
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
        const employee = await Employee.findOne({email: req.params.email})
        if(!employee) throw createError.NotFound("Employee with given email doesn't exists.")
        const salt = await bcrypt.genSalt(8)
        const hashedpassword = await bcrypt.hash(recoveryPassword.password, salt)
        const response = await Employee.findByIdAndUpdate(employee._id, {$set: {password: hashedpassword}}, {new: true})
        console.log(response)
        await RecoveryPassword.findByIdAndDelete(recoveryPassword._id)
        res.status(200).json({msg: "Password reset successfully!"})

    }catch(error){
        next(error)
    }
})


// update employee
router.put('/update/:id', verifyAccessToken, async (req, res, next)=>{
    const {name, email, mobile} = req.body
    try{
        const employee = await Employee.findById(req.params.id)
        if(!employee) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!employee.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const updatedConsumer = new Employee({
            _id: employee._id,
            name,
            email,
            mobile,
            password: employee.password,
            profilePic: employee.profilePic,
            isConfirm: true,
            role: employee.role,
            dateJoined: employee.dateJoined
        })

        const response = await Employee.findByIdAndUpdate(req.params.id, {$set: updatedConsumer}, {new: true})
        console.log(response)
        res.status(201).json({msg: "Employee updated successfully."})

    }catch(error){
        console.log(err)
        next(error)
    }
})


// update profile pic
router.put('/updateProfilePic/:id', verifyAccessToken, upload.single('profilePic'), async (req, res, next)=>{
    try{
        if(!req.file) throw createError.NotFound("Profile picture is required")
        const employee = await Employee.findById(req.params.id)
        if(!employee) throw createError.NotFound("Cosumer with given id doesn't exists!")
        if(!employee.isConfirm) throw createError.NotFound("Account is not confirmed yet!")
        const response = await Employee.findByIdAndUpdate(req.params.id, {$set: {profilePic: req.file.path}}, {new: true})
        res.status(201).json({msg: "Profile pic updated successfully"})
    }catch(error){
        next(error)
    }
})


// delete employee
router.delete('/delete/:id', verifyAccessToken, async (req, res, next)=>{
    try{
        const employee = await Employee.findById(req.params.id)
        if(!employee) throw createError.NotFound("Cosumer with given id doesn't exists!")
        const response = await Employee.findByIdAndDelete(req.params.id)
        res.status(200).json({msg: "Employee deleted successfully."})
    }catch(error){
        next(error)
    }
})


module.exports = router
