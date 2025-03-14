$(document).ready(function () {
	$( '<div class="mo-ui-snackbar" style="display: none; z-index: 1000; left: 0px;"><p class="message"></p></div>' ).appendTo( $( "body" ) );
	$( '<div class="mo-ui-layer progress" style="display:none"><div class="mo-ui-innerlayer"><div class="mo-icon-loading"><img src="images/viewLoading.gif"></div></div></div>' ).appendTo( $( "body" ) );

	(new Image()).src = "images/viewLoading.gif";
    //$('<span style="color:red;">*</span>').insertAfter('.required');
		  if ( location.pathname.indexOf("/login.html") == -1 && location.pathname.indexOf("/index") == -1 ) {
        var mInfo = getMemberInfo();
	    	if ( jQuery.isEmptyObject(mInfo) ) {
	        	goUrl("login.html?redirect");
	    	} else {
	    		$("body").show();
		    }
			}	else {
			 	$("body").show();
	 	  }

			$('a.bktop').click(function(e){
		    $('html, body').animate({scrollTop:0}, '1000');
		    e.preventDefault();
		  });
		  $(window).scroll(function() {
		    if($(this).scrollTop() > 50){
		      $('.bktop').fadeIn('2000');
		    } else {
		      $('.bktop').fadeOut('500');
		    }
		  });

    // $(window).load(function(){
    // });
});

// --
function isEmail (s){ return s.search(/^\s*[\w\~\-\.]+\@[\w\~\-]+(\.[\w\~\-]+)+\s*$/g)>=0;}
function isDate(strDT){
    if(strDT.length < 8) return false;
       strDT = strDT.replace(/[\-\.\/]/g,"");

    var d = new Date(strDT.substring(0, 4),
            strDT.substring(4, 6) - 1,
            strDT.substring(6, 8),
            0, 0, 0);

    if(isNaN(d) == true) return false;
    var s = d.getFullYear().toString();
    var n = d.getMonth() + 1;
    s += (n < 10 ? "0" : "") + n;
    n = d.getDate();
    s += (n < 10 ? "0" : "") + n;

    if(strDT != s) return false;
    return true;
}

function isArray(obj){ if (obj.constructor.toString().indexOf("Array") == -1) return false; else return true;}

function isValid(formSelector,vRules) {
	var vv = jQuery.extend( {} , vRules1, {onfocusout: false,errorPlacement: function(error, element) {}} );
    var validator = $(formSelector).validate(vv);
    if  ( !$(formSelector).valid() ) {
        var errors = validator.numberOfInvalids();
        if (errors) {
            if (validator.errorList.length > 0) alert(validator.errorList[0].message);
            validator.errorList[0].element.focus();
        }
        return false;
    } else {
    	return true;
    }
}

function isKoreanOnly( koreanChar ) {
	 if ( koreanChar == null ) return false ;
	 for(var i=0; i < koreanChar.length; i++){
	   var c=koreanChar.charCodeAt(i);
	   //( 0xAC00 <= c && c <= 0xD7A3 ) 초중종성이 모인 한글자
	   //( 0x3131 <= c && c <= 0x318E ) 자음 모음
	   if( !( ( 0xAC00 <= c && c <= 0xD7A3 ) || ( 0x3131 <= c && c <= 0x318E ) ) ) {
	      return false ;
	   }
	 }
	 return true ;
}

function execSync(url,params,cb) {
	var callUrl = (params.indexOf("error=1")==-1?REST_URL:REST_DEV_URL) + url + "?ui_type=D";
	console.info("callUrl / params : " ,callUrl ,params);
	var rtnData = {};
	var fnCall = function(data) {
        var d = data;
    	if (  d.RESULT_CD == RESULT_CD.NOTLOGIN ) {
        	rtnData={}
    	}
    	if ( cb ) cb(d);
    	rtnData = d;
	}
	$.ajax({
	      //type: CONST.DATA_TYPE=="json"?'GET':"POST",
	   		type: "POST",
		    dataType: CONST.DATA_TYPE,
		    async: false,
		    url: callUrl,
		    data: params,
		    //contentType:'application/x-www-form-urlencoded; charset=EUC-KR',
		    success: function(data) {
	            hideLoading();
		    	if ( CONST.DATA_TYPE == "jsonp" ) {
		    		if ( data.RESULT_MSG ) alert(data.RESULT_MSG);
		    		fnCall(data);
		    	}
		    },
		    complete: function(data) {
	            hideLoading();
		    	if ( CONST.DATA_TYPE == "json" ) {
			        var rtn = data.responseText;
			        try {
			        	//rtn = $.trim(rtn).replace(/\\\"/g,"\"");
						var d = JSON.parse(rtn);
						if ( d.RESULT_MSG ) alert(d.RESULT_MSG);
						fnCall(d);
			        } catch (e) {
			            alert(e);
			        }
		    	}
		    },
		    error: function(xhr, textStatus, thrownError) {
		    	//params += params?"&error=1":"?error=1";
		    	//return execSync(url,params,cb);

		    	try {
		    		hideLoading();
		    	} catch (e ) {}
		    }
		});

	return rtnData;
}

