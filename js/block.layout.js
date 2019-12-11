var rules = Cal.init();

var extNodes = {
    cal : function(){
        var cal = new Node();

        cal.draw = function(svgObj, data){

            data.nConn = true;

            this.drawPath(svgObj, data);
        };
        cal.leftRoundedRect = function(x, y, width, height, radius) {
            return "M" + (x + radius) + "," + y
                 + "h" + (width - radius)
                 + "v" + height
                 + "h" + (radius - width)
                 + "a" + radius + "," + radius + " 0 0 1 " + (-radius) + "," + (-radius)
                 + "v" + (2 * radius - height)
                 + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + (-radius)
                 + "z";
        };

        cal.drawPath = function(svgObj, data){
            var path = svgObj.append("path");
            path.attr("d", this.leftRoundedRect(0,0,data.width,data.height,data.height/2))
                .attr("stroke-width", 1)
                .attr("class",function(){
                    var classStr = "calNo";
                    if(data.isStart)classStr += " cal_start";
                    if(data.isEnd)classStr += " cal_end";
                    return classStr;
                });
            var value = data.name;
            if(!isNaN(value) && data.fixed){
                value = (value*1).toFixed(data.fixed);
            }

            svgObj.append("rect")
                .attr("x", data.height)
                .attr("y", 0)
                .attr("width", data.width-data.height)
                .attr("height", data.height)
                .attr("class", "cal_rect")
                .attr("fill", "#FFF");
            svgObj.append("text")
                .attr("x", data.height/2)
                .attr("y", data.height/2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "#fff")
                .attr("class", "cal_id")
                .style("font-size", "14px")
                .text(data.id);
            svgObj.append("text")
                .attr("x", data.height+5)
                .attr("y", data.height/2)
                .attr("dominant-baseline", "middle")
                .attr("fill", "#000")
                .style("font-size", "14px")
                .text(value);
        };
        cal.fnAdd= function(data){
            var calNo = CalData.getCalNo();
            data.id = calNo;
            CalData.setCalById(calNo, {id:calNo,val:"",fm:""});
            Cal.add(calNo, {x:data.x,y:data.y});
        };
        cal.fnDel= function(data){
            $("#"+data.id+"_div").remove();
            CalData.delCalById(data.id);
        };

        return cal;
    },
    table : function(){
        var table = new Node();
        var cellDragHandler = {
            dragged: false,
            startCell: null,
            startRowIdx: 0,
            endRowIdx: 0,
            startColIdx: 0,
            endColIdx: 0,
            Unpainted: true,   //드래그시 그려진지 체크
            cellMouseEnter: function(d){
                if(this.startCell){
                    this.Unpainted = true;
                    
                    if(d.rIdx < this.startCell.rIdx){
                        cellDragHandler.startRowIdx = d.rIdx;
                        cellDragHandler.endRowIdx = this.startCell.rIdx;

                    } else {
                        cellDragHandler.endRowIdx = d.rIdx;
                    }

                    if(d.cIdx < this.startCell.cIdx){
                        cellDragHandler.startColIdx = d.cIdx;
                        cellDragHandler.endColIdx = this.startCell.cIdx;
                    } else {
                        cellDragHandler.endColIdx = d.cIdx;
                    }

                    if(cellDragHandler.startRowIdx > this.startCell.rIdx || cellDragHandler.startColIdx > this.startCell.cIdx){
                        this.startCell = d;
                    }
                }
            }
        }

        function cellDragStartFn(d, data){
            cellDragHandler.dragged = false;
            cellDragHandler.startCell = d;
            cellDragHandler.startRowIdx = d.rIdx;
            cellDragHandler.endRowIdx = d.rIdx + (d.rSpan || 1) - 1;
            cellDragHandler.startColIdx = d.cIdx;
            cellDragHandler.endColIdx = d.cIdx + (d.cSpan || 1) - 1;
            cellDragHandler.Unpainted = true;
        }
        function cellDragFn(d, data, cellG){
            if(cellDragHandler.Unpainted){
                if(!cellDragHandler.dragged){
                    Diagrams.selectItem(data);
                    cellDragHandler.dragged = true;
                }
                let sRowIdx = cellDragHandler.startRowIdx;
                let sColIdx = cellDragHandler.startColIdx;
                let eRowIdx = cellDragHandler.endRowIdx;
                let eColIdx = cellDragHandler.endColIdx;
                //셀 범위 재설정.
                data.cells.forEach(d =>{
                    if((d.rIdx >= sRowIdx && d.rIdx <= eRowIdx) && (d.cIdx >= sColIdx && d.cIdx <= eColIdx)){
                        let tmpRowIdx = d.rIdx + (d.rSpan || 1) - 1;
                        let tmpColIdx = d.cIdx + (d.cSpan || 1) - 1;
                        eRowIdx = tmpRowIdx > eRowIdx ? tmpRowIdx : eRowIdx;
                        eColIdx = tmpColIdx > eColIdx ? tmpColIdx : eColIdx;
                    }
                })
                cellG.classed("dragged", d=>{
                    return ((d.rIdx >= sRowIdx && d.rIdx <= eRowIdx) && (d.cIdx >= sColIdx && d.cIdx <= eColIdx))
                });
                cellDragHandler.endRowIdx = eRowIdx;
                cellDragHandler.endColIdx = eColIdx;
                cellDragHandler.Unpainted = false;
            }
        }
        function cellDragEndFn(d, data){
            if(cellDragHandler.dragged){
                //var table = d3.select("#nd-"+data.id)
                //table.selectAll(".col-"+d.cIdx).classed("selected", true);
                //table.selectAll(".row-"+d.rIdx).classed("selected", true);
                cellDragHandler.dragged = false;
            }
            cellDragHandler.startCell = null;
            data.draggedCell = [ cellDragHandler.startRowIdx, cellDragHandler.startColIdx
                               , cellDragHandler.endRowIdx, cellDragHandler.endColIdx ];
        }

        function cellClick(d, pId, d3El){
            //d3.event.defaultPrevented 이값으로 이벤트 컨트롤 할수 있나...
            if(d3.event && d3.event.ctrlKey) return true;
            //if (d3.event.defaultPrevented) d3.event.stopPropagation();
            //d3.event.stopPropagation();
            var tableD3 = d3.select("#nd-"+ pId)
            tableD3.selectAll(".col-"+d.cIdx).classed("selected", true);
            tableD3.selectAll(".row-"+d.rIdx).classed("selected", true);
            d3El.classed("selected", true);
            calSelect(d.id);
        }
        
        function cellDblClick(d, data, d3El){
            var width =  data.width / data.cols;
            var height = data.height / data.rows
            var frm = d3El.append("foreignObject")
            var cal = CalData.getSelect();
            var value = (cal) ? "=" + cal.fm : cal.val; // TO-DO Cal "=" 기호 관련 fm 개선 
            if(!isNaN(value) && d.fixed){
                value = (value*1).toFixed(d.fixed);
            }
            
            frm.attr("x", (d)=>d.x = d.cIdx*width)
                .attr("y", (d)=>d.y = d.rIdx*height)
                .attr("width", (d.cSpan || 1) * width)
                .attr("height", (d.rSpan || 1)* height);

            
            var input = frm.append("xhtml:input");
            input.attr("class", "tb-input")
                .style("width", "100%")
                .style("height", "100%")
                .style("font-size", "14px")
                .attr("value", value)
                .on("change", function(){
                    var value = (this.value || "").toUpperCase();
                    setFormula(value);
                    d.name = value;
                    if(!isNaN(value) && d.fixed){
                        value = (value*1).toFixed(d.fixed);
                    }
                    d3El.select("text").text(value);
                    table.addUndo(); // redraw 안하고 undo에만 저장
                })
                .on("blur", function(){
                    frm.remove();
                })
                .on("mousedown", function(){
                    d3.event.stopImmediatePropagation();
                })
                .on("keydown", function(){
                    var keyCode = d3.event.keyCode;
                    if(keyCode === 13){
                        this.blur();
                    }
                })
                ;

                var inputNode = input.node();
                inputNode.focus();
                inputNode.setSelectionRange(value.length, value.length);
                

        }

        table.draw = function(svgObj, data){
            //data.nConn = true;
            //최소 사이즈 설정
            data.height = data.height < data.rows*10 ? data.rows*10 : data.height;
            data.width = data.width < data.cols*20 ? data.cols*20 : data.width;

            if(!data.prefix)data.prefix = CalData.getPrefix();

            this.setCells(data);
            this.drawTitle(svgObj, data);
            this.drawCellIds(svgObj, data);
            this.drawCells(svgObj, data);
            this.drawPath(svgObj, data);

        };

        table.getPathData = function(data){
            var points = [];
            points.push({x:0, y:0});
            points.push({x:data.width, y:0});
            points.push({x:data.width, y:data.height});
            points.push({x:0, y:data.height});
            points.push({x:0, y:0});
            return this.genPath(points);
        };

        table.drawPath = function(svgObj, data){
            var path = svgObj.append("path");
            path.attr("d", this.getPathData(data))
                .attr("fill", "none")
                //.attr("stroke", "red");
        };

        table.drawTitle = function(svgObj, data){
            var titleG = svgObj.append("g").attr("class","table-title").classed("cal_rect", true);
            var rect = titleG.append("rect");
            var text = titleG.append("text")

            rect.attr("x", -18)
                .attr("y", -38)
                .attr("width", data.width+18)
                .attr("height", 20)
                .attr("stroke", "#595959cb")
                .attr("stroke-width", data.strokeWidth)
                .style("opacity", 0.7)
                .classed("calNo", true)
                ;

            text.attr("x",-10)
                .attr("y", -26)
                //.attr("text-anchor", "middle")
                //.attr("dominant-baseline", "middle")
                .text(data.name)
                .attr("fill", "#fff")
                .style("font-size", 10)
                ;
        }
        table.drawCellIds = function(svgObj, data){
            var cols = svgObj.append("g").attr("class","cols").classed("cal_rect", true);
            var rows = svgObj.append("g").attr("class","rows").classed("cal_rect", true);
            var height = data.height / data.rows;
            var hHalf = height / 2;
            var width = data.width / data.cols;
            var wHalf = width / 2;
            var colsData = Array.from(Array(data.cols).keys());
            var rowsData = Array.from(Array(data.rows).keys())//Array.from(Array(data.rows), (e,i)=>i+1);
            var prefix = data.prefix;

            //corner
            svgObj.append("g").classed("cal_rect", true)
                    .append("rect").attr("x", -18).attr("y", -18).attr("width",18).attr("height",18).classed("id-bg", true);
            //cols
            var col = cols.selectAll("g").data(colsData).enter().append("g").attr("class", d=>"col-"+d);

            col.append("rect")
                .attr("x", d=>d*width)
                .attr("y", -18)
                .attr("width", width)
                .attr("height", 18)
                .attr("stroke", "#595959cb")
                .attr("stroke-width", 1)
                .classed("calNo", true)
            ;
            col.append("text")
                .attr("x", d=>d*width+wHalf)
                .attr("y", -8)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "#fff")
                .attr("class", "cal_id")
                .style("font-size", "12px")
                .text(d=>prefix + String.fromCharCode(65+d))
            ;

            //rows
            var row = rows.selectAll("g").data(rowsData).enter().append("g").attr("class", d=>"row-"+d);;
            row.append("rect")
                .attr("x", -18)
                .attr("y", (d)=>d*height)
                .attr("width", 18)
                .attr("height", height)
                .attr("stroke", "#595959cb")
                .attr("stroke-width", 1)
                .classed("calNo", true)
            ;
            row.append("text")
                .attr("x", -9)
                .attr("y", (d)=>d*height+hHalf)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "#fff")
                .attr("class", "cal_id")
                .style("font-size", "12px")
                .text(d=>d+1)
            ;

        }
        table.drawCells = function(svgObj, data){
            var body = svgObj.append("g").attr("class","table-body");
            var cells = data.cells.filter(cell=>!cell.merge);
            var width =  data.width / data.cols;
            var height = data.height / data.rows

            var cellG = body.selectAll(".cell").data(cells).enter().append("g");
            // TO-DO 요청시 tab key로 셀 이동 개발
            //.attr("tabindex", 0); 

            var cellDrag = d3.drag()
                //.filter(() => d3.event.shiftKey)
                .on("start", function(d){cellDragStartFn(d, data)})
                .on("drag", function(d){cellDragFn(d, data, cellG)})
                .on("end", function(d){cellDragEndFn(d, data)});
                
            //셀 기본
            var rect = cellG.append("rect")
                .attr("class", "cell-bg")
                .attr("x", (d)=>d.x = d.cIdx*width)
                .attr("y", (d)=>d.y = d.rIdx*height)
                .attr("width", d=>(d.cSpan || 1) * width)
                .attr("height", d=>(d.rSpan || 1 ) * height)
                .attr("stroke", data.color || "#595959cb")
                .attr("stroke-width", data.strokeWidth)
                //.attr("fill", "#fff")
            ;
            if(data.stroke){
                rect.attr("stroke-dasharray", StokeStyle[data.stroke]);
            }
            //text
            cellG.append("text")
                .attr("x", d=>d.x + ((d.cSpan || 1) * width/2))
                .attr("y", d=>d.y + ((d.rSpan || 1) * height/2))
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "#000")
                .style("font-size", "14px")
                .text(d=>{
                    var value = d.name;
                    if(value !=="" && !isNaN(value) && d.fixed){
                        value = (value*1).toFixed(d.fixed);
                    }
                    return value;
                })
            ;

            cellG.attr("data-id", d=>d.id)
                .call(cellDrag)
                .on("mouseenter", function(d){cellDragHandler.cellMouseEnter(d)})
                .on("click", function(d){cellClick(d, data.id, d3.select(this))}, true)
                .on("dblclick", function(d){cellDblClick(d, data, d3.select(this))}, true)
                .on("keypress", function(d){})
                ;
        }

        table.setCells = function(data){
            var rows = data.rows;
            var cols = data.cols;
            var cells = data.cells;
            var rIdx,cIdx;
            
            //row 증가
            if(data.currRows < rows){
                for(rIdx=data.currRows;rIdx<rows; rIdx++){
                    for(cIdx=0;cIdx<data.currCols;cIdx++){
                        cells.push({rIdx:rIdx,cIdx:cIdx,id:this.calAdd(data.prefix, rIdx, cIdx)})
                    }
                }
            }

            //col 증가
            if(data.currCols < cols){
                for(cIdx=data.currCols;cIdx<cols; cIdx++){
                    for(rIdx=0;rIdx<rows;rIdx++){
                        cells.push({rIdx:rIdx,cIdx:cIdx,id:this.calAdd(data.prefix, rIdx, cIdx)})
                    }
                }
            }

            //현재 설정된 cols,rows보다 큰 셀 제거
            if(data.currRows > rows || data.currCols > cols){
                data.cells = cells.filter( e=> {
                    if(e.rIdx < rows && e.cIdx < cols){
                        return true;
                    } else {
                        this.calDel(e.id);
                        return false;
                    }
                });
            }

            //가로 정렬후 같은 가로시 세로로 정렬
            data.cells.sort((a,b) => {
                return a.rIdx === b.rIdx ? a.cIdx - b.cIdx : a.rIdx - b.rIdx;
            })


            data.currCols = data.cols;
            data.currRows = data.rows;
        }

        table.calAdd = function(prefix, rIdx, cIdx){
            var calNo = prefix + String.fromCharCode(65+cIdx)+(rIdx+1);
            CalData.setCalById(calNo, {id:calNo,val:"",fm:""});
            Cal.add(calNo, {x:0,y:0});
            return calNo;
        };
        
        table.calDel = function(id){
            $("#"+id+"_div").remove();
            CalData.delCalById(id);
        };
        table.fnCopy = function(data){
            delete data.prefix;
            data.currRows = 0;
            data.currCols = 0;
            data.cells = [];
        }
        table.fnDel = function(data){
            data.cells.forEach(cell => {
                this.calDel(cell.id);
            })
        }
        table.fnSelect = function(data){
            var node = d3.select("#nd-"+data.id);
            node.selectAll(".selected").classed("selected", false);
            node.selectAll(".dragged").classed("dragged", false);
            if(data.selectedCell){
                var cellData = data.cells.find(cell => cell.id === data.selectedCell);
                data.selectedCell = "";
                if(cellData){
                    var gNode = node.selectAll(".table-body>g[data-id="+cellData.id+"]").node();
                    var evt = new MouseEvent('click', {bubbles: true, cancelable: true,view: window});
                    gNode.dispatchEvent(evt);
                    //cellClick(cellData, data, );
                }
            }
        }
        table.fnSave = function(data){
            delete data.draggedCell;
            delete data.selectedCell;
        }

        return table;
    }
};

