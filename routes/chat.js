var express = require('express');
var router = express.Router();
const fs = require('fs');
const async = require('async');
const multiparty = require("multiparty");
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

//查找列表未读信息
router.post('/searchUnread',function(req,res,next){
    let unReadObj={};
    connection.query(`select friend_list from friends where person_id='${req.body.personAccount}'`,function(err,result){
      if(err){
        res.json({
            status:"1",
            msg:err
        });
      }else{
        async.map(result.length && result[0].friend_list ? result[0].friend_list.replace(/'/g,"").split(",") : [],function(item,callback){
           connection.query(`SELECT COUNT(*) FROM chat where from_person_id = '${item}' and to_person_id = '${req.body.personAccount}' and status = '0'`,function(err1,result1){
              if(err1){
                res.json({
                    status:"1",
                    msg:err1
                });
              }else{
                // console.log(result1);
                unReadObj[item] = result1[0]['COUNT(*)'];
              }
              callback(null);
           });
        },function(err2,result2){
          if(err2){
            res.json({
              status:"1",
              msg:err2
            });
          }else{
            res.json({
              status:"0",
              msg:unReadObj
            });
          }
        });  
      }
    })
});

//更新未读（未读变已读）
router.post("/updateUnread",function(req,res,next){
   connection.query(`UPDATE chat SET status = 1 WHERE from_person_id = '${req.body.toChatPerson}' and to_person_id = '${req.body.personAccount}'`,function(err,result){
      if(err){

      }else{

      }
   });
}) 

//显示聊天记录
router.post("/chatList",function(req,res,next){
   connection.query(`SELECT * FROM chat where from_person_id = '${req.body.fromPersonId}' and to_person_id = '${req.body.personAccount}'`,function(err,result){
      if(err){
         res.json({
           status:"1",
           msg:err
         });
      }else{
        // console.log(result);
         connection.query(`SELECT * FROM chat where from_person_id = '${req.body.personAccount}' and to_person_id = '${req.body.fromPersonId}'`,function(err1,result1){
           if(err1){
             res.json({
               status:"1",
               msg:err1
             });
           }else{
             result1 = result1.concat(result);
             result1.sort(function(a,b){
                return new Date(a.send_time)-new Date(b.send_time);
             })
             res.json({
               status:"0",
               msg:result1
             });
           }
         });
      }
   });
});

//上传聊天图片
router.post('/upload/chatImage',function(req, res, next) {
  let form = new multiparty.Form();
  // form.uploadDir="./public/images";
  //form.uploadDir="193.9.139.13:8080/cactusImage";
  var path = require('path');
  form.uploadDir=path.resolve(__dirname,`../public/images/chat`);
  // console.log(form.uploadDir);
  form.keepExtensions=true;   //是否保留后缀
  // form.autoFiels=true;       //启用文件事件，并禁用部分文件事件，如果监听文件事件，则默认为true。
  form.parse(req);
  form.on('field', (name, value) => { // 接收到数据参数时，触发field事件
    console.log(name, value)
  })
  form.on('file', (name, file, ...rest) => { // 接收到文件参数时，触发file事件
    //判断是否为空对象
    if(JSON.stringify(file) !== '{}'){
      res.json({ 
        status:"0",
        msg:"上传成功！",
        personPicture: "http://localhost:3000"+file.path.split("public")[1].replace(/\\/g,"/")
      });
    }else{
      res.json({ 
        status:"1",
        msg:"图片上传异常！请联系开发者",
      });
    }
    
  })
  form.on('close', () => {  // 表单数据解析完成，触发close事件
    console.log('表单数据解析完成')
  })
  // form.parse(req,function(err,fields,files){  //其中fields表示你提交的表单数据对象，files表示你提交的文件对象
  //   // console.log(req);
  //   // console.log(fields,files); 
  //   if(err){
  //     res.json({
  //       status:"1",
  //       msg:"上传失败！"+err
  //     });
  //   }else{
  //     console.log(files);
  //     let urlPath = files.file[0].path.split("public")[1].replace(/\\/g,"/");
  //     console.log(urlPath);
  //     res.json({ 
  //       status:"0",
  //       msg:"上传成功！",
  //       personPicture: "http://localhost:3000"+urlPath
  //     });
  //   }
  // });  
  
});

