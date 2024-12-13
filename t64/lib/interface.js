var CommonUtil = new CommonUtil();

/**
 * 앱/브라우저 확인
 */
function CommonUtil(){
	this.fn_IS_APP = function() {
		var phoneOS = "";
    	var agent = navigator.userAgent;
		if(agent){	
			if((agent.match(/COMPANY=softm;/i))){
				if(agent.match(/IOS/i) || agent.match(/iPhone/i)){	// iOS
			 		phoneOS = "I";	
			 	}				
				else if(agent.match(/ANDROID/i)){	// Android
					phoneOS = "A";
				}
			}
			else{
				if(agent.match(/iPhone/i) || agent.match(/iPod/i)){
					// iOS mobile
					phoneOS = "MI";
				} else if(agent.match(/Android/i)){
					// Android mobile
					phoneOS = "MA";
				} else if( agent.match(/BlackBerry/i) ||
				   agent.match(/Windows CE/i) || agent.match(/SAMSUNG/i) ||
				   agent.match(/LG/i) || agent.match(/MOT/i) ||
				   agent.match(/SonyEricsson/i)){	
			 		phoneOS = "M";	
			 	}else{
					phoneOS = "X";
				}
				
			}
		}
		return phoneOS;
	};

	this.fn_IS_WEB = function(){
		if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    	return false;
	    }else{
	    	return true;
	    }		
	};
	
	this.fn_APP_KIT_FLAG = function() {
		var appleWebKit = false;
    	var agent = navigator.userAgent;
		if(agent){	
			if((agent.match(/COMPANY=lottecap;/i))){
				if(agent.match(/ANDROID/i)){	// Android
					if(agent.match(/AppleWebKit=534.30;/i)){
						appleWebKit  = true;
					}
				}
			}
		}
		return appleWebKit;
	};
	
	this.is_PC = function(){
    	var agent = navigator.userAgent;
		if(agent){
			if((agent.match(/Mobile/i))){
				return false;
			}else if((agent.match(/Android/i))){
				return false;
			}else if((agent.match(/COMPANY=lottecap;/i))){
				return false;
			}else{
				return true;
			}
		}else{
			return true;
		}
	};
	
	this.convertTelecomType = function(type){
		var returnValue = "";
		switch(type){
			case 	"SKT" : returnValue = "SKT"; break;
			case 	"KTF" : returnValue = "KT"; break;
			case 	"LGT" : returnValue = "LG"; break;
			case 	"SKM" : returnValue = "SKM"; break;
			case 	"KTM" : returnValue = "KTM"; break;
			case 	"LGM" : returnValue = "LGM"; break;
			case 	"" : returnValue = ""; break;
		}
		return returnValue;
	};
	
	this.getHtmlName = function(){
		var docName = location.href;
		var splitNm = docName.split('/');
		return splitNm[splitNm.length -1];
	};
	
	this.CloseWin = function(){
		parent.window.open('about:blank','_self').close();
	};
	
	this.MaskkAst = function (len){
		var retVal = "";
		for(var i=0;i<len;i++){
			retVal = retVal + "*";
		}
		return retVal;
	};
};

/**
 * Android 네이티브 함수를 호출
 * @param arg JSON
 */
function fn_Js_Bridge(arg) {
	var jsonString = (JSON.stringify(arg));
	var phoneOS  = CommonUtil.fn_IS_APP();
	if("I" == phoneOS){
        var escapedJsonParameters = encodeURI(jsonString);
		window.location = "appBridge://?"+escapedJsonParameters;
	}else if("A" == phoneOS){
		window.callApp.appBridge(jsonString);
	}
}

/**
 * API 100 : 알림팝업(수정 2016.03.23)
 *
 * @param title			제목
 * @param msg 			메시지 내용
 * @param callBackFunc 	콜백 함수명
 *
 * @corrector  SeongEun.Yang
 * @date 2016. 02. 23.
 */