function exec(url,params,cb) {
	var callUrl = (params.indexOf("error=1")==-1?REST_URL:REST_DEV_URL) + url + "?ui_type=D";
	console.info("callUrl / params : " ,callUrl ,params);
	var fnCall = function(data) {
        var d = data;
    	if (  d.RESULT_CD == RESULT_CD.NOTLOGIN ) {
        	goUrl("/loginView.do?relogin");
    	}
    	if ( cb ) cb(d);
	}
	$.ajax({
	      //type: CONST.DA0TA_TYPE=="json"?'GET':"POST",
	   		type: "POST",
		    dataType: CONST.DATA_TYPE,
		    async: true,
		    url: callUrl,
		    data: params,
		    //contentType:'application/x-www-form-urlencoded; charset=EUC-KR',
		    success: function(data) {
	            hideLoading();
		    	if ( CONST.DATA_TYPE == "jsonp" ) {
		    		if ( data.RESULT_MSG ) alert(data.RESULT_MSG);
		    		fnCall(data);
		    	}
		    },
		    complete: function(data) {
	            hideLoading();
		    	if ( CONST.DATA_TYPE == "json" ) {
			        var rtn = data.responseText;
			        try {
			        	//rtn = $.trim(rtn).replace(/\\\"/g,"\"");
						var d = JSON.parse(rtn);
						if ( d.RESULT_MSG ) alert(d.RESULT_MSG);
						fnCall(d);
			        } catch (e) {
			            alert(e);
			        }
		    	}
		    },
		    error: function(xhr, textStatus, thrownError) {
		    	//return exec(url,params + (params?"&error=1":"?error=1") ,cb);
		    	try {
		    		hideLoading();
		    	} catch (e ) {}
		    }
		});
}

function loadUi(selector,url,params,cb) {
    params = $.isArray(params)?params:[];
	console.info("params :" , params);
    $(selector).load( url + "?" + (params.length>0?params.join("&"):"") + (params.length>0?"&":"") + "ui_type=p&lnbSeq=" + lnbSeq, function(responseTxt, statusTxt, xhr){
        if(statusTxt == "success") {
        	if ( cb ) cb();
        } else if(statusTxt == "error") {
	    	params.push("error=1");
	    	loadUi(selector,url,params,cb);
        }
    });
}

function bindJsonToForm(jsonItem,formSelector,setRule) {
    var items = jsonItem;
    if ( jsonItem ) {
        for ( var fId in jsonItem ) {
            var v = items[fId];
            var fe = $(formSelector).find("[name='"+fId.toLowerCase()+"']");
            var rGroup = null;
            var size1 = 0;
            var type = null;
            if ( fe.length > 0 ) {
                type = fe[0].type;
                if ( typeof(type) == 'undefined' ) {
                    rGroup = $(formSelector).find("[name='"+fId.toLowerCase()+"']");
                    size1 = rGroup.length;
                    if ( size1 > 0 ) {
                        type = rGroup[0].type;
                    }
                }
	            try {
	            	$.each(fe, function( index, elm ) {
	            	    type = elm.type;
	  	                if ( type == 'text' || type == 'hidden' || type == 'password' || type == 'select-one' || type == 'textarea'  ) {
	  	                	elm.value =v;
		                } else if (  type == 'radio' || type == 'checkbox' ) {
		                    if ( v ) {
		                        if ( type == 'radio' ) {
	                                if ( elm.value == v ) {
	                                	elm.checked = true;
	                                }
		                        } else if ( type == 'checkbox' ) {
		                        	if ( jQuery.inArray( elm.value, v) > -1) {
		                             	elm.checked = true;
		                        	}
		                        }
		                    }
		                } else if ( type == 'select-multiple' ) {
		                	//TODO SOFTM 미적용.
		                	var options = $(elm).find("OPTION");
		                	$.each(options, function( index, elmOptions ) {
		                		if ( jQuery.inArray( elmOptions.value, v) > -1) {
		                			elm.selected = true;
		                		}
			            	});
		                } else {

		                }
	            	});


	            } catch (e) {
	                //throw new Error(enm + "를 확인해주세요.");
	            }
            }

            if ( setRule && typeof(setRule[fId.toLowerCase()]) == 'function' ) {
            	setRule[fId.toLowerCase()]($(formSelector),v);
            } else {

            }

        }
    } else {
    	//throw new Error("jsonItem not found : " + log(json) );
    }
}

