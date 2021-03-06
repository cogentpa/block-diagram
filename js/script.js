var Diagrams = function (){

    /** UtilFunction */
    function lineIntersect(p1, p2, p3, p4) {
        var tp;
        // Check if none of the lines are of length 0
        if ((p1[0] === p2[0] && p1[1] === p2[1]) || (p3[0] === p4[0] && p3[1] === p4[1])) {
            return false
        }
      
        var denominator = ((p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]))
      
        // Lines are parallel
        if (denominator === 0) {
            return false
        }

        var ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / denominator
        var ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / denominator
      
        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
              return false
        }
      
        // Return a object with the x and y coordinates of the intersection
        var x = p1[0] + ua * (p2[0] - p1[0])
        var y = p1[1] + ua * (p2[1] - p1[1])
      
        return {x, y}
    }
      
    function closestPoint(pathNode, point) {
        var pathLength = pathNode.getTotalLength(),
            precision = 8,
            best,
            bestLength,
            bestDistance = Infinity;
      
        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
          if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
            best = scan, bestLength = scanLength, bestDistance = scanDistance;
          }
        }
      
        // binary search for precise estimate
        precision /= 2;
        while (precision > 0.5) {
          var before,
              after,
              beforeLength,
              afterLength,
              beforeDistance,
              afterDistance;
          if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
            best = before, bestLength = beforeLength, bestDistance = beforeDistance;
          } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after, bestLength = afterLength, bestDistance = afterDistance;
          } else {
            precision /= 2;
          }
        }
      
        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return best;
      
        function distance2(p) {
          var dx = p.x - point[0],
              dy = p.y - point[1];
          return dx * dx + dy * dy;
        }
    }  

    /** diagrams start */
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
                height : 100,
                isStart : true
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
                height : 100,
                isEnd : true
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
    
    var c10 = d3.scaleOrdinal(d3.schemeCategory10);
    var lineGen = d3.line()
                    .x(function(d) { return d[0]; })
                    .y(function(d) { return d[1]; });

    var svg = d3.select("#diagram").select(".viewport");
    var toolbox = d3.select("#node_toolbox");
    var arrow = d3.select("#arrow");
    var removeNodeIcon = d3.select("#removeNode");

    var linksG = svg.select("#link-group");
    var nodeG = svg.select("#node-group");

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

    var nodeDrag = function(){
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

                    
                    //if(true || bChildmove){
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
                    //}else{
                    //    d3this.selectAll("*").attr("x", d.x).attr("y", d.y);
                    //}

                    var sPoint = [d.x+(d.width/2),d.y+(d.height/2)];
                    sourceLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", sPoint.concat(link.points));
/*
                        link.d3this.select(".out-value")
                        .attr("x", function(l){
                            return l.sd.x;
                        })
                        .attr("y", function(l){
                            return l.sd.y;
                        });
*/
                    });
                    targetLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", link.points.concat([d.x+link.tOffsetX, d.y+link.tOffsetY]));

                        link.d3this.select(".in-value")
                        .attr("x", function(l){
                            var px;
                            var tx = l.td.x + l.tOffsetX;
                            if(l.waypoints.length > 0){
                                px = l.waypoints[l.waypoints.length-1][0];
                            } else {
                                px = l.sd.x;
                            }
                            return (px > tx) ? tx + 15  : tx - 35;
                        })
                        .attr("y", function(l){
                            var py;
                            var ty = l.td.y + l.tOffsetY;
                            if(l.waypoints.length > 0){
                                py = l.waypoints[l.waypoints.length-1][1];
                            } else {
                                py = l.sd.y;
                            }
                            //전이 크면, 아래서 위로
                            return (py > ty) ? ty + 25 : ty - 10; 
                            //return l.td.y+l.tOffsetY-15;
                        });

                    });

                    if(TmpVar.startNode == d.id){
                        toolbox.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x + 5)+' '+(d.y+5)+')');
                    }    
                })
                .on("end", function(){
                    sourceLink = [];
                    targetLink = [];
                    draw();//updateLink();
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
                    var lg = d3.select(d.line);
                    link = lg.selectAll("polyline");
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

                    lg.append("polyline")
                        .attr("class", "temp-line")
                        .attr("points", startPoint.concat(waypoints).concat(endPoint))
                        .attr("fill", "none")
                        .attr("stroke", "#999")
                        .attr("stroke-width", "2px")
                        .attr("marker-end", "url(#arrowhead)")
                        .attr("opacity", 0.5);
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
                    draw();//updateLink();
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

        //console.log("click");
        //if (d3.event.defaultPrevented) return;
        
        if(TmpVar.bDrawing){
            var isExist = false;
            //기존 연결 체크
            data.links.forEach(function(link){
                if(link.source == TmpVar.startNode && link.target == d.id){
                    isExist = true;
                    return;
                }
            })

            if(!isExist){
                //방향 계산
                var sourceNode = data.nodes.filter(function(d) {
                    return d.id == TmpVar.startNode;
                })[0];
                
                d.x = parseInt(d.x);
                d.y = parseInt(d.y);
                d.width = parseInt(d.width);
                d.height = parseInt(d.height);

                var ip;               
                var lp1 = [sourceNode.x + (sourceNode.width/2), sourceNode.y + (sourceNode.height/2)];
                var lp2 = [d.x + (d.width/2), d.y + (d.height/2)];

                var rectPoints = [[d.x, d.y],
                                  [d.x+d.width, d.y],
                                  [d.x+d.width, d.y+d.height],
                                  [d.x, d.y+d.height]
                                ];

                rectPoints.forEach(function(p,i,a){
                    var tp = lineIntersect(lp1, lp2, p, a[(i+1)%4]);
                    ip = (tp) ? tp : ip;
                })

                data.links.push({
                    source: TmpVar.startNode,
                    target: d.id,
                    tOffsetX : Math.round(ip.x/10)*10 - d.x,
                    tOffsetY : Math.round(ip.y/10)*10 - d.y,
                    waypoints : []
                });
            }

        }else{
            toolbox.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x + 5)+' '+(d.y+5)+')')
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
            .call(sizeCircleDrag)
            .transition().duration(100).style("opacity", "1")
    }

    var sizeCircleDrag = function(){
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

                d3Parent.append("rect")
                    .attr("class", "temp-box")
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 3)
                    .attr("stroke", "#000")
                    .attr("width", tempWidth)
                    .attr("height", tempHeight)
                    .attr("x", tempX)
                    .attr("y", tempY)
                    .attr("opacity", 0.5);
            })
            .on("drag", function(){
                var event = d3.event;
                if(isX){
                    if(position == "e"){
                        tempWidth += event.dx;
                        if(tempWidth < 10) tempWidth = 10;
                        pData.width = (tempWidth/10).toFixed(0)*10;
                        d3this.attr("cx", pData.x + pData.width);
                    }else{
                        tempWidth += event.dx*-1;
                        /* if(tempWidth < 10) {
                            tempWidth = 10;
                            tempX = pData.x + 10;
                        }else{
                        } */
                        tempX += event.dx; 
                        pData.width = (tempWidth/10).toFixed(0)*10;
                        
                        pData.x = (tempX/10).toFixed(0)*10;
                        d3this.attr("cx", pData.x);
                    }
                    d3Target.attr("x", pData.x)
                        .attr("width", pData.width)
                }else{
                    if(position == "s"){
                        tempHeight += event.dy;
                        if(tempHeight < 10) tempHeight = 10;
                        pData.height = (tempHeight/10).toFixed(0)*10;
                        d3this.attr("cy", pData.y + pData.height);
                    }else{
                        tempHeight += event.dy*-1;
                        pData.height = (tempHeight/10).toFixed(0)*10;
                        
                        tempY += event.dy; 
                        pData.y = (tempY/10).toFixed(0)*10;
                        d3this.attr("cy", (event.y/10).toFixed(0)*10);
                    }
                    d3Target.attr("y", pData.y)
                        .attr("height", pData.height)
                }

            })
            .on("end", function(){
                nodeG.selectAll(".size-point").remove();
                nodeG.selectAll(".temp-box").remove();
                makeSizeCircle(d3Parent.node());
                draw();//updateLink();
                //console.log(pData);
                /* linksG.selectAll(".link").each(function(ld){
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
                }) */
                
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
            .attr("r", 4)
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
            var startPoint = [l.sd.x+(l.sd.width/2), l.sd.y+(l.sd.height/2)];
            var endPoint = [l.td.x+l.tOffsetX, l.td.y+l.tOffsetY];
            var i,length;
            var points;
            if(l.waypoints.length > 0){
                var tPoints = [startPoint].concat(l.waypoints).concat([endPoint]);
                l.waypoints = [];
                length = tPoints.length-1;
                for(i=1;i<length;i++){
                    //같은 선이면 포인트 삭제
                    if(!(tPoints[i-1][0] === tPoints[i][0] && tPoints[i-1][0] === tPoints[i+1][0])
                        && !(tPoints[i-1][1] === tPoints[i][1] && tPoints[i-1][1] === tPoints[i+1][1]))
                    {
                        l.waypoints.push(tPoints[i]);
                    }
                }
                points = [startPoint].concat(l.waypoints).concat([endPoint]);
                
            } else {
                points = [startPoint,endPoint];
            }
            return points;
        }

        var links = linksG.selectAll(".link").data(data.links);

        links.exit().remove();

        var lg = links.enter()
            .append("g")
            .datum(function(d,i){
                var sourceNode = data.nodes.filter(function(n, i) {
                    return n.id == d.source
                })[0];
                var targetNode = data.nodes.filter(function(n, i) {
                    return n.id == d.target
                })[0];
                d.sd = sourceNode;
                d.td = targetNode;
                return d;
            })
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
            //.classed("flowline", true)
            //.on("mousemove", lineMousepoint)
            //.on("mouseover", lineMouseover)
            .attr("fill", "none")
            .attr("stroke", "#000000")
            .attr("stroke-width", "2px")
            .attr("marker-end", "url(#arrowhead)");
            ;
        /*
        lg.append("text")
            .attr("class", "out-value")
            .attr("id", function(d){
                return "txt-out-"+d.source+"-"+d.target;
            })
            .text(function(d,i){
                return parseInt(Math.random()*1000);
            });

        lg.append("text")
            .attr("class", "in-value")
            .attr("id", function(d){
                return "txt-in-"+d.source+"-"+d.target;
            })
            .text(function(d,i){
                return parseInt(Math.random()*1000);
            });    
        */
        lg = lg.merge(links);

        lg.select(".line_back").datum(function(d){
            return d;
        })
        .attr("points", makePoints);

        lg.select(".line").datum(function(d){
            return d;
        })
        .attr("points", makePoints);

        //text 위치
        lg.select(".out-value")
            .datum(function(d){
                var sx,sy,np;
                sx = d.sd.x + (d.sd.width/2);
                sy = d.sd.y + (d.sd.height/2);
                if(d.waypoints.length > 0){
                    np = d.waypoints[0];
                } else {
                    np = [d.td.x+d.tOffsetX, d.td.y + d.tOffsetY];
                }
                
                //좌우 차 가 더 크면
                if(Math.abs(sx - np[0]) > Math.abs(sy - np[1])){
                    d.ox = (sx > np[0]) ? d.sd.x - 35  : d.sd.x + d.sd.width + 15;
                    d.oy = (sy > np[1]) ? sy + 15 : sy - 15; 
                } else {
                    d.ox = (sx > np[0]) ? sx - 35  : sx+ 15;
                    d.oy = (sy > np[1]) ? d.sd.y - 20 : d.sd.y + d.sd.height + 25; 
                }

                return d;
            })
            .attr("x", function(l){
                return l.ox;
            })
            .attr("y", function(l){
                return l.oy;
            });
        lg.select(".in-value")
            .attr("x", function(l){
                //방향계산
                var px;
                var tx = l.td.x + l.tOffsetX;
                if(l.waypoints.length > 0){
                    px = l.waypoints[l.waypoints.length-1][0];
                } else {
                    px = l.sd.x;
                }
                return (px > tx) ? tx + 15  : tx - 35;
            })
            .attr("y", function(l){
                var py;
                var ty = l.td.y + l.tOffsetY;
                if(l.waypoints.length > 0){
                    py = l.waypoints[l.waypoints.length-1][1];
                } else {
                    py = l.sd.y;
                }
                //전이 크면, 아래서 위로
                return (py > ty) ? ty + 25 : ty - 10; 
            });

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
            .call(nodeDrag);
            ;

        /* ng.append("text")
            .attr(function(d){
                console.log(d);
                return 0;
            })
            .text(function(){
                return "a";
            });
        */
        ng = ng.merge(nodes);
            
        ng.each(function(d){
            if(d.type == "rect"){
                var _thisG = d3.select(this).selectAll("*").data([d]).enter();

                _thisG.append("rect")
                    .attr("class", "box")
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 3)
                    .attr("stroke", "#000")  

                if(d.isStart){
                    _thisG
                        .append("polyline")
                        //.attr('d',triangle)
                        .attr("class", "tri")
                        .attr('fill',"#ffffff")
                        .attr('stroke','#000')
                        .attr('stroke-width',3);

                    d3.select(this).select("polyline.tri")
                        .attr("points", [d.x-3+d.width,d.y, d.x+2+d.width,d.y, d.x+d.width+(d.width/4), d.y+(d.height/2), d.x+2+d.width,d.y+d.height, d.x-3+d.width,d.y+d.height ])
                    ;
                }

                if(d.isEnd){
                    _thisG
                        .append("polyline")
                        //.attr('d',triangle)
                        .attr("class", "tri")
                        .attr('fill',"#ffffff")
                        .attr('stroke','#000')
                        .attr('stroke-width',3);

                    d3.select(this).select("polyline.tri")
                        .attr("points", 
                        [d.x+3,d.y, d.x-2,d.y, d.x-(d.width/4),d.y+(d.height/2), d.x-2,d.y+d.height, d.x+3,d.y+d.height ])
                    ;
                }

                d3.select(this).select("rect.box")
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("x", d.x)
                    .attr("y", d.y);
                
                _thisG
                    .append("text")
                    .attr("class", function(d){
                        return "label";
                    })
                    .attr("text-anchor", "middle")
                    .attr("dy", ".35em");
                 
                d3.select(this).selectAll("text.label")    
                    .attr("x", function(d) { return d.x + (d.width/2) })
                    .attr("y", function(d) { return d.y+15})
                    .text(function(d) { return d.name; });

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
                        //console.log("svg click");
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
        //console.log("clearTemp")
        //TmpVar.bDrawing = false;
        //nodeG.selectAll(".size-point").remove();

        linksG.selectAll(".temp-point").remove();
        linksG.selectAll(".temp-line").remove();
        
    }
    function clearAll(){
        data.links = [];
        data.nodes = [];
        draw();

    }
    function getData(mode){
        if("save" === mode){
            data.links.forEach(function(v){
                delete v.circlePoints;
                delete v.sd;
                delete v.td;
            });
        }
        return data;
    }
    
    function setData(d){
        clearAll();
        data.nodes = d.nodes || [];
        data.links = d.links || [];

        //데이터 정제(tOffset 필수값.)
        data.links.forEach(function(v){
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

        draw();
    }

    function updateNodeEx(){
        draw();
        //console.log( document.getElementById("nd-" + TmpVar.startNode));
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