var svg = d3.select("#diagram");
var data = [
            {id:"rect1", x:50, y:50}
           ,{id:"rect2", x:250, y:250}
];

var selected;

svg.selectAll("use").data(data).enter().append("use")
    .classed("node", true)
    .attr("href", "#rectangle")
    .attr("x", function(d){
        return d.x;
    })
    .attr("y", function(d){
        return d.y;
    })
    .attr("fill", "#039BE5")
    .attr("stroke", "#039BE5")
    .attr("stroke-width", "1px")
    .on("click", function(){
        console.log("use");
        d3.event.stopPropagation();
        selected = this;
        
        var arrow = d3.select("#arrow");
        var clientRect = this.getBoundingClientRect();
        if(d3.select("#arrow").style("visibility") === "hidden"){
            arrow.attr('transform', 'translate('+(clientRect.width + clientRect.x)+' '+clientRect.y+')')
                .style("visibility", "visible");
        }else{
            arrow.style("visibility", "hidden");            
        }
        
        svg.on("mousemove", null)
            .on("click", null);
        
    });
    

function dragEvent(d3Select){
    var deltaX, deltaY;

    var dragHandler = d3.drag()
        .on("start", function () {
            var current = d3.select(this);
            deltaX = current.attr("x") - d3.event.x;
            deltaY = current.attr("y") - d3.event.y;
        })
        .on("drag", function () {
            d3.select(this)
                .attr("x", d3.event.x + deltaX)
                .attr("y", d3.event.y + deltaY);
        });

    dragHandler(d3Select);
}

function lineDrawEvent(){
    var line;
    var bDrawing = false;

    function mousemove(){
        var m = d3.mouse(this);
        line.attr("x2", m[0]-1)
            .attr("y2", m[1]-1);
    }
    
    d3.select("#arrow")
        .on("click", function(){
            console.log("click", this);
            d3.event.stopPropagation();
            
            bDrawing = true;
            var clientRect = selected.getBoundingClientRect();
            
            var deltaX = clientRect.x + (clientRect.width/2);
            var deltaY = clientRect.y + ( clientRect.height/2);
            console.log(deltaX, deltaY);
            var m = d3.mouse(this);
            line = svg.append("line")
                        .attr("stroke", "#000000")
                        .attr("stroke-width", "1px")
                        .attr("x1", deltaX)
                        .attr("y1", deltaY)
                        .attr("x2", deltaX)
                        .attr("y2", deltaY);
            
            svg.on("mousemove", mousemove)
                .on("click", function(){
                    console.log("svg click");
                    if(bDrawing){
                        bDrawing = false;
                        line.remove();
                        svg.on("mousemove", null)
                            .on("click", null);
                    }
                });

        })
        /*
        .on('mousemove', function(){ 
            if (keep) {
                Line = line([xy0, d3.mouse(this).map(function(x){ return x - 1; })]);
                console.log(Line);
                path.attr('d', Line);
            }
        });
        */
}

lineDrawEvent();

dragEvent(svg.selectAll("use"))



