var rules = Cal.init();

$("#propModal").on("show.bs.modal", function (e) {
    $("#propPageNm").val(Layout.getPageInfo("name"));
    $("#bgWidth").val($("#svg-container").width());
    $("#bgHeight").val($("#svg-container").height());
    Layout.setPageInfo("width",$("#svg-container").width());
    Layout.setPageInfo("height", $("#svg-container").height());
});
$("#newModal_newBtn").bind("click", function(){
    Diagrams.setData({});
    //Diagrams.updateNode();
    Cal.destory();
    $("#newModal").modal('hide');
});
$("#propModal_applyBtn").bind("click", function(){
    $("#svg-container").width($("#bgWidth").val());
    $("#svg-container").height($("#bgHeight").val());
    Layout.setPageInfo("width", $("#bgWidth").val());
    Layout.setPageInfo("height", $("#bgHeight").val());
    Layout.setPageInfo("name",  $("#propPageNm").val());
    $("#propModal").modal('hide');
    console.log(Layout.getPageInfo());
});

$("#mode_design").bind("click", function(){
    $("#mode_view").removeClass("active");
    $(this).addClass("active");
    $("#cal-group").removeClass("view");
    $("#svg-container").removeClass("view");
});
$("#mode_view").bind("click", function(){
    $("#mode_design").removeClass("active");
    $(this).addClass("active");
    $("#cal-group").addClass("view");
    $("#svg-container").addClass("view");
});
$("#leftMenus").find("li.item-menu").each(function(){
    $(this).bind("click", function(){
        var _item = $(this);
        if(_item.hasClass("item0")){
            Diagrams.addBox({type:"rect",x:50,y:50,width:120,height:40});
        }else if(_item.hasClass("item1")){
            Diagrams.addBox({type:"circle",x:50,y:50,width:100,height:100});
        }else if(_item.hasClass("item2")){
            Diagrams.addBox({type:"mb",x:150,y:50,width:100,height:30,mb:[]});
        }else if(_item.hasClass("item3")){
            Diagrams.addBox({type:"rect",x:50,y:50,width:120,height:40,isStart:true});
        }else if(_item.hasClass("item4")){
            Diagrams.addBox({type:"rect",x:50,y:50,width:120,height:40, isEnd:true});
        }else if(_item.hasClass("item5")){
            Diagrams.addBox({type:"pou",x:50,y:50,width:120,height:100});
        }else if(_item.hasClass("item6")){
            var calNo = CalData.getCalNo();
            CalData.setCalById(calNo, {id:calNo,val:"",fm:""});
            var calDiv = Cal.add(calNo);
        }
    });
});

