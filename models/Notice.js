const mongoose = require('mongoose')

const noticeSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: (new Date()).toDateString()
    }
    
})

const Notice = mongoose.model("Notice", noticeSchema)

module.exports = Notice