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
    }],
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
var arrow = d3.select("#arrow");

var linksG = svg.append("g").attr("class", "link-group");
var nodeG = svg.append("g").attr("class", "node-group");

var links = linksG.selectAll("link");
var nodes = nodeG.selectAll("node");
/* 
var circle = svg.append("circle")
		.attr("r", 7)
		.attr("fill", "none")
		.style("opacity", "0")
		.attr("pointer-events", "none")
		.attr("stroke-width", "2.5")
		.attr("stroke", "rgb(205,23,25)"); */

var drag = function(){
    var sourceLink = [];
    var targetLink = [];

    return d3.drag()
            .on("start",function(d, i){
                console.log("node drag start");
                clearTemp();
                nodeG.selectAll(".size-point").remove();

                links.each(function(l, li) {
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

                d3.select(this).selectAll("*").attr("x", d.x).attr("y", d.y);

                links.each(function(l, li) {
                    //var points;
                    var point = [d.x+(d.width/2),d.y+(d.height/2)];
                    sourceLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", point.concat(link.points));
                    });
                    targetLink.forEach(function(link){
                        link.d3this.selectAll("polyline").attr("points", link.points.concat(point));
                    });
                });
                arrow.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x)+' '+d.y+')')
                //TmpVar.startNode = d.id;  //선택된 노드 체크
            })
            .on("end", function(){
                sourceLink = [];
                targetLink = [];

                makeSizeCircle(this);
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
    console.log(d.id, TmpVar.startNode);
    
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
        arrow.attr('transform', 'translate('+(this.getBoundingClientRect().width + d.x)+' '+d.y+')')
            .style("visibility", "visible");
        TmpVar.startNode = d.id;  //선택된 노드 체크

        makeSizeCircle(this);

        //d3.select(this).selectAll("*").attr("height", 200)
    }
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
            links.each(function(ld){
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

function updateLink(linkData){
    var lg = links.data(linkData).enter()
    .append("g")
    .attr("class", "link")
    .on("click", lineClick)
    .on("mouseenter", function(){
        d3.select(this).select(".line_back").attr("stroke", "#ccc");
    })
    .on("mouseleave", function(){
        d3.select(this).select(".line_back").attr("stroke", null);
    })
    
    lg.append("polyline")
    .attr("class", "line_back")
    .attr("points", function(l){
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
    .attr("fill", "none")
    .attr("stroke-width", "6px")

    lg.append("polyline")
    //.attr("class", "link")
    .attr("class", "line")
    .attr("points", function(l){
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
    //.on("mousemove", lineMousepoint)
    //.on("mouseover", lineMouseover)
    .attr("fill", "none")
    .attr("stroke", "#000000")
    .attr("stroke-width", "2px")
    ;

    links = linksG.selectAll(".link");
}

function updateNode(nodeData){
    var ng = nodes.data(nodeData)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .on("click", nodeClick)
        .call(drag);
        ;

        ng.append("rect")
        //.attr("href", "#rectangle")
        .attr("width", 100)
        .attr("height", 100)
        .attr("x", function(d) {
        return d.x
        })
        .attr("y", function(d) {
        return d.y
        })
        .attr("fill", "#ffffff")
        .attr("stroke-width", 3)
        .attr("stroke", "#000")
        //.attr("fill", function(d, i) {return c10(i);})
        
        nodes = nodeG.selectAll(".node");
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

        var lx = startNode.x + (100/2); 
        var ly = startNode.y + (100/2);

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
}

arrow.on("click", function(){
    lineDrawEvent();
});

function clearTemp(){
    console.log("clearTemp");
    linksG.selectAll(".temp-point")
    .remove();
}

svg.on("click",function(){
    clearTemp();
})

updateLink(data.links);
updateNode(data.nodes);

function addBox(){

    data.nodes.push(
        {
            id:parseInt(Math.random()*1000),
            name : "",
            x:parseInt(Math.random()*600),
            y:parseInt(Math.random()*600),
            type : "rect",
            width : 100,
            height : 100
        }
    );

    updateNode(data.nodes);
}

/*
document.getElementById("btn-add").addEventListener("click",function(e){
    addBox();
 },false);
 */