//上传聊天文件
router.post('/upload/chatfile',function(req, res, next) {
  let form = new multiparty.Form();
  // form.uploadDir="./public/images";
  //form.uploadDir="193.9.139.13:8080/cactusImage";
  var path = require('path');
  form.uploadDir=path.resolve(__dirname,`../public/chatFiles`);
  // console.log(form.uploadDir);
  form.keepExtensions=true;   //是否保留后缀
  // form.autoFiels=true;       //启用文件事件，并禁用部分文件事件，如果监听文件事件，则默认为true。
  form.parse(req);
  form.on('field', (name, value) => { // 接收到数据参数时，触发field事件
    console.log(name, value)
  })
  form.on('file', (name, file, ...rest) => { // 接收到文件参数时，触发file事件
    //判断是否为空对象
    if(JSON.stringify(file) !== '{}'){
      res.json({ 
        status:"0",
        msg:"上传成功！",
        fileUrl: "http://localhost:3000"+file.path.split("public")[1].replace(/\\/g,"/")
      });
    }else{
      res.json({ 
        status:"1",
        msg:"文件上传异常！请联系开发者",
      });
    }
    
  })
  form.on('close', () => {  // 表单数据解析完成，触发close事件
    console.log('表单数据解析完成')
  })
  // form.parse(req,function(err,fields,files){  //其中fields表示你提交的表单数据对象，files表示你提交的文件对象
  //   // console.log(req);
  //   // console.log(fields,files); 
  //   if(err){
  //     res.json({
  //       status:"1",
  //       msg:"上传失败！"+err
  //     });
  //   }else{
  //     console.log(files);
  //     let urlPath = files.file[0].path.split("public")[1].replace(/\\/g,"/");
  //     console.log(urlPath);
  //     res.json({ 
  //       status:"0",
  //       msg:"上传成功！",
  //       fileUrl: "http://localhost:3000"+urlPath
  //     });
  //   }
  // });  
  
});

//收藏聊天记录
router.post("/toCollection",function(req,res,next){
   if(!req.body.collectionFromGroupName){
     req.body.collectionFromGroupName = null;
   };
   let addsql = `INSERT INTO collection(collection_person_id,collection_content,collection_from_person_id,collection_from_group_name,collection_time) VALUES('${req.body.personAccount}','${req.body.collectionContent}','${req.body.fromPersonId}','${req.body.collectionFromGroupName}','${req.body.sendTime}')`;
   connection.query(addsql,function(err,result){
      if(err){
        res.json({
          status:"1",
          msg:err
        });
      }else{
        res.json({
          status:"0",
          msg:"已收藏"
        });
      }
   });
});

