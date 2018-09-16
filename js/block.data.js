var CalData = function(){
    var api = {};
    var data = {
        types : {cal0:{nm:"DI Tank"},cal1:{nm:"UV-ox-2"},cal3:{nm:"UDI Tank"}},
        cals : {
            3 : [
                {
                    calId:"c202020",
                    calInId:"cal_123456",
                    calOutId:"cal_123456",
                    inBl:"0",
                    bl:"3",
                    outBl:"2",
                    calTy:"cal0",
                    calNm:"UV-ox-2",
                    in:200,
                    out:180
                }
            ]
        }
    }
    function getName(id){
        console.log(id)
        if(data.types[id]){
            return data.types[id].nm;
        }
        return "";
    }
    function getTypes(){
        return data.types;
    }
    function setTypes(d){
        data.types = d;
    }
    function getCals(){
        return data.cals;
    }
    function setCals(d){
        data.cals = d;
    }
    function getBlockById(id){
        return data.cals[id]||[];
    }
    function addBlockById(id, d){
        if(!data.cals[id]){
            data.cals[id] = [];
        }
        data.cals[id].push(d);
    }
    function delCalById(bid, cid){
        data.cals[bid].map(function(d,i){
            if(d.calId == cid){
                data.cals[bid].splice(i,1);
            }
        });
        if(data.cals[bid].length < 1){
            delete data.cals[bid];
        }
    }
    api.getName = getName;
    api.getTypes = getTypes;
    api.setTypes = setTypes;
    api.getCals = getCals;
    api.setCals = setCals;
    api.getBlockById = getBlockById;
    api.addBlockById = addBlockById;
    api.delCalById = delCalById;
    return api;
}();