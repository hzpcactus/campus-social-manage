const io=require('socket.io')(80);
var socketOf=function(url,eventname,item){
    console.log(eventname,item,19);
      console.log(url,eventname,item,20);
      var msg="";
      io.of(url).on('connection',(socket)=>{
      // io.on('connection',function(socket){
        // socket.on("connectmessage",function(data){
        //   console.log(data);
        // });
        console.log("服务器连接成功22222222222222222");
        // return new Promise(function(resolve,reject){
        console.log("能够发送数据啦");
        // socket.emit(eventname,item);
        socket.on(eventname,(data)=>{
          console.log(data,"得到数据啦，哈哈哈哈啊");
          msg=data;
          if(msg!=""){
            console.log("可以发送");
            socket.emit("test1",data,(data)=>{
              console.log("发送:",data);
            });
          }
        });
        
        socket.on('disconnect', (reason) => {
          console.log("连接失败！",reason);
        });
        socket.on('error', (error) => {
          console.log("连接错误！",reason);
        });
          // resolve(eventname);
        // });
      });
}
module.exports = socketOf;