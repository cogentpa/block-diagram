var Cal = function(){
    var api = {};

    function add(calNo, att){
        var calDiv = $("<div/>").attr("class","calDiv").attr("id", calNo+"_div");
        var calNoDiv = $("<div/>").attr("class","calNo").html(calNo);
        var calInput = $("<input/>").attr("class", "calInput").attr("id", calNo).attr("type", "text").attr("readonly", "readonly");
        if(att){
            calDiv.css("left", att.x+"px").css("top", att.y+"px");
            calInput.attr("value",att.val).attr("data-formula",att.fm);
        }
        calDiv.append(calNoDiv);
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
        }).css("position", "absolute");

        $("#cal-group").append(calDiv);
        rules.addItem(calInput.get(0));

        calDiv.bind("click", function(){
            calClick(calNo);
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

    function refresh(){
        $("#cal-group").find(".calInput").each(function(){
            var id = this.id;
            var cal = CalData.getCalById(id);
            $(this).attr("data-formula", cal.fm);
        });
        rules.init();
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
        if(!startKey){
            alert("No Start");
            return;
        }
        if(calKey)endKey = calKey;
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
            calString = genCalString(calString);
            rtnX = nerdamer.solveEquations(calString+"="+val,'x');
            rtnX = eval(rtnX.toString());
        }
        return {x:rtnX,skey:startKey,ekey:endKey};
    }

    function genCalString(cal){
        var formattedFormula = excelFormulaUtilities.formula2JavaScript(cal);
        formattedFormula = formattedFormula.replace(/ROUND\(|round\(/g,"").replace(/\,\d\)/g,"");
        return "("+formattedFormula+")";
    }
    
    api.init = init;
    api.add = add;
    api.open = open;
    api.destory = destory;
    api.reverse = reverse;
    api.refresh = refresh;
    return api;
}();