var express = require('express');
var router = express.Router();
var url = require('url')
var http = require('http')
var request = require('request')
var pClass = require('./publicClass')
var _ = require('underscore')
var q = require('q')
var reqstr = {"values":[{
    "Id": 1,
    "resourceName": "管理1",
    "resourceType": "M",
    "permission": "clm",
    "des": "管理1",
    "url": "",
    "parentId": 0,
    "status": "Y"
},{
    "Id": 2,
    "resourceName": "管理1",
    "resourceType": "M",
    "permission": "",
    "des": "管理1",
    "url": "/clm/student/list",
    "parentId": 1,
    "status": "Y"
}],"executeStatus":0}

var roleurl = '/sys/user/resourece/get.do'//获取用权限数据(企大后台接口)
var userurl = '/sys/user/get.do'          //获取用户数据(企大后台接口)
var casuserinfo = '/user/userInfo/get.do' //获取用户数据(CAS接口)

//用户信息初始化
var userInfo = function(req,res,next){
	if(req.session.role && req.session.menu) {
		return next()
	}
	var userdata = req.userdata = {userId:req.session.userId,'_CONST_USER_ID_':req.session.userId};
	q.all([pClass.requestApi_q(roleurl,userdata),pClass.requestApi_q(userurl,userdata)])
	.spread(function(role,user){
		var rall = role.values
		req.session.role = rarr;
		req.session.menu = {}
		for(var i in rarr){
			var cord = rarr[i].permission
			if(cord !== '')req.session.menu[cord] = 1;
		}
		req.session.userName = user.values.userName;
		return next();
	},next)
}

//全权限测试
var roles1 = function(req,res,next){
	var data = reqstr
	req.session.role = data.values;
	req.session.menu = {}
	if(data.executeStatus == 0){
		var arr = data.values
		for(var i in arr){
			var cord = arr[i].permission
			if(cord !== '')req.session.menu[cord] = 1;
		}
	}
	req.session.userName = '调试用户'
	return next()
}

exports.userInfo = userInfo;
exports.roles1 = roles1;
exports.apiRoles = router;