/** SOFTM-BILLING-UI START 날짜:20261101 : 실제 Play 가격만 표시하고 조회·취소·오류를 성공과 구분 */
var subscriptionState = { ready: false, loading: false, paying: false, timer: null };
function billingText(ko, en) {
    var language = window.lng || (window.i18next && i18next.language) || navigator.language || "en";
    return language.indexOf("ko") === 0 ? ko : en;
}
function billingStatus(message) { $("#billingStatus").text(message); }
function billingAction(message) {
    $("#subscriptionAction, #subscriptionCardAction").text(message);
    $("#btnPayInApp").prop("disabled", subscriptionState.loading || subscriptionState.paying);
    $(".box.monthly").attr("aria-disabled", String(subscriptionState.loading || subscriptionState.paying));
}
function billingPeriod(period) {
    var match = /^P(\d+)([DWMY])$/.exec(period || "");
    if (!match) throw new Error("Unsupported billing period");
    var units = { D: ["일", "day(s)"], W: ["주", "week(s)"], M: ["개월", "month(s)"], Y: ["년", "year(s)"] };
    return match[1] + billingText(units[match[2]][0], " " + units[match[2]][1]);
}
function loadSubscriptionPrice() {
    if (subscriptionState.loading || subscriptionState.paying) return;
    subscriptionState.ready = false;
    subscriptionState.loading = true;
    billingStatus(billingText("Google Play 가격을 불러오는 중입니다.", "Loading Google Play price…"));
    billingAction(billingText("불러오는 중…", "Loading…"));
    $("#subscriptionTerms").text(billingText("구독은 자동 갱신되며 Google Play에서 취소할 수 있습니다.", "Subscription renews automatically. Cancel in Google Play."));
    clearTimeout(subscriptionState.timer);
    subscriptionState.timer = setTimeout(function() { subscriptionPriceComplete({ error: true }); }, 15000);
    try {
        if (CommonUtil.fn_IS_APP() !== "A") throw new Error("Android required");
        fn_Js_Bridge({ header: { api: "702" }, body: {} });
    } catch (error) { subscriptionPriceComplete({ error: true }); }
}
function subscriptionPriceComplete(result) {
    if (!subscriptionState.loading) return;
    clearTimeout(subscriptionState.timer);
    subscriptionState.loading = false;
    try {
        if (!result || result.error || !result.phases || !result.phases.length) throw new Error("No price");
        var phases = result.phases;
        var recurring = phases[phases.length - 1];
        var price = recurring.price + " / " + billingPeriod(recurring.period);
        var details = phases.slice(0, -1).map(function(phase) {
            return phase.price + " / " + billingPeriod(phase.period) + " × " + phase.cycles;
        });
        $("#subscriptionPrice").text(price);
        $("#subscriptionPhases").text(details.length ? details.join(" → ") + billingText(" 이후", " then") : "");
        subscriptionState.offerToken = result.offerToken;
        subscriptionState.ready = true;
        billingStatus("");
        billingAction(billingText("구독하기", "Subscribe"));
    } catch (error) {
        subscriptionState.ready = false;
        $("#subscriptionPrice").text("—");
        $("#subscriptionPhases").text("");
        billingStatus(billingText("가격을 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.", "Price unavailable. Check your connection and retry."));
        billingAction(billingText("가격 다시 불러오기", "Retry loading price"));
    }
}
function beginSubscription() {
    if (subscriptionState.loading || subscriptionState.paying) return;
    if (!subscriptionState.ready) { loadSubscriptionPrice(); return; }
    subscriptionState.paying = true;
    billingStatus(billingText("Google Play 결제창을 여는 중입니다.", "Opening Google Play checkout…"));
    billingAction(billingText("처리 중…", "Please wait…"));
    // 타임아웃은 성공 처리하지 않으며 자동 재결제하지 않습니다.
    clearTimeout(subscriptionState.timer);
    subscriptionState.timer = setTimeout(function() { payInAppComplete("error"); }, 60000);
    try { fn_Js_Bridge({ header: { api: "701" }, body: { billingType: "SUBS", offerToken: subscriptionState.offerToken, callBackFunc: "payInAppComplete" } }); }
    catch (error) { payInAppComplete("error"); }
}
function payInAppComplete(result) {
    clearTimeout(subscriptionState.timer);
    subscriptionState.paying = false;
    billingAction(billingText("구독하기", "Subscribe"));
    if (result === "offer_changed") {
        subscriptionState.ready = false;
        billingStatus(billingText("구독 조건이 변경되었습니다. 가격을 다시 확인해 주세요.", "Subscription terms changed. Reload the price before subscribing."));
        billingAction(billingText("가격 다시 불러오기", "Reload price"));
        return;
    }
    if (result === "cancelled") {
        billingStatus(billingText("결제를 취소했습니다.", "Purchase cancelled."));
        return;
    }
    if (result === "pending") {
        billingStatus(billingText("결제가 보류 중입니다. Google Play에서 결제 상태를 확인해 주세요.", "Payment is pending. Check its status in Google Play."));
        return;
    }
    if (result !== "purchased") {
        billingStatus(billingText("결제를 완료하지 못했습니다. Google Play에서 구독 상태를 확인한 뒤 다시 시도해 주세요.", "Purchase not completed. Check your subscription in Google Play before retrying."));
        return;
    }
    billingStatus(billingText("구독이 완료되었습니다.", "Subscription completed."));
    fn_Reload(true);
}
/** SOFTM-BILLING-UI END */
