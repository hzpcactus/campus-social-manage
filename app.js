var createError = require('http-errors');
var express = require('express');
var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
// const socket = require('./tools/socket');

var app = express();
var debug = require('debug')('campus-social-manage:server');

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

//socket.io通讯 start
// var io = require('socket.io').listen(server);
// io.on('connection',function(socket){
//   console.log("连接成功");
//   socket.on("sendFriendApply",function(data){
//     console.log("收到数据",data);
//     socket.broadcast.emit("getFriendApply",data);
//   });

// })

//socket.io引入
// var http = require('http').Server(app);
var io = require('socket.io')(server,{
	pingInterval: 10000,
  pingTimeout: 5000,
});
require('./tools/socket.js')(io);


// var dd=io.of(`/dd`).on('connection',function(socket){
//   socket.emit('friendApply',{type:'friendApply',personApply:'哈哈啊哈哈啊哈'});
// });


//socket.io通讯 end

//更新数据 start
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
const schedule = require('node-schedule');
const  scheduleCronstyle = ()=>{             //每天统计更新在线人数
  //每天的23点59分59秒触发 
    schedule.scheduleJob('59 59 23 * * *',()=>{      //6个占位符从左到右分别代表：秒、分、时、日、月、周几
      let dateTime = (new Date()).toLocaleDateString().replace("/","-");
      connection.query(`select * from person where person_time between '${dateTime} 00:00:00' and '${dateTime} 23:59:59'`,function(err,result){
        if(result){
          let personArr = [];
          result.forEach(item=>{
            personArr.push(`'${item.person_account}'`);
          });
          personArr = personArr.join(",");
          connection.query(`INSERT INTO statistic(date_time, online_person, online_number) VALUES(?,?,?)`,[dateTime,personArr,personArr.split(",").length],function(err,result){

          })
        }
      });
      
    }); 
}

scheduleCronstyle();
//更新数据 end

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var friendsRouter = require('./routes/friends');
var noticeRouter = require('./routes/notice');
var manageRouter = require('./routes/manage');
var blogRouter = require('./routes/blog');
var chatRouter = require('./routes/chat');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//设置跨域访问
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("X-Powered-By", "http://www.shuzhiqiang.com");
  res.header("Content-Type", "application/json;charset=utf-8");
  res.header("Access-Control-Allow-Credentials",true);//携带cookie跨域请求
  req.method.toUpperCase() === "OPTIONS" ? res.sendStatus(200) : next();//防止在预请求阶段就响应接口
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/friends', friendsRouter);
app.use('/notice', noticeRouter);
app.use('/manage', manageRouter);
app.use('/blog', blogRouter);
app.use('/chat', chatRouter);


app.use(express.static('public'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
module.exports = app
