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
                mb : [1,2,3,4,5]
            }

        ],
        links: [{
        source: 0,
        target: 1,
        waypoints : [[30,30],[30,60],[90,60]]
        }, {
        source: 1,
        target: 2,
        waypoints : []
        }, {
        source: 2,
        target: 3,
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
                                points : (l.waypoints || []).concat([targetNode.x+(100/2), targetNode.y+(100/2)])
                            });
                        } else if (l.target == d.id) {
                            var sourceNode = data.nodes.filter(function(d, i) {
                                return d.id == l.source;
                            })[0];
                            targetLink.push({
                                d3this:d3.select(this),
                                points : [sourceNode.x+(100/2), sourceNode.y+(100/2)].concat(l.waypoints || [])
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

                    var point = [d.x+(d.width/2),d.y+(d.height/2)];
                    sourceLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", point.concat(link.points));
                    });
                    targetLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", link.points.concat(point));
                    });

                    if(TmpVar.startNode == d.id){
                        toolbox.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x)+' '+d.y+')');
                    }    
                })
                .on("end", function(){
                    sourceLink = [];
                    targetLink = [];

                    if(!bChildmove)makeSizeCircle(this);
                });
            }();

    var tempCircleDrag = function(){
        var d3this;
        var link;
        var linkData;
        var targetIndex;
        return d3.drag()
                .on("start", function(d){
                    var before;
                    var after;
                    d3this = d3.select(this);
                    link = d3.select(d.line).selectAll("polyline");
                    linkData = link.datum();

                    before = linkData.waypoints.slice(0, d.index);
                    after = linkData.waypoints.slice(d.index);
                    targetIndex = before.length;

                    if(d.isNew){
                        before.push(d3.mouse(this));
                    }

                    linkData.waypoints = before.concat(after);
                })
                .on("drag", function(d){
                    var m = d3.mouse(this);
                    //console.log(d3.mouse(this));
                    //console.log(d3.event)
                    //var x = m[0];
                    //var y = m[1];
                    var x = (d3.event.x/10).toFixed(0)*10;
                    var y = (d3.event.y/10).toFixed(0)*10;
                    d3this.attr("cx", x)
                        .attr("cy", y);
                    linkData.waypoints[targetIndex] = [x,y];
                    link.attr("points", function(l){
                        var sourceNode = data.nodes.filter(function(d, i) {
                            return d.id == l.source
                        })[0];
                        var targetNode = data.nodes.filter(function(d, i) {
                            return d.id == l.target
                        })[0];
                        var startPoint = [sourceNode.x+(100/2), sourceNode.y+(100/2)];
                        var endPoint = [targetNode.x+(100/2), targetNode.y+(100/2)];
                        
                        var points;
                        if(l.waypoints.length > 0){
                            points = [startPoint,l.waypoints,endPoint];
                        } else {
                            points = [startPoint,endPoint];
                        }
                        return points;
                        
                    })
                })
                .on("end", function(){
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
                    waypoints : []
                });
            }

        }else{
            toolbox.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x)+' '+d.y+')')
                .style("visibility", "visible");
            TmpVar.startNode = d.id;  //선택된 노드 체크

            if(d.type != "mb")makeSizeCircle(this);

            //d3.select(this).selectAll("*").attr("height", 200)
        }
        blockSelect(d.id);
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
        if(length > 4){
            for(i=2;i<length-2;i=i+2){
                circlePoints.push(
                    {
                        index:i/2-1,
                        isNew:false,
                        line:this,
                        x:points[i]*1,
                        y:points[i+1]*1,
                    }
                )
            }
        }
        console.log(circlePoints);
        d.circlePoints = circlePoints;

        linksG.selectAll("temp-point")
            .data(circlePoints)
            .enter()
            .append("circle")
            .attr("class", "temp-point")
            .attr("r", 3)
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
            .attr("fill", "#aaa")
            //.attr("pointer-events", "none")
            .attr("stroke-width", "2")
            .attr("stroke", "rgb(205,23,25)")
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
            var startPoint = [sourceNode.x+(100/2), sourceNode.y+(100/2)];
            var endPoint = [targetNode.x+(100/2), targetNode.y+(100/2)];

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
        var ng = nodes
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .on("click", nodeClick)
            .call(drag);
            ;
            
        ng.each(function(d){
            if(d.type == "rect"){
                d3.select(this).selectAll("rect.box")
                    .data([d])
                    .enter()
                    .append("rect")
                    .attr("class", "box");
            } else if(d.type == "mb"){
                d3.select(this).selectAll("rect.mb")
                    .data(d.mb)
                    .enter()
                    .append("rect")
                    .attr("class", "mb");
            }
        })

        nodeG.selectAll(".node").each(function(d){
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
                    //.attr("x", d.x + (i%2*d.width))
                    //.attr("y", d.y + Math.floor(i/2)*d.height)
                    .attr("fill", "#ffffff")
                    .attr("stroke-width", 2)
                    .attr("stroke", "#333");
            }
        })

        

        nodes.exit().remove();
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
                .attr("y2", ly); 

            function mousemove(){
                var m = d3.mouse(this);
                line.attr("x2", m[0]-1)
                    .attr("y2", m[1]-1);
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
        console.log(data);

        //데이터로 삭제(exit().remove() 시 갯수로 삭제해서 잘안됨... 일단 이렇게 지우고 추후 수정)
        nodeG.selectAll(".node").each(function(d){
            if(d.id == TmpVar.startNode){
                d3.select(this).remove();
            }
        });

        draw();
    }

    function clearTemp(){
        console.log("clearTemp");

        data.links.forEach(function(v){
            delete v.circlePoints;
        });
        linksG.selectAll(".temp-point")
        .remove();
    }
    function clearAll(){
        data.links = [];
        data.nodes = [];
        draw();

    }
    function getData(){
        return data;
    }
    
    function setData(d){
        clearAll();
        data.nodes = d.nodes || [];
        data.links = d.links || [];
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
        
        updateNode(data.nodes);
    }
    
    function init(){
        svg.on("click",function(){
            clearTemp();
        })

        arrow.on("click", function(){
            lineDrawEvent();
        });
        removeNodeIcon.on("click", function(){
            removeNode();
        })

        updateLink();
        updateNode();
    }

    diagrams.getData = getData;
    diagrams.setData = setData;
    diagrams.addBox = addBox;
    diagrams.clearAll = clearAll;

    init();
    return diagrams;
}();