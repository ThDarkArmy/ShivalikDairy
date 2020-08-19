const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const sellerSchema = mongoose.Schema({
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
        default: "SELLER",
        type: String,
        required: true,
    },
    dateJoined: {
        type: String,
        default: (new Date()).toLocaleDateString("en-US")
    }, 
    isConfirm: {
        type: Boolean,
        default: false
    }
})


// hash password
sellerSchema.pre('save', async function(next){
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
sellerSchema.methods.isValidPassword = async function(password) {
    try{
        return await bcrypt.compare(password, this.password)
    }catch(error){
        throw error
    }

}


const Seller = mongoose.model("Seller", sellerSchema)

module.exports = Seller