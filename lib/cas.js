/*
* 企大CAS登陆集成模块
*/

var q = require('q')
	,_ = require('underscore')
	,url = require('url')
	,querystring = require('querystring')
	,tools = require('./tools')
	,setting = qida.setting
var xml2json = require('xml2json')
	,xmlOptions = {
		object: true
		,reversible: false
		,coerce: true
		,sanitize: true
		,trim: true
		,arrayNotation: false
	}
var Memcached = require('memcached')
	,memcached = new Memcached(setting.memcachePool)
	,sessionTableKey = 'SessionTable'
	,aday = 60 * 60 * 24 ;

//分析 cas xml 的登陆信息 
var validateCasXml = exports.validateCasXml = function (xml,callback) {
	var deferred = q.defer()
	var obj = xml2json.toJson(xml.toString(), xmlOptions)
		,uid = 0;
	try{
		if(obj['cas:serviceResponse']['cas:authenticationFailure']) {
			deferred.reject(new Error('授权错误: ' + obj['cas:serviceResponse']['cas:authenticationFailure'].$t));
		}
		else if(obj['cas:serviceResponse']['cas:authenticationSuccess']) {
			uid = obj['cas:serviceResponse']['cas:authenticationSuccess']['cas:user']
			deferred.resolve(uid);
		}else{
			deferred.reject(new Error('unknown err'))
		}
	}catch(e){
		deferred.reject(e)
	}
	return deferred.promise
}

//cas登陆中间键
exports.autologin = function(req, res, next) {
	var ticket = req.query.ticket
		,session = req.session
	session.configs = req.session.configs || {}
	//已登陆
	if(session.userId){	
		return next();
	}
	if(ticket){
		var valiservice = setting.serviceHost + req.originalUrl.replace(/[\?&]ticket=[^&]*/,'');
		var query = {
			app : setting.appName
			,ticket : ticket
			,service : valiservice
			,casServerUrlPrefix : setting.casUrls.casUrl
			//,serverName: setting.serviceHost
		}
		tools.qrequest({
			uri: setting.casUrls.casValidateUrl + '?' + querystring.stringify(query)
	   		,strictSSL: false //不检查证书
	    	,rejectUnauthorized: false //不检查证书
		})
		.then(validateCasXml,function(err){
			next(err);
		})
		.then(function(uid) {
			SessionTable.addS(ticket,session.id,function(err){
				if(err) next(err);
				session.ticket = ticket;
				session.userId = uid;
				session.authNumb = 0;
				return res.redirect(valiservice)
			})
		}, function(err) {
			session.authNumb = session.authNumb ? session.authNumb+1 : 1;
			if(sess.authNumb <= 3){
				return res.redirect(valiservice)
			}
			return next(err);
		})
	}else{
		next();
	}
}

//未登陆阻塞
exports.unlogin = function(req, res, next){
	if(req.session.userId) return next();
	if(req.xhr) {//ajax请求
		return res.json({
			executeStatus: 1
			,errorMsg: '未登录或登录超时,登录后再执行操作!'
			,msg: '未登录或登录超时,登录后再执行操作!'
		})
	}
	var valiservice = setting.serviceHost + req.originalUrl.replace(/[\?&]ticket=[^&]*/,'');
	var query = {
			app : setting.appName
			,service : valiservice
		}
	var redirectUrl = setting.casUrls.casLoginUrl + '?' + querystring.stringify(query)
	res.redirect(redirectUrl)
}


//退出并关向CAS发送退出命令
exports.logout = function(req, res, next) {
	var sess = req.session
		,serviceHost = setting.serviceHost//req.protocol + "://" + req.hostname
		,referer = req.headers.referer || "";

	if(referer && url.parse(referer).pathname == req.path){
		referer = null
	}
	//var logoutUrl = setting.casUrls.casLogoutUrl + '?service=' + encodeURIComponent(setting.serviceHost) + '&app=' + setting.appName
		var query = {
			app : setting.appName
			//,service : url.resolve(serviceHost,req.originalUrl)
			,service : referer || serviceHost
		}
	var logoutUrl = setting.casUrls.casLogoutUrl + '?' + querystring.stringify(query)
	if(sess && sess.ticket){
		SessionTable.delS(sess.ticket)
	}
	req.session.regenerate(function(err){
		if(err) next(err)
		res.redirect(logoutUrl)
	})
}

//验证cas注消申请
exports.validateStXml = function (req, res, next) {
	function parseXml() {
		var deferred = q.defer();
		try {
			var obj = xml2json.toJson(req.body.logoutRequest.toString(), xmlOptions)
			,st = obj['samlp:LogoutRequest']['samlp:SessionIndex']
			var out = false //踢出标记 v3.3.0 中预留
			if(out){
				deferred.resolve(st,true)
			}else{
				deferred.resolve(st)
			}
		} catch (e) {
			var errs = 'error: ' + new Date() + ': cas发来注销请求， 处理请求时候出错了：' + e
			deferred.reject(new Error(errs))
		}
		return deferred.promise
	}
	parseXml()
	.done(function(st,out) {
		console.log(new Date() + " 收到注销请求: " + st);
		var sessDelfun = out ? SessionTable.delT : SessionTable.delS;
		sessDelfun(st,function(err){
			if(err) return next(err)
			res.end('ok');
		})
	}, function(err) {
		res.end(err)
	})
}

//ticket 与 sessionID 映射管理
var SessionTable = exports.SessionTable = {}
SessionTable.key = sessionTableKey
/*
* 添加映射 关系
*/
SessionTable.addS = function(ticket,sessid,callback){
	callback = callback || function(){}
	memcached.get(this.key,function(err,data){
		if(!err){
			if(!data || typeof(data) !== 'object'){data = {}}
			data[ticket] = sessid;
			memcached.set(this.key,data,aday,callback)
		}else{
			callback(err)
		}
	})
}
/*
* 结束指定ticket的会话
* ticket : {string} cas ticket
* out : {bool} 踢出标志
* callback : {*function}
*/
SessionTable.del = function(ticket,out,callback){
	callback = callback || function(){}
	memcached.get(this.key,function(err,data){
		if(!err){
			if(!data || typeof(data) !== 'object'){data = {}}
			try{
				var sessid = data[ticket];
				var tk = this.key;
				if(sessid){
					if(out){
						memcached.set(sessid,'{"out":1}',aday,function(err){
							if(err) return callback(err);

						})
					}else{
						memcached.del(sessid,function(err){
							if(err) return callback(err);
							callback(null);
							delete data[ticket];
							memcached.set(tk,data,aday)
						})
					}
				}
			}catch(e){
				callback(e)
			}
		}else{
			callback(err)
		}
	})
}
SessionTable.delS = function(ticket,callback){
	SessionTable.del(ticket,0,callback)
}
SessionTable.delT = function(ticket,callback){
	SessionTable.del(ticket,1,callback)
}
