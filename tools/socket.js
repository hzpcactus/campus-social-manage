const mysql = require('mysql');
const connection = mysql.createConnection({     
    host     : 'localhost',       
    user     : 'root',              
    password : '19980605',       
    port: '3306',                   
    database: 'campus-social',
    timezone: "08:00"
  }); 
   
connection.connect();
module.exports = function(io){
  var socketLogin = {};
  var socketChat = {};
  io.on('connection',(socket)=>{
    //用户登录，记录用户在线
    socket.on('login',(personAccount)=>{     //前端向服务端发送用户id，记录用户在线的唯一标识(socket.id)
       socketLogin[personAccount] = socket.id;
       console.log(socketLogin,11111);
    });

    //用户进入单人聊天
    socket.on('chat',(id)=>{    //id:由fromid+#+toid组成的二人聊天室
      for(let [key,value] of Object.entries(socketChat)){
         if(key.split("#")[0]==id.from){
           delete socketChat[key];
         }
      }
      socketChat[id.from+"#"+id.to] = socket.id;
    });

    //接收好友申请
    socket.on('sendFriendApply',(msg)=>{
      console.log("收到申请");
       if(socketLogin[msg.to_person_id]){
         console.log("发送申请",msg);
         socket.to(socketLogin[msg.to_person_id]).emit('getFriendApply',msg);
       }
    });

    //接收用户信息
    socket.on('message',(msg)=>{
      console.log(msg);
       if(socketChat[msg.to]){      //如对方在二人聊天室中，服务端直接发送信息给对方前端，同时将此记录保存在数据库中,status为1
        let addsql = `INSERT INTO chat(from_person_id,to_person_id,message,status,send_time) VALUES('${msg.from_person_id}','${msg.to_person_id}','${msg.message}',1,NOW())`;
        connection.query(addsql,function(err,result){
           if(err){
              console.log(err);
           }else{
             console.log("对方在线");
             socket.to(socketChat[msg.to]).emit('sendMessage',msg);
           }
         });
       }else{   //反之，存入数据库，status为0，未读，
        let addsql = `INSERT INTO chat(from_person_id,to_person_id,message,status,send_time) VALUES('${msg.from_person_id}','${msg.to_person_id}','${msg.message}',0,NOW())`;
        connection.query(addsql,function(err,result){
           if(err){
              console.log(err);
           }else{
            console.log("对方不在线",socketLogin[msg.to_person_id]);
            socket.to(socketLogin[msg.to_person_id]).emit('addMsg',msg);
           }
         });
       }
    });

    //用户离开
    socket.on('disconnect', ()=>{
        //hasOwnProperty() 方法会返回一个布尔值，指示对象自身属性中是否具有指定的属性
        if(socketChat.hasOwnProperty(socket.name)) {
            delete socketChat[socket.name];
        }
        if(socketLogin.hasOwnProperty(socket.name)){
            delete socketLogin[socket.name];
        }
    });

    //加入群
		socket.on('group', function (data) {
			//console.log(data);
	    socket.join(data);
	  });
		//接收群信息
	  socket.on('groupmessage', function(msg){
		  //保存到群消息内
		  // var msgData = {
		  // 	groupID: msg.groupid,
		  //   fromID: msg.userid,
		  //   content: msg.message,
		  //   time: new Date(),
		  // }
		  // groupdb.insertGroupMsg(msgData);

		  //更新群用户消息数及最后通讯时间
      // groupdb.updateTime(msg.groupid);
      let addsql = `INSERT INTO groupchatrecords(from_person_id,to_group_id,message,from_person_picture,send_time) VALUES('${msg.from_person_id}','${msg.to_group_id}','${msg.message}','${msg.from_person_picture.replace(/\\/g,"/")}',NOW())`;
      connection.query(addsql,function(err,result){
        if(err){
          console.log(err);
        }else{
          //广播消息
          console.log("开始广播了");
          socket.broadcast.to(msg.to_group_id).emit('sendGroupMsg',msg);
        }
      });
			// //未进入聊天群提示
			// function getGroupUser(groupid){
			// 	var id = {'groupID':groupid};
			//     var out = {'userID':1};
			//     Groupuser.find(id, out, function(err, res){
			//         if (err) {
			//             console.log("查询失败：" + err);
			//         }
			//         else {
			//         	res.map(function(ver){
			//         		var userid = ver.userID;
			//         		if(socketLogin[userid]){
			//         			socket.to(socketLogin[userid]).emit('addGroupMsg',msg.groupid,msg.message,msg.name);
			//         		}
			//         	})
			//         }
			//     });
			// }
			// getGroupUser(msg.to_group_id);
	  	});
  });
}