function setCalNodeValue(){
    var diagramData = Diagrams.getData();
    var calList = [];

    diagramData.nodes.forEach( d => {
        if(d.type === "cal"){
            calList.push(d);
        } else if(d.type === "table"){
            calList = calList.concat(d.cells);
        }
    })

    $("#cal-group").find(".calInput").each(function(){
        var id = this.id;
        var value = this.value;
        for(let i = 0; i< calList.length; i++){
            if(calList[i].id == id){
                calList[i].name = value;
                return;
            }
        }
    });
    //var selectNode = Layout.getBlock();
    Diagrams.updateNode();
    Diagrams.selectItem();
    /*if(selectNode.type && selectNode.id){
        Diagrams.selectItem(selectNode);
    }
    */
}

function calUndoCallback(param){
    var calDataString = "{}";
    if(param === "add"){
        calDataString = JSON.stringify(CalData.save());
    }else{
        Cal.destory();
        Cal.open(JSON.parse(param));
    }
    return calDataString;
}

$("#newModal_newBtn").on("click", function(){
    Diagrams.setData({});
    Cal.destory();
    $("#newModal").modal('hide');
});

$("#mode_design").on("click", function(){
    $("#mode_view").removeClass("active");
    $(this).addClass("active");
    $("#cal-group").removeClass("view");
    $("#svg-container").removeClass("view");
});
$("#mode_view").on("click", function(){
    $("#mode_design").removeClass("active");
    $(this).addClass("active");
    $("#cal-group").addClass("view");
    $("#svg-container").addClass("view");
});

