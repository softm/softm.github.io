/*
 * SOFTM-GOOGLE START: Google Maps/Places 전용 지도 래퍼 추가. 2026-05-16
 */
(function(window, document) {
  "use strict";

  var DEFAULT_CENTER = { lat: 36.9876599, lng: 126.8487439 };
  var callbacks = [];
  var loading = false;
  var ready = false;
  var loadError = "";

  function getApiKey() {
    if (window.SOFTM_GOOGLE_MAPS_API_KEY) return window.SOFTM_GOOGLE_MAPS_API_KEY;
    if (typeof getParam === "function") return getParam("google_key") || getParam("key") || "";
    return "";
  }

  function i18n(key, option, fallback) {
    if (typeof window.googleNaviT === "function") return window.googleNaviT(key, option || {});
    if (typeof window.t === "function") return window.t(key, option || {});
    return fallback || key;
  }

  function googleLang() {
    if (typeof window.googleNaviLang === "function") return window.googleNaviLang() === "ko" ? "ko" : "en";
    var lang = window.navigator && window.navigator.language ? window.navigator.language.split("-")[0] : "ko";
    return lang === "ko" ? "ko" : "en";
  }
  // SOFTM-I18N: Google Maps 스크립트와 오류 문구가 앱 언어 설정을 따르도록 처리. 2026-05-19

  function loadGoogle(callback) {
    if (window.google && window.google.maps) {
      ready = true;
      callback(null);
      return;
    }

    callbacks.push(callback);
    if (loading) return;

    var key = getApiKey();
    if (!key) {
      loadError = i18n("google_navi.api_key_missing", null, "Google Maps API key가 없습니다.");
      flushCallbacks(loadError);
      return;
    }

    loading = true;
    window.gm_authFailure = function() {
      loadError = i18n("google_navi.api_key_restricted", null, "Google Maps API key 인증 또는 API 제한 설정을 확인해야 합니다.");
      flushCallbacks(loadError);
    };
    window.SOFTM_GOOGLE_MAPS_READY = function() {
      ready = true;
      flushCallbacks(null);
    };

    var script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.onerror = function() {
      loadError = i18n("google_navi.script_load_failed", null, "Google Maps 스크립트를 불러오지 못했습니다.");
      flushCallbacks(loadError);
    };
    var lang = googleLang();
    var region = lang === "ko" ? "KR" : "US";
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) +
      "&libraries=places&language=" + encodeURIComponent(lang) + "&region=" + encodeURIComponent(region) + "&loading=async&callback=SOFTM_GOOGLE_MAPS_READY";
    document.head.appendChild(script);
  }

  function flushCallbacks(error) {
    var items = callbacks.slice(0);
    callbacks = [];
    loading = false;
    for (var i = 0; i < items.length; i++) {
      items[i](error);
    }
  }

  function GoogleNaviMap(elementId, options) {
    options = options || {};
    this.elementId = elementId;
    this.element = document.getElementById(elementId);
    this.center = normalizeLatLng(options.center) || DEFAULT_CENTER;
    this.zoom = options.zoom || 16;
    this.map = null;
    this.infoWindow = null;
    this.markers = [];
    this.editMarker = null;
    this.myLocationMarker = null;
    this.ready = false;
    this.clickHandler = null;
    this.clickListener = null;
  }

  GoogleNaviMap.prototype.init = function(callback) {
    var self = this;
    if (!this.element) {
      if (callback) callback(i18n("google_navi.map_element_not_found", null, "지도 영역을 찾을 수 없습니다."));
      return;
    }

    this.renderFallback(this.center.lat, this.center.lng, this.zoom);
    loadGoogle(function(error) {
      if (error) {
        self.renderMessage(error);
        if (callback) callback(error);
        return;
      }

      self.map = new window.google.maps.Map(self.element, {
        center: self.center,
        zoom: self.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: true
      });
      self.infoWindow = new window.google.maps.InfoWindow();
      self.ready = true;
      self.applyClickHandler();
      if (callback) callback(null);
    });
  };

  GoogleNaviMap.prototype.renderFallback = function(lat, lng, zoom) {
    if (!this.element) return;
    this.element.innerHTML = '<iframe title="' + escapeHtml(i18n("google_navi.google_map", null, "Google 지도")) + '" width="100%" height="100%" frameborder="0" style="border:0;display:block" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' +
      encodeURIComponent(lat + "," + lng) + "&z=" + encodeURIComponent(zoom || this.zoom) + '&output=embed"></iframe>';
  };

  GoogleNaviMap.prototype.renderMessage = function(message) {
    if (!this.element) return;
    this.element.innerHTML = '<div class="google-navi-message">' + escapeHtml(message) + "</div>";
  };

  GoogleNaviMap.prototype.clearMarkers = function() {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(null);
    }
    this.markers = [];
  };

  GoogleNaviMap.prototype.setEditablePin = function(poi, onDragEnd) {
    if (!poi || !hasLatLon(poi)) return null;
    var position = { lat: toNumber(poi.lat), lng: toNumber(poi.lon) };
    if (!this.ready || !this.map) {
      this.renderFallback(position.lat, position.lng, this.zoom);
      return null;
    }
    if (this.editMarker) this.editMarker.setMap(null);
    this.editMarker = new window.google.maps.Marker({
      map: this.map,
      position: position,
      title: poi.name || i18n("google_navi.edit_location", null, "위치 수정"),
      draggable: true,
      icon: editableMarkerIcon(),
      zIndex: 10000
    });
    this.map.setCenter(position);
    if (onDragEnd) {
      this.editMarker.addListener("dragend", function(event) {
        if (!event || !event.latLng) return;
        onDragEnd(event.latLng.lat(), event.latLng.lng());
      });
    }
    return this.editMarker;
  };

  GoogleNaviMap.prototype.clearEditablePin = function() {
    if (this.editMarker) {
      this.editMarker.setMap(null);
      this.editMarker = null;
    }
  };

  GoogleNaviMap.prototype.setMyLocation = function(poi) {
    if (!poi || !hasLatLon(poi)) return null;
    var position = { lat: toNumber(poi.lat), lng: toNumber(poi.lon) };
    if (!this.ready || !this.map) {
      this.renderFallback(position.lat, position.lng, this.zoom);
      return null;
    }
    if (this.myLocationMarker) {
      this.myLocationMarker.setPosition(position);
    } else {
      this.myLocationMarker = new window.google.maps.Marker({
        map: this.map,
        position: position,
        title: poi.name || i18n("google_navi.current_location", null, "현재 위치"),
        icon: myLocationIcon(),
        zIndex: 9000
      });
    }
    return this.myLocationMarker;
  };

  GoogleNaviMap.prototype.clearMyLocation = function() {
    if (this.myLocationMarker) {
      this.myLocationMarker.setMap(null);
      this.myLocationMarker = null;
    }
  };
  // SOFTM-GOOGLE: 기존 지도 현재 위치 기능처럼 별도 현재 위치 마커를 표시/갱신하고 드래그 마커보다 낮게 배치. 2026-05-16

  GoogleNaviMap.prototype.addMarker = function(poi, options) {
    options = options || {};
    if (!this.ready || !poi || !hasLatLon(poi)) return null;

    var position = { lat: toNumber(poi.lat), lng: toNumber(poi.lon) };
    var marker = new window.google.maps.Marker({
      map: this.map,
      position: position,
      title: poi.name || "",
      label: options.label ? String(options.label) : undefined
    });
    marker._softmPoiId = poi.id || "";
    marker._softmDefaultIcon = null;
    marker._softmDefaultZIndex = marker.getZIndex();
    this.markers.push(marker);

    if (this.infoWindow) {
      var self = this;
      marker.addListener("click", function() {
        self.infoWindow.setContent("<strong>" + escapeHtml(poi.name || i18n("google_navi.selected_location", null, "선택 위치")) + "</strong><br>" + escapeHtml(poi.address || ""));
        self.infoWindow.open(self.map, marker);
        if (options.onClick) options.onClick(poi);
      });
    }

    return marker;
  };

  GoogleNaviMap.prototype.showOnlyMarkerById = function(id) {
    if (!this.ready || !this.markers.length) return;
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setVisible(this.markers[i]._softmPoiId === id);
    }
  };

  GoogleNaviMap.prototype.showAllMarkers = function() {
    if (!this.ready || !this.markers.length) return;
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setVisible(true);
    }
  };

  GoogleNaviMap.prototype.highlightMarkerById = function(id) {
    if (!this.ready || !this.markers.length) return;
    for (var i = 0; i < this.markers.length; i++) {
      if (this.markers[i]._softmPoiId === id) {
        this.markers[i].setIcon(selectedMarkerIcon());
        this.markers[i].setZIndex(9998);
      } else {
        this.markers[i].setIcon(this.markers[i]._softmDefaultIcon);
        this.markers[i].setZIndex(this.markers[i]._softmDefaultZIndex);
      }
    }
  };

  GoogleNaviMap.prototype.clearMarkerHighlight = function() {
    if (!this.ready || !this.markers.length) return;
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setIcon(this.markers[i]._softmDefaultIcon);
      this.markers[i].setZIndex(this.markers[i]._softmDefaultZIndex);
    }
  };

  // SOFTM-GOOGLE: 선택한 결과 마커만 파란 핀으로 강조하고 나머지 결과 마커는 유지. 2026-05-16

  GoogleNaviMap.prototype.setCenter = function(poi, zoom) {
    if (!poi || !hasLatLon(poi)) return;
    var position = { lat: toNumber(poi.lat), lng: toNumber(poi.lon) };
    this.center = position;
    if (this.ready) {
      this.map.setCenter(position);
      if (zoom) this.map.setZoom(zoom);
    } else {
      this.renderFallback(position.lat, position.lng, zoom || this.zoom);
    }
  };

  GoogleNaviMap.prototype.fitPois = function(pois) {
    if (!this.ready || !pois || !pois.length) return;
    var bounds = new window.google.maps.LatLngBounds();
    var count = 0;
    for (var i = 0; i < pois.length; i++) {
      if (hasLatLon(pois[i])) {
        bounds.extend({ lat: toNumber(pois[i].lat), lng: toNumber(pois[i].lon) });
        count++;
      }
    }
    if (count === 1) {
      this.map.setCenter(bounds.getCenter());
      this.map.setZoom(16);
    } else if (count > 1) {
      this.map.fitBounds(bounds);
    }
  };

  GoogleNaviMap.prototype.onMapClick = function(handler) {
    this.clickHandler = handler || null;
    this.applyClickHandler();
  };

  GoogleNaviMap.prototype.applyClickHandler = function() {
    if (!this.ready || !this.map) return;
    if (this.clickListener) {
      window.google.maps.event.removeListener(this.clickListener);
      this.clickListener = null;
    }
    if (!this.clickHandler) return;
    var self = this;
    this.clickListener = this.map.addListener("click", function(event) {
      if (!event || !event.latLng) return;
      self.clickHandler(event.latLng.lat(), event.latLng.lng());
    });
  };

  GoogleNaviMap.prototype.search = function(query, success, fail) {
    var self = this;
    query = trim(query);
    if (!query) {
      if (fail) fail(i18n("google_navi.input_search_keyword", null, "검색어를 입력하세요."));
      return;
    }

    loadGoogle(function(error) {
      if (error) {
        if (fail) fail(error);
        return;
      }

      if (!self.ready) {
        self.init(function(initError) {
          if (initError) {
            if (fail) fail(initError);
            return;
          }
          self.search(query, success, fail);
        });
        return;
      }

      var service = new window.google.maps.places.PlacesService(self.map);
      service.textSearch({
        query: query,
        location: self.center,
        radius: 50000
      }, function(results, status) {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length) {
          success(resultsToPois(results));
          return;
        }

        self.geocode(query, success, function(geocodeError) {
          if (fail) fail(placesMessage(status) || geocodeError || i18n("google_navi.no_search_result", null, "검색 결과가 없습니다."));
        });
      });
    });
  };

  GoogleNaviMap.prototype.geocode = function(query, success, fail) {
    loadGoogle(function(error) {
      if (error) {
        if (fail) fail(error);
        return;
      }

      var geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query, region: "KR" }, function(results, status) {
        if (status === "OK" && results && results.length) {
          success(geocodeResultsToPois(results));
        } else if (fail) {
          fail(i18n("google_navi.address_no_result", null, "주소 검색 결과가 없습니다."));
        }
      });
    });
  };

  GoogleNaviMap.prototype.reverseGeocode = function(lat, lon, callback) {
    loadGoogle(function(error) {
      if (error) {
        callback("");
        return;
      }
      var geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: toNumber(lat), lng: toNumber(lon) } }, function(results, status) {
        if (status === "OK" && results && results[0]) {
          callback(results[0].formatted_address || "", results[0]);
        } else {
          callback("");
        }
      });
    });
  };

  GoogleNaviMap.prototype.findNearbyPlace = function(lat, lon, callback) {
    var self = this;
    loadGoogle(function(error) {
      if (error || !self.ready || !self.map || !window.google.maps.places) {
        callback(null);
        return;
      }

      var position = { lat: toNumber(lat), lng: toNumber(lon) };
      var service = new window.google.maps.places.PlacesService(self.map);
      service.nearbySearch({
        location: position,
        radius: 80
      }, function(results, status) {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results || !results.length) {
          callback(null);
          return;
        }

        var place = nearestUsablePlace(results, position);
        if (!place) {
          callback(null);
          return;
        }

        if (place.place_id && service.getDetails) {
          service.getDetails({
            placeId: place.place_id,
            fields: ["place_id", "name", "formatted_address", "geometry", "types"]
          }, function(detail, detailStatus) {
            if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && detail) {
              callback(enrichNearbyPlace(detail, place, position));
              return;
            }
            callback(enrichNearbyPlace(place, place, position));
          });
          return;
        }

        callback(enrichNearbyPlace(place, place, position));
      });
    });
  };

  GoogleNaviMap.prototype.resolvePinLocation = function(lat, lon, callback) {
    var self = this;
    var resolved = {
      lat: toNumber(lat),
      lon: toNumber(lon),
      address: "",
      geocodeResult: null,
      place: null
    };
    var left = 2;

    function done() {
      left--;
      if (left === 0 && callback) callback(resolved);
    }

    this.reverseGeocode(lat, lon, function(address, geocodeResult) {
      resolved.address = address || "";
      resolved.geocodeResult = geocodeResult || null;
      done();
    });

    self.findNearbyPlace(lat, lon, function(place) {
      resolved.place = place || null;
      done();
    });
  };
  // SOFTM-GOOGLE: 드래그 핀 좌표를 역지오코딩 주소와 주변 POI 상세정보로 함께 해석. 2026-05-17

  function resultsToPois(results) {
    var pois = [];
    for (var i = 0; i < results.length; i++) {
      var place = results[i];
      if (!place.geometry || !place.geometry.location) continue;
      pois.push({
        id: place.place_id || (place.name + "_" + i),
        name: place.name || place.formatted_address || i18n("google_navi.search_result", null, "검색 결과"),
        lat: place.geometry.location.lat(),
        lon: place.geometry.location.lng(),
        address: place.formatted_address || place.vicinity || "",
        item: place
      });
    }
    return pois;
  }

  function geocodeResultsToPois(results) {
    var pois = [];
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (!result.geometry || !result.geometry.location) continue;
      pois.push({
        id: result.place_id || (result.formatted_address + "_" + i),
        name: result.formatted_address || i18n("google_navi.address_result", null, "주소 결과"),
        lat: result.geometry.location.lat(),
        lon: result.geometry.location.lng(),
        address: result.formatted_address || "",
        item: result
      });
    }
    return pois;
  }

  function nearestUsablePlace(results, position) {
    var best = null;
    var bestDistance = 999999;
    for (var i = 0; i < results.length; i++) {
      var place = results[i];
      if (!isUsableNearbyPlace(place) || !place.geometry || !place.geometry.location) continue;
      var placePosition = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      var distance = distanceMeters(position.lat, position.lng, placePosition.lat, placePosition.lng);
      if (distance < bestDistance) {
        best = place;
        bestDistance = distance;
      }
    }
    if (!best || bestDistance > 80) return null;
    best._softmDistance = bestDistance;
    return best;
  }

  function isUsableNearbyPlace(place) {
    if (!place || !place.name) return false;
    var types = place.types || [];
    var blocked = ["political", "locality", "sublocality", "administrative_area_level_1", "administrative_area_level_2", "country", "postal_code", "route"];
    for (var i = 0; i < blocked.length; i++) {
      if (types.indexOf(blocked[i]) >= 0) return false;
    }
    return true;
  }

  function enrichNearbyPlace(detail, fallback, position) {
    detail = detail || {};
    fallback = fallback || {};
    var location = detail.geometry && detail.geometry.location ? detail.geometry.location :
      (fallback.geometry && fallback.geometry.location ? fallback.geometry.location : null);
    var distance = fallback._softmDistance;
    if (location) {
      distance = distanceMeters(position.lat, position.lng, location.lat(), location.lng());
    }
    return {
      id: detail.place_id || fallback.place_id || "",
      name: detail.name || fallback.name || "",
      address: detail.formatted_address || detail.vicinity || fallback.formatted_address || fallback.vicinity || "",
      types: detail.types || fallback.types || [],
      distance: distance
    };
  }

  function distanceMeters(lat1, lon1, lat2, lon2) {
    var r = 6371000;
    var dLat = toRadians(lat2 - lat1);
    var dLon = toRadians(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function toRadians(value) {
    return value * Math.PI / 180;
  }
  // SOFTM-GOOGLE: 주변 Places 후보 중 좌표와 가장 가까운 실제 POI를 선별해 위치명 보강에 사용. 2026-05-17

  function normalizeLatLng(value) {
    if (!value) return null;
    var lat = toNumber(value.lat);
    var lng = toNumber(value.lng || value.lon);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat: lat, lng: lng };
  }

  function hasLatLon(poi) {
    return poi && !isNaN(toNumber(poi.lat)) && !isNaN(toNumber(poi.lon));
  }

  function placesMessage(status) {
    if (!status) return "";
    if (status === "ZERO_RESULTS") return i18n("google_navi.no_search_result", null, "검색 결과가 없습니다.");
    if (status === "REQUEST_DENIED") return i18n("google_navi.places_permission", null, "Google Places API 권한 또는 API 제한 설정을 확인해야 합니다.");
    if (status === "OVER_QUERY_LIMIT") return i18n("google_navi.places_over_query", null, "Google Places API 사용량 한도를 확인해야 합니다.");
    return i18n("google_navi.places_error", { status: status }, "Google Places 검색 오류: " + status);
  }

  function toNumber(value) {
    return typeof value === "number" ? value : parseFloat(value);
  }

  function trim(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
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

  function selectedMarkerIcon() {
    if (!window.google || !window.google.maps) return null;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 42 52">' +
      '<path d="M21 2C11.6 2 4 9.6 4 19c0 12.3 17 31 17 31s17-18.7 17-31C38 9.6 30.4 2 21 2z" fill="#1565c0" stroke="#ffffff" stroke-width="3"/>' +
      '<circle cx="21" cy="19" r="10" fill="#1e88e5"/>' +
      '</svg>';
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(42, 52),
      anchor: new window.google.maps.Point(21, 50),
      labelOrigin: new window.google.maps.Point(21, 19)
    };
  }

  function editableMarkerIcon() {
    if (!window.google || !window.google.maps) return null;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="54" height="80" viewBox="0 0 64 94">' +
      '<filter id="shadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/></filter>' +
      '<path filter="url(#shadow)" d="M32 3C18.2 3 7 14.2 7 28c0 18 25 47 25 47s25-29 25-47C57 14.2 45.8 3 32 3z" fill="#e53935" stroke="#ffffff" stroke-width="4"/>' +
      '<circle cx="32" cy="28" r="14" fill="#ffffff"/>' +
      '<path d="M32 16v24M20 28h24M32 16l-5 5M32 16l5 5M32 40l-5-5M32 40l5-5M20 28l5-5M20 28l5 5M44 28l-5-5M44 28l-5 5" stroke="#e53935" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="32" cy="84" r="10" fill="#d50000" stroke="#ffffff" stroke-width="3"/>' +
      '<path d="M28 80l8 8M36 80l-8 8" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(54, 80),
      anchor: new window.google.maps.Point(27, 64),
      labelOrigin: new window.google.maps.Point(32, 28)
    };
  }
  // SOFTM-GOOGLE: 위치 수정용 드래그 핀 꼭지점 아래로 X 배지를 내려 표시. 2026-05-16

  function myLocationIcon() {
    if (!window.google || !window.google.maps) return null;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">' +
      '<circle cx="17" cy="17" r="10" fill="#ffffff" stroke="#1e88e5" stroke-width="3"/>' +
      '<circle cx="17" cy="17" r="4" fill="#1e88e5"/>' +
      '<path d="M17 1v7M17 26v7M1 17h7M26 17h7" stroke="#1e88e5" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(34, 34),
      anchor: new window.google.maps.Point(17, 17)
    };
  }
  // SOFTM-GOOGLE: 현재 위치 마커를 기존 my_location 아이콘과 유사한 표식으로 표시. 2026-05-16

  window.GoogleNaviMap = GoogleNaviMap;
  window.GoogleNaviMapReady = function() {
    return ready && !loadError;
  };
})(window, document);
/*
 * SOFTM-GOOGLE END
 */
