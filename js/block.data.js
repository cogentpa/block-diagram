var Layout = function (){
    var api = {};
    var info = {
        page : {
            id:"page_123456",
            name:"",
            width:2000,
            height:800
        },
        block : {
            selectId:"",
            selectNode:"",
            inBlocks:[],
            outBlocks:[],
            names:{}
        }
    }
    function setPageInfo(ty, val){
        info.page[ty] = val;
    }
    function getPageInfo(ty){
        if(ty){
            return info.page[ty];
        }else{
            return info.page;
        }
    }
    function setBlockNm(id, nm){
        info.block.names[id] = nm;
    }
    function getBlockNm(id){
        return info.block.names[id]||"";
    }
    function setBlockId(id){
        info.block.selectId = id;
        info.block.inBlocks = [];
        info.block.outBlocks = [];

        var diagramData = Diagrams.getData();
        diagramData.links.map(function(d, i){
            if(d.target == id){
                var nm = getBlockNm(d.target);
                info.block.inBlocks.push(d.source);
            }
            if(d.source == id){
                var nm = getBlockNm(d.source);
                info.block.outBlocks.push(d.target);
            }
        });
    }
    function getBlockInfo(){
        return info.block;
    }
    function getBlockId(id){
        return info.block.selectId;
    }
    function setBlock(obj){
        info.block.selectNode = obj;
    }
    function getBlock(){
        return info.block.selectNode;
    }
    function getId(t){
        return t+"_"+parseInt(Math.random()*1000);
    }
    api.setPageInfo = setPageInfo;
    api.getPageInfo = getPageInfo;
    api.setBlockNm = setBlockNm;
    api.getBlockNm = getBlockNm;
    api.getBlockInfo = getBlockInfo;
    api.setBlockId = setBlockId;
    api.getBlockId = getBlockId;
    api.setBlock = setBlock;
    api.getBlock = getBlock;
    api.getId = getId;
    return api;
}();

var CalData = function(){
    var api = {};
    var data = {
        cnt : 0,
        no : makeCalName(),
        selectCal : {},
        types : {cal0:{nm:"DI Tank"},cal1:{nm:"UV-ox-2"},cal3:{nm:"UDI Tank"}},
        cals : {}
    }
    function makeCalName(){
        var cell = String.fromCharCode(65);
        var rtnNm = [];
        for(var i=65;i<80;i++){
            cell = String.fromCharCode(i);
            for(var j=1;j<10;j++){
                rtnNm.push(cell+""+j);
            }
        }
        return rtnNm;
    } 
    function getCalNo(){
        var rtnNo = data.no[data.cnt];
        data.cnt++;
        return rtnNo;
    }
    function getCalById(id){
        return data.cals[id];
    }
    function setCalById(id, d){
        data.cals[id] = d;
    }
    function getSelect(){
        return data.selectCal;
    }
    function setSelect(d){
        data.selectCal = d;
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
    api.getSelect = getSelect;
    api.setSelect = setSelect;
    api.getCalNo = getCalNo;
    api.getCalById = getCalById;
    api.setCalById = setCalById;
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