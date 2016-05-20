var _ = require('underscore');
var request = require('request');
var querystring = require('querystring');
var q = require('q');
var apihost = setting.apiurl.replace(/\/+$/, "");
var url = require('url');

function getTemplateParameters() {
	var obj = {};
	obj['cdn'] = setting.cdnurl;
	obj['cdnqida'] = obj.cdn + setting.respath;
	obj['pathJs'] = obj.cdnqida + setting.jspath;
	return obj;
}

//qrequest
exports.qrequest = function(args) {
	var deferred = q.defer()
	try{
		var uri = args.uri || args.url
			,t1 = new Date().getTime()
			,t2 = 0;
		args.method = args.method || 'get'
		args.timeout = args.timeout || 600000
		args.useQuerystring = true;
		if(typeof args.form !== 'string'){
			args.form = querystring.stringify(args.form) 
		}
		request(args, function(err, response, body) {
			var o = this;
			var getmsg = function(unCode){
				var msg = (!unCode && response) ? '\n API request '+ o.response.statusCode : '';
				msg += '\n path:' + o.href.replace(/\?.*$/,'');
				msg += o.uri.search ? '\n queryString:' + o.uri.search : '';
				msg += o.method == 'POST' ? '\n formData:' + o.body.toString() : '';
				msg += body ? '\n body:' + body : '';
				return msg;
			}
			if(err) return deferred.reject(new Error(getmsg(1) + "\n" + err.stack));
			if(response.statusCode !== 200) return deferred.reject(new Error(getmsg()));
			t2 = new Date().getTime()
			console.log(new Date() + '--url:' + uri + ' cost time: ' + (t2 - t1) + 'ms')
			deferred.resolve(body)
		})
	}catch(e){
		deferred.reject(e)
	}
	return deferred.promise
}

var qrequestApi = exports.qrequestApi = function(args) {
	var deferred = q.defer();
	try{
		var uri = args.uri || args.url
			,t1 = new Date().getTime()
			,t2 = 0
		args.method = args.method || 'post'
		args.timeout = args.timeout || 20000
		args.useQuerystring = true;
		if(typeof args.form !== 'string'){
			args.form = querystring.stringify(args.form) 
		}
		request(args, function(err, response, body) {
			var o = this;
			var getmsg = function(unCode){
				var msg = (!unCode && response) ? '\n API request '+ response.statusCode : '';
				msg += '\n path:' + o.href.replace(/\?.*$/,'');
				msg += o.uri.search ? '\n queryString:' + o.uri.search : '';
				msg += o.method == 'POST' ? '\n formData:' + o.body.toString() : '';
				msg += body ? '\n body:' + body : '';
				return msg;
			}
			try{//mark1
				if(err) return deferred.reject(new Error(getmsg(1) + "\n" + err.stack));
				if(!err && response.statusCode !== 200)	err = new Error(getmsg())
				if(!err){
					var data = JSON.parse(body)
					if(+data.executeStatus == 1){
						err = new Error("API [executeStatus == 1] " + getmsg(1))
					}
				}
				if(err) return deferred.reject(err);
				t2 = new Date().getTime()
				console.log(new Date() + '--url:' + uri + ' cost time: ' + (t2 - t1) + 'ms')
				deferred.resolve(data)
			}catch(e){
				deferred.reject(new Error(e.stack + '\n' + body))
			}
		})
	}catch(e){
		deferred.reject(e)
	}
	return deferred.promise
}

exports.requestApi = function(path, pdata, cb) {
	return qrequestApi({url:apihost+path,form:pdata}).then(function(data){
		cb(null,data)
	},function(err){
		cb(err);
	})
}

exports.requestApi_q = function(path, pdata) {
	return qrequestApi({url:url.resolve(apihost,path),form:pdata})
}

function Vrole(req, res, next, qdcord) {
	var qx = req.session.menu;
	if (qx[qdcord])
		next();
	else
		res.render('norole', _.extend({
			title: '没有权限',
			session: req.session,
			menulist: req.session.menu
		}))
}

function getMenuUrl(arr, cold) {
	function getzarr(arr, pid) {
		var zarr = []
		for (var i = 0, n = arr.length; i < n; i++) {
			if (arr[i].parentId == pid) {
				zarr.push(arr[i])
			}
		}
		return zarr;
	}

	var menu;
	for (var i in arr) {
		if (arr[i].permission == cold) {
			menu = arr[i];
			break;
		}
	}
	if (menu) {
		if (menu.url != "") {
			return menu.url
		} else {
			var narr = getzarr(arr, menu.Id);
			for (var i = 0; i < narr.length; i++) {
				var m1 = narr[i]
				if (m1.url != "")
					return m1.url;
				var tempurl = getMenuUrl(arr, m1.permission);
				if (tempurl != "")
					return tempurl
			}
		}
	}
	return '';
}

//自动跳转有权限下级目录
function automenu(req, res, next, qdcord) {
	var url = getMenuUrl(req.session.role || [], qdcord);
	if (url)
		res.redirect(url);
	else {
		console.log(req.session.role, qdcord);
		next()
	}
}

exports.getHref = function(req){
	var href = url.resolve(req.protocol + "://" + req.hostname,req.originalUrl);
	return href;
}

exports.Vrole = Vrole;
exports.templateParameters = getTemplateParameters;
exports.automenu = automenu;