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
});
$("#mode_view").bind("click", function(){
    $("#mode_design").removeClass("active");
    $(this).addClass("active");
    $("#cal-group").addClass("view");
    $("#node_toolbox").css("visibility","hidden");
    $(".size-point").css("visibility","hidden");
});
$("#leftMenus").find("li.item-menu").each(function(){
    $(this).bind("click", function(){
        var _item = $(this);
        if(_item.hasClass("item0")){
            drawBlock("item0");
        }else if(_item.hasClass("item1")){
            drawBlock("item1");
        }else if(_item.hasClass("item2")){
            drawBlock("item2");
        }else if(_item.hasClass("item3")){
            drawBlock("item3");
            console.log(CalData.getCals());
        }
    });
});

var svg = d3.select("#diagram");

function drawBlock(ty){
    if(ty == "item0"){
        Diagrams.addBox({type:"rect",x:50,y:50,width:120,height:30});
    }else if(ty == "item1"){
        Diagrams.addBox({type:"rect",x:200,y:50,width:100,height:100});
    }else if(ty == "item2"){
        Diagrams.addBox({type:"mb",x:150,y:50,width:100,height:30,mb:[1,1,1]});
    }else if(ty == "item3"){
        var calNo = CalData.getCalNo();
        CalData.setCalById(calNo, {id:calNo,val:"",fm:""});
        var calDiv = Cal.add(calNo);
    }
}
/*
var drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

function dragstarted(d) {
    d3.select(this).raise().classed("active", true);
}

function dragged(d) {
    if(d.t == "circle"){
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }else{
        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
    }
}

function dragended(d) {
    d3.select(this).classed("active", false);
}
*/

/* Common */


/* Property cal */
/*
function setCalType(){
    var calType = CalData.getTypes();
    var selectOpt = [];
    for(var key in calType){
        selectOpt.push({code:key,name:calType[key]["nm"]});
    }
    var select = cfn_setSelect("#prop_calTypeSelect", selectOpt);
}

function getBlockProp(bid){
    var blInfo = Layout.getBlockInfo();
    var inBlocks = blInfo.inBlocks;
    var outBlocks = blInfo.outBlocks;
    var inSelect = [];
    var outSelect = [];
    inBlocks.map(function(d,i){
        inSelect.push({code:d,name:Layout.getBlockNm(d)||d});
    });
    outBlocks.map(function(d,i){
        outSelect.push({code:d,name:Layout.getBlockNm(d)||d});
    });
    var inSelect = cfn_setSelect("#prop_inBlockSelect", inSelect);
    var outSelect = cfn_setSelect("#prop_outBlockSelect", outSelect);
}

function rmCalType(el){
    $(el).parents("a").remove();
    CalData.delCalById($(el).parents("a").attr("bl"),$(el).parents("a").attr("cal"));
    console.log(CalData.getCals());
}

function makeCalTypeItem(obj){
    console.log(Layout.getBlockNm(obj.inBl))
    var itemHtml = '<a href="javascript:void(0)" class="list-group-item list-group-item-action flex-column align-items-start" cal="'+obj.calId+'" bl="'+obj.bl+'">'
                 + '<div class="d-flex w-100 justify-content-between">'
                 + '<h5 class="mb-1">'+CalData.getName(obj.calTy)+'</h5>'
                 + '<small><i class="far fa-trash-alt remove" onclick="rmCalType(this)"></i></small>'
                 + '</div>'
                 + '<p class="mb-1">In : '+Layout.getBlockNm(obj.inBl)+' ('+obj.in+')</p>'
                 + '<p class="mb-1">Out : '+Layout.getBlockNm(obj.outBl)+' ('+obj.out+')</p>'
                 //+ '<small>In : '+obj.in+', Out : </small>'
                 + '</a>'
    return itemHtml;
}

function setCalTypeList(cals){
    var itemHtmls = [];
    cals.map(function(d,i){
        itemHtmls.push(makeCalTypeItem(d));
    });
    $("#prop_calTypeList").html("");
    $("#prop_calTypeList").append(itemHtmls);
}

function addCalTypeItem(bid){
    var calTypeId = $("#prop_calTypeSelect").val();
    var inBlockId = $("#prop_inBlockSelect").val();
    var outBlockId = $("#prop_outBlockSelect").val();

    var itemObj = {
            calId:Layout.getId("cal"),
            calInId:Layout.getId("cal_in"),
            calOutId:Layout.getId("cal_out"),
            inBl:inBlockId,
            bl:bid,
            outBl:outBlockId,
            calTy:calTypeId,
            in:200,
            out:180
    }
    $("#prop_calTypeList").append(makeCalTypeItem(itemObj));  
    CalData.addBlockById(bid, itemObj);
    console.log(CalData.getCals());    
}

$("#prop_calTypeAddBtn").bind("click", function(){
    addCalTypeItem(Layout.getBlockId());                 
});
$("#prop_inBlockSelect").bind("change", function(){
    var selectId = Layout.getBlockId();
    if(this.value != ""){
        var calId = "#txt-in-"+this.value+"-"+selectId;
        $("#prop_inValue").val($(calId).text());
    }
});
$("#prop_outBlockSelect").bind("change", function(){
    var selectId = Layout.getBlockId();
    if(this.value != ""){
        var calId = "#txt-out-"+selectId+"-"+this.value;
        $("#prop_outValue").val($(calId).text());
    }
});
*/


