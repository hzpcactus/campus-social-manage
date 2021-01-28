var express = require('express');
var router = express.Router();
const fs = require('fs');
const axios = require('axios');
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

//上传blog图片
router.post('/upload/headImage',function(req, res, next) {
    let form = new multiparty.Form();
    // form.uploadDir="./public/images";
    //form.uploadDir="193.9.139.13:8080/cactusImage";
    var path = require('path');
    form.uploadDir=path.resolve(__dirname,`../public/images/blog`);
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

//发布动态
router.post('/sendBlog',function(req,res,next){ 
  let addsql;
  let blogPicture = req.body.blogPicture;
  // console.log(blogPicture);
  //生成uuid
  connection.query(`SELECT REPLACE(UUID(), '-', '')`,function(err,result){    
    addsql = `INSERT INTO blog(blog_id,blog_sender,blog_content,blog_picture,blog_friend,is_blog_forwarding,blog_original) VALUES('${Object.values(result[0])[0]}','${req.body.blogSender}','${req.body.blogContent}','${blogPicture}','${req.body.blogFriend}',${req.body.isblogForwarding},'${req.body.blogOriginal}')`;
    console.log(addsql);
    connection.query(addsql,function(err,result){
      if(err){
         res.json({
           status:"1",
           msg:err
         });
      }else{
        res.json({
          status:"0",
          msg:req.body.isblogForwarding==true?"已转发！":"发布成功！"
        });
      }
    })
  });
  
});

//查询好友动态列表(包括自己)
router.post('/searchBlog',function(req,res,next){
  new Promise((resolve,reject) => {
    connection.query(`select friend_list from friends where person_id='${req.body.personAccount}'`,function(err,result){
      if(err){
        resolve(null);
      }else{
        resolve(result.length>0?result[0].friend_list:null);
      }
    });
  }).then(res1=>{
    let blogSender = res1==null?[]:res1.split(",");
    blogSender.push(`'${req.body.personAccount}'`)
    blogSender = blogSender.join(",");
    connection.query(`SELECT s1.blog_content ,s1.blog_friend,s1.blog_id,s1.blog_like,s1.blog_picture,s1.blog_sender,s1.is_blog_forwarding,s1.blog_original,s1.blog_time,s2.person_picture
    FROM blog s1,person s2
    WHERE s1.blog_sender IN (${blogSender}) AND s1.blog_sender= s2.person_account
    ORDER BY s1.blog_time DESC`,function(err,result){
      if(err){
         res.json({
           status:"1",
           msg:err
         });
      }else{
        let resultList = result;
        async.map(resultList,function(item,callback){
          connection.query(`select * from remark where blog_id = '${item.blog_id}'`,function(err,result){
            if(result.length>0){    //动态下有评论
              item.remark = result;
            }
            callback(null);
          });
        },function(err,result){
          //检测是否点赞
           result = resultList;
           result.forEach(item=>{
            if(item.blog_like===null){
              item.is_like = false;       //没点赞
            }else{
              let arr = item.blog_like.split("、");
              item.is_like = false;       //初始化
              for(let i=0;i<arr.length;i++){
                if(arr[i]==req.body.personAccount){
                  item.is_like = true;
                }
              }
            }
           });
           console.log(result);
           res.json({
            status:"0",
            msg:result
          });
        });
      }
    });
  });
});

//点赞或取消点赞动态
router.post('/giveLike',function(req,res,next){
  connection.query(`select blog_like from blog where blog_id = '${req.body.blogId}'`,function(err,result){
     if(result){
       let giveLikeList = (result[0].blog_like==""||result[0].blog_like==null)?[]:result[0].blog_like.split("、");
       if(req.body.isgiveLike){    //true为点赞
         giveLikeList.push(req.body.personAccount);
         let addsql = `INSERT INTO likes(blog_id,blog_sender,like_account) VALUES('${req.body.blogId}','${req.body.blogSender}','${req.body.personAccount}')`;
         connection.query(addsql,function(err,result){
           
         });
       }else{    //取消点赞(从中去掉用户)
         giveLikeList.splice(giveLikeList.findIndex(function(value,index,arr){
            return value == req.body.personAccount;
         }),1);
         connection.query(`delete from likes where blog_id='${req.body.blogId}' and like_account='${req.body.personAccount}'`,function(err,result){

         });
       }
       giveLikeList = giveLikeList.join("、");
       connection.query(`UPDATE blog SET blog_like = "${giveLikeList}" WHERE blog_id = '${req.body.blogId}'`,function(err,result){
          if(result){
            res.json({
              status:"0",
              msg:"success"
            });
          }else{
            res.json({
              status:"1",
              msg:err
            });
          }
       })
     }else{
       throw err;
     } 
  });
});

//评论
router.post('/remark',function(req,res,next){
  addsql = `INSERT INTO remark(blog_id,remark_account,remark_content,blog_sender) VALUES('${req.body.blogId}','${req.body.remarkAccount}','${req.body.remarkContent}','${req.body.blogSender}')`;
  connection.query(addsql,function(err,result){
     if(err){
       res.json({
         stauts:"1",
         msg:err
       });
     }else{
       res.json({
         status:"0",
         msg:"评论成功！"
       });
     }
  });
});

//删除动态
router.post('/delete',function(req,res,next){
   
   async.map(["blog","remark"],function(item,callback){
     connection.query(`delete from ${item} where blog_id='${req.body.blogId}'`,function(err,result){
        if(err){
          callback(err);
        }else{
          callback(null);
        }
     });
   },function(err,result){
      if(err){
        res.json({
          status:"1",
          msg:err
        });
      }else{
        res.json({
          status:"0",
          msg:"删除成功！"
        });
      }
   });
   
  //  connection.query(`delete from blog where blog_id='${req.body.blogId}';
  //                    delete from remark where blog_id='${req.body.blogId}';`,
  //   function(err,result){
  //     if(err){
  //       res.json({
  //         status:"1",
  //         msg:err
  //       });
  //     }else{
  //       res.json({
  //         status:"0",
  //         msg:"删除成功！"
  //       });
  //     }
  //  });
});

//查找花瓣网背景
router.post('/searchTheme',function(req,res1,next){
  let httpUrl = `https://huaban.com/search/?q=${req.body.searchBackground}&k8hh1pl7&page=${req.body.page}&per_page=20&wfl=1`;
  // if(req.body.page==1){
    axios.get(httpUrl).then(res=>{
      let arr = [];
      let param = {};
      let rec = /app.page\["pins"\] = (.*?)app.page\["page"\]/igs;
      let result = rec.exec(res.data)[1];
      result = JSON.parse(result.trim().substr(0,result.length-2));
      result.forEach(item=>{
        param={
          key:"https://hbimg.huabanimg.com/"+item["file"]["key"],
          tags:item["tags"],
          text:item["raw_text"],
          like_count:item["like_count"],
          repin_count:item["repin_count"],
        }
        arr.push(param);
      });
      console.log(arr);
      res1.json({
        status:"0",
        msg:arr
      });
  });
  
});

//获取用户动态主题背景
router.post("/getTheme",function(req,res,next){
  connection.query(`select blog_theme from person where person_account='${req.body.personAccount}'`,function(err,result){
     if(err){
       res.json({
         status:"1",
         msg:err
       });
     }else{
       console.log(result);
       res.json({
         status:"0",
         msg:result[0]
       });
     }
  });
});

//更新动态背景
router.post("/chooseTheme",function(req,res,next){
   connection.query(`UPDATE person SET blog_theme = "${req.body.blogTheme}" WHERE person_account = '${req.body.personAccount}'`,function(err,result){
     if(err){
       res.json({
         status:"1",
         msg:err
       });
     }else{
       res.json({
         status:"0",
         msg:"选择成功！"
       });
     }
   });
});

module.exports = router;
