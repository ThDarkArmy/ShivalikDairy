const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = mongoose.Schema({
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
        default: "ADMIN",
        type: String,
        required: true,
    },
    isConfirm: {
        type: Boolean,
        default: false
    }
})


// hash password
adminSchema.pre('save', async function(next){
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
adminSchema.methods.isValidPassword = async function(password) {
    try{
        return await bcrypt.compare(password, this.password)
    }catch(error){
        throw error
    }

}

const Admin = mongoose.model("Admin", adminSchema)

module.exports = Admin