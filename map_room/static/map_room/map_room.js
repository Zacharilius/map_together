/* Init */

$(function() {
    var map = new MapRoom();
    var buttonBar = new ButtonBar(map);
    var chat = new Chat();
})

var MapRoom = function() {
    var isSyncActive = true;

    var init = function() {
        if (isReadOnly()) {
            setupReadOnlyView();
        } else {
            setupMapOwnerView();
        }
    }

    var setupMapOwnerView = function () {
        setupMap();
        setupWebSocket();
        setupLeafletDraw();
    }

    var setupReadOnlyView = function () {
        setupMap();
        setupWebSocket();
        setupReadOnlyGeoJson();
    }

    var setupReadOnlyGeoJson = function() {
        var geoJsonFileInfos = window.geojsonFileInfos;
        for (var i in geoJsonFileInfos) {
            var geoJsonString = geoJsonFileInfos[i]['geoJson']
            addGeoJsonToMap(geoJsonString);
        }
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

    var mapRoomWS;

    var setupWebSocket = function() {
        mapRoomWS = createWebSocket('map-sync');

        mapRoomWS.onmessage = function(e) {
            // Do not sync changes if user is the map room owner because
            // they are already in sync.
            if (isMapRoomOwner()) {
                return;
            }

            var data = JSON.parse(e.data);
            var type = data['type'];
            var message = data['message']

            if (type == 'geoJsonSync') {
                addGeoJsonToMap(message['geoJson']);
            }
            else if (type == 'mapSync') {
                onMapSyncMessage(message);
            }
        }
    }

    var readOnlyGeoJsonLayer = '';

    var addGeoJsonToMap = function(geoJsonString) {
        // No geoJson has been synced.
        if (readOnlyGeoJsonLayer != '') {
            readOnlyGeoJsonLayer.clearLayers();
        }
        var geoJson = JSON.parse(geoJsonString);
        readOnlyGeoJsonLayer = L.geoJson(geoJson).addTo(mapRoom);
    }

    var sendWebSocketMessage = function(message) {
        if (isSyncActive && !isReadOnly()) {
            mapRoomWS.send(JSON.stringify(message));
        }
    }

    var onMapSyncMessage = function(message) {
        if (isSyncActive) {
            var action = message['action'];
            switch(action) {
                case 'pan':
                    performPanAction(message);
                    break;
                case 'zoom':
                    performZoomSyncAction(message);
                    break;
                default:
                    console.warn('Unrecognized action: ' + action);
            }
        }
    }

    /* Pan Sync */
    mapRoom.on('moveend', function(e) {
        sendWebSocketMessage(createMapSyncMessageFor('pan', e));
    });

    var performPanAction = function(data) {
        mapRoom.setView(data['mapCenter']);
    }

    /* Zoom Sync */
    mapRoom.on('zoomend', function(e) {
        sendWebSocketMessage(createMapSyncMessageFor('zoom', e));
    })

    var performZoomSyncAction = function(data) {
        mapRoom.setZoom(data['zoomLevel']);
    }

    var createMapSyncMessageFor = function(action, e) {
        var message = {
            'type': 'mapSync',
            'action': action,
            'mapCenter': e.target.getCenter(),
            'zoomLevel': e.target.getZoom()
        };
        return message;
    }

    /* ==== Library GeoJSON ==== */
    // GeoJSON files that are served from the static file server because of
    // their large size

    this.addStaticGeojsonFileToMap = function(geoJsonIndex) {
        var geojsonVarName = getStaticGeojsonFileInfos()[geoJsonIndex]['varName'];
        var geoJsonLayer = window[geojsonVarName];
        if (!isStaticGeoJsonLayerActive(geoJsonIndex)) {
            var layer = L.geoJson(geoJsonLayer).addTo(mapRoom);
            addStaticActiveGeoJsonLayer(geoJsonIndex, layer);
        } else {
            mapRoom.removeLayer(getStaticActiveGeoJsonLayer(geoJsonIndex));
            removeStaticActiveGeoJsonLayer(geoJsonIndex, layer);
        }
    }

    var activeStaticGeoJsonLayers = {};

    var isStaticGeoJsonLayerActive = function(index) {
        return activeStaticGeoJsonLayers[index] != undefined;
    }

    var addStaticActiveGeoJsonLayer = function(index, layer) {
        activeStaticGeoJsonLayers[index] = layer;
    }

    var removeStaticActiveGeoJsonLayer = function(index, layer) {
        delete activeStaticGeoJsonLayers[index];
    }

    var getStaticActiveGeoJsonLayer = function(index) {
        return activeStaticGeoJsonLayers[index];
    }

    /* ==== Leaflet Draw ==== */

    var setupLeafletDraw = function() {
        var editableLayers = new L.FeatureGroup(convertInitGeoJsonToLayers());
        editableLayers.addTo(mapRoom)

        var drawControl = new L.Control.Draw({
            draw: {
                marker: {
                    distance: 25
                },
                polyline: {
                    distance: 20
                },
                polygon: {
                    distance: 25,
                    allowIntersection: false,
                    showArea: true
                },
                rectangle: {},
                circle: false
            },
            edit: {
                featureGroup: editableLayers,
                poly: {
                    allowIntersection: false
                }
            }
        });

        mapRoom.addControl(drawControl);

        mapRoom.on('draw:created', function (e) {
            var layer = e.layer;
            editableLayers.addLayer(layer);
            sendAllDrawItems();
        });

        mapRoom.on('draw:deletestop', function(e) {
            sendAllDrawItems();
        });

        mapRoom.on('draw:edited', function(e) {
            sendAllDrawItems();
        });

        var sendAllDrawItems = function() {
            mapGeoJson = JSON.stringify(editableLayers.toGeoJSON());
            var mapGeoJsonMessage = createNewGeoJsonMessageFor(mapGeoJson);
            sendWebSocketMessage(mapGeoJsonMessage);
        }
    }

    var convertInitGeoJsonToLayers = function() {
        var geoJsonFileInfos = window.geojsonFileInfos;
        var layers = []
        for (var i in geoJsonFileInfos) {
            var geoJsonString = geoJsonFileInfos[i]['geoJson']
            var geoJson = JSON.parse(geoJsonString);
            var layerGroup = L.geoJson(geoJson);
            for (var j in layerGroup.getLayers()) {
                layers.push(layerGroup.getLayers()[j]);
            }
        }
        return layers;
    }

    var createNewGeoJsonMessageFor = function(geoJson) {
        var message = {
            'type': 'geoJsonSync',
            'geoJson': geoJson
        }
        return message;
    }

    /* ==== Location ==== */

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

    /* ==== Init  ==== */
    init();
}


var ButtonBar = function(map) {
    var map = map;

    this.init = function() {
        // Disable Dragging button bar
        // setupDragButtonBar();
        buttonSetup();
        if (isReadOnly()) {
            setupButtonDisabledStates();
        }
    }

    var isButtonBarDragInProgress = false;
    var setupDragButtonBar = function() {
        var map = document.querySelector('#map-room-map');
        var mapToolbar = document.querySelector('#map-toolbar');

        var mouseDown = function() {
            isButtonBarDragInProgress = true;
        }

        var mouseUp = function() {
            isButtonBarDragInProgress = false;
        }

        var mouseMove = function(e) {
            if (isButtonBarDragInProgress) {
                mapToolbar.style.right = map.offsetWidth - e.clientX  - 25 + 'px';
                mapToolbar.style.top = e.clientY - 25 + 'px';
            }
        }

        mapToolbar.addEventListener('mousedown', mouseDown, false);
        window.addEventListener('mouseup', mouseUp, false);
        window.addEventListener('mousemove', mouseMove, false);
    }

    /* ==== Buttons ==== */

    var buttonSetup = function() {
        setupSyncToggleButton();
        setupChatToggleButton();
        setupGeojsonFiles();
    }

    var setupSyncToggleButton = function() {
        var clickSyncToggleButton = function() {
            var thisIcon = $(this).find('i');
            if (thisIcon.text() == 'check_box_outline_blank') {
                thisIcon.text('check_box')
            } else {
                thisIcon.text('check_box_outline_blank')
            }
            map.toggleSync();
        }

        syncToggle = document.querySelector('#map-toolbar-sync-toggle');
        syncToggle.addEventListener('click', clickSyncToggleButton);
    }

    var setupChatToggleButton = function() {
        var clickChatToggleButton = function() {
            var mapRoomChat = document.querySelector('#map-room-chat');

            /* Position chat below the Map toolbar */
            var mapToolbar = document.querySelector('#map-toolbar')
            mapToolbarBoundingRect = mapToolbar.getBoundingClientRect();
            mapRoomChat.style.top = (mapToolbarBoundingRect['top'] + mapToolbarBoundingRect['height']) + "px";
            mapRoomChat.style.right = (document.body.offsetWidth - mapToolbarBoundingRect['left'] - mapToolbarBoundingRect['width']) + "px";

            mapRoomChat.classList.toggle('is-visible');
        }

        var chatToggleButton = document.querySelector('#map-toolbar-chat-toggle');
        chatToggleButton.addEventListener('click', clickChatToggleButton);
    }

    var setupGeojsonFiles = function() {
        var geojsonFileInfos = getStaticGeojsonFileInfos();
        for (let i = 0; i < geojsonFileInfos.length; i++) {
            var li = $('<li class="mdl-menu__item">' + geojsonFileInfos[i].title + '</li>');
            li.click(function() {
                $(this).toggleClass('is-active');
                map.addStaticGeojsonFileToMap(i);
            });
            $('#map-toolbar-geojson-list').append(li);
        }

    }

    /* Disabled State */
    var setupButtonDisabledStates = function() {
        $('#map-toolbar-sync-toggle').attr('disabled', true);
    }

    /* ==== Init  ==== */

    this.init();
}

var Chat = function() {
    var init = function() {
        populateChatMessages();
        setupChat();
        setupWebSocket();
        if (isReadOnly()) {
            setupChatDisabledState();
        }
    }

    var populateChatMessages = function() {
        var chatInfos = getMapRoomChatInfos();
        for (i = 0; i < chatInfos.length; i++) {
            chatInfo = chatInfos[i];
            appendNewChatMessage(chatInfo);
        }
        if (chatInfos.length == 0) {
            $('#map-room-empty-message').show();
        }
    }

    var setupChat = function() {
        var submitChatInput = function(e) {
            var chatInput = document.querySelector('#map-room-chat-input');
            sendWebSocketMessage(chatInput.value);
            chatInput.value = ''

            e.preventDefault();
        }

        var chatForm = document.querySelector('#map-room-chat form');
        chatForm.addEventListener('submit', submitChatInput);
    }

    var appendNewChatMessage = function(chatInfo) {
        $('#map-room-empty-message').hide();
        var message = chatInfo['message'];
        var owner = chatInfo['owner'];
        var newMessage = $('<div class="map-room-message-container"><p><span>' + owner + ' says</span>' + message + '</p></div>');
        if (usernameIsLoggedInUser(owner)) {
            newMessage.addClass('map-room-user-chat-message');
        }
        $('#map-room-messages-container').append(newMessage);
        scrollChatToBottomSlowly();
    }

    function usernameIsLoggedInUser(username) {
        return getUserInfo()['username'] == username;
    }

    function scrollChatToBottomSlowly() {
        var mapRoomContainer = $('#map-room-messages-container');
        mapRoomContainer.animate({scrollTop: mapRoomContainer[0].scrollHeight}, "slow");
    }

    function scrollChatToBottom() {
        var mapRoomContainer = $('#map-room-messages-container');
        mapRoomContainer.scrollTop(mapRoomContainer[0].scrollHeight);
    }

    var chatWS;
    var setupWebSocket = function() {
        chatWS = createWebSocket('chat');

        chatWS.onmessage = function(e) {
            var message = JSON.parse(e.data);
            appendNewChatMessage(message);
        }
    }

    var sendWebSocketMessage = function(messageText) {
        chatWS.send(JSON.stringify(createChatMessage(messageText)));
    }

    var createChatMessage = function(messageText) {
        var message = {
            'type': 'chat',
            'messageText': messageText
        };
        return message;
    }


    /* Disabled State */
    var setupChatDisabledState = function() {
        // Input field
        var chatInputContainer = $('#map-room-current-name-input');
        chatInputContainer.find('input').attr('disabled', true);
        chatInputContainer.find('label').text('Please login to chat.');

        // Submit Button
        $('#map-room-submit-chat').attr('disabled', true);
    }

    /* ==== Init  ==== */

    init();
}

/* Util */
var createWebSocket = function(path) {
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    return new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/ws" + window.location.pathname + '/' + path);
}

var getMapRoomData = function() {
    return window.mapRoom;
}

var getUserInfo = function() {
    return userInfo || {};
}

var isAuthenticated = function() {
    return getUserInfo()['isAuthenticated'];
}

/* Only authenticated users have write access */
var isReadOnly = function() {
    return !isAuthenticated() || !isMapRoomOwner();
}

var isMapRoomOwner = function() {
    return getMapRoomData()['ownerUsername'] == getUserInfo()['username'];
}

var getMapRoomChatInfos = function() {
    return window.chatMessageInfos;
}

var GEOJSON_FILES = [
    {"varName": "seattleBoundaries", "title": "Seattle Boundaries", "description": "A file showing the boundaries of the city of Seattle.", "source": "https://github.com/openseattle/"},
    {"varName": "seattleParkBenches", "title": "Seattle Park Benches", "description": "Park Benches in Seattle.", "source": "https://github.com/Zacharilius/zacharilius.github.io/blob/master/js/seattle_parks_rec.json"}
]

var getStaticGeojsonFileInfos = function() {
    return GEOJSON_FILES;
}
