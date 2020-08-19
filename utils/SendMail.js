const nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
})

class SendMail{
    constructor(to, subject, text){
        this.to = to
        this.subject = subject
        this.text = text
    }

    sendMail(){
        var mailOptions = {
            from : "rajputanjali442@gmail.com",
            to: this.to,
            subject: this.subject,
            html: this.text
        }
        transporter.sendMail(mailOptions, (err, info)=>{
            if(err){
                console.log(err)
                return err
            }
            else{
                console.log("email sent: ", info.response)
                return info
            }
        })
    }
}

// const mail = new SendMail('jaccobrths@gmail.com', 'subject', 'message from nodemailer');
// mail.sendMail();

module.exports = SendMail;