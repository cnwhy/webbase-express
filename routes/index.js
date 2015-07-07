var express = require('express');
var router = express.Router();
var _menuCold = ''
/* GET home page. */
// router.get('/', function(req, res, next) {
// 	var nb = req.cookies.abc ? ++req.cookies.abc : 1;
// 	var snb = req.session.abc ? ++req.session.abc : 1;
// 	res.cookie('abc',nb,{maxAge:5*60*1000});
// 	req.session.abc = snb;
// 	res.render('index', { title: 'Express',con: nb,scon:snb});

// });

router.get('/', function(req, res, next) {
	res.render('index.html', _.extend({
		title: 'CLM管理平台首页'
		,menuCold:_menuCold
		,session:req.session
		,menulist:req.session.menu
	}));
});

module.exports = router;