function getCodeValue(params,cb) {
    params = $.isArray(params)?params:[];
    var data = execSync("/codeListInfo.do", "codegrp=" + params.join(","),cb);
    return data;
}

function getCodeValueForZC(params,cb) {
	params = $.isArray(params)?params:[];
   var data = execSync("/zcCodeListInfo.do", "codegrp=" + params.join(","),cb);
	return data;
}

function getCodeValueForIfis(params,cb) {
	params = $.isArray(params)?params:[];
   var data = execSync("/ifisCodeListInfo.do", "codegrp=" + params.join(","),cb);
	return data;
}

function getCurrentDateString() {
	return moment().format("YYYY-MM-DD");
}

function createCombo(selector, codes, label, defaultValue) {
	$(selector).empty();
	if (label) $(selector).append( new Option( label, "" ) );

	$.each(codes,function(k,v) {
		$(selector).append( new Option( v.NAME, v.CODE ) );
	});
	if ( defaultValue ) $(selector).val(defaultValue);
}

function createRadio(selector, codes, name, defaultValue) {
	$(selector).empty();
	$.each(codes,function(k,v) {
		$('<input class="designRadiobutton" type="radio" id="'+name+'_'+(k+1) + '" name="'+name+'" value="' + v.CODE + '" ' + (defaultValue==v.CODE?"checked":"") + '/>'
          +'<label for="'+name+'_'+(k+1) + '" class="add_text" style="padding-right:30px">' + v.NAME + '</label>&nbsp;&nbsp;&nbsp;&nbsp;'
		).appendTo(selector);
	});
	if ( defaultValue )
		$(selector).find('input:radio[name="'+name+'"][value="' + defaultValue + '"]').attr('checked', 'checked');
}

function createCheckbox(selector, codes, name, defaultValues) {
	$(selector).empty();
	$.each(codes,function(k,v) {
		console.info( v.CODE, v.NAME,defaultValues, (jQuery.inArray( v.CODE, defaultValues )>-1?"checked":"") )
		$('<input class="designCheckbox" type="checkbox" id="'+name.replace("\[\]","")+'_'+(k+1) + '" name="'+name+'" value="' + v.CODE + '" '  + (jQuery.inArray( v.CODE, defaultValues)>-1?"checked":"") +  '/>'
				+'<label for="'+name.replace("\[\]","")+'_'+(k+1) + '" class="add_text" style="padding-right:30px">' + v.NAME + '</label>&nbsp;&nbsp;&nbsp;&nbsp;'
		).appendTo(selector);
	});
}

function toast(v,cb) {
	if ( typeof(Android) !== "undefined") {
		Android.showToast(v);
	}
	if ( cb ) cb();
}

function showLoading() {
//	if(isBrowser) {
		$('.mo-ui-layer.progress').show();
// } else {
// 	if ( typeof(Android) !== "undefined") {
// 		Android.showLoading();
// 	}
// }
}

function hideLoading() {
	window.setTimeout(function() {
//		if(isBrowser) {
		    $('.mo-ui-layer.progress').hide();
//		} else {
//			if ( typeof(Android) !== "undefined") {
//			  Android.hideLoading();
//			}
//		}
	},100);
}

function snakBar(s,o){
    snakBarError(o,s);
}

function snakBarError(o,v) {
    if ( typeof o === "object" ) {
        var c = o.closest("dd");
        if ( o[0].tagName.toUpperCase() == "SELECT") {
            o.one( "change", function( event ) {
                fClearError(o);
            });
        } else {
            if ( o[0].tagName.toUpperCase() == "INPUT" || o[0].type.toUpperCase() == "TEXT") {
                if (  o.hasClass("approval") || o.hasClass("phone_number") ) {
                    c = o.closest("div");
                }
                if(o[0].type.toUpperCase() == "RADIO") {
                    o.one( "change", function( event ) {
                        fClearError(o);
                    });
                } else {
                    o.one( "keyup", function( event ) {
                        fClearError(o);
                    });
                }

            } else if ( o[0].tagName.toUpperCase() == "TEXTAREA" ) {
                o.one( "keyup", function( event ) {
                    fClearError(o);
                });
            }
        }
        c.addClass("mo-error");
    } else {
        if (o) {
            v=o;
        }
    }
    $('.mo-ui-snackbar p').text(v);
    if (!v) {
        $('.mo-ui-snackbar').css("display","none");
    } else {
        $('.mo-ui-snackbar').css("display","block");
        $('.mo-ui-snackbar').hide().stop( true, true ).fadeIn(200).show().delay(1500).fadeOut(200);
    }
}

