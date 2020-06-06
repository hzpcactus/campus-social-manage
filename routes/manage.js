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
//查询所有人
router.get("/searchPerson",function(req,res,next){
  connection.query(`select * from person`,function(err,result){
     if(result.length>0){
       console.log(result);
       res.json({
         status:"0",
         msg:result
       });
     }else{
       res.json({
         status:"1",
         msg:err
       });
     }
  });
})

//授权为管理员
router.post('/grantPermissions',function(req,res,next){
    connection.query(`UPDATE person SET person_ismanage = 1 WHERE person_account = '${req.body.personAccount}'`,function(err,result){ 
       if(result){
         res.json({
             status:"0",
             msg:"授权成功！"
         });
       }else{
           res.json({
               status:"1",
               msg:err
           });
       }
    });
});

//删除用户
router.post('/delete',function(req,res,next){
   connection.query(`delete from person where person_account='${req.body.personAccount}'`,function(err,result){
      if(err){
        res.json({
            status:"1",
            msg:err
        })
      }else{
          res.json({
              status:"0",
              msg:`删除用户 ${req.body.personAccount}成功！`
          });
      }
   });
});

//计算所在地的人数
router.get('/getAddress',function(req,res,next){
  connection.query(`select person_place from person`,function(err,result){
     if(err){
        res.json({
          status:"1",
          msg:err
        });
     }else{
        let resObj={}; 
        let resArr=[];
        result.forEach(item=>{          
          let region = item.person_place.split(",")[0];
          if(resObj[region]){
            resObj[region]++;
          }else{
            resObj[region]=1;
          }
        });
        for(let [key,value] of Object.entries(resObj)){
          resArr.push({name:key,value:value});
        }
        console.log(resArr);
        res.json({
          status:"0",
          msg:resArr
        });
     }
  });
});

//统计学校学生人数
router.post('/getschool',function(req,res,next){
  console.log(req.body.region);
   connection.query(`SELECT person_school
   FROM school a,person b
   WHERE b.person_school=a.name AND a.place = '${req.body.region}'`,function(err,result){
     if(result){
       let schoolObj={};
       result.forEach(item=>{
         if(schoolObj[item.person_school]){
          schoolObj[item.person_school]++;
         }else{
          schoolObj[item.person_school] = 1;
         }
       });
       res.json({
         status:"0",
         msg:schoolObj
       })
     }else{
       res.json({
         status:"1",
         msg:err
       });
     }
   });
})

//统计在线人数数据
router.get("/getOnlineData",function(req,res,next){
   connection.query(`select * from statistic`,function(err,result){
      if(err){
         res.json({
           status:"1",
           msg:err
         });
      }else{
        res.json({
          status:"0",
          msg:result
        })
      }
   });
})



module.exports = router;
