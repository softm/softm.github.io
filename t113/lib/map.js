var Map_ = function() {
    var items = [];
    var markers = [];
    var current = null;
    var my = null;
    var home = null;
    var compmay = null;
    var poiCurrents = [];
    var defaultZoom = 18;
    var markerSelectZoom = 15;
    var markerZoom = 17;

    var option = {
        center : new Tmapv2.LatLng(37.566481622437934, 126.98502302169841),
        width : "100%",
        height : "450px",
        zoomControl  : false,
        scaleBar : false,
        zoom : defaultZoom
    };
    function init(argus) {
        if ( $("#" + argus.id)[0] ) {
            $("#" + argus.id).empty();
        }
//        var option_ = JSON.parse(JSON.stringify(option));
        var option_ = cloneObject(option);
        if (argus.height) {
            option_.height = argus.height;
//            option.height = argus.height;
        }
        var m = new Tmapv2.Map(argus.id, option_);
    //      m.setCenter(new Tmapv2.LatLng(lat,lon));
            m.setZoom(defaultZoom);

        if (argus.callBack) argus.callBack(m);

        return m;
    }

    function removeCurrentMarker() {
        if ( maps.current ) removeMarker(maps.current);
    }

    function removeMarker(marker) {
        if (marker) {
            if ( marker instanceof MapPoint ) marker = marker.marker;
            try {
                marker.setMap(null);
            } catch (e) {
            }
        }
        marker = null;
    }

    function removeAllMarker() {
        removeCurrentMarker();
        if (markers.length > 0) {
            for (var i in markers) {
                removeMarker(markers[i]);
            }
        }
        markers = [];
        
    }

    function newMarker(map,lat,lon,icon,title,label,iconWidth,iconHeight,draggable){
        var iconSize = null;
        if ( iconWidth > -1 ) {
            iconSize = new Tmapv2.Size(iconWidth,iconHeight);
        }
        return new Tmapv2.Marker({
            position : new Tmapv2.LatLng(lat,lon),
            title:title?title:"",
            label:label,
            icon:icon,
            iconSize:iconSize,
            draggable:draggable,
            map : map
        });
    }
/*
http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_a.png
http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_1.png
http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_a.png
http://tmapapis.sktelecom.com/upload/tmap/marker/pin_g_m_a.png
http://tmapapis.sktelecom.com/upload/tmap/marker/pin_w_m_a.png

http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_a.png
http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_b_a.png

http://tmapapi.sktelecom.com/resources/images/common/pin_car.png

http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_b_x.png

http://tmapapi.sktelecom.com/main.html#webservice/guide/webserviceGuide.guide4
*/

    function addNumberMarker(map,poi,index,current,draggable,cb){
        var lat = poi.getLat  ();
        var lon = poi.getLon  ();
        var name= poi.getName ();
        var icon = null;
        if (!current) {
            icon = index<9?"pin_b_m_" + (index+1) + ".png":"pin_b_s_simple.png";
        } else {
//          icon = "pin_r_s_simple.png";
            icon = "pin_r_b_x.png";
        }

        var iconWidth = -1;
        var iconHeight= -1;
        var label= "";
        if (!current) {
            if (index>=9) {
                iconWidth = 20; 
                iconHeight= 30;
            }
        } else {
            iconWidth = 30; 
            iconHeight= 40;
            label = "<span style='background-color: #46414E;color:white;font-size:14px;padding:5px'><strong>"+name+"</strong></span>";
        }
        console.info(index?index:"current",draggable?draggable:false,icon,lat,lon,"maps.setCenter(map[1],"+lat+","+lon+")");
    // newMarker(map[1],"37.56923178","126.98532588","http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_2.png","디디치킨 명동점","",100,100)

        var mk =  newMarker(map
                        , lat
                        , lon
                        // , "http://tmapapis.sktelecom.com/upload/tmap/marker/" + icon
                        , "./images/tmap/marker/" + icon
                        , name
                        , label
                        , iconWidth
                        , iconHeight
                        , draggable?draggable:false
               );
        markers.push(mk);
        if ( cb ) {
            mk.addListener("touchend", cb);
        }

        return mk;
    }

    var myLat;
    var myLon;
    var myAddress;
//    var my     = null;
    var myPoi     = null;
    var myMarker2 = null;
    function addMyMarker(map,poi,callBack){
        this.myLat       = poi.getLat  ();
        this.myLon       = poi.getLon  ();
        this.myAddress   = poi.getName ();
//      draggable = typeof (o.draggable) === "undefined"?false:o.draggable;

        if( this.my ) this.removeMarker(this.my.marker);
//        if(this.myPoi.marker){
//            this.removeMarker(this.myMarker2);
//            this.myMarker2 = null;
//        }
//        setTimeout(function(){
            var content = "<div style='position: relative; border-bottom: 1px solid #dcdcdc; line-height: 18px; padding: 0 35px 2px 0;'>"
                    + "<div style='font-size: 12px; line-height: 15px;'>"
                    + "<span style='display: inline-block; width: 14px; height: 14px; background-image: url(http://tmapapis.sktelecom.com/resources/images/common/icon_blet.png); vertical-align: middle; margin-right: 5px;'></span>" + myAddress
                    + "</div>"
                    + "</div>";

            var iconWidth=35,iconHeight=40;
            // poi.marker = this.newMarker(map,this.myLat,this.myLon,"https://img.pngio.com/google-map-pinpoint-icon-321737-free-icons-library-google-map-pin-point-png-512_512.jpg",this.myAddress?this.myAddress:"",this.myAddress?"<span style='background-color: #46414E;color:white;font-size:14px'>"+this.myAddress+"</span>":"",iconWidth,iconHeight);
            poi.marker = this.newMarker(map,this.myLat,this.myLon,"./images/map_pin.png",this.myAddress?this.myAddress:"",this.myAddress?"<span style='background-color: #46414E;color:white;font-size:14px'>"+this.myAddress+"</span>":"",iconWidth,iconHeight);
//            this.myMarker2= this.newMarker(map,this.myLat,this.myLon,"http://tmapapis.sktelecom.com/resources/images/common/icon_blet.png","내위치",'<svg style="position:relative;top:-20px" width="400" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><g><title>background</title><rect fill="none" id="canvas_background" style="max-width:100%;height:auto" width="400" y="-1" x="-1"/></g><g><title>Layer 1</title><path stroke="null" id="svg_1" fill="none" d="m1.694915,1.694914l35.864401,0l0,36.71186l-35.864401,0l0,-36.71186z"/><path fill="#0000ff" stroke="null" id="svg_2" opacity="0.7" d="m19.627115,29.228809c4.946299,0 8.9661,-4.114788 8.9661,-9.177965s-4.019802,-9.177965 -8.9661,-9.177965s-8.9661,4.114788 -8.9661,9.177965s4.019802,9.177965 8.9661,9.177965z"/><path fill="#ffffff" stroke="null" id="svg_3" d="m19.627115,32.28813c6.605027,0 11.9548,-5.476186 11.9548,-12.237287s-5.349773,-12.237287 -11.9548,-12.237287s-11.9548,5.476186 -11.9548,12.237287s5.349773,12.237287 11.9548,12.237287zm0,-21.415251c4.946299,0 8.9661,4.114788 8.9661,9.177965s-4.019802,9.177965 -8.9661,9.177965s-8.9661,-4.114788 -8.9661,-9.177965s4.019802,-9.177965 8.9661,-9.177965z"/></g></svg>',0,0);
//            setCenter(map,myLat,myLon);
//            setZoom(map,defaultZoom);
            if (callBack) callBack();
//        },300);
        this.setMy(poi);
        return poi.marker;
    }

    var currentPoi = null;
    function addCurrentMarker(map,poi,cb){
        removeCurrentMarker();
        var lat = poi.getLat  ();
        var lon = poi.getLon  ();
        var name= poi.getName ();
        var indexl    = null;
        var current   = true;
        
        var draggable = cb?true:false;
        var icon = null;
        icon = "pin_r_b_x.png";

        var iconWidth = -1;
        var iconHeight= -1;
        var label= "";
            iconWidth = 30; 
            iconHeight= 40;
            label = "<span style='background-color: #46414E;color:white;font-size:14px;padding:5px'><strong>"+name+"</strong></span>";
        var mk = newMarker(map
                        , lat
                        , lon
//                        , "http://tmapapis.sktelecom.com/upload/tmap/marker/" + icon
                        , "./images/tmap/marker/" + icon
                        , name
                        , label
                        , iconWidth
                        , iconHeight
                        , draggable // draggable
               );
        var v = new MapPoint(poi.getLat(),poi.getLon(),poi.getName(),poi.item);
        v.marker = mk;
        if ( cb ) {
            v.marker.addListener("touchend", function(evt) {
                 cb(evt);
            }) ;
        }
        this.setCurrent(v);
        return poi.marker ;
    }

    function addListener(map,evtName, callback) {
        debugger;
        map.addListener(evtName, function(evt) {
            debugger
            if ( callback ) callback(evt);
        });
    }
    
    var homePoi = null;
    function addHomeMarker(map,poi){
        if( this.home ) removeMarker(this.home.marker);
        var lat = poi.getLat  ();
        var lon = poi.getLon  ();
        var name= poi.getName ();
        var mk = newMarker(
            map,lat,lon
            , "./images/home.svg"
            , name
            , '<span onClick="zoomHome()" style="position:relative;top:0px;left:0px;top:5px">' +
              "<span style='background-color: #1266DC;color:white;font-size:14px;padding:5px;'><strong>집</strong></span>" +
              '</span>'
            ,36,36);

        window.zoomHome = function() {
            maps.setCenter(map,poi.getLat(),poi.getLon());
            maps.setZoom(map,maps.markerSelectZoom);
        }
        mk.addListener("touchend",zoomHome);
        poi.marker = mk;
        this.setHome(poi);
        return mk;
    }

    var companyPoi = null;
    function addCompanyMarker(map,poi){
        if( this.company ) removeMarker(this.company.marker);
        var lat = poi.getLat  ();
        var lon = poi.getLon  ();
        var name= poi.getName ();

        poi.marker = newMarker(
            map,lat,lon
            , "./images/company.svg"
            , name
            , '<span onClick="zoomCompany()" style="position:relative;top:0px;left:0px;top:5px">' +
              "<span style='background-color: #1266DC;color:white;font-size:14px;padding:5px;'><strong>회사</strong></span>" +
              '</span>'
            ,36,36);
        window.zoomCompany = function() {
            maps.setCenter(map,poi.getLat(),poi.getLon());
            maps.setZoom(map,maps.markerSelectZoom);
        }
        poi.marker.addListener("touchend",zoomCompany);
        this.setCompany(poi);
        return poi.marker;
    }

    var favoritePoi = null;
    function addFavoriteMarker(map,poi){
        if( this.favorite ) removeMarker(this.favorite.marker);
        var lat = poi.getLat  ();
        var lon = poi.getLon  ();
        var name= poi.getName ();

        poi.marker = newMarker(
            map,lat,lon
            , "./images/favorite.svg"
            , name
            , '<span onClick="zoomFavorite()" style="position:relative;top:0px;left:0px;top:5px">' +
              "<span style='background-color: #1266DC;color:white;font-size:14px;padding:5px;'><strong>즐겨찾기</strong></span>" +
              '</span>'
            ,36,36);

        window.zoomFavorite = function() {
            maps.setCenter(map,poi.getLat(),poi.getLon());
            maps.setZoom(map,maps.markerSelectZoom);
        }
        poi.marker.addListener("touchend",zoomFavorite);
        this.setFavorite(poi);
        return poi.marker;
    }

    function setMy(poi) {
        this.myPoi = poi;
        this.my = poi;
    }

    function setHome(poi) {
        this.homePoi = poi;
        this.home = poi;
        
        var v = new MapPointForHome(poi.getLat(),poi.getLon(),poi.getName());
        v.item = poi.item;
        // v.marker = poi.marker;
        fn_DeviceSaveData("_POI_HOME", stringify([v]));
    }

    function setCompany(poi) {
        this.companyPoi = poi;
        this.company = poi;
        
        var v = new MapPointForCompany(poi.getLat(),poi.getLon(),poi.getName());
        v.item = poi.item;
        // v.marker = poi.marker;
        fn_DeviceSaveData("_POI_COMPANY", stringify([v]));
    }

    function setFavorite(poi) {
        this.favoritePoi = poi;
        this.favorite = poi;
    }

    function addFavorite(poi,cb) {
        localStorageBasic.getPoiCount("key", poi.id + "_" + poi.getName(), function (count) {
            if (count == 0) {
            //   poi.marker = null;
              var favPoi = Object.assign({},poi);
              favPoi.marker = null;
            //   var v = new MapPointForFavorite(poi.getLat(),poi.getLon(),poi.getName());
            //   v.item = poi.item;

              localStorageBasic.addPoi(favPoi, function () {
                localStorageBasic.allPoi(function (data) {
                  data.sort(function (a, b) {// tmap
                    return b.created - a.created;
                  });
                //   var items = [];
                //   for( key in data ) {
                //       items.push(data[key].item);
                //   }
                  this.favoritePois = data;
                  this.favorites = data;
                  fn_DeviceSaveData("_POIS_FAVORITE", JSON.stringify(data));
                //   fn_OpenOverlayView(true);
                  if ( cb ) cb();
                });
              });
            } else {
                if ( cb ) cb();
            }
        });
    }

    function delFavorite(poi,cb) {
        this.favoritePoi = poi;
        this.favorite = poi;

        localStorageBasic.getPoiCount("key", poi.id + "_" + poi.getName(), function (count) {
            if (count > 0) {
              poi.marker = null;
              poi.type = NaviDestination.FAVORITE;

              localStorageBasic.delPoi("key", poi.id + "_" + poi.getName(), function () {
                localStorageBasic.allPoi(function (data) {
                  data.sort(function (a, b) {
                    return b.created - a.created;
                  });
                  fn_DeviceSaveData("_POIS_FAVORITE", JSON.stringify(data));
                //   fn_OpenOverlayView(false);
                  if ( cb ) cb();
                });
              });
            }
        });
    }

    function setCurrent(poi) {
        this.currentPoi = poi;
        this.current = poi;
        var v = "";
        if ( poi ) {
            v = new MapPoint(poi.getLat(),poi.getLon(),poi.getName());
            v.item = poi.item;
        }
        // v.marker = poi.marker;
        fn_DeviceSaveData("_POI_CURRENT", stringify([v]));
    }

    var bounds = null;
    var boundMapPoints = [];
    var endPanToBounds = false;

    function addBound(mapPoint) {
        if ( this.endPanToBounds ) {
            this.boundMapPoints = [];
            this.bounds = null;
            this.endPanToBounds = false;
        }
        if (this.boundMapPoints.length == 0 )
            this.bounds = new Tmapv2.LatLngBounds();
        this.boundMapPoints.push(mapPoint);
    }

    function clearBounds() {
        this.boundMapPoints = [];
        this.endPanToBounds = true;
    }

    function getBounds(mapPoints) {
        return this.boundMapPoints;
    }

    function addBounds(mapPoints) {
        this.boundMapPoints = mapPoints;
    }

    function panToBounds(map) {
        for(var i in this.boundMapPoints){
            var poi = this.boundMapPoints[i];
            this.bounds.extend(new Tmapv2.LatLng(poi.getLat(), poi.getLon()));
        }
        console.log("boundMapPoints",this.boundMapPoints);
        if ( this.boundMapPoints.length > 1 ) {
            map.panToBounds(this.bounds);
        }
        this.endPanToBounds = true;
    }

    function setCenter(map,lat,lon) {
        map.setCenter(new Tmapv2.LatLng(lat,lon));
    }

    function getCenter(map) {
        var pos = map.getCenter();
        return {
            lat:function(){
                return pos.lat();
            },
            lng:function(){
                return pos.lng();
            }
        }
    }

    function setZoom(map,level,time) {
        level = typeof (level) === "undefined"?maps.markerSelectZoom:level;
        time = typeof (time) === "undefined"?0:time;
        if ( time > 0 ) {
            setTimeout(function(){
                map.setZoom(level);
            },time);
        } else {
            map.setZoom(level);
        }
    }

    function zoomOut(map,time) {
        time = typeof (time) === "undefined"?0:time;
        if ( time > 0 ) {
            setTimeout(function(){
                map.zoomOut();
            },time);
        } else {
            map.zoomOut();
        }
    }

    function poiToAddress(lat,lng,callback){
        var optionObj = {
            coordType: "WGS84GEO",
            addressType: "A04"   ,
        };
        var params = {
            onComplete:function(){
                callback(this._responseData);
            },
            onProgress:function(){},
            onError:function(){
                callback({
                    addressInfo:{
                        lat:lat,
                        lng:lng,
                        fullAddress:""
                    }
                });
            }
        };
        (new Tmapv2.extension.TData()).getAddressFromGeoJson(lat,lng, optionObj, params);
    }

    function searchPoiData(search,successCallBack,progressCallBack,errorCallBack) {
        var params = {
            onComplete:successCallBack,
            onProgress:progressCallBack,
            onError:errorCallBack
        };

        var optionObj = {
            reqCoordType:"WGS84GEO", //요청 좌표계 
            resCoordType:"WGS84GEO",  //응답 좌표계 
            centerLon:this.myLon, //POI검색 중앙좌표 경도
            centerLat:this.myLat //POI검색 중앙좌표 위도
        };
        var tData = new Tmapv2.extension.TData();
            tData.getPOIDataFromSearchJson(encodeURIComponent(search),optionObj,params);
    }

    function setPositionBottom (o) {
        o.marginOffset = typeof (o.marginOffset) === "undefined"?65:o.marginOffset;
        var mapElement = $("#"+o.mapId);
        $(o.marginElement).css("marginBottom",(mapElement.height()+o.marginOffset)+"px");
        mapElement.css("position","fixed");
        // mapElement.css("bottom","10%");
        mapElement.css("bottom",document.querySelector("footer").offsetHeight+"px");
        console.log("scroll","setPositionBottom");
        // $("#mapIndicator").show();
    }

    function setPositionClear (o) {
        var mapElement = $("#"+o.mapId);
        $(o.marginElement).css("marginBottom","0px");
        mapElement.css("position","");
        mapElement.css("bottom","");
        console.log("scroll","setPositionClear");
        // $("#mapIndicator").hide();
    }

    var rtn = {};
        rtn.items               = items              ;
        rtn.markers             = markers            ;
        rtn.current             = current            ;
        rtn.my                  = my                 ;
        rtn.home                = home               ;
        rtn.compmay             = compmay            ;
 
        rtn.poiCurrents         = poiCurrents        ;
        rtn.init                = init               ;
        rtn.option              = option             ;
 
        rtn.newMarker           = newMarker          ;
        rtn.addMyMarker         = addMyMarker        ;
        rtn.addCurrentMarker    = addCurrentMarker   ;
        rtn.addHomeMarker       = addHomeMarker      ;
        rtn.addCompanyMarker    = addCompanyMarker   ;
        rtn.addFavoriteMarker   = addFavoriteMarker  ;
        rtn.addNumberMarker     = addNumberMarker    ;
        rtn.removeMarker        = removeMarker       ;
        rtn.removeAllMarker     = removeAllMarker    ;
        rtn.removeCurrentMarker = removeCurrentMarker;
        rtn.addListener         = addListener        ;

        rtn.setMy            = setMy;
        rtn.setCurrent       = setCurrent;
        rtn.setHome          = setHome;
        rtn.setCompany       = setCompany;
        rtn.setFavorite      = setFavorite;
        rtn.addFavorite      = addFavorite;
        rtn.delFavorite      = delFavorite;
    
        rtn.boundMapPoints  = boundMapPoints;
        rtn.clearBounds        = clearBounds;
        rtn.addBound        = addBound;
        rtn.getBounds       = getBounds;
        rtn.addBounds       = addBounds;
        rtn.panToBounds     = panToBounds;

        rtn.setCenter           = setCenter         ;
        rtn.getCenter           = getCenter         ;
        rtn.defaultZoom       = defaultZoom           ;
        rtn.markerSelectZoom       = markerSelectZoom           ;
        rtn.markerZoom       = markerZoom           ;

        rtn.setZoom             = setZoom           ;
        rtn.zoomOut             = zoomOut           ;
        rtn.poiToAddress        = poiToAddress      ;
        rtn.searchPoiData       = searchPoiData     ;
        rtn.setPositionBottom   = setPositionBottom ;
        rtn.setPositionClear    = setPositionClear  ;
        rtn.setPositionClear    = setPositionClear  ;

    return rtn;
//    {
//         init               : init
//        ,option             : option
//        ,addMyMarker        : addMyMarker
//        ,createBound        : createBound
//        ,addBound           : addBound
//        ,panToBounds        : panToBounds
//        ,newMarker          : newMarker
//        ,setCenter          : setCenter
//        ,setZoom            : setZoom
//        ,zoomOut            : zoomOut
//        ,poiToAddress       : poiToAddress
//        ,my                 : {lat:myLat,lon:myLon,address:myAddress}
//    };
};