$("#printSvg").on("click", function(){
    printArea();
});

$("#leftMenus").find("li.item-menu").each(function(){
    $(this).on("click", function(){
        var _item = $(this);
        var targetEl = document.querySelector("#svg-container");
        var x = targetEl.scrollLeft + 50;
        var y =targetEl.scrollTop + _item.position().top + 10;

        var transform = $("#diagram>.viewport").attr("transform") || "";
        var scale = (transform.match(/scale\((-?\d+\.?\d*)\)/)[1] || 1)*1;
        
        x /= scale;
        y /= scale;

        if(_item.hasClass("item0")){
            Diagrams.addBox({type:"rect",x:x,y:y,width:100,height:40});
        }else if(_item.hasClass("item1")){
            Diagrams.addBox({type:"circle",x:x,y:y,width:100,height:100});
        }else if(_item.hasClass("item2")){
            Diagrams.addBox({type:"mb",x:x,y:y,width:100,height:30,mb:[]});
        }else if(_item.hasClass("item3")){
            Diagrams.addBox({type:"rect",x:x,y:y,width:100,height:40,isStart:true});
        }else if(_item.hasClass("item4")){
            Diagrams.addBox({type:"rect",x:x,y:y,width:100,height:40, isEnd:true});
        }else if(_item.hasClass("item5")){
            Diagrams.addBox({type:"pou",x:x,y:y,width:100,height:100});
        }else if(_item.hasClass("item6")){
            Diagrams.addBox({type:"tb",x:x,y:y,width:100,height:20});
        }else if(_item.hasClass("item7")){
            Diagrams.addBox({type:"scope",x:x,y:y,width:30,height:60});
        }else if(_item.hasClass("itemC")){
            Diagrams.addBox({type:"cal",x:x,y:y,width:100,height:28});
        }else if(_item.hasClass("itemTable")){
            Diagrams.addBox({type:"table",x:x,y:y,width:200,height:40,name:"Calc Table",cols:2,rows:2,currCols:0,currRows:0,cells:[]});
        }
    });
});


