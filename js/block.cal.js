var Cal = function(){
    var api = {};

    function add(calNo, att){
        var calDiv = $("<div/>").attr("class","calDiv");
        var calNoDiv = $("<div/>").attr("class","calNo").html(calNo);
        var calInput = $("<input/>").attr("id", calNo).attr("type", "text");
        if(att){
            calDiv.css("left", att.x+"px").css("top", att.y+"px");
            calInput.attr("value",att.val).attr("data-formula",att.fm);
        }
        calDiv.append(calNoDiv)
        calDiv.append(calInput);
        calDiv.draggable({
            start: function() {
                CalData.setAttr(calNo, "x", parseInt(calDiv.css("left")));
                CalData.setAttr(calNo, "y", parseInt(calDiv.css("top")));
            },
            drag: function() {
                CalData.setAttr(calNo, "x", parseInt(calDiv.css("left")));
                CalData.setAttr(calNo, "y", parseInt(calDiv.css("top")));
            },
            stop: function() {
                CalData.setAttr(calNo, "x", parseInt(calDiv.css("left")));
                CalData.setAttr(calNo, "y", parseInt(calDiv.css("top")));
            }
        });
        $("#cal-group").append(calDiv);
        rules.addItem(calInput.get(0))

        calInput.bind("blur", function(){
            CalData.setAttr(calNo, "val", this.value);
            CalData.setAttr(calNo, "fm", this.getAttribute("data-formula"));
        });

        return calDiv;
    }

    function open(d){
        if(!d || !d.cals)return;
        CalData.open(d);
        var cals = d.cals;
        for(var key in cals){
            add(key, cals[key]);
        }
    }

    function destory(){
        $("#cal-group").html("");
        CalData.init();
    }

    function init(){
        var rules = new ruleJS("cal-group");
        rules.init();
        return rules;
    }

    function reverse(id, val){
        var calKey = id;
        var endKey;
        var startKey;
        var cal = CalData.getCals();
        var rtnX = "";
        for(var key in cal){
            if(cal[key].start){
                startKey = key;
                cal[key]["rfm"] = "x";
            }else{
                cal[key]["rfm"] = cal[key]["fm"];
            }
            if(cal[key].end){
                endKey = key;
            }
        }
        if(!startKey)console.log("No Start");
        if(!endKey)endKey = calKey;
        for(var i in cal){
            var rfm = cal[i].rfm;
            for(var j in cal){
                if(rfm != null && rfm != ""){
                    if(cal[j]["rfm"] != null){
                        var rep = new RegExp(i, "g");
                        var cRfm = genCalString(rfm);
                        var tRfm = cal[j]["rfm"].replace(rep, cRfm);
                        cal[j]["rfm"] = tRfm;
                    }
                }
            }
        }
        var calString = "";
        if(endKey && cal[endKey]){
            calString = cal[endKey]["rfm"];
            rtnX = nerdamer.solveEquations(calString+"="+val,'x');
            rtnX = eval(rtnX.toString());
        }
        console.log(CalData.getCals())
        return {x:rtnX,skey:startKey,ekey:endKey};
    }

    function genCalString(cal){
        console.log("org : "+cal)
        var formattedFormula = excelFormulaUtilities.formula2JavaScript(cal);
        console.log("convert : "+formattedFormula)
        return "("+formattedFormula+")";
    }
    
    api.init = init;
    api.add = add;
    api.open = open;
    api.destory = destory;
    api.reverse = reverse;
    return api;
}();