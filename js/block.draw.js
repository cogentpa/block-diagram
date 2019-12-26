/** node */
function Node(){}

var StokeStyle = {
    "dash1" : "5,5",
    "dash2" : "10,5",
    "dash3" : "15, 10, 5, 10",
};

var HeadStyle = {
    "head1": "M 0 0 6 3 0 6 1.5 3",
    "head2": "M 0, 3 a 2.5, 2.5 0 1,0 5, 0 a 2.5,2.5 0 1,0 -5, 0",
    "head3": "M 0 0",
};

function Diagram(){
    "use strict";
    /** Util Fnc */
    function isNull(params) {
        return (params === undefined || params === null) ? true : false;
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
            best = scan;
            bestLength = scanLength;
            bestDistance = scanDistance;
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
            best = before;
            bestLength = beforeLength;
            bestDistance = beforeDistance;
          } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after;
            bestLength = afterLength;
            bestDistance = afterDistance;
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

    function removeFromTo(array, from, to) {
        array.splice(from,
            !to ||
            1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * array.length));
        return array.length;
    }

    function getSelNodes () {
        return Selects.filter(e=>e.type);
    }
    function getSelLinks () {
        return Selects.filter(e=>!(e.type));
    }

    const DWIDTH = 3170;
    const DHEIGHT = 2230;

    /** variables */
    var D3SVG;
    var LinkG;
    var NodeG;
    var TempG;
    var PageRect;
    var DATA;
    var NodeList;
    var NodesInit;
    var UserFn;
    var scrollTimer;
    var Zoom;

    //var clipboard;
    var Selects = [];
    var MouseOverNode = { node : null, data : null};

    Node.prototype = {
        genPath: d3.line().x(function(d) { return d.x; })
                          .y(function(d) { return d.y; }),
        drawPath: function(svgObj, points, data){                
            var path = svgObj.append("path");
            path.attr("d", this.genPath(points))
                .attr("stroke", data.color || "black")
                .attr("stroke-width", data.strokeWidth||2)
                .attr("fill", data.fill || "#fff");
            if(data.stroke){
                path.attr("stroke-dasharray", StokeStyle[data.stroke]);
            }
            data.nConn = (data.fill) === "none" ? true : false;//연결 끄기;
        },
        drawText: function(svgObj, data){
            svgObj.append("text")
                .attr("x", data.width/2)
                .attr("y", data.height/2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .text(data.name)
                .attr("fill", data.fColor || "black");
        },
        addUndo: function(){
            UndoManager.add(DATA);
        },
        DECIMAL: 2,
    };

    NodesInit = {
        rect : function(){
            var rect = new Node();
            rect.draw = function(svgObj, data){
                var points = [];
                var mdData;
                
                if(data.isStart){
                    points.push({x:0, y:0});
                    points.push({x:data.width-data.width/5, y:0});
                    points.push({x:data.width, y:data.height/2});
                    points.push({x:data.width-data.width/5, y:data.height});
                    points.push({x:0, y:data.height});
                    points.push({x:0, y:0});
                    
                    mdData = {name : data.name, width : data.width*0.9, height: data.height, fColor:data.fColor};
                } else if(data.isEnd) {
                    points.push({x:0+data.width/5, y:0});
                    points.push({x:data.width, y:0});
                    points.push({x:data.width, y:data.height});
                    points.push({x:0+data.width/5, y:data.height});
                    points.push({x:0, y:data.height/2});
                    points.push({x:0+data.width/5, y:0});
                    
                    mdData = {name : data.name, width : data.width*1.1, height: data.height, fColor:data.fColor};
                } else {
                    points.push({x:0, y:0});
                    points.push({x:data.width, y:0});
                    points.push({x:data.width, y:data.height});
                    points.push({x:0, y:data.height});
                    points.push({x:0, y:0});
                }
                this.drawPath(svgObj, points, data);
                this.drawText(svgObj, mdData || data);
                
            };

            //사용 안하는듯
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
            };
            
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
            };

            return pou;
        },
        circle : function(){
            var circle = new Node();
            circle.draw = function(svgObj, data){

                this.drawPath(svgObj, data, data);
                this.drawText(svgObj, data);
            };

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
            };
            
            return circle;
        },
        mb : function(){
            var mb = new Node();
            mb.draw = function(svgObj, data){
                svgObj.selectAll("g.mbItem").remove();
                svgObj.selectAll("g.mbIcon").remove();

                data.item.width = data.width/data.mb.length;
                data.item.height = data.height/Math.max.apply(Math, data.mb.map(function(o) { return o.length; }));
                
                this.addItem(svgObj, data);
                this.drawPath(svgObj, data);
            };
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
                            if (data["mb"][i][j].merge == "X") {
                                if (i == 0) {
                                    itemWidth = itemWidth * maxX;
                                }
                            } else if (data["mb"][i][j].merge == "Y"){
                                if (j == 0) {
                                    itemHeight = itemHeight * data["mb"][0].length;
                                }
                            }

                            if (data["mb"][i][j].merge == "X" && i != 0) {
                                //console.log("병합데이터. 그리지않음");
                            } else if(data["mb"][i][j].merge == "Y" && j != 0) {
                                //console.log("병합데이터. 그리지않음");
                            } else {
                                rect.attr("x", x)
                                    .attr("y", y)
                                    .attr("width", itemWidth)
                                    .attr("height", itemHeight)
                                    .attr("stroke", data.color || "black")
                                    .attr("stroke-width", data.strokeWidth || 2)
                                    .attr("fill", "#fff")//;
                                    .attr("borderBottom", 10)
                                    .on("dblclick", function(d){
                                    		var classNm = "mb_" + i + "-" + j;
                                    		var selectText = this.parentNode.getElementsByClassName(classNm)[0];
                                    		var p = this.parentNode.parentNode.parentNode.parentNode;
                                    		var xy = this.getBBox();
                                    		var p_xy = p.getBBox();
                                    		var _this = selectText;
                                    		var p_el = d3.select(p);
                                    		var frm = p_el.append("foreignObject");
                                    		var el = d3.select(_this);
                                    		var classNm = d3.select(_this).attr("class") || "";
                                    		var mbPos = classNm.replace("mb_", "").split("-");
                                    		var mbPosX = mbPos[0] || 0;
                                    		var mbPosY = mbPos[1] || 0;

                                    		var inp = frm
                                    				.attr("x", x + d.x)
                                    				.attr("y", y + d.y + 6)
                                    				.attr("width", itemWidth)
                                    				.attr("height", itemHeight)
                                    				.append("xhtml:form")
                                    				.append("input")
                                    				.attr("xmlns", "http://www.w3.org/1999/xhtml")
                                    				.attr("value", function () {
                                    						this.focus();
                                    						var val = d3.select(_this).text();
                                    						if (val == "New" || val == "new") val = "";
                                    						return val;
                                    				})
                                    				.attr("style", "width:"+ itemWidth + "px; height:" + itemHeight + "px;")
                                    				.on("click", function () {
                                    						this.select();
                                    				})
                                    				.on("blur", function () {
                                    						var txt = inp.node().value;
                                    						if (d.mb) {
                                    								if (d.mb[mbPosX][mbPosY]) {
                                    										d.mb[mbPosX][mbPosY]["text"] = txt;
                                    								}
                                    						}
                                    						el.text(function (d) {
                                    								return txt
                                    						});
                                    						if (p_el.select("foreignObject").empty() === false) {
                                    								p_el.select("foreignObject").remove();
                                    						}
                                    					})
                                    				.on("keypress", function () {
                                    						// IE fix
                                    						if (!d3.event) {
                                    								d3.event = window.event;
                                    						}
                                    						var e = d3.event;
                                    						if (e.keyCode == 13) {
                                    								if (typeof (e.cancelBubble) !== 'undefined') { // IE
                                    										e.cancelBubble = true;
                                    								}
                                    								if (e.stopPropagation) {
                                    										e.stopPropagation();
                                    								}
                                    								e.preventDefault();
                                    								e.target.blur();
                                    						}
                                    					});
                                    		var e = d3.event;
                                    		if (e.stopPropagation) {
                                    				e.stopPropagation();
                                    			}
                                    		e.preventDefault();
                                      });

                                var classNm = "mb_" + i + "-" + j;
                                var text = item.append("text").attr("class", classNm);
                                text.attr("x", x + (itemWidth / 2))
                                    .attr("y", y + (itemHeight / 2))
                                    .attr("text-anchor", "middle")
                                    .attr("dominant-baseline", "middle")
                                    .text(b["text"])
                                    .attr("fill", data.fColor || "black")
                                    .on("mouseover", function () {
                                        d3.select(this).attr("fill", "red");
                                    })
                                    .on("mouseout", function () {
                                        d3.select(this).attr("fill", "black");
                                    })
                                    .on("dblclick", function (d) {
                                        var p = this.parentNode.parentNode.parentNode.parentNode;
                                        var xy = this.getBBox();
                                        var p_xy = p.getBBox();
                                        var el = d3.select(this);
                                        var p_el = d3.select(p);
                                        var frm = p_el.append("foreignObject");
                                        var _this = this;
                                        var classNm = d3.select(_this).attr("class") || "";
                                        var mbPos = classNm.replace("mb_", "").split("-");
                                        var mbPosX = mbPos[0] || 0;
                                        var mbPosY = mbPos[1] || 0;
                                        var inp = frm
                                            .attr("x", x + d.x)
                                            .attr("y", y + d.y + 6)
                                            .attr("width", itemWidth)
                                            .attr("height", itemHeight)
                                            .append("xhtml:form")
                                            .append("input")
                                            .attr("xmlns", "http://www.w3.org/1999/xhtml")
                                            .attr("value", function () {
                                                this.focus();
                                                var val = d3.select(_this).text();
                                                if (val == "New" || val == "new") val = "";
                                                return val;
                                            })
                                            .attr("style", "width:"+ itemWidth + "px; height:" + itemHeight + "px;")
                                            .on("click", function () {
                                                this.select();
                                            })
                                            .on("blur", function () {
                                                var txt = inp.node().value;
                                                if (d.mb) {
                                                    if (d.mb[mbPosX][mbPosY]) {
                                                        d.mb[mbPosX][mbPosY]["text"] = txt;
                                                    }
                                                }
                                                el.text(function (d) { return txt; });
                                                if (p_el.select("foreignObject").empty() === false) {
                                                    p_el.select("foreignObject").remove();
                                                }
                                            })
                                            .on("keypress", function () {
                                                // IE fix
                                                if (!d3.event) {
                                                    d3.event = window.event;
                                                }
                                                var e = d3.event;
                                                if (e.keyCode == 13) {
                                                    if (typeof (e.cancelBubble) !== 'undefined') { // IE
                                                        e.cancelBubble = true;
                                                    }
                                                    if (e.stopPropagation) {
                                                        e.stopPropagation();
                                                    }
                                                    e.preventDefault();
                                                    e.target.blur();
                                                }
                                            });
                                        var e = d3.event;
                                        if (e.stopPropagation) {
                                            e.stopPropagation();
                                        }
                                        e.preventDefault();
                                    });
                            }
                            
                            itemWidth = data["item"]["width"];
                            itemHeight = data["item"]["height"];
                            if (y == 0) {
                                mb.addIcon(svgObj, data, { type: "down", x: x + itemWidth / 2 + 20, y: -5, index: i, indexY: j });
                            }
                                if (maxX == i + 1) {
                                    mb.addIcon(svgObj, data, { type: "right", x: x + itemWidth + 5 + maxX, y: 10 + y, index: i, indexY: j });
                                }

                        });
                    });
                }
                return item;
            };
            mb.addIcon = function (svgObj, data, pos) {
            	var iconG = svgObj.append("g").attr("class", "mbIcon");
                iconG.attr("transform", "translate(" + pos.x + "," + pos.y + ")");
                if(data["mb"].length-1 == pos.index && pos.indexY == '0'){
                    var plusIcon = iconG.append("text").attr("class", "plus");
                    plusIcon.attr("x", 15)
                        .attr("y", 0)
                        .text("+")
                        .attr("stroke", "blue")
                        .attr("stroke-width", 1)
                        .style("cursor", "pointer")
                        .on("mousedown", function () {
                            if (pos.type == "right") {
                                data["mb"].push([{ text: "new", merge: "" }]);
                                for (var h = 0; h <= data["mb"][0].length - 2; h++) {
                                    data["mb"][data["mb"].length - 1].push({ text: "new", merge: "" });
                                }
                                updateDiagrams();
                            } else if (pos.type == "down") {
                                for (var g = 0; g <= data["mb"].length - 1; g++) {
                                    data["mb"][g].push({ text: "new", merge: "" });
                                }
                                updateDiagrams();
                            }
                        });

                    var minusIcon = iconG.append("text").attr("class", "minus");
                    minusIcon.attr("x", 30)
                        .attr("y", 0)
                        .text("-")
                        .attr("stroke", "red")
                        .attr("stroke-width", 1)
                        .style("cursor", "pointer")
                        .on("mousedown", function () {
                            if (pos.type == "right") {
                                var len = data["mb"].length;
                                if (len < 2) {
                                    return;
                                }
                                data["mb"].splice(len - 1, 1);
                                updateDiagrams();
                            } else if (pos.type == "down") {
                                var len = data["mb"][pos.index].length;
                                if (len < 2) {
                                    return;
                                }
                                for (var g = 0; g <= data["mb"].length; g++) {
                                    data["mb"][g].splice(len - 1, 1);
                                }
                                updateDiagrams();
                            }
                        });
                    }

                var circleIcon = iconG.append("text").attr("class", "circle");
                circleIcon.attr("x", 0)
                    .attr("y", 0)
                    .text("o")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .style("cursor", "pointer")
                    .on("mousedown", function () {
                        if (pos.type == "right") {
                            var len = data["mb"].length;
                            var flag = true;
                            if (len < 2) {
                                return;
                            }
                            for (var a = 0; a < len; a++) {
                                if (data["mb"][a][pos.indexY].merge == "X") {
                                    flag = false
                                    break;
                                } else if (data["mb"][a][pos.indexY].merge == "Y"){
                                    return;
                                }
                            }
                            if (flag) {
                                for (var m = 0; m < data["mb"].length; m++) {
                                    data["mb"][m][pos.indexY].merge = "X";
                                }
                            } else {
                                for (var m = 0; m < data["mb"].length; m++) {
                                    data["mb"][m][pos.indexY].merge = "";
                                }
                            } 
                            updateDiagrams();

                        } else if (pos.type == "down") {
                            var len = data["mb"][pos.index].length;
                            var flag = true;
                            if (len < 2) {
                                return;
                            }
                            for (var a = 0; a < data["mb"].length; a++) {
                                for (var b = 0; b < data["mb"][a].length; b++) {
                                    if (data["mb"][pos.index][b].merge == "X") {
                                        return;
                                    } else if(data["mb"][pos.index][b].merge == "Y"){
                                        flag = false;
                                        break;
                                    }
                                }
                            }
                            if (flag) {
                                for (var m = 0; m < data["mb"][pos.index].length; m++) {
                                    data["mb"][pos.index][m].merge = "Y";
                                }
                            } else {
                                for (var m = 0; m < data["mb"][pos.index].length; m++) {
                                    data["mb"][pos.index][m].merge = "";
                                }
                            }
                            updateDiagrams();
                        }
                    });
            };

            mb.drawPath = function(svgObj, data){
                var path = svgObj.append("path");

                path.attr("d", this.genPath(data))
                    .attr("fill", "none");
                    //.attr("stroke", "red");
            };

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
            };

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
            };

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
            };

            return mb;
        },
        tb : function(){
            var tb = new Node();
            tb.draw = function(svgObj, data){
                var points = [];
                    points.push({x:0, y:0});
                    points.push({x:data.width, y:0});
                    points.push({x:data.width, y:data.height});
                    points.push({x:0, y:data.height});
                    points.push({x:0, y:0});

                this.drawPath(svgObj, points, data);
                this.drawText(svgObj, data);
                
            };

            tb.getPathData = function(data){
                var points = [];
                points.push({x:0, y:0});
                points.push({x:data.width, y:0});
                points.push({x:data.width, y:data.height});
                points.push({x:0, y:data.height});
                points.push({x:0, y:0});
                return this.genPath(points);
            };
            tb.drawPath = function(svgObj, points, data){                
                var path = svgObj.append("path");
                path.attr("d", this.genPath(points))
                    .attr("class", "textPath")
                    .attr("stroke-width", data.strokeWidth||2)
            };
            tb.drawText = function(svgObj, data){
                var text = svgObj.append("text");
                text.attr("x", data.width/2)
                    .attr("y", data.height/2)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .text(data.name || "text")
                    .attr("fill", data.color || "black")
                    .style("font-size", data.height-(data.height/5))
                    .on("mouseover", function() {
                        d3.select(this).attr("fill", "red");
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("fill", data.color || "black")
                    })
                    .on("click", function(d) {
                        var p = this.parentNode.parentNode.parentNode;
                        var el = d3.select(this);
                        var p_el = d3.select(p);
                        var frm = p_el.append("foreignObject");
                        var _this = this;
                        
                        var inp = frm
                            .attr("x", d.x)
                            .attr("y", d.y+3)
                            .attr("width", d.width-6)
                            .attr("height", d.height)
                            .append("xhtml:form")
                            .append("input")
                            .attr("xmlns","http://www.w3.org/1999/xhtml")
                            .attr("value", function() {
                                this.focus();
                                var val = d3.select(_this).text();
                                return val;
                            })
                            .attr("style", "display:inline-block;width:"+(d.width-6)+"px;height:"+(d.height-4)+"px;")
                            .on("click", function(){
                                this.select();
                            })
                            .on("blur", function() {
                                var txt = inp.node().value;
                                d.name = txt;
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
                svgObj.on("dblclick", function(){
                    var e = d3.event;
                    if (e.stopPropagation){
                        e.stopPropagation();
                    }
                    e.preventDefault();
                    text.node().dispatchEvent(new Event("click", {bubbles: true, cancelable: true}));
                });

            };
            
            return tb;
        },
        scope : function(){
            var scope = new Node();
            scope.draw = function(svgObj, data){

                data.nConn = true; //연결 끄기;

                var points = [];
                var points2 = [];
                points.push({x:data.width/2, y:data.height/3});
                points.push({x:0, y:0});
                points.push({x:data.width/2, y:0});
                points.push({x:data.width/2-1, y:data.height});
                
                points2.push({x:data.width/2, y:data.height/3});
                points2.push({x:data.width, y:0});
                points2.push({x:data.width/2, y:0});
                points2.push({x:data.width/2, y:data.height});

                this.drawPath(svgObj, points, points2, data);
            };

            scope.drawPath = function(svgObj, points, points2, data){
                //size 조절용 path
                var sp = [];
                sp.push({x:0, y:0});
                sp.push({x:data.width, y:0});
                sp.push({x:data.width, y:data.height});
                sp.push({x:0, y:data.height});
                sp.push({x:0, y:0});

                svgObj.append("path")
                    .attr("d", this.genPath(sp))
                    .attr("fill", "none");

                //본 모양 Path
                var path = svgObj.append("path");
                var path2 = svgObj.append("path");

                path.attr("d", this.genPath(points))
                    .attr("stroke", data.color || "black")
                    .attr("stroke-width", data.strokeWidth ||2)
                    .attr("fill", data.fill || "#000");
                path2.attr("d", this.genPath(points2))
                    .attr("stroke", data.color || "black")
                    .attr("stroke-width", data.strokeWidth||2)
                    .attr("fill", data.fill || "#fff");
           };

            return scope;
        }
    };

    var UndoManager = function() {
        var dataStack = [],
            dataStack2 = [],
            index = -1,
            limit = 0,
            isExecuting = false,
            callback,
            callback2;

        return {
            add: function (data) {
                if (isExecuting) {return this;}
                dataStack.splice(index + 1, dataStack.length - index);
                dataStack.push(JSON.stringify(data));
               
                // if limit is set, remove items from the start
                if (limit && dataStack.length > limit) {
                    removeFromTo(dataStack, 0, -(limit+1));
                }

                if(callback2){
                    dataStack2.splice(index + 1, dataStack2.length - index);
                    dataStack2.push(callback2("add"));
                    if (limit && dataStack2.length > limit) {
                        removeFromTo(dataStack2, 0, -(limit+1));
                    }
                }

                index = dataStack.length - 1;
                return this;
            },
            setCallback: function (callbackFunc) {
                callback = callbackFunc;
            },
            setExtCallback: function (callbackFunc) {
                callback2 = callbackFunc;
            },
            undo: function () {
                var dataString = dataStack[index-1];
                var dataString2 = dataStack2[index-1];
                if (!dataString) {return this;}
                isExecuting = true;
                index -= 1;
                if (callback2) {callback2(dataString2);}
                if (callback) {callback(dataString);}
                isExecuting = false;
                return this;
            },
            redo: function () {
                var dataString = dataStack[index+1];
                var dataString2 = dataStack2[index+1];
                if (!dataString) {return this;}
                isExecuting = true;
                index += 1;
                if (callback2) {callback2(dataString2);}
                if (callback) {callback(dataString);}
                isExecuting = false;
                return this;
            },
            clear: function () {
                dataStack = [];
                index = -1;
            },
            hasUndo: function () {
                return index !== -1;
            },
            hasRedo: function () {
                return index < (dataStack.length - 1);
            },
            getDataStack: function () {
                return dataStack;
            },
            getIndex: function() {
                return index;
            },
            setLimit: function (l) {
                limit = l;
            }
        };
    }();

    //외부 노드목록 드래그 연동
    var addNodeDragHandler = function(){
        let nowDraging = false;
        let nodeInitData = {
            rect : {type:"rect",width:100,height:40},
            circle : {type:"circle",width:100,height:100},
            mb : {type:"mb",width:100,height:30,item:{},mb:[[{text:"New", merge: ""}]]},
            start : {type:"rect",width:100,height:40,isStart:true},
            end : {type:"rect",width:100,height:40, isEnd:true},
            pou : {type:"pou",width:100,height:100},
            tb : {type:"tb",width:100,height:20},
            scope : {type:"scope",width:30,height:60},
            cal : {type:"cal",width:100,height:28},
            table : {type:"table",width:200,height:40,name:"Calc Table",cols:2,rows:2,currCols:0,currRows:0,cells:[]}
        };//기본값 layout과 같이 쓰게 바꿔야 할듯
        let d3TmpNode;
        let nData;
        let scale;

        return {
            init : function(){
                let svgNode = D3SVG.node();
                svgNode.addEventListener("dragenter",this.dragenter, false);
                svgNode.addEventListener("dragover",this.dragover);
                svgNode.addEventListener("drop",this.drop);
            },
            dragStart : function(id){
                if(id){
                    nowDraging = id;
                }else{
                    nowDraging = false;
                }
            },
            dragEnd : function(e){
                tmpClear();
            },
            dragenter : function(e){
                e.preventDefault();
                if(nowDraging){
                    tmpClear();
                    scale = d3.zoomTransform(D3SVG.node().parentNode).k;
                    nData = JSON.parse(JSON.stringify(nodeInitData[nowDraging]));
                    d3TmpNode = TempG.append('g').attr('class', 'tmp_add_node')
                        .attr('transform', 'translate('+(e.offsetX/scale)+','+(e.offsetY/scale)+')');
                    NodeList[nData.type].draw(d3TmpNode, nData);
                    nowDraging = false;
                }
            },
            dragover : function(e){
                if(nData){
                    e.preventDefault();
                    d3TmpNode.attr('transform', 'translate('+(e.offsetX/scale)+','+(e.offsetY/scale)+')');
                } else {
                    e.dataTransfer.dropEffect = "none"
                }
            },
            drop : function(e){
                if(nData){
                    e.preventDefault();
                    nData.x = parseInt(e.offsetX/scale/10)*10;
                    nData.y = parseInt(e.offsetY/scale/10)*10;
                    addBox(nData);
                    nData = null; 
                }
            }
        }
    }();

    var moveNode = function(){
        var moveEvt = {stX:0, stY:0, diffX:0, diffY:0};
        var tempNode;
        moveEvt.start = function(keyCode){
            if(Selects.length > 0){
                if(tempNode)tempNode.remove();
                tempNode = NodeG.append("g");
                tempNode.selectAll("use").data(Selects)
                .enter().append("use")
                .attr("xlink:href", function(d){
                    return (d.type ? "#nd-" : "#ln-") + d.id;
                })
                .attr("opacity", 0.5)
                ;
                
                this.stX = Selects[0].x;
                this.stY = Selects[0].y;
                
                tmpClear(false);
                this.keyDown(keyCode);
            }
        };
        moveEvt.keyDown = function(keyCode){
            if(Selects.length > 0){
                d3.event.preventDefault();
                switch (keyCode) {
                    case 37://left
                        //if(d.x >= 10){
                            this.diffX -= 10;
                        //}
                        break;
                    case 38://up
                        //if(d.y >= 10){
                            this.diffY -= 10;
                        //}
                        break;
                    case 39://right
                        this.diffX += 10;
                        break;
                    case 40://down
                        this.diffY += 10;
                        break;
                    default:
                        break;
                }
                tempNode.attr("transform", "translate("+ this.diffX +","+ this.diffY +")");
            }
        };
        moveEvt.keyUp = function(){
            if(Selects.length > 0){
                d3.event.preventDefault();
                tempNode.remove();
                moveEnd(this.stX, this.stY, this.diffX, this.diffY);
                this.stX=0
                this.stY=0
                this.diffX=0
                this.diffY=0;

                selectItem();
            }
        };
        
        return moveEvt;
    }();

    var dragItem = function(){
        var tempNode;
        var stX, stY, diffX, diffY;
        var dragFlag;
        return d3.drag()
                .clickDistance(0)
                .filter(() => !d3.event.ctrlKey)
                .on("start",function(d, i){
                    dragFlag = false;
                    /**
                     * 클릭-드래그 경우의 수 정리
                     * 1. Selects 에 내가 없는경우 => Selects 나만
                     * 2. Selects 에 내가 있는경우 => 그대로 진행
                     */
                    if(!Selects.includes(d)){Selects = [d]};
                    stX = d.x;
                    stY = d.y;
                    //tmpClear(false);
                })
                .on("drag",function(d, i){
                    //클릭시에는 안그려지기 위해서 drag에 서 추가
                    if(!dragFlag){
                        dragFlag = true;
                        tempNode = NodeG.append("g")
                        tempNode.selectAll("use").data(Selects)
                        .enter().append("use")
                        .attr("xlink:href", function(d){
                            return (d.type ? "#nd-" : "#ln-") + d.id;
                        })
                        .attr("opacity", 0.5);
                    }
                    //diffX = (((d3.event.x/10) << 1) >> 1)*10 - stX;
                    //diffY = (((d3.event.y/10) << 1) >> 1)*10 - stY;
                    diffX = ((d3.event.x/10).toFixed(0)*10) - stX;
                    diffY = ((d3.event.y/10).toFixed(0)*10) - stY;
                    tempNode.attr("transform", "translate("+ diffX +","+ diffY +")");
                    //tempNode.attr("transform", "translate("+ d3.event.x +","+ d3.event.y +")");
                })
                .on("end",function(d, i){
                    if(dragFlag){
                        tempNode.remove();
                        moveEnd(stX, stY, diffX, diffY);
                        selectItem();
                    }
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
                //d3.event.stopPropagation();
                //tmpClear();
                updateDiagrams();
                selectItem(tData);
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
        var tmpBox;
        //var tx,ty,tx2,ty2;
        return d3.drag()
                .on("start", function(d){
                    node = null;
                    d3this = d3.select(this);
                    var lg = d3.select(d.line);
                    link = lg.selectAll("polyline");
                    linkData = link.datum();
                    sourceNode = DATA.nodes.find(function(d) {
                        return d.id == linkData.source;
                    });
                    targetNode = DATA.nodes.find(function(d) {
                        return d.id == linkData.target;
                    });

                    //끝
                    if(d.isLast === 1 && targetNode){
                        node = NodeG.select("#nd-"+linkData.target).select("path").node();
                        nx = targetNode.x;
                        ny = targetNode.y;
                    //시작 
                    } else if (d.isLast === 2 && sourceNode){
                        node = NodeG.select("#nd-"+linkData.source).select("path").node();
                        nx = sourceNode.x;
                        ny = sourceNode.y;
                    }
                    tmpWaypoints = (sourceNode) ? [sourceNode.x+(linkData.sOffsetX || 0), sourceNode.y+(linkData.sOffsetY || 0)].concat(linkData.waypoints) : linkData.waypoints;
                    if(targetNode){
                        tmpWaypoints = tmpWaypoints.concat([targetNode.x+linkData.tOffsetX, targetNode.y+linkData.tOffsetY]);
                    }
                    //startPoint = [sourceNode.x+(linkData.sOffsetX || 0), sourceNode.y+(linkData.sOffsetY || 0)];
                    //endPoint = [targetNode.x+linkData.tOffsetX, targetNode.y+linkData.tOffsetY];
                    //tmpWaypoints = startPoint.concat(linkData.waypoints).concat(endPoint);
                    
                    if(d.isNew){
                        tmpWaypoints.splice( d.index, 0, d3.mouse(this)[0]);
                        tmpWaypoints.splice( d.index+1, 0, d3.mouse(this)[1]);
                    }
                    let ah = ((linkData.color || "").replace("#", ""))+(linkData.arrow || "")
                    //waypoints = linkData.waypoints;
                    TempG.append("polyline")
                        .attr("class", "temp-line")
                        .attr("points", tmpWaypoints)
                        .attr("fill", "none")
                        .attr("stroke", "#999")
                        .attr("stroke-width", "2px")
                        .attr("marker-end", "url(#arrowhead"+(ah ? "-"+ah:"")+")")
                        .attr("opacity", 0.5);

                    tmpBox = NodeG.selectAll(".node")
                        .append("rect")
                        .attr("class", "temp-box")
                        .attr("opacity", 0)
                        .attr("x", -10)
                        .attr("y", -10)
                        .attr("width", function(d){
                            return d.nConn ? 0 : d.width+20;
                        })
                        .attr("height", function(d){
                            return d.nConn ? 0 : d.height+20;
                        })
                        ;
                    NodeG.style("opacity", 0.8).raise();
                })
                .on("drag", function(d){
                    var x = (d3.event.x/10).toFixed(0)*10;
                    var y = (d3.event.y/10).toFixed(0)*10;
                    if(node){
                        var points1 = closestPoint(node, [x-nx,y-ny]);
                        var tx = ((nx + points1[0])/10).toFixed(0)*10;
                        var ty = ((ny + points1[1])/10).toFixed(0)*10;
                        var distance = Math.hypot(tx-x, ty-y);
                        
                        if(distance < 30){
                            x = tx;
                            y = ty;
                        //원 노드와 거리가 멀어지면 연결 끊기
                        } else {
                            node = null;
                            if(d.isLast === 1){
                                linkData.target = null;
                                linkData.td = null;
                                linkData.tOffsetX = 0;
                                linkData.tOffsetY = 0;
                            } else if(d.isLast === 2){
                                linkData.source = null;
                                linkData.sd = null;
                                linkData.sOffsetX = 0;
                                linkData.sOffsetY = 0;
                            }
                        }
                    } else if(d.isLast > 0 && MouseOverNode.node){
                        nx = MouseOverNode.data.x;
                        ny = MouseOverNode.data.y;    
                        let points = closestPoint(MouseOverNode.node, [d3.event.x - nx,d3.event.y-ny]);
                        node = MouseOverNode.node;
                        // isLast: 1 => target, 2 => source
                        if(d.isLast === 1){
                            targetNode = MouseOverNode.data
                            linkData.target = MouseOverNode.data.id;
                            linkData.td = MouseOverNode.data;
                            linkData.tOffsetX = ((points[0]/10).toFixed(0)*10);
                            linkData.tOffsetY = ((points[1]/10).toFixed(0)*10);
                            x = nx+linkData.tOffsetX;
                            y = ny+linkData.tOffsetY;
                        } else {
                            sourceNode = MouseOverNode.data;
                            linkData.source = MouseOverNode.data.id;
                            linkData.sd = MouseOverNode.data;
                            linkData.sOffsetX = ((points[0]/10).toFixed(0)*10);
                            linkData.sOffsetY = ((points[1]/10).toFixed(0)*10);
                            x = nx+linkData.sOffsetX;
                            y = ny+linkData.sOffsetY;
                        }
                    }
                    tmpWaypoints[d.index] = x;
                    tmpWaypoints[d.index+1] = y;
                    d3this.attr("cx", x)
                        .attr("cy", y);
                    link.attr("points", tmpWaypoints);
                })
                .on("end", function(d){
                    NodeG.style("opacity", 1);
                    TempG.raise();
                    if(linkData.target){
                        linkData.tOffsetX = tmpWaypoints[tmpWaypoints.length-2]-targetNode.x;
                        linkData.tOffsetY = tmpWaypoints[tmpWaypoints.length-1]-targetNode.y;
                        tmpWaypoints.splice(tmpWaypoints.length-2, 2)
                    }
                    if (linkData.source){
                        linkData.sOffsetX = tmpWaypoints[0]-sourceNode.x;
                        linkData.sOffsetY = tmpWaypoints[1]-sourceNode.y;
                        tmpWaypoints.splice(0, 2)

                    }
                    linkData.waypoints = tmpWaypoints;
                    
                    tmpBox.remove();
                    tmpClear();
                    updateDiagrams();
                })
                ;
    }();

    var dragNewLink = function(){
        var line;
        var tmpBox;
        var sp1, sp2;
        var diffX, diffY;
        var sData;
        var scrollEl;
        var conH;
        var conW;
        var bVertical;
        const padd = 20;
        return d3.drag()
            .on("start", function(){
                scrollEl = D3SVG.node().parentNode;
                conH = scrollEl.clientHeight;
                conW = scrollEl.clientWidth;
                
                let d3this = d3.select(this);
                let sourceNode = d3.select("#" + TempG.attr("target_id"));
                sData = sourceNode.datum();

                let points1 = closestPoint(sourceNode.select("path").node(), [parseInt(d3this.attr("x1")-sData.x),parseInt(d3this.attr("y1"))-sData.y]);
                
                diffX = (parseInt(d3this.attr("x2")) - parseInt(d3this.attr("x1")))/30;
                diffY = (parseInt(d3this.attr("y2")) - parseInt(d3this.attr("y1")))/30;

                sp1 = [((sData.x + points1[0])/10).toFixed(0)*10, ((sData.y + points1[1])/10).toFixed(0)*10];
                sp2 = [sp1[0]+(diffX?diffX*10:0), sp1[1]+(diffY?diffY*10:0)];
                bVertical = (d3this.attr("x1") === d3this.attr("x2"));

                line = LinkG.append("polyline")
                .attr("stroke", "#000000")
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                    .attr("points", [sp1, /*sp2,*/ d3.event.x-2, d3.event.y-2])
                    .attr("marker-end", "url(#arrowhead)");
                 
                TempG.selectAll("*")
                    .transition().duration(200)
                    .attr("opacity", 0)
                    .remove();
                
                
                tmpBox = NodeG.selectAll(".node")
                        .append("rect")
                        .attr("class", "temp-box")
                        .attr("opacity", 0)
                        .attr("x", -20)
                        .attr("y", -20)
                        .attr("width", function(d){
                            return d.nConn ? 0 : d.width+40;
                        })
                        .attr("height", function(d){
                            return d.nConn ? 0 : d.height+40;
                        })
                        ;
                NodeG.style("opacity", 0.8).raise();

            })
            .on("drag", function(){
                clearInterval(scrollTimer);
                
                /* side scroll Start*/
                var mx = d3.event.x-scrollEl.scrollLeft;
                var my = d3.event.y-scrollEl.scrollTop;
                var sx = 0;
                var sy = 0;

                if(mx < 21){
                    sx = -3 + (mx/10);
                }else if(mx > conW-20){
                    sx = 3 - (conW-mx)/10;
                }
                if(my < 21){
                    sy = -3 + my/10;
                }else if(my > conH-20){
                    sy = 3 - (conH-my)/10;
                }

                if(sx !== 0 || sy !== 0){
                    scrollTimer = setInterval(function(){
                        scrollEl.scroll(scrollEl.scrollLeft+sx, scrollEl.scrollTop+sy)
                    },30)
                }
                /* side scroll End*/

                let lPoint = [d3.event.x, d3.event.y];
                
                if(MouseOverNode.node){
                    let nx = MouseOverNode.data.x;
                    let ny = MouseOverNode.data.y;
                    let nw = MouseOverNode.data.width;
                    let nh = MouseOverNode.data.height;

                    let points = closestPoint(MouseOverNode.node, [d3.event.x - nx,d3.event.y-ny]);
                    let p3 = [];

                    let lx = (points[0]/10).toFixed(0)*10;
                    let ly = (points[1]/10).toFixed(0)*10;
                    
                    let lx2 = nx+lx;
                    let ly2 = ny+ly;

                    //위
                    if(ly === 0){
                        ly2 -= padd;
                        //시작y값이 
                        if(sp2[1] > ly2){
                            if(sp2[0] > lx2){
                                p3 = [nx+nw+padd,ly2];
                            }else{
                                p3 = [nx-padd,ly2];
                            }
                        }
                    //오른쪽    
                    }else if(nw === lx){
                        lx2 += padd;
                        if(sp2[0] < lx2){
                            if((sp2[1] >= ny-padd && sp2[1]-padd <= ny+nh)){
                                if(ly2 > ny+(nh/2)){
                                    let ty = ny+nh+padd;
                                    p3 = [nx-padd,ty, nx+nw+padd,ty];
                                }else{
                                    let ty = ny-padd;
                                    p3 = [nx-padd, ty, nx+nw+padd,ty];
                                }
                            }else{
                                if(sp2[1] < ny){
                                    p3 = [nx+nw+padd,ny-padd];
                                }else{
                                    p3 = [nx+nw+padd,ny+nh+padd];
                                }
                            }
                        }
                    //아래    
                    }else if(nh === ly){
                        ly2 += padd;
                        if(sp2[1] < ly2){
                            if(sp2[0] > lx2){
                                p3 = [nx+nw+padd,ly2];
                            }else{
                                p3 = [nx-padd,ly2];
                            }
                        }
                    //왼쪽    
                    }else{
                        lx2 -= padd;
                        if(sp2[0] > lx2){
                            if(sp2[1] >= ny && sp2[1] <= ny+nh){
                                if(ly2 > ny+(nh/2)){
                                    let ty = ny+nh+padd;
                                    p3 = [nx+nw+padd,ty, nx-padd,ty];
                                }else{
                                    let ty = ny-padd;
                                    p3 = [nx+nw+padd,ty, nx-padd, ty];
                                }
                            }else{
                                if(sp2[1] < ny){
                                    p3 = [nx-padd,ny-padd];
                                }else{
                                    p3 = [nx-padd,ny+nh+padd];
                                }
                            }
                        }
                    }

                    lPoint = p3.concat([lx2, ly2, nx+lx, ny+ly]);
                }
                let sp = sp1.concat(sp2);

                //diffX, diffY => 우측 선이면 -, 좌측선이면 +;
                if(bVertical){
                    //선이 반대로가는경우
                    if((sp2[1]-lPoint[1])*diffY > 0){
                        let x = (sp2[0]>lPoint[0]) ? sData.x-padd : sData.x+sData.width+padd;
                        lPoint = [x, sp2[1],x, lPoint[1]].concat(lPoint);
                    }else{
                        lPoint = [sp2[0], lPoint[1]].concat(lPoint);
                    }
                }else{
                    if((sp2[0]-lPoint[0])*diffX > 0){
                        lPoint = [sp2[0], lPoint[1]].concat(lPoint);
                    }else{
                        lPoint = [lPoint[0], sp2[1]].concat(lPoint);
                    }
                }
                line.attr("points", sp.concat(lPoint));
                
            })
            .on("end", function(){
                clearInterval(scrollTimer);
                NodeG.style("opacity", 1);
                TempG.raise();
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
                        strokeWidth : 2,
                        id : new Date().getTime()
                    });
                    updateDiagrams();
                }
                tmpBox.remove();
                line.remove();
            });
    }();
    
    var dragSelection = function(){

        var dragFlag;
        var selectionRect;
        var originX, originY;

        function getNewAttributes(newX, newY) {
            var x = newX < originX ? newX : originX;
            var y = newY < originY? newY : originY;
            var width = Math.abs(newX - originX);
            var height = Math.abs(newY - originY);
            return {
                x: x,
                y: y,
                w: width,
                h: height
            };
        }

        return d3.drag()
            .filter(function () {
                return !d3.event.ctrlKey;
            })
            .on("start",function(d, i){
                //d3.event.sourceEvent.stopPropagation();
                //d3.event.sourceEvent.stopImmediatePropagation();
                dragFlag = false;
            })
            .on("drag",function(d, i){
                let p = d3.mouse(this);
                let scale = Zoom.getScale();
                if(!dragFlag){
                    dragFlag = true;
                    originX = parseInt(p[0]/scale);
                    originY = parseInt(p[1]/scale);
                    selectionRect = TempG.append("rect")
                        .attr("x", originX)
                        .attr("y", originY)
                        .attr("width", 0)
                        .attr("height", 0)
                        .classed("selection", true)
                        .attr("style", "fill:rgba(72,83,255,0.1);stroke-width:1;stroke:rgb(72,83,255)")
                    ;
                } else {
                    let s = getNewAttributes(parseInt(p[0]/scale),parseInt(p[1]/scale));
                    selectionRect
                        .attr("x", s.x)
                        .attr("y", s.y)
                        .attr("width", s.w)
                        .attr("height", s.h)
                    ;
                }
            })
            .on("end",function(d, i){
                tmpClear();
                if(dragFlag){
                    let scale = Zoom.getScale();
                    let p = d3.mouse(this);
                    let s = getNewAttributes(parseInt(p[0]/scale),parseInt(p[1]/scale));
                    let sX = s.x;
                    let sY = s.y;
                    let eX = s.x + s.w;
                    let eY = s.y + s.h;
                    
                    let ns = DATA.nodes.filter( e => {                        
                        return (e.x >= sX && e.x + e.width <= eX) && (e.y >= sY && e.y + e.height <= eY);
                    })
                    let ls = DATA.links.filter( e => {
                        let way = e.waypoints;
                        for(let i = 0; i < way.length; i += 2){
                            //범위안에 없으면 return false
                            if(way[i] < sX || way[i] > eX || way[i+1] < sY || way[i+1] > eY){
                                return false;
                            }
                        }
                        //시작 노드가 있으면
                        if(e.sd){
                            let x = e.sd.x + e.sOffsetX;
                            let y = e.sd.y + e.sOffsetY;
                            if(x < sX || x > eX || y < sY || y > eY){
                                return false;
                            }
                        }
                        //종료 노드가 있으면
                        if(e.td){
                            let x = e.td.x + e.tOffsetX;
                            let y = e.td.y + e.tOffsetY;
                            if(x < sX || x > eX || y < sY || y > eY){
                                return false;
                            }
                        }

                        return true
                    })
                    
                    Selects = [...ns, ...ls];

                    selectionRect.remove();
                    selectItem();
                }
            })
        ;
    }();

    function selectNode () {
        //tmpClear(false);
        TempG.selectAll(".size-point").remove();
        TempG.selectAll(".addline-arrow").remove();

        var points = [];
        var sNodes = getSelNodes();
        var d;
        //In-Progress 일단 다중/개별 선택 분리
        if(Selects.length > 1){
            sNodes.forEach(function(d){
                points.push([d.width/2 + d.x, 0 + d.y]);
                points.push([d.width + d.x, d.height/2 + d.y]);
                points.push([d.width/2 + d.x, d.height + d.y]);
                points.push([0 + d.x, d.height/2 + d.y]);
            });
            /*TempG.selectAll("circle").append("circle")
                .attr("r", 3)
                .attr("cx", 100)
                .attr("cy", 100)
                .attr("fill", "#AE7F2D")
                .attr("stroke-width", "2")
                .attr("stroke", "#AE7F2D");*/
            TempG.selectAll("circle.size-point").data(points).enter()
                .append("circle")
                .attr("class", "size-point")
                .attr("r", 3)
                .attr("cx", function(data){return data[0];})
                .attr("cy", function(data){return data[1];})
                .attr("fill", "#4853FF")
                .attr("stroke-width", "2")
                .attr("stroke", "#4853FF")
                .style("opacity", "1")
                ;
        } else if(Selects.length === 1 && sNodes.length === 1){
            d = sNodes[0];

            var target = NodeG.select("#nd-"+d.id);
            var pathNode = target.select("path").node();
            var tPoints = [];
            tPoints.push([d.width/2, 0]);
            tPoints.push([d.width, d.height/2]);
            tPoints.push([d.width/2, d.height]);
            tPoints.push([0, d.height/2]);
            
            points = tPoints.map(function(v,i){
                return closestPoint(pathNode, v).map(function(x){return Math.round(x)});
            });
            target.classed('select', true);
            TempG.attr("target_id", target.attr("id"));
            /*
            TempG.selectAll("circle").append("circle")
                .attr("r", 3)
                .attr("cx", 100)
                .attr("cy", 100)
                .attr("fill", "#FE7F2D")
                .attr("stroke-width", "2")
                .attr("stroke", "#FE7F2D");
            */
            TempG.selectAll("circle.size-point").data(points).enter()
                .append("circle")
                .attr("class", "size-point")
                .attr("r", 3)
                .attr("cx", function(data){return data[0]+d.x;})
                .attr("cy", function(data){return data[1]+d.y;})
                .attr("fill", "#FE7F2D")
                .attr("stroke-width", "2")
                .attr("stroke", "#FE7F2D")
                .style("opacity", "1")
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
                ;

            if(!d.nConn){
                TempG.selectAll("line.addline-arrow").data(points).enter()
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
                            x2 += 25;
                        } else if( i === 3){
                            x2 -= 25;
                        } 
                        return x2;
                    })
                    .attr("y2", function(data,i){
                        var y2 = data[1]+d.y;
                        if(i === 0){
                            y2 -= 25;
                        } else if( i === 2){
                            y2 += 25;
                        } 
                        return y2;
                    })
                    .attr("fill", "none")
                    .attr("stroke", "#000000")
                    .attr("stroke-width", "2px")
                    .attr("marker-end", "url(#arrowhead)")
                    .style("opacity", "0.2");
                
                TempG.selectAll("line.addline-pointer").data(points).enter()
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
                    .call(dragNewLink)
                /*.classed("flowline", true)
                .on("mousemove", lineMousepoint)
                .on("mouseover", lineMouseover)*/
                    ;
            }
        }
    }

    function selectLink(){
        //tmpClear(false);
        TempG.selectAll(".temp-point").remove();
        
        var sLinks = getSelLinks();
        var circlePoints = [];
        var d;
        
        if(Selects.length > 1){
            sLinks.forEach(link => {
                if(link.sd){
                    circlePoints.push([link.sd.x+(link.sOffsetX || 0), link.sd.y+(link.sOffsetY || 0)]);
                }
                if(link.waypoints){
                    for(let i = 0; i < link.waypoints.length; i += 2){
                        circlePoints.push([link.waypoints[i], link.waypoints[i+1]])
                    }
                }
                if(link.td){
                    circlePoints.push([link.td.x+(link.tOffsetX || 0), link.td.y+(link.tOffsetY || 0)]);
                }
            });

            TempG.selectAll(".temp-point").data(circlePoints).enter()
                .append("circle")
                .attr("class", "size-point")
                .attr("r", 3)
                .attr("cx", function(data){return data[0];})
                .attr("cy", function(data){return data[1];})
                .attr("fill", "#4853FF")
                .attr("stroke-width", "2")
                .attr("stroke", "#4853FF")
                .style("opacity", "1")
                ;

        } else if(Selects.length === 1 && sLinks.length === 1){
            d = sLinks[0];

            TempG.attr("target_id", "ln-"+d.id);
            var points = LinkG.select("#ln-"+d.id).attr("points").split(",");
            var pNode = d3.select("#ln-"+d.id).node().parentNode;
            
            var i;
            var length = points.length;
            var point1X, point1Y, point2X, point2Y;
            //[1,2,3,4]
            for(i=2;i<length;i=i+2){
                point1X = points[i-2]*1;
                point1Y = points[i-1]*1;
                point2X = points[i]*1;
                point2Y = points[i+1]*1;
                
                let diffX = Math.abs(point1X - point2X);
                let diffY = Math.abs(point1Y - point2Y);
                //if(diffX+diffY < 40){continue;}//대각선 중간점 짧아도 생성
                if((diffX < 40 && diffY === 0) || (diffY < 40 && diffX === 0)){continue;}
                //신규점
                circlePoints.push(
                    {
                        index:i,
                        isNew:true,
                        line:pNode,
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
                            line:pNode,
                            x:points[i]*1,
                            y:points[i+1]*1,
                        }
                    );
                }
            }
            //d.circlePoints = circlePoints;
            TempG.selectAll(".temp-point")
                .data(circlePoints)
                .enter()
                .append("circle")
                .attr("class", "temp-point")
                .attr("r", 5)
                .attr("cx", function(d){return d.x;})
                .attr("cy", function(d){return d.y;})
                .attr("fill", "#FC3")
                //.attr("pointer-events", "none")
                .attr("stroke-width", function(d,i,a){
                    return (a.length-1 == i) ? 2 : 0;
                })
                .attr("stroke", "#FC3")
                .call(dragLineCircle)
                .style("cursor", "pointer")
                .style("opacity", function(d){return (d.isNew) ? 0.5 : 1})
                .on("mouseenter", function(){
                    d3.select(this).style("opacity", 1);
                })
                .on("mouseleave", function(){
                    d3.select(this).style("opacity", function(d){return (d.isNew) ? 0.5 : 1});
                })
                ;
        }
    }

    function selectItem (data, bUserfn) {
        if(data && !Array.isArray(data)){Selects = [data];}
        if(data && Array.isArray(data)){Selects = data;}
        if(Selects.length === 0){
            tmpClear();
            return;
        }
        NodeG.selectAll("g.select").classed('select', false);
        TempG.attr("target_id", null);
        selectNode();
        selectLink();
        
        Selects.forEach(d =>{
            if(NodeList[d.type] && NodeList[d.type]["fnSelect"]){
                NodeList[d.type]["fnSelect"](d);
            }
        });
        if(UserFn && bUserfn !== false)UserFn(Selects);
    }

    function moveEnd (stX, stY, diffX, diffY){
        if(Math.abs(diffX) + Math.abs(diffY) >= 10){
            let selNodes = getSelNodes();
            let selLinks = getSelLinks();
            let selNodeIds = selNodes.map(e=>e.id);
            let notMovedLinks = [];

            /*
            // 1. 선택된 선이 아니어도 시작과 끝이 모두 선택된 노드에 연결되어 있으면 같이 움직인다.
            DATA.links.forEach(function(l){
                if(selNodeIds.includes(l.source) && selNodeIds.includes(l.target)){
                    for(let i = 0; i< l.waypoints.length;  i += 2){
                        l.waypoints[i] += diffX;
                        l.waypoints[i+1] += diffY;
                    }
                } else {
                    //이동되지 않은 링크는 이후처리를 위해 따로 담아둔다.
                    notMovedLinks.push(l);
                }
            });
            */
            // 1. 링크를 이동한다.
            DATA.links.forEach(function(l){
                //선택되지 않은 링크는 이후처리를 위해 따로 담아둔다.
                if(!selLinks.includes(l)){
                    notMovedLinks.push(l);
                    return;
                }

                // 1-1. 선택된 선은 모두 같이 움직인다.
                for(let i = 0; i< l.waypoints.length;  i += 2){
                    l.waypoints[i] += diffX;
                    l.waypoints[i+1] += diffY;
                }
                // 1-2. 소스 노드가 있고, 소스 노드가 선택되어 있지 않다면, 연결을 끊는다.
                if(l.source && !selNodeIds.includes(l.source)){
                    l.waypoints = [l.sd.x + l.sOffsetX + diffX, l.sd.y + l.sOffsetY + diffY].concat(l.waypoints);
                    l.source = null;
                    l.sd = null;
                    l.sOffsetX = 0;
                    l.sOffsetY = 0;
                }

                // 1-3. 타겟 노드가 있고, 타겟 노드가 선택되어 있지 않다면, 연결을 끊는다.
                if(l.target && !selNodeIds.includes(l.target)){
                    l.waypoints = l.waypoints.concat([l.td.x + l.tOffsetX + diffX, l.td.y + l.tOffsetY + diffY]);
                    l.target = null;
                    l.td = null;
                    l.tOffsetX = 0;
                    l.tOffsetY = 0;
                }
            });

            // 2. 노드를 이동한다.
            selNodes.forEach(node => {
                node.x += diffX;
                node.y += diffY;
                // 2-1 이동되지 않은 선 중 노드와 연관된 선 처리를 한다
                notMovedLinks.forEach(function(l){
                    if(l.waypoints.length > 1){
                        if(l.source === node.id) {
                            if(stX + l.sOffsetX === l.waypoints[0]){
                                //x값이 같으면 x값이 같이 움직이게
                                l.waypoints[0] += diffX;
                            }else if(stY + l.sOffsetY === l.waypoints[1]){
                                //y값이 같으면 y값이 같이 움직이게
                                l.waypoints[1] += diffY;
                            }    
                        }
                        if(l.target === node.id){
                            if(stX + l.tOffsetX === l.waypoints[l.waypoints.length-2]){
                                l.waypoints[l.waypoints.length-2] += diffX;
                            }else if(stY + l.tOffsetY === l.waypoints[l.waypoints.length-1]){
                                l.waypoints[l.waypoints.length-1] += diffY;
                            } 
                        }
                    }
                });
            })
            updateDiagrams();
        }
    }

    /** lineFunction  */
    function makePoints(l){
        var startPoint = (l.sd) ? [l.sd.x+(l.sOffsetX || 0), l.sd.y+(l.sOffsetY || 0)] : null;
        var endPoint = (l.td) ? [l.td.x+l.tOffsetX, l.td.y+l.tOffsetY] : null;
        var points;
        if(l.waypoints.length > 0){
            let tPoints = startPoint ? startPoint.concat(l.waypoints) : l.waypoints;
            if(endPoint) tPoints = tPoints.concat(endPoint);

            l.waypoints = [];
            let i = 2;
            //같은 선이면 포인트 삭제
            while(i<tPoints.length-2){
                if(!(tPoints[i] === tPoints[i-2] && tPoints[i-2] === tPoints[i+2]) &&
                   !(tPoints[i+1] === tPoints[i-1] && tPoints[i-1] === tPoints[i+3]))
                {
                    l.waypoints.push(tPoints[i]);
                    l.waypoints.push(tPoints[i+1]);
                    i+=2;
                }else{
                    tPoints.splice(i, 2);
                }
            }
            //points = startPoint.concat(l.waypoints).concat(endPoint);
            //points = startPoint ? startPoint.concat(l.waypoints) : [tPoints[0], tPoints[1]].concat(l.waypoints);
            //points = endPoint ? points.concat(endPoint) : points.concat([tPoints[tPoints.length-2], tPoints[tPoints.length-1]]);
            points = tPoints;
            if(!startPoint) {
                l.waypoints = [tPoints[0], tPoints[1]].concat(l.waypoints);
            }
            if(!endPoint) {
                l.waypoints = l.waypoints.concat([tPoints[tPoints.length-2], tPoints[tPoints.length-1]]);
            }
            
        } else {
            points = startPoint.concat(endPoint);
        }
        return points;
    }

    //function makeOrthogonalPoints(p1, p2){}

    /** function */
    function init(trgtId, option){
        var svg = d3.select(trgtId);
        var tmpExtNodes;

        appendDef(svg);
        var viewportG = svg.append("g")
            .attr("class", "viewport");

        PageRect = viewportG.append("rect")
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
        

        D3SVG = svg;
        DATA = {nodes:[], links:[], page:{width:DWIDTH, height:DHEIGHT}};

        if(!!option){
            if(!!option.pageInfo && typeof option.pageInfo === 'object')DATA.page = option.pageInfo;
            if(!!option.fn)UserFn = option.fn;
            if(!!option.extNodes)tmpExtNodes = option.extNodes;
            if(!!option.extUndoCallback)UndoManager.setExtCallback(option.extUndoCallback);
        }

        svg.attr("width", DATA.page.width)
            .attr("height", DATA.page.height);

        UndoManager.setLimit(100);
        UndoManager.setCallback(function(data){
            DATA = JSON.parse(data);
            setDataRef();
            updateDiagrams();
        });

        UndoManager.add(DATA);
        
        initNodeList(tmpExtNodes);

        svg.call(dragSelection); //클릭 통합

        addNodeDragHandler.init();
        Zoom = setZoomEvent(svg);
        setDrawingPage();
        setKeyEvent(svg);
        
        Zoom.reset();
    }
    
    function setKeyEvent(d3Svg){
        var clipNode, clipLink;
        d3Svg.on("keydown", function(){
            if(d3.event.srcElement.nodeName !== "svg")return;
            var keyCode = d3.event.keyCode;
            //ctrl + key 
            if(d3.event.ctrlKey){
                switch (keyCode) {
                    case 65: //ctrl + a
                        d3.event.preventDefault();
                        Selects = DATA.nodes.concat(DATA.links);
                        if(Selects.length > 0){
                            selectItem();
                        }
                        break;
                    case 67: //ctrl + c
                        if(Selects.length > 0){
                            let clipboard = JSON.parse(JSON.stringify(Selects));
                            clipNode = clipboard.filter(e=>e.type);
                            clipLink = clipboard.filter(e=>!e.type);
                            clipNode.forEach(e => {
                                if(NodeList[e.type]["fnCopy"]){NodeList[e.type]["fnCopy"](e);}
                            })
                            clipLink.forEach(e => {
                                delete e.sd;
                                delete e.td;
                            })
                        }else{
                            //clipboard = null;
                            clipNode = null;
                            clipLink = null;
                        }
                        break;
                    case 86://ctrl + v 
                        if(clipNode || clipLink){
                            let copyOrgId = {};
                            clipNode.forEach(e => {
                                e.x +=10;
                                e.y +=10;
                                copyOrgId[e.id] = addBox(JSON.parse(JSON.stringify(e)), false); //복사하고 id 저장;
                            });
                            clipLink.forEach(e => {
                                e.waypoints.forEach((p,i) => e.waypoints[i] += 10 );
                                
                                let link = JSON.parse(JSON.stringify(e));
                                if(link.source)link.source = copyOrgId[e.source];
                                if(link.target)link.target = copyOrgId[e.target];
                                link.id = new Date().getTime();
                                DATA.links.push(link);
                            });
                            updateDiagrams(); //다 복사한 후 한번에 그린다.
                        }
                        break;
                    case 90: //ctrl + z 
                        UndoManager.undo();
                        d3.event.preventDefault();
                        break;
                    case 89: //ctrl + y 
                        UndoManager.redo();
                        d3.event.preventDefault();
                        break;
                    default:
                        break;
                }
            }
            //delete
            if(keyCode === 46){
                Selects.forEach(e=>deleteItem(e, false));
                updateDiagrams(); //다 삭제한 후 한번에 그린다.
            }
            //left:37 up:38 right:39 down:40
            if(keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40 ){
                if(d3.event.repeat){
                    moveNode.keyDown(keyCode);
                }else{
                    moveNode.start(keyCode);
                }
            }
        });
        d3Svg.on("keyup", function(){
            if(d3.event.srcElement.nodeName !== "svg")return;
            var keyCode = d3.event.keyCode;
            if(keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40 ){
                moveNode.keyUp();
            }
        });
    }

    function setZoomEvent(d3Svg){
        const wrapper = d3Svg.node().parentNode;
        const wrapperD3 = d3.select(wrapper);
        const scaleG = d3Svg.select('.viewport');
        const pInfo = DATA.page;
        let scale;

        const zoom = d3.zoom()
            .scaleExtent([0.25, 2])
            .filter(function () {
                return d3.event.ctrlKey;
            })
            .translateExtent([[0,0],[pInfo.width,pInfo.height]])
            .on("zoom", function(){
                scale = d3.event.transform.k;
                d3Svg.attr('width', DATA.page.width*scale)
                    .attr('height', DATA.page.height*scale);

                scaleG.attr('transform', 'scale('+scale+')');
                wrapper.scrollLeft = -d3.event.transform.x;
                wrapper.scrollTop = -d3.event.transform.y;

                /*const dx = d3.max([0, wrapper.clientWidth / 2 - pInfo.width / 2]);
                const dy = d3.max([0, wrapper.clientHeight / 2 - pInfo.height / 2]);
                d3Svg.attr('transform', `translate(${dx}, ${dy})`);*/
                
                slider.property("value", scale);
            });
        const scroll = function() {
            const x = wrapper.scrollLeft + wrapper.clientWidth / 2;
            const y = wrapper.scrollTop + wrapper.clientHeight / 2;
            const scale = d3.zoomTransform(wrapper).k;
            // Update zoom parameters based on scrollbar positions.
            wrapperD3.call(d3.zoom().translateTo, x / scale, y / scale);
        };

        const minus = d3.select("#zoombar").append("span").attr("class", "zoom-icon")
            .append("i").attr("class", "fas fa-minus")
            .on("click",function(){                
                zoom.scaleTo(wrapperD3, d3.zoomTransform(wrapper).k-((zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 20));
            });
        const slider = d3.select("#zoombar").append("div").attr("class", "zoom-slider")
            .append("input")
            .datum({})
            .attr("type", "range")
            .attr("value", 1)
            .attr("min", zoom.scaleExtent()[0])
            .attr("max", zoom.scaleExtent()[1])
            .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
            .on("input", slided);
        const plus = d3.select("#zoombar").append("span").attr("class", "zoom-icon")
            .append("i").attr("class", "fas fa-plus")
            .on("click",function(){                
                zoom.scaleTo(wrapperD3, d3.zoomTransform(wrapper).k+((zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 20));
            });
        const reset = d3.select("#zoombar").append("span").attr("class", "zoom-icon font-weight-bold")
            .text("R")
            .on("click",function(){                
                zoom.scaleTo(wrapperD3, 1);
            });
        
        function slided() {
            zoom.scaleTo(wrapperD3, slider.property("value"));
        }

        wrapperD3.call(zoom)
        .on('scroll', scroll)
        .on('wheel', function() {
            if(d3.event.ctrlKey)d3.event.preventDefault();
        });

        //zoom.scaleTo(wrapperD3, 1);

        return {
            reset: function () {
                zoom.scaleTo(wrapperD3, 1);
            },
            reZoom: function () {
                zoom.scaleTo(wrapperD3, slider.property("value"));
            },
            getScale: function () {
                return scale;
            }
        }
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

    function makeArrowhead(d3Svg, color, head){
        var defs = d3Svg.select("defs");
        var id = "arrowhead-"+color+head;
        
        if(defs.select("#"+id).empty()) {
            defs.append("marker")
                .attr("id", id)
                .attr("refX", 5)
                .attr("refY", 3)
                .attr("markerWidth", 15)
                .attr("markerHeight", 15)
                .attr("orient", "auto")
                .append("path")
                .attr("d", HeadStyle[head])
                .style("fill", "#" + color);
        }
    }

    function initNodeList(extNodes){

        NodeList = {};

        for(var name in NodesInit){
            NodeList[name] = NodesInit[name]();
        }
        if(extNodes){
            for(var name in extNodes){
                NodeList[name] = extNodes[name]();
            }
        }
    }

    function tmpClear(notSelect){
        NodeG.selectAll("g.select").classed('select', false);
        TempG.selectAll("*").remove();
        TempG.attr("target_id", null);
        if(notSelect !== false) {
            Selects = [];
            if(UserFn)UserFn();
        }
    }

    function clearAll(){
        DATA.links = [];
        DATA.nodes = [];
        updateDiagrams();
    }

    function updateDiagrams(){
        tmpClear(false);
        setDrawingPage();
        drawLinks();
        drawNodes();

        UndoManager.add(DATA);
    }

    function setDrawingPage() {
        var pInfo = DATA.page;
        var currW = parseInt(PageRect.attr("width"));
        var currH = parseInt(PageRect.attr("height"));
        var newW = parseInt(pInfo.width)+1;
        var newH = parseInt(pInfo.height)+1;

        if(currW !== newW || currH !== newH) {
            PageRect.attr("width", parseInt(pInfo.width)+1)
                    .attr("height", parseInt(pInfo.height)+1);
            Zoom.reZoom();
        }
    }

    function drawLinks(){
        var links = LinkG.selectAll(".link").data(DATA.links);

        links.exit().remove();

        var lg = links.enter()
            .append("g")
            .datum(function(d,i){
                var sourceNode = DATA.nodes.find(function(n, i) {
                    return n.id == d.source;
                });
                var targetNode = DATA.nodes.find(function(n, i) {
                    return n.id == d.target;
                });
                d.sd = sourceNode;
                d.td = targetNode;
                return d;
            })
            .attr("class", "link")
            .on("mouseenter", function(){
                d3.select(this).select(".line_back").attr("opacity", 0.8);
            })
            .on("mouseleave", function(){
                d3.select(this).select(".line_back").attr("opacity", 0);
            })
            .on("click", function(d){
                if(arguments.length > 1)d3.event.stopPropagation();
                if(d3.event.ctrlKey) {
                    let idx = Selects.indexOf(d);
                    if(idx > -1) {
                        Selects.splice(idx, 1);
                    } else {
                        Selects.push(d);
                    }
                    selectItem();
                } else {
                    selectItem(d);
                }
                
            });
        
        lg.append("polyline")
            .attr("class", "line_back")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("opacity", 0)
            .attr("stroke-width", function(d){
                return (d.strokeWidth) ? d.strokeWidth+2 : 6;
            })
            ;

        lg.append("polyline")
            //.attr("class", "link")
            .attr("class", "line")
            //.classed("flowline", true)
            //.on("mousemove", lineMousepoint)
            //.on("mouseover", lineMouseover)
            .attr("fill", "none")
            ;

        lg = lg.merge(links);

        lg.select(".line_back").datum(function(d){
            return d;
        })
        .attr("points", makePoints)
        .call(dragItem);

        lg.select(".line").datum(function(d){
            return d;
        })
        .attr("id", function(d){
            return "ln-"+d.id;
        })
        .attr("stroke", function(d){
            return d.color || "#000000";
        })
        .attr("stroke-width", function(d){
            return d.strokeWidth ||2;
        })
        .attr("stroke-dasharray", function(d){
            return (d.stroke) ? StokeStyle[d.stroke] : 0;
        })
        .attr("points", function(d){
            let p = makePoints(d);
            d.x = p[0];
            d.y = p[1];
            return p;
        })
        .attr("marker-end", function(d){
            if(d.color || d.head){
                var color = (d.color || "").replace("#", "");
                var head = d.head || (d.head = "head1");
                makeArrowhead(D3SVG, color, head);
                return "url(#arrowhead-"+color+head+")";
            }else{
                return "url(#arrowhead)";
            }
        })
        .call(dragItem);
    }
    function drawNodes(){
        var nodes = NodeG.selectAll(".node").data(DATA.nodes);
        nodes.exit().remove();

        var ng = nodes
            .enter()
            .append("g")
            .attr("class", "node")
            .on("click", function(d){
                //d3.event.stopPropagation();
                if(d3.event.ctrlKey) {
                    let idx = Selects.indexOf(d);
                    if(idx > -1) {
                        Selects.splice(idx, 1);
                    } else {
                        Selects.push(d);
                    }
                    selectItem();
                } else {
                    selectItem(d);
                }
            }, true)
            .call(dragItem)
            .on("mouseenter", function(){
                var data = d3.select(this).datum();
                if(!data.nConn){
                    MouseOverNode.node = d3.select(this).select("path").node();
                    MouseOverNode.data = data;
                }
            })
            .on("mouseleave", function(){
                MouseOverNode.node = null;
                MouseOverNode.data = null;
            }, true)
            ;
        
        ng = ng.merge(nodes);

        ng.attr("id", function(d){
            return "nd-" + d.id;
        }).attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });  
        
        ng.each(function(d){
            var _thisG = d3.select(this);//.selectAll("path").data([d]).enter(); 
            _thisG.selectAll("*").remove();
            NodeList[d.type].draw(_thisG, d);
        });
    }

    function setDataRef(){
        //데이터 정제
        DATA.links.forEach(function(v){
            if(!v.tOffsetX) v.tOffsetX = 0;
            if(!v.tOffsetY) v.tOffsetY = 0;
            if(!v.sOffsetX) v.sOffsetX = 0;
            if(!v.sOffsetY) v.sOffsetY = 0;
            if(v.sd){
                v.sd = DATA.nodes.find(function(n, i) {
                    return n.id == v.sd.id;
                });
            } else {
                v.sd = undefined;
            }

            if(v.td){
                v.td = DATA.nodes.find(function(n, i) {
                    return n.id == v.td.id;
                });
            } else {
                v.td = undefined;
            }
        });
    }

    function setData(d){
        clearAll();
        DATA.nodes = d.nodes || [];
        DATA.links = d.links || [];
        setDataRef();
        if(!!d.page){
            DATA.page.width = d.page.width || DWIDTH;
            DATA.page.height = d.page.height || DHEIGHT;
            DATA.page.name = d.page.name || "";
            Node.prototype.DECIMAL = d.page.decimal || 2;
        }else{
            DATA.page.width = DWIDTH;
            DATA.page.height = DHEIGHT;
            DATA.page.name = "";
            Node.prototype.DECIMAL = 2;
        }
        
        // 수정으로 구조 변경시 데이터 불러올때 이전 데이터 수정(임시)
        DATA.nodes.forEach(e => {
            if(!e.strokeWidth)e.strokeWidth = 2;
        })
        DATA.links.forEach(e => {
            if(!e.strokeWidth)e.strokeWidth = 2;
        })
        
        UndoManager.clear();
        updateDiagrams();
    }
    function getData(mode){
        if("save" === mode){
            DATA.nodes.forEach(function(v){
                if(NodeList[v.type]["fnSave"]){NodeList[v.type]["fnSave"](node);}
            });
            DATA.links.forEach(function(v){
                delete v.circlePoints;
                //delete v.sd;
                //delete v.td;
            });
        }
        return DATA;
    }

    function addBox(node, draw = true){
        if(!node) node = {};
        if(!node.width)node.width = 100;
        if(!node.height)node.height = 100;
        if(!node.type)node.type = "rect";
        if(!node.x)node.x = 10;
        if(!node.y)node.y = 10;
        if(!node.strokeWidth)node.strokeWidth = 2;
        
        var maxNum = 0;
        DATA.nodes.forEach(function(n){
            if(node.type === n.type){
                var num = (n.id+"").split("-")[1] || 0;
                maxNum = maxNum > parseInt(num) ? maxNum : parseInt(num);
            }
        });
        var nodeId = node.type + "-" + (parseInt(maxNum)+1);

        if(node.type !== "cal")node.id = nodeId;
        
        if(node.type == "mb"){
            if(!node.mb || node.mb.length === 0){
                node.mb = [[{text:"New"}]];
            }    
            if(!node.item){
                node.item = {};
                node.item.x = 0;
                node.item.y = 0;
                node.item.width = 100;
                node.item.height = 30;
            }
        }
        
        if(NodeList[node.type]["fnAdd"]){NodeList[node.type]["fnAdd"](node);}

        DATA.nodes.push(node);

        /* 나중에 인덱스 추가.*/ 
        DATA.nodes.sort(function(a,b){
            if(a.type === "cal" && b.type === "cal"){
                return (a.id > b.id) ? 1 : -1;
            }else if(b.type === "cal"){
                return -1;
            }else{
                return 1;
            }
        });
        if(draw)updateDiagrams();
        
        return nodeId;
    }

    function deleteItem(data, draw = true){
        var id = (typeof data === "string") ? data : data.id;
        var links = DATA.links;
        var nodes = DATA.nodes;
        var i, d;

        for(i = links.length - 1; i >= 0; i--) {
            d = links[i];
            if(d.target == id || d.source == id || d.id == id) {
                links.splice(i, 1);
            }
        }

        for(i = nodes.length - 1; i >= 0; i--) {
            d = nodes[i];
            if(d.id == id) {
                nodes.splice(i, 1);
                if(NodeList[d.type]["fnDel"]){NodeList[d.type]["fnDel"](d);}
            }
        }
        
        if(draw)updateDiagrams();
    }

    function selectExternal(data){
        if(!data){tmpClear();return;}
        if(!data.type){
            selectLink(data);
        }else{
            selectNode(data);
        }
    }

    function getSelects() {return Selects;}


    //set return obj;
    var diagrams = {};
    diagrams.init = init;
    diagrams.setData = setData;
    diagrams.getData = getData;
    diagrams.getSelects = getSelects
    diagrams.addBox = addBox;
    diagrams.updateNode = updateDiagrams;
    diagrams.selectItem = selectItem//selectExternal;
    diagrams.deleteItem = deleteItem;
    diagrams.addNodeDrag = addNodeDragHandler;

    return diagrams;
}
