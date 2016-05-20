//local setting
var _ = require('underscore')
exports.share = {
	port:8500
	,resourceVersion: require('./package.json').version
	,appName: 'CDM' //项目代号
	,leftTimeout: ''
	,sessionID: 'sessionId.node'
	,secret: 'abcdefg'
	,sessionleftTime: 1000*60*60*2
	//资源文件配置
	,respath: './public'
	,resurlpath: '/' //资源文件路径
	// //资源文件服务器地址
	// ,cdnurl: {
	// 	dev: 'http://cdn.qida.com'
	// 	,test: 'http://cdn.qida.comt'
	// 	,production : 'http://cdn.qida.com'
	// }
	// //js资源文件路径
	// ,jspath: {
	// 	dev: '/js/dev'
	// 	,test: '/js/min'
	// 	,production : '/js/min'
	// }
	// //接口服务器地址
	// ,apiurl : {
	// 	dev: 'http://api.qida.comd'
	// 	,test: 'http://api.qida.comt'
	// 	,production : 'http://api.qida.com'
	// }
	// ,memcachePool: ['192.168.3.106:11211']
	// ,zookeeperUrl: '192.168.3.101:4181'
}
var local = require('./local')
,_ = require('underscore')

var configs = {}
	,defConfig = _.extend({},exports.share,local)
	,env = local.env || process.env.NODE_ENV || 'dev';

for(var i in defConfig){
	function getv(){
		var defv = defConfig[i];
		if(defv[env] === undefined) return defv;
		else return defv[env]; 
	}
	configs[i] = getv();
}

exports.configs = configs;
