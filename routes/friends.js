const express = require('express');
const fs = require('fs');
const router = express.Router();
const socket = require('../tools/socket1');
const mysql = require('mysql');
const multiparty = require("multiparty")
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
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

/* 查询好友列表 */
router.post('/search', function(req, res, next) {
  var personFriends;
  new Promise(function(resolve,reject){
    connection.query(`select friend_list from friends where person_id='${req.body.personAccount}'`,function(err,result){
      if(result.length>0){
        personFriends=result[0].friend_list;
        resolve(personFriends);
      }
    })
  }).then(personFriends=>{
      console.log(personFriends);
      connection.query(`
        SELECT person_account,person_signature,person_picture 
        FROM person 
        WHERE person_account IN (${personFriends})
      `,function(err,result){
        // console.log(result,3);
        if(result.length>0){
          res.json({
            status:"0",
            msg: result
          });
        }else{
          res.json({
            status:"1",
            msg:err
          });
        }
      });
  });
  // console.log(sql,2);
  
});

/* 添加好友的好友列表 */
router.post('/addSearch', function(req, res, next) {
  var personFriends,friendApply;
  new Promise(function(resolve,reject){
    connection.query(`select * from friends where person_id='${req.body.personAccount}'`,function(err,result){
      // console.log(result);
      if(result.length>0){
        resolve(result[0]);
      }else{
        connection.query(`INSERT INTO friends(person_id, friend_list, friend_apply, friend_accept) VALUES(?,?,?,?)`,[req.body.personAccount,null,null,null],function(err,result){
          resolve({
             person_id:req.body.personAccount,
             friend_list:null,
             friend_apply:null,
             friend_accept:null
          });
        });
      }
    })
  }).then(res1=>{
    // console.log(res1,4);
      personFriends=res1.friend_list==null?'':res1.friend_list;
      friendApply=res1.friend_apply==null?'':res1.friend_apply;
      let sql1=res1.friend_list==null?
      `SELECT person_account,person_signature,person_picture    
      FROM person 
      WHERE person_account<>'${req.body.personAccount}'`
      :
      `SELECT person_account,person_signature,person_picture 
        FROM person 
        WHERE person_account NOT IN (${personFriends}) and person_account<>'${req.body.personAccount}'`
      // console.log(personFriends,5);
      connection.query(sql1,function(err,result){
        // console.log(result,3);
        // console.log(friendApply);
        if(result.length>0){
          for(let i=0;i<result.length;i++){
            if(friendApply.includes(result[i].person_account)){
              result[i].applying=true;
            }else{
              result[i].applying=false;
            }
          }
          res.json({
            status:"0",
            msg: result
          });
        }else{
          res.json({
            status:"1",
            msg:err
          });
        }
      });
  });
  // console.log(sql,2);
  
});



/* 添加好友 */
router.post("/add",(req,res,next)=>{
  new Promise(function(resolve,reject){
    connection.query(`select friend_apply from friends where person_id='${req.body.personAccount}'`,function(err,result){
      // console.log(result);
      if(result.length>0){
        resolve(result[0]);
      }
    });
   }).then(res1=>{
      console.log(res1);
      let friendApply=res1.friend_apply==null?[]:res1.friend_apply.split(",");
      friendApply.push(req.body.personFriend);
      friendApply=friendApply.join(",");
      // console.log(friendApply);
      connection.query(`UPDATE friends SET friend_apply = "${friendApply}" WHERE person_id = '${req.body.personAccount}' `,function(err,result){ 
        // console.log(result,6);
         if(result){
          //  console.log(77777777777);
          //  return new Promise((resolve,reject)=>{resolve(result)});
         }
      });
   });
  new Promise(function(resolve,reject){
      connection.query(`select friend_accept from friends where person_id=${req.body.personFriend}`,function(err,result){
        // console.log(result,err,4); 
        // console.log("进来了",8);
        if(result.length>0){
          // console.log(result,12);
          resolve(result[0]);
        }else{
          console.log(101010101011001100);
          connection.query(`INSERT INTO friends(person_id, friend_list, friend_apply, friend_accept) VALUES(?,?,?,?)`,[req.body.personFriend.substring(1,req.body.personFriend.length-1),null,null,null],function(err,result){
            // console.log(result,11);
            resolve({friend_accept:null});
          });
        }
      });
   }).then(res3=>{
    //  console.log(res3,10);
      let friendAccept=res3.friend_accept==undefined||null?[]:res3.friend_accept.split(",");
      friendAccept.push(`'${req.body.personAccount}'`);
      friendAccept=friendAccept.join(",");   
      // console.log(friendAccept,12); 
      connection.query(`UPDATE friends SET friend_accept = "${friendAccept}" WHERE person_id = '${req.body.personFriend.substring(1,req.body.personFriend.length-1)}'`,function(err,result){
        if(result){
          // socket(io,`/${req.body.personFriend.substring(1,req.body.personFriend.length-1)}`,'friendApply',{personApply:req.body.personAccount,msgApply:"同意一下呗!"}) 
          // .then(()=>{
            res.json({
              status:"0",
              msg:"已发送请求"
            });
          // });
          
          // socket(`${req.body.personFriend.substring(1,req.body.personFriend.length-1)}`,`${req.body.personFriend.substring(1,req.body.personFriend.length-1)}`,{personApply:req.body.personAccount,msgApply:"同意一下呗!"});
          // io.of(`/${req.body.personFriend.substring(1,req.body.personFriend.length-1)}`).on('connection',function(socket){
          //    socket.emit('friendApply',{type:'friendApply',personApply:req.body.personAccount});
          // });
          
        }else{
          res.json({
            status:"1",
            msg:err
          });
        }
      });
   }).catch(err=>{
     console.log(err,9);
   });
});

