/** SOFTM-BILLING-152 START 날짜:20261101 : 배포된 152의 API 701로 Play의 실제 가격·조건 확인 */
var subscriptionState = { paying: false, timer: null };
function billingText(ko, en) {
    var language = window.lng || navigator.language || "en";
    return language.indexOf("ko") === 0 ? ko : en;
}
function billingStatus(message) { $("#billingStatus").text(message); }
function billingAction() {
    var label = subscriptionState.paying
        ? billingText("Google Play 여는 중…", "Opening Google Play…")
        : billingText("가격 및 구독 조건 확인", "View price and subscription terms");
    $("#subscriptionAction, #subscriptionCardAction").text(label);
    $("#btnPayInApp").prop("disabled", subscriptionState.paying);
    $(".box.monthly").attr("aria-disabled", String(subscriptionState.paying));
}
function initSubscription() {
    $("#subscriptionPrice").text(billingText("Google Play에서 확인", "Check in Google Play"));
    $("#subscriptionPhases").text(billingText("최종 확인 전에는 결제되지 않습니다.", "You will not be charged before confirming."));
    $("#subscriptionTerms").text(billingText(
        "가격·결제 주기·무료 체험 적용 여부는 다음 Google Play 화면에서 확인하세요. 구독은 취소하지 않으면 자동 갱신되며 Google Play에서 관리·취소할 수 있습니다.",
        "Review your local price, billing period and any trial eligibility on the next Google Play screen. Subscriptions renew automatically unless cancelled. Manage or cancel in Google Play."));
    billingAction();
}
function releaseSubscriptionButton(message) {
    clearTimeout(subscriptionState.timer);
    subscriptionState.paying = false;
    billingAction();
    billingStatus(message || "");
}
function beginSubscription() {
    if (subscriptionState.paying) return;
    subscriptionState.paying = true;
    billingAction();
    billingStatus(billingText("Google Play에서 가격과 조건을 확인해 주세요.", "Review the price and terms in Google Play."));
    subscriptionState.timer = setTimeout(function() {
        releaseSubscriptionButton(billingText(
            "결제창이 열리지 않았다면 연결 상태를 확인하고 다시 눌러 주세요. 이미 결제했다면 Google Play에서 구독 상태를 확인해 주세요.",
            "If checkout did not open, check your connection and retry. If you already paid, check your subscription in Google Play."));
    }, 20000);
    try {
        // 기존 152에서 지원하는 구매 API만 호출하고 신규 API 702에는 의존하지 않습니다.
        var sent = fn_Js_Bridge({ header: { api: "701" }, body: { billingType: "SUBS", callBackFunc: "payInAppComplete" } });
        if (!sent) throw new Error("Native bridge unavailable");
    } catch (error) { payInAppComplete("error"); }
}
function payInAppComplete(result) {
    if (!result || result === "error" || result === "cancelled" || result === "pending" || result === "offer_changed") {
        releaseSubscriptionButton(billingText("결제 완료가 확인되지 않았습니다. Google Play에서 상태를 확인한 뒤 다시 시도해 주세요.",
            "Payment completion was not confirmed. Check its status in Google Play before retrying."));
        return;
    }
    // 152는 Purchase JSON, 후속 앱은 상태 문자열을 반환하므로 성공 문구 대신 라이선스를 다시 확인합니다.
    var valid = result === "purchased";
    if (!valid) {
        try { var value = typeof result === "string" ? JSON.parse(result) : result; valid = !!(value && typeof value === "object" && !Array.isArray(value)); }
        catch (error) { valid = false; }
    }
    if (!valid) { payInAppComplete("error"); return; }
    releaseSubscriptionButton(billingText("구독 상태를 다시 확인합니다.", "Refreshing subscription status…"));
    fn_Reload(true);
}
// 152는 결제 취소 콜백이 없어 Play 화면에서 돌아오면 재시도할 수 있도록 버튼을 복원합니다.
document.addEventListener("visibilitychange", function() {
    if (!document.hidden && subscriptionState.paying) releaseSubscriptionButton();
});
window.addEventListener("focus", function() {
    if (subscriptionState.paying) releaseSubscriptionButton();
});
/** SOFTM-BILLING-152 END */
