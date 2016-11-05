var MapRoom = function() {
    this.init = function() {
        setupMap();
        setupWebSocket();
    }
    
    var mapRoom = L.map('map-room-map').setView([getMapRoomData()['center']['lat'], getMapRoomData()['center']['lng']], getMapRoomData()['zoom']);
    
    /* Leaflet Map */
    var setupMap = function() {
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            id: 'mapbox.light',
            accessToken: 'pk.eyJ1IjoiemFjaGFyaWxpdXMiLCJhIjoiY2l1cHU4eGk4MDFsazNvcGh4dzRnZWU0NSJ9.pIC-kFg6gpOpA-s0to0C0g'
        }).addTo(mapRoom);
    }
    
    /* ==== Leaflet Map Sync ==== */
    /* Will not sync local action while processing sync from server */
    var syncInProgress = false;
    
    var setupWebSocket = function() {
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        window.map_room_ws = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/ws" + window.location.pathname);

        window.map_room_ws.onmessage = function(e) {
            syncInProgress = true
            
            var data = JSON.parse(e.data);
            onMapSyncMessage(data)
            
            syncInProgress = false;
        }
    }
    
    var sendWebSocketMessage = function(message) {
        /* Prevent syncing ping pong with web socket server */
        if (!syncInProgress) {
            window.map_room_ws.send(JSON.stringify(message));
        }
    }
    
    var onMapSyncMessage = function(data) {
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
    
    /* Pan Sync */
    mapRoom.on('moveend', function(e) {
        var message = createMessageFor('pan', e)
        
        console.log('sending pan request');
        
        sendWebSocketMessage(message);
        L.DomEvent.preventDefault(e);
    });
    
    var performPanAction = function(data) {
        new_map_center = data['mapCenter'];
        current_map_center = mapRoom.getCenter();
        
        if (new_map_center['lat'] != current_map_center['lat'] || new_map_center['lng'] != current_map_center['lng']) {
            console.log('performing requested pan');
            mapRoom.setView(new_map_center);
        } else {
            /* Already at map center so no need to sync */
        }
    }
    
    /* Zoom Sync */
    mapRoom.on('zoomend', function(e) {
        var message = createMessageFor('zoom', e)
        console.log('sending zoom request');
        
        sendWebSocketMessage(message);
        L.DomEvent.preventDefault(e);
    })
    
    var performZoomAction = function(data) {
        console.log('zooming');
        new_map_zoom = data['zoomLevel'];
        current_map_center = mapRoom.getZoom();
        
        if (new_map_zoom != current_map_center) {
            console.log('performing requested zoom');
            mapRoom.setZoom(new_map_zoom);
        } else {
            /* Already at correct zoom so no need to sync */
        }
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
    
    /* Init */
    this.init();
}

/* Util */
var getMapRoomData = function() {
    return window.mapRoom;
}

/* Init */
var mapRoom = MapRoom();