//TO-DO prop 생성/이벤트/적용 구조화
function setNodeProp(key, value, fn){
    var nodes = Layout.getBlock();
    var currNodes = Diagrams.getSelects();
    
    nodes.forEach(function(node){
        if(node.id){
            node[key] = value;
            if(fn)fn(node, value);
        }
    });

    Diagrams.updateNode();
    Diagrams.selectItem(null, nodes !== currNodes);
}

var svg = d3.select("#diagram");

$("#prop_blockNmInput").on("change", function(e){
    setNodeProp("name", this.value);
});

$("#prop_blockDtlTypeInput").on("change", function(e){
    setNodeProp("dtlType", this.value, function(node, value){
        if(!node.name) node.name = value;
    });
});

$("#prop_blockWidthInput").on("change", function(){
    setNodeProp("width", parseInt(this.value));
});

$("#prop_blockHeightInput").on("change", function(){
    setNodeProp("height", parseInt(this.value));
});
$("#prop_blockXInput").on("change", function(){
    setNodeProp("x", parseInt(this.value));
});
$("#prop_blockYInput").on("change", function(){
    setNodeProp("y", parseInt(this.value));
});

$("#prop_fill").on("change", function(){
    setNodeProp("fill", ($(this).is(":checked")) ? "" : "none");
});