function clearError(o) {
    var c = o.closest("dd");
    try
    {
        if ( o[0].tagName.toUpperCase() == "SELECT") {
        } else {
            if ( o[0].tagName.toUpperCase() == "INPUT" || o[0].type.toUpperCase() == "TEXT") {
                if (  o.hasClass("approval") || o.hasClass("phone_number") ) {
                    c = o.closest("div");
                }
            } else if ( o[0].tagName.toUpperCase() == "TEXTAREA" ) {
            }
        }
        c.removeClass("mo-error");
    }
    catch (e){
    }
}

/**
 * openOZ("LoanPic");
 * openOZ("SignPic");
 * openOZ("SignDoc");
 */
function openOZ(ozr,params) {
	if(isBrowser) {
		alert("openOZ : " + ozr + " / " + params);
	} else {
		if ( typeof(Android) !== "undefined") {
			Android.openOZ(ozr,params);
		}
	}
}

function callForNative(json) {
	var info = JSON.parse(json);
	//info.result;
//	http://localhost:8080/loanListView.do?statgroup=con&lnbSeq=1
//	http://localhost:8080/loanListView.do?statgroup=loan&lnbSeq=2
//	http://localhost:8080/loanListView.do?statgroup=sign&lnbSeq=3
	if ( info.gubun == "LoanPic" ) {
		goUrl("/loanListView.do?statgroup=con&lnbSeq=1");
	} else if ( info.gubun == "SignDoc" ) {
		document.location.replace(document.location.href);
	} else if ( info.gubun == "SignPic" ) {
		goUrl("/loanListView.do?statgroup=sign&lnbSeq=3"); // 여신거래약정
	}

}

function loadBasicInformation() {
	var info = {};
	if ( typeof(Android) !== "undefined") {
		info = JSON.parse(Android.getBasicInformation());
	} else {
		info.macAddress = "F4:42:8F:45:2A:E1";
	}
    window.INFO.MAC_ADDRESS = info.macAddress;
}

jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
};

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

function logout() {
	window.sessionStorage.setObject("_MFO",{});
    exec("/logoutProc.do", "",function(data) {
        if ( data.RESULT_CD == RESULT_CD.OK ) {
        	goUrl("/loginView.do?relogin");
        } else {
        }
    });
}

function goUrl(url) {
//	document.location.replace(url);
	var lnbSeq = 1;
	try{
		lnbSeq = window.localStorage.getItem("lnbSeq")?window.localStorage.getItem("lnbSeq"):1;
	} catch(e) {
		alert(e.toString())
	}

    var params = getParametersJson(url);
    if ( params["lnbSeq"] ) {
        lnbSeq = params["lnbSeq"];
        url = removeParameter(url,"lnbSeq");
    }

	document.location.href = url + (url.indexOf("?")>-1?"&":"?")+"lnbSeq="+lnbSeq;
}

function setMemberInfo(mNo) {
	var data = execSync("/memberInfo.do", "member_no="+mNo,function(data) {
	});
	data.MEMBER_NO = mNo;
    window.sessionStorage.setObject("_MFO",data);
}

function getMemberInfo() {
	return window.sessionStorage.getObject("_MFO");
}

function formatDate(v) {
	if ( moment(v,"YYYY.MM.DD").isValid() ) {
		return moment(v,"YYYY.MM.DD").format("YYYY-MM-DD");
	} else {
		return "-";
	}
}

function formatNumber(v,f) {
	try {
		v = typeof v == "number"?""+v:v;
		f = f?f:v.split(".").length > 1?v.split(".")[1].length:0;
		var vv = jQuery.number(v,f);
		return vv.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
	} catch(e) {
		return v;
	}
}
var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    iOSApp: function() {
    	return navigator.userAgent.match(/myApp/i) ? true : false;
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
        return (isMobile.Android() + isMobile.BlackBerry() + isMobile.iOS() + isMobile.Windows());
    }
};

var userAgent = navigator.userAgent.toLowerCase(),
	isIOS = 0 < userAgent.indexOf("iphone") || 0 < userAgent.indexOf("ipad"),
	isAndroid = 0 < userAgent.indexOf("android"),
	isBrowser = !isIOS && !isAndroid
;
if ( !isBrowser ) {
	isBrowser = 0 < userAgent.indexOf("android 5.0");
}

