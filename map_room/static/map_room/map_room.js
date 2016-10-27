var MapRoom = function() {
    this.init = function() {
        setupMap();
        setupWebSocket();
    }
    
    var mapRoom = L.map('map-room-map').setView([47.6062, -122.3321], 13);
    
    /* Leaflet Map */
    var setupMap = function() {
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.light',
            accessToken: 'pk.eyJ1IjoiemFjaGFyaWxpdXMiLCJhIjoiY2l1cHU4eGk4MDFsazNvcGh4dzRnZWU0NSJ9.pIC-kFg6gpOpA-s0to0C0g'
        }).addTo(mapRoom);
    }
    
    /* Leaflet Map Sync */
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
            default:
                console.warn('Unrecognized action: ' + action);
        }
    }
    
    /* Pan Sync */
    mapRoom.on('moveend', function(e) {
        var message = {
            'action': 'pan',
            'mapCenter': e.target.getCenter()
        }
        
        sendWebSocketMessage(message);
    });
    
    var performPanAction = function(data) {
        new_map_center = data['mapCenter'];
        current_map_center = mapRoom.getCenter();
        
        if (new_map_center['lat'] != current_map_center['lat'] || new_map_center['lng'] != current_map_center['lng']) {
            mapRoom.setView(data['mapCenter']);
        } else {
            /* Already at map center so no need to sync */
            /* Do Nothing */
        }
    }
    
    /* Location */
    var getGeoLocation= function() {
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
    
    /* Init */
    this.init();
}

var mapRoom = MapRoom();