var AlertUtil = new AlertUtil();

function AlertUtil() {
	this.fn_Alert = function() {
		if(arguments.length == 1){
			this.fn_AlertMsg("알림",arguments[0], "");
		}else if(arguments.length == 2){
			this.fn_AlertMsg("알림", arguments[0], arguments[1]);
		}else if(arguments.length == 3){
			this.fn_AlertMsg(arguments[0], arguments[1], arguments[2]);
		}else{
			this.fn_AlertMsg("", "", "");
		}
	};

	this.fn_AlertMsg = function(title, msg, callBackFunc) {
		var result = { "header":{ "api":"100" }, "body":{ "title":title, "msg":msg, "callBackFunc":callBackFunc} };
	    if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    	fn_Js_Bridge(result);
	    }else{
	    	alert(msg);
	    	if(callBackFunc != ""){
	    		return eval(callBackFunc + "()");
	    	}else{
	    		return;
	    	}
	    }
	};
};

/**
 * API 001 : 시작 - 실행
 */
function fn_StartService(callBackFunc) {
	var result = { "header":{ "api":"1" }, "body":{ "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		debugger;
		 eval(callBackFunc + "('')");
	 }
}

/**
 * API 002 : 정지 - 실행
 */
function fn_StopService(callBackFunc) {
	var result = { "header":{ "api":"2" }, "body":{ "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		debugger;
		 eval(callBackFunc + "('')");
	 }
}

/**
 * API 003 : Settings Start
 */
function fn_StartSetting(grant,callBackFunc) {
	var result = { "header":{ "api":"3" }, "body":{ "grant":grant, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('')");
	 }
}

/**
 * API 123 : Check Permission
 */
function fn_CheckPermission(grant,callBackFunc) {
	var result = { "header":{ "api":"123" }, "body":{ "grant":grant, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('')");
	 }
}

/**
 * API 004 : 권한
 */ 
function fn_CheckGrant(grant,callBackFunc) {
	var result = { "header":{ "api":"4" }, "body":{ "grant":grant, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		let granted = "none";
		// if ( grant === "notification_access" ) granted = "ok";
		// if ( grant === "overlay" ) granted = "ok";
		//   if ( grant === "location" ) granted = "ok";
		 //|| grant === "usagestats" || grant === "lion" )
		 eval(callBackFunc + "('" + grant + "','" + granted + "')");
	 }   
}
 
///**
// * API 005 : GPS 위치
// */
//function fn_GetLocation(callBackFunc) {
//	var result = { "header":{ "api":"5" }, "body":{ "callBackFunc":callBackFunc } };
//	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
//		 fn_Js_Bridge(result);
//	 }else{
//		 eval(callBackFunc + "('')");
//	 }
//}


/**
 * API 005 : GPS 위치
 */
function fn_GetLocation(mapVar,callBackFunc) {
	var result = { "header":{ "api":"5" }, "body":{"mapVar":mapVar, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + mapVar + "')");
	 }
}


/**
 * API 005 : GPS 위치
 */
function fn_GetLocation2(mapVar,callBackFunc) {
	var result = { "header":{ "api":"5" }, "body":{"mapVar":mapVar, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + mapVar + "')");
	 }
}


/**
 * API 006 : 안내 시작
 */
function fn_StartNavi(name,lat,lon,callBackFunc) {
	var result = { "header":{ "api":"6" }, "body":{ "callBackFunc":callBackFunc,"name":name,"lat":lat,"lon":lon } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 if( callBackFunc ) eval(callBackFunc + "('')");
	 }
}


/**
 * API 109 : 키보드 보이기
 */
function fn_ShowKeyboard(callBackFunc) {
	var result = { "header":{ "api":"108" }, "body":{ "visible":"Y" } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 if( callBackFunc ) eval(callBackFunc + "('')");
	 }
}

/**
 * API 109 : 키보드 숨기기
 */
function fn_HideKeyboard(callBackFunc) {
	var result = { "header":{ "api":"108" }, "body":{ "visible":"N" } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 if( callBackFunc ) eval(callBackFunc + "('')");
	 }
}


/**
 * API 007 : 안내 시작 - NaviDestination
 */
function fn_StartNaviDestination(destination,callBackFunc) {
	var result = { "header":{ "api":"7" }, "body":{ "callBackFunc":callBackFunc,"destination":destination} };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 if( callBackFunc ) eval(callBackFunc + "('')");
	 }
}

/**
 * API 101 : Confirm(확인) 팝업
 *
 * @param title  		팝업 타이틀
 * @param msg    		팝업 메세지
 * @param callBackFunc 	OK 버튼을 눌렀을 때, 콜백 함수명
 * @param okBtn  		OK 버튼명
 * @param cancelBtn 	cancel 버튼명
 *
 * @corrector  SeongEun.Yang
 * @date 2016. 02. 23.
 */
function fn_Confirm(title, msg, callBackFunc, okBtn, cancelBtn) {
	var result = { "header":{ "api":"101" }, "body":{ "title":title, "msg":msg, "callBackFunc":callBackFunc, "okBtn":okBtn, "cancelBtn":cancelBtn} };
	document.body.focus();
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
	    result = confirm(msg);
	    if (result) {
	        eval(callBackFunc + "()");
	    }else{

	    }
	}
}

/**
 * API 102 : 토스트 메시지창
 *
 * @param msg    		팝업 메세지
 *
 * @corrector  SeongEun.Yang
 * @date 2016. 03. 23.
 */
function fn_Toast(msg) {

	var result = { "header":{ "api":"102" }, "body":{ "msg":msg } };
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		alert(msg);
	}
}

/**
 * API 103 : 네이티브 팝업호출
 *
 * @param url    		호출 URL
 * @param title    		팝업 타이틀
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_OpenPop(url, callBackFunc) {
	var result = { "header":{ "api":"103" }, "body":{ "url":url, "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
//	remaining = timeIni;
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		window.open(url,'소프트엠');
	}
}

/**
 * API 110 : goMain : onCreate
 *
 * @param restart 서비스 재시작
 */
function fn_GoMain(restart) {
	var result = { "header":{ "api":"110" }, "body":{ "restart":JSON.stringify(restart) } };
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	} else {
		document.location.href="index.html";
	}
}

/**
 * API 400 : 네이티브 url webview.loadUrl
 *
 * @param url    		호출 URL
 * @param title    		팝업 타이틀
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_OpenUrl(url, callBackFunc) {
	var result = { "header":{ "api":"400" }, "body":{ "url":url, "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
//	remaining = timeIni;

	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		window.open(url,'소프트엠');
	}
}

/**
 * API 401 : 네이티브 url webview.reload
 *
 * @param url    		호출 URL
 * @param title    		팝업 타이틀
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_Reload(reload, callBackFunc) {
	var result = { "header":{ "api":"401" }, "body":{ "reload":reload?true:false, "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
//	remaining = timeIni;
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		location.reload();
		//window.open(url,'소프트엠');
	}
}

/**
 * API 402 : 네이티브 url webview.reload
 *
 * @param url    		호출 URL
 * @param title    		팝업 타이틀
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_CopyClipboard(copy, callBackFunc) {
	var result = { "header":{ "api":"402" }, "body":{ "copy":copy, "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		var tempElem = document.createElement('textarea');
		tempElem.value = copy;  
		document.body.appendChild(tempElem);
	  
		tempElem.select();
		document.execCommand("copy");
		document.body.removeChild(tempElem);
	}
}



/**
 * API 104 : 네이티브 팝업호출(전송 데이터 포함)
 *
 * @param url    		호출 URL
 * @param title    		팝업 타이틀
 * @param jsonData      팝업에 보내는 데이터
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_OpenPopData(url, title, jsonData, callBackFunc) {
	var result = { "header":{ "api":"104" }, "body":{ "url":url, "title":title, "jsonData":jsonData, "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
//	remaining = timeIni;
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		alert("웹에서 접근할 수 없는 기능입니다.");
	}
}

/**
 * API 105 : 팝업닫기 또는 메인함수 호출
 *
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_ClosePop(callBackFunc) {

	var result = { "header":{ "api":"105" }, "body":{ "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
//	remaining = timeIni;

	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		alert("웹에서 접근할 수 없는 기능입니다.");
	}
}

/**
 * API 106 : 팝업닫기 또는 메인함수에 데이터 전송
 *
 * @param jsonData      콜백 함수에 데이터 전달
 * @param callBackFunc  콜백 함수명
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_ClosePopData(jsonData, callBackFunc) {
	var result = { "header":{ "api":"106" }, "body":{ "jsonData":jsonData, "callBackFunc":callBackFunc } };
	//로그인 초시계 초기화처리
//	remaining = timeIni;

	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
		if(callBackFunc != ""){
			if(jsonData == ""){
				$(opener.location).attr("href", "javascript:"+callBackFunc+"();");
			}else{
				$(opener.location).attr("href", "javascript:"+callBackFunc+"('"+JSON.stringify(jsonData)+"');");
			}
		}
		CommonUtil.CloseWin();
	}
}

/**
 * API 107 : 네이티브 모바일웹 오픈
 *
 * @param url  		호출 주소
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 06.
 */
function fn_OutsideSite(url) {

	var result = { "header":{ "api":"107" }, "body":{ "url":url} };

	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
	    fn_Js_Bridge(result);
	}else{
	    result = confirm(msg);
	    if (result) {
	        eval(callBackFunc + "()");
	    }else{

	    }
	}
}

