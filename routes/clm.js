var express = require('express');
var router = express.Router();
var url = require('url');
var http = require('http');
var _ = require('underscore');
var pClass = require('../lib/publicClass')
//var TPS = pClass.templateParameters;
var Vrole = pClass.Vrole
var _menuCold = 'clm';
module.exports = router;

// router.all('/clm',function(req,res,next){Vrole(req,res,next,_menuCold+'third')}) 

router.all('/',function(req, res, next) {
  pClass.automenu(req,res,next,_menuCold)
})

/*CLM企业管理*/
router.all('/student/list',function(req, res, next) {
  res.render('clm/member/list.html', _.extend({
    title: '企业管理'
    ,menuCold:_menuCold
    ,session:req.session
    ,menulist:req.session.menu
  }));
});