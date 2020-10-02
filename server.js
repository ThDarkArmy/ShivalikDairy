const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const {verifyAccessToken } = require('./helpers/check-auth')

// redis
require('./helpers/init_redis')

const app = express()

// dotenv
require('dotenv').config()

// database connection
require('./config/database')


const PORT = process.env.PORT || 3000
// middlewares
app.use(express.static(__dirname))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(morgan('dev'))


app.get('/', verifyAccessToken, (req, res)=>{
    try{
        console.log(req.payload)
        res.status(201).json("This is home page");
    }catch(error){
        next(error)
    }
    
})
 
// routes
const users = require('./routes/users')
const sellers = require('./routes/sellers')
const consumers = require('./routes/consumers')
const calves = require('./routes/calves')
const cows = require('./routes/cows')
const exportDetails = require('./routes/exportDetails')
const importDetails = require('./routes/importDetails')


app.use('/users', users)
app.use('/sellers', sellers)
app.use('/consumers', consumers)
app.use('/calves', calves)
app.use('/cows', cows)
app.use('/export-details',exportDetails)
app.use('/import-details',importDetails)

app.use(async(req, res, next)=>{
    next(createError.NotFound())
})

app.use((err, req, res, next)=>{
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            msg: err.message
        }
    })
})


app.listen(PORT, ()=> console.log("Server is listening on port: "+ PORT))

