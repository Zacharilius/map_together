var MapRoom = function() {
    this.init = function() {
        setupMap();
        setupWebSocket();
    }
    
    /* Leaflet Map */
    var setupMap = function() {
        var mapRoom = L.map('map-room-map').setView([47.6062, -122.3321], 13);

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.light',
            accessToken: 'pk.eyJ1IjoiemFjaGFyaWxpdXMiLCJhIjoiY2l1cHU4eGk4MDFsazNvcGh4dzRnZWU0NSJ9.pIC-kFg6gpOpA-s0to0C0g'
        }).addTo(mapRoom);
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
    
    /* Web Socket */
    var setupWebSocket = function() {
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        window.map_room_ws = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/ws" + window.location.pathname);
    }
    
    var sendWebSocketMessage = function(message) {
        window.map_room_ws.send(JSON.stringify(message));
    }
    
    /* Init */
    this.init();
}

var mapRoom = MapRoom();
