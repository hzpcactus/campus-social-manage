const express = require('express');
const fs = require('fs');
// const io=require('socket.io')(80);
const router = express.Router();
const mysql = require('mysql');
const multiparty = require("multiparty");
const socket = require('../tools/socket');
const connection = mysql.createConnection({     
  host     : 'localhost',       
  user     : 'root',              
  password : '19980605',       
  port: '3306',                   
  database: 'campus-social' 
}); 
 
connection.connect();

var param="bbbbbbb"; 
 
/* GET users listing. */
router.post('/', function(req, res, next) {
  socket(`/friendApply`,`${req.body.personAccount}`,{personApply:req.body.personAccount,msgApply:"连接成功!"});
  // .then((res4)=>{
    res.json({
      status:"0",
      msg:param
    });
  // });
  
  // res.send('respond with a resource');
});

//查询学校列表
router.get('/school', function(req, res, next) {
  connection.query("select * from school",function (err, result) {
    if(err){
      // res.send(err.message);
      res.json({
        status:"1",
        msg:err.message
      });
      return;
    }else{
      // res.send(result);
      res.json({
        status:"0",
        msg:result
      });
    }
  });
  // connection.end();
  // res.send('respond with a resource');
});

//登录
router.post('/login', function(req, res, next) {
  connection.query(`select * from person where person_account='${req.body.personAccount}' and person_password='${req.body.personPassword}'`,function (err, result) {
    if(result.length>0){        //用户可以登录
      res.json({
        status:"0",
        msg:result[0]
      });
    }else{
      res.json({
        status:"1",
        msg:"该账号未注册，请注册"
      });
    }
  });
  // connection.end();
  // res.send('respond with a resource');
});

//查询个人信息
router.post('/search', function(req, res, next) {
  connection.query(`select * from person where person_account='${req.body.personAccount}' and person_password='${req.body.personPassword}'`,function (err, result) {
    if(result.length>0){        //用户可以登录
      res.json({
        status:"0",
        msg:result[0]
      });
    }else{
      res.json({
        status:"1",
        msg:"该用户不存在!"
      });
    }
  });
  // connection.end();
  // res.send('respond with a resource');
});

//修改个人信息
router.post('/update', function(req, res, next) {
  req.body.personPlace=(typeof req.body.personPlace)=='string'?req.body.personPlace:req.body.personPlace.join(",");
  connection.query(`UPDATE person SET 
  person_password = '${req.body.personPassword}' , 
  person_name = '${req.body.personName}' , 
  person_id_card = '${req.body.personIdCard}' , 
  person_sex = '${req.body.personSex}' ,
  person_birthday = '${req.body.personBirthday}' ,
  person_place = '${req.body.personPlace}' ,
  person_picture = '${req.body.personPicture}' ,
  person_signature = '${req.body.personSignature}' ,
  person_school = '${req.body.personSchool}' ,
  person_professional = '${req.body.personProfessional}' ,
  person_grade = '${req.body.personGrade}'
  WHERE person_account = '${req.body.personAccount}' `,
  function (err, result) {
    // console.log(result);
    if(result){        //用户可以登录
      res.json({
        status:"0",
        msg:"修改成功!"
      });
    }else if(err){
      res.json({
        status:"1",
        msg:err
      });
    }else{
      res.json({
        status:"1",
        msg:"修改错误!"
      });
    }
  });
  // connection.end();
  // res.send('respond with a resource');
});

//用户注册
router.post('/registered',function(req,res,next) {
  // console.log(req.body.personAccount);
  req.body.personPlace=(typeof req.body.personPlace)=='string'?req.body.personPlace:req.body.personPlace.join(",");
  connection.query(`select person_account from person where person_account='${req.body.personAccount}'`,function (err, result) {   //查询用户名是否存在
    // console.log(result,result.length);
    if(result.length>0){    //查询结果为数组，判断length
      // res.send(err.message);
      res.json({
        status:"1",
        msg:"用户已存在！"
      });
    }else{           //结果为空数组
      let addsql = 'INSERT INTO person(person_account, person_password, person_name, person_id_card, person_sex, person_birthday, person_place, person_picture, person_signature, person_school, person_professional,person_grade) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
      let addSqlParams = [req.body.personAccount,req.body.personPassword,req.body.personName,req.body.personIdCard, req.body.personSex, req.body.personBirthday, req.body.personPlace, req.body.personPicture, req.body.personSignature, req.body.personSchool, req.body.personProfessional, req.body.personGrade];
      connection.query(addsql,addSqlParams,function (err,result) {
        if(err){
          // res.send(err.message);
          res.json({
            status:"1",
            msg:"注册失败！"+err.message,
          });
          return;
        }else{
          // res.send(result);
          res.json({
            status:"0",
            msg:"注册成功"
          });
        } 
    
      });
    }
  });
  
});

//上传个人头像图片
router.post('/upload/headImage', function(req, res, next) {
  let form = new multiparty.Form();
  // form.uploadDir="./public/images";
  //form.uploadDir="193.9.139.13:8080/cactusImage";
  var path = require('path');
  form.uploadDir=path.resolve(__dirname,'../public/images');
  console.log(form.uploadDir);
  form.keepExtensions=true;   //是否保留后缀
  form.autoFiels=true;       //启用文件事件，并禁用部分文件事件，如果监听文件事件，则默认为true。
  form.parse(req,function(err,fields,files){  //其中fields表示你提交的表单数据对象，files表示你提交的文件对象
    // console.log(req);
    // console.log(fields,files); 
    if(err){
      res.json({
        status:"1",
        msg:"上传失败！"+err
      });
    }else{
      res.json({ 
        status:"0",
        msg:"上传成功！",
        personPicture: "http://localhost:3000"+files.file[0].path.split("public")[1]
      });
    }
  });  
  
});

//删除上传文件
router.post('/delete/headImage', function(req, res, next) {
  // console.log(req.body);
  fs.unlinkSync(req.body.personPicture);
  fs.exists(req.body.personPicture,(exist)=>{
    if(exist){
      res.json({
        status:"1",
        msg:"删除失败！"
      });
    }else{
      res.json({
        status:"0",
        msg:"删除成功！"
      });
    }
  })
});


module.exports = router;