$("#prop_blockStroke").on("change", function(){
    setNodeProp("stroke", this.value);
});

$("#prop_blockStrokeWidth").on("change", function(){
    setNodeProp("strokeWidth", parseInt(this.value));
});

$("#prop_lineHead").on("change", function(){
    setNodeProp("head", this.value);
});

$("#prop_tableRows").on("change", function(){
    setNodeProp("rows", parseInt(this.value));
});

$("#prop_tableCols").on("change", function(){
    setNodeProp("cols", parseInt(this.value));
});

$("#prop_tableMerge").on("click", function(){
    var selectNode = Layout.getBlock()[0];
    var $dragged = $("#nd-"+selectNode.id).find(".dragged");
    var dCells = selectNode.draggedCell;
    var cells = selectNode.cells;
    if($dragged.length > 1 && dCells && dCells.length === 4){
        //0:StartRow, 1: StartCols, 2:EndRow, 3:EndCols
        if(dCells[0] !== dCells[2] || dCells[1] !== dCells[3]){
            cells.forEach(function(cell){
                if(cell.rIdx === dCells[0] && cell.cIdx === dCells[1]){
                    cell.rSpan = dCells[2] - dCells[0] + 1;
                    cell.cSpan = dCells[3] - dCells[1] + 1;
                } else if (( dCells[0] <= cell.rIdx && dCells[2] >= cell.rIdx ) && ( dCells[1] <= cell.cIdx && dCells[3] >= cell.cIdx )) {
                    cell.merge = true;
                }
            })
            
            Diagrams.updateNode();
            Diagrams.selectItem(selectNode);
        }
    }
});