//好友申请回馈
router.post("/friendsApply",async function(req,res,next){
  await updateSpliceFriend(req.body.to_person_id,"friend_accept","friends","person_id",req.body.from_person_id);
  await updateSpliceFriend(req.body.from_person_id,"friend_apply","friends","person_id",req.body.to_person_id);
  if(req.body.isYN=='Y'){      //同意添加
    //同时更新双方好友列表
    await updatePushFriend(req.body.from_person_id,"friend_list","friends","person_id",req.body.to_person_id,res);
    await updatePushFriend(req.body.to_person_id,"friend_list","friends","person_id",req.body.from_person_id,res);  
    res.json({
      status:"0",
      msg:"已同意"
    });
  }else{
    res.json({
      status:"0",
      msg:"已拒绝"
    });
  }
});

//删除好友
router.post("/deleteFriend",async function(req,res,next){
  await updateSpliceFriend(req.body.personAccount,"friend_list","friends","person_id",req.body.deleteFriend);
  await updateSpliceFriend(req.body.deleteFriend,"friend_list","friends","person_id",req.body.personAccount); 
  res.json({
    status:"0",
    msg:"删除成功！"
  });
});

function updateSpliceFriend(reqItem,selectItem,database,item,spliceItem){
  let selectItemSplit=[];
   return new Promise(function(resolve,reject){
      connection.query(`select ${selectItem} from ${database} where ${item}='${reqItem}'`,function(err,result){
        if(result.length>0){
           selectItemSplit=result[0][selectItem].split(",");
           selectItemSplit.splice(selectItemSplit.findIndex((value,index,arr)=>{
              return value ==`'${spliceItem}'`;
           }),1);
           if(selectItemSplit.length>0){
             resolve(selectItemSplit.join(","));
           }else{
             resolve(null);
           }
        }
      }); 
    }).then(res1=>{
      if(res1===null){
        connection.query(`UPDATE ${database} SET ${selectItem} = ${res1} WHERE ${item} = '${reqItem}'`,function(err,result){
      
        });
      }else{
        connection.query(`UPDATE ${database} SET ${selectItem} = "${res1}" WHERE ${item} = '${reqItem}'`,function(err,result){
      
        });
      }
      
    });
}

function updatePushFriend(reqItem,selectItem,database,item,pushItem,res){
  let selectItemSplit=[];
   return new Promise(function(resolve,reject){
      connection.query(`select ${selectItem} from ${database} where ${item}='${reqItem}'`,function(err,result){
        if(result.length>0){
           selectItemSplit=result[0][selectItem].split(",");
           selectItemSplit.push(`'${pushItem}'`);
           if(selectItemSplit.length>0){
             resolve(selectItemSplit.join(","));
           }else{
             resolve(null);
           }
        }
      }); 
    }).then(res1=>{
      if(res1===null){
        connection.query(`UPDATE ${database} SET ${selectItem} = ${res1} WHERE ${item} = '${reqItem}'`,function(err,result){
       
        });
      }else{
        connection.query(`UPDATE ${database} SET ${selectItem} = "${res1}" WHERE ${item} = '${reqItem}'`,function(err,result){
       
        });
      }
      
    });
}

function addFriend(res){
  let addFriend=res.friend_list==null?[]:res.friend_list.split(",");
  addFriend.push(req.body.personFriend);
  // console.log(req.body.personFriend);
  addFriend=addFriend.join(",");
  // console.log(addFriend);
  connection.query(`UPDATE friends SET friend_list = "${addFriend}" WHERE person_id = '${req.body.personAccount}' `,function(err,result){
    if(result){
       res.json({
         status:"0",
         msg:"添加成功！"
       });
    }else{
       res.json({
         status:"1",
         msg:err
       });
    }
    console.log(result);
  });  
}

module.exports = router;