var svg = d3.select("#diagram");
//Block Info Event
$("#prop_blockNmInput").bind("blur", function(e){
    //if(e.keyCode == "13"){
        var selectNode = Layout.getBlock();
        if(selectNode.type && selectNode.id){
            selectNode.name = this.value;
            Diagrams.updateNode();
            Diagrams.selectItem(selectNode);
        }
   // }   
});
$("#prop_blockWidthInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    if(selectNode.type && selectNode.id){
        selectNode.width = parseInt(this.value);
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }

});
$("#prop_blockHeightInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    if(selectNode.type && selectNode.id){
        selectNode.height = parseInt(this.value);
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});
$("#prop_blockXInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    if(selectNode.type && selectNode.id){
        selectNode.x = parseInt(this.value);
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});
$("#prop_blockYInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    if(selectNode.type && selectNode.id){
        selectNode.y = parseInt(this.value);
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});
$("#prop_blockRemove").bind("click", function(){
    var selectNode = Layout.getBlock();
    var selectId = selectNode.id;
    if(selectId){
        Layout.removeNode(selectId);
    }
});
$("#prop_blockStroke").bind("change", function(){
    var selectNode = Layout.getBlock();
    if(selectNode.id){
        selectNode.stroke = this.value;
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});
$("#prop_blockStrokeWidth").bind("change", function(){
    var selectNode = Layout.getBlock();
    if(selectNode.id){
        selectNode.strokeWidth = parseInt(this.value);
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});

//Calculate Event
$("#prop_calStart").bind("click", function(){
    var selectCal = CalData.getSelect();
    if(!selectCal.id)return;
    if(this.checked){
        $("#"+selectCal.id).parent().addClass("cal_start");
    }else{
        $("#"+selectCal.id).parent().removeClass("cal_start");
    }
    CalData.setAttr(selectCal.id, "start", this.checked);
});
$("#prop_calEnd").bind("click", function(){
    var selectCal = CalData.getSelect();
    if(!selectCal.id)return;
    if(this.checked){
        $("#"+selectCal.id).parent().addClass("cal_end");
    }else{
        $("#"+selectCal.id).parent().removeClass("cal_end");
    }
    CalData.setAttr(selectCal.id, "end", this.checked);
});

function getDiagramNodeData(bid){
    var dgData = Diagrams.getData();
    var rtnObj = {};
    dgData.nodes.map(function(d,i){
        if(d.id == bid){
            rtnObj = d;
        }
    });
    return rtnObj;
}

function initNodeProp(){
    $("#prop_blockIdInput").val("");
    $("#prop_blockNmInput").val("");
    $("#prop_blockWidthInput").val("");
    $("#prop_blockHeightInput").val("");
    $("#prop_blockXInput").val("");
    $("#prop_blockYInput").val("");

    $("#prop_blockColor").spectrum("set", "#000000");
    $("#prop_blockStroke").val("");
    $("#prop_blockStrokeWidth").val(2);
    Layout.setBlock({});
}

function nodeSelect(obj){
    console.log(obj);
    if(obj == null){
        initNodeProp();
        return;
    }

    var bid = obj.id;
    Layout.setBlock(obj);
    var nodeObj = obj;
    var objType = "node";
    if(!nodeObj.type){
        objType = "line";
    }
    $("#prop_blockIdInput").val(bid||"");
    if(objType == "node"){
        $("#prop_blockNmInput").val(nodeObj.name||"");
        $("#prop_blockWidthInput").val(nodeObj.width||"");
        $("#prop_blockHeightInput").val(nodeObj.height||"");
        $("#prop_blockXInput").val(nodeObj.x||"");
        $("#prop_blockYInput").val(nodeObj.y||"");
    }
    $("#prop_blockStroke").val(nodeObj.stroke);
    $("#prop_blockStrokeWidth").val(nodeObj.strokeWidth||2);
    $("#prop_blockColor").spectrum("set", nodeObj.color||"#000000");
    $('#rightTab_block').tab('show');
}
function calClick(id){
    var d = CalData.getCalById(id);
    CalData.setSelect(d);

    $("#prop_calStart").get(0).checked = $("#"+id).parent().hasClass("cal_start");
    $("#prop_calEnd").get(0).checked = $("#"+id).parent().hasClass("cal_end");
    
    $("#cal-group").find(".calDiv").removeClass("select");
    $("#"+id).parent().addClass("select");
    
    $("#prop_calFormula").val("="+d.fm);
    $("#prop_calValue").val($("#"+id).val());
    $("#prop_calName").val(d.nm||"");

    $('#rightTab_cal').tab('show');

    setCalBlockSelect(d.bl);
    console.log(CalData.getCals());

}

function setFormula(v){
    var d = CalData.getSelect();
    if(d.id){
        var val = $.trim(v);
        $("#"+d.id).val(val);
        CalData.setAttr(d.id, "fm", val.replace("=",""));
    }
}

function setCalName(v){
    var d = CalData.getSelect();
    if(d.id){
        var val = $.trim(v);
        CalData.setAttr(d.id, "nm", val);
    }
}

function cfn_setSelect(s,v){
    var opt = [];
    v.map(function(d, i){
        var selected = (d.select)?"selected":"";
        opt.push("<option value='"+d.code+"' "+selected+">"+d.name+"</option>");
    });
    $(s).html("<option value=''>Select</option>");
    $(s).append(opt);
    return $(s);
}

function setCalBlockSelect(sId){
    var select = [];
    var diagramData = Diagrams.getData();
    diagramData.nodes.map(function(d, i){
        select.push({code:d.id,name:d.name||d.id,select:sId == d.id?true:false});
    });
    var blockSelect = cfn_setSelect("#prop_blockSelect", select);
}

$("#prop_blockSelect").bind("change", function(){
    if(this.value != ""){
        var d = CalData.getSelect();
        CalData.setAttr(d.id, "bl", this.value);
    }
});

$("#prop_calName").bind("keyup", function(e){
    if(e.keyCode == "13"){
        setCalName(this.value);
    }
});

$("#prop_calName").bind("blur", function(e){
    setCalName(this.value);
});

$("#prop_calFormula").bind("keyup", function(e){
    if(e.keyCode == "13"){
        setFormula(this.value);
    }
});

$("#prop_calFormula").bind("blur", function(e){
    setFormula(this.value);
});

$("#prop_calRemove").bind("click",function(){
    var selectCal = CalData.getSelect();
    $("#"+selectCal.id+"_div").remove();
    CalData.delCalById(selectCal.id);
});

//Test
$("#prop_calCal2").bind("click", function(){
    var selectCal = CalData.getSelect();
    
    $("#"+selectCal.id).val($("#prop_calValue").val());
    $("#"+selectCal.id).attr("data-formula", $("#prop_calValue").val());
    rules.init();
});

$("#prop_calCal").bind("click", function(){
    var selectCal = CalData.getSelect();
    Cal.refresh();

    /*
    if(selectCal.end){
        var rc = Cal.reverse(selectCal.id, $("#prop_calValue").val());
        console.log(rc.x)
        if(rc){
            $("#"+rc.skey).val(rc.x);
            $("#"+rc.skey).attr("data-formula", rc.x);
            rules.reload();
        }
    }else{
        //CalData.setAttr(selectCal.id, "ofm", $("#"+selectCal.id).attr("data-formula"));
        $("#"+selectCal.id).val($("#prop_calValue").val());
        $("#"+selectCal.id).attr("data-formula", $("#prop_calValue").val());
        rules.reload();
        console.log(CalData.getCals());
    }
    */
});

$("#prop_calRev").bind("click", function(){
    var selectCal = CalData.getSelect();
    var rc = Cal.reverse(selectCal.id, $("#prop_calValue").val());
    console.log("reverse start");
    console.log("val : "+$("#prop_calValue").val());
    console.log(rc);
    console.log("reverse end");
    if(rc){
        $("#"+rc.skey).val(rc.x);
        $("#"+rc.skey).attr("data-formula", rc.x);
        rules.init();
    }
});

$("#prop_calSave").bind("click", function(e){
    window.cals = CalData.save();
});

$("#prop_calOpen").bind("click", function(){
    Cal.destory();
    Cal.open(window.cals);
});

$("#firstLoading").hide();

function window_resize(){
    var winHeight = window.innerHeight||document.body.clientHeight;
    if(parseInt(winHeight) < 1){
        winHeight = document.body.clientHeight;
    }
    $("#container").height(winHeight-86);
    //$("#svg-container").height(winHeight-86);
    $("#svg-container").width(2000);
    $("#svg-container").height(2000);
}
window_resize();
$(window).bind("resize", function(){
    window_resize();
});

function layout_init(){
    Cal.destory();
    $("#prop_blockColor").spectrum({
        color: "#000000",
        showPalette: true,
        palette: [
            ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
            ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ]
    });
    $("#prop_blockColor").bind("change", function(){
        var selectNode = Layout.getBlock();
        if(selectNode){
            selectNode.color = this.value;
            Diagrams.updateNode();
        }
    });
    $("#slider").slider({
        min : 0,
        max : 20,
        value : 10,
        slide: function(event, ui) {
            var panZoomTiger = svgPanZoom('#diagram');
            var zoom = ui.value/10;
            panZoomTiger.zoom(zoom);
        }
    });
    $("#zoomReset").bind("click", function(){
        var panZoomTiger = svgPanZoom('#diagram');
        $("#slider").slider( "value", 10);
        panZoomTiger.zoom(1);
    });
    window.onload = function() {
        var svgActive = false, svgHovered = false;
        window.panZoom = svgPanZoom('#diagram', {zoomEnabled: true, controlIconsEnabled: false,mouseWheelZoomEnabled: false, dblClickZoomEnabled:false, center:true});
    };
}

layout_init();