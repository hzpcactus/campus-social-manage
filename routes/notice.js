const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const db_config = {     
  host     : 'localhost',       
  user     : 'root',              
  password : '19980605',       
  port: '3306',                   
  database: 'campus-social' ,
  timezone: "08:00"
};
var connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('又断开了：', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      console.log('db error执行重连:' + err.message);
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}
handleDisconnect();
//查询系统通知
router.post('/systematicNotification',async function(req, res, next) {
    let personTime; 
    await connection.query(`select person_time from person where person_account='${req.body.personAccount}'`,function (err, result) {
      if(err){
        // res.send(err.message);
        res.json({
          status:"1",
          msg:err.message
        });
        return;
      }else{
        personTime = result[0].person_time;
      }
    });
    await connection.query(`select * from notice where UNIX_TIMESTAMP(notice_time)>UNIX_TIMESTAMP('${personTime}') AND notice_type='${req.body.noticeType}'`,function (err, result) {
      if(err){
        res.json({
          status:"1",
          msg:err.message
        });
        return;
      }else{
        res.json({
          status:"0",
          msg:result
        });
      }
    });
    
});

//发送通知
router.post('/send',function(req,res,next){
  let addsql = 'INSERT INTO notice(notice_type, notice_title, notice_content) VALUES(?,?,?)';
  let addSqlParams = [req.body.noticeType,req.body.title,req.body.content];
  connection.query(addsql,addSqlParams,function(err,result){
    if(err){
      res.json({
        status:"1",
        msg:err
      });
    }else{
      res.json({
        status:"0",
        msg:"新增通知成功！"
      });  
    }
  });
});

//收到的赞列表查询
router.post("/getLike",function(req,res,next){
  let addSql = `SELECT s1.blog_id,s1.blog_sender,s1.blog_time,s1.like_account,s2.blog_content,s2.blog_picture,s2.blog_sender,s3.person_picture
  FROM likes s1,blog s2,person s3
  WHERE s1.blog_sender='${req.body.personAccount}' AND s1.blog_id = s2.blog_id AND s1.like_account = s3.person_account`;
  connection.query(addSql,function(err,result){
    if(err){
      res.json({
        status:"1",
        msg:err
      });
    }else{
      res.json({
        status:"0",
        msg:result
      });
    }
  });
});

//评论动态列表查询
router.post("/getRemark",function(req,res,next){
  let addSql = `SELECT s1.blog_id,s1.blog_sender,s1.remark_time,s1.remark_account,s1.remark_content,s2.blog_content,s2.blog_picture,s2.blog_sender,s3.person_picture
  FROM remark s1,blog s2,person s3
  WHERE s1.blog_sender='${req.body.personAccount}' AND s1.blog_id = s2.blog_id AND s1.remark_account = s3.person_account`;
  connection.query(addSql,function(err,result){
    if(err){
      res.json({
        status:"1",
        msg:err
      });
    }else{
      res.json({
        status:"0",
        msg:result
      });
    }
  });
});

module.exports = router;
