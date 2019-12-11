var Layout = function (){
    var api = {};
    var info = {
        page : {
            id:"page_123456",
            name:"",
            width:3170,
            height:2230
        },
        block : {
            selectId:"",
            selectNode:"",
            inBlocks:[],
            outBlocks:[],
            names:{}
        }
    };
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
    function removeNode(){
        var selects = getBlock();
        if(selects && selects.length > 0){
            selects.forEach(e=>Diagrams.deleteItem(e, false));
            Diagrams.updateNode();
        }
    }
    api.setPageInfo = setPageInfo;
    api.getPageInfo = getPageInfo;
    api.setBlockNm = setBlockNm;    //안씀
    api.getBlockNm = getBlockNm;    //안씀
    api.getBlockInfo = getBlockInfo;//안씀
    api.setBlockId = setBlockId;    //안씀
    api.getBlockId = getBlockId;    //안씀
    api.setBlock = setBlock;
    api.getBlock = getBlock;
    api.getId = getId;              //안씀
    api.removeNode = removeNode;
    return api;
}();

var CalData = function(){
    var api = {};
    var data = {
        cnt : 0,
        preCnt : 0,
        no : makeCalName(),
        prefix: makePreFix(),
        selectCal : {},
        types : {cal0:{nm:"DI Tank"},cal1:{nm:"UV-ox-2"},cal3:{nm:"UDI Tank"}},
        cals : {}
    };
    function makeCalName(){
        var cell = String.fromCharCode(65);
        var rtnNm = [];
        for(var i=65;i<91;i++){
            cell = String.fromCharCode(i);
            for(var j=1;j<10;j++){
                rtnNm.push(cell+""+j);
            }
        }
        return rtnNm;
    }
    function nextChar(c){
        return c ? String.fromCharCode(c.charCodeAt(0)+1) : 'A';
    }
    function nextCol(s){
        return s.replace(/([^Z]?)(Z*)$/, (_,a,z)=>nextChar(a) + z.replace(/Z/g,'A'));
    }
    function makePreFix(){
        var rtnPre = [];
        for(var i=0, s=''; i<702; i++){
            s = nextCol(s);
            rtnPre.push(s);
        }
        return rtnPre;
    }
    function init(){
        data.cnt = 0;
        data.preCnt = 0;
        data.selectCal = {};
        data.cals = {};
    }
    function save(){
        for(var key in data.cals){
            data.cals[key].val = $("#"+key).val();
        }
        var s = {};
        s["cnt"] = data.cnt;
        s["preCnt"] = data.preCnt;
        s["cals"] = data.cals;
        return s;
    }
    function open(d){
        init();
        data.cals = d.cals;
        data.preCnt = d.preCnt;
        data.cnt = d.cnt;
    }
    function setCnt(cnt){
        data.cnt = cnt;
    }
    function getCalNo(){
        if(!data.no[data.cnt]){
            makeCalName();
        }
        var rtnNo = data.no[data.cnt];
        data.cnt++;
        return rtnNo;
    }
    function getPrefix(){
        return data.prefix[data.preCnt++];
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
    function getAttr(id, attr){
        return data.cals[id][attr]; 
    }
    function setAttr(id, attr, val){
        data.cals[id][attr] = val; 
    }

    function getName(id){
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
    function delCalById(cid){
        delete data.cals[cid];
    }
    api.init = init;
    api.save = save;
    api.open = open;
    api.setCnt = setCnt;
    api.getAttr = getAttr;
    api.setAttr = setAttr;
    api.getSelect = getSelect;
    api.setSelect = setSelect;
    api.getCalNo = getCalNo;
    api.getPrefix = getPrefix;
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