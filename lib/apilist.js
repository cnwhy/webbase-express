var api = {
        '_public':[
            '/upfile'   //普通上传
            ,'/cmn/domain/findChildren.do' //领域列表
            ,'/cmn/area/findChildren.do'    //地区列表
            ,'/cmn/industry/findChildren.do' //行业列表
            ,'/qida/course/category/findByParentId.do' //课程分类查询
            ,'/qida/course/category/findAll.do' //所有课程分类
            ,'/learn/plan/category/get.do' //学习计划分类列表
            ,'/learn/plan/category/findAll.do' //所有学习计划分类
            ,'/qida/course/category/findAll.do' //所有师说分类
            ,'/resource/thirdparty/listall.do' //所有第三方
            //数据迁移(临时)
            ,'/dmm/search.do' //
            ,'/dmm/update.do' //
            ,'/dmm/batch/update.do' //
        ]
        ,apis:[
            //分类管理
            [
                ['/getlist.do'],
                ['user'] //分类管理权限
            ]
        ]
    }

var apife = function(apiurl,menus){
    var mk = 0;
    for(var i=0; i<api._public.length;i++){
        if(apiurl == api._public[i]){
            return 1;
        }
    }
    for(var n=0; n<api.apis.length;n++){
        var api_ = api.apis[n]
            ,apis_ = api_[0]
            ,roles = api_[1];
        for(var a=0; a<apis_.length; a++){
            if(apiurl == apis_[a]){
                mk = 1;
                if(vs(roles,menus)){
                    return 1;
                }
                break;
            }
        }
    }
    return mk ? 0 : 2;
}

var vs = function(role_arr,menus){
    if(!menus) return false;
    for(var i=0; i< role_arr.length;i++){
        var role = role_arr[i];
        if(menus[role]){
            return true;
        }
    }
    return false;
}
exports.api = api;
exports.apife = apife;