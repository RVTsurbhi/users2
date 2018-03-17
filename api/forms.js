
var async = require('async');
var con = require('./../utils/models');
var validation = require('./../utils/validation');
var response = require('./../utils/response');
var random_key = require('./../utils/function');
var mailer = require('nodemailer');
var query = require('./../utils/query');
var auth = require('./../utils/middleware');
var nodemailer = require('./../utils/nodemailer');



exports.register = function(req, res){

    var body = {
        name : {
            value: req.body.name,
            required: 1
        },
        email : {
            value: req.body.email || null,
            required: 1,
            is_email: 1

        },
        password : {
            value: req.body.password || null,
            required: 1,
        },
    };
    console.log(body);
    async.waterfall([
        function (cb){
            validation.customValidator(body, cb);
        },
        function(cb){
            var sql = 'select * from users where email_id = ?'
            var param = [body.email.value];
            query.query(sql, param, "row", cb);
        },
        function(row, cb){
            if(row){
            (body.email.value == row.email)
            cb("email already exist", null);
            } else{
                var sql = 'insert into users set email_id=?, password=?, name=?';
                var param = [body.email.value, body.password.value , body.name.value];
                query.query(sql, param, "id", cb);
            }                        
        },
        function(user, cb){
            if(user){
                var session_id = random_key.random_key();
                var sql = 'insert into sessions set id =?, user_id=?'
                cb(null, {
                    session_id: session_id,
                });
                var param = [session_id, user]
                query.query(sql, param, "id", null);
            }else{
                cb("user not found", user);
            }
        }
    ], function (err, result) {
        response.response(err, result, res);
    });
    
};

//login
exports.login = function (req, res){

    var body = {
        email:{
            value: req.body.email,
            required :1
        },
        name : {
            value: req.body.name || null,
            required: req.body.email
        },
        password:{
            value: req.body.password || null,
            required: 1
        },
    };

    async.waterfall([
        function(cb){
            validation.customValidator(body, cb);
        },
        function(cb){
            var sql = 'select * from users where email_id = ?'
            var param = [body.email.value];
            query.query(sql, param, "row", cb);
        },
        function(user, cb){
            var err = null;
            if(user){
                if(body.password.value == user.password){
                    var session_id = random_key.random_key();
                    var sql = 'insert into sessions set id =?, user_id=?'
                    cb(null , {
                        session_id: session_id
                    });
                    var param = [session_id, user.id]
                    query.query(sql, param, "id", null);
                }else{
                    err = "password is wrong";
                    cb(err, user);
                }
            }else{
                err= "email does not exist";
                cb(err, user);
            }
        }

    ], function (err, result) {
        response.response(err, result, res);
    });
 
}   

//update
exports.updation = function(req, res){
    var body = {
        name : {
            value: req.body.name || null,
            required: 1
        },
        session_id: {
            value: req.headers.authorization
        }
    };

    async.waterfall([
        function(cb){
            validation.customValidator(body, cb);
        },
        function(cb){
            console.log(body.session_id.value);
            auth.authUser(body.session_id.value, ["name"], cb);
        },
        function(logIn,cb){
                var sql = 'update `users` set name = ? where id=?'
                var param = [body.name.value, logIn.user_id ]
                query.query(sql, param, "affectedrows", cb);
            
        }
    ], function (err, result) {
        response.response(err, err ? result : {
            message: "Profile updated"
        }, res);
    });

};

//change-pswrd

exports.change = function(req, res){
    var body = {
        password:{
            value : req.body.password,
            required: 1,
        },
        newpassword:{
            value: req.body.newpassword,
            required: 1,  
        },
        session_id: {
            value: req.headers.authorization
        }
    };

    async.waterfall([
        function(cb){
            validation.customValidator( body,cb);
        },
        function(cb){
            auth.authUser(body.session_id.value, ["email", "password"], cb);
        },
        function(logIn, cb){
            if(body.password.value != logIn.password){
                cb("incorrect password", null);
            }else if(body.password.value == body.newpassword.value){
                cb("it seems your new password matches the old password", null);
            }else{
                var sql = 'update users set password =? where id =? and password =?'
                var param = [body.newpassword.value, logIn.user_id, body.password.value]
                query.query(sql, param, "affectedrows", cb);
            }
        }   
    ],function (err, result) {
        response.response(err, err ? result:{
        message: "password updated"}, res);
    });

};


//forgot-pswrd

exports.forgot_pswrd = function(req, res){

    var body ={
        email: {
            value: req.body.email,
            required: 1
        }
    };
    async.waterfall([
        function(cb){
            validation.customValidator( body,cb);
        },
        function(cb){
            var sql = 'select * from users where email_id = ?'
            var param = [body.email.value]
            query.query(sql, param, "row", cb);
        },
        function(users, cb){
            if(!users){
                cb("email does not exist", null);
            }else{
                var token = random_key.random_key();

                var sql = 'update users set reset_password_token=? where email_id = ?'
                var param = [token, users.email]
                query.query(sql, param, "affectedrows", cb);

                var url = "http://localhost:3000/forgot-pswrd?token="
                
                nodemailer.forgotPassword({email: users.email_id, name: users.name},{},
                    {
                    subject: "Forgot Password?",
                    message : "To reset your password, click the link here.",
                    url : "http://localhost:3000/forgot-pswrd?token=" + token             
                                                                       
                })
            }
        }
    ],function (err, result) {
        response.response(err, result, res);
    });
   
}

//reset-password

exports.reset_pswrd = function(req, res){
    var body ={
    
        password: {
            value: req.body.password,
            required:1
        },
        token:{
            value: req.body.token,
            required: 1
        }
    };
    async.waterfall([
        function(cb){
                validation.customValidator( body,cb);
        },
        function(cb){
            var sql = 'select * from users where reset_password_token=?'
            var param = [body.token.value]
            query.query(sql, param,"row", cb)
        },
        function(user, cb){
            if(!user){
                cb("not found", null);
            }else{
                var sql = 'update users set password = ? ,reset_password_token = ?'
                var param = [body.password.value, user.token]
                query.query(sql, param, "affectedrows", cb)

                nodemailer.forgotPassword({email: user.email_id, name: user.name},{}, {
                    subject: "Password Updated",
                    message: "password  successfully updated."
                });          
            }
        }
    ],function (err, result) {
        response.response(err, result, res);
    });
}

