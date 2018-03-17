var async = require('async');
var response = require('./../utils/response');
var con = require('./../utils/models');
var query = require('./../utils/query');

exports.authUser = function(session_id, user_columns , cb){
    async.waterfall([
      function(cb){
          if(!session_id){
              cb(401, 'request not authorized' );
            }else{
                var sql = 'select u.*, s.* from `users` as `u` join `sessions` as `s` on `u`.id = `s`.user_id where `s`.id = ?';
                query.query(sql, session_id, "row", cb);
            }
        },
        function(logIn, cb){
            if(!logIn){
                cb(401, "login session has expired");
            }else{
                cb(null, logIn);
            }
        }
    ], function (err, result) {
        cb(err, result);
    });
    
};