//Block Info Event
$("#prop_blockNmInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    selectNode.name = this.value;
    Diagrams.updateNode();
});
$("#prop_blockWidthInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    selectNode.width = parseInt(this.value);
    Diagrams.updateNode();

});
$("#prop_blockHeightInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    selectNode.height = parseInt(this.value);
    Diagrams.updateNode();
});
$("#prop_blockXInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    selectNode.x = parseInt(this.value);
    Diagrams.updateNode();
});
$("#prop_blockYInput").bind("blur", function(){
    var selectNode = Layout.getBlock();
    selectNode.y = parseInt(this.value);
    Diagrams.updateNode();
});


//Calculate Event
$("#prop_calStart").bind("click", function(){
    var selectCal = CalData.getSelect();
    if(this.checked){
        $("#"+selectCal.id).parent().addClass("cal_start");
    }else{
        $("#"+selectCal.id).parent().removeClass("cal_start");
    }
    CalData.setAttr(selectCal.id, "start", this.checked);
    console.log(CalData.getCals());
});
$("#prop_calEnd").bind("click", function(){
    var selectCal = CalData.getSelect();
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

function nodeSelect(obj){
    if(obj == null)return;
    var bid = obj.id;
    Layout.setBlock(obj);
    var nodeObj = obj;

    $("#prop_blockIdInput").val(bid||"");
    $("#prop_blockNmInput").val(nodeObj.name||"");

    $("#prop_blockWidthInput").val(nodeObj.width||"");
    $("#prop_blockHeightInput").val(nodeObj.height||"");
    $("#prop_blockXInput").val(nodeObj.x||"");
    $("#prop_blockYInput").val(nodeObj.y||"");
    $('#rightTab_block').tab('show');

    console.log(Layout.getBlockInfo());
}

$("#firstLoading").hide();

function window_resize(){
    var winHeight = window.innerHeight||document.body.clientHeight;
    if(parseInt(winHeight) < 1){
        winHeight = document.body.clientHeight;
    }
    $("#container").height(winHeight-76);
}
window_resize();
$(window).bind("resize", function(){
    window_resize();
});

function init(){
    Cal.destory();
}

init();

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
    var val = $.trim(v);
    $("#"+d.id).val(val);
    CalData.setAttr(d.id, "fm", val.replace("=",""));
}

function setCalName(v){
    var d = CalData.getSelect();
    var val = $.trim(v);
    CalData.setAttr(d.id, "nm", val);
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