/**
 * API 109 : 보안 키패드(2016.03.09 수정)
 *
 *1: 키보드타입                예)4
 *  mTK_TYPE_KEYPAD_NUMBER = 4;         - 넘버키패드
 *  mTK_TYPE_KEYPAD_QWERTY_LOWER = 5;   - 혼합소문자
 *  mTK_TYPE_KEYPAD_QWERTY_UPPER = 6;   - 혼합대문자
 *  mTK_TYPE_KEYPAD_ABCD_LOWER = 7;     - 영문소문자
 *  mTK_TYPE_KEYPAD_ABCD_UPPER = 8;     - 영문대문자
 *  mTK_TYPE_KEYPAD_SYMBOL = 9;         - 특수문자
 *2: 키보드 입력타입          예)2
 *  mTK_TYPE_TEXT_PASSWORD              = 1;
 *  mTK_TYPE_TEXT_PASSWORD_EX           = 2;
 *  mTK_TYPE_TEXT_PASSWORD_IMAGE        = 3;
 *  mTK_TYPE_TEXT_PASSWORD_LAST_IMAGE   = 4;
 *3: 보안키패드 타이틀       예)공인인증 비밀번호
 *4: textView 힌드문자      예)숫자4자 입력하세요
 *5: 입력최대숫자             예)10
 *6: 입력최대문자             예)최대 글자 10자를 입력하셨습니다.
 *7: 입력최소숫자             예)2
 *8: 입력최소문자             예)최대 글자 10자를 입력하셨습니다
 *
 * @corrector  SukGang.Jang
 * @date 2016. 06. 29.
 */