var Util = {
    Browser:{
        version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
        safari: /webkit/.test( userAgent ),
        opera: /opera/.test( userAgent ),
        msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
        mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
    }
};

var Effect= {
    TWINKLE_INTERVAL:150,
    TWINKLE_OBJECT:{},
    DEFAULT_INFO:{cssText:'background-color:#fbffff;border:1px dotted red',during:700,interval_time:230,callback:function(){}},
    clearTwinkle:function(oId,cb) {
        if ( Effect.TWINKLE_OBJECT[oId] ) Effect.TWINKLE_OBJECT[oId].playing = false;
        //Effect.TWINKLE_OBJECT[oId] = null;
        var eFo = Effect.TWINKLE_OBJECT[oId];
        eFo.object.style.cssText = eFo.cssText;
        clearInterval(eFo.interval);
        if ( typeof cb == "function" ) cb();
    },
    /* using
Effect.twinkle($('part_msg' ),{cssText:'background-color:#BFE2FF;border:5px dotted #99CCCC;color:black',during:0,interval_time:1000,callback:function(){}});
     */
    twinkle:function(o,i,opt) {
        var execCnt = 0;
        var oId = '';
        if ( o.id ) {
            oId = o.id;
        } else {
            var oN = $("[name='"+o.name+"']");
            if ( oN.length == 1 ) {
                //o = oN[0];
                oId = o.name;
            } else {
                for( var ii=0;ii<oN.length;ii++){
                    if ( o == oN[ii]) {
                        o = oN[ii];
                        oId = o.name + '_' + ii;
                        break;
                    }
                }
            }
        }
        //log(oId);
        if ( o ) {
            var cssText = o.style.cssText;
            var eFo = null;
            if ( !Effect.TWINKLE_OBJECT[oId] ){
                Effect.TWINKLE_OBJECT[oId] = {};
                eFo = Effect.TWINKLE_OBJECT[oId];
                eFo.interval = null;
                eFo.object   = o;
                eFo.execCnt  = 0;
                eFo.infor    = i = !i?this.DEFAULT_INFO:i;
                eFo.cssText  = o.style.cssText;
                eFo.playing  = false;
                eFo.id       = oId;
            } else {
                eFo = Effect.TWINKLE_OBJECT[oId];
            }
            //log(eFo);
            if ( !eFo.playing ) {
                eFo.playing = true;
                function start(eFo) {
                    //eFo = Effect.TWINKLE_OBJECT[oId];
                    //log(eFo);
                    //alert(eFo);
                    var it = eFo.infor.interval_time?eFo.infor.interval_time:Effect.TWINKLE_INTERVAL;
                    if ( eFo.playing && eFo.infor.during == 0 || eFo.execCnt * it < eFo.infor.during ) {
                        if ( eFo.execCnt % 2 == 0 ) {
                            eFo.object.style.cssText = eFo.cssText + ';' + eFo.infor.cssText;
                        } else {
                            eFo.object.style.cssText = eFo.cssText;
                        }
                        eFo.execCnt++;

                    } else {
                        //alert('clear : ' + eFo.id );
                        eFo.object.style.cssText = eFo.cssText;
                        if (typeof(eFo.infor.callback) === 'function') {
                            eFo.infor.callback();
                        }
                        //Effect.TWINKLE_OBJECT[eFo.oId]
                        clearInterval(eFo.interval);
                        Effect.clearTwinkle(eFo.id);
                        delete Effect.TWINKLE_OBJECT[oId];
                    }
                }
                if (eFo.infor.focus) o.focus();
                if ( Util.Browser.mozilla ) {
                    eFo.interval = setInterval(start,
                            eFo.infor.interval_time?eFo.infor.interval_time:Effect.TWINKLE_INTERVAL,
                                    eFo
                    );
                } else {
                    eFo.interval = setInterval(
                            function(){
                                start(eFo);
                            },
                            eFo.infor.interval_time?eFo.infor.interval_time:Effect.TWINKLE_INTERVAL
                    );
                }
            }
        }
        return o;
    }
}

