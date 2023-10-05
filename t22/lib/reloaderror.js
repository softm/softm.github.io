Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

var reloadTimes = sessionStorage.getObject("reload_times") || [];
reloadTimes.push((new Date()).getTime());
var reloadLimit = 5;
if ( reloadTimes.length >= reloadLimit ) {
    var intervalSec = (reloadTimes[reloadTimes.length-1] - reloadTimes[reloadTimes.length-reloadLimit]) / 1000;
    console.log("intervalSec", intervalSec, reloadTimes.length, reloadTimes.length-reloadLimit);
    if ( intervalSec <= (reloadLimit+1) ) {
        fn_DeviceSaveData("_NAVI_POPUP_MODE", "0");
        AlertUtil.fn_Alert("실행중 문제가 발행하여, 안내아이콘 설정을 초기화였습니다.업데이트 완료후 다시 설정해주세요.");
        console.log("intervalSec", reloadLimit.length-reloadLimit,"~" ,reloadLimit.length-1);
    } else {
    }
}
sessionStorage.setObject("reload_times",reloadTimes);