(function () {
  "use strict";

  if (!navigator.userAgent.includes("AdMobNative/1")) return;

  document.documentElement.classList.add("hannun-native-ads");

  function hideAdFitContainers(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var ads = [];
    if (scope.matches && scope.matches(".kakao_ad_area")) {
      ads.push(scope);
    }
    scope.querySelectorAll(".kakao_ad_area").forEach(function (ad) {
      ads.push(ad);
    });
    ads.forEach(function (ad) {
      ad.style.setProperty("display", "none", "important");
      var wrapper = ad.parentElement;
      if (wrapper && wrapper.parentElement) {
        wrapper.parentElement.style.setProperty("display", "none", "important");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hideAdFitContainers(document);
    }, { once: true });
  } else {
    hideAdFitContainers(document);
  }

  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(hideAdFitContainers);
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
