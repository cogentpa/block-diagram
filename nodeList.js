var nodeList = {
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