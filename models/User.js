const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
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
        default: "",
        type: String,
        required: true,
    },
    dateJoined: {
        type: Date,
        default: new Date()
    }, 
    isConfirm: {
        type: Boolean,
        default: false
    }
})


// hash password
userSchema.pre('save', async function(next){
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
userSchema.methods.isValidPassword = async function(password) {
    try{
        return await bcrypt.compare(password, this.password)
    }catch(error){
        throw error
    }

}


const User = mongoose.model("User", userSchema)

module.exports = User