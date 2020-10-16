const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
       type: String,
       required: true
    },

    price: {
        type: Number,
        default: 45
    },

})

const Product = mongoose.model("Product", productSchema)

module.exports = Product