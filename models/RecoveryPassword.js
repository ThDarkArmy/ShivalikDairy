const mongoose = require('mongoose')

const recoveryPasswordSchema = mongoose.Schema({
    password: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        lowercase: true,
        required: true
    }
})

const RecoveryPassword = mongoose.model('RecoveryPassword', recoveryPasswordSchema)

module.exports = RecoveryPassword