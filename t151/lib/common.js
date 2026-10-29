/*
 * SOFTM-I18N-MESSAGES-CONSUME START 날짜:20260521 : 공용 i18n_messages.js의 messages 객체 사용
 */
if (typeof messages === "undefined") {
  var messages = {
    en: {
      translation: {},
      myModule: {
        "key": "OK"
      }
    }
  };
}
/*
 * SOFTM-I18N-MESSAGES-CONSUME END
 */
/*
 * SOFTM-I18N-MULTI START 날짜:20260521 : 우선순위 해외 언어(pt/es/id/ja/th/vi/de/fr) WebView 언어 정규화와 영어 fallback 병합
 */
var softmSupportedLanguages = ["en", "ko", "pt", "es", "id", "ja", "th", "vi", "de", "fr"];

function softmNormalizeLanguage(lang) {
  var value = String(lang || "en").toLowerCase().replace("_", "-");
  var base = value.split("-")[0];
  if (base === "in") base = "id";
  return softmSupportedLanguages.indexOf(base) >= 0 ? base : "en";
}

function softmClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function softmMerge(target, source) {
  Object.keys(source || {}).forEach(function(key) {
    if (typeof source[key] === "undefined") return;
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      target[key] = softmMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

function softmApplyLocaleFallbacks() {
  softmSupportedLanguages.forEach(function(lang) {
    if (lang === "en" || !messages[lang]) return;
    messages[lang].translation = softmMerge(softmClone(messages.en.translation), messages[lang].translation || {});
    messages[lang].myModule = messages[lang].myModule || { "key": "OK" };
  });
}

softmApplyLocaleFallbacks();
/*
 * SOFTM-I18N-MULTI END
 */

/*
 * SOFTM-I18N-DIRECT START 날짜:20260521 : jQuery i18n 상태와 무관하게 현재 언어 messages에서 직접 번역 조회
 */
function softmLookupMessage(source, key) {
  return String(key || "").split(".").reduce(function(value, part) {
    if (value && Object.prototype.hasOwnProperty.call(value, part)) return value[part];
    return undefined;
  }, source);
}

function softmApplyMessageOptions(value, option) {
  if (!option) return value;
  return value.replace(/{(.*?)}/g, function(match, p1) {
    return Object.prototype.hasOwnProperty.call(option, p1) ? option[p1] : match;
  });
}

function softmTranslateMessage(key, option) {
  var currentLang = softmNormalizeLanguage(typeof lng !== "undefined" && lng ? lng : localStorage.getItem("lng"));
  var value = softmLookupMessage(messages[currentLang] && messages[currentLang].translation, key);
  if (typeof value === "undefined" && currentLang !== "en") {
    value = softmLookupMessage(messages.en && messages.en.translation, key);
  }
  if (typeof value === "undefined" && typeof $ !== "undefined" && $.i18n && typeof $.i18n.t === "function") {
    value = $.i18n.t(key);
  }
  if (typeof value === "undefined" || value === null) value = key;
  return softmApplyMessageOptions(String(value), option);
}
/*
 * SOFTM-I18N-DIRECT END
 */

var sLng = localStorage.getItem('lng');
 console.info("sLng",sLng);
var p_lang = getParam("lng");
 console.info("p_lang",p_lang);
var lng = null;
if ( p_lang ) lng = p_lang;
else if ( sLng ) lng = sLng;

// lng = !lng?'en':lng;
lng = softmNormalizeLanguage(!lng?navigator.language.split("-")[0]:lng);

localStorage.setItem('lng',lng);
 console.info("lng",lng);
 var i18nInitForDefault = {
        lng: lng,
        debug: true,
        // ns: {
            ns: ['translation', 'myModule'],
            defaultNS: 'translation',
        // },
        resources: messages
};
var i18nInitForJquery = {
        lng: softmNormalizeLanguage(lng),
        debug: true,
        ns: {
            namespaces: ['translation', 'myModule'],
            defaultNs: 'translation'
        },
        resStore: messages
};

// using - default i18next
/*
  // console.info(i18next)
    i18next
      .use(i18nextXHRBackend)
      .use(i18nextBrowserLanguageDetector)
      .init(i18nInitForDefault, function(err, t) {
        // init set content
        // updateContent();
        // console.info("aa");
        console.info(i18next.t('key'));

      });
    // window.onload = function() {
    //   debugger;
    //   // i18next("header");
    // }
*/
// using - jquery i18next
//    debugger;
/*  */
$.i18n.init(i18nInitForJquery, function(err, t) {
        // init set content
        // updateContent();
        // console.info("aa");
        // console.info($.i18n.t('apple'));
        console.info($.i18n.t('key'));
});

var drawer = null;
var topAppBar = null;
var drawerListEl = null;

var DRAWER_LIST_INFO = {
  "index.html" : {page:"index.html",visible:true,icon:"home",label:"title.home"}, // 홈
  "setting.html" : {page:"setting.html",visible:true,icon:"settings",label:"title.setting",showOnlySelf:true}, // 설정
  "onoff.html" : {page:"onoff.html",visible:true,icon:"toggle_on",label:"title.start_stop",showOnlySelf:true}, // 시작/종료
  "run_option.html" : {page:"run_option.html",visible:true,icon:"link",label:"title.run_options",showOnlySelf:true,popup:true,reloadAtReturn:true}, // 실행옵션
  "developer_support.html" : {page:"developer_support.html",visible:true,icon:"favorite",label:"title.support_developers",showOnlySelf:true}, // 개발자 응원하기
  "home_company.html" : {page:"home_company.html",visible:true,icon:"home_work",label:"title.home_company",popup:true}, // 집/회사
  "search.html?idx=2" : {page:"search.html",visible:true,icon:"bookmark",label:"title.favorite",pathSearchSame:true,popup:true}, // 즐겨찾기
  // "membership.html" : {icon:"card_membership",label:"title.membership"}, // 멤버쉽
  "laboratory.html" : {page:"laboratory.html",visible:true,icon:"emoji_objects",label:"title.laboratory",popup:true}, // 연구소
  "qna.html" : {page:"qna.html",icon:"forum",visible:true,label:"title.contact_us",popup:true}, // 문의하기
  "goto_map_store.html" : {page:"goto_map_store.html",visible:true,icon:"storefront",label:"title.goto_map_store"}, // 어플 평가하기
  // "rate_the_app.html" : {page:"rate_the_app.html",visible:true,icon:"thumb_up",label:"title.rate_the_app"}, // 어플 평가하기
}


var drawerSelectedIndex = null;
var testClick = 0;
$( document ).ready(function() {
  footerNavigation = [].map.call(document.querySelectorAll(".mdc-bottom-navigation__list-item"),(el,idx)=>{
      var rtnEl = new mdc.ripple.MDCRipple(el);
      rtnEl.listen("click",function(e) {
          $(this).closest("div").find(".mdc-bottom-navigation__list-item").removeClass("mdc-bottom-navigation__list-item--activated");
          $(this).addClass("mdc-bottom-navigation__list-item--activated");
          if ( footerNavigationIndex != idx ) {
            if ( isTest ) {
              fn_OpenUrl(footerNavigationUrl[idx]);
            } else {
              var reqId = footerNavigationUrl[idx].split(".")[0].toLocaleUpperCase();
              window.GetURLCallback = function(url) {
                if ( location.protocol.startsWith("http") && url.startsWith("file") ) {
                  if ( reqId == "index") fn_GoMain(true);
                  else fn_GoFoward("WEB_"+reqId);
                } else {
                  fn_OpenUrl(url);
                }
              }
              fn_GetURL("WEB_" + reqId,"GetURLCallback");
            }
            // windowOpen(footerNavigationUrl[idx]);
          }
      });
      return rtnEl;
  });

  $(".app-bar").click(function(e) {
    if ( testClick == 0 ) {
        setTimeout(function() {
          testClick = 0;
        },20000);
    }
    testClick++;
    if ( testClick == 10 ) {
      fn_GoTest();
      testClick = 0;
    }
  });

  if ( document.querySelector('.mdc-drawer') ) {
    
    drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
    topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(document.getElementById('app-bar'));
    topAppBar.setScrollTarget(document.getElementById('main-content'));
    topAppBar.listen('MDCTopAppBar:nav', () => {
        drawer.open = !drawer.open;
    });
    const mainContentEl = document.querySelector('.main-content');

    document.body.addEventListener('MDCDrawer:opened', () => {
      // mainContentEl.querySelector('input, button').focus();
      // debugger;
      // window.drawerSelectedIndex = drawer.innerList.selectedIndex;
      // drawer.innerList.selectedIndex = window.drawerSelectedIndex;
      
    });

    document.body.addEventListener('MDCDrawer:closed', () => {
        // mainContentEl.querySelector('input, button').focus();
    });

    drawerListEl = document.querySelector('.mdc-drawer .mdc-deprecated-list');

    drawerListEl.addEventListener('click', (event) => {
        drawer.open = false;
        setTimeout(function () {
            var idx = drawer.innerList.selectedIndex;
            var drawerInfos = Object.values(DRAWER_LIST_INFO);
            var urls = Object.keys(DRAWER_LIST_INFO);
            var url = urls[idx];
            var drawerInfo = drawerInfos[idx];
            if ( url  === "goto_map_store.html" ) {
              fn_GotoMarket("net.softm.startnavi.poweron");
              drawer.innerList.selectedIndex = window.drawerSelectedIndex;
              event.preventDefault();
            } else if ( url  === "rate_the_app.html" ) {
                fn_GotoMarket("net.softm.startnavi.poweron");
                drawer.innerList.selectedIndex = window.drawerSelectedIndex;
                event.preventDefault();
            } else {
              if ( drawerInfo.popup ) {
                drawer.innerList.selectedIndex = window.drawerSelectedIndex;
                fn_OpenPop(url);
              } else {
                // windowOpen(url);
                fn_OpenUrl(url);
                // document.location.href = url;
              }
            }
            // location.reload();
            // drawer.innerList.selectedIndex = 0;
        }, 100)
        event.preventDefault();
    });
    //        drawer.innerList.selectedIndex = 2;
    reDrawDrawer();

  }

	$( '<div class="mo-ui-layer progress" style="display:none"><div class="mo-ui-innerlayer"><div class="loading-centered-element"><img src="data:image/png;base64,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"></div></div></div>' ).appendTo( $( "body" ) );

    $(".i18n").i18n();
    const snackbarMDC = new mdc.snackbar.MDCSnackbar(
      document.querySelector(".mdc-snackbar")
    );
    snackbarMDC.timeoutMs = 4000; // min 4000
    snackbarMDC.timeout = 2500; // min 4000
    
    // snackbar.open();

    const dialogMDC = new mdc.dialog.MDCDialog(
      document.querySelector(".basic.mdc-dialog")
    );

    // debugger;
    dialogMDC.listen("MDCDialog:opened", () => {
      // alert("opened");
      console.info("opened");
    });

    window.material = {};
    // console.clear();
    //console.info("test1");
    window.material.snackbarClose = function (v) {
		snackbarMDC.close();
	}
    window.material.wTimeout = null;
    window.material.snackbar = function (v) {
      snackbarMDC.labelText = "";
      // var h = $("footer").height();
      var h = $("footer:not(.mdc-dialog__actions)").height();
      snackbarMDC.root.style.bottom = (h) + "px";
      snackbarMDC.close();
      snackbarMDC.open();
      // snackbarMDC.labelText = v;
      snackbarMDC.root.querySelector(".mdc-snackbar__label").innerHTML = v;
      // snackbarMDC.actionButtonText = "aaaaaaaa";
      clearTimeout(window.material.wTimeout);
      window.material.wTimeout = setTimeout(function() {
            snackbarMDC.close();
      },snackbarMDC.timeout);
    }
    snackbarMDC.listen("click",function() {
      snackbarMDC.close();
    })
    window.material.confirm = function (v, f, felse) {
      if ( document.querySelector("#my-dialog-title") != null ) document.querySelector("#my-dialog-title").innerHTML = v;
      document.querySelector(".mdc-dialog .mdc-dialog__actions button:nth-child(1)").style.visibility = "visible";    
      let eventListener = function(e) {
        // alert("closed");
        if (e.detail.action == "accept") {
          if (f) f();
        }
        if (e.detail.action == "close") {
          if (felse) felse();
        }
        console.info("closed action", e.detail.action);
        dialogMDC.unlisten("MDCDialog:closed",eventListener);
      };
      dialogMDC.open();
      dialogMDC.listen("MDCDialog:closed", eventListener);
    }

    window.material.alert = function (v, f,felse) {
      document.querySelector("#my-dialog-title").innerHTML = v;
      document.querySelector(".mdc-dialog .mdc-dialog__actions button:nth-child(1)").style.visibility = "hidden";    
      
      let eventListener = function(e) {
        // alert("closed");
        if (e.detail.action == "accept") {
          if (f) f();
        } else if (e.detail.action == "close") {
            if (felse) felse();
          }
        console.info("closed action", e.detail.action);
        dialogMDC.unlisten("MDCDialog:closed",eventListener);
      };
      dialogMDC.open();
      dialogMDC.listen("MDCDialog:closed", eventListener);
    }
    window.t = function (v,option){
      return softmTranslateMessage(v, option); // SOFTM-I18N-DIRECT 날짜:20260521 : 현재 언어 messages 직접 조회 함수 사용
    }
});

window.alert = function (v,f) {
/*
    if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
        AlertUtil.fn_Alert(v,f);
    }else{
        material.alert(v, f);
    }
*/
    material.alert(v, f);
}

window.confirm = function (v,f,felse) {
//    if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
//        fn_Confirm("",v,f);
//    }else{
        material.confirm(v, f, felse);
//    }
}

function snackbar(v) {
    material.snackbar(v);
}

function snackbarClose() {
    material.snackbarClose();
}

function showLoading(v) {
    if ( v ) $('.mo-ui-layer.progress').show();
    else fn_Progress_Show();
//	if(isBrowser) {
//		$('.mo-ui-layer.progress').show();
//	} else {	
//		if ( typeof(Android) !== "undefined") {	
//			Android.showLoading();
//		}
//	}
}

function hideLoading(v) {
    if ( v ) $('.mo-ui-layer.progress').hide();
    else fn_Progress_Hide();
//	window.setTimeout(function() {
//		$('.mo-ui-layer.progress').hide();
////		if(isBrowser) {
////		    $('.mo-ui-layer.progress').hide();
////		} else {	
////			if ( typeof(Android) !== "undefined") {
////			  Android.hideLoading();
////			}
////		}
//	},100);
}

function toast(msg) {
    fn_Toast(msg);
}


function tDataPoiAddress(pos,callback){
    var optionObj = {
        coordType: "WGS84GEO",       //응답좌표 타입 옵션 설정 입니다.
        addressType: "A04"           //주소타입 옵션 설정 입니다.
    };
    var params = {
        onComplete:function(){
//						snackbar(this._responseData.addressInfo.fullAddress);
            callback(this._responseData);
        },
        onProgress:function(){},
        onError:function(){}
    };
    (new Tmapv2.extension.TData()).getAddressFromGeoJson(pos.lat(),pos.lng(), optionObj, params);
}

HTMLElement.prototype.hide = function() {
    this.style.display = "none";
};

HTMLElement.prototype.show = function(display) { // display : "", inline, block
    this.style.display = display?display:"";
};
HTMLElement.prototype.showInline = function(display) { // display : inline
    this.show("inline");
};

HTMLElement.prototype.showBlock = function(display) { // display : block
    this.show("block");
};

function getDistanceFromLatLonInKm(lat1,lng1,lat2,lng2) {
    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lng2-lng1);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function cloneObject(obj) {
  return Object.assign({}, obj);
}

function setAddress(v) {
    if ( v == null )
        document.querySelector("#place_address").hide();
    else {
        document.querySelector("#place_address").show();
        document.querySelector("#place_address").innerText = v;
    }
}

function endScroll(trueCallBack,falseCallBack,offSet){
    offSet = typeof (offSet) === "undefined"?100:offSet;
    function checker(e) {
        var target = e.currentTarget;
        var scrollTop = target.scrollTop || window.pageYOffset;
        var scrollHeight = target.scrollHeight || document.body.scrollHeight;
        console.log("endScroll", scrollHeight - scrollTop, $(target).innerHeight(),(scrollHeight - scrollTop) - $(target).innerHeight());

        //    if (scrollHeight - scrollTop === $(target).innerHeight()) {
        if ((scrollHeight - scrollTop) - $(target).innerHeight() < offSet ) {
            console.log("► End of scroll - true");
            if (trueCallBack) trueCallBack();
        } else {
            console.log("► End of scroll - false");
            if (falseCallBack) falseCallBack();
        }
    }
    $(window).scroll(function (e) {
        checker(e);
    });
    checker({
        currentTarget:window
    });
}

function topScroll(trueCallBack,falseCallBack,offSet){
    offSet = typeof (offSet) === "undefined"?150:offSet;
    function checker(e) {
        var target = e.currentTarget;
        var scrollTop = target.scrollTop || window.pageYOffset;
//        scrollHeight = target.scrollHeight || document.body.scrollHeight;
//        console.log("topScroll", scrollTop, offSet - scrollTop);

        //    if (scrollHeight - scrollTop === $(target).innerHeight()) {
        if (offSet - scrollTop >= 0 ) {
            console.log("► Top of scroll - true");
            if (trueCallBack) trueCallBack();
        } else {
            console.log("► Top of scroll - false");
            if (falseCallBack) falseCallBack();
        }
    }
    $(window).scroll(function (e) {
        checker(e);
    });
    checker({
        currentTarget:window
    });
}

function scrollTopExec(top,time,callBack) {
    top = typeof (top) === "undefined"?0:top;
    time = typeof (time) === "undefined"?300:time;
    $('html, body').animate({
        scrollTop: top
    }, time,function(){
        if (callBack) callBack();
    });
}

function mapPointToTmap(mapPoint) {
    return {
        frontLat:mapPoint.getLat(),
        frontLon:mapPoint.getLon(),
        name:mapPoint.getName(),
        type:mapPoint.getType(),
        gubun:mapPoint.getGubun()
    };
}

function objectToMapPoint(obj) {
    if ( obj ) {
        var mapPoint = null;
        if ( obj.type.value == NaviDestination.HOME.value ) {
            mapPoint = new MapPointForHome(obj.lat,obj.lon,obj.name)
        } else if ( obj.type.value == NaviDestination.COMPANY.value ) {
            mapPoint = new MapPointForCompany(obj.lat,obj.lon,obj.name)
        } else if ( obj.type.value == NaviDestination.FAVORITE.value ) {
            mapPoint = new MapPointForFavorite(obj.lat,obj.lon,obj.name);
        } else {
            mapPoint = new MapPoint(obj.lat,obj.lon,obj.name)
        }
        mapPoint.id = obj.id;
        mapPoint.item = obj.item;
        return mapPoint;
    } else {
        return null;
    }
}

function tmapToMapPoint(tmap) {
    if ( tmap ) {
        var lat = tmap.lat?tmap.lat:tmap.frontLat;
        var lon = tmap.lon?tmap.lon:tmap.frontLon;
        var name = tmap.name;
        if ( tmap.type.value == NaviDestination.HOME.value ) {
            return Object.assign(new MapPointForHome(lat,lon,name),tmap);
        } else if ( tmap.type.value == NaviDestination.COMPANY.value ) {
            return new MapPointForCompany(lat,lon,name);
        } else if ( tmap.type.value == NaviDestination.FAVORITE.value ) {
            return new MapPointForFavorite(lat,lon,name);
        }
    } else {
        return null;
    }
}

function stringify(obj) {
    let cache = [];
    let str = JSON.stringify(obj, function(key, value) {
      if (typeof value === "object" && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    cache = null; // reset the cache
    return str;
  }

function savePoiSFavoriteForTmap(data) {
	var items = [];
	for( key in data ) {
		items.push(data[key].item);
	}
	fn_DeviceSaveData("_POIS_FAVORITE", JSON.stringify(items));
}

function moveMylocation (mapId,lat,lon,address) {
    console.info("moveMylocation",mapId,lat,lon,address);
    if (!lat) {
      // lat = 37.566481622437934;
      // lon = 126.98502302169841;
      lat = 36.9876599;
      lon = 126.8487439;
      address = "포승읍 모아미래도2차";
    }
    maps.addMyMarker(map, new MapPoint(lat,lon,address));
    maps.setCenter(map,maps.my.getLat(),maps.my.getLon());
    maps.setZoom(map,maps.defaultZoom);

    if (typeof moveMylocationCallback !== "undefined" ) moveMylocationCallback(eval(mapId),lat,lon,address);
}
function getParam(sname) {
    var params = location.search.substr(location.search.indexOf("?") + 1);
    var sval = "";
    params = params.split("&");
    for (var i = 0; i < params.length; i++) {
        temp = params[i].split("=");
        if ([temp[0]] == sname) { sval = temp[1]; }
    }
    return sval;

}
function parsePoi(v) {
    var item = [{}];
    try {
        item = JSON.parse(v.replace("\n",""));
    } catch (e) {
    }
    return item;
}

function maxLengthCheck(object){
    if (object.value.length > object.maxLength){
        object.value = object.value.slice(0, object.maxLength);
    }
}

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1;
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

Date.prototype.hhmmss = function() {
  var hh = this.getHours();
  var mm = this.getMinutes();
  var ss = this.getSeconds();

  return [(hh>9 ? '' : '0') + hh,
          (mm>9 ? '' : '0') + mm,
          (ss>9 ? '' : '0') + ss,
         ].join('');
};

Date.prototype.yyyymmddhhmmss = function() {
  return this.yyyymmdd() + this.hhmmss();
};


var isWeb = !navigator.userAgent.includes("COMPANY=softm");
var isTest = isWeb;

// var footerNavigationUrl = ["index.html","setting.html","onoff.html","membership.html"];
var footerNavigationUrl = ["index.html","setting.html","onoff.html","membership.html","qna.html","run_option.html","developer_support.html"];
var footerNavigation = [];

function windowOpen(url) {
  // window.name = "softm";
  url = typeof fn_ResolveMapModeUrl === "function" ? fn_ResolveMapModeUrl(url) : url; // SOFTM-MAPROUTE: 새 창 URL도 지도 모드별 페이지로 변환. 2026-05-19
  window.open(window.info.serverHost +"/" + window.info.pathName + "/" + url,"softm","");
  // fn_OpenPop(window.info.serverHost+"/" + url);

}

function windowUrl(url) {
  // window.name = "softm";
  url = typeof fn_ResolveMapModeUrl === "function" ? fn_ResolveMapModeUrl(url) : url; // SOFTM-MAPROUTE: 현재 창 URL도 지도 모드별 페이지로 변환. 2026-05-19
  location.href = window.info.serverHost +"/" + window.info.pathName + "/" + url;
  // fn_OpenPop(window.info.serverHost+"/" + url);

}

function windowClose(reload) {
  try {
    window.close();
  } catch (e) {
  }
  // top.window.open('http://softm?','_self').close();
	// top.window.opener=self;
	// top.self.close();
  if ( !reload ) fn_ClosePopData();
  else fn_ClosePopData(null,"fn_Reload");
}

function windowReload(url) {
  location.href = url + "?lng="+softmNormalizeLanguage(lng || navigator.language.split("-")[0]); // SOFTM-I18N-MULTI 날짜:20260521 : 새로고침 이동 시 신규 지원 언어 코드를 유지
}

  /**
  1 : 집↔회사
  2 : 집↔목적지
  */
  var naviModeNames = [
    ""
    , "집↔회사"
    , "집↔목적지"
    , "안전운전"
];

function getPageInfo(pageUrl) {
  var idx = Object.keys(DRAWER_LIST_INFO).findIndex(item=>item.indexOf(pageUrl.toLowerCase() + ".html")>-1);
  var drawerInfos = Object.values(DRAWER_LIST_INFO);
  var urls = Object.keys(DRAWER_LIST_INFO);
  var url = urls[idx].split("?")[0];
  var drawerInfo = drawerInfos[idx]; 
  return drawerInfo;
}

function reDrawDrawer() {
  if ( document.querySelector('.mdc-drawer') ) {
    $(".mdc-drawer .mdc-deprecated-list").empty();
    Object.entries(DRAWER_LIST_INFO).forEach((item,idx)=>{
       var pageUrl = item[0];
       var drawerInfo = item[1];
       if ( drawerInfo.visible ) {
         console.log(pageUrl);
         var row = $(".mdc-drawer .clone").clone();
         row.find("i").text(drawerInfo.icon);
         row.find(".mdc-deprecated-list-item__text").attr("data-i18n",drawerInfo.label);
         
         row.removeClass("clone mdc-deprecated-list-item--activated");
  
         var pathName = document.location.pathname;
         var pathNameInfo = pathName.split("/");
         if ( !drawerInfo.showOnlySelf ) {
           row.removeClass("none");
         }
         console.info("reDrawDrawer: " , pathNameInfo, pathNameInfo[2], ( pageUrl + (drawerInfo.pathSearchSame?document.location.search:"")))
         if ( ( pathNameInfo[2] ) === ( pageUrl + (drawerInfo.pathSearchSame?document.location.search:"") ) ) {
            // row.addClass("mdc-deprecated-list-item--activated");
            row.removeClass("none");
            row.attr("tabindex",0);
            
            // document.location.search
    
            window.drawerSelectedIndex = idx;
        }
       }
       $(".mdc-drawer .mdc-deprecated-list").append(row);

       drawer.innerList.selectedIndex = -1; // 한번 초기화화고 선택되어야 오류 없음.
       drawer.innerList.selectedIndex = window.drawerSelectedIndex;

    });
    $(".mdc-deprecated-list").i18n();
    // $(".mdc-drawer .clone").remove();
  }
}

Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
  return JSON.parse(this.getItem(key));
}

function millisecondsToTime(ms) {
  const days = Math.trunc(ms / (24 * 60 * 60 * 1000)); // 1일 = 24시간 * 60분 * 60초 * 1000ms
  ms %= (24 * 60 * 60 * 1000);
  const hours = Math.trunc(ms / (60 * 60 * 1000)); // 1시간 = 60분 * 60초 * 1000ms
  ms %= (60 * 60 * 1000);

  const minutes = Math.trunc(ms / (60 * 1000)); // 1분 = 60초 * 1000ms
  ms %= (60 * 1000);

  const seconds = Math.trunc(ms / 1000); // 1초 = 1000ms

  return {
      days,
      hours,
      minutes,
      seconds
  };
}

function initBasicInfo() {
  var v = window.info;
  if ( v ) {
    if ( v.isAding || v.isPaid ) {
      $(".user_level.link_dev_support").click(function(e) {
        fn_OpenUrl('developer_support.html');
      });

      $("#footerMenuDeveloperSupport").show();
    } else {
      $("#footerMenuDeveloperSupport").hide();
    }

    var debugBadge = false;
    if ( typeof info.isDebug !== "undefined" ) {
      if ( info.isDebug ) {
        debugBadge = true;
      }
    }
    
    $(".version-name").text("Ver."+v.versionName + " / " + v.versionCode);
    if ( v.userLevel ) {
      var user_level = t("label." + v.userLevel.toLocaleLowerCase() + "_user"); 
      try {
        $(".user_level").text(user_level + (debugBadge?"D":"") + (location.href.startsWith("file")?"F":""));
      } catch(e) {
      }
    }

    if ( info.isPaidLicense ) {
        $(".paidUser").show();
    }

    if ( info.isSubsLicense ) {
        $(".subsUser").show();
    }

    if ( info.isLifeTimeLicense ) {
        $(".lifeTimeUser").show();
    }
  } 
}
function escapeAllControlCharacters(jsonString) {
    // 모든 이스케이프 문자를 \\ 형태로 변환
    const escapedString = jsonString
        .replace(/\\/g, '\\\\')  // 백슬래시를 \\로 변환
        .replace(/\n/g, '\\n')   // 줄바꿈을 \\n으로 변환
        .replace(/\t/g, '\\t')   // 탭을 \\t으로 변환
        .replace(/\r/g, '\\r')   // 캐리지 리턴을 \\r으로 변환
        // .replace(/\b/g, '\\b')   // 백스페이스를 \\b으로 변환
        // .replace(/\f/g, '\\f')   // 폼피드를 \\f으로 변환
        // .replace(/\"/g, '\\"')   // 큰따옴표를 \\\"으로 변환
        // .replace(/'/g, "\\'");   // 작은따옴표를 \\'으로 변환

    return escapedString;
}

function safeParseJson(jsonString) {
    // JSON 문자열에서 예상치 못한 제어 문자가 있는지 검사하고 제거합니다.
    // 제어 문자가 있는 경우 이를 \\n, \\t 등으로 변환하거나 삭제합니다.

    // 제어 문자 제거 정규 표현식 (새로운 줄, 탭 등)
  var sanitizedString = (jsonString);
  // var sanitizedString = escapeAllControlCharacters(jsonString);
  //  var sanitizedString = jsonString.replace(/[\x00-\x1F\x7F]/g, '');
    
    try {
        // 파싱 시도
        const parsedObject = JSON.parse(sanitizedString);
        return parsedObject;
    } catch (error) {
        // 오류 발생 시, 오류 메시지 출력
        console.error("JSON 파싱 오류:", error);
        return null;
    }
}
