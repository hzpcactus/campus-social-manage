var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const connection = mysql.createConnection({     
  host     : 'localhost',       
  user     : 'root',              
  password : '19980605',       
  port: '3306',                   
  database: 'campus-social' ,
  timezone: "08:00"
}); 
 
connection.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
  connection.query(`UPDATE person SET person_time = now() WHERE person_account = '${req.body.personAccount}'`,function(err,result){

  });
  // res.render('index', { title: 'Express' });
});

module.exports = router;