function bindPoiHome(v) {
    fn_GetInfo("", "getInfoCallBack");
//	var tmaps = parsePoi(v);
	var data = parsePoi(v);
	var mapPoint = tmapToMapPoint(data&&v?data[0]:null);
//	var mapPoint = objectToMapPoint(data&&v?data[0]:null);
	if ( mapPoint && mapPoint.getName()) {
//		maps.addHomeMarker(map,new MapPointForHome(mapPoint.getLat(),mapPoint.getLon(),mapPoint.getName()));
		maps.addHomeMarker(map,mapPoint);

        setTimeout(function() {
            onChangeButton(true,mapPoint?true:false);
        },300);

        var infos = [
			mapPoint.getName()
//          item[0].frontLat,
//          item[0].frontLon
		];
        try {
		    setGuideMessage("<B>\"" + infos.join(" ") + "\"</B>" + "으로 안내합니다.");
        } catch (e) {
        }
	} else {
		onChangeButton(false,false);
        try {
            setGuideMessage(t("message.guide_not_home"));
        } catch (e) {
        }
	}
};

function bindPoiCompany(v) {
    fn_GetInfo("", "getInfoCallBack");
//	var tmaps = parsePoi(v);
	var data = parsePoi(v);
	var mapPoint = tmapToMapPoint(data&&v?data[0]:null);
//	var mapPoint = objectToMapPoint(data&&v?data[0]:null);

	if ( mapPoint && mapPoint.getName()) {
//		maps.addCompanyMarker(map,new MapPointForCompany(mapPoint.getLat(),mapPoint.getLon(),mapPoint.getName()));
		maps.addCompanyMarker(map,mapPoint);
        setTimeout(function() {
            onChangeButton(true,mapPoint?true:false);
        },300);

		var infos = [
			mapPoint.getName()
//          item[0].frontLat,
//          item[0].frontLon
		];
        try {
            setGuideMessage("<B>\"" + infos.join(" ") + "\"</B>" + "으로 안내합니다.");
        } catch (e) {
        }
	} else {
		onChangeButton(false,false);	
        try {
            setGuideMessage(t("message.guide_not_company"));
        } catch (e) {
        }
	}
};

function bindPoiFavorite(v) {
    fn_GetInfo("", "getInfoCallBack");
//	var tmaps = parsePoi(v);
	var data = parsePoi(v);
	var mapPoint = tmapToMapPoint(data&&v?data[0]:null);
//	var mapPoint = objectToMapPoint(data&&v?data[0]:null);

	if ( mapPoint && mapPoint.getName()) {
//		maps.addFavoriteMarker(map,new MapPointForFavorite(mapPoint.getLat(),mapPoint.getLon(),mapPoint.getName()));
		maps.addFavoriteMarker(map,mapPoint);
        setTimeout(function() {
            onChangeButton(true,mapPoint?true:false);
        },300);
		var infos = [
			mapPoint.getName()
//          item[0].frontLat,
//          item[0].frontLon
		];
        try {
            setGuideMessage("<B>\"" + infos.join(" ") + "\"</B>" + "으로 안내합니다.");
        } catch (e) {
        }
	} else {
		onChangeButton(false,false);
        try {
            setGuideMessage(t("message.guide_not_destination"));
        } catch (e) {
        }
	}
};