function fn_KeyPadCall(keyPadType,textType,label,hint,maxLength,maxLengthMessage,minLength,minLengthMessage,callBackFunc){
	 var result = { "header":{ "api":"109" } ,
			 		"body":{ "keyPadType":keyPadType, "textType":textType, "label":label, "hint":hint, "maxLength":maxLength,
			 				 "maxLengthMessage":maxLengthMessage, "minLength":minLength, "minLengthMessage":minLengthMessage,
			 				 "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 alert("웹에서 접근할 수 없는 기능입니다.");
	 }
}

/**
 * API 114 : 기타증빙서류 사진촬영
 *
 * @param imgEncIndex   이미지 암호키 인텍스
 * @param imgEncKey     이미지 암호화키
 * @param cusNo         고객번호
 * @param type          주민증록증(1), 운전면허(2), 기타증빙(3)
 * @param callBackFunc  콜백 호출 주소
 * @param urlPath       이미지 전송주소 주소 (OCR과 같음)
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_CameraCall(cusNo, type, urlPath, callBackFunc) {
	var result = { "header":{ "api":"114" }, "body":{ "cusNo":cusNo, "type":type, "urlPath":urlPath, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 alert("웹에서 접근할 수 없는 기능입니다.");
	 }
}

/**
 * API 115 : 프로그래스 on
 *
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 06.
 */
function fn_Progress_Show() {
	var result = { "header":{ "api":"115" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 //alert(JSON.stringify(result));
//		 loading('open');
	    $('.mo-ui-layer.progress').show();
	 }
}

/**
 * API 116 : 프로그래스 off
 *
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 06.
 */
function fn_Progress_Hide() {
	var result = { "header":{ "api":"116" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 //alert(JSON.stringify(result));
	    $('.mo-ui-layer.progress').hide();
//		 loading('close');
	 }

}

/**
 * API 500 : stop overlay
 *
 * @date 2016. 07. 06.
 */
function fn_StopOverlay() {
	var result = { "header":{ "api":"500" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 //alert(JSON.stringify(result));
	    // $('.mo-ui-layer.progress').hide();
//		 loading('close');
	 }

}

/**
 * API 501 : hide overlay
 *
 * @date 2016. 07. 06.
 */
function fn_HideOverlay() {
	var result = { "header":{ "api":"501" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 //alert(JSON.stringify(result));
	    // $('.mo-ui-layer.progress').hide();
//		 loading('close');
	 }

}

/**
 * API 501 : hide overlay
 *
 * @date 2016. 07. 06.
 */
function fn_HideOverlay() {
	var result = { "header":{ "api":"501" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 //alert(JSON.stringify(result));
	    // $('.mo-ui-layer.progress').hide();
//		 loading('close');
	 }

}
/**
 * API 502 : show overlay
 *
 * @date 2016. 07. 06.
 */
function fn_ShowOverlay() {
	var result = { "header":{ "api":"502" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 //alert(JSON.stringify(result));
	    // $('.mo-ui-layer.progress').hide();
//		 loading('close');
	 }

}

/**
 * API 117 : 타이머 프로그래스 on
 *
 * @param time  프로그래스바 오픈시간(1=1초)
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_TimerProgress_Show(time) {
	var result = { "header":{ "api":"117" }, "body":{ "time":time } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 alert("웹에서 접근할 수 없는 기능입니다.");
	 }

}

/**
 * API 118 : 타이머 프로그래스 off
 *
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 06.
 */
function fn_TimerProgress_Hide() {
	var result = { "header":{ "api":"118" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 alert("웹에서 접근할 수 없는 기능입니다.");
	 }

}

/**
 * API 119 : 앱강제 종료
 *
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 06.
 */
function fn_AppClose() {
	var result = { "header":{ "api":"119" } };

	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 CommonUtil.CloseWin();
	 }

}

/**
 * API 120 : 네이티브에 데이터 저장
 *
 * @param key     저장할 데이터 키값
 * @param value   저장 데이터
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_DeviceSaveData(key, value, callBackFunc) {
	var result = { "header":{ "api":"120" }, "body":{ "key":key, "value":value, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
//		 alert("웹에서 접근할 수 없는 기능입니다.");
		localStorage.setItem(key,value);
		if ( typeof (callBackFunc) !== "undefined" ) {
			eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
		}
	 }
}

/**
 * API 121 : 네이티브에 데이터 불러오기
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 13.
 */
function fn_DeviceLoadData(key, callBackFunc) {
	var result = { "header":{ "api":"121" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 126 : 네이티브 전화걸기
 *
 * @param tel      전화번호
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 07. 26.
 */
function fn_CallPhone(tel) {
	var result = { "header":{ "api":"126" }, "body":{ "tel":tel } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 location.href="tel:"+tel;
	 }
}

/**
 * API 129 : 네이티브에서 back->fore 호출시 로그인 시간 연장
 *
 * @param -
 *
 * @corrector  WooYoung.Yoon
 * @date 2016. 08. 09.
 */
function fn_SessionReload() {
	addSessionTime();
}


/**
 * API 304 : gotoMarket store
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_GotoMarket(key, callBackFunc) {
	var result = { "header":{ "api":"304" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		window.open("https://play.google.com/store/apps/details?id=" + key)
	 }
}


/**
 * API 333 : getPackagesInfo
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_GetPackagesInfo(key, callBackFunc) {
	var result = { "header":{ "api":"333" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 300 : getInfo
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_GetInfo(key, callBackFunc) {
	var result = { "header":{ "api":"300" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}


/**
 * API 301 : getURl
 *
 * @param key     
 *      WEB_STATE ("status.html"),
        WEB_MAIN ("index.html"),
        WEB_PERMISSION ("permission.html"),
        WEB_PERMISSION_GUIDE ("permission_guide.html"),
        WEB_ERROR ("error.html"),
        WEB_VERSION (""),
        WEB_NOTICE (""),
        WEB_APP_IRON (""),
        WEB_GET_ENC_KEY (""),
        GET_CERT_URL (""),
 * @param callBackFunc 
 * @corrector  softm
 * @date 2021. 07. 29.
 */
 function fn_GetURL(key, callBackFunc) {  
	var result = { "header":{ "api":"301" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		fn_Js_Bridge(result);
	}else{
		let url = "";
		if      ( key === "WEB_MAIN" ) url = "index.html";
		else if ( key === "WEB_PERMISSION" ) url = "index.html";
		else if ( key === "WEB_ERROR" ) url = "error.html";
		eval(callBackFunc + "('" + url + "')");
	}
}

/**
 * API 302 : hasPermission
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_GetPermissions(key, callBackFunc) {
	var result = { "header":{ "api":"302" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 305 : getBluetooths
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_getBluetooths(key, callBackFunc) {
	var result = { "header":{ "api":"305" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 306 : getWifis
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_getWifis(key, callBackFunc) {
	var result = { "header":{ "api":"306" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 307 : getSysInfo
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_getSysInfo(key, callBackFunc) {
	var result = { "header":{ "api":"307" }, "body":{ "key":key, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 308 : setSysInfo
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_setSysInfo(key, value, callBackFunc) {
	var result = { "header":{ "api":"308" }, "body":{ "key":key, "value":value, "callBackFunc":callBackFunc } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

/**
 * API 303 : getInstallPackages
 *
 * @param key            불러올 데이터 키값
 * @param callBackFunc   콜백 함수
 *
 */
function fn_getInstallPackages(key, callBackFunc, category=null) {
	var result = { "header":{ "api":"303" }, "body":{ "key":key, "callBackFunc":callBackFunc, "category":category?category:"" } };
	 if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
		 fn_Js_Bridge(result);
	 }else{
		 eval(callBackFunc + "('" + localStorage.getItem(key) + "')");
	 }
}

function fn_BackKeyPressed(v) {
	// fn_ClosePopData();
	// alert(v);
	if (  typeof fn_BackKeyPressedCallBack !== 'undefined' ) {
		fn_BackKeyPressedCallBack();
	} else {
		if ( history.length > 0 ) {
			history.back();
			fn_DeviceSaveData("_OPEN_POPUP", false);
		}
	}
}
