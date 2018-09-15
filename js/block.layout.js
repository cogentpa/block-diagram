var Layout = function (){
    var api = {};
    var info = {
        block : {
            selectId:"",
            inBlocks:[],
            outBlocks:[],
            names:{}
        }
    }
    function setName(id, nm){
        info.block.names[id] = nm;
    }
    function getName(id){
        return info.block.names[id];
    }
    function setBlockId(id){
        info.block.selectId = id;
        info.block.inBlocks = [];
        info.block.outBlocks = [];

        var diagramData = Diagrams.getData();
        diagramData.links.map(function(d, i){
            if(d.target == id){
                var nm = getBlockNm(d.target);
                info.block.inBlocks.push(d.source);
            }
            if(d.source == id){
                var nm = getBlockNm(d.source);
                info.block.outBlocks.push(d.target);
            }
        });
    }
    function getBlockNm(id){
        return info.block.names[id];
        /*
        var diagramData = Diagrams.getData();
        var nm = "";
        diagramData.nodes.map(function(d, i){
            if(d.id == id){
                nm = d.name;
            }
        });
        */
        return nm;
    }
    function getBlockInfo(){
        return info.block;
    }
    function getBlockId(id){
        return info.block.selectId;
    }
    function getId(t){
        return t+"_"+parseInt(Math.random()*1000);
    }
    api.setName = setName;
    api.getName = getName;
    api.getBlockInfo = getBlockInfo;
    api.setBlockId = setBlockId;
    api.getBlockId = getBlockId;
    api.getId = getId;
    return api;
}();

$("#propModal").on("show.bs.modal", function (e) {
    $("#bgWidth").get(0).value = $("#svg-container").width();
    $("#bgHeight").get(0).value = $("#svg-container").height();
});
$("#newModal_newBtn").bind("click", function(){
    $("#svg-container").find("g").html("");
});
$("#propModal_applyBtn").bind("click", function(){
    $("#svg-container").width($("#bgWidth").get(0).value);
    $("#svg-container").height($("#bgHeight").get(0).value);
    $("#propModal").modal('hide');
});
$("#leftMenus").find("li.item-menu").each(function(){
    $(this).bind("click", function(){
        var _item = $(this);
        if(_item.hasClass("item0")){
            drawBlock("item0");
        }else if(_item.hasClass("item1")){
            drawBlock("item1");
        }else if(_item.hasClass("item2")){

        }
    });
});

var svg = d3.select("#diagram");
var blockItems = {
    "item0":{id:"block1", title:"Block1", x:200, y:50, t:"rect",w:"100",h:"50"},
    "item1":{id:"block2", title:"Block2", x:200, y:100, r:50, t:"circle"}
};

function drawBlock(ty){
    if(ty == "item0"){
        Diagrams.addBox({type:"rect",x:"50",y:"50",width:"200",height:"50"});
    }else if(ty == "item1"){
        Diagrams.addBox({type:"rect",x:"200",y:"50",width:"100",height:"100"});
    }else if(ty == "item2"){
        Diagrams.addBox({type:"mb",x:"150",y:"50",width:"200",height:"50"});
    }
    /*
    var blockItem = [blockItems[ty]];
    var draw = svg.selectAll("use").data(blockItem).enter();
    if(blockItems[ty].t == "rect"){
        draw.append("rect")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d) { return d.w; })
        .attr("height", function(d) { return d.h; })
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", "1px").call(drag);
    }else if(blockItems[ty].t == "circle"){
        draw.append("circle")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", function(d) { return d.r; })
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", "1px").call(drag);
    }
    */
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
function cfn_setSelect(s,v){
    var opt = [];
    for(var key in v){
        opt.push("<option value='"+key+"'>"+v[key]["nm"]+"</option>");
    }
    $(s).html("<option value=''>Select</option>");
    $(s).append(opt);
    return $(s);
}

/* Property cal */
function setCalType(){
    var calType = CalData.getTypes();
    var select = cfn_setSelect("#prop_calTypeSelect", calType);
}
setCalType();

function getBlockProp(blockId){
    var inBlock = [{"code":"0","name":"Block0"},{"code":"1","name":"Block1"},{"code":"2","name":"Block2"}];
    var outBlock = [{"code":"3","name":"Block3"},{"code":"4","name":"Block4"},{"code":"5","name":"Block5"}];
    var inSelect = cfn_setSelect("#prop_inBlockSelect", inBlock);
    var outSelect = cfn_setSelect("#prop_outBlockSelect", outBlock);
}

function rmCalType(el){
    $(el).parents("a").remove();
    CalData.delCalById($(el).parents("a").attr("bl"),$(el).parents("a").attr("cal"));
    console.log(CalData.getCals());
}

function makeCalTypeItem(obj){
    /*
    {
            calInId:"cal_123456",
            calOutId:"cal_123456",
            inBl:"0",
            bl:"3",
            outBl:"2",
            inBlNm:"Block0",
            blNm:"Block1",
            outBlNm:"Block2",
            calTy:"cal0",
            calNm:"UV-ox-2"
            in:200,
            out:180
        }
    */
    var itemHtml = '<a href="javascript:void(0)" class="list-group-item list-group-item-action flex-column align-items-start" cal="'+obj.calId+'" bl="'+obj.bl+'">'
                 + '<div class="d-flex w-100 justify-content-between">'
                 + '<h5 class="mb-1">'+CalData.getName(obj.calId)+'</h5>'
                 + '<small><i class="far fa-trash-alt remove" onclick="rmCalType(this)"></i></small>'
                 + '</div>'
                 + '<p class="mb-1">In : '+Layout.getName(obj.inBlId)+' ('+obj.in+')</p>'
                 + '<p class="mb-1">Out : '+Layout.getName(obj.outBlId)+' ('+obj.out+')</p>'
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
$("#prop_blockNmInput").bind("keyup", function(){
    Layout.setName(Layout.getBlockId(), $("#prop_blockNmInput").val());
});

function blockSelect(bid){
    Layout.setBlockId(bid);
    var arrCal = CalData.getBlockById(bid);
    setCalTypeList(arrCal);
    getBlockProp();
    $("#prop_blockNmInput").val(Layout.getName(bid)||"");
    console.log(Layout.getBlockInfo())
    
    /*
    $.ajax({
         url: "/blockDiagram/blockDiagram_001_mst",
         data : {
             diagramId : $("#diagram_id").val(),
             GRP_CODE   : "G001",
             CODE_FNAME : strCODE_FNAME,
             PAGE_SIZE  : nRowCount,
             CURR_PAGE  : nGoPage
         },
         dataType:"json",
         type: "POST",
         async:false,
         success : function(data){
             console.log(data);
             if(data.KEY == "OK")
            {
            }
            else
            {
            }
         }
    });
    */

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