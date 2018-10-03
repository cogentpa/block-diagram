$("#propModal").on("show.bs.modal", function (e) {
    $("#propPageNm").val(Layout.getPageInfo("name"));
    $("#bgWidth").val($("#svg-container").width());
    $("#bgHeight").val($("#svg-container").height());
    Layout.setPageInfo("width",$("#svg-container").width());
    Layout.setPageInfo("height", $("#svg-container").height());
});
$("#newModal_newBtn").bind("click", function(){
    Diagrams.setData({});
    Diagrams.updateNode();
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

var rules = new ruleJS("cal-group");
rules.init();

function calClick(id){
    var d = CalData.getCalById(id);
    CalData.setSelect(d);
    $("#prop_calFormula").val(d.fm);
    $("#prop_calValue").val(d.val);
}

$("#prop_calFormula").bind("keyup", function(e){
    /*
    var val = this.value;
    var selectCal = CalData.getSelect();
    var calObj = {id:selectCal.id, val:selectCal.val,fm:val,no:selectCal.no};
    CalData.setCalById(selectCal.id, calObj);
    //var calGroup = d3.select("#diagram").select(".viewport").select("#cal-group");
    $("#"+selectCal.id).find(".cal_fm").val(val);
    var input = this;
    if(e.keyCode == "13"){
        var formula = val;
        console.log(input)
        var parsed = rules.parse(formula, input);
        if (parsed.result !== null) {
            $("#prop_calValue").val(parsed.result);
            //$("#"+selectCal.id).find(".cal_text").text(parsed.result);
        }

        if (parsed.error) {
            alert(parsed.error);
        }
    }
    */
});

$("#prop_calValue").bind("keyup", function(){
    /*
    var val = this.value;
    var selectCal = CalData.getSelect();
    var calObj = {id:selectCal.id, val:val,fm:selectCal.fm,no:selectCal.no};
    CalData.setCalById(selectCal.id, calObj);
    //var calGroup = d3.select("#diagram").select(".viewport").select("#cal-group");
    $("#"+selectCal.id).find(".cal_text").text(val);
    //$("#"+selectCal.id).find(".cal_val").val(val);
    */
});






function drawBlock(ty){
    if(ty == "item0"){
        Diagrams.addBox({type:"rect",x:50,y:50,width:200,height:50});
    }else if(ty == "item1"){
        Diagrams.addBox({type:"rect",x:200,y:50,width:100,height:100});
    }else if(ty == "item2"){
        Diagrams.addBox({type:"mb",x:150,y:50,width:100,height:30,mb:[1,1,1]});
    }else if(ty == "item3"){
        var calNo = CalData.getCalNo();
            var calId = "cal_"+calNo;
            /*
            var calGroup = d3.select("#diagram").select(".viewport").select("#cal-group");
            var calG = calGroup.append("g").attr("class", "cal_node").attr("id",calId);
            
            var cnt = $("#cal-group").find(".cal_node").length;
            
            calG.attr("transform", 'translate('+(110*cnt)+' 50)')
            
            var rect = calG.append("rect")
                .attr("width", 100)
                .attr("height", 30)
                .attr("x", 0)
                .attr("y",0)
                //.attr("y", 50)
                .attr("fill", "transparent")
                .attr("stroke-width", 1)
                .attr("stroke", "#595959");

            var text = calG.append("text")
                .text("Cal Input")
                .attr("class","cal_text")
                .attr("x", 5)
                .attr("y", 20);
                
            var fm = calG.append("input")
                .attr("value", "")
                .attr("class", "cal_fm")
                .attr("data-formula","")
                .attr("id", calNo);
            
            var input = calG.append("input")
                .attr("value", "")
                .attr("class", "cal_val")
                .attr("id", "calVal_"+calNo);
            
            var noGroup = calG.append("g").attr("transform", 'translate(100 0)');

            var circle = noGroup.append("circle")
                .attr("class", "cal_no")
                .attr("fill", "red")
                .attr("stroke-width", 3)
                .attr("stroke", "red")
                .attr("r", 15)
                .attr("cx", 0)
                .attr("cy", 0)
            
            var circle_no = noGroup.append("text")
                .text(calNo)
                .attr("fill", "#fff")
                .attr("x", 0)
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle");
            */
            CalData.setCalById(calNo, {id:calNo,val:"",fm:""});
            
            var calDiv = $("<div/>").attr("class","calDiv");
            var calNoDiv = $("<div/>").attr("class","calNo").html(calNo);
            var calInput = $("<input/>").attr("id", calNo).attr("type", "text");
            calDiv.append(calNoDiv)
            calDiv.append(calInput);
            calDiv.draggable();
            $("#cal-group").append(calDiv);
            rules.addItem(calInput.get(0))
            //rules.parse("=C1", calInput.get(0));
            
            calInput.bind("blur", function(){
                CalData.setCalById(calNo, {id:calNo,val:this.value,fm:this.getAttribute("data-formula")});
            });
            calDiv.bind("click", function(){
                var selectCal = CalData.getCalById(calNo);
                $("#prop_calFormula").text("="+selectCal.fm);
                $("#prop_calValue").val(selectCal.val);
            });
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
function cfn_setSelect(s,v){
    var opt = [];
    v.map(function(d, i){
        opt.push("<option value='"+d.code+"'>"+d.name+"</option>");
    });
    $(s).html("<option value=''>Select</option>");
    $(s).append(opt);
    return $(s);
}

/* Property cal */
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

function blockSelect(obj){
    var bid = obj.id;
    Layout.setBlock(obj);
    //Layout.setBlockId(bid);
    //if(Layout.getBlockNm(bid) == ""){
        //Layout.setBlockNm(bid, bid);
    //}
    //var arrCal = CalData.getBlockById(bid);
    //setCalTypeList(arrCal);
    //getBlockProp(bid);

    var nodeObj = obj;

    $("#prop_blockIdInput").val(bid||"");
    $("#prop_blockNmInput").val(nodeObj.name||"");

    
    $("#prop_blockWidthInput").val(nodeObj.width||"");
    $("#prop_blockHeightInput").val(nodeObj.height||"");
    $("#prop_blockXInput").val(nodeObj.x||"");
    $("#prop_blockYInput").val(nodeObj.y||"");
    
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

console.log(Layout.getPageInfo())

setCalType();

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