/**
 * # Using - script
 *   validate( $('#lForm') ,{rules:{name:boolean},message:{name:boolean}}{
 *       user_id:function(){ Effect.twinkle($('#lForm')[0].user_id);},
 *       passwd:function(){ Effect.twinkle($('#lForm')[0].passwd);},
 *   });
 *
 * # Using - html
 * <input type="text" name="user_id" size="20" style="width:200px" value="" class="required trim focus email alert" maxlength=100 minlength=0 message="ID를 이메일 주소로 입력하세요."/>
 *
 * <input type="password" name="passwd" style="width:200px" size="20" maxlength="25" class="required focus "/>
 *
 * <input type="radio" name="rdo_user_id" value="Y" class="required focus">
 * <input type="radio" name="rdo_user_id" value="N" class="required focus">
 *
 * <input type="checkbox" name="chk_user_id" value="Y" class="required focus">
 *
 * <select name=test_select_one class="required focus">
 *  <option value=''>없음</option>
 *  <option value=1>1</option>
 *  <option value=2>2</option>
 * </select>
 *
 * <select name=test_select_multiy class="required focus" multiple="multiple">
 *   <option value=''>없음</option>
 *   <option value=1>1</option>
 *   <option value=2>2</option>
 * </select>
 *
 * # jquery validator 참고
	jQuery.extend(jQuery.validator.messages, {
	    required: "This field is required.",
	    remote: "Please fix this field.",
	    email: "Please enter a valid email address.",
	    url: "Please enter a valid URL.",
	    date: "Please enter a valid date.",
	    dateISO: "Please enter a valid date (ISO).",
	    number: "Please enter a valid number.",
	    digits: "Please enter only digits.",
	    creditcard: "Please enter a valid credit card number.",
	    equalTo: "Please enter the same value again.",
	    accept: "Please enter a value with a valid extension.",
	    maxlength: jQuery.validator.format("Please enter no more than {0} characters."),
	    minlength: jQuery.validator.format("Please enter at least {0} characters."),
	    rangelength: jQuery.validator.format("Please enter a value between {0} and {1} characters long."),
	    range: jQuery.validator.format("Please enter a value between {0} and {1}."),
	    max: jQuery.validator.format("Please enter a value less than or equal to {0}."),
	    min: jQuery.validator.format("Please enter a value greater than or equal to {0}.")
	});
 */
 function validate (formSelector,settings,callback) {
	 var rules    = settings.rules?settings.rules:{};
	 var messages = settings.messages?settings.messages:{};

	 var forms =  $(formSelector);
	 if ( forms.length == 0 ) return;
	 var form = forms[0];
     var size = form.elements.length;
     var alert = $(form).hasClass("alert")||rules.alert||form.getAttribute("alert")!=null?true:false;
     var focus = $(form).hasClass("focus")||rules.focus||form.getAttribute("focus")!=null?true:false;
     var isvalid = true;
     var isChecked = {};
     var type;
     var elm,enm;
     for (var i = 0; i < size; i++) {
         elm = form[i];
         enm = elm.name;
         var rule = rules && rules[enm]?rules[enm]:{};
         // maxlength=10 minlength=1 message="Please enter the ID"
         var maxlength = elm.getAttribute("maxlength")?elm.getAttribute("maxlength"):rule.maxlength || 100000000;
         var minlength = elm.getAttribute("minlength")?elm.getAttribute("minlength"):rule.minlength || 0 ;
         var message   = elm.getAttribute("message")||messages[enm];
         var required = $(elm).hasClass("required")||elm.getAttribute("required")||!!rule.required;
         var numbered = $(elm).hasClass("number")||!!rule.number;
         var emailed  = $(elm).hasClass("email")||!!rule.email;
         var trimed  = $(elm).hasClass("trim")||!!rule.trim;

         var dated = $(elm).hasClass("date")||elm.getAttribute("date")||!!rule.dated;
         	 dated = dated || $(elm).hasClass("dpDate")||elm.getAttribute("dpDate")||!!rule.dpDate;

         if (elm.disabled) continue; // skip disabled element

         focus = focus || $(elm).hasClass("focus")||!!rule.focus||$(elm)[0].getAttribute("focus")!=null?true:false;
         alert = alert || $(elm).hasClass("alert")||!!rule.alert||$(elm)[0].getAttribute("alert")!=null?true:false;
         alert = $(elm).hasClass("nofocus")||!!rule.nofocus||($(elm)[0].getAttribute("nofocus")!=null?true:false)?false:alert;
         alert = $(elm).hasClass("noalert")||!!rule.noalert||($(elm)[0].getAttribute("noalert")!=null?true:false)?false:alert;
         type = elm.type;

         if ( typeof rule.alert    == "function" ) alert    = rule.alert();
         if ( typeof rule.required == "function" ) required = rule.required();
         if ( typeof rule.numbered == "function" ) numbered = rule.numbered();
         if ( typeof rule.emailed  == "function" ) emailed  = rule.emailed();
         if ( typeof rule.trimed   == "function" ) trimed   = rule.trimed();
         if ( typeof rule.dated    == "function" ) dated   = dated.trimed();

         if ( required || numbered || emailed ) {
//                 console.info(elm);
//                 console.info(enm +
//                       "\n type : " + type +
//                       "\n required : " + required +
//                       "\n focus : " + focus +
//                       "\n maxlength : " + maxlength +
//                       "\n message : " + message +
//                       "\n minlength : " + minlength
//                 );
        	 //if ( enm == "person_cost") debugger;
             if ( type == 'textarea' || type == 'text' || type == 'password' || type == 'select-one' || type == 'number' ) {
            	 var v = null;
            	 if ( $(elm).hasClass("amount") ) {
            		 v = $(elm).cleanVal();
            	 } else {
            		 v = trimed? elm.value.trim():elm.value;
            	 }

//                   console.info("v : " + v +
//                           "\n v.length : " + ( typeof( v.length) != 'undefined'? v.length:'없음'  )
//                   );


                 if ( ( type == 'textarea' || type == 'text' || type == 'password' ) && v && numbered && isNaN(v) ) {
                     isvalid = false;
                     break;
                 } else {
                     if ( required ) {
                         if ( !v || v.length > maxlength || v.length < minlength ) {
                             isvalid = false;
                             break;
                         }
                     }
                 }

                 if ( v && emailed ) {
                     if ( !isEmail(v) ) {
                         isvalid = false;
                         break;
                     }
                 }
                 if ( v && dated ) {
                     if ( !isDate(v) ) {
                         isvalid = false;
                         break;
                     }
                 }

             } else if ( type == 'select-multiple' ) {
                 var isSelected = false;
                 var size1 = elm.options.length;
                 for (var j = 0; j < size1; j++) {
                     if ( elm.options[j].selected ) {
                         isSelected = true;
                         break;
                     }
                 }
                 if ( !isSelected ) {
                     isvalid = false;
                     break;
                 }
             } else if (  type == 'radio' || type == 'checkbox' ) {
                 //var group = document.getElementsByName(enm);
                 var group = $(form).find("[name='"+enm+"']");
                 //alert(isChecked[enm] );
                 if (!isChecked[enm] ) {
                     isChecked[enm] = true;
                     var ischecked = false;
                     var size1 = group.length;
                     for (var j = 0; j < size1; j++) {
                         if ( group[j].checked ) {
                        	 ischecked = true;
                             break;
                         }
                     }
                     if ( !ischecked ) {
                         isvalid = false;
                         break;
                     }
                 }
             } else {

             }
         }
     }
     if ( !isvalid ) {
         if ( alert ) {
        	 var msg =$(elm).parent().prev().text().trim()||enm;
        	 message = message?message:formatMessage( "{0}"+josa(msg)+" 확인해주세요.", [msg]);
        	 if ( message ) window.alert(message);
         }
         if ( focus ) elm.focus();
         if ( typeof(callback) == 'object' && typeof(callback[enm]) == 'function' ) callback[enm](elm);
         //else Effect.twinkle(type=="radio"?$(elm).parent()[0]:elm);
     }
     console.info("validate->" + isvalid + (form?" / " + form.name:"") + (elm?"." + enm:"") );
     return isvalid;
}

