const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const employeeSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    profilePic: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        default: "EMPLOYEE",
        type: String,
        required: true,
    },
    dateJoined: {
        type: Date,
        default: new Date()
    },
    fixedSalary: {
        type: Number,
    },
    isConfirm: {
        type: Boolean,
        deafult: false
    }
})


// hash password
employeeSchema.pre('save', async function(next){
    try{
        const salt = await bcrypt.genSalt(8)
        const hashedpassword = await bcrypt.hash(this.password, salt)
        this.password = hashedpassword;
        next()
    }catch(error){
        next(error)
    }
})

// compare password
employeeSchema.methods.isValidPassword = async function(password) {
    try{
        return await bcrypt.compare(password, this.password)
    }catch(error){
        throw error
    }

}

const Employee = mongoose.model("Employee", employeeSchema)

module.exports = Employee