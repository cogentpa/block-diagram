/**
 * 선 연결 알고리즘
 * 시작 점에서 해당 방향으로 10px 지점에 첫번째 점 생성
 * 대상 노드의 해당 방향으로 10px 지점에 마지막 점 생성
 * 두 방향이 좌<->우, 위<->아래 일경우 중간 지점 3개 생성, 그외 2개 생성
 * 생성 제외 지역이 없으면 중간, 아니면....
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
    var UserFn;

    var MouseOverNode = { node : null, data : null};

    /** node */
    function Node(){}

    Node.prototype = {
        genPath : d3.line().x(function(d) { return d.x; })
                            .y(function(d) { return d.y; })
      , drawPath : function(svgObj, points, data){                
                    var path = svgObj.append("path");
                    path.attr("d", this.genPath(points))
                        .attr("stroke", data.color || "black")
                        .attr("stroke-width", 2)
                        .attr("fill", "#fff");
               }
       , drawText : function(svgObj, data){
                    var text = svgObj.append("text");
                    text.attr("x", data.width/2)
                        .attr("y", data.height/2)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .text(data.name)
                        .attr("stroke", "black")
                        .attr("stroke-width", 1)
                        ;

       }                                        
    }
    NodesInit = {
        rect : function(){
            var rect = new Node();
            rect.draw = function(svgObj, data){
                var points = [];
                
                if(data.isStart){
                    points.push({x:0, y:0});
                    points.push({x:data.width-data.width/5, y:0});
                    points.push({x:data.width, y:data.height/2});
                    points.push({x:data.width-data.width/5, y:data.height});
                    points.push({x:0, y:data.height});
                    points.push({x:0, y:0});
                }else if(data.isEnd){
                    points.push({x:0+data.width/5, y:0});
                    points.push({x:data.width, y:0});
                    points.push({x:data.width, y:data.height});
                    points.push({x:0+data.width/5, y:data.height});
                    points.push({x:0, y:data.height/2});
                    points.push({x:0+data.width/5, y:0});
                }else {
                    points.push({x:0, y:0});
                    points.push({x:data.width, y:0});
                    points.push({x:data.width, y:data.height});
                    points.push({x:0, y:data.height});
                    points.push({x:0, y:0});
                }

                this.drawPath(svgObj, points, data);
                this.drawText(svgObj, data);
            }
            rect.getPathData = function(data){
                var points = [];
                points.push({x:0, y:0});
                points.push({x:data.width, y:0});
                if(data.isStart){
                    points.push({x:data.width + data.width/5, y:data.height/2});
                }
                points.push({x:data.width, y:data.height});
                points.push({x:0, y:data.height});
                if(data.isEnd){
                    points.push({x:0 - data.width/5, y:data.height/2});
                }
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

                this.drawPath(svgObj, points, data);
                this.drawText(svgObj, data);
            }
            return pou;
        },
        circle : function(){
            var circle = new Node();
            circle.draw = function(svgObj, data){
                var ellipse = svgObj.append("ellipse");
                ellipse.attr("cx", data.width/2)
                        .attr("cy", data.height/2)
                        .attr("rx",data.width/2)
                        .attr("ry",data.height/2)
                        .attr("stroke", data.color || "black")
                        .attr("stroke-width", 2)
                        .attr("fill", "#fff");

                this.drawPath(svgObj, data);
                this.drawText(svgObj, data);
            }
            circle.drawPath = function(svgObj, points){
                var path = svgObj.append("path");

                path.attr("d", this.genPath(points))
                    .attr("fill", "none");
                //this.__proto__.drawPath(svgObj, points);
            }
             //TO-DO 타원으로 points 생성해야함    
            circle.genPath = function(points){
                var cx = points.width/2;
                var cy = points.height/2;

                var x_radius = points.width/2;
                var y_radius = points.height/2;

                var x,y;

                var d = " M "+ (cx + x_radius) + " " + cy;
                var angle=1;

                while(angle <= 360){
                    var radians= angle * (Math.PI / 180);  // convert degree to radians
                    x = cx + Math.cos(radians) * x_radius;  
                    y = cy + Math.sin(radians) * y_radius;
                    angle++;
                    d += " L "+x + " " + y;
                }
                return d;
            }
            return circle;
        },
        mb : function(){
            var mb = new Node();
            mb.draw = function(svgObj, data){
                svgObj.selectAll("g.mbItem").remove();
                svgObj.selectAll("g.mbIcon").remove();
                this.addItem(svgObj, data);
                this.drawPath(svgObj, data);
            }
            mb.addItem = function(svgObj, data){
                var item = svgObj.append("g").attr("class","mbItem");
                var itemWidth = data["item"]["width"];
                var itemHeight = data["item"]["height"];
                if(data["mb"]){
                    var maxX = data["mb"].length;

                    data["mb"].map(function(a,i){
                        var x = i*itemWidth;
                        a.map(function(b,j){
                            var y = j*itemHeight;
                            //var itemG = item.append("g");
                            //itemG.attr("transform", "translate("+x+","+y+")")
                            
                            var rect = item.append("rect");
                            
                            rect.attr("x", x)
                                .attr("y", y)
                                .attr("width", itemWidth)
                                .attr("height", itemHeight)
                                .attr("stroke", "black")
                                .attr("stroke-width", 2)
                                .attr("fill", "#fff");
                            
                            var classNm = "mb_"+i+"-"+j;
                            var text = item.append("text").attr("class", classNm);
                            text.attr("x", x+(itemWidth/2))
                                .attr("y", y+(itemHeight/2))
                                .attr("text-anchor", "middle")
                                .attr("dominant-baseline", "middle")
                                .text(b["text"])
                                .attr("stroke", "black")
                                .attr("stroke-width", 1)
                                .on("mouseover", function() {
                                    d3.select(this).attr("stroke", "red");
                                })
                                .on("mouseout", function() {
                                    d3.select(this).attr("stroke", "black");
                                })
                                .on("mousedown", function(d) {
                                    var p = this.parentNode.parentNode.parentNode.parentNode;
                                    var xy = this.getBBox();
                                    var p_xy = p.getBBox();
                                    var el = d3.select(this);
                                    var p_el = d3.select(p);
                                    var frm = p_el.append("foreignObject");
                                    var _this = this;
                                    var classNm = d3.select(_this).attr("class")||"";
                                    var mbPos = classNm.replace("mb_","").split("-");
                                    var mbPosX = mbPos[0]||0;
                                    var mbPosY = mbPos[1]||0;
                                    
                                    var inp = frm
                                        .attr("x", x+d.x)
                                        .attr("y", y+d.y+6)
                                        .attr("width", 100)
                                        .attr("height", 25)
                                        .append("xhtml:form")
                                        .append("input")
                                        .attr("xmlns","http://www.w3.org/1999/xhtml")
                                        .attr("value", function() {
                                            this.focus();
                                            var val = d3.select(_this).text();
                                            return val;
                                        })
                                        .attr("style", "width: 94px;")   
                                        .on("click", function(){
                                            this.select();
                                        })                
                                        .on("blur", function() {
                                            var txt = inp.node().value;
                                            if(d.mb){
                                                if(d.mb[mbPosX][mbPosY]){
                                                    d.mb[mbPosX][mbPosY]["text"] = txt;
                                                }
                                            }
                                            el.text(function(d) { return txt; });
                                            if(p_el.select("foreignObject").empty() === false){
                                                p_el.select("foreignObject").remove();
                                            }
                                        })
                                        .on("keypress", function() {
                                            // IE fix   
                                            if (!d3.event){
                                                d3.event = window.event;
                                            }
                                            var e = d3.event;
                                            if (e.keyCode == 13){
                                                if (typeof(e.cancelBubble) !== 'undefined'){ // IE
                                                    e.cancelBubble = true;
                                                }
                                                if (e.stopPropagation){
                                                    e.stopPropagation();
                                                }
                                                e.preventDefault();
                                                e.target.blur();
                                            }
                                        });
                                    var e = d3.event;
                                    if (e.stopPropagation){
                                        e.stopPropagation();
                                    }
                                    e.preventDefault();
                                });
                            if(y == 0){
                                mb.addIcon(svgObj,data,{type:"down",x:x+itemWidth/2+20,y:-5,index:i});
                            }
                        });
                        if(i == maxX-1){
                            mb.addIcon(svgObj,data,{type:"right",x:x+itemWidth+5,y:10});
                        }
                    });
                }
                return item;
            }
            mb.addIcon = function(svgObj, data, pos){
                var iconG = svgObj.append("g").attr("class","mbIcon");
                iconG.attr("transform", "translate("+pos.x+","+pos.y+")");
                var plusIcon = iconG.append("text").attr("class","plus");
                plusIcon.attr("x", 0)
                    .attr("y", 0)
                    .text("+")
                    .attr("stroke", "blue")
                    .attr("stroke-width", 1)
                    .style("cursor", "pointer")
                    .on("mousedown", function(){
                        if(pos.type == "right"){
                            data["mb"].push([{text:"new"}]);
                            mb.draw(svgObj, data);
                        }else if(pos.type == "down"){
                            data["mb"][pos.index].push({text:"new"});
                            mb.draw(svgObj, data);
                        }
                    });
                var minusIcon = iconG.append("text").attr("class","minus");
                minusIcon.attr("x", 15)
                    .attr("y", 0)
                    .text("-")
                    .attr("stroke", "red")
                    .attr("stroke-width", 1)
                    .style("cursor", "pointer")
                    .on("mousedown", function(){
                        if(pos.type == "right"){
                            var len = data["mb"].length;
                            if(len < 2){
                                return;
                            }
                            data["mb"].splice(len-1, 1);
                            mb.draw(svgObj, data);
                        }else if(pos.type == "down"){
                            var len = data["mb"][pos.index].length;
                            if(len < 2){
                                return;
                            }
                            data["mb"][pos.index].splice(len-1, 1);
                            mb.draw(svgObj, data);
                        }
                    });
            }
            mb.drawPath = function(svgObj, data){
                var path = svgObj.append("path");

                path.attr("d", this.genPath(data))
                    .attr("fill", "none");
                    //.attr("stroke", "red");
            }
            mb.genPath = function(data){
                var itemWidth = data["item"]["width"];
                var itemHeight = data["item"]["height"];
                var items = data["mb"];
                var maxHeight = 0;
                items.map(function(o,i){
                    if(maxHeight < o.length){
                        maxHeight = o.length;
                    }
                });
                var totalWidth = itemWidth*items.length;
                var totalHeight = itemHeight*maxHeight;
                data.width = totalWidth;
                data.height = totalHeight;
                var pathData = [];
                pathData.push({x:0, y:0});
                pathData.push({x:totalWidth, y:0});
                pathData.push({x:totalWidth, y:items[items.length-1].length*itemHeight});

                for(var i=items.length-1;i>0;i--){
                    var xy = {};
                    xy.x = i*itemWidth;
                    xy.y = items[i].length*itemHeight;
                    pathData.push(xy);
                    xy = {};
                    xy.x = i*itemWidth;
                    xy.y = items[i-1].length*itemHeight;
                    pathData.push(xy);
                }
                pathData.push({x:0, y:items[0].length*itemHeight});
                pathData.push({x:0, y:0});
                var points = mb.lineFunc(pathData);
                return points;
            }
            mb.lineFunc = function(d){
                var points = "";
                d.map(function(p,i){
                    if(i == 0){
                        points += "M"+p.x+","+p.y;
                    }else{
                        points += "L"+p.x+","+p.y;
                    }
                });
                return points;
            }
            mb.makeEditable = function(d, field)
            {
                this.on("mouseover", function() {
                    d3.select(this).style("fill", "red");
                  }).on("mouseout", function() {
                    d3.select(this).style("fill", null);
                  }).on("click", function(d) {
                    var p = this.parentNode;
                    var xy = this.getBBox();
                    var p_xy = p.getBBox();
            
                    xy.x -= p_xy.x;
                    xy.y -= p_xy.y;
            
                    var el = d3.select(this);
                    var p_el = d3.select(p);
            
                    var frm = p_el.append("foreignObject");
            
                    var inp = frm
                        .attr("x", xy.x)
                        .attr("y", xy.y)
                        .attr("width", 300)
                        .attr("height", 25)
                        .append("xhtml:form")
                                .append("input")
                                    .attr("value", function() {
                                        // nasty spot to place this call, but here we are sure that the <input> tag is available
                                        // and is handily pointed at by 'this':
                                        this.focus();
            
                                        return d[field];
                                    })
                                    .attr("style", "width: 294px;")
                                    // make the form go away when you jump out (form looses focus) or hit ENTER:
                                    .on("blur", function() {
            
                                        var txt = inp.node().value;
            
                                        d[field] = txt;
                                        el
                                            .text(function(d) { return d[field]; });
            
                                        // Note to self: frm.remove() will remove the entire <g> group! Remember the D3 selection logic!
                                        p_el.select("foreignObject").remove();
                                    })
                                    .on("keypress", function() {
                                        console.log("keypress", this, arguments);
            
                                        // IE fix
                                        if (!d3.event)
                                            d3.event = window.event;
            
                                        var e = d3.event;
                                        if (e.keyCode == 13)
                                        {
                                            if (typeof(e.cancelBubble) !== 'undefined') // IE
                                              e.cancelBubble = true;
                                            if (e.stopPropagation)
                                              e.stopPropagation();
                                            e.preventDefault();
            
                                            var txt = inp.node().value;
            
                                            d[field] = txt;
                                            el
                                                .text(function(d) { return d[field]; });
            
                                            // odd. Should work in Safari, but the debugger crashes on this instead.
                                            // Anyway, it SHOULD be here and it doesn't hurt otherwise.
                                            p_el.select("foreignObject").remove();
                                        }
                                    });
                  });
            }
            return mb;
        }
    }

    var dragNode = function(){
        var tempNode;
        var targetNode;
        var stX, stY;
        return d3.drag()
                  .on("start",function(d, i){
                      tmpClear();
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
                tempNode.selectAll("*").remove();
                NodeList[tData.type].draw(tempNode, tData);

            })
            .on("end", function(){
                tmpClear();
                updateDiagrams();
                selectNode(targetNode, tData);
            })
            ;
    }();

    var dragLineCircle = function(){
        var d3this;
        var link;
        var node;
        var nx,ny;
        var linkData;
        var startPoint, endPoint, tmpWaypoints;
        var sourceNode, targetNode;
        //var tx,ty,tx2,ty2;
        return d3.drag()
                .on("start", function(d){
                    node = null;
                    d3this = d3.select(this);
                    var lg = d3.select(d.line);
                    link = lg.selectAll("polyline");
                    linkData = link.datum();
                    sourceNode = DATA.nodes.filter(function(d) {
                        return d.id == linkData.source;
                    })[0];
                    targetNode = DATA.nodes.filter(function(d) {
                        return d.id == linkData.target;
                    })[0];

                    //끝
                    if(d.isLast === 1){
                        node = NodeG.select("#nd-"+linkData.target).select("path").node();
                        nx = targetNode.x;
                        ny = targetNode.y;
                    //시작 
                    } else if (d.isLast === 2){
                        node = NodeG.select("#nd-"+linkData.source).select("path").node();
                        nx = sourceNode.x;
                        ny = sourceNode.y;
                    }

                    startPoint = [sourceNode.x+(linkData.sOffsetX || 0), sourceNode.y+(linkData.sOffsetY || 0)];
                    endPoint = [targetNode.x+linkData.tOffsetX, targetNode.y+linkData.tOffsetY];
                    tmpWaypoints = startPoint.concat(linkData.waypoints).concat(endPoint);
                    if(d.isNew){
                        tmpWaypoints.splice( d.index, 0, d3.mouse(this)[0]);
                        tmpWaypoints.splice( d.index+1, 0, d3.mouse(this)[1]);
                    }
                    //waypoints = linkData.waypoints;
                    TempG.append("polyline")
                        .attr("class", "temp-line")
                        .attr("points", tmpWaypoints)
                        .attr("fill", "none")
                        .attr("stroke", "#999")
                        .attr("stroke-width", "2px")
                        .attr("marker-end", "url(#arrowhead)")
                        .attr("opacity", 0.5);
                })
                .on("drag", function(d){
                    var x = (d3.event.x/10).toFixed(0)*10;
                    var y = (d3.event.y/10).toFixed(0)*10;
                    if(node){
                        var points1 = closestPoint(node, [x-nx,y-ny]);
                        x = ((nx + points1[0])/10).toFixed(0)*10;
                        y = ((ny + points1[1])/10).toFixed(0)*10;
                    }
                    tmpWaypoints[d.index] = x;
                    tmpWaypoints[d.index+1] = y;
                    d3this.attr("cx", x)
                        .attr("cy", y);
                    link.attr("points", tmpWaypoints);
                })
                .on("end", function(){
                    linkData.waypoints = tmpWaypoints.slice(2, tmpWaypoints.length-2);
                    linkData.sOffsetX = tmpWaypoints[0]-sourceNode.x;
                    linkData.sOffsetY = tmpWaypoints[1]-sourceNode.y;
                    linkData.tOffsetX = tmpWaypoints[tmpWaypoints.length-2]-targetNode.x;
                    linkData.tOffsetY = tmpWaypoints[tmpWaypoints.length-1]-targetNode.y;

                    tmpClear();
                    updateDiagrams();
                })
                ;
    }();

    var dragNewLink = function(){
        var line;
        var sp1, sp2;
        var sData;
        return d3.drag()
            .on("start", function(){
                var d3this = d3.select(this);
                var sourceNode = d3.select("#" + TempG.attr("target_id"));
                sData = sourceNode.datum();

                var points1 = closestPoint(sourceNode.select("path").node(), [parseInt(d3this.attr("x1")-sData.x),parseInt(d3this.attr("y1"))-sData.y]);
                
                sp1 = [((sData.x + points1[0])/10).toFixed(0)*10, ((sData.y + points1[1])/10).toFixed(0)*10];
                sp2 = [(parseInt(d3this.attr("x2")/10).toFixed(0)*10),(parseInt(d3this.attr("y2"))/10).toFixed(0)*10];

                var m = d3.mouse(this);

                line = LinkG.append("polyline")
                .attr("stroke", "#000000")
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                    .attr("points", [sp1, sp2, d3.event.x-2, d3.event.y-2])
                    .attr("marker-end", "url(#arrowhead)");
                 
                TempG.selectAll("*").transition().duration(200)
                .attr("opacity", 0)
                .remove()
                ;

                NodeG.selectAll(".node")
                        .append("rect")
                        .attr("class", "temp-box")
                        .attr("opacity", 0)
                        .attr("x", -20)
                        .attr("y", -20)
                        .attr("width", function(d){
                            return d.width+40;
                        })
                        .attr("height", function(d){
                            return d.height+40;
                        })
                        ;

            })
            .on("drag", function(){
                var lPoint = [d3.event.x, d3.event.y];
                if(MouseOverNode.node){
                    var points = closestPoint(MouseOverNode.node, [d3.event.x - MouseOverNode.data.x,d3.event.y-MouseOverNode.data.y]);

                    var lx = (points[0]/10).toFixed(0)*10;
                    var ly = (points[1]/10).toFixed(0)*10;

                    var lx2 = MouseOverNode.data.x + lx;
                    var ly2 = MouseOverNode.data.y + ly;

                    //위
                    if(ly === 0){
                        ly2 -= 30;
                    //오른쪽    
                    }else if(MouseOverNode.data.width === lx){
                        lx2 += 30;
                    //아래    
                    }else if(MouseOverNode.data.height === ly){
                        ly2 += 30;
                    //왼쪽    
                    }else{
                        lx2 -= 30;
                    }


                    lx = MouseOverNode.data.x + lx;
                    ly = MouseOverNode.data.y + ly;

                    lPoint = [lx2, ly2, lx, ly];
                    
                }
                line.attr("points", [sp1, sp2, lPoint]);
                
            })
            .on("end", function(){
                if(MouseOverNode.node){
                    var points = line.attr("points").split(",").map(function(v,i,a){
                        return parseInt(v);
                    });
                    var waypoints = points.slice(2,points.length -2);
                    DATA.links.push({
                        source: sData.id,
                        sOffsetX : sp1[0] - sData.x,
                        sOffsetY : sp1[1] - sData.y,
                        target: MouseOverNode.data.id,
                        tOffsetX : points[points.length-2] - MouseOverNode.data.x,
                        tOffsetY : points[points.length-1] - MouseOverNode.data.y,
                        waypoints : waypoints,
                        id : new Date().getTime()
                    });
                    updateDiagrams();
                }
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
        var tPoints = [];
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

        if(UserFn)UserFn(d); 

    }

    /** lineFunction  */
    function makePoints(l){
        var startPoint = [l.sd.x+(l.sOffsetX || 0), l.sd.y+(l.sOffsetY || 0)];
        var endPoint = [l.td.x+l.tOffsetX, l.td.y+l.tOffsetY];
        var i,length;
        var points;
        if(l.waypoints.length > 0){
            var tPoints = startPoint.concat(l.waypoints).concat(endPoint);
            l.waypoints = [];
            length = tPoints.length-1;
            for(i=2;i<length-2;i += 2){
                //같은 선이면 포인트 삭제
                if(!(tPoints[i] === tPoints[i-2] && tPoints[i-2] === tPoints[i+2])
                    && !(tPoints[i+1] === tPoints[i-1] && tPoints[i-1] === tPoints[i+3]))
                {
                    l.waypoints.push(tPoints[i]);
                    l.waypoints.push(tPoints[i+1]);
                }
                
            }
            points = startPoint.concat(l.waypoints).concat(endPoint);
            
        } else {
            points = startPoint.concat(endPoint);
        }
        return points;
    }

    function makeOrthogonalPoints(p1, p2){

        var points = [];

        return points;
        
    }

    /** function */
    function init(trgtId, fn){
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
            ;
        LinkG = viewportG.append("g").attr("id", "link-group");
        NodeG = viewportG.append("g").attr("id", "node-group");
        TempG = viewportG.append("g").attr("id", "temp-group");

        UserFn = fn;

        D3SVG = svg;
        DATA = {nodes:[], links:[]};

        svg.on("click", function(){
            tmpClear();
        });
        initNodeList();
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

    function initNodeList(){

        NodeList = {};

        for(var name in NodesInit){
            NodeList[name] = NodesInit[name]();
        }
    }
    function tmpClear(){
        TempG.selectAll("*").remove();
        if(UserFn)UserFn();
    }
    function clearAll(){
        DATA.links = [];
        DATA.nodes = [];
        updateDiagrams();
    }

    function updateDiagrams(){
        tmpClear();
        drawLine();
        drawNode();
    }

    function drawLine(){
        var links = LinkG.selectAll(".link").data(DATA.links);

        links.exit().remove();

        var lg = links.enter()
            .append("g")
            .datum(function(d,i){
                var sourceNode = DATA.nodes.filter(function(n, i) {
                    return n.id == d.source;
                })[0];
                var targetNode = DATA.nodes.filter(function(n, i) {
                    return n.id == d.target;
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
            })
            .on("click", function(d){
                d3.event.stopPropagation();
                tmpClear();
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
                            index:i,
                            isNew:true,
                            line:this,
                            x:(point1X + point2X)/2,
                            y:(point1Y + point2Y)/2
                        }
                    );
                }
                //기존점
                if(length > 3){
                    for(i=0;i<length;i=i+2){
                        circlePoints.push(
                            {
                                index:i,
                                isNew:false,
                                isLast : (i == length-2) ? 1 : (i == 0) ? 2 : 0,  //0: 중간, 1:마지막, 2:시작
                                line:this,
                                x:points[i]*1,
                                y:points[i+1]*1,
                            }
                        );
                    }
                }
                d.circlePoints = circlePoints;
                TempG.selectAll(".temp-point")
                    .data(circlePoints)
                    .enter()
                    .append("circle")
                    .attr("class", "temp-point")
                    .attr("r", 3)
                    .attr("cx", function(d){return d.x;})
                    .attr("cy", function(d){return d.y;})
                    .attr("fill", "#FC3")
                    //.attr("pointer-events", "none")
                    .attr("stroke-width", function(d,i,a){
                        return (a.length-1 == i) ? 4 : 2;
                    })
                    .attr("stroke", "#FC3")
                    .call(dragLineCircle)
                    .style("opacity", "0")
                    .transition().duration(100).style("opacity", "1")
                    ;
                TempG.append("image")
                    .attr("x", parseInt(points[0]) + 5)
                    .attr("y", parseInt(points[1]) - 5)
                    .attr('width', 16)
                    .attr('height', 16)
                    .attr("xlink:href", "./icon/trash-alt-solid.svg")
                    .style("cursor", "pointer")
                    .on("click", function(){
                        var links = DATA.links.filter(function(e,i,a){
                            return e.id !== d.id;
                        });
                        DATA.links = links;
                        updateDiagrams();

                    })
                    ;
                if(UserFn)UserFn(d);                     
                //circle.transition().duration(200).style("opacity", "1");
            });

        
        lg.append("polyline")
            .attr("class", "line_back")
            .attr("fill", "none")
            .attr("stroke-width", "6px")
            ;

        lg.append("polyline")
            //.attr("class", "link")
            .attr("class", "line")
            //.classed("flowline", true)
            //.on("mousemove", lineMousepoint)
            //.on("mouseover", lineMouseover)
            .attr("fill", "none")
            .attr("stroke-width", "2px")
            .attr("marker-end", "url(#arrowhead)")
            ;

        lg = lg.merge(links);

        lg.select(".line_back").datum(function(d){
            return d;
        })
        .attr("points", makePoints);

        lg.select(".line").datum(function(d){
            return d;
        })
        .attr("stroke", function(d){
            return d.color || "#000000";
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
            var _thisG = d3.select(this);//.selectAll("path").data([d]).enter(); 
            _thisG.selectAll("*").remove();
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
            DATA.links.forEach(function(v){
                delete v.circlePoints;
                delete v.sd;
                delete v.td;
            });
        }
        return DATA;
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
            node.mb = [[{text:"New"}]];
            node.item = {};
            node.item.x = 0;
            node.item.y = 0;
            node.item.width = 100;
            node.item.height = 30;
        }
        
        DATA.nodes.push(node);
        updateDiagrams();
    }

    //set return obj;
    var diagrams = {};
    diagrams.init = init;
    diagrams.setData = setData;
    diagrams.getData = getData;
    diagrams.addBox = addBox;
    diagrams.updateNode = updateDiagrams;

    return diagrams;
}
