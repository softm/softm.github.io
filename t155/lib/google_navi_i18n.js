/*
 * SOFTM-I18N START: Google 지도 전용 페이지에서 기존 lng 설정과 data-i18n 키를 사용하는 경량 다국어 헬퍼 추가. 2026-05-19
 */
(function(window, document) {
  "use strict";

  /*
   * SOFTM-I18N-MESSAGES-CONSUME START 날짜:20260521 : 공용 messages 객체를 사용하는 Google 지도 i18n 어댑터로 단순화
   */
  var googleNaviSupportedLanguages = ["en", "ko", "pt", "es", "id", "ja", "th", "vi", "de", "fr"];

  function normalizeGoogleNaviLang(lang) {
    var value = String(lang || "en").toLowerCase().replace("_", "-");
    var base = value.split("-")[0];
    if (base === "in") base = "id";
    return googleNaviSupportedLanguages.indexOf(base) >= 0 ? base : "en";
  }
  /*
   * SOFTM-I18N-MESSAGES-CONSUME END
   */

  function getParamValue(name) {
    var query = window.location.search ? window.location.search.substring(1) : "";
    var pairs = query ? query.split("&") : [];
    for (var i = 0; i < pairs.length; i++) {
      var parts = pairs[i].split("=");
      if (decodeURIComponent(parts[0] || "") === name) return parts.length > 1 ? decodeURIComponent(parts.slice(1).join("=").replace(/\+/g, " ")) : "";
    }
    return "";
  }

  function currentLang() {
    var stored = "";
    try {
      stored = window.localStorage ? window.localStorage.getItem("lng") : "";
    } catch (e) {}
    var requested = getParamValue("lng");
    var lang = requested || stored || (window.navigator && window.navigator.language ? window.navigator.language.split("-")[0] : "en");
    lang = normalizeGoogleNaviLang(lang);
    try {
      if (window.localStorage) window.localStorage.setItem("lng", lang);
    } catch (e) {}
    return lang;
  }

  function dictionary(lang) {
    return window.messages && window.messages[lang] && window.messages[lang].translation ? window.messages[lang].translation : {};
  }

  function getPath(source, key) {
    var cursor = source;
    var parts = String(key || "").split(".");
    for (var i = 0; i < parts.length; i++) {
      if (!cursor || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return null;
      cursor = cursor[parts[i]];
    }
    return cursor;
  }

  function translate(key, option) {
    var lang = currentLang();
    var dict = dictionary(lang);
    var value = getPath(dict, key);
    if (value == null && lang !== "en") value = getPath(dictionary("en"), key);
    if (value == null) value = key;
    value = String(value);
    option = option || {};
    for (var name in option) {
      if (Object.prototype.hasOwnProperty.call(option, name)) {
        value = value.replace(new RegExp("\\{" + name + "\\}", "g"), option[name]);
      }
    }
    return value;
  }

  function applyI18n(root) {
    root = root || document;
    document.documentElement.lang = currentLang();
    var nodes = root.querySelectorAll ? root.querySelectorAll("[data-i18n]") : [];
    for (var i = 0; i < nodes.length; i++) {
      applyNode(nodes[i]);
    }
  }

  function applyNode(node) {
    var specs = String(node.getAttribute("data-i18n") || "").split(";");
    for (var i = 0; i < specs.length; i++) {
      var spec = trim(specs[i]);
      if (!spec) continue;
      var attr = "text";
      var key = spec;
      var match = spec.match(/^\[([^\]]+)\](.+)$/);
      if (match) {
        attr = match[1];
        key = match[2];
      }
      var value = translate(key);
      if (attr === "html") node.innerHTML = value;
      else if (attr === "text") node.textContent = value;
      else node.setAttribute(attr, value);
    }
  }

  function trim(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
  }

  window.googleNaviMessages = window.messages || {};
  window.googleNaviLang = currentLang;
  window.googleNaviT = translate;
  window.googleNaviApplyI18n = applyI18n;
  if (typeof window.t !== "function") window.t = translate;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      applyI18n(document);
    });
  } else {
    applyI18n(document);
  }
})(window, document);
/*
 * SOFTM-I18N END
 */
