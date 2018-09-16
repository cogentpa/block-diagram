var Diagrams = function (){
    var diagrams = {};
    //var data  = {nodes:[],links:[]};
    var data = {
        nodes: [{
                id:0,
                name: "A",
                type:"rect",
                x: 200,
                y: 150,
                width : 100,
                height : 100
            }, {
                id:1,
                name: "B",
                type:"rect",
                x: 140,
                y: 300,
                width : 100,
                height : 100
            }, {
                name: "C",
                id:2,
                type:"rect",
                x: 300,
                y: 300,
                width : 100,
                height : 100
            }, {
                name: "D",
                id:3,
                type:"rect",
                x: 300,
                y: 180,
                width : 100,
                height : 100
            }, {
                name: "MB",
                id:4,
                type:"mb",
                x: 300,
                y: 180,
                width : 100,
                height : 30,
                mb : [0,1,2,3,4]
            }

        ],
        links: [{
            source: 0,
            target: 1,
            tOffsetX: 0,
            tOffsetY: 0,
            waypoints: [[30,30],[30,60],[90,60]]
        }, {
            source: 1,
            target: 2,
            tOffsetX: 0,
            tOffsetY: 0,
            waypoints : []
        }, {
            source: 2,
            target: 3,
            tOffsetX: 0,
            tOffsetY: 0,
            waypoints : []
        }, ]
    };
    var TmpVar = {
        bDrawing : false,
        startNode : null
    };
    
    var c10 = d3.scaleOrdinal(d3.schemeCategory10);;
    var svg = d3.select("#diagram").select(".viewport");
    var toolbox = d3.select("#node_toolbox");
    var arrow = d3.select("#arrow");
    var removeNodeIcon = d3.select("#removeNode");

    var linksG = svg.append("g").attr("class", "link-group");
    var nodeG = svg.append("g").attr("class", "node-group");

    //var links = linksG.selectAll("link");
    //var nodes = nodeG.selectAll("node");

    var shapes = {
        rect : function(nd){
            var e = document.createElementNS(d3.namespace("svg"), "rect");
            var rect = d3.select(e)
                .attr("width", 100)
                .attr("height", 100)
                .attr("x", nd.x)
                .attr("y", nd.y)
                .attr("fill", "#ffffff")
                .attr("stroke-width", 3)
                .attr("stroke", "#000")
            return rect;
        },
        mb : function(nd){
            var e = document.createElementNS(d3.namespace("svg"),'g');
            var g = d3.select(e)
                .attr('class', "mb")
                .selectAll("rect")
                .data(nd.mb)
                .enter()
                .append("rect")
                .attr("width", nd.width)
                .attr("width", nd.height)
            return g
        }

    }

    var drag = function(){
        var sourceLink = [];
        var targetLink = [];

        var bChildmove = false;
        var d3this;
        var rTarget;
        var tmpx,tmpy;

        return d3.drag()
                .on("start",function(d, i){
                    console.log("node drag start");
                    clearTemp();
                    nodeG.selectAll(".size-point").remove();

                    bChildmove = d.type == "mb" ? true : false;
                    d3this = d3.select(this);
                    linksG.selectAll(".link").each(function(l, li) {
                        if (l.source == d.id) {
                            var targetNode = data.nodes.filter(function(d, i) {
                                return d.id == l.target;
                            })[0];
                            sourceLink.push({
                                d3this:d3.select(this),
                                points : (l.waypoints || []).concat([targetNode.x+l.tOffsetX, targetNode.y+l.tOffsetY])
                            });
                        } else if (l.target == d.id) {
                            var sourceNode = data.nodes.filter(function(d, i) {
                                return d.id == l.source;
                            })[0];
                            targetLink.push({
                                d3this:d3.select(this),
                                tOffsetX : l.tOffsetX,
                                tOffsetY : l.tOffsetY,
                                points : [sourceNode.x+(sourceNode.width/2), sourceNode.y+(sourceNode.height/2)].concat(l.waypoints || [])
                            });
                        }
                    })
                    
                    //TmpVar.startNode = d.id;  //선택된 노드 체크
                })
                .on("drag", function(d, i) {
                    //console.log(d3.event);
                    //console.log(d3.event.dx);
                    //d.x += (d3.event.dx/20).toFixed(0)*20;
                    //d.y += (d3.event.dy/20).toFixed(0)*20;
                    
                    d.x = (d3.event.x/10).toFixed(0)*10;
                    d.y = (d3.event.y/10).toFixed(0)*10;

                    
                    if(bChildmove){
                        rTarget = d3this.select("rect");
                        tmpx = d.x - parseInt(rTarget.attr("x"));
                        tmpy = d.y - parseInt(rTarget.attr("y"));

                        d3this.selectAll("*")
                            .attr("x", function(){
                                return parseInt(d3.select(this).attr("x")) + tmpx;
                            })
                            .attr("y", function(){
                                return parseInt(d3.select(this).attr("y")) + tmpy;
                            });
                    }else{
                        d3this.selectAll("*").attr("x", d.x).attr("y", d.y);
                    }

                    var sPoint = [d.x+(d.width/2),d.y+(d.height/2)];
                    sourceLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", sPoint.concat(link.points));
                    });
                    targetLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", link.points.concat([d.x+link.tOffsetX, d.y+link.tOffsetY]));
                    });

                    if(TmpVar.startNode == d.id){
                        toolbox.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x)+' '+d.y+')');
                    }    
                })
                .on("end", function(){
                    sourceLink = [];
                    targetLink = [];
                });
            }();

    var tempCircleDrag = function(){
        var d3this;
        var link;
        var targetIndex;
        var isLast;
        var linkData;
        var startPoint, endPoint, waypoints;
        var tx,ty,tx2,ty2;
        return d3.drag()
                .on("start", function(d){
                    var before;
                    var after;

                    isLast = d.isLast;
                    d3this = d3.select(this);
                    link = d3.select(d.line).selectAll("polyline");
                    linkData = link.datum();

                    var sourceNode = data.nodes.filter(function(d) {
                        return d.id == linkData.source;
                    })[0];
                    var targetNode = data.nodes.filter(function(d) {
                        return d.id == linkData.target;
                    })[0];

                    if(isLast){
                        tx = targetNode.x;
                        ty = targetNode.y;
                        tx2 = tx + targetNode.width;
                        ty2 = ty + targetNode.height;
                    } else {
                        before = linkData.waypoints.slice(0, d.index);
                        after = linkData.waypoints.slice(d.index);
                        targetIndex = before.length;
                        if(d.isNew){
                            before.push(d3.mouse(this));
                        }
                        linkData.waypoints = before.concat(after);
                    }

                    startPoint = [sourceNode.x+(sourceNode.width/2), sourceNode.y+(sourceNode.height/2)];
                    endPoint = [targetNode.x+linkData.tOffsetX, targetNode.y+linkData.tOffsetY];
                    waypoints = linkData.waypoints;
                })
                .on("drag", function(d){
                    var x = (d3.event.x/10).toFixed(0)*10;
                    var y = (d3.event.y/10).toFixed(0)*10;
                    if(isLast){
                        if(x > tx && x < tx2 && y > ty && y < ty2){
                            if(d3.event.dx > d3.event.dy){
                                endPoint[0] = x;
                                endPoint[1] = (y-ty) > (ty2-y) ? ty2 : ty;
                            } else {
                                endPoint[0] = (x-tx) > (tx2-x) ? tx2 : tx;
                                endPoint[1] = y;
                            }
                        }else{
                            if(x < tx || x > tx2){
                                x = endPoint[0];
                            } else {
                                endPoint[0] = x;
                            }
                            if(y < ty || y > ty2){
                                y = endPoint[1];
                            } else {
                                endPoint[1] = y;
                            }
                        }
                    } else {
                        waypoints[targetIndex] = [x,y];
                    }
                    d3this.attr("cx", x)
                        .attr("cy", y);
                    link.attr("points", function(l){
                        return startPoint.concat(waypoints).concat(endPoint);
                        
                    })
                })
                .on("end", function(){
                    if(isLast){
                        linkData.tOffsetX = endPoint[0] - tx;
                        linkData.tOffsetY = endPoint[1] - ty;;
                    }
                    clearTemp();
                })
    }();

    function lineMousepoint(){
        /*
        var pathEl = path.node();
        var pathLength = pathEl.getTotalLength();
        var BBox = pathEl.getBBox();
        var scale = pathLength/BBox.width;
        var offsetLeft = document.getElementById("line").offsetLeft;
        var _x = d3.mouse(this)[0];
        var beginning = _x , end = pathLength, target;
        while (true) {
            target = Math.floor((beginning + end) / 2);
            pos = pathEl.getPointAtLength(target);

            if ((target === end || target === beginning) && pos.x !== _x) {
                break;
            }
            if (pos.x > _x){
                end = target;
            }else if(pos.x < _x){
                beginning = target;
            }else{
                break; //position found
            }
        }
        */
    
    /*   var m = d3.mouse(this);
        circle
        .attr("opacity", 1)
        .attr("cx", m[0])
        .attr("cy", m[1]); */

    }

    function nodeClick(d){
        
    /*     if(!TmpVar.bDrawing){
            d3.event.stopPropagation();
            clearTemp();
        } */

        console.log("click");
        //if (d3.event.defaultPrevented) return;
        
        if(TmpVar.bDrawing){
            var isExist = false;
            data.links.forEach(function(link){
                if(link.source == TmpVar.startNode && link.target == d.id){
                    isExist = true;
                    return;
                }
            })

            if(!isExist){
                data.links.push({
                    source: TmpVar.startNode,
                    target: d.id,
                    tOffsetX : 0,
                    tOffsetY : 0,
                    waypoints : []
                });
            }

        }else{
            toolbox.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x)+' '+d.y+')')
                .style("visibility", "visible");
            TmpVar.startNode = d.id;  //선택된 노드 체크

            if(d.type != "mb")makeSizeCircle(this);
            if(d.type == "mb"){
                toolbox.select("#mb_tool").remove();
                var tg = toolbox.append("g").attr("id", "mb_tool");
                tg.append("text")
                    .text("+")
                    .attr("font-size", "20px")
                    .attr("fill", "red")
                    .on("click", function(){
                        d.mb.push(d.mb.length);
                        updateNode();
                    })
                    .style("cursor", "pointer");
                tg.append("text")
                    .attr("x",15)
                    .text("-")
                    .attr("font-size", "20px")
                    .attr("fill", "blue")
                    .on("click", function(){
                        if(d.mb.length == 1)return;
                        d.mb = d.mb.slice(0, d.mb.length-1)
                        updateNode();
                    })
                    .style("cursor", "pointer");
            } else {
                toolbox.select("#mb_tool").remove();
            }

            //d3.select(this).selectAll("*").attr("height", 200)
        }
        blockSelect(d);
    }

    function makeSizeCircle(el){
        var gSize = el.getBBox();
        //console.log(el.getBoundingClientRect());
        //console.log(el.getBBox());
        //e-resize | ne-resize | nw-resize | n-resize | se-resize | sw-resize | s-resize | w-resize
        var tempSizePoints = [
            {x:gSize.x + (gSize.width/2), y:gSize.y, position:"n"},       //위
            {x:gSize.x + gSize.width, y:gSize.y+(gSize.height/2), position:"e"},  //오른쪽
            {x:gSize.x + (gSize.width/2), y:gSize.y+gSize.height, position:"s"},  //아래
            {x:gSize.x, y:gSize.y+(gSize.height/2), position:"w"} //왼쪽
        ]

        d3.select(el).selectAll(".size-point")
            .data(tempSizePoints)
            .enter()
            .append("circle")
            .attr("class", "size-point")
            .attr("r", 3)
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
            .attr("fill", "#FE7F2D")
            //.attr("pointer-events", "none")
            .attr("stroke-width", "2")
            .attr("stroke", "#FE7F2D")
            .style("opacity", "0")
            .style("cursor", function(d){
                return d.position + "-resize"
            })
            .call(dragSizeCircle)
            .transition().duration(100).style("opacity", "1")
    }

    var dragSizeCircle = function(){
        var d3this;
        var d3Target;
        var d3Parent;
        var pData;
        var isX = false;
        var position;
        var tempWidth, tempHeight, tempX, tempY;
        return d3.drag()
            .on("start", function(){
                d3Parent = d3.select(this.parentNode);
                d3this = d3.select(this);
                pData = d3Parent.datum();

                d3Target = d3Parent.select("rect");

                position = d3this.datum().position;

                tempWidth = pData.width;
                tempHeight = pData.height;
                tempX = pData.x;
                tempY = pData.y;
                
                if ( position == "e" || position == "w"){
                    isX = true;
                } else {
                    isX = false;
                }
            })
            .on("drag", function(){
                var event = d3.event;
                if(isX){
                    d3this.attr("cx", (event.x/10).toFixed(0)*10);
                    if(position == "e"){
                        tempWidth += event.dx;
                        pData.width = (tempWidth/10).toFixed(0)*10;
                    }else{
                        tempWidth += event.dx*-1;
                        pData.width = (tempWidth/10).toFixed(0)*10;
                        
                        tempX += event.dx; 
                        pData.x = (tempX/10).toFixed(0)*10;
                    }
                    d3Target.attr("x", pData.x)
                        .attr("width", pData.width)
                }else{
                    d3this.attr("cy", (event.y/10).toFixed(0)*10);
                    if(position == "s"){
                        tempHeight += event.dy;
                        pData.height = (tempHeight/10).toFixed(0)*10;
                    }else{
                        tempHeight += event.dy*-1;
                        pData.height = (tempHeight/10).toFixed(0)*10;

                        tempY += event.dy; 
                        pData.y = (tempY/10).toFixed(0)*10;
                    }
                    d3Target.attr("y", pData.y)
                        .attr("height", pData.height)
                }

            })
            .on("end", function(){
                nodeG.selectAll(".size-point").remove();
                makeSizeCircle(d3Parent.node());
                console.log(pData);
                linksG.selectAll(".link").each(function(ld){
                    var link = d3.select(this);
                    var points = [];
                    var newPoints;
                    if(ld.source == pData.id){
                        console.log("this source");
                        points = link.select("polyline").attr("points").split(",")
                        newPoints = [pData.x + (pData.width)/2, pData.y + (pData.height)/2].concat(points.slice(2));
                        link.selectAll("polyline")
                            .attr("points", newPoints);
                    } else if(ld.target == pData.id){
                        console.log("this target");
                        points = link.select("polyline").attr("points").split(",")

                        newPoints = points.slice(0, points.length-2).concat([pData.x + (pData.width)/2, pData.y + (pData.height)/2]);
                        link.selectAll("polyline")
                            .attr("points", newPoints);
                    }
                })
                
            })
    }();

    function lineClick(d){
        if(!TmpVar.bDrawing){
            d3.event.stopPropagation();
            clearTemp();
        }
        
        //console.log(d);
        var points = d3.select(this).select("polyline").attr("points").split(",");
        var circlePoints = [];

        var i;
        var length = points.length;
        var point1X, point1Y, point2X, point2Y;
        //[1,2,3,4]
        for(i=2;i<length;i=i+2){
            point1X = points[i-2]*1;
            point1Y = points[i-1]*1;
            point2X = points[i]*1;
            point2Y = points[i+1]*1;
            //신규점
            circlePoints.push(
                {
                    index:i/2-1,
                    isNew:true,
                    line:this,
                    x:(point1X + point2X)/2,
                    y:(point1Y + point2Y)/2
                }
            )
        }
        //기존점
        if(length > 3){
            for(i=2;i<length;i=i+2){
                circlePoints.push(
                    {
                        index:i/2-1,
                        isNew:false,
                        isLast: (i == length-2),
                        line:this,
                        x:points[i]*1,
                        y:points[i+1]*1,
                    }
                )
            }
        }
        d.circlePoints = circlePoints;

        linksG.selectAll(".temp-point")
            .data(circlePoints)
            .enter()
            .append("circle")
            .attr("class", "temp-point")
            .attr("r", 3)
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
            .attr("fill", "#FC3")
            //.attr("pointer-events", "none")
            .attr("stroke-width", function(d,i,a){
                return (a.length-1 == i) ? 4 : 2;
            })
            .attr("stroke", "#FC3")
            .call(tempCircleDrag)
            .style("opacity", "0")
            .transition().duration(100).style("opacity", "1")
            ;


        //circle.transition().duration(200).style("opacity", "1");
    }

    function updateLink(){

        function makePoints(l){
            var sourceNode = data.nodes.filter(function(d, i) {
                return d.id == l.source
            })[0];
            var targetNode = data.nodes.filter(function(d, i) {
                return d.id == l.target
            })[0];
            var startPoint = [sourceNode.x+(sourceNode.width/2), sourceNode.y+(sourceNode.height/2)];
            var endPoint = [targetNode.x+l.tOffsetX, targetNode.y+l.tOffsetY];

            var points;
            if(l.waypoints.length > 0){
                points = [startPoint,l.waypoints,endPoint];
            } else {
                points = [startPoint,endPoint];
            }
            return points;
        }

        var links = linksG.selectAll(".link").data(data.links);

        links.exit().remove();

        var lg = links.enter()
            .append("g")
            .attr("class", "link")
            .on("click", lineClick)
            .on("mouseenter", function(){
                d3.select(this).select(".line_back").attr("stroke", "#ccc");
            })
            .on("mouseleave", function(){
                d3.select(this).select(".line_back").attr("stroke", null);
            });
        
        lg.append("polyline")
            .attr("class", "line_back")
            .attr("fill", "none")
            .attr("stroke-width", "6px");

        lg.append("polyline")
            //.attr("class", "link")
            .attr("class", "line")
            //.on("mousemove", lineMousepoint)
            //.on("mouseover", lineMouseover)
            .attr("fill", "none")
            .attr("stroke", "#000000")
            .attr("stroke-width", "2px")
            .attr("marker-end", "url(#arrowhead)");
            ;

        lg = lg.merge(links);

        lg.select(".line_back").datum(function(d){
            return d;
        })
        .attr("points", makePoints);

        lg.select(".line").datum(function(d){
            return d;
        })
        .attr("points", makePoints);
    }

    function updateNode(){
        var nodes = nodeG.selectAll(".node").data(data.nodes);
        nodes.exit().remove();

        var ng = nodes
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("id", function(d){
                return "nd-" + d.id;
            })
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .on("click", nodeClick)
            .call(drag);
            ;
           
        ng = ng.merge(nodes);
            
        ng.each(function(d){
            if(d.type == "rect"){
                d3.select(this).selectAll("rect.box")
                    .data([d])
                    .enter()
                    .append("rect")
                    .attr("class", "box")
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 3)
                    .attr("stroke", "#000")

                d3.select(this).select("rect.box")
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("x", d.x)
                    .attr("y", d.y)
            } else if(d.type == "mb"){
                var mb = d3.select(this).selectAll("rect.mb").data(d.mb);
                mb.exit().remove();

                mb.enter()
                    .append("rect")
                    .attr("class", "mb")
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("x", function(e,i){
                        return d.x + (i%2*d.width);
                    })
                    .attr("y", function(e,i){
                        return d.y + Math.floor(i/2)*d.height;
                    })
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 2)
                    .attr("stroke", "#333");
            }
        })

        /* nodeG.selectAll(".node").each(function(d){
            if(d.type == "rect"){
                d3.select(this).selectAll("rect.box")
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("x", d.x)
                    .attr("y", d.y)
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 3)
                    .attr("stroke", "#000");
            } else if(d.type == "mb"){
                d3.select(this).selectAll("rect.mb")
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("x", function(e,i){
                        return d.x + (i%2*d.width);
                    })
                    .attr("y", function(e,i){
                        return d.y + Math.floor(i/2)*d.height;
                    })
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 2)
                    .attr("stroke", "#333");

                
            }
        }) */
    }

    function lineDrawEvent(){
        if(!TmpVar.bDrawing){
            d3.event.stopPropagation();
            TmpVar.bDrawing = true;
            isFirstClick = true;

            var line;
            console.log(TmpVar.startNode);

            var startNode = data.nodes.filter(function(d, i) {
                return d.id == TmpVar.startNode;
            })[0];

            var lx = startNode.x + (startNode.width/2); 
            var ly = startNode.y + (startNode.height/2);

            line = linksG.append("line")
                .attr("stroke", "#000000")
                .attr("stroke-width", "2px")
                .attr("x1", lx)
                .attr("y1", ly)
                .attr("x2", lx)
                .attr("y2", ly)
                .attr("marker-end", "url(#arrowhead)");

            function mousemove(){
                var m = d3.mouse(this);
                line.attr("x2", m[0]-5)
                    .attr("y2", m[1]-5);
            }

            svg.on("mousemove", mousemove)
                .on("click", function(){
                    if(TmpVar.bDrawing){
                        console.log("svg click");
                        line.remove();
                        updateLink(data.links);
                        svg.on("mousemove", null)
                            .on("click", null);
                            TmpVar.bDrawing = false;    
                    }
                });
        }

        linksG.exit().remove();
    }

    function draw(){
        updateLink();
        updateNode();
    }

    function removeNode(){

        console.log(TmpVar.startNode);

        var newNodes = data.nodes.filter(function(d){
            return d.id !== TmpVar.startNode;
        });
        var newLinks = data.links.filter(function(d){
            
            return (d.source !== TmpVar.startNode && d.target !== TmpVar.startNode);
        });
        data.nodes = newNodes;
        data.links = newLinks;

        //데이터로 삭제(exit().remove() 시 갯수로 삭제해서 잘안됨... 일단 이렇게 지우고 추후 수정)
        nodeG.selectAll(".node").each(function(d){
            if(d.id == TmpVar.startNode){
                d3.select(this).remove();
            }
        });

        draw();
        toolbox.style("visibility", "hidden");
    }

    function clearTemp(){
        linksG.selectAll(".temp-point")
        .remove();
    }
    function clearAll(){
        data.links = [];
        data.nodes = [];
        draw();

    }
    function getData(){
        data.links.forEach(function(v){
            delete v.circlePoints;
        });
        return data;
    }
    
    function setData(d){
        clearAll();
        data.nodes = d.nodes || [];
        data.links = d.links || [];

        //데이터 정제(tOffset 필수값.)
        data.lenks.forEach(function(v){
            if(!v.tOffsetX) v.tOffsetX = 0;
            if(!v.tOffsetY) v.tOffsetY = 0;
        });
        draw();
    }
    
    function addBox(node){
        if(!node) node = {};
        if(!node.width)node.width = 100;
        if(!node.height)node.height = 100;
        if(!node.type)node.type = "rect";
        if(!node.x)node.x = 10;
        if(!node.y)node.y = 10;
        node.id = new Date().getTime();
        
        if(node.type == "mb"){
            node.mb = [1];
        }
        
        data.nodes.push(node);
        
        updateNode();
    }
    
    function init(){
        /*
        svg.on("click",function(){
            clearTemp();
        })
        */

                //arrow
        svg.append("svg:defs")
            .append("svg:marker")
            .attr("id", "arrowhead")
            .attr("refX", 6)
            .attr("refY", 3)
            .attr("markerWidth", 15)
            .attr("markerHeight", 15)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 6 3 0 6 1.5 3")
            .style("fill", "black");

        arrow.on("click", function(){
            lineDrawEvent();
        });
        removeNodeIcon.on("click", function(){
            removeNode();
        })
        svg.select("#grid-bg").on("click",function(){
            clearTemp();
        })

        updateLink();
        updateNode();
    }

    function updateNodeEx(){
        updateNode();
        console.log( document.getElementById("nd-" + TmpVar.startNode));
       //.click();
    }

    diagrams.getData = getData;
    diagrams.setData = setData;
    diagrams.addBox = addBox;
    diagrams.clearAll = clearAll;
    diagrams.updateNode = updateNodeEx;

    init();
    return diagrams;
}();