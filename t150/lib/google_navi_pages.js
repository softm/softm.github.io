/*
 * SOFTM-GOOGLE START: home_company_google/search_google 공통 화면 로직 추가. 2026-05-16
 */
(function(window, document) {
  "use strict";

  var DEFAULT_LOCATION = { lat: 36.9876599, lon: 126.8487439, name: i18n("google_navi.current_location", null, "현재 위치") };
  var EDIT_PIN_GUIDE = i18n("google_navi.edit_pin_guide", null, "빨간 수정 핀을 드래그하면 위치를 조정할 수 있습니다.");
  var state = {
    pageType: "",
    mode: "",
    map: null,
    current: null,
    selected: null,
    editPoi: null,
    pois: [],
    recentPois: [], // SOFTM-GOOGLE: 최근 탭 원본 목록을 보관해 검색어 필터를 반복 적용. 2026-05-17
    favoritePois: [], // SOFTM-GOOGLE: 즐겨찾기 탭 원본 목록을 보관해 검색어/초성 필터를 반복 적용. 2026-05-17
    localStorageBasic: null,
    localStorageRecent: null,
    savedDestination: {
      home: false,
      company: false
    },
    locationSeq: 0, // SOFTM-GOOGLE: 탭 전환 중 오래된 위치 조회 응답을 무시하기 위한 순번. 2026-05-17
    snackbarTimer: null,
    favoriteDrag: null, // SOFTM-GOOGLE: 즐겨찾기 목록 드래그 정렬 상태를 관리. 2026-05-17
    pinResolveSeq: 0 // SOFTM-GOOGLE: 드래그 핀 주소/POI 비동기 조회 응답 순서를 관리. 2026-05-17
  };

  if (typeof window.getParam !== "function") {
    window.getParam = function(name) {
      var query = window.location.search ? window.location.search.substring(1) : "";
      var pairs = query ? query.split("&") : [];
      for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split("=");
        if (decodeURIComponent(parts[0] || "") === name) return parts.length > 1 ? parts.slice(1).join("=") : "";
      }
      return "";
    };
  }

  function i18n(key, option, fallback) {
    if (typeof window.googleNaviT === "function") return window.googleNaviT(key, option || {});
    if (typeof window.t === "function") return window.t(key, option || {});
    return fallback || key;
  }
  // SOFTM-I18N: Google 지도 신규 페이지의 상태/버튼/다이얼로그 문구를 기존 다국어 키로 조회. 2026-05-19

  window.SOFTM_GOOGLE_MAPS_API_KEY = window.SOFTM_GOOGLE_MAPS_API_KEY ||
    (getParam("google_key") || getParam("key")) ||
    "AIzaSyDP-j4QyoIYCQIQgvP7V_mFeD4rqSWfmac";

  function initGoogleNaviPage(pageType) {
    state.pageType = pageType;
    state.localStorageBasic = new InitLocalStorage("basic", ["id", "name", "key"]);
    state.localStorageRecent = new InitLocalStorage("recent", ["id", "name", "key"]);
    state.map = new GoogleNaviMap("googleMap", { center: { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lon } });
    bindEvents();
    state.map.init(function(error) {
      if (error) setStatus(error);
      var mode = initialMode(pageType);
      setMode(mode);
      var searched = runInitialSearch();
      loadInitialLocation(searched);
    });
  }

  function bindEvents() {
    each(queryAll(".google-navi-tab"), function(tab) {
      tab.onclick = function() {
        var mode = tab.getAttribute("data-mode");
        setMode(mode);
        refreshLocationAfterTabChange(mode);
      };
    });

    var btnSearch = byId("btnSearch");
    if (btnSearch) btnSearch.onclick = searchByKeyword;

    var keyword = byId("keyword");
    if (keyword) {
      keyword.onkeydown = function(event) {
        event = event || window.event;
        if ((event.key && event.key === "Enter") || event.keyCode === 13) searchByKeyword();
      };
      keyword.oninput = function() {
        if (state.mode === "recent") applyRecentFilter();
        else if (state.mode === "favorite") applyFavoriteFilter();
      };
    }
    // SOFTM-GOOGLE: 최근/즐겨찾기 탭 검색 입력은 버튼/Enter뿐 아니라 입력 즉시 초성 필터를 적용. 2026-05-17

    var btnNavi = byId("btnNavi");
    if (btnNavi) btnNavi.onclick = startSelectedNavi;

    var btnPrimary = byId("btnPrimary");
    if (btnPrimary) btnPrimary.onclick = primaryAction;

    var btnDelete = byId("btnDelete");
    if (btnDelete) btnDelete.onclick = secondaryAction;

    var btnBack = byId("btnBack") || byId("btnClose");
    if (btnBack) btnBack.onclick = closePage;
    window.fn_BackKeyPressedCallBack = function() {
      closePage();
    };
    // SOFTM-GOOGLE: 기존 search/home_company와 동일하게 헤더 뒤로가기와 Android Back 콜백을 팝업 닫기로 연결. 2026-05-19

    var btnMyLocation = byId("btnMyLocation");
    if (btnMyLocation) btnMyLocation.onclick = function() {
      requestMyLocation();
    };

    var list = byId("poiList");
    if (list) {
      bindFavoriteSortDrag(list);
      list.onclick = function(event) {
        var target = event.target || event.srcElement;
        if (state.favoriteDrag && state.favoriteDrag.ignoreClick) {
          state.favoriteDrag = null;
          return;
        }
        if (closestByClass(target, "google-navi-drag-handle")) return;
        var favoriteButton = closestByClass(target, "google-navi-favorite");
        var item = closestByClass(target, "google-navi-item");
        if (!item) return;
        var index = parseInt(item.getAttribute("data-index"), 10);
        var poi = state.pois[index];
        if (!poi) return;
      if (favoriteButton && !hideFavoriteAction(poi)) {
        toggleFavorite(poi);
        } else if (state.mode === "recent" && isSearchHistory(poi)) {
          openSearchHistory(poi);
        } else {
        selectPoi(index, true);
        }
      };
    }
  }
  // SOFTM-GOOGLE: 즐겨찾기 목록 클릭과 드래그 정렬 핸들 이벤트가 충돌하지 않도록 분기. 2026-05-17

  function refreshLocationAfterTabChange(mode) {
    if (state.pageType !== "search") return;
    var selectCurrent = mode === "search" || mode === "map";
    loadLocation({
      center: true,
      preserveSelection: !selectCurrent,
      resolveAddress: selectCurrent,
      select: selectCurrent,
      syncMapCurrent: mode === "map"
    });
  }
  // SOFTM-GOOGLE: 검색 화면 탭 이동 시 현재 위치를 자동 조회하고 검색/지도 탭에서는 수정 핀 대상으로 표시. 2026-05-17

  function initialMode(pageType) {
    var idx = typeof getParam === "function" ? getParam("idx") : "";
    if (pageType === "home") {
      if (idx === "1") return "company";
      if (idx === "2") return "favorite";
      if (idx === "3") return "recent";
      return "home";
    }
    if (idx === "1") return "search";
    if (idx === "2") return "favorite";
    if (idx === "3") return "map";
    return "recent";
  }

  function setMode(mode) {
    var previousMode = state.mode;
    var nextMode = mode || "search";
    clearKeywordOnMenuChange(previousMode, nextMode);
    state.mode = nextMode;
    state.selected = null;
    state.editPoi = null;
    state.pois = [];
    renderList([]);
    updateTabs();
    updateModeUi();
    state.map.onMapClick(isEditableDestinationMode() || state.mode === "map" ? selectMapPoint : null);
    state.map.clearEditablePin();
    setAddressOverlay(null);

    if (state.mode === "home") {
      loadSavedDestination("_POI_HOME", destinationLabelForMode("home"), "home");
    } else if (state.mode === "company") {
      loadSavedDestination("_POI_COMPANY", destinationLabelForMode("company"), "company");
    } else if (state.mode === "favorite") {
      loadFavorites();
    } else if (state.mode === "recent") {
      loadRecent();
    } else if (state.mode === "map") {
      setStatus(i18n("google_navi.map_move_or_search", null, "지도를 움직이거나 검색 후 목적지를 선택하세요."));
      if (state.current) selectCurrentAsPoi();
    } else {
      setStatus(i18n("google_navi.search_place_or_address", null, "장소명 또는 주소를 검색하세요."));
    }
  }

  function clearKeywordOnMenuChange(previousMode, nextMode) {
    if (!previousMode || previousMode === nextMode) return;
    var keyword = byId("keyword");
    if (!keyword) return;
    if (state.pageType === "home") {
      if ((previousMode === "home" || previousMode === "company") && (nextMode === "favorite" || nextMode === "recent")) keyword.value = "";
      return;
    }
    if (state.pageType === "search" && (nextMode === "favorite" || nextMode === "recent")) keyword.value = "";
  }
  // SOFTM-GOOGLE: 집/회사 검색어와 search_google 검색 탭 검색어가 즐겨찾기/최근 필터로 유지되지 않도록 탭 전환 시 초기화. 2026-05-17

  function updateTabs() {
    each(queryAll(".google-navi-tab"), function(tab) {
      if (tab.getAttribute("data-mode") === state.mode) addClass(tab, "active");
      else removeClass(tab, "active");
    });
  }

  function updateModeUi() {
    var searchPanel = byId("searchPanel");
    if (searchPanel) {
      searchPanel.style.display = "flex";
    }

    var keyword = byId("keyword");
    if (keyword) {
      keyword.placeholder = filterPlaceholder();
      if (state.mode !== "search" && state.mode !== "recent" && state.mode !== "favorite") keyword.value = "";
    }

    var title = byId("pageTitle");
    if (title) title.innerHTML = pageTitle();

    var primary = byId("btnPrimary");
    if (primary) {
      primary.className = "google-navi-button primary";
      if (state.mode === "favorite") addClass(primary, "danger");
    }
    updatePrimaryButton();

    updateDeleteButton();
    if (!isEditableDestinationMode()) updateGuide("", "");
  }
  // SOFTM-GOOGLE: 최근/즐겨찾기 탭에서도 검색창을 노출하고 입력 placeholder를 필터 용도에 맞게 전환. 2026-05-17

  function filterPlaceholder() {
    if (state.mode === "recent") return i18n("google_navi.recent_filter_placeholder", null, "최근 목록 검색 (초성: 광명시, ㄱㅁㅅ)");
    if (state.mode === "favorite") return i18n("google_navi.favorite_filter_placeholder", null, "즐겨찾기 검색 (초성: 광명시, ㄱㅁㅅ)");
    return i18n("google_navi.place_or_address", null, "장소명 또는 주소");
  }
  // SOFTM-GOOGLE: 탭별 검색 입력 안내 문구를 분리해 즐겨찾기 필터 예시도 표시. 2026-05-17

  function pageTitle() {
    if (state.pageType === "home") return i18n("google_navi.destination", null, "목적지");
    if (state.mode === "recent") return i18n("google_navi.recent_destination", null, "최근 목적지");
    if (state.mode === "favorite") return i18n("label.favorite", null, "즐겨찾기");
    if (state.mode === "map") return i18n("google_navi.map_selected_title", null, "지도 지정");
    return i18n("google_navi.destination_search", null, "목적지 검색");
  }

  function primaryLabel() {
    if (state.mode === "home") return i18n("google_navi.home_save", null, "집 저장");
    if (state.mode === "company") return i18n("google_navi.company_save", null, "회사 저장");
    if (state.mode === "favorite") return state.selected && state.selected.favorite ? i18n("google_navi.remove_favorite", null, "즐겨찾기 삭제") : i18n("google_navi.add_favorite", null, "즐겨찾기 추가");
    if (state.mode === "recent") return i18n("google_navi.add_favorite", null, "즐겨찾기 추가");
    if (state.selected && state.selected.favorite) return i18n("google_navi.remove_favorite", null, "즐겨찾기 삭제");
    return i18n("google_navi.add_favorite", null, "즐겨찾기 추가");
  }

  function updatePrimaryButton() {
    var primary = byId("btnPrimary");
    if (!primary) return;
    primary.innerHTML = primaryLabel();
    if ((state.mode === "search" || state.mode === "map" || state.mode === "recent" || state.mode === "favorite") && state.selected && state.selected.favorite) {
      addClass(primary, "danger");
    } else {
      removeClass(primary, "danger");
    }
  }
  // SOFTM-GOOGLE: 즐겨찾기 탭에서도 현재 위치처럼 미등록 선택지는 추가, 기존 즐겨찾기는 삭제 상태로 버튼을 전환. 2026-05-17

  function updateGuide(message, action) {
    var guide = byId("guidePanel");
    if (!guide) return;
    if (!isEditableDestinationMode()) {
      guide.style.display = "none";
      guide.innerHTML = "";
      return;
    }
    guide.style.display = "block";
    if (action === i18n("google_navi.map_click_to_set", null, "\"지도\"를 클릭해 위치를 지정하세요.")) action = EDIT_PIN_GUIDE;
    guide.innerHTML = "<strong>" + escapeHtml(message) + "</strong>" +
      '<span class="guide-action">' + escapeHtml(action) + "</span>";
  }
  // SOFTM-GOOGLE: 집/회사 목적지 화면의 지도 클릭 안내를 드래그 수정 안내로 교체. 2026-05-16

  function loadInitialLocation(searched) {
    if (state.pageType !== "search") {
      if (isEditableDestinationMode()) return;
      loadLocation();
      return;
    }
    if (searched) {
      loadLocation({ center: false, preserveSelection: true });
      return;
    }
    var selectCurrent = state.mode === "search" || state.mode === "map";
    loadLocation({
      center: true,
      preserveSelection: !selectCurrent,
      resolveAddress: selectCurrent,
      select: selectCurrent,
      syncMapCurrent: state.mode === "map",
      notify: selectCurrent
    });
  }
  // SOFTM-GOOGLE: 집/회사 탭은 저장 목적지 확인 후 현재 위치 fallback을 처리하고, 검색 화면은 최초 현재 위치를 수정 핀으로 표시. 2026-05-17

  function runInitialSearch() {
    var keyword = byId("keyword");
    var search = typeof getParam === "function" ? getParam("search") : "";
    if (keyword && search) {
      if (state.pageType === "search") setMode("search");
      keyword.value = decodeParam(search);
      searchByKeyword();
      return true;
    }
    return false;
  }

  function loadLocation(options) {
    options = options || {};
    var done = false;
    var requestSeq = ++state.locationSeq;
    window.googleNaviLocationCallback = function(mapVar, lat, lon, address) {
      if (requestSeq !== state.locationSeq) return;
      done = true;
      if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
        setCurrent(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.name, "", options);
        return;
      }
      setCurrent(lat, lon, address || i18n("google_navi.current_location", null, "현재 위치"), address || "", options);
    };

    if (typeof fn_GetLocation === "function") {
      fn_GetLocation("googleMap", "googleNaviLocationCallback");
    }

    window.setTimeout(function() {
      if (requestSeq !== state.locationSeq) return;
      if (!done) setCurrent(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.name, "", options);
    }, 700);
  }
  // SOFTM-GOOGLE: 탭 이동으로 위치 조회가 연속 발생해도 최신 요청 결과만 화면에 반영. 2026-05-17

  function setCurrent(lat, lon, name, address, options) {
    options = options || {};
    state.current = makePoi(name || i18n("google_navi.current_location", null, "현재 위치"), lat, lon, address || "", "current");
    state.map.setMyLocation(state.current);
    if (options.select) {
      if (options.syncMapCurrent && state.pageType === "search" && state.mode === "map") {
        state.pois = [cloneEditablePoi(state.current)];
        renderList(state.pois);
        selectPoi(0, false);
      } else {
        state.selected = cloneEditablePoi(state.current);
        showEditablePin(state.selected);
        setAddressOverlay(addressText(state.selected));
        if (options.editableDestinationLabel && isEditableDestinationMode()) {
          updateGuide(i18n("google_navi.guide_select_save", { name: state.selected.name, label: options.editableDestinationLabel }, "\"" + state.selected.name + "\" 위치를 선택했습니다. 수정 후 \"" + options.editableDestinationLabel + " 저장\"을 누르세요."), EDIT_PIN_GUIDE);
          setStatus(i18n("google_navi.no_destination_current_save", { label: options.editableDestinationLabel }, options.editableDestinationLabel + " 목적지가 없습니다. 현재 위치를 저장할 수 있습니다."));
        }
        updatePrimaryButton();
        updateDeleteButton(); // SOFTM-GOOGLE: 현재 위치 핀 선택 시 기존 즐겨찾기 이름 수정/삭제 버튼을 즉시 숨김. 2026-05-17
      }
    } else if (!options.preserveSelection && !state.selected) {
      state.selected = state.current;
    }
    if (options.center !== false) state.map.setCenter(state.current, 16);
    if (options.resolveAddress && !address) {
      resolveCurrentAddress(state.current, options);
    }
    if (options.notify) {
      setStatus(i18n("google_navi.current_location_moved", null, "현재 위치로 이동했습니다."));
      showSnackbar(i18n("google_navi.current_location_moved", null, "현재 위치로 이동했습니다."));
    }
  }
  // SOFTM-GOOGLE: 탭 자동 위치 조회는 기존 선택을 보존하고 지도 탭에서만 현재 위치를 선택 목록/수정 핀으로 동기화. 2026-05-17

  function requestMyLocation() {
    setStatus(i18n("google_navi.current_location_loading", null, "현재 위치를 확인 중입니다..."));
    loadLocation({ select: true, notify: true, resolveAddress: true });
  }
  // SOFTM-GOOGLE: 현재 위치 버튼 클릭 시 기존 로직처럼 GPS 재조회, 현재 위치 마커 표시, 지도 중심 이동 처리. 2026-05-16

  function resolveCurrentAddress(poi, options) {
    var selectedId = poi.id;
    state.map.resolvePinLocation(poi.lat, poi.lon, function(resolved) {
      applyResolvedLocation(poi, resolved, poi.name, poi.address, poi.lat, poi.lon);
      if (state.selected && state.selected.id === poi.id) {
        state.selected.name = poi.name;
        state.selected.address = poi.address;
        setAddressOverlay(addressText(state.selected));
      } else if (state.selected && state.selected.id === selectedId) {
        state.selected.name = poi.name;
        state.selected.address = poi.address;
        setAddressOverlay(addressText(state.selected));
      }
      if (options && options.syncMapCurrent && state.pageType === "search" && state.mode === "map") {
        syncCurrentPoiInList(poi);
      }
      if (options && options.notify) setStatus(i18n("google_navi.current_location_moved", null, "현재 위치로 이동했습니다."));
      if (options && options.editableDestinationLabel && isEditableDestinationMode()) {
        updateGuide(i18n("google_navi.guide_select_save", { name: state.selected.name, label: options.editableDestinationLabel }, "\"" + state.selected.name + "\" 위치를 선택했습니다. 수정 후 \"" + options.editableDestinationLabel + " 저장\"을 누르세요."), EDIT_PIN_GUIDE);
        setStatus(i18n("google_navi.no_destination_current_save", { label: options.editableDestinationLabel }, options.editableDestinationLabel + " 목적지가 없습니다. 현재 위치를 저장할 수 있습니다."));
      }
    });
  }
  // SOFTM-GOOGLE: 현재 위치 콜백에 주소가 없으면 역지오코딩과 주변 POI로 위치명/세부주소를 보강하고 집/회사 fallback 안내를 갱신. 2026-05-17

  function syncCurrentPoiInList(poi) {
    if (!poi || !state.pois || !state.pois.length) return;
    for (var i = 0; i < state.pois.length; i++) {
      if (state.pois[i].id === "current") {
        state.pois[i].name = poi.name;
        state.pois[i].address = poi.address;
      }
    }
    renderList(state.pois);
    syncSelectedListItem();
  }
  // SOFTM-GOOGLE: 지도 탭 자동 현재 위치 조회 후 역지오코딩 결과를 현재 위치 목록 행에도 반영. 2026-05-17

  function selectCurrentAsPoi() {
    if (!state.current) return;
    state.selected = state.current;
    state.pois = [state.current];
    renderList(state.pois);
    selectPoi(0, true);
  }

  function selectMapPoint(lat, lon) {
    var label = destinationLabel();
    var poi = makePoi(label ? i18n("google_navi.map_point", { label: label }, label + " 지정 위치") : i18n("google_navi.map_point_generic", null, "지도 지정 위치"), lat, lon, lat + ", " + lon, "map_" + lat + "_" + lon);
    state.map.resolvePinLocation(lat, lon, function(resolved) {
      applyResolvedLocation(poi, resolved, poi.name, poi.address, lat, lon);
      // SOFTM-GOOGLE: 지도 클릭 좌표도 주변 POI/상세주소 해석 후 목적지 1건으로 즉시 반영. 2026-05-17
      state.selected = poi;
      state.pois = [poi];
      renderList(state.pois);
      selectPoi(0, true);
      setStatus(i18n("google_navi.map_selected", null, "지도에서 선택한 위치입니다. 핀을 드래그해서 수정할 수 있습니다."));
    });
  }

  function searchByKeyword() {
    var keyword = byId("keyword");
    var query = trim(keyword ? keyword.value : "");
    if (state.mode === "recent") {
      applyRecentFilter();
      return;
    }
    if (state.mode === "favorite") {
      applyFavoriteFilter();
      return;
    }
    if (!query) {
      setStatus(i18n("google_navi.input_search_keyword", null, "검색어를 입력하세요."));
      return;
    }

    setStatus(i18n("google_navi.searching", null, "검색 중입니다..."));
    state.map.search(query, function(pois) {
      state.pois = pois || [];
      markFavoriteStates(state.pois, function() {
        renderList(state.pois);
        if (state.pois.length) {
          state.selected = null;
          state.editPoi = null;
          state.map.clearEditablePin();
          state.map.clearMarkerHighlight();
          setAddressOverlay(null);
          updatePrimaryButton();
          state.map.fitPois(state.pois);
          setStatus(i18n("google_navi.search_result_count", { count: state.pois.length }, state.pois.length + "건의 검색 결과가 있습니다."));
      } else {
        setStatus(i18n("google_navi.no_search_result", null, "검색 결과가 없습니다."));
        showSnackbar(i18n("google_navi.data_not_found", null, "조회된 자료가 없습니다."));
      }
      });
      addRecentSearch(query);
    }, function(error) {
      state.pois = [];
      renderList([]);
      setStatus(error || i18n("google_navi.cannot_search", null, "검색할 수 없습니다."));
      showSnackbar(error || i18n("google_navi.data_not_found", null, "조회된 자료가 없습니다."));
    });
  }
  // SOFTM-GOOGLE: 최근/즐겨찾기 탭 검색창은 외부 장소 검색 대신 현재 목록 필터로 동작. 2026-05-17

  function renderList(pois) {
    var list = byId("poiList");
    if (!list) return;

    state.map.clearMarkers();
    if (!pois || !pois.length) {
      list.innerHTML = "";
      addClass(list, "empty");
      removeClass(list, "no-favorite");
      removeClass(list, "sortable");
      removeClass(list, "destination-label");
      return;
    }

    removeClass(list, "empty");
    if (state.pois.some(function(poi) { return hideFavoriteAction(poi); })) addClass(list, "no-favorite");
    else removeClass(list, "no-favorite");
    var destinationList = isEditableDestinationMode();
    if (destinationList) addClass(list, "destination-label");
    else removeClass(list, "destination-label");
    var sortableFavorite = state.mode === "favorite" && !favoriteFilterQuery();
    if (sortableFavorite) addClass(list, "sortable");
    else removeClass(list, "sortable");
    var html = [];
    for (var i = 0; i < pois.length; i++) {
      var poi = pois[i];
      var isSearch = isSearchHistory(poi);
      var canSort = sortableFavorite && !isSearch;
      html.push(
        '<div class="google-navi-item" data-index="' + i + '">' +
          (canSort ? '<button type="button" class="google-navi-drag-handle" title="' + escapeHtml(i18n("google_navi.change_order", null, "순서 변경")) + '" aria-label="' + escapeHtml(i18n("google_navi.change_order", null, "순서 변경")) + '"></button>' : "") +
          (destinationList ? destinationListBadgeHtml() : '<div class="google-navi-index">' + (isSearch ? "S" : (i + 1)) + "</div>") +
          "<div>" +
            '<div class="google-navi-name">' + escapeHtml(poi.name) + "</div>" +
            '<div class="google-navi-address">' + escapeHtml(isSearch ? i18n("google_navi.search_history", null, "검색 이력") : (poi.address || poi.lat + ", " + poi.lon)) + "</div>" +
          "</div>" +
          '<button type="button" class="google-navi-favorite" title="' + escapeHtml(i18n("label.favorite", null, "즐겨찾기")) + '">' + (isSearch || hideFavoriteAction(poi) ? "" : (poi.favorite ? "★" : "☆")) + "</button>" +
        "</div>"
      );
      if (!isSearch) {
        state.map.addMarker(poi, { label: i + 1, onClick: function(markerPoi) {
          selectPoiById(markerPoi.id);
        }});
      }
    }
    list.innerHTML = html.join("");
    syncSelectedListItem();
  }
  // SOFTM-GOOGLE: 집/회사 탭 목록은 숫자 대신 목적지 아이콘+명칭을 표시하고, 즐겨찾기는 검색어가 없을 때만 드래그 정렬 핸들을 렌더링. 2026-05-19

  function destinationListBadgeHtml() {
    var label = destinationLabel();
    var icon = state.mode === "company" ? "business" : "home";
    return '<div class="google-navi-destination-label"><span class="material-icons" aria-hidden="true">' + icon + '</span><span>' + label + "</span></div>";
  }
  // SOFTM-GOOGLE: home_company_google 집/회사 목록 좌측 표시를 번호에서 아이콘+명칭 배지로 변경. 2026-05-19

  function selectPoi(index, moveMap) {
    var poi = state.pois[index];
    if (!poi) return;
    state.selected = shouldUseIndependentEditPin(poi) ? cloneEditablePoi(poi) : poi;
    state.editPoi = shouldUseIndependentEditPin(poi) ? state.selected : null;
    each(queryAll(".google-navi-item"), function(item) {
      if (parseInt(item.getAttribute("data-index"), 10) === index) addClass(item, "selected");
      else removeClass(item, "selected");
    });
    if (moveMap && !isSearchHistory(poi)) state.map.setCenter(poi, 16);
    state.map.showAllMarkers();
    if (!isSearchHistory(poi)) state.map.highlightMarkerById(poi.id || "");
    else state.map.clearMarkerHighlight();
    if (!isSearchHistory(poi) && (isEditableDestinationMode() || state.mode === "map")) showEditablePin(state.selected);
    if (isEditableDestinationMode() && !isSearchHistory(poi)) {
      updateGuide(i18n("google_navi.guide_select_save", { name: state.selected.name, label: destinationLabel() }, "\"" + state.selected.name + "\" 위치를 선택했습니다. 수정 후 \"" + destinationLabel() + " 저장\"을 누르세요."), EDIT_PIN_GUIDE);
    }
    // SOFTM-GOOGLE: 집/회사 검색 결과 선택 직후 드래그 수정과 저장 흐름을 안내. 2026-05-16
    updatePrimaryButton();
    updateDeleteButton();
    setAddressOverlay(isSearchHistory(poi) ? null : addressText(poi));
    setStatus(isSearchHistory(poi) ? i18n("google_navi.search_history_prefix", { name: poi.name }, "검색 이력: " + poi.name) : i18n("google_navi.selected", { name: poi.name }, poi.name + " 선택됨"));
  }

  function syncSelectedListItem() {
    if (!state.selected) return;
    each(queryAll(".google-navi-item"), function(item) {
      var index = parseInt(item.getAttribute("data-index"), 10);
      var poi = state.pois[index];
      if (poi && poi.id === state.selected.id) addClass(item, "selected");
      else removeClass(item, "selected");
    });
  }
  // SOFTM-GOOGLE: 드래그 정렬로 목록을 다시 그려도 현재 선택 행 강조를 유지. 2026-05-17

  function selectPoiById(id) {
    for (var i = 0; i < state.pois.length; i++) {
      if (state.pois[i].id === id) {
        selectPoi(i, false);
        return;
      }
    }
  }

  function loadSavedDestination(key, label, modeKey) {
    window.googleNaviSavedCallback = function(value) {
      var pois = parseDevicePois(value);
      if (pois.length) {
        state.savedDestination[modeKey] = true;
        state.pois = pois;
        renderList(pois);
        selectPoi(0, true);
        state.map.fitPois(pois);
        updateGuide(i18n("google_navi.guide_to_destination", { name: pois[0].name }, "\"" + pois[0].name + "\"으로 안내합니다."), i18n("google_navi.map_click_to_set", null, "\"지도\"를 클릭해 위치를 지정하세요."));
        setStatus(i18n("google_navi.registered_destination", { label: label }, label + " 목적지가 등록되어 있습니다."));
      } else {
        state.savedDestination[modeKey] = false;
        state.pois = [];
        renderList([]);
        setAddressOverlay(null);
        updateGuide(i18n("google_navi.guide_no_destination", { label: label }, "\"" + label + "\" 목적지가 없습니다."), i18n("google_navi.map_click_to_set", null, "\"지도\"를 클릭해 위치를 지정하세요."));
        setStatus(i18n("google_navi.no_destination_checking_current", { label: label }, label + " 목적지가 없습니다. 현재 위치를 확인 중입니다..."));
        loadLocation({
          center: true,
          select: true,
          resolveAddress: true,
          editableDestinationLabel: label
        });
      }
      updateDeleteButton();
    };
    fn_DeviceLoadData(key, "googleNaviSavedCallback");
  }

  function loadFavorites() {
    waitDb(state.localStorageBasic, function() {
      state.localStorageBasic.allPoi(function(rows) {
        state.favoritePois = normalizeRows(rows);
        for (var i = 0; i < state.favoritePois.length; i++) state.favoritePois[i].favorite = true;
        sortFavoritePois(state.favoritePois);
        applyFavoriteFilter();
      });
    });
  }
  // SOFTM-GOOGLE: 즐겨찾기 목록은 저장된 favoriteOrder 기준으로 정렬한 원본을 보관한 뒤 필터를 적용해 표시. 2026-05-17

  function loadRecent() {
    waitDb(state.localStorageRecent, function() {
      state.localStorageRecent.allPoi(function(rows) {
        var recentPois = normalizeRows(rows);
        sortRecentPois(recentPois);
        state.recentPois = dedupeRecentPois(recentPois);
        applyRecentFilter();
      });
    });
  }
  // SOFTM-GOOGLE: 최근 이력 표시 시 같은 검색어/목적지가 중복 저장되어 있어도 최신 1건만 노출. 2026-05-17

  function applyRecentFilter() {
    var keyword = byId("keyword");
    var query = normalizeRecentSearchName(keyword ? keyword.value : "");
    state.pois = filterRecentPois(state.recentPois || [], query);
    markFavoriteStates(state.pois, function() {
      renderList(state.pois);
      if (state.pois.length) {
        selectPoi(0, !isSearchHistory(state.pois[0]));
        state.map.fitPois(state.pois.filter(function(poi) { return !isSearchHistory(poi); }));
        setStatus(query ? i18n("google_navi.recent_result_count", { count: state.pois.length }, "최근 목적지 " + state.pois.length + "건이 검색되었습니다.") : i18n("google_navi.recent_count", { count: state.pois.length }, "최근 목적지 " + state.pois.length + "건"));
      } else {
        setStatus(query ? i18n("google_navi.no_recent_filter", null, "검색된 최근 목적지가 없습니다.") : i18n("google_navi.no_recent", null, "최근 목적지 목록이 없습니다."));
        setAddressOverlay(null);
      }
    });
  }

  function applyFavoriteFilter() {
    var query = favoriteFilterQuery();
    state.pois = filterFavoritePois(state.favoritePois || [], query);
    renderList(state.pois);
    if (state.pois.length) {
      selectPoi(0, true);
      state.map.fitPois(state.pois);
      setStatus(query ? i18n("google_navi.favorite_result_count", { count: state.pois.length }, "즐겨찾기 " + state.pois.length + "건이 검색되었습니다.") : i18n("google_navi.favorite_count", { count: state.pois.length }, "즐겨찾기 " + state.pois.length + "건"));
    } else {
      setStatus(query ? i18n("google_navi.no_favorite_filter", null, "검색된 즐겨찾기가 없습니다.") : i18n("google_navi.no_favorite", null, "즐겨찾기 목록이 없습니다."));
      setAddressOverlay(null);
    }
  }

  function filterFavoritePois(pois, query) {
    if (!query) return pois.slice(0);
    var output = [];
    for (var i = 0; i < pois.length; i++) {
      if (matchesRecentFilter(pois[i], query)) output.push(pois[i]);
    }
    return output;
  }

  function favoriteFilterQuery() {
    var keyword = byId("keyword");
    return normalizeRecentSearchName(keyword ? keyword.value : "");
  }
  // SOFTM-GOOGLE: 즐겨찾기도 최근 목록과 동일하게 일반 텍스트와 한글 초성 자음으로 필터링. 2026-05-17

  function filterRecentPois(pois, query) {
    if (!query) return pois.slice(0);
    var output = [];
    for (var i = 0; i < pois.length; i++) {
      if (matchesRecentFilter(pois[i], query)) output.push(pois[i]);
    }
    return output;
  }

  function matchesRecentFilter(poi, query) {
    var target = normalizeRecentSearchName((poi.name || "") + " " + (poi.address || ""));
    var normalizedQuery = normalizeRecentSearchName(query);
    if (!target || !normalizedQuery) return false;
    if (target.toLowerCase().indexOf(normalizedQuery.toLowerCase()) >= 0) return true;
    if (isKoreanInitialQuery(normalizedQuery)) {
      return toKoreanInitials(target).indexOf(normalizedQuery.replace(/\s+/g, "")) >= 0;
    }
    return false;
  }

  function isKoreanInitialQuery(value) {
    return /^[ㄱ-ㅎ\s]+$/.test(value || "");
  }

  function toKoreanInitials(value) {
    var initials = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    var output = "";
    value = value || "";
    for (var i = 0; i < value.length; i++) {
      var code = value.charCodeAt(i);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        output += initials.charAt(Math.floor((code - 0xAC00) / 588));
      } else if (/^[ㄱ-ㅎ]$/.test(value.charAt(i))) {
        output += value.charAt(i);
      }
    }
    return output;
  }
  // SOFTM-GOOGLE: 최근 목적지는 일반 텍스트와 한글 초성 자음만으로도 필터 가능하게 처리. 2026-05-17

  function primaryAction() {
    var poi = state.selected;
    if (!poi) {
      setStatus(i18n("google_navi.select_destination_first", null, "먼저 목적지를 선택하세요."));
      showSnackbar(i18n("google_navi.select_destination_first", null, "먼저 목적지를 선택하세요."));
      return;
    }

    if (state.mode === "home") {
      saveDestination("_POI_HOME", editableSavePoi(poi), destinationLabelForMode("home"), "home");
    } else if (state.mode === "company") {
      saveDestination("_POI_COMPANY", editableSavePoi(poi), destinationLabelForMode("company"), "company");
    } else if (state.mode === "favorite") {
      if (poi.favorite) requestRemoveFavorite(poi);
      else toggleFavorite(poi);
    } else if (state.mode === "recent" && isSearchHistory(poi)) {
      openSearchHistory(poi);
    } else {
      toggleFavorite(poi);
    }
  }
  // SOFTM-GOOGLE: 즐겨찾기 탭 현재 위치 핀은 삭제가 아니라 즐겨찾기 추가 동작으로 처리. 2026-05-17

  function editableSavePoi(poi) {
    return isEditableDestinationMode() && state.editPoi ? state.editPoi : poi;
  }
  // SOFTM-GOOGLE: 집/회사 저장 시 목록 원본이 아닌 드래그 수정 핀의 최신 위치를 우선 저장. 2026-05-16

  function secondaryAction() {
    if (state.mode === "home" || state.mode === "company") {
      deleteSavedDestination();
      return;
    }
    if (state.selected && state.selected.favorite) {
      editFavoriteName(state.selected);
    }
  }
  // SOFTM-GOOGLE: 하단 보조 버튼을 집/회사 삭제와 즐겨찾기 이름 수정 용도로 분기. 2026-05-16

  function saveDestination(key, poi, label, modeKey) {
    var saved = toStoredPoi(poi, modeKey);
    var savedPoi = rowToPoi(saved) || poi;
    fn_DeviceSaveData(key, JSON.stringify([saved]));
    fn_DeviceSaveData("_USING_REG_HOME", true);
    state.savedDestination[modeKey] = true;
    // SOFTM-GOOGLE: 집/회사 저장 직후 현재 등록 목적지 1건으로 화면을 즉시 갱신. 2026-05-16
    state.selected = savedPoi;
    state.pois = [savedPoi];
    renderList(state.pois);
    selectPoi(0, true);
    state.map.fitPois(state.pois);
    updateDeleteButton();
    updateGuide(i18n("google_navi.guide_to_destination", { name: savedPoi.name }, "\"" + savedPoi.name + "\"으로 안내합니다."), i18n("google_navi.map_click_to_set", null, "\"지도\"를 클릭해 위치를 지정하세요."));
    setStatus(i18n("google_navi.saved_destination", { label: label, name: savedPoi.name }, label + " 목적지를 저장했습니다. 현재 " + label + ": " + savedPoi.name));
    setAddressOverlay(addressText(savedPoi));
    showSnackbar(i18n("google_navi.destination_saved", { label: label }, label + " 목적지가 저장되었습니다."));
  }

  function deleteSavedDestination() {
    var key = "";
    var otherKey = "";
    var modeKey = "";
    var label = "";
    if (state.mode === "home") {
      key = "_POI_HOME";
      otherKey = "_POI_COMPANY";
      modeKey = "home";
      label = destinationLabelForMode("home");
    } else if (state.mode === "company") {
      key = "_POI_COMPANY";
      otherKey = "_POI_HOME";
      modeKey = "company";
      label = destinationLabelForMode("company");
    } else {
      return;
    }

    fn_DeviceSaveData(key, "");
    state.savedDestination[modeKey] = false;
    state.selected = null;
    state.editPoi = null;
    state.pois = [];
    renderList([]);
    state.map.clearEditablePin();
    setAddressOverlay(null);
    updateDeleteButton();
    updateGuide(i18n("google_navi.guide_no_destination", { label: label }, "\"" + label + "\" 목적지가 없습니다."), i18n("google_navi.map_click_to_set", null, "\"지도\"를 클릭해 위치를 지정하세요."));
    window.googleNaviOtherDestinationCallback = function(value) {
      fn_DeviceSaveData("_USING_REG_HOME", parseDevicePois(value).length > 0);
    };
    fn_DeviceLoadData(otherKey, "googleNaviOtherDestinationCallback");
    setStatus(i18n("google_navi.destination_deleted_status", { label: label }, label + " 목적지를 삭제했습니다."));
    showSnackbar(i18n("google_navi.destination_deleted", { label: label }, label + " 목적지가 삭제되었습니다."));
  }

  function toggleFavorite(poi) {
    waitDb(state.localStorageBasic, function() {
      if (isSearchHistory(poi)) {
        setStatus(i18n("google_navi.search_history_cannot_favorite", null, "검색 이력은 즐겨찾기에 추가할 수 없습니다."));
        return;
      }
      var favoriteId = stablePoiId(poi);
      state.localStorageBasic.getPoiCount("id", favoriteId, function(count) {
        if (count > 0) {
          requestRemoveFavorite(poi);
        } else {
          addFavoriteWithName(poi);
        }
      });
    });
  }

  function addFavoriteWithName(poi) {
    prepareFavoriteName(poi, function(defaultName) {
      inputDialog(i18n("google_navi.favorite_name", null, "즐겨찾기 이름"), defaultName, function(name) {
        if (!name) {
          setStatus(i18n("google_navi.favorite_add_canceled", null, "즐겨찾기 추가를 취소했습니다."));
          showSnackbar(i18n("google_navi.favorite_add_canceled", null, "즐겨찾기 추가를 취소했습니다."));
          return;
        }
        var favoritePoi = cloneEditablePoi(poi);
        favoritePoi.name = name;
        favoritePoi.favoriteOrder = nextFavoriteOrder();
        var row = toStoredPoi(favoritePoi, "favorite");
        state.localStorageBasic.addPoi(row, function(ok) {
          if (ok) {
            poi.name = favoritePoi.name;
            poi.favorite = true;
            poi.favoriteOrder = favoritePoi.favoriteOrder;
            state.selected = favoritePoi;
            state.selected.favorite = true;
            if (state.mode === "favorite") {
              loadFavorites();
            } else {
              renderList(state.pois);
              selectPoiById(poi.id);
            }
            updatePrimaryButton();
            updateDeleteButton();
            setStatus(i18n("google_navi.favorite_added_status", { name: favoritePoi.name }, "즐겨찾기에 추가했습니다: " + favoritePoi.name));
            showSnackbar(i18n("google_navi.favorite_registered", null, "즐겨찾기가 등록되었습니다."));
            syncFavoritesForOverlay(true);
          } else {
            setStatus(i18n("google_navi.favorite_already_registered", null, "이미 즐겨찾기에 등록되어 있습니다."));
            showSnackbar(i18n("google_navi.favorite_already_registered", null, "이미 즐겨찾기에 등록되어 있습니다."));
          }
        });
      });
    });
  }
  // SOFTM-GOOGLE: 새 즐겨찾기는 정렬값을 부여해 즐겨찾기 목록 맨 위에 표시. 2026-05-17

  function editFavoriteName(poi) {
    if (!poi || isSearchHistory(poi)) return;
    inputDialog(i18n("google_navi.favorite_name_edit", null, "즐겨찾기 이름 수정"), favoriteDefaultName(poi), function(name) {
      if (!name) {
        setStatus(i18n("google_navi.favorite_edit_canceled", null, "즐겨찾기 이름 수정을 취소했습니다."));
        showSnackbar(i18n("google_navi.favorite_edit_canceled", null, "즐겨찾기 이름 수정을 취소했습니다."));
        return;
      }
      var edited = cloneEditablePoi(poi);
      edited.name = name;
      edited.favoriteOrder = nextFavoriteOrder();
      waitDb(state.localStorageBasic, function() {
        deleteFavoriteRows(poi, function() {
          addEditedFavorite(edited, poi);
        });
      });
    });
  }

  function addEditedFavorite(edited, originalPoi) {
    var row = toStoredPoi(edited, "favorite");
    state.localStorageBasic.addPoi(row, function(ok) {
      if (!ok) {
        setStatus(i18n("google_navi.favorite_edit_failed", null, "즐겨찾기 이름을 수정할 수 없습니다."));
        showSnackbar(i18n("google_navi.favorite_edit_failed", null, "즐겨찾기 이름을 수정할 수 없습니다."));
        return;
      }
      originalPoi.name = edited.name;
      originalPoi.favorite = true;
      originalPoi.favoriteOrder = edited.favoriteOrder;
      state.selected = originalPoi;
      renderList(state.pois);
      selectPoiById(originalPoi.id);
      updatePrimaryButton();
      updateDeleteButton();
      setStatus(i18n("google_navi.favorite_edit_status", { name: edited.name }, "즐겨찾기 이름을 수정했습니다: " + edited.name));
      showSnackbar(i18n("google_navi.favorite_edit_done", null, "즐겨찾기 이름이 수정되었습니다."));
      syncFavoritesForOverlay(false);
      if (state.mode === "favorite") loadFavorites();
    });
  }
  // SOFTM-GOOGLE: 즐겨찾기 이름 수정 후 재저장된 항목도 정렬값을 갱신해 맨 위로 이동. 2026-05-17

  function deleteFavoriteRows(poi, callback) {
    var ids = uniqueValues([stablePoiId(poi), poi && poi.id]);
    var keys = uniqueValues([poi && poi.key, poiKey(poi), stablePoiId(poi) + "_" + (poi && poi.name || "")]);
    deleteByIndexValues("id", ids, function() {
      deleteByIndexValues("key", keys, function() {
        window.setTimeout(function() {
          if (callback) callback();
        }, 0);
      });
    });
  }

  function deleteByIndexValues(indexName, values, callback) {
    var index = 0;
    function next() {
      if (index >= values.length) {
        if (callback) callback();
        return;
      }
      var value = values[index++];
      if (!value) {
        next();
        return;
      }
      state.localStorageBasic.delPoi(indexName, value, next);
    }
    next();
  }

  function uniqueValues(values) {
    var seen = {};
    var output = [];
    for (var i = 0; i < values.length; i++) {
      var value = values[i] == null ? "" : String(values[i]);
      if (!value || seen[value]) continue;
      seen[value] = true;
      output.push(value);
    }
    return output;
  }
  // SOFTM-GOOGLE: 즐겨찾기 이름 수정 시 저장 row의 기존 id/key 후보를 모두 제거한 뒤 새 이름으로 교체 저장. 2026-05-16

  /** SOFTM-FAVORITESYNC START: Google 즐겨찾기 변경 후 오버레이가 읽는 _POIS_FAVORITE를 즉시 동기화한다. 2026-05-19 */
  function syncFavoritesForOverlay(expandSub, callback) {
    waitDb(state.localStorageBasic, function() {
      state.localStorageBasic.allPoi(function(rows) {
        fn_DeviceSaveData("_POIS_FAVORITE", JSON.stringify(favoriteRowsForOverlay(rows)));
        refreshFavoriteOverlay(expandSub);
        if (callback) callback(true);
      });
    }, function() {
      if (callback) callback(false);
    });
  }

  function favoriteRowsForOverlay(rows) {
    var pois = normalizeRows(rows);
    sortFavoritePois(pois);
    var output = [];
    for (var i = 0; i < pois.length; i++) {
      output.push(toStoredPoi(pois[i], "favorite"));
    }
    return output;
  }

  function refreshFavoriteOverlay(expandSub) {
    if (typeof fn_OpenOverlayView === "function") fn_OpenOverlayView(!!expandSub);
  }
  /** SOFTM-FAVORITESYNC END */

  function bindFavoriteSortDrag(list) {
    if (window.PointerEvent) {
      list.onpointerdown = startFavoriteSortDrag;
      return;
    }
    list.onmousedown = startFavoriteSortDrag;
    list.ontouchstart = startFavoriteSortDrag;
  }

  function startFavoriteSortDrag(event) {
    if (state.mode !== "favorite") return;
    if (favoriteFilterQuery()) return;
    var target = event.target || event.srcElement;
    var handle = closestByClass(target, "google-navi-drag-handle");
    if (!handle) return;
    var item = closestByClass(handle, "google-navi-item");
    if (!item) return;
    var index = parseInt(item.getAttribute("data-index"), 10);
    if (isNaN(index) || !state.pois[index]) return;

    event.preventDefault();
    event.stopPropagation();
    state.favoriteDrag = {
      index: index,
      changed: false,
      ignoreClick: true,
      type: event.type
    };
    addClass(byId("poiList"), "sorting");
    addClass(item, "dragging");
    bindFavoriteSortMoveEvents(event.type);
  }

  function bindFavoriteSortMoveEvents(type) {
    if (type === "pointerdown") {
      document.onpointermove = moveFavoriteSortDrag;
      document.onpointerup = endFavoriteSortDrag;
      document.onpointercancel = endFavoriteSortDrag;
      return;
    }
    if (type === "touchstart") {
      document.ontouchmove = moveFavoriteSortDrag;
      document.ontouchend = endFavoriteSortDrag;
      document.ontouchcancel = endFavoriteSortDrag;
      return;
    }
    document.onmousemove = moveFavoriteSortDrag;
    document.onmouseup = endFavoriteSortDrag;
  }

  function moveFavoriteSortDrag(event) {
    if (!state.favoriteDrag || state.mode !== "favorite") return;
    var y = eventClientY(event);
    if (y == null) return;
    event.preventDefault();
    var targetIndex = favoriteIndexAtY(y);
    if (targetIndex < 0 || targetIndex === state.favoriteDrag.index) return;
    var moved = state.pois.splice(state.favoriteDrag.index, 1)[0];
    state.pois.splice(targetIndex, 0, moved);
    state.favoriteDrag.index = targetIndex;
    state.favoriteDrag.changed = true;
    renderList(state.pois);
    markFavoriteDraggingItem(targetIndex);
  }

  function endFavoriteSortDrag(event) {
    if (event && event.preventDefault) event.preventDefault();
    var drag = state.favoriteDrag;
    clearFavoriteSortMoveEvents();
    removeClass(byId("poiList"), "sorting");
    each(queryAll(".google-navi-item"), function(item) {
      removeClass(item, "dragging");
    });
    if (!drag) return;
    ignoreNextFavoriteClick();
    if (!drag.changed) return;
    state.favoritePois = state.pois.slice(0);
    saveFavoriteOrder(function(ok) {
      if (ok) {
        setStatus(i18n("google_navi.favorite_order_saved", null, "즐겨찾기 순서를 저장했습니다."));
        showSnackbar(i18n("google_navi.favorite_order_saved", null, "즐겨찾기 순서를 저장했습니다."));
      } else {
        setStatus(i18n("google_navi.favorite_order_save_failed", null, "즐겨찾기 순서를 저장할 수 없습니다."));
        showSnackbar(i18n("google_navi.favorite_order_save_failed", null, "즐겨찾기 순서를 저장할 수 없습니다."));
      }
    });
  }
  // SOFTM-GOOGLE: 즐겨찾기 정렬 직후 필터 원본 목록도 같은 순서로 갱신해 검색 시 순서가 되돌아가지 않도록 처리. 2026-05-17

  function clearFavoriteSortMoveEvents() {
    document.onpointermove = null;
    document.onpointerup = null;
    document.onpointercancel = null;
    document.ontouchmove = null;
    document.ontouchend = null;
    document.ontouchcancel = null;
    document.onmousemove = null;
    document.onmouseup = null;
  }

  function ignoreNextFavoriteClick() {
    state.favoriteDrag = { ignoreClick: true };
    window.setTimeout(function() {
      if (state.favoriteDrag && state.favoriteDrag.ignoreClick) state.favoriteDrag = null;
    }, 300);
  }

  function eventClientY(event) {
    if (event && event.touches && event.touches.length) return event.touches[0].clientY;
    if (event && event.changedTouches && event.changedTouches.length) return event.changedTouches[0].clientY;
    if (event && typeof event.clientY === "number") return event.clientY;
    return null;
  }

  function favoriteIndexAtY(y) {
    var items = queryAll(".google-navi-item");
    if (!items.length) return -1;
    for (var i = 0; i < items.length; i++) {
      var rect = items[i].getBoundingClientRect();
      if (y < rect.top + rect.height / 2) return i;
    }
    return items.length - 1;
  }

  function markFavoriteDraggingItem(index) {
    var items = queryAll(".google-navi-item");
    for (var i = 0; i < items.length; i++) {
      if (i === index) addClass(items[i], "dragging");
      else removeClass(items[i], "dragging");
    }
  }

  function saveFavoriteOrder(callback) {
    waitDb(state.localStorageBasic, function() {
      var db = state.localStorageBasic.db;
      if (!db) {
        if (callback) callback(false);
        return;
      }
      var baseOrder = nextFavoriteOrder() + state.pois.length;
      var orderByDbId = {};
      var orderByKey = {};
      var orderById = {};
      for (var i = 0; i < state.pois.length; i++) {
        var poi = state.pois[i];
        var order = baseOrder - i;
        poi.favoriteOrder = order;
        if (poi.dbId) orderByDbId[String(poi.dbId)] = order;
        orderByKey[poi.key || poiKey(poi)] = order;
        orderById[stablePoiId(poi)] = order;
      }
      var transaction = db.transaction([state.localStorageBasic.dbname], "readwrite");
      var store = transaction.objectStore(state.localStorageBasic.dbname);
      store.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (!cursor) return;
        var row = cursor.value;
        var rowOrder = null;
        if (row && row._id && orderByDbId[String(row._id)]) rowOrder = orderByDbId[String(row._id)];
        else if (row && row.key && orderByKey[row.key]) rowOrder = orderByKey[row.key];
        else if (row && row.id && orderById[row.id]) rowOrder = orderById[row.id];
        if (rowOrder != null) {
          row.favoriteOrder = rowOrder;
          cursor.update(row);
        }
        cursor.continue();
      };
      transaction.oncomplete = function() {
        syncFavoritesForOverlay(false, function() {
          if (callback) callback(true);
        });
      };
      transaction.onerror = function() {
        if (callback) callback(false);
      };
    }, function() {
      if (callback) callback(false);
    });
  }

  function sortFavoritePois(pois) {
    pois.sort(function(a, b) {
      return favoriteOrderValue(b) - favoriteOrderValue(a);
    });
  }

  function favoriteOrderValue(poi) {
    var order = parseFloat(poi && poi.favoriteOrder);
    if (!isNaN(order) && order > 0) return order;
    var created = toTime(poi && poi.created);
    if (created) return created;
    var dbId = parseFloat(poi && poi.dbId);
    if (!isNaN(dbId)) return dbId;
    return 0;
  }

  function nextFavoriteOrder() {
    return new Date().getTime();
  }
  // SOFTM-GOOGLE: 즐겨찾기 목록은 드래그 핸들로 순서를 바꾸고 IndexedDB row의 favoriteOrder에 저장. 2026-05-17

  function prepareFavoriteName(poi, callback) {
    if (!isGenericPoiName(poi)) {
      callback(favoriteDefaultName(poi));
      return;
    }
    if (poi.address && !looksLikeCoordinate(poi.address)) {
      callback(favoriteDefaultName(poi));
      return;
    }
    state.map.resolvePinLocation(poi.lat, poi.lon, function(resolved) {
      applyResolvedLocation(poi, resolved, poi.name, poi.address, poi.lat, poi.lon);
      setAddressOverlay(addressText(poi));
      callback(favoriteDefaultName(poi));
    });
  }

  function favoriteDefaultName(poi) {
    if (!poi) return i18n("google_navi.favorite_default_location", null, "즐겨찾기 위치");
    if (!isGenericPoiName(poi)) return poi.name;
    var fromAddress = shortNameFromAddress(poi.address || poi.fullAddress || "");
    if (fromAddress) return fromAddress;
    if (poi.id === "current" || trim(poi.name || "") === i18n("google_navi.current_location", null, "현재 위치")) return i18n("google_navi.my_location_name", null, "내 위치");
    return i18n("google_navi.specified_location", null, "지정 위치");
  }

  function isGenericPoiName(poi) {
    if (!poi || !poi.name) return true;
    var name = trim(poi.name);
    return !name ||
      name === i18n("google_navi.current_location", null, "현재 위치") ||
      name === i18n("google_navi.map_point_generic", null, "지도 지정 위치") ||
      name.indexOf(i18n("google_navi.specified_location", null, "지정 위치")) >= 0 ||
      looksLikeCoordinate(name);
  }

  function shortNameFromAddress(address) {
    address = trim(address || "").replace(/^대한민국\s*/, "");
    if (!address || looksLikeCoordinate(address)) return "";
    var parts = address.split(/\s+/);
    if (parts.length <= 2) return address;
    return parts.slice(Math.max(0, parts.length - 2)).join(" ");
  }

  function looksLikeCoordinate(value) {
    return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trim(value || ""));
  }
  // SOFTM-GOOGLE: 현재 위치 기반 즐겨찾기는 주변 POI/주소 기반 이름을 제안하고 사용자가 직접 수정해 저장. 2026-05-17

  function showEditablePin(poi) {
    if (!poi || isSearchHistory(poi)) return;
    state.map.clearMyLocation();
    // SOFTM-GOOGLE: 집/회사/지도 탭에서 목록 마커와 독립된 드래그 수정 핀을 표시하고, 드래그 시 검색 결과는 유지. 2026-05-16
    state.map.setEditablePin(poi, function(lat, lon) {
      var fallbackName = poi.name || "";
      var fallbackAddress = poi.address || "";
      var resolveSeq = ++state.pinResolveSeq;
      poi.lat = lat;
      poi.lon = lon;
      state.selected = poi;
      state.editPoi = poi;
      state.map.resolvePinLocation(lat, lon, function(resolved) {
        if (resolveSeq !== state.pinResolveSeq) return;
        applyResolvedLocation(poi, resolved, fallbackName, fallbackAddress, lat, lon);
        setAddressOverlay(draggedAddressText(poi));
        if (!isEditableDestinationMode() && state.mode !== "map") {
          renderList(state.pois);
          selectPoiById(poi.id);
        } else if (isEditableDestinationMode()) {
          updateGuide(i18n("google_navi.guide_modified", { name: poi.name }, "\"" + poi.name + "\" 위치를 수정했습니다."), i18n("google_navi.guide_after_modify_save", { label: destinationLabel() }, "수정 후 \"" + destinationLabel() + " 저장\"을 누르세요."));
        }
        setStatus(i18n("google_navi.pin_adjusted_status", null, "핀 위치를 수정했습니다."));
        showSnackbar(i18n("google_navi.pin_adjusted", null, "핀 위치를 조정했습니다."));
      });
    });
  }
  // SOFTM-GOOGLE: 모든 편집 가능 화면에서 빨간 수정 핀 드래그 후 주변 POI/상세주소를 다시 반영. 2026-05-17

  function shouldUseIndependentEditPin(poi) {
    return !!poi && !isSearchHistory(poi) && (isEditableDestinationMode() || state.mode === "map");
  }
  // SOFTM-GOOGLE: 지도 탭 검색 결과 선택 후 편집 핀 이동 시 원본 검색 목록/마커를 변경하지 않도록 분리. 2026-05-16

  function applyResolvedLocation(poi, resolved, fallbackName, fallbackAddress, lat, lon) {
    var place = resolved && resolved.place ? resolved.place : null;
    var geocodeAddress = resolved && resolved.address ? resolved.address : "";
    var placeAddress = place && place.address ? place.address : "";
    var address = bestAddress(geocodeAddress, placeAddress) || fallbackAddress || (lat + ", " + lon);
    var geocodeName = draggedLocationName(resolved && resolved.geocodeResult, address);
    var placeName = place && place.name ? place.name : "";

    if (placeName && !looksLikeCoordinate(placeName)) {
      poi.name = placeName;
      poi.nearbyPlaceId = place.id || "";
    } else if (geocodeName && !looksLikeCoordinate(geocodeName)) {
      poi.name = geocodeName;
    } else {
      poi.name = fallbackName || poi.name || i18n("google_navi.specified_location", null, "지정 위치");
    }
    poi.address = address;
  }

  function bestAddress(geocodeAddress, placeAddress) {
    geocodeAddress = trim(geocodeAddress || "");
    placeAddress = trim(placeAddress || "");
    if (!geocodeAddress || looksLikeCoordinate(geocodeAddress)) return placeAddress;
    if (!placeAddress || looksLikeCoordinate(placeAddress)) return geocodeAddress;
    if (placeAddress.length > geocodeAddress.length && placeAddress.indexOf(geocodeAddress) < 0) return placeAddress;
    return geocodeAddress;
  }
  // SOFTM-GOOGLE: 핀 좌표 해석 결과에서 주변 POI명과 가장 상세한 주소를 조합해 표시/저장값에 반영. 2026-05-17

  function draggedLocationName(result, fallback) {
    if (!result || !result.address_components) return fallback || "";
    var components = result.address_components;
    var preferredTypes = ["premise", "point_of_interest", "establishment", "route", "sublocality_level_2", "sublocality_level_1", "locality"];
    for (var i = 0; i < preferredTypes.length; i++) {
      for (var j = 0; j < components.length; j++) {
        if (components[j].types && components[j].types.indexOf(preferredTypes[i]) >= 0) {
          return components[j].long_name || fallback || "";
        }
      }
    }
    return fallback || "";
  }

  function draggedAddressText(poi) {
    if (!poi) return "";
    if (state.pageType === "search" && state.mode === "map") {
      if (poi.name && poi.address && poi.name !== poi.address) return poi.name + "\n" + poi.address;
      return poi.name || poi.address || poi.fullAddress || (poi.lat && poi.lon ? poi.lat + ", " + poi.lon : "");
    }
    return addressText(poi);
  }
  // SOFTM-GOOGLE: search_google 지도 탭 드래그 후 하단 위치 표시에 주변 POI명과 세부주소를 함께 노출. 2026-05-17

  function cloneEditablePoi(poi) {
    var cloned = makePoi(poi.name, poi.lat, poi.lon, poi.address || "", poi.id);
    cloned.key = poi.key;
    cloned.dbId = poi.dbId || null; // SOFTM-GOOGLE: 이름 수정 시 원본 DB row 식별자를 유지. 2026-05-16
    cloned.favoriteOrder = poi.favoriteOrder != null ? poi.favoriteOrder : null; // SOFTM-GOOGLE: 이름 수정/정렬 저장 시 기존 정렬값을 유지. 2026-05-17
    cloned.favorite = poi.favorite;
    cloned.gubun = poi.gubun;
    return cloned;
  }

  function hideFavoriteAction(poi) {
    return !!poi && state.pageType === "home" && (state.mode === "home" || state.mode === "company");
  }

  function isEditableDestinationMode() {
    return state.pageType === "home" && (state.mode === "home" || state.mode === "company");
  }

  function destinationLabel() {
    if (state.mode === "home") return destinationLabelForMode("home");
    if (state.mode === "company") return destinationLabelForMode("company");
    return "";
  }

  function destinationLabelForMode(mode) {
    if (mode === "home") return i18n("label.home", null, "집");
    if (mode === "company") return i18n("label.company", null, "회사");
    return "";
  }

  function removeFavorite(poi) {
    waitDb(state.localStorageBasic, function() {
      deleteFavoriteRows(poi, function() {
        syncFavoritesForOverlay(false, function() {
          afterRemoveFavorite(poi);
        });
      });
    });
  }

  function afterRemoveFavorite(poi) {
    setStatus(i18n("google_navi.favorite_removed_status", null, "즐겨찾기에서 삭제했습니다."));
    showSnackbar(i18n("google_navi.favorite_removed", null, "즐겨찾기가 삭제되었습니다."));
    if (state.mode === "favorite") loadFavorites();
    else {
      poi.favorite = false;
      renderList(state.pois);
      selectPoiById(poi.id);
      updatePrimaryButton();
      updateDeleteButton();
      setStatus(i18n("google_navi.favorite_removed_status", null, "즐겨찾기에서 삭제했습니다."));
    }
  }
  // SOFTM-GOOGLE: 즐겨찾기 삭제도 이름 변경 전후 id/key 후보를 모두 확인해 처리. 2026-05-16

  function requestRemoveFavorite(poi) {
    confirmDialog(i18n("google_navi.confirm_remove_favorite", null, "즐겨찾기를 삭제 하시겠습니까?"), function(ok) {
      if (!ok) {
        setStatus(i18n("google_navi.favorite_remove_canceled", null, "즐겨찾기 삭제를 취소했습니다."));
        showSnackbar(i18n("google_navi.favorite_remove_canceled", null, "즐겨찾기 삭제를 취소했습니다."));
        return;
      }
      removeFavorite(poi);
    });
  }

  function confirmDialog(message, callback) {
    var old = byId("googleNaviConfirm");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var backdrop = document.createElement("div");
    backdrop.id = "googleNaviConfirm";
    backdrop.className = "google-navi-dialog-backdrop";
    backdrop.innerHTML =
      '<div class="google-navi-dialog" role="dialog" aria-modal="true">' +
        '<div class="google-navi-dialog-message">' + escapeHtml(message) + "</div>" +
        '<div class="google-navi-dialog-actions">' +
          '<button type="button" class="google-navi-dialog-action" data-answer="no">' + escapeHtml(i18n("google_navi.dialog_no", null, "아니오")) + '</button>' +
          '<button type="button" class="google-navi-dialog-action" data-answer="yes">' + escapeHtml(i18n("google_navi.dialog_yes", null, "예")) + '</button>' +
        "</div>" +
      "</div>";
    backdrop.onclick = function(event) {
      var target = event.target || event.srcElement;
      if (!target || !target.getAttribute) return;
      var answer = target.getAttribute("data-answer");
      if (!answer) return;
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      callback(answer === "yes");
    };
    document.body.appendChild(backdrop);
  }
  // SOFTM-GOOGLE: 즐겨찾기 삭제 버튼과 목록 별 아이콘 삭제 모두 확인 다이얼로그를 거치도록 처리. 2026-05-16

  function inputDialog(title, value, callback) {
    var old = byId("googleNaviInputDialog");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var backdrop = document.createElement("div");
    backdrop.id = "googleNaviInputDialog";
    backdrop.className = "google-navi-dialog-backdrop";
    backdrop.innerHTML =
      '<div class="google-navi-dialog google-navi-input-dialog" role="dialog" aria-modal="true">' +
        '<label class="google-navi-dialog-message" for="googleNaviNameInput">' + escapeHtml(title) + "</label>" +
        '<input id="googleNaviNameInput" class="google-navi-dialog-input" type="text" maxlength="60" value="' + escapeHtml(value || "") + '">' +
        '<div class="google-navi-dialog-actions">' +
          '<button type="button" class="google-navi-dialog-action" data-answer="cancel">' + escapeHtml(i18n("google_navi.dialog_cancel", null, "취소")) + '</button>' +
          '<button type="button" class="google-navi-dialog-action" data-answer="ok">' + escapeHtml(i18n("google_navi.dialog_ok", null, "저장")) + '</button>' +
        "</div>" +
      "</div>";
    backdrop.onclick = function(event) {
      var target = event.target || event.srcElement;
      if (!target || !target.getAttribute) return;
      var answer = target.getAttribute("data-answer");
      if (!answer) return;
      var input = byId("googleNaviNameInput");
      var name = answer === "ok" ? trim(input ? input.value : "") : "";
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      callback(name);
    };
    document.body.appendChild(backdrop);
    window.setTimeout(function() {
      var input = byId("googleNaviNameInput");
      if (input) {
        input.onkeydown = function(event) {
          event = event || window.event;
          if ((event.key && event.key === "Enter") || event.keyCode === 13) {
            var saveButton = backdrop.querySelector('[data-answer="ok"]');
            if (saveButton) saveButton.click();
          }
        };
        input.focus();
        input.select();
      }
    }, 30);
  }
  // SOFTM-GOOGLE: 즐겨찾기 위치명 입력 다이얼로그에서 저장 버튼과 키보드 Enter 저장을 모두 지원. 2026-05-16

  function markFavoriteStates(pois, callback) {
    // SOFTM-GOOGLE: 검색/최근 목록에서 기존 즐겨찾기 여부를 DB 기준으로 표시. 2026-05-16
    if (!pois || !pois.length) {
      callback();
      return;
    }
    waitDb(state.localStorageBasic, function() {
      var left = pois.length;
      for (var i = 0; i < pois.length; i++) {
        (function(poi) {
          if (isSearchHistory(poi)) {
            left--;
            if (left === 0) callback();
            return;
          }
          state.localStorageBasic.getPoiCount("id", stablePoiId(poi), function(count) {
            poi.favorite = count > 0;
            left--;
            if (left === 0) callback();
          });
        })(pois[i]);
      }
    }, callback);
  }

  function updateDeleteButton() {
    var btnDelete = byId("btnDelete");
    if (!btnDelete) return;
    var visible = (state.selected && state.selected.favorite && state.mode !== "home" && state.mode !== "company") ||
      (state.mode === "home" && state.savedDestination.home) ||
      (state.mode === "company" && state.savedDestination.company);
    btnDelete.innerHTML = (state.selected && state.selected.favorite && state.mode !== "home" && state.mode !== "company") ? i18n("google_navi.edit_name", null, "이름 수정") : i18n("google_navi.delete", null, "삭제");
    btnDelete.className = (state.selected && state.selected.favorite && state.mode !== "home" && state.mode !== "company") ? "google-navi-button" : "google-navi-button danger";
    btnDelete.style.display = visible ? "block" : "none";
  }

  function addRecentSearch(query) {
    query = normalizeRecentSearchName(query);
    if (!query) return;
    waitDb(state.localStorageRecent, function() {
      var row = {
        id: recentSearchId(query),
        name: query,
        lat: null,
        lon: null,
        address: "",
        gubun: NaviGubun.SEARCH
      };
      deleteRecentSearchRows(query, function() {
        state.localStorageRecent.addPoi(row);
      });
    });
  }
  // SOFTM-GOOGLE: 검색어 이력은 네이티브 저장과 중복하지 않고 recent DB에서 같은 검색어를 교체 저장. 2026-05-17

  function deleteRecentSearchRows(query, callback) {
    var normalized = normalizeRecentSearchName(query).toLowerCase();
    var storage = state.localStorageRecent;
    if (!storage || !storage.db) {
      if (callback) callback();
      return;
    }

    var transaction = storage.db.transaction([storage.dbname], "readwrite");
    var store = transaction.objectStore(storage.dbname);
    store.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (!cursor) return;
      var row = cursor.value;
      if (row && isSearchHistory(row) && normalizeRecentSearchName(row.name).toLowerCase() === normalized) {
        cursor.delete();
      }
      cursor.continue();
    };
    transaction.oncomplete = function() {
      if (callback) callback();
    };
    transaction.onerror = function() {
      state.localStorageRecent.delPoi("name", query, callback);
    };
  }

  function recentSearchId(query) {
    return "search_" + normalizeRecentSearchName(query).toLowerCase();
  }

  function sortRecentPois(pois) {
    pois.sort(function(a, b) {
      var aTime = toTime(a && a.created);
      var bTime = toTime(b && b.created);
      if (aTime !== bTime) return bTime - aTime;
      var aDbId = parseFloat(a && a.dbId);
      var bDbId = parseFloat(b && b.dbId);
      if (!isNaN(aDbId) && !isNaN(bDbId)) return bDbId - aDbId;
      return 0;
    });
  }

  function dedupeRecentPois(pois) {
    var seen = {};
    var output = [];
    for (var i = 0; i < pois.length; i++) {
      var key = recentDedupKey(pois[i]);
      if (!key || seen[key]) continue;
      seen[key] = true;
      output.push(pois[i]);
    }
    return output;
  }

  function recentDedupKey(poi) {
    if (!poi) return "";
    if (isSearchHistory(poi)) return "search:" + normalizeRecentSearchName(poi.name).toLowerCase();
    return "poi:" + stablePoiId(poi);
  }

  function normalizeRecentSearchName(value) {
    return trim(value || "").replace(/\s+/g, " ");
  }
  // SOFTM-GOOGLE: 최근 탭은 최신순 정렬 후 검색어/목적지 기준으로 중복을 접어 표시. 2026-05-17

  function addRecentPoiAndStart(poi) {
    waitDb(state.localStorageRecent, function() {
      var row = toStoredPoi(poi);
      row.key = poiKey(poi);
      state.localStorageRecent.delPoi("key", row.key, function() {
        state.localStorageRecent.addPoi(row, function() {
          state.localStorageRecent.allPoi(function(rows) {
            var sorted = rows.sort(function(a, b) {
              return toTime(b.created) - toTime(a.created);
            });
            fn_DeviceSaveData("_POI_RECENT", JSON.stringify([row]));
            fn_DeviceSaveData("_POIS_RECENT", JSON.stringify(sorted));
            startNavi(poi);
          });
        });
      });
    });
  }

  function startSelectedNavi() {
    if (!state.selected) {
      setStatus(i18n("google_navi.select_destination_first", null, "먼저 목적지를 선택하세요."));
      showSnackbar(i18n("google_navi.no_address_to_guide", null, "안내할 주소가 없습니다."));
      return;
    }
    if (isSearchHistory(state.selected)) {
      openSearchHistory(state.selected);
      return;
    }
    addRecentPoiAndStart(state.selected);
  }

  function startNavi(poi) {
    if (!poi) return;
    setStatus(i18n("google_navi.navi_starting", { name: poi.name }, "내비게이션을 시작합니다: " + poi.name));
    showSnackbar(i18n("google_navi.navi_started", null, "내비게이션을 시작합니다."));
    fn_StartNavi(poi.name, poi.lat, poi.lon);
  }

  function closePage() {
    if (isAppBridge() && typeof fn_ClosePopData === "function") {
      fn_ClosePopData();
      return;
    }
    try {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
    } catch (e) {}
    try {
      window.close();
    } catch (e) {}
  }
  // SOFTM-GOOGLE: 기존 windowClose()와 같은 팝업 닫기 API(106)를 앱에서 사용하고 웹 테스트에서는 브라우저 히스토리로 대체. 2026-05-19

  function isAppBridge() {
    try {
      return typeof CommonUtil !== "undefined" && (CommonUtil.fn_IS_APP() === "I" || CommonUtil.fn_IS_APP() === "A");
    } catch (e) {
      return false;
    }
  }

  function parseDevicePois(value) {
    if (!value) return [];
    var parsed = value;
    if (typeof value === "string") {
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        return [];
      }
    }
    if (!isArray(parsed)) parsed = [parsed];
    return normalizeRows(parsed);
  }

  function normalizeRows(rows) {
    var output = [];
    if (!rows) return output;
    if (!isArray(rows)) rows = [rows];
    for (var i = 0; i < rows.length; i++) {
      var poi = rowToPoi(rows[i]);
      if (poi) output.push(poi);
    }
    return output;
  }

  function rowToPoi(row) {
    if (!row) return null;
    if (isSearchHistory(row)) return makeSearchHistory(row);
    var lat = valueOf(row, ["lat", "frontLat", "noorLat"]);
    var lon = valueOf(row, ["lon", "frontLon", "noorLon"]);
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) return null;
    var poi = makePoi(
      valueOf(row, ["name", "poiName", "fullAddress", "address"]) || i18n("google_navi.destination_default", null, "목적지"),
      lat,
      lon,
      valueOf(row, ["address", "fullAddress", "roadName"]) || "",
      valueOf(row, ["id", "poiId", "place_id"]) || ""
    );
    poi.key = row.key || poi.key;
    poi.dbId = row._id || row.dbId || null;
    poi.created = row.created || null;
    poi.favoriteOrder = normalizedFavoriteOrder(row.favoriteOrder != null ? row.favoriteOrder : row.sortOrder);
    poi.favorite = !!row.favorite;
    poi.type = row.type || poi.type;
    return poi;
  }
  // SOFTM-GOOGLE: 즐겨찾기 이름 수정/삭제와 정렬 복원을 위해 DB row 식별자/생성일/정렬값을 POI에 보존. 2026-05-17

  function normalizedFavoriteOrder(value) {
    var order = parseFloat(value);
    return isNaN(order) || order <= 0 ? null : order;
  }
  // SOFTM-GOOGLE: 기존 row에 정렬값이 없거나 0이면 생성일/DB 순서 fallback을 사용할 수 있게 정규화. 2026-05-17

  /** SOFTM-MAPSYNC START: Google 모드 저장 데이터도 TMap 집/회사 복원용 type과 POI 좌표 필드를 포함한다. 2026-05-19 */
  function toStoredPoi(poi, modeKey) {
    var id = stablePoiId(poi);
    var lat = parseFloat(poi.lat);
    var lon = parseFloat(poi.lon);
    return {
      id: id,
      poiName: poi.name,
      name: poi.name,
      lat: lat,
      lon: lon,
      noorLat: lat,
      noorLon: lon,
      frontLat: lat,
      frontLon: lon,
      address: poi.address || "",
      fullAddress: poi.address || poi.name,
      roadName: poi.address || "",
      type: destinationTypeForMode(modeKey, poi),
      gubun: NaviGubun.POI,
      favoriteOrder: poi.favoriteOrder || 0,
      key: poiKey(poi)
    };
  }

  function destinationTypeForMode(modeKey, poi) {
    if (modeKey === "home") return NaviDestination.HOME;
    if (modeKey === "company") return NaviDestination.COMPANY;
    if (modeKey === "favorite" || poi && poi.favorite) return NaviDestination.FAVORITE;
    return poi && poi.type ? poi.type : NaviDestination.DEFAULT;
  }
  /** SOFTM-MAPSYNC END */

  function makePoi(name, lat, lon, address, id) {
    var poi = new MapPoint(parseFloat(lat), parseFloat(lon), name || i18n("google_navi.destination_default", null, "목적지"));
    poi.id = id || poi.id || (lat + "_" + lon);
    poi.address = address || "";
    poi.key = poiKey(poi);
    return poi;
  }

  function makeSearchHistory(row) {
    return {
      id: row.id || timestampId(),
      name: row.name || "",
      lat: null,
      lon: null,
      address: "",
      gubun: NaviGubun.SEARCH,
      created: row.created || new Date(),
      dbId: row._id || row.dbId || null,
      key: row.key || ((row.id || timestampId()) + "_" + (row.name || ""))
    };
  }

  function poiKey(poi) {
    return stablePoiId(poi) + "_" + (poi.name || "");
  }

  function stablePoiId(poi) {
    if (!poi) return "";
    var id = poi.id || "";
    if (id && id !== "current" && id.indexOf("map_") !== 0) return id;
    if (!isNaN(parseFloat(poi.lat)) && !isNaN(parseFloat(poi.lon))) {
      return parseFloat(poi.lat).toFixed(7) + "_" + parseFloat(poi.lon).toFixed(7);
    }
    return id || timestampId();
  }
  // SOFTM-GOOGLE: 현재 위치/지도 지정 즐겨찾기는 표시명 대신 좌표 기반 ID로 중복/수정 처리. 2026-05-16

  function isSearchHistory(poi) {
    var value = poi && poi.gubun ? (poi.gubun.value != null ? poi.gubun.value : poi.gubun) : "";
    return String(value) === String(NaviGubun.SEARCH.value);
  }
  // SOFTM-GOOGLE: 검색 이력 판정은 저장 형태가 객체/문자열 어느 쪽이어도 동작하도록 보강. 2026-05-17

  function openSearchHistory(poi) {
    var url = "search_google.html?idx=1&search=" + encodeURIComponent(poi.name || "");
    setStatus(i18n("google_navi.move_search_screen", { name: poi.name }, "검색 화면으로 이동합니다: " + poi.name));
    if (typeof windowUrl === "function") windowUrl(url);
    else window.location.href = url;
  }

  function timestampId() {
    var d = new Date();
    function pad(v) { return v < 10 ? "0" + v : String(v); }
    return "" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + d.getMilliseconds();
  }

  function toTime(value) {
    if (!value) return 0;
    var date = value instanceof Date ? value : new Date(value);
    var time = date.getTime();
    return isNaN(time) ? 0 : time;
  }

  function waitDb(storage, callback, failCallback) {
    if (storage && storage.db) {
      callback();
      return;
    }
    var count = 0;
    var timer = window.setInterval(function() {
      count++;
      if (storage && storage.db) {
        window.clearInterval(timer);
        callback();
      } else if (count > 30) {
        window.clearInterval(timer);
        setStatus(i18n("google_navi.local_storage_error", null, "로컬 저장소를 열 수 없습니다."));
        if (failCallback) failCallback();
      }
    }, 100);
  }

  function setStatus(message) {
    var el = byId("statusText");
    if (el) el.innerHTML = escapeHtml(message || "");
  }

  // SOFTM-GOOGLE: 원본 setAddress/snackbar 동작을 Google 페이지 하단 오버레이로 대체. 2026-05-16
  function setAddressOverlay(value) {
    var el = byId("placeAddress");
    if (!el) return;
    if (!value) {
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }
    el.style.display = "block";
    el.innerHTML = escapeHtml(value).replace(/\n/g, "<br>");
  }
  // SOFTM-GOOGLE: 하단 위치 오버레이가 위치명/세부주소 2줄 표시를 지원하도록 줄바꿈 처리. 2026-05-16

  function showSnackbar(message) {
    var el = byId("googleNaviSnackbar");
    if (!el || !message) return;
    if (state.snackbarTimer) window.clearTimeout(state.snackbarTimer);
    el.innerHTML = escapeHtml(message);
    el.style.display = "block";
    state.snackbarTimer = window.setTimeout(function() {
      el.style.display = "none";
      el.innerHTML = "";
      state.snackbarTimer = null;
    }, 2300);
  }

  function addressText(poi) {
    if (!poi) return "";
    return poi.address || poi.fullAddress || (poi.lat && poi.lon ? poi.lat + ", " + poi.lon : "");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function queryAll(selector) {
    return document.querySelectorAll(selector);
  }

  function each(items, callback) {
    for (var i = 0; i < items.length; i++) callback(items[i], i);
  }

  function addClass(el, name) {
    if (!el) return;
    if (el.classList) el.classList.add(name);
    else if ((" " + el.className + " ").indexOf(" " + name + " ") < 0) el.className += " " + name;
  }

  function removeClass(el, name) {
    if (!el) return;
    if (el.classList) el.classList.remove(name);
    else el.className = (" " + el.className + " ").replace(" " + name + " ", " ");
  }

  function closestByClass(el, className) {
    while (el && el !== document) {
      if (hasClass(el, className)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function hasClass(el, className) {
    return el && (" " + el.className + " ").indexOf(" " + className + " ") >= 0;
  }

  function valueOf(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== "") return obj[keys[i]];
    }
    return "";
  }

  function trim(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
  }

  function decodeParam(value) {
    try {
      return decodeURIComponent(value.replace(/\+/g, " "));
    } catch (e) {
      return value;
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function(ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  }

  window.initGoogleNaviPage = initGoogleNaviPage;
})(window, document);
/*
 * SOFTM-GOOGLE END
 */
