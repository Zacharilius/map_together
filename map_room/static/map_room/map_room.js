/* Init */
$(function() {
    var map = new MapRoom();
    var buttonBar = ButtonBar(map);
})

var MapRoom = function() {
    var isSyncActive = true;
    
    var init = function() {
        setupMap();
        setupWebSocket();
    }
    
    this.toggleSync = function() {
        isSyncActive = !isSyncActive;
    }
    
    var mapState = getMapRoomData();
    
    var mapRoom = L.map('map-room-map').setView([mapState['mapCenter']['lat'], mapState['mapCenter']['lng']], mapState['zoom']);
    
    /* ==== Leaflet Map ==== */
    var setupMap = function() {
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            id: 'mapbox.light',
            accessToken: 'pk.eyJ1IjoiemFjaGFyaWxpdXMiLCJhIjoiY2l1cHU4eGk4MDFsazNvcGh4dzRnZWU0NSJ9.pIC-kFg6gpOpA-s0to0C0g'
        }).addTo(mapRoom);
    }
    
    /* ==== Leaflet Map Sync ==== */
    /* Will not sync local action while processing sync from server */
    var lastSyncedMapState = {};
    
    var setupWebSocket = function() {
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        window.mapRoomWS = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/ws" + window.location.pathname);
        
        window.mapRoomWS.onmessage = function(e) {
            var message = JSON.parse(e.data);

            if (isMapInSyncWith(message)) {
                /* Map is already sync */
                return;
            }
            
            lastSyncedMapState = message;
            onMapSyncMessage(message)
        }
    }
    
    var sendWebSocketMessage = function(message) {
        if (isSyncActive) {
            lastSyncedMapState = message;
            window.mapRoomWS.send(JSON.stringify(message));
        }
    }
    
    var isMapInSyncWith = function(message) {
        var mapCenter = mapRoom.getCenter();
        var mapCenterInSync = mapCenter['lat'] === message['mapCenter']['lat'] ||
                              mapCenter['lng'] === message['mapCenter']['lng'];
        
        var mapZoom = mapRoom.getZoom();
        var zoomInSync = mapZoom == message['zoomLevel'];
        
        return mapCenterInSync && mapZoom;
    }
    
    /* Updating the map fires a Leaflet Event. This function determines if the 
       event is a valid and needs to be setn to other users in the map room.
    */
    var isEventEchoFromSync = function() {
        /* If no syncs have occurred then lastSyncedMapState is empty {} */
        if (Object.keys(lastSyncedMapState).length === 0) {
            return false;
        }
        var mapCenter = mapRoom.getCenter();
        var mapCenterInSync = mapCenter['lat'] === lastSyncedMapState['mapCenter']['lat'] &&
                              mapCenter['lng'] === lastSyncedMapState['mapCenter']['lng'];
        
        var mapZoom = mapRoom.getZoom();
        var zoomInSync = mapZoom == lastSyncedMapState['zoomLevel'];
        
        return mapCenterInSync && mapZoom;
    }
    
    var onMapSyncMessage = function(data) {
        if (isSyncActive) {
            var action = data['action'];
            switch(action) {
                case 'pan':
                    performPanAction(data);
                    break;
                case 'zoom':
                    performZoomAction(data);
                    break;
                default:
                    console.warn('Unrecognized action: ' + action);
            }
        }
    }
    
    /* Pan Sync */
    mapRoom.on('moveend', function(e) {
        if (isEventEchoFromSync()) {
            return;
        }
        
        sendWebSocketMessage(createMessageFor('pan', e));
    });
    
    var performPanAction = function(data) {
        mapRoom.setView(data['mapCenter']);
    }
    
    /* Zoom Sync */
    mapRoom.on('zoomend', function(e) {
        if (isEventEchoFromSync()) {
            return;
        }
        
        sendWebSocketMessage(createMessageFor('zoom', e));
    })
    
    var performZoomAction = function(data) {
        mapRoom.setZoom(data['zoomLevel']);
    }
    
    /* Location */
    var getGeoLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updateLocation);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }
    
    var updateLocation = function(position) {
        console.log("Latitude: " + position.coords.latitude + 
        "<br>Longitude: " + position.coords.longitude); 
    }
    
    /* */
    var createMessageFor = function(action, e) {
        var message = {
            'action': action,
            'mapCenter': e.target.getCenter(),
            'zoomLevel': e.target.getZoom()
        };
        return message;
    }
    
    /* ==== Init  ==== */
    init();
}

var ButtonBar = function(map) {
    var map = map;
    
    this.init = function() {
        setupDragButtonBar();
        setupSyncToggleButton();
    }
    
    var setupDragButtonBar = function() {
        var isMouseDown = false;
        
        var map = document.querySelector('#map-room-map');
        var mapToolbar = document.querySelector('#map-toolbar');
        
        var mouseDown = function() {
            isMouseDown = true;
        }
        
        var mouseUp = function() {
            isMouseDown = false;
        }
        
        var mouseMove = function(e) {
            if (isMouseDown) {
                mapToolbar.style.right = map.offsetWidth - e.clientX  - 25 + 'px';
                mapToolbar.style.top = e.clientY - 25 + 'px';
            }
        }
        
        mapToolbar.addEventListener('mousedown', mouseDown, false);
        window.addEventListener('mouseup', mouseUp, false);
        window.addEventListener('mousemove', mouseMove, false);
    }
    
    var setupSyncToggleButton = function() {
        var clickSyncToggleButton = function() {
            this.classList.toggle('is-active');
            map.toggleSync();
        }
        
        syncToggle = document.querySelector('#map-toolbar-sync-toggle');
        syncToggle.addEventListener('click', clickSyncToggleButton);
    }
    
    /* ==== Init  ==== */
    this.init();
}

/* Util */
var getMapRoomData = function() {
    return window.mapRoom;
}
