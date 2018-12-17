/**
 * 선 연결 알고리즘
 * 시작 점에서 해당 방향으로 10px 지점에 첫번째 점 생성
 * 대상 노드의 해당 방향으로 10px 지점에 마지막 점 생성
 * 두 방향이 좌<->우, 위<->아래 일경우 중간 지점 3개 생성, 그외 2개 생성
 * 생성 제외 지역이 없으면 중간, 아니면
 */



//test.js
function Diagram(){
    "use strict";
    /** Util Fnc */
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

    /** variables */
    var D3SVG;
    var LinkG;
    var NodeG;
    var TempG;
    var DATA;
    var NodeList;
    var NodesInit;

    var MouseOverNode = { node : null
                        , data : null 
                        };

    /** node */
    function Node(){}

    Node.prototype = {
        genPath : d3.line().x(function(d) { return d.x; })
                            .y(function(d) { return d.y; })
      , drawPath : function(svgObj, points){
                    var path = svgObj.select("path")
                    if(path.empty())path =  svgObj.append("path");

                    path.attr("d", this.genPath(points))
                        .attr("stroke", "black")
                        .attr("stroke-width", 2)
                        .attr("fill", "#fff");
               }                               
    }
    NodesInit = {
        rect : function(){
            var rect = new Node();
            rect.draw = function(svgObj, data){
                var points = [];
                points.push({x:0, y:0});
                points.push({x:data.width, y:0});
                points.push({x:data.width, y:data.height});
                points.push({x:0, y:data.height});
                points.push({x:0, y:0});

                this.drawPath(svgObj, points);
            }
            rect.getPathData = function(data){
                var points = [];
                points.push({x:0, y:0});
                points.push({x:data.width, y:0});
                points.push({x:data.width, y:data.height});
                points.push({x:0, y:data.height});
                points.push({x:0, y:0});
                return this.genPath(points);
            }
            return rect;
        },
        pou : function(){
            var pou = new Node();
            pou.draw = function(svgObj, data){
                var w = data.width;
                var h = data.height;
                var rHeight = h/4;
                var rWidth = w/4;

                var points = [];
                points.push({x:0, y:rHeight});
                points.push({x:rWidth, y:0});
                points.push({x:rWidth, y:rHeight});
                points.push({x:rWidth*2, y:0});
                points.push({x:rWidth*2, y:rHeight});
                points.push({x:rWidth*3, y:0});
                points.push({x:rWidth*3, y:rHeight});
                points.push({x:w, y:0});

                points.push({x:w, y:h});
                points.push({x:0, y:h});
                points.push({x:0, y:rHeight});

                this.drawPath(svgObj, points);
            }
            return pou;
        },
        circle : function(){
            var circle = new Node();
            circle.draw = function(svgObj, data){
                var ellipse = svgObj.select("ellipse");
                if(ellipse.empty())ellipse =  svgObj.append("ellipse");
                ellipse.attr("cx", data.width/2)
                        .attr("cy", data.height/2)
                        .attr("rx",data.width/2)
                        .attr("ry",data.height/2)
                        .attr("stroke", "black")
                        .attr("stroke-width", 2)
                        .attr("fill", "#fff");

                this.drawPath(svgObj, data);
            }
            circle.drawPath = function(svgObj, points){
                var path = svgObj.select("path")
                if(path.empty())path = svgObj.append("path");

                path.attr("d", this.genPath(points))
                    .attr("fill", "none");
                //this.__proto__.drawPath(svgObj, points);
            }
             //TO-DO 타원으로 points 생성해야함    
            circle.genPath = function(points){
                var cx = points.width/2;
                var cy = points.height/2;
                //var xr = (points.width/2)/90;
                //var yr = (points.height/2)/90;

                var radius = points.width/2;

                var d = " M "+ (cx + radius) + " " + cy;
                var angle=1;
                while(angle <= 360){
                    var radians= angle * (Math.PI / 180);  // convert degree to radians
                    var x = cx + Math.cos(radians) * radius;  
                    var y = cy + Math.sin(radians) * radius;
                    angle++;
                    d += " L "+x + " " + y;
                }
                return d;
            }
            return circle;
        },
        mb : function(){
            var mb = new Node();
            mb.draw = function(svgObj, data){}
            return mb;
        }
    }

    var dragNode = function(){
        var tempNode;
        var targetNode;
        var stX, stY;
        return d3.drag()
                  .on("start",function(d, i){
                      console.log("node drag start");
                      TempG.selectAll("*").remove();
                      targetNode = d3.select(this);
                      stX = d.x;
                      stY = d.y;
                      tempNode = NodeG.append("use")
                                        .attr("xlink:href", "#" + targetNode.attr("id"))
                                        .attr("transform", "translate(0,0)")
                                        .attr("opacity", 0.5);
                  })
                  .on("drag",function(d, i){
                      d.x = (d3.event.x/10).toFixed(0)*10;
                      d.y = (d3.event.y/10).toFixed(0)*10;
                      tempNode.attr("transform", "translate("+(d.x-stX)+","+(d.y-stY)+")");
                  })
                  .on("end",function(d, i){
                      console.log("node drag end");
                      tempNode.remove();
                      updateDiagrams();
                      selectNode(targetNode, d);
                  });   
             }(); 
             
    var dragSizeCircle = function(){
        var tempNode;
        var targetNode;
        var d3this;
        var isX = false;
        var position;

        var tData;
        var tempWidth, tempHeight, tempX, tempY;
        return d3.drag()
            .on("start", function(){

                d3this = d3.select(this);
                targetNode = d3.select("#" + TempG.attr("target_id"));
                tData = targetNode.datum();


                tempNode = TempG.append("g")
                                        .attr("xlink:href", "#" + targetNode.attr("id"))
                                        .attr("transform", "translate(" + tData.x + "," + tData.y + ")")
                                        .attr("opacity", 0.5);

                position = d3this.style("cursor").split("-")[0];

                tempWidth = tData.width;
                tempHeight = tData.height;
                tempX = tData.x;
                tempY = tData.y;
                
                if ( position == "e" || position == "w"){
                    isX = true;
                } else {
                    isX = false;
                }
            })
            .on("drag", function(){
                var event = d3.event;
                if(isX){
                    if(position == "e"){
                        tempWidth += event.dx;
                        if(tempWidth < 10) tempWidth = 10;
                        tData.width = (tempWidth/10).toFixed(0)*10;
                        d3this.attr("cx", tData.x + tData.width);
                    }else{
                        tempWidth += event.dx*-1;
                        tempX += event.dx; 
                        tData.width = (tempWidth/10).toFixed(0)*10;
                        
                        tData.x = (tempX/10).toFixed(0)*10;
                        d3this.attr("cx", tData.x);
                    }

                    //이거 세로도 써로 될듯 위 두줄
                }else{
                    if(position == "s"){
                        tempHeight += event.dy;
                        if(tempHeight < 10) tempHeight = 10;
                        tData.height = (tempHeight/10).toFixed(0)*10;
                        d3this.attr("cy", tData.y + tData.height);
                    }else{
                        tempHeight += event.dy*-1;
                        tData.height = (tempHeight/10).toFixed(0)*10;
                        
                        tempY += event.dy; 
                        tData.y = (tempY/10).toFixed(0)*10;
                        d3this.attr("cy", (event.y/10).toFixed(0)*10);
                    }

                }
                tempNode.attr("transform", "translate(" + tData.x + "," + tData.y + ")");
                NodeList[tData.type].draw(tempNode, tData);

            })
            .on("end", function(){
                TempG.selectAll("*").remove();
                updateDiagrams();
                selectNode(targetNode, tData);
            })
    }(); 
    
    var dragNewLink = function(){
        var line;
        return d3.drag()
            .on("start", function(){
                var d3this = d3.select(this);
                var targetNode = d3.select("#" + TempG.attr("target_id"));
                var tData = targetNode.datum();
                
                var points = closestPoint(targetNode.select("path").node(), [parseInt(d3this.attr("x1")-tData.x),parseInt(d3this.attr("y1"))-tData.y]);

                var lx = tData.x + points[0];
                var ly = tData.y + points[1];

                var m = d3.mouse(this);

                line = LinkG.append("line")
                .attr("stroke", "#000000")
                    .attr("stroke-width", "2px")
                    .attr("x1", lx)
                    .attr("y1", ly)
                    .attr("x2", m[0]-2)
                    .attr("y2", m[1]-2)
                    .attr("marker-end", "url(#arrowhead)");
                 
                TempG.selectAll("*").transition().duration(200)
                .attr("opacity", 0)
                .remove();
            })
            .on("drag", function(){
                var m = d3.mouse(this);
                var lx = m[0];
                var ly = m[1];
                if(MouseOverNode.node){
                    var points = closestPoint(MouseOverNode.node, [m[0] - MouseOverNode.data.x,m[1]-MouseOverNode.data.y]);
                    lx = MouseOverNode.data.x + points[0];
                    ly = MouseOverNode.data.y + points[1];
                }
                line.attr("x2", lx)
                    .attr("y2", ly);
                
            })
            .on("end", function(){
                line.remove();
            });
        
/*
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
                });*/
    }();
    

    function selectNode(targetNode, d){
        var tPoints = []
        tPoints.push([d.width/2, 0]);
        tPoints.push([d.width, d.height/2]);
        tPoints.push([d.width/2, d.height]);
        tPoints.push([0, d.height/2]);
        
        var pathNode = targetNode.select("path").node();
        var points = tPoints.map(function(v,i){
            return closestPoint(pathNode, v);
        });

        TempG.attr("target_id", targetNode.attr("id"));

        TempG.selectAll(".size-point").data(points).enter()
            .append("circle")
            .attr("class", "size-point")
            .attr("r", 3)
            .attr("cx", function(data){return data[0]+d.x})
            .attr("cy", function(data){return data[1]+d.y})
            .attr("fill", "#FE7F2D")
            //.attr("pointer-events", "none")
            .attr("stroke-width", "2")
            .attr("stroke", "#FE7F2D")
            .style("opacity", "0")
            .style("cursor", function(d,i){
                var cursorNm;
                switch(i) {
                    case 0 :
                        cursorNm = "n-resize";
                        break;
                    case 1 :
                        cursorNm = "e-resize";
                        break;
                    case 2 :
                        cursorNm = "s-resize";
                        break;
                    case 3 :
                        cursorNm = "w-resize";
                        break;
                    default :
                        break;    
                }    
                return cursorNm;
            })
            .call(dragSizeCircle)
            .transition().duration(200).style("opacity", "1")
            ;
        
        TempG.selectAll(".addline-arrow").data(points).enter()
            .append("line")
            .attr("class", "addline-arrow")
            .attr("x1", function(data,i){
                var x1 = data[0]+d.x;
                if(i === 1){
                    x1 += 5;
                } else if( i === 3){
                    x1 -= 5;
                } 
                return x1;
            })
            .attr("y1", function(data,i){
                var y1 = data[1]+d.y;
                if(i === 0){
                    y1 -= 5;
                } else if( i === 2){
                    y1 += 5;
                } 
                return y1;
            })
            .attr("x2", function(data,i){
                var x2 = data[0]+d.x;
                if(i === 1){
                    x2 += 35;
                } else if( i === 3){
                    x2 -= 35;
                } 
                return x2;
            })
            .attr("y2", function(data,i){
                var y2 = data[1]+d.y;
                if(i === 0){
                    y2 -= 35;
                } else if( i === 2){
                    y2 += 35;
                } 
                return y2;
            })
            .attr("fill", "none")
            .attr("stroke", "#000000")
            .attr("stroke-width", "2px")
            .attr("marker-end", "url(#arrowhead)")
            .style("opacity", "0")
            .transition().duration(200).style("opacity", "0.2");
        
        TempG.selectAll(".addline-pointer").data(points).enter()
            .append("line")
            .attr("class", "addline-arrow")
            .attr("x1", function(data,i){
                var x1 = data[0]+d.x;
                if(i === 1){
                    x1 += 5;
                } else if( i === 3){
                    x1 -= 5;
                } 
                return x1;
            })
            .attr("y1", function(data,i){
                var y1 = data[1]+d.y;
                if(i === 0){
                    y1 -= 5;
                } else if( i === 2){
                    y1 += 5;
                } 
                return y1;
            })
            .attr("x2", function(data,i){
                var x2 = data[0]+d.x;
                if(i === 1){
                    x2 += 35;
                } else if( i === 3){
                    x2 -= 35;
                } 
                return x2;
            })
            .attr("y2", function(data,i){
                var y2 = data[1]+d.y;
                if(i === 0){
                    y2 -= 35;
                } else if( i === 2){
                    y2 += 35;
                } 
                return y2;
            })
            .attr("fill", "none")
            .attr("stroke", "#000000")
            .attr("stroke-width", "10px")
            .style("cursor", "pointer")
            .style("opacity", "0")
            .call(dragNewLink);
        //.classed("flowline", true)
        //.on("mousemove", lineMousepoint)
        //.on("mouseover", lineMouseover)
        ; 

    }

    /** lineFunction  */
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


    /** function */
    function init(trgtId, nodeList){
        var svg = d3.select(trgtId);

        appendDef(svg);

        var viewportG = svg.append("g")
            .attr("class", "viewport");

        viewportG.append("rect")
            .attr("id", "grid-bg")
            .attr("fill", "url(#grid)")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "100%")
            .attr("height", "100%")

        LinkG = viewportG.append("g").attr("id", "link-group");
        NodeG = viewportG.append("g").attr("id", "node-group");
        TempG = viewportG.append("g").attr("id", "temp-group");

        D3SVG = svg;
        DATA = {nodes:[], links:[]};

        svg.on("click", function(){
            console.log("svg click");
            TempG.selectAll("*").remove();
        })
        initNodeList(nodeList);
    }

    function appendDef(d3Svg){
        
        var defs = d3Svg.append("svg:defs");
        //Arrowhead
        defs.append("marker")
            .attr("id", "arrowhead")
            .attr("refX", 5)
            .attr("refY", 3)
            .attr("markerWidth", 15)
            .attr("markerHeight", 15)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 6 3 0 6 1.5 3")
            .style("fill", "black");
        
        //Grid
        defs.append("pattern")
            .attr("id", "smallGrid")
            .attr("width", 10)
            .attr("height", 10)
            .attr("patternUnits", "userSpaceOnUse")
            .append("path")
                .attr("d", "M 10 0 L 0 0 0 10")
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("stroke-width", 0.5);

        var pattern2 = defs.append("pattern")
                .attr("id", "grid")
                .attr("width", 100)
                .attr("height", 100)
                .attr("patternUnits", "userSpaceOnUse");
        
        pattern2.append("rect")
            .attr("width", 100)
            .attr("height", 100)
            .attr("fill", "url(#smallGrid)");

        pattern2.append("path")
                .attr("d", "M 100 0 L 0 0 0 100")
                .attr("fill", "none")
                .attr("stroke", "#aaa")
                .attr("stroke-width", 1);
    }

    function initNodeList(nodeList){

        if(nodeList){
            NodesInit = nodeList;
        }

        NodeList = {};

        for(var name in NodesInit){
            NodeList[name] = NodesInit[name]();
        }
    }

    function clearAll(){
        DATA.links = [];
        DATA.nodes = [];
        updateDiagrams();
    }

    function updateDiagrams(){
        drawLine();
        drawNode();
    }

    function drawLine(){
        var links = LinkG.selectAll(".link").data(DATA.links);

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
            //.on("click", lineClick)
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
    function drawNode(){
        var nodes = NodeG.selectAll(".node").data(DATA.nodes);
        nodes.exit().remove();

        var ng = nodes
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("id", function(d){
                return "nd-" + d.id;
            })
            //.on("click", function(d){console.log("click node")})
            .call(dragNode)
            .on("mouseenter", function(){
                MouseOverNode.node = d3.select(this).select("path").node();
                MouseOverNode.data = d3.select(this).datum();
            })
            .on("mouseleave", function(){
                MouseOverNode.node = null;
                MouseOverNode.data = null;
            })
            ;
        
        ng = ng.merge(nodes);

        ng.attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });
        /*
        nodes.append("path")
            .attr("class", "shape-path");
        
        var paths = nodes.select(".shape-path");

        paths.attr("d", function(d){
                return NodeList[d.type].getPathData(d);
            })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("fill", "#fff");
        */    
        
        ng.each(function(d){
            var _thisG = d3.select(this)//.selectAll("path").data([d]).enter(); 
            NodeList[d.type].draw(_thisG, d);
        });
        


    }

    function setData(d){
        clearAll();
        DATA.nodes = d.nodes || [];
        DATA.links = d.links || [];

        //데이터 정제(tOffset 필수값.)
        DATA.links.forEach(function(v){
            if(!v.tOffsetX) v.tOffsetX = 0;
            if(!v.tOffsetY) v.tOffsetY = 0;
        });
        updateDiagrams();
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

    //set return obj;
    var diagrams = {};
    diagrams.init = init;
    diagrams.setData = setData;
    diagrams.getData = getData;

    return diagrams;
}

var Diagrams = Diagram();

var data = {
    nodes: [{
            id:0,
            name: "A",
            type:"rect",
            x: 200,
            y: 100,
            width : 100,
            height : 100,
            isStart : true
        }, {
            id:1,
            name: "B",
            type:"rect",
            x: 100,
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
            x: 600,
            y: 300,
            width : 100,
            height : 100,
            isEnd : true
        }, {
            name: "P.O.U",
            id:"pou1",
            type:"pou",
            x: 500,
            y: 100,
            width : 200,
            height : 100,
        }, {
            name: "circle",
            id:"circle1",
            type:"circle",
            x: 400,
            y: 200,
            width : 100,
            height : 100,
        }, {
            name: "MB",
            id:4,
            type:"mb",
            x: 300,
            y: 180,
            width : 100,
            height : 30,
            mb : [0,1,2,3,4]
        },

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

Diagrams.init("#diagram", nodeList);
Diagrams.setData(data);

