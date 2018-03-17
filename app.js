var http = require('http');
var fs = require('fs');
var db = require('./utils/models');
var express = require('express');
var bodyParser = require('body-parser');
var forms = require('./api/forms.js');


var app = express();
app.set('view engine', 'ejs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
var urlencodedParser = bodyParser.urlencoded({ extended: true });


//sign-up users
app.post('/signup',forms.register);

// api for login user
app.post('/login', forms.login);


// api to get the result of user
app.get('/users/:id', function(req, res){
    db.query('select * from users where id = ?',[req.params.id], 
    function (err, results, fields){
        if(err) throw err;
            res.end(JSON.stringify(results));      
    });
});

//update the user profile
app.put('/update', forms.updation);

//change password
app.post('/change-pswrd', forms.change);

//forgot password
app.post('/forgot-pswrd', forms.forgot_pswrd);

app.get('/forgot-pswrd', function(req, res){
    res.render('password');
});

//reset password
app.post('/reset-pswrd', forms.reset_pswrd);

app.listen(3000);