function formatMessage( source, params ) {
		if ( arguments.length === 1 ) {
			return function() {
				var args = $.makeArray( arguments );
				args.unshift( source );
				return $.validator.format.apply( this, args );
			};
		}
		if ( params === undefined ) {
			return source;
		}
		if ( arguments.length > 2 && params.constructor !== Array  ) {
			params = $.makeArray( arguments ).slice( 1 );
		}
		if ( params.constructor !== Array ) {
			params = [ params ];
		}
		$.each( params, function( i, n ) {
			source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
				return n;
			} );
		} );
		return source;
};

// http://m.blog.naver.com/andreas84/130098312646
function josa(label) {
	 var strGA = 44032; //가
	 var strHI = 55203; //힣
	 var lastStrCode = label.charCodeAt(label.length-1);
	 var prop=true;
	 var msg;
	 if(lastStrCode < strGA || lastStrCode > strHI) {
		 //return false; //한글이 아님
		 return '을'; //한글이 아님
	 }
	 if (( lastStrCode - strGA ) % 28 == 0) prop = false;
	 if(prop) {
	  return '을';
	 }
	 else {
		 return '를';
	 }
}

function removeParameter(params,n) {
    //var params = "a=11111111111111&bccd=2&c=3";
    //var n = 'a';
  //var regexp = new RegExp("([\\?\\&]|^)"+n+"=[^&]*", "gi");
    var regexp = new RegExp("([\\?\\&]|^)"+n+"=[^&]*", "g");
    params = params.replace(regexp,"");
    return ( params.charAt(0) == '?' || params.charAt(0) == '&'?params.substring(1):params);
}

