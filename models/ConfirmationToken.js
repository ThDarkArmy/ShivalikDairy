const mongoose = require('mongoose')

const confirmationTokenSchema = mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true,
        lowercase: true
    }
})

const ConfirmationToken = mongoose.model('ConfirmationToken', confirmationTokenSchema)

module.exports = ConfirmationToken