$("#prop_tableUnMerge").on("click", function(){
    var selectNode = Layout.getBlock()[0];
    var $dragged = $("#nd-"+selectNode.id).find(".dragged");
    var $selected = $("#nd-"+selectNode.id).find(".table-body>.selected");
    var dCells = selectNode.draggedCell;
    var cells = selectNode.cells;
    var sr, sc, er, ec;
    var flag = false;

    if($dragged.length > 0 && dCells && dCells.length === 4){
        sr = dCells[0];
        sc = dCells[1];
        er = dCells[2];
        ec = dCells[3];
        flag = true;
    } else if ($selected.length === 1 ) {
        var cId = $selected.data("id");
        var cell = cells.find(e=>e.id === cId);
        if(cell.rSpan > 1 || cell.cSpan > 1){
            sr = cell.rIdx;
            sc = cell.cIdx;
            er = cell.rIdx + (cell.rSpan||0) - 1;
            ec = cell.cIdx + (cell.cSpan||0) - 1;
            flag = true;
        }
    }

    if(flag){
        //0:StartRow, 1: StartCols, 2:EndRow, 3:EndCols
        cells.forEach(function(cell){
            if (( sr <= cell.rIdx && er >= cell.rIdx ) && ( sc <= cell.cIdx && ec >= cell.cIdx )) {
                cell.merge = false;
                cell.rSpan = 1;
                cell.cSpan = 1;
            }
        });
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});

//삭제버튼
$("#prop_blockRemove").on("click", function(){
    Layout.removeNode();
});

function initNodeProp(){
    $("#prop_blockIdInput").val("");
    $("#prop_blockNmInput").val("");
    $("#prop_blockDtlTypeInput").val("");
    $("#prop_blockWidthInput").val("");
    $("#prop_blockHeightInput").val("");
    $("#prop_blockXInput").val("");
    $("#prop_blockYInput").val("");

    //table
    $("#prop_tableRows").val("");
    $("#prop_tableCols").val("");
    
    $("#prop_fill").prop("checked", true);
    $("#prop_blockColor").spectrum("set", "#000000");
    $("#prop_blockStroke").val("");
    $("#prop_blockStrokeWidth").val(2);
    $("#prop_lineHead").val("head1");
    Layout.setBlock([]);
}

function diagramSelect(){
    var pageInfo = Layout.getPageInfo();
    $('#rightTab_diagram').tab('show');
    $("#propPageNm").val(pageInfo["name"]);
    $("#bgWidth").val(pageInfo["width"]);
    $("#bgHeight").val(pageInfo["height"]);

    $('#prop_calRev').hide();
    $('#prop_calCal2').hide();
}

function diagramChange(){
    Layout.setPageInfo("width", $("#bgWidth").val());
    Layout.setPageInfo("height", $("#bgHeight").val());
    Layout.setPageInfo("name",  $("#propPageNm").val());
    Diagrams.updateNode();
}

function nodeSelect(obj){
    hideCommonProps();

    if(!obj){
        initNodeProp();
        calSelect();
        diagramSelect();
        return;
    }

    Layout.setBlock(obj);
    
    if(obj.length === 1 ) {
        var nodeObj = obj[0];
        if(nodeObj.type === "cal"){
            calSelect(nodeObj.id);
        } else {
            blockSelect(nodeObj);
        }
        showCommonProps(nodeObj);
    } else {
        $("#prop_block_general").hide();
        var styleObj = {};
        styleObj.stroke = "";
        styleObj.strokeWidth = "";
        styleObj.color = "";

        setStyleProp(styleObj)

        $('#rightTab_block').tab('show');
        showCommonProps({});
    }
}

function hideCommonProps(){
    //cal 관련 숨김.
    $('#prop_calRev').hide();
    $('#prop_calCal2').hide();
    $("#prop-table-group").hide();
    $("#prop_blockRemove").hide();
    
}
function showCommonProps(nodeObj){
    $("#prop_blockRemove").show();
    if(nodeObj.type === "table"){
        $("#prop-table-group").show();
        $("#prop_tableRows").val(nodeObj.rows||1);
        $("#prop_tableCols").val(nodeObj.cols||1);
    }
}

function blockSelect(nodeObj){
    var objType = (nodeObj.type) ? "node" : "line";

    //block
    $("#prop_block_general").show();
    $("#prop_blockIdInput").val(nodeObj.id||"");
    if(objType == "node"){
        $("#prop_blockNmInput").val(nodeObj.name||"");
        $("#prop_blockDtlTypeInput").val(nodeObj.dtlType||"");
        $("#prop_blockWidthInput").val(nodeObj.width||"");
        $("#prop_blockHeightInput").val(nodeObj.height||"");
        $("#prop_blockXInput").val(nodeObj.x||"");
        $("#prop_blockYInput").val(nodeObj.y||"");

        $("#prop_blockInfo").html("BLOCK");
        $(".block_prop").show();
        $(".link_prop").hide();
        $("#prop_fill").prop("checked", (nodeObj.fill) ? false : true);
    //link
    } else {
        $("#prop_blockInfo").html("LINK");
        $(".block_prop").hide();
        $(".link_prop").show();
        $("#prop_lineHead").val(nodeObj.head || "head1");
    }
    setStyleProp(nodeObj);
    $('#rightTab_block').tab('show');
}

function setStyleProp(obj){
    $("#prop_blockStroke").val(obj.stroke);
    $("#prop_blockStrokeWidth").val(obj.strokeWidth);
    $("#prop_blockColor").spectrum("set", obj.color || "#000000");
}

function calClick(id){
    Diagrams.selectItem();
    calSelect(id);
}
function calSelect(id){
    var d = CalData.getCalById(id) || {};
    if(id){
        $('#rightTab_cal').tab('show');
        $('#prop_calRev').show();
        $('#prop_calCal2').show();
    }

    CalData.setSelect(d);
    $("#calc-id-text").html(id);
    $("#prop_calStart").get(0).checked = $("#"+id).parent().hasClass("cal_start");
    $("#prop_calEnd").get(0).checked = $("#"+id).parent().hasClass("cal_end");
    
    $("#cal-group").find(".calDiv").removeClass("select");
    $("#"+id).parent().addClass("select");
    
    $("#prop_calFormula").val("="+(d.fm||""));
    $("#prop_calValue").val($("#"+id).val());
    $("#prop_calFixed").val(d.fixed || "");
    $("#prop_calName").val(d.nm||"");
    setCalBlockSelect(d.bl);
}

function setFormula(v){
    var d = CalData.getSelect();
    if(d.id){
        var val = $.trim(v);
        $("#"+d.id).val(val);
        CalData.setAttr(d.id, "fm", val.replace("=",""));
    }
    return d.id;
}

function setCalName(v){
    var d = CalData.getSelect();
    if(d.id){
        var val = $.trim(v);
        CalData.setAttr(d.id, "nm", val);
    }
}

function setCalAttr(key, v){
    var d = CalData.getSelect();
    if(d.id){
        var val = $.trim(v);
        CalData.setAttr(d.id, key, val);
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
        if(d.type !== "cal" && d.type !== "table")select.push({code:d.id,name:(d.name)?d.name+":"+d.id:d.id,select:sId == d.id?true:false});
    });
    var blockSelect = cfn_setSelect("#prop_blockSelect", select);
}