function getParametersJson(url) {
    // 파라미터가 담길 배열
    var param = new Array();
    url = decodeURIComponent(url);

    var params;
    // url에서 '?' 문자 이후의 파라미터 문자열까지 자르기
    params = url.substring( url.indexOf('?')+1, url.length );
    // 파라미터 구분자("&") 로 분리
    params = params.split("&");

    // params 배열을 다시 "=" 구분자로 분리하여 param 배열에 key = value 로 담는다.
    var size = params.length;
    var key, value;
    for(var i=0 ; i < size ; i++) {
        key = params[i].split("=")[0];
        value = params[i].split("=")[1];

        param[key] = value;
    }

    return param;
}
// --

// not used -------
function backKeyToFinish() {
    if ( typeof window.backKeyPressed === "undefined" ) {
        window.backKeyPressed = -1; // -1,0,1
    }
    if (window.backKeyPressed == -1) {
        window.backKeyPressed = 0;
            snakBarError("'뒤로' 버튼을 한 번 더 누르시면 종료됩니다.");
    } else if (backKeyPressed == 0) {
        window.backKeyPressed = 1;
    }

    if ( window.backKeyPressed == 1) {
        (isBrowser || (co.Common.dispose(), MDHUtil.Browser.terminateApp()))
    } else {
        window.setTimeout(function() {
            window.backKeyPressed = -1;
        },2000);
    }
}

function formElementChanged() {
    $( ":text, textarea, select" ).unbind("change").bind( "change", function( event ) {
        var o = $(this);

        for (var i=0;i<o.length;i++) {
            console.info ( o[i] );
            var ph = $(o[i]).attr("placeholder");
            var rph = $(o[i]).attr("restore_placeholder");
            console.info ( o[i].tagName, ph,rph );

            if ( o[i].tagName.toLowerCase() == "textarea" ) {
                if ( ph || rph ) {
                    if ($(o[i]).val()) {
                        $(o[i]).removeAttr("placeholder");
                        $(o[i]).attr("restore_placeholder",ph);
                    } else {
                        $(o[i]).removeAttr("restore_placeholder");
                        $(o[i]).attr("placeholder",rph);
                    }
                }
            } else if ( o[i].tagName.toLowerCase() == "select" ) {
                var v = $(o[i]).val();
                console.info($(o[i]).val());
                if ( v && v != "선택하세요." && v != "선택하세요" ) {
                    $(o[i]).addClass("greypoint");
                } else {
                    $(o[i]).removeClass("greypoint");
                }
            }
        }
    });
}

function resizeContent() {
    var windowHeight = $(window).height();
    var topHeight = $("#top").height();
    $('.mo-layout-content').css({'height':(windowHeight-57)+'px'});
}

//$(window).resize(function() {
//    resizeContent();
//});

function endScoll(o) {
//  $('body').animate({scrollTop : $("body")[0].scrollHeight}, 1000);
  var a = o?o:$('body');
  a.animate({scrollTop : a[0].scrollHeight}, 1000);
}

function bindTopButton(){
  $(".mo-btn-top").unbind("click").bind("click",function(e) {
      $("body").scrollTop(0);
  });

  $(".mo-btn-top").hide();
  $( window ).scroll(function() {
      if( $("body").scrollTop() == 0 ) {
          $(".mo-btn-top").hide();
      } else {
          if (!$(".mo-btn-top").is(":visible")) {
              $(".mo-btn-top").hide().stop( true, true ).fadeIn(1000).show();
          }
      }
  });
}
//------- not used
/* softm added
jQuery.fn.extend({
	  focus: function() {
		    return this.each(function() {
			      //this.checked = true;
		    	//console.info(this);
		    	this.focus();
		    	$("#contents").scrollTop($(this).offset().top);
			});
	  }
});
*/


/* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu / bar icon */
function myFunction() {
		var x = document.getElementById("myLinks");
		if (x.style.display === "block") {
				x.style.display = "none";
		} else {
				x.style.display = "block";
		}
}

function swAlert(title,callback) {
	swal({
		text: title,
		icon: "info",
//                buttons: true,
//                dangerMode: false,
	})
	.then((rtn) => {
			if( callback ) callback();
	});
}

function swConfirm(title,okCallback,cancelCallback) {
	swal({
		text: title,
		icon: "info",
    buttons: true
//                dangerMode: false,
	})
	.then((rtn) => {
		if (rtn) {
			if( okCallback ) okCallback();
		} else {
			if( cancelCallback ) cancelCallback();
		}
	});
}