//获取收藏列表
router.post("/getCollection",function(req,res,next){
   connection.query(`select * from collection where collection_person_id='${req.body.personAccount}'`,function(err,result){
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

//删除收藏内容
router.post("/delCollection",function(req,res,next){
   connection.query(`delete from collection where collection_from_person_id='${req.body.collection_from_person_id}' and collection_time='${req.body.collection_time}' and collection_person_id='${req.body.collection_person_id}'`,function(err,result){
     if(err){
       res.json({
         status:"1",
         msg:err
       });
     }else{
       res.json({
         status:"0",
         msg:"删除成功!"
       });
     }
   });

});

//新增文件信息
router.post("/saveFile",function(req,res,next){
  console.log(222, req.body);
  let fileType = req.body.fileUrl.split(".");
  console.log(req.body.fileFromPersonPicture,111111);
  let addsql = `INSERT INTO file(file_from_person_id,file_from_person_picture,file_person_id,from_type,file_name,file_size,file_url,file_type) VALUES('${req.body.fileFromPersonId}','${req.body.fileFromPersonPicture.replace(/\\/g,"/")}','${req.body.filePersonId}','${req.body.fromType}','${req.body.fileName}','${req.body.fileSize}','${req.body.fileUrl}','${fileType[fileType.length-1]}')`;
  connection.query(addsql,function(err,result){
     if(err){
        res.json({
          status:"1",
          msg:err
        });
     }else{
       res.json({
         status:"0",
         msg:'success'
       });
     }
   });
});

//新增群文件信息
router.post("/saveGroupFile",function(req,res,next){
  let fileType = req.body.fileUrl.split(".");
  console.log(req.body.fileFromPersonPicture,111111);
  let addsql = `INSERT INTO file(file_from_person_id,file_from_person_picture,file_group_id,from_type,file_name,file_size,file_url,file_type) VALUES('${req.body.fileFromPersonId}','${req.body.fileFromPersonPicture.replace(/\\/g,"/")}','${req.body.fileGroupId}','${req.body.fromType}','${req.body.fileName}','${req.body.fileSize}','${req.body.fileUrl}','${fileType[fileType.length-1]}')`;
  connection.query(addsql,function(err,result){
     if(err){
        res.json({
          status:"1",
          msg:err
        });
     }else{
       res.json({
         status:"0",
         msg:'success'
       });
     }
   });
});

//显示文件列表
router.get("/getFileList",function(req,res,next){
  connection.query(`select * from file where FIND_IN_SET('${req.query.personAccount}',file_person_id) or FIND_IN_SET('${req.query.personAccount}',file_from_person_id)`,function(err,result){
    console.log(result);
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

//创建群
router.post("/addGroup",function(req,res,next){
  connection.query(`SELECT REPLACE(UUID(), '-', '')`,function(err,result){ 
    let addsql=`INSERT INTO chatgroup(group_id,group_name,group_person,group_creater,group_time) VALUES('${Object.values(result[0])[0]}','${req.body.groupName}','${req.body.groupPerson}','${req.body.groupCreater}',NOW())`; 
    connection.query(addsql,function(err1,result1){
       if(err1){
         res.json({
           status:"1",
           msg:err1
         });
       }else{
         res.json({
           status:"0",
           msg:"创建成功！"
         });
       }
    });
  });
  
});

//获取群列表
router.get("/getGroup",function(req,res,next){
  // console.log(req.query);
   connection.query(`select * from chatgroup where FIND_IN_SET("'${req.query.personAccount}'",group_person) `,function(err,result){
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

//获取群成员列表
router.get("/getGroupPersonList",function(req,res,next){
   console.log(req.query.groupId);
   connection.query(`select group_person from chatgroup where group_id = '${req.query.groupId}'`,function(err,result){
      if(err){
        res.json({
          status:"1",
          msg:err
        });
      }else{
        connection.query(`select person_account,person_picture from person where person_account IN (${result[0].group_person})`,function(err1,result1){
          if(err1){
            res.json({
              status:"1",
              msg:err1
            });
          }else{
            res.json({
              status:"0",
              msg:result1
            });
          }
        })
      }
   })
});

//删除群成员
router.post("/deleteGroupPerson",function(req,res,next){
  connection.query(`select group_person from chatgroup where group_id = '${req.body.groupId}'`,function(err,result){
    if(err){
      res.json({
        status:"1",
        msg:err
      });
    }else{
      let groupPerson=result[0].group_person.split(",");
      // console.log(groupPerson.findIndex((value,index,arr)=>{
      //   return value ==`'${req.body.personAccount}'`;
      // }),465464646);
      groupPerson.splice(groupPerson.findIndex((value,index,arr)=>{
        return value ==`'${req.body.personAccount}'`;
      }),1);
      // console.log(groupPerson,878798979);
      groupPerson = groupPerson.join(",");
      connection.query(`UPDATE chatgroup SET group_person = "${groupPerson}" WHERE group_id = '${req.body.groupId}'`,function(err1,result1){
         if(err1){
          res.json({
            status:"1",
            msg:err1
          }); 
         }else{
          res.json({
            status:"0",
            msg:"删除成功！"
          });
         }
      });
    }
  });
});

//获取群文件列表
router.get("/getGroupfileList",function(req,res,next){
   connection.query(`select * from file where file_group_id = '${req.query.groupId}' and from_type = 'group'`,function(err,result){
     if(err){
       res.json({
         status:"1",
         msg:err
       })
     }else{
       res.json({
         status:"0",
         msg:result
       });
     }
   });
});

//获取聊天记录
router.get("/getGroupChat",function(req,res,next){
   connection.query(`select * from groupchatrecords where to_group_id = '${req.query.groupId}'`,function(err,result){
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
