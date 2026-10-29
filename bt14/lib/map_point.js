var NaviDestination = function() {}
    NaviDestination.DEFAULT  = {"value":"0","ko":"기본"};
    NaviDestination.HOME     = {"value":"1","ko":"집"};
    NaviDestination.COMPANY  = {"value":"2","ko":"회사"};
    NaviDestination.FAVORITE = {"value":"3","ko":"즐겨찾기"};
    NaviDestination.DRIVE    = {"value":"4","ko":"운전"};
 
//console.info("NaviDestination.HOME" , NaviDestination.HOME);

var NaviGubun = function() {}
    NaviGubun.NONE      = {"value":"0","ko":"기본"};
    NaviGubun.POI       = {"value":"1","ko":"목적지"};
    NaviGubun.SEARCH    = {"value":"2","ko":"검색"};

var MapPoint = function(lat,lon,name,item) {
    var mp = {} 
    if ( typeof lat === "object" && lat ) {
        mp = lat;
        name = mp && mp.name;
        // id = mp && mp.id;
        lat = mp && ( mp.frontLat || mp.lat);
        lon = mp && ( mp.frontLon || mp.lon);
        item = mp.item;
    }

    if ( item ) {
        item = item.addressInfo?item.addressInfo:item; // tmap
    }

    var id_ = item?item.id:null;
    if ( !id_ ) {
        id_ = lat+"_"+lon;
    }
    this.created = new Date();
    this.id = id_; // tmap id
    this.lat = lat;
    this.lon = lon;
    this.name = name;
    this.type = NaviDestination.DEFAULT; // 기본
    this.gubun = item&&item.gubun?item.gubun:NaviGubun.POI; // poi
    this.item = item;
    this.dobound = false;
    this.marker = null;
}
    MapPoint.prototype.getCreated = function(){
        return this.created;
    }

    MapPoint.prototype.setCreated = function(created){
        this.created = created;
    }

    MapPoint.prototype.setId = function(id){
        this.id = id;
    }

    MapPoint.prototype.getId = function(){
        return this.id;
    }

    MapPoint.prototype.getName = function(){
        return this.name;
    }

    MapPoint.prototype.setName = function(name){
        this.name = name;
    }

    MapPoint.prototype.getLat = function(){
        return this.lat;
    }

    MapPoint.prototype.setLat = function(lat){
        this.lat = lat;
    }

    MapPoint.prototype.getLon = function(){
        return this.lon;
    }

    MapPoint.prototype.setLon = function(lon){
        this.lon = lon;
    }

    MapPoint.prototype.getItem= function(){
        return this.item;
    }

    MapPoint.prototype.setItem = function(item){
        this.item = item;
    }

    MapPoint.prototype.getDobound= function(){
        return this.dobound;
    }

    MapPoint.prototype.setDobound = function(dobound){
        this.dobound = dobound;
    }
    
    MapPoint.prototype.getType = function(){
        return this.type;
    }

    MapPoint.prototype.setType = function(type){
        this.type = type;
    }

    MapPoint.prototype.getGubun = function(){
        return this.gubun;
    }

    MapPoint.prototype.setGubun = function(gubun){
        this.gubun = gubun;
    }

    MapPoint.prototype.name = this.name;
    MapPoint.prototype.lat = this.lat;
    MapPoint.prototype.lon = this.lon;
    MapPoint.prototype.type = this.type;
    MapPoint.prototype.gubun = this.gubun;
    MapPoint.prototype.marker = this.marker;
    MapPoint.prototype.dobound = this.dobound;
    MapPoint.prototype.item = this.item;
    MapPoint.prototype.created = this.created;

var MapPointForHome = function(lat,lon,name) {
     // this.super()
     MapPoint.call(this, lat,lon,name);
     this.type = NaviDestination.HOME;
}
// MapPointForHome.prototype = MapPoint.prototype;
// Object.setPrototypeOf(MapPointForHome.prototype, MapPoint);
    // MapPointForHome.prototype = new MapPoint();
    MapPointForHome.prototype = Object.create(MapPoint.prototype);
    MapPointForHome.prototype.test = function(){
        return "test value";
    }

var MapPointForCompany = function(lat,lon,name) {
     // this.super()
     MapPoint.call(this, lat,lon,name);
     this.type = NaviDestination.COMPANY;
}
    MapPointForCompany.prototype = Object.create(MapPoint.prototype);

var MapPointForFavorite = function(lat,lon,name) {
     // this.super()
     MapPoint.call(this, lat,lon,name);
     this.type = NaviDestination.FAVORITE;
}
    MapPointForFavorite.prototype = Object.create(MapPoint.prototype);

var MapPointForDrive = function(lat,lon,name) {
     // this.super()
     MapPoint.call(this, lat,lon,name);
     this.type = NaviDestination.DRIVE;
}
    MapPointForDrive.prototype = Object.create(MapPoint.prototype);

//console.info("MapPointForHome.prototype  === MapPoint.prototype : ", MapPointForHome.prototype  === MapPoint.prototype);
//
//var mapPoint = new MapPoint(37.566481622437934, 126.98502302169841,"Seoul");
//console.info( mapPoint.getType());
//console.info( mapPoint.getName(),mapPoint.getLat(),mapPoint.getLon());
//try {
//    console.info(mapPoint.test());
//    console.info("method exists in mapPoint.");  
//} catch (e) {
//    console.info("method dose not exists in mapPoint.");
//}
//var mapPointForHome = new MapPointForHome(37.4969332,126.8189093,"Seoul Onsu-Hil");
//console.info( mapPointForHome.getType());
//console.info( mapPointForHome.getName(),mapPointForHome.getLat(),mapPointForHome.getLon());
//try {
//    console.info(mapPointForHome.test());
//    console.info("method exists in mapPointForHome.");
//} catch (e) {
//    console.info("method dose not exists in mapPointForHome.");
//}
//
//var mapPointForCompany = new MapPointForCompany(37.4769906,126.8859724,"Seoul LG-GasnB");
//console.info( mapPointForCompany.getType());
//console.info( mapPointForCompany.getName(),mapPointForCompany.getLat(),mapPointForCompany.getLon());
//
//var mapPointForFavorite = new MapPointForFavorite(37.4812465,126.8464609,"Seoul SeoHae-Baksok-NackJi");
//console.info( mapPointForFavorite.getType());
//console.info( mapPointForFavorite.getName(),mapPointForFavorite.getLat(),mapPointForFavorite.getLon());
//
//var mapPointForDrive = new MapPointForDrive(0,0,"Seoul All");
//console.info( mapPointForDrive.getType());
//console.info( mapPointForDrive.getName(),mapPointForDrive.getLat(),mapPointForDrive.getLon());
//
//
//
//