$("#right-diagram input").on("change", function(){
    diagramChange();
});

$("#prop_blockSelect").on("change", function(){
    if(this.value != ""){
        var d = CalData.getSelect();
        CalData.setAttr(d.id, "bl", this.value);
    }
});

$("#prop_calName").on("change", function(e){
    setCalName(this.value);
});

$("#prop_calFormula").on("change", function(e){
    var value = (this.value || "").toUpperCase();
    var calId = setFormula(value);

    var selectNode = Layout.getBlock()[0];
    var currNode = Diagrams.getSelects()[0];
    if(selectNode.type && selectNode.id){
        if(selectNode.type === "table"){
            var cell = selectNode.cells.find(d => d.id === calId);
            if(cell){
                cell.name = value;
                selectNode.selectedCell = cell.id;
            }
        } else {
            selectNode.name = value;
        }
    }
    
    Diagrams.updateNode();
    Diagrams.selectItem(null, selectNode !== currNode);

})
.on("keydown", function(e){
    if(e.keyCode === 13) this.blur();
});

$("#prop_calFixed").on("change", function(e){
    var selectCal = CalData.getSelect();
    if(!selectCal.id)return;
    var selectNode = Layout.getBlock()[0];
    var currNode = Diagrams.getSelects()[0];
    var calId = CalData.getSelect().id;
    var value = this.value;
    var cell;
    CalData.setAttr(selectCal.id, "fixed", value);

    if(selectNode.type === "table"){
        cell = selectNode.cells.find(d => d.id === calId);
        if(cell){
            cell.fixed = value;
            selectNode.selectedCell = cell.id;
        }
    } else {
        selectNode.fixed = value;
    }
    Diagrams.updateNode();
    Diagrams.selectItem(null, selectNode !== currNode);
});

$("#prop_calStart").on("click", function(){
    var selectCal = CalData.getSelect();
    if(!selectCal.id)return;
    if(this.checked){
        $("#"+selectCal.id).parent().addClass("cal_start");
        $("#"+selectCal.id).parent().removeClass("cal_end");
    }else{
        $("#"+selectCal.id).parent().removeClass("cal_start");
    }
    CalData.setAttr(selectCal.id, "start", this.checked);

    var selectNode = Layout.getBlock()[0];
    if(selectNode.type && selectNode.id){
        selectNode.isStart = this.checked;
        if(this.checked)selectNode.isEnd = false;
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});

$("#prop_calEnd").on("click", function(){
    var selectCal = CalData.getSelect();
    if(!selectCal.id)return;
    if(this.checked){
        $("#"+selectCal.id).parent().addClass("cal_end");
        $("#"+selectCal.id).parent().removeClass("cal_start");
    }else{
        $("#"+selectCal.id).parent().removeClass("cal_end");
    }
    CalData.setAttr(selectCal.id, "end", this.checked);

    var selectNode = Layout.getBlock()[0];
    if(selectNode.type && selectNode.id){
        selectNode.isEnd = this.checked;
        if(this.checked)selectNode.isStart = false;
        Diagrams.updateNode();
        Diagrams.selectItem(selectNode);
    }
});

$("#prop_calCal").on("click", function(){
    Cal.refresh();
    setCalNodeValue();
});

$("#prop_calRev").on("click", function(){
    var selectCal = CalData.getSelect();
    var rc = Cal.reverse(selectCal.id, $("#prop_calValue").val());
    if(rc){
        $("#"+rc.skey).val(rc.x);
        $("#"+rc.skey).attr("data-formula", rc.x);
        rules.init();
        setCalNodeValue();
    }
});

$("#prop_calCal2").on("click", function(){
    var selectCal = CalData.getSelect();
    
    $("#"+selectCal.id).val($("#prop_calValue").val());
    $("#"+selectCal.id).attr("data-formula", $("#prop_calValue").val());
    rules.init();
    setCalNodeValue();
});

$("#prop_calRemove").on("click",function(){
    var selectCal = CalData.getSelect();
    $("#"+selectCal.id+"_div").remove();
    CalData.delCalById(selectCal.id);
});

$("#prop_calSave").on("click", function(e){
    window.cals = CalData.save();
});

$("#prop_calOpen").on("click", function(){
    Cal.destory();
    Cal.open(window.cals);
});

function window_resize(){
    var winHeight = window.innerHeight||document.body.clientHeight;
    if(parseInt(winHeight) < 1){
        winHeight = document.body.clientHeight;
    }
    $("#container").height(winHeight-87);
}

window_resize();

$(window).on("resize", function(){
    window_resize();
});

function printArea()
{
    var html = "";
    var nowView;
    var $diagram = $("#diagram");
    var $viewport = $("#diagram>.viewport");
    var tmpW = $diagram.attr("width");
    var tmpH = $diagram.attr("height"); 
    var tmpT = $viewport.attr("transform"); 
    
    var pageW = Layout.getPageInfo("width");
    var pageH = Layout.getPageInfo("height");

    $diagram.attr("width", "100%");
    $diagram.attr("height", "100%");
    $diagram.attr("viewBox", "0 0 " + pageW +" "+ pageH)
    

    $viewport.attr("transform", null);

    nowView = $("#svg-container").hasClass("view");
    $("pattern#grid").hide();
    
    $("#svg-container").addClass("view");
    $("#cal-group").addClass("view");
    $("#cal-group input").each(function(){
        $(this).attr("value", $(this).val());
    });
    

    //html = $("#container .center").html();
    html = document.getElementById("svg-container").outerHTML;

    $diagram.attr("width", tmpW);
    $diagram.attr("height", tmpH);
    $diagram.removeAttr("viewBox");
    $viewport.attr("transform", tmpT);

    $("pattern#grid").show();
    if(!nowView){
        $("#svg-container").removeClass("view");
        $("#cal-group").removeClass("view");
        $("#cal-group input").each(function(){
            $(this).removeAttr("value");
        });
    }

    win = window.open();
    win.document.write("<html>");
    win.document.write("<head>");
    win.document.write("<title></title>");
    //win.document.write("<link rel='stylesheet' href='/resources/hts/css/blockDiagram/style.css' type='text/css' />");
    win.document.write("<link rel='stylesheet' href='css/style.css' type='text/css' />");
    win.document.write("<style>");
    //win.document.write("#center{padding:0.35cm 0.5cm; transform-origin:top left; transform:scale(0.44);}#svg-container{overflow:visible;}");
    win.document.write("#center{padding:5mm;}");
    win.document.write("</style>");
    win.document.write("<style type='text/css'>@page { size: A3 landscape }#svg-container{overflow:hidden!important;}</style>");
    win.document.write("</head>");
    win.document.write('<body class="A3 landscape">');
    win.document.write("<div id='center' class='sheet'>");
    win.document.write(html);
    win.document.write("</div>");
    win.document.write("</body>");
    win.document.write("</html>");
    win.document.close();
    
    setTimeout(function () {
        win.focus();
        //win.print();
        //win.close();
    }, 200);
}

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
    diagramSelect();
    $("#prop_blockColor").on("change", function(){
        setNodeProp("color", $(this).spectrum("get").toHexString());
    });

    [].forEach.call(document.querySelectorAll(".item-menu"), function(el){
        el.setAttribute("draggable", "true");
        el.addEventListener("dragstart",function(e) {
            let id = e.target.id;
            if(id){
                Diagrams.addNodeDrag.dragStart(id.split("-")[1]);
                e.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
            }
        },false);
        el.addEventListener("dragend",function(e) {
            Diagrams.addNodeDrag.dragEnd(e);
        },false);
    });

    $("#main").on("keydown", function(e){
        if(e.ctrlKey === true && e.keyCode === 13){
            e.preventDefault();
            Cal.refresh();
            setCalNodeValue();
        }
    })

    /*
    $(window).on('beforeunload', function() {
        return "?";
    });
    */
    var Scrollbar = window.Scrollbar;
    Scrollbar.init(document.querySelector('#container .right'), {});
}



layout_init();