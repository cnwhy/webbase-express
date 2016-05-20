var express = require('express');
var path = require('path');
var favicon = require('serve-favicon'); //网站图标
var logger = require('morgan');         //http日志
var cookieParser = require('cookie-parser'); //cookie中间件
var bodyParser = require('body-parser');     //解析请求参数
var session = require('express-session');  //session模块
var compression = require('compression');  //跟据访回类型启用gzip压缩 中间键
var resminify = require("res-minify")
var _ = global._ = require('underscore');
var qs = require('querystring');

global.configs = global.setting = require('./glob.js').configs;

var app = express();

//设置模板路径
app.set('views', path.join(__dirname, 'views'));
//按后缀名 指定模板引擎;
app.engine('html', require('ejs').__express);
app.engine('ejs', require('ejs').__express);  
//设置模板默认后缀名
app.set('view engine', 'ejs'); 
//app.locals 是模版中可用的数据
app.locals._ = _;
//_.extend(app.locals,setting,require('./lib/publicClass').templateParameters())

//去掉 header 中的x-powered-by标识;
app.disable('x-powered-by') 

//开启代理模式 反向代理,express能正确获取用户IP等
app.enable('trust proxy') 

//gzip
app.use(compression());

//处理 /favicon.ico 请求
app.use(favicon(path.join(__dirname,setting.respath,'favicon.ico')));

//动态压缩,编译JS,CSS/less
app.use(setting.resurlpath,resminify(path.join(__dirname, setting.respath),{"reAbsolute":true}));

//express日志打印颗粒配置,放在favicon.ico和静态资源请求之后
app.use(logger('dev'));

//解析参数
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); //不对qs的对像参数进行解析。

//解析cookie
app.use(cookieParser());

//session 实现
app.use(session({
    secret: setting.secret
    ,name: setting.sessionID
    ,cookie: {maxAge:setting.sessionleftTime}
    ,nextopen: false //关闭浏览器时清理会话
    ,rolling: true
    ,resave: true
    ,saveUninitialized:true
}))
/*
name: 设置 cookie 中，保存 session 的字段名称，默认为 connect.sid 。
store: session 的存储方式，默认存放在内存中，也可以使用 redis，mongodb 等。express 生态中都有相应模块的支持。
secret: 通过设置的 secret 字符串，来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改。
cookie: 设置存放 session id 的 cookie 的相关选项，默认为 (default: { path: '/', httpOnly: true, secure: false, maxAge: null })
genid: 产生一个新的 session_id 时，所使用的函数， 默认使用 uid2 这个 npm 包。
rolling: 每个请求都重新设置一个 cookie，默认为 false。
resave: 即使 session 没有被修改，也保存 session 值，默认为 true。
saveUninitialized: 存储未初始化(session为空)的会话. 默认为 true
*/
//==========================================================

//路由
app.use('/', require('./routes/index'));











//===========================================================

//===以下为错误处理===

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.listen(setting.port ,function(){
  console.log(new Date() + ':start server on port ' + setting.port)
})