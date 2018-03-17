var nodemailer = require('nodemailer');
var random_key = require('./../utils/function');

exports.forgotPassword = (to, from, data) =>{
    var nodemailer = require('nodemailer');    

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '',
            pass: ''
        }
    });

    var mailOPtions = {
        from: from.email ? from.email : "support@abc.com",
        to: to.email,
        subject: data.subject,
        html: '<p>Hello '+to.name +',</p>'
    };
    
    mailOPtions.html += "<p>"+data.message+"</p>";
    if(data.url){
        mailOPtions.html += "<div><a href='"+data.url+"'>"+data.url+"</a></div>";
    }

    transporter.sendMail(mailOPtions, (err, info) => {
        if(err)
        console.log(err)
        else
        console.log(info);
    });
}