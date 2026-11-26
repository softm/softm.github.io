/*
 * SOFTM-WORLD-MAP: MapLibre + OpenFreeMap 지도와 Geoapify Worker 검색 어댑터.
 * GoogleNaviMap과 같은 인터페이스를 제공해 기존 저장/최근/즐겨찾기 로직을 재사용한다.
 */
(function(window, document) {
  "use strict";

  var DEFAULT_CENTER = { lat: 36.9876599, lng: 126.8487439 };
  var OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
  var DEFAULT_WORKER_URL = "https://navipoweron-geocoding.softm.workers.dev";

  function n(value) { return typeof value === "number" ? value : parseFloat(value); }
  function hasLatLon(poi) { return poi && isFinite(n(poi.lat)) && isFinite(n(poi.lon)); }
  function trim(value) { return String(value || "").replace(/^\s+|\s+$/g, ""); }
  function workerUrl() {
    return trim(window.SOFTM_GEOAPIFY_WORKER_URL || localStorage.getItem("_GEOAPIFY_WORKER_URL") || DEFAULT_WORKER_URL).replace(/\/$/, "");
  }
  function online() { return window.navigator.onLine !== false; }
  function message() {
    return online() ? "장소 검색 서버를 사용할 수 없습니다. 지도에서 위치를 선택해 좌표로 저장할 수 있습니다." : "오프라인에서는 저장된 집·회사·즐겨찾기·최근 목록만 사용할 수 있습니다.";
  }
  function request(path, params, success, fail) {
    if (!online() || window.location.protocol === "file:") { if (fail) fail(message()); return; }
    var query = [];
    Object.keys(params || {}).forEach(function(key) {
      if (params[key] !== "" && params[key] !== null && typeof params[key] !== "undefined") query.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
    });
    fetch(workerUrl() + path + (query.length ? "?" + query.join("&") : ""), {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "omit"
    }).then(function(response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    }).then(success).catch(function() { if (fail) fail(message()); });
  }
  function featureToPoi(feature, index) {
    var p = feature && feature.properties ? feature.properties : {};
    var coords = feature && feature.geometry && feature.geometry.coordinates ? feature.geometry.coordinates : [];
    var lon = n(p.lon != null ? p.lon : coords[0]);
    var lat = n(p.lat != null ? p.lat : coords[1]);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return {
      id: p.place_id || p.datasource && p.datasource.raw && p.datasource.raw.osm_id || "world-" + index + "-" + lat + "-" + lon,
      name: p.name || p.formatted || p.address_line1 || "선택 위치",
      address: p.formatted || [p.address_line1, p.address_line2].filter(Boolean).join(" "),
      lat: lat,
      lon: lon,
      raw: feature
    };
  }
  function featuresToPois(data) {
    var features = data && data.features ? data.features : [];
    var result = [];
    for (var i = 0; i < features.length; i++) {
      var poi = featureToPoi(features[i], i);
      if (poi) result.push(poi);
    }
    return result;
  }
  function markerElement(className, label) {
    var el = document.createElement("div");
    el.className = "world-navi-marker " + (className || "");
    if (label) el.textContent = label;
    return el;
  }

  function WorldNaviMap(elementId, options) {
    options = options || {};
    this.element = document.getElementById(elementId);
    this.center = options.center || DEFAULT_CENTER;
    this.zoom = options.zoom || 16;
    this.map = null;
    this.markers = [];
    this.editMarker = null;
    this.myLocationMarker = null;
    this.clickHandler = null;
    this.ready = false;
  }
  WorldNaviMap.prototype.init = function(callback) {
    if (!this.element) { if (callback) callback("지도 영역을 찾을 수 없습니다."); return; }
    if (!online()) { this.element.innerHTML = '<div class="google-navi-message">' + message() + '</div>'; if (callback) callback(message()); return; }
    if (!window.maplibregl) { this.element.innerHTML = '<div class="google-navi-message">지도 라이브러리를 불러오지 못했습니다.</div>'; if (callback) callback("지도 라이브러리를 불러오지 못했습니다."); return; }
    try {
      this.map = new window.maplibregl.Map({ container: this.element, style: OPENFREEMAP_STYLE, center: [n(this.center.lng || this.center.lon), n(this.center.lat)], zoom: this.zoom, attributionControl: true });
      this.map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      this.ready = true;
      this.applyClickHandler();
      this.map.once("load", function() { if (callback) callback(null); });
      this.map.on("error", function() {});
    } catch (e) { this.element.innerHTML = '<div class="google-navi-message">지도를 초기화하지 못했습니다.</div>'; if (callback) callback(String(e.message || e)); }
  };
  WorldNaviMap.prototype.clearMarkers = function() { this.markers.forEach(function(item) { item.remove(); }); this.markers = []; };
  WorldNaviMap.prototype.setEditablePin = function(poi, onDragEnd) {
    if (!this.ready || !hasLatLon(poi)) return null;
    this.clearEditablePin();
    var marker = new window.maplibregl.Marker({ element: markerElement("editable"), draggable: true }).setLngLat([n(poi.lon), n(poi.lat)]).addTo(this.map);
    if (onDragEnd) marker.on("dragend", function() { var pos = marker.getLngLat(); onDragEnd(pos.lat, pos.lng); });
    this.editMarker = marker;
    this.map.setCenter([n(poi.lon), n(poi.lat)]);
    return marker;
  };
  WorldNaviMap.prototype.clearEditablePin = function() { if (this.editMarker) this.editMarker.remove(); this.editMarker = null; };
  WorldNaviMap.prototype.setMyLocation = function(poi) {
    if (!this.ready || !hasLatLon(poi)) return null;
    if (!this.myLocationMarker) this.myLocationMarker = new window.maplibregl.Marker({ element: markerElement("my-location") }).setLngLat([n(poi.lon), n(poi.lat)]).addTo(this.map);
    else this.myLocationMarker.setLngLat([n(poi.lon), n(poi.lat)]);
    return this.myLocationMarker;
  };
  WorldNaviMap.prototype.clearMyLocation = function() { if (this.myLocationMarker) this.myLocationMarker.remove(); this.myLocationMarker = null; };
  WorldNaviMap.prototype.addMarker = function(poi, options) {
    if (!this.ready || !hasLatLon(poi)) return null;
    options = options || {};
    var el = markerElement("result", options.label ? String(options.label) : "");
    var marker = new window.maplibregl.Marker({ element: el }).setLngLat([n(poi.lon), n(poi.lat)]).addTo(this.map);
    marker._softmPoiId = poi.id || ""; marker._softmElement = el;
    el.onclick = function(event) { event.stopPropagation(); if (options.onClick) options.onClick(poi); };
    this.markers.push(marker); return marker;
  };
  WorldNaviMap.prototype.showAllMarkers = function() { this.markers.forEach(function(item) { item._softmElement.style.display = ""; }); };
  WorldNaviMap.prototype.showOnlyMarkerById = function(id) { this.markers.forEach(function(item) { item._softmElement.style.display = item._softmPoiId === id ? "" : "none"; }); };
  WorldNaviMap.prototype.highlightMarkerById = function(id) { this.markers.forEach(function(item) { item._softmElement.classList.toggle("selected", item._softmPoiId === id); }); };
  WorldNaviMap.prototype.clearMarkerHighlight = function() { this.markers.forEach(function(item) { item._softmElement.classList.remove("selected"); }); };
  WorldNaviMap.prototype.setCenter = function(poi, zoom) { if (this.ready && hasLatLon(poi)) this.map.easeTo({ center: [n(poi.lon), n(poi.lat)], zoom: zoom || this.zoom }); };
  WorldNaviMap.prototype.fitPois = function(pois) {
    if (!this.ready || !pois || !pois.length) return;
    var bounds = new window.maplibregl.LngLatBounds(); var count = 0;
    pois.forEach(function(poi) { if (hasLatLon(poi)) { bounds.extend([n(poi.lon), n(poi.lat)]); count++; } });
    if (count === 1) this.setCenter(pois[0], 16); else if (count > 1) this.map.fitBounds(bounds, { padding: 45, maxZoom: 16 });
  };
  WorldNaviMap.prototype.onMapClick = function(handler) { this.clickHandler = handler || null; this.applyClickHandler(); };
  WorldNaviMap.prototype.applyClickHandler = function() { var self = this; if (this.ready && this.map && !this._clickBound) { this.map.on("click", function(event) { if (self.clickHandler) self.clickHandler(event.lngLat.lat, event.lngLat.lng); }); this._clickBound = true; } };
  WorldNaviMap.prototype.search = function(query, success, fail) {
    query = trim(query); if (!query) { if (fail) fail("검색어를 입력하세요."); return; }
    request("/v1/search", { text: query, lang: localStorage.getItem("lng") || "en", limit: 20, bias: "proximity:" + n(this.center.lng || this.center.lon) + "," + n(this.center.lat) }, function(data) {
      var pois = featuresToPois(data); if (pois.length) success(pois); else if (fail) fail("검색 결과가 없습니다.");
    }, fail);
  };
  WorldNaviMap.prototype.reverseGeocode = function(lat, lon, callback) { request("/v1/reverse", { lat: lat, lon: lon, lang: localStorage.getItem("lng") || "en" }, function(data) { var pois = featuresToPois(data); callback(pois[0] ? pois[0].address : "", pois[0] ? pois[0].raw : null); }, function() { callback(""); }); };
  WorldNaviMap.prototype.findNearbyPlace = function(lat, lon, callback) { request("/v1/nearby", { lat: lat, lon: lon, limit: 10 }, function(data) { var pois = featuresToPois(data); callback(pois[0] || null); }, function() { callback(null); }); };
  WorldNaviMap.prototype.resolvePinLocation = function(lat, lon, callback) {
    var self = this, result = { lat: n(lat), lon: n(lon), address: "", geocodeResult: null, place: null }, left = 2;
    function done() { left--; if (!left && callback) callback(result); }
    this.reverseGeocode(lat, lon, function(address, raw) { result.address = address || ""; result.geocodeResult = raw || null; done(); });
    self.findNearbyPlace(lat, lon, function(place) { result.place = place || null; done(); });
  };

  window.GoogleNaviMap = WorldNaviMap;
  window.WorldNaviMap = WorldNaviMap;
  window.GoogleNaviMapReady = function() { return true; };
})(window, document);
