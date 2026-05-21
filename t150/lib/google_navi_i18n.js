/*
 * SOFTM-I18N START: Google 지도 전용 페이지에서 기존 lng 설정과 data-i18n 키를 사용하는 경량 다국어 헬퍼 추가. 2026-05-19
 */
(function(window, document) {
  "use strict";

  var localMessages = {
    en: {
      translation: {
        label: {
          recent: "Recent",
          search: "Search",
          favorite: "Favorite",
          map: "Map",
          home: "Home",
          company: "Company",
          tmap_map: "TMap Map",
          google_map: "Google Map"
        },
        title: {
          favorite: "Favorite",
          home_company: "Home/Company"
        },
        google_navi: {
          current_location: "Current location",
          selected_location: "Selected location",
          edit_location: "Edit location",
          google_map: "Google Map",
          switch_to_tmap: "View TMap Map", // SOFTM-MAPSWITCH: 지도 전환 버튼 문구를 보기 액션으로 변경. 2026-05-19
          switch_to_google: "View Google Map",
          search_type: "Search type",
          destination_type: "Destination type",
          destination_list: "Destination list",
          place_or_address: "Place or address",
          initializing: "Initializing...",
          start_navi: "Start Navi",
          delete: "Delete",
          edit_name: "Edit name",
          add_favorite: "Add favorite",
          remove_favorite: "Remove favorite",
          save: "Save",
          home_save: "Save home",
          company_save: "Save company",
          destination: "Destination",
          recent_destination: "Recent destinations",
          map_selected_title: "Map point",
          destination_search: "Destination search",
          edit_pin_guide: "Drag the red edit pin to adjust the location.",
          map_move_or_search: "Move the map or search, then choose a destination.",
          search_place_or_address: "Search by place name or address.",
          recent_filter_placeholder: "Search recent list (initials supported)",
          favorite_filter_placeholder: "Search favorites (initials supported)",
          current_location_loading: "Checking current location...",
          current_location_moved: "Moved to current location.",
          guide_select_save: "\"{name}\" location selected. Adjust it, then tap \"{label} Save\".",
          guide_modified: "\"{name}\" location was adjusted.",
          guide_after_modify_save: "After adjusting, tap \"{label} Save\".",
          no_destination_current_save: "{label} destination is not set. You can save the current location.",
          no_destination_checking_current: "{label} destination is not set. Checking current location...",
          registered_destination: "{label} destination is set.",
          guide_to_destination: "Guiding to \"{name}\".",
          guide_no_destination: "\"{label}\" destination is not set.",
          map_click_to_set: "Click \"Map\" to set a location.",
          map_point: "{label} map point",
          map_point_generic: "Map point",
          map_selected: "Location selected on the map. Drag the pin to adjust it.",
          input_search_keyword: "Enter a search keyword.",
          searching: "Searching...",
          search_result_count: "{count} search results found.",
          no_search_result: "No search results.",
          data_not_found: "No data was found.",
          cannot_search: "Cannot search.",
          change_order: "Change order",
          search_history: "Search history",
          selected: "{name} selected",
          search_history_prefix: "Search history: {name}",
          recent_result_count: "{count} recent destinations found.",
          recent_count: "{count} recent destinations",
          no_recent_filter: "No matching recent destinations.",
          no_recent: "No recent destinations.",
          favorite_result_count: "{count} favorites found.",
          favorite_count: "{count} favorites",
          no_favorite_filter: "No matching favorites.",
          no_favorite: "No favorites.",
          select_destination_first: "Select a destination first.",
          saved_destination: "{label} destination was saved. Current {label}: {name}",
          destination_saved: "{label} destination was saved.",
          destination_deleted_status: "{label} destination was deleted.",
          destination_deleted: "{label} destination was deleted.",
          search_history_cannot_favorite: "Search history cannot be added to favorites.",
          favorite_name: "Favorite name",
          favorite_name_edit: "Edit favorite name",
          favorite_add_canceled: "Adding favorite was canceled.",
          favorite_added_status: "Added to favorites: {name}",
          favorite_registered: "Favorite registered.",
          favorite_already_registered: "Already registered in favorites.",
          favorite_edit_canceled: "Editing favorite name was canceled.",
          favorite_edit_failed: "Cannot edit favorite name.",
          favorite_edit_status: "Favorite name updated: {name}",
          favorite_edit_done: "Favorite name updated.",
          favorite_order_saved: "Favorite order saved.",
          favorite_order_save_failed: "Cannot save favorite order.",
          favorite_default_location: "Favorite location",
          my_location_name: "My location",
          specified_location: "Selected location",
          pin_adjusted_status: "Pin location was adjusted.",
          pin_adjusted: "Pin location adjusted.",
          favorite_removed_status: "Removed from favorites.",
          favorite_removed: "Favorite removed.",
          confirm_remove_favorite: "Delete this favorite?",
          favorite_remove_canceled: "Favorite deletion was canceled.",
          dialog_no: "No",
          dialog_yes: "Yes",
          dialog_cancel: "Cancel",
          dialog_ok: "Save",
          no_address_to_guide: "No address to guide.",
          navi_starting: "Starting navigation: {name}",
          navi_started: "Navigation started.",
          move_search_screen: "Moving to search screen: {name}",
          local_storage_error: "Cannot open local storage.",
          destination_default: "Destination",
          api_key_missing: "Google Maps API key is missing.",
          api_key_restricted: "Check Google Maps API key authentication or API restrictions.",
          script_load_failed: "Failed to load Google Maps script.",
          map_element_not_found: "Map area was not found.",
          address_no_result: "No address search results.",
          places_permission: "Check Google Places API permission or API restrictions.",
          places_over_query: "Check Google Places API usage limits.",
          places_error: "Google Places search error: {status}",
          search_result: "Search result",
          address_result: "Address result"
        }
      }
    },
    ko: {
      translation: {
        label: {
          recent: "최근",
          search: "검색",
          favorite: "즐겨찾기",
          map: "지도",
          home: "집",
          company: "회사",
          tmap_map: "티맵지도",
          google_map: "구글지도"
        },
        title: {
          favorite: "즐겨찾기",
          home_company: "집/회사"
        },
        google_navi: {
          current_location: "현재 위치",
          selected_location: "선택 위치",
          edit_location: "위치 수정",
          google_map: "Google 지도",
          switch_to_tmap: "티맵지도 보기", // SOFTM-MAPSWITCH: 지도 전환 버튼 문구를 보기 액션으로 변경. 2026-05-19
          switch_to_google: "구글지도 보기",
          search_type: "검색 유형",
          destination_type: "목적지 유형",
          destination_list: "목적지 목록",
          place_or_address: "장소명 또는 주소",
          initializing: "초기화 중입니다...",
          start_navi: "내비 시작",
          delete: "삭제",
          edit_name: "이름 수정",
          add_favorite: "즐겨찾기 추가",
          remove_favorite: "즐겨찾기 삭제",
          save: "저장",
          home_save: "집 저장",
          company_save: "회사 저장",
          destination: "목적지",
          recent_destination: "최근 목적지",
          map_selected_title: "지도 지정",
          destination_search: "목적지 검색",
          edit_pin_guide: "빨간 수정 핀을 드래그하면 위치를 조정할 수 있습니다.",
          map_move_or_search: "지도를 움직이거나 검색 후 목적지를 선택하세요.",
          search_place_or_address: "장소명 또는 주소를 검색하세요.",
          recent_filter_placeholder: "최근 목록 검색 (초성: 광명시, ㄱㅁㅅ)",
          favorite_filter_placeholder: "즐겨찾기 검색 (초성: 광명시, ㄱㅁㅅ)",
          current_location_loading: "현재 위치를 확인 중입니다...",
          current_location_moved: "현재 위치로 이동했습니다.",
          guide_select_save: "\"{name}\" 위치를 선택했습니다. 수정 후 \"{label} 저장\"을 누르세요.",
          guide_modified: "\"{name}\" 위치를 수정했습니다.",
          guide_after_modify_save: "수정 후 \"{label} 저장\"을 누르세요.",
          no_destination_current_save: "{label} 목적지가 없습니다. 현재 위치를 저장할 수 있습니다.",
          no_destination_checking_current: "{label} 목적지가 없습니다. 현재 위치를 확인 중입니다...",
          registered_destination: "{label} 목적지가 등록되어 있습니다.",
          guide_to_destination: "\"{name}\"으로 안내합니다.",
          guide_no_destination: "\"{label}\" 목적지가 없습니다.",
          map_click_to_set: "\"지도\"를 클릭해 위치를 지정하세요.",
          map_point: "{label} 지정 위치",
          map_point_generic: "지도 지정 위치",
          map_selected: "지도에서 선택한 위치입니다. 핀을 드래그해서 수정할 수 있습니다.",
          input_search_keyword: "검색어를 입력하세요.",
          searching: "검색 중입니다...",
          search_result_count: "{count}건의 검색 결과가 있습니다.",
          no_search_result: "검색 결과가 없습니다.",
          data_not_found: "조회된 자료가 없습니다.",
          cannot_search: "검색할 수 없습니다.",
          change_order: "순서 변경",
          search_history: "검색 이력",
          selected: "{name} 선택됨",
          search_history_prefix: "검색 이력: {name}",
          recent_result_count: "최근 목적지 {count}건이 검색되었습니다.",
          recent_count: "최근 목적지 {count}건",
          no_recent_filter: "검색된 최근 목적지가 없습니다.",
          no_recent: "최근 목적지 목록이 없습니다.",
          favorite_result_count: "즐겨찾기 {count}건이 검색되었습니다.",
          favorite_count: "즐겨찾기 {count}건",
          no_favorite_filter: "검색된 즐겨찾기가 없습니다.",
          no_favorite: "즐겨찾기 목록이 없습니다.",
          select_destination_first: "먼저 목적지를 선택하세요.",
          saved_destination: "{label} 목적지를 저장했습니다. 현재 {label}: {name}",
          destination_saved: "{label} 목적지가 저장되었습니다.",
          destination_deleted_status: "{label} 목적지를 삭제했습니다.",
          destination_deleted: "{label} 목적지가 삭제되었습니다.",
          search_history_cannot_favorite: "검색 이력은 즐겨찾기에 추가할 수 없습니다.",
          favorite_name: "즐겨찾기 이름",
          favorite_name_edit: "즐겨찾기 이름 수정",
          favorite_add_canceled: "즐겨찾기 추가를 취소했습니다.",
          favorite_added_status: "즐겨찾기에 추가했습니다: {name}",
          favorite_registered: "즐겨찾기가 등록되었습니다.",
          favorite_already_registered: "이미 즐겨찾기에 등록되어 있습니다.",
          favorite_edit_canceled: "즐겨찾기 이름 수정을 취소했습니다.",
          favorite_edit_failed: "즐겨찾기 이름을 수정할 수 없습니다.",
          favorite_edit_status: "즐겨찾기 이름을 수정했습니다: {name}",
          favorite_edit_done: "즐겨찾기 이름이 수정되었습니다.",
          favorite_order_saved: "즐겨찾기 순서를 저장했습니다.",
          favorite_order_save_failed: "즐겨찾기 순서를 저장할 수 없습니다.",
          favorite_default_location: "즐겨찾기 위치",
          my_location_name: "내 위치",
          specified_location: "지정 위치",
          pin_adjusted_status: "핀 위치를 수정했습니다.",
          pin_adjusted: "핀 위치를 조정했습니다.",
          favorite_removed_status: "즐겨찾기에서 삭제했습니다.",
          favorite_removed: "즐겨찾기가 삭제되었습니다.",
          confirm_remove_favorite: "즐겨찾기를 삭제 하시겠습니까?",
          favorite_remove_canceled: "즐겨찾기 삭제를 취소했습니다.",
          dialog_no: "아니오",
          dialog_yes: "예",
          dialog_cancel: "취소",
          dialog_ok: "저장",
          no_address_to_guide: "안내할 주소가 없습니다.",
          navi_starting: "내비게이션을 시작합니다: {name}",
          navi_started: "내비게이션을 시작합니다.",
          move_search_screen: "검색 화면으로 이동합니다: {name}",
          local_storage_error: "로컬 저장소를 열 수 없습니다.",
          destination_default: "목적지",
          api_key_missing: "Google Maps API key가 없습니다.",
          api_key_restricted: "Google Maps API key 인증 또는 API 제한 설정을 확인해야 합니다.",
          script_load_failed: "Google Maps 스크립트를 불러오지 못했습니다.",
          map_element_not_found: "지도 영역을 찾을 수 없습니다.",
          address_no_result: "주소 검색 결과가 없습니다.",
          places_permission: "Google Places API 권한 또는 API 제한 설정을 확인해야 합니다.",
          places_over_query: "Google Places API 사용량 한도를 확인해야 합니다.",
          places_error: "Google Places 검색 오류: {status}",
          search_result: "검색 결과",
          address_result: "주소 결과"
        }
      }
    }
  };

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
    var lang = requested || stored || (window.navigator && window.navigator.language ? window.navigator.language.split("-")[0] : "ko");
    lang = lang === "ko" ? "ko" : "en";
    try {
      if (window.localStorage) window.localStorage.setItem("lng", lang);
    } catch (e) {}
    return lang;
  }

  function dictionary(lang) {
    var globalMessages = window.messages && window.messages[lang] && window.messages[lang].translation ? window.messages[lang].translation : {};
    return {
      globalMessages: globalMessages,
      localMessages: localMessages[lang] && localMessages[lang].translation ? localMessages[lang].translation : {}
    };
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
    var value = getPath(dict.globalMessages, key);
    if (value == null) value = getPath(dict.localMessages, key);
    if (value == null && lang !== "ko") value = getPath(localMessages.ko.translation, key);
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

  window.googleNaviMessages = localMessages;
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
