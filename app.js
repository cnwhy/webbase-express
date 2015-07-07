var express = require('express');
var path = require('path');
var favicon = require('serve-favicon'); //网站图标
var logger = require('morgan');         //http日志
var cookieParser = require('cookie-parser'); //cookie中间件
var bodyParser = require('body-parser');     //解析请求参数
var session = require('express-session');  //session模块
var compress = require('compression');  //跟据访回类型启用gzip压缩 中间键
var _ = global._ = require('underscore');
var qs = require('querystring');

global.configs = global.setting = require('./glob.js').configs;

var app = express();
var sessionleftTime = 1000 * 60 //* 20

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
app.engine('html', require('ejs').__express);
app.engine('ejs', require('ejs').__express);
app.set('view engine', 'ejs');
app.locals._ = _;
_.extend(app.locals,setting,require('./lib/publicClass').templateParameters())

app.disable('x-powered-by')
app.enable('trust proxy') //开启代理模式

app.use(favicon(__dirname + '/public/favicon.ico'))

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); //不对qs的对像参数进行解析。
app.use(cookieParser());
app.use(session({
    secret: setting.secret
    ,name: setting.sessionID
    ,cookie: {maxAge:sessionleftTime}
    ,nextopen: false //关闭浏览器时清理会话
    ,rolling: true
    ,resave: true
    ,saveUninitialized:true
}))
app.use(express.static(path.join(__dirname, 'public')));


//路由
var roles = require('./lib/role.js')
if(!setting._roles) app.use(roles.userInfo)  //用户信息
if(setting._roles) app.use(roles.roles1)  //自动全部权限
//app.use(roles.roles)  //真实权限控制

var routes = require('./routes/index');
var clm = require('./routes/clm');
app.use('/', routes);
app.use('/clm', clm);
app.all('/test',function(req,res,next){
  res.json(req.query)
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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

//module.exports = app;
