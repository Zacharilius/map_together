/* ==== Init ==== */

window.onload = function() {
    var mapRoom = new MapRoom();
};

/* ==== MapRoom ==== */

var MapRoom = function() {
    this.isSyncActive = true;
    this.setupMap();
    var buttonBar = new ButtonBar(this);
    var chat = new Chat();
};

MapRoom.prototype.defaultColor = '#3388ff';

/* ---- Leaflet Map ---- */

MapRoom.prototype.setupMap = function() {
    var mapState = getMapRoomInfo();

    this.mapRoom = L.map('map-room-map').setView([mapState['mapCenter']['lat'], mapState['mapCenter']['lng']], mapState['zoom']);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1IjoiemFjaGFyaWxpdXMiLCJhIjoiY2l1cHU4eGk4MDFsazNvcGh4dzRnZWU0NSJ9.pIC-kFg6gpOpA-s0to0C0g'
    }).addTo(this.mapRoom);

    this.setupPanSync();
    this.setupZoomSync();

    this.setupWebSocket();

    if (isReadOnly()) {
        this.setupReadOnlyGeoJson();
    } else {
        this.setupLeafletDraw();
    }
};

MapRoom.prototype.setupReadOnlyGeoJson = function() {
    var geoJsonFileInfos = window.geojsonFileInfos;
    for (var i in geoJsonFileInfos) {
        var geoJsonString = geoJsonFileInfos[i]['geoJson']
        this.addGeoJsonToMap(geoJsonString);
    }
};

MapRoom.prototype.toggleSync = function() {
    this.isSyncActive = !this.isSyncActive;
};

/* ---- Map Sync ---- */

MapRoom.prototype.setupWebSocket = function() {
    var self = this;

    this.mapRoomWS = createWebSocket('map-sync');

    this.mapRoomWS.onmessage = function(e) {
        // Do not sync changes if user is the map room owner because
        // they are already in sync.
        if (isMapRoomOwner()) {
            return;
        }

        var data = JSON.parse(e.data);
        var type = data['type'];
        var message = data['message']

        if (type == 'geoJsonSync') {
            self.addGeoJsonToMap(message['geoJson']);
        }
        else if (type == 'mapSync') {
            self.onMapSyncMessage(message);
        }
    }
};

    var readOnlyGeoJsonLayer = '';

MapRoom.prototype.addGeoJsonToMap = function(geoJsonString) {
    // No geoJson has been synced.
    if (readOnlyGeoJsonLayer != '') {
        readOnlyGeoJsonLayer.clearLayers();
    }
    var geoJson = JSON.parse(geoJsonString);
    readOnlyGeoJsonLayer = L.geoJson(geoJson).addTo(this.mapRoom);
};

MapRoom.prototype.sendWebSocketMessage = function(message) {
    if (this.isSyncActive && !isReadOnly()) {
        this.mapRoomWS.send(JSON.stringify(message));
    }
};

MapRoom.prototype.onMapSyncMessage = function(message) {
    if (this.isSyncActive) {
        var action = message['action'];
        switch(action) {
            case 'pan':
                this.performPanAction(message);
                break;
            case 'zoom':
                this.performZoomSyncAction(message);
                break;
            default:
                console.warn('Unrecognized action: ' + action);
        }
    }
};

MapRoom.prototype.setupPanSync = function() {
    var self = this;
    self.mapRoom.on('moveend', function(e) {
        self.sendWebSocketMessage(self.createMapSyncMessageFor('pan', e));
    });
};

MapRoom.prototype.performPanAction = function(data) {
    this.mapRoom.setView(data['mapCenter']);
};

MapRoom.prototype.setupZoomSync = function() {
    var self = this;
    self.mapRoom.on('zoomend', function(e) {
        self.sendWebSocketMessage(self.createMapSyncMessageFor('zoom', e));
    });
};

MapRoom.prototype.performZoomSyncAction = function(data) {
    this.mapRoom.setZoom(data['zoomLevel']);
};

MapRoom.prototype.createMapSyncMessageFor = function(action, e) {
    var message = {
        'type': 'mapSync',
        'action': action,
        'mapCenter': e.target.getCenter(),
        'zoomLevel': e.target.getZoom()
    };
    return message;
};

/* ---- Library GeoJSON ---- */
// GeoJSON files that are served from the static file server because of
// their large size

MapRoom.prototype.addStaticGeojsonFileToMap = function(geoJsonIndex) {
    var geojsonVarName = getStaticGeojsonFileInfos()[geoJsonIndex]['varName'];
    var geoJsonLayer = window[geojsonVarName];
    if (!this.isStaticGeoJsonLayerActive(geoJsonIndex)) {
        var layer = L.geoJson(geoJsonLayer).addTo(this.mapRoom);
        this.addStaticActiveGeoJsonLayer(geoJsonIndex, layer);
    } else {
        this.mapRoom.removeLayer(this.getStaticActiveGeoJsonLayer(geoJsonIndex));
        this.removeStaticActiveGeoJsonLayer(geoJsonIndex, layer);
    }
};

MapRoom.prototype.activeStaticGeoJsonLayers = {};

MapRoom.prototype.isStaticGeoJsonLayerActive = function(index) {
    return this.activeStaticGeoJsonLayers[index] != undefined;
};

MapRoom.prototype.addStaticActiveGeoJsonLayer = function(index, layer) {
    this.activeStaticGeoJsonLayers[index] = layer;
};

MapRoom.prototype.removeStaticActiveGeoJsonLayer = function(index, layer) {
    delete this.activeStaticGeoJsonLayers[index];
};

MapRoom.prototype.getStaticActiveGeoJsonLayer = function(index) {
    return this.activeStaticGeoJsonLayers[index];
};

/* ---- Draw ---- */

MapRoom.prototype.setupLeafletDraw = function() {
    var self = this;

    function onClick(e) {
        var layer = e.layer;
        var feature = layer.feature;
        var props = feature.properties;
        console.log(props);
    }

    var editableLayers = new L.FeatureGroup(self.convertInitGeoJsonToLayers())
        .on('click', onClick)
        .addTo(self.mapRoom);

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

    self.mapRoom.addControl(drawControl);

    self.mapRoom.on('draw:created', function (e) {
        var layer = e.layer;

        var feature = layer.feature = {};
        feature.type = feature.type || 'Feature';

        var props = feature.properties = {};
        // TODO: Initialize with empty strings.
        props.title = 'Test title';
        props.color = self.defaultColor;
        props.category = 'Test Category';
        props.content = 'Test Content';

        editableLayers.addLayer(layer);
        sendAllDrawItems();
    });

    self.mapRoom.on('draw:deletestop', function(e) {
        sendAllDrawItems();
    });

    self.mapRoom.on('draw:edited', function(e) {
        sendAllDrawItems();
    });

    var sendAllDrawItems = function() {
        mapGeoJson = JSON.stringify(editableLayers.toGeoJSON());
        var mapGeoJsonMessage = self.createNewGeoJsonMessageFor(mapGeoJson);
        self.sendWebSocketMessage(mapGeoJsonMessage);
    }
};

MapRoom.prototype.convertInitGeoJsonToLayers = function() {
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
};

MapRoom.prototype.createNewGeoJsonMessageFor = function(geoJson) {
    var message = {
        'type': 'geoJsonSync',
        'geoJson': geoJson
    }
    return message;
};

/* ---- Location ---- */

MapRoom.prototype.getGeoLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation);
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
};

MapRoom.prototype.updateLocation = function(position) {
    console.log('Latitude: ' + position.coords.latitude +
    '<br>Longitude: ' + position.coords.longitude);
};


/* ==== ButtonBar ==== */

var ButtonBar = function(mapRoom) {
    this.mapRoom = mapRoom;
    this.isButtonBarDragInProgress = false;

    // Disable Dragging button bar
    // setupDragButtonBar();
    this.buttonSetup();
    if (isReadOnly()) {
        this.setupButtonDisabledStates();
    }
};

ButtonBar.prototype.setupDragButtonBar = function() {
    var mapEl = document.querySelector('#map-room-map');
    var mapToolbar = document.querySelector('#map-toolbar');
    var self = this;

    var mouseDown = function() {
        self.isButtonBarDragInProgress = true;
    }

    var mouseUp = function() {
        self.isButtonBarDragInProgress = false;
    }

    var mouseMove = function(e) {
        if (self.isButtonBarDragInProgress) {
            var edgeOffset = 25;
            mapToolbar.style.right = mapEl.offsetWidth - e.clientX  - edgeOffset + 'px';
            mapToolbar.style.top = e.clientY - edgeOffset + 'px';
        }
    }

    mapToolbar.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);
    window.addEventListener('mousemove', mouseMove, false);
};

/* ---- Buttons ---- */

ButtonBar.prototype.buttonSetup = function() {
    this.setupSyncToggleButton();
    this.setupTableContainerButton();
    this.setupChatToggleButton();
    this.setupGeojsonFiles();
};

ButtonBar.prototype.setupSyncToggleButton = function() {
    var self = this;
    var clickSyncToggleButton = function() {
        var thisIcon = this.querySelector('i');
        if (thisIcon.innerText === 'check_box_outline_blank') {
            thisIcon.innerText = 'check_box';
        } else {
            thisIcon.innerText = 'check_box_outline_blank';
        }
        self.mapRoom.toggleSync();
    }

    syncToggle = document.querySelector('#map-toolbar-sync-toggle');
    syncToggle.addEventListener('click', clickSyncToggleButton);
};

ButtonBar.prototype.setupTableContainerButton = function() {
    var self = this;
    var clickToggleShowTableContainer = function() {
        var mapContainer = document.querySelector('#map-room-map-container');
        toggleClass(mapContainer, ['split-screen']);
        var tableContainer = document.querySelector('#map-room-table-container');
        toggleClass(tableContainer, ['split-screen']);
    }

    syncToggle = document.querySelector('#map-toolbar-table-toggle');
    syncToggle.addEventListener('click', clickToggleShowTableContainer);
};

ButtonBar.prototype.setupChatToggleButton = function() {
    var clickChatToggleButton = function() {
        var mapRoomChat = document.querySelector('#map-room-chat');

        /* Position chat below the Map toolbar */
        var mapToolbar = document.querySelector('#map-toolbar')
        mapToolbarBoundingRect = mapToolbar.getBoundingClientRect();
        mapRoomChat.style.top = (mapToolbarBoundingRect['top'] + mapToolbarBoundingRect['height']) + 'px';
        mapRoomChat.style.right = (document.body.offsetWidth - mapToolbarBoundingRect['left'] - mapToolbarBoundingRect['width']) + 'px';

        mapRoomChat.classList.toggle('is-visible');
    }

    var chatToggleButton = document.querySelector('#map-toolbar-chat-toggle');
    chatToggleButton.addEventListener('click', clickChatToggleButton);
};

ButtonBar.prototype.setupGeojsonFiles = function() {
    var self = this;
    var geojsonFileInfos = getStaticGeojsonFileInfos();
    for (let i = 0; i < geojsonFileInfos.length; i++) {
        var li = document.createElement('li');
        addClass(li, 'mdl-menu__item');
        li.appendChild(document.createTextNode(geojsonFileInfos[i].title));
        li.addEventListener('click', function() {
            toggleClass(this, ('is-active'));
            self.mapRoom.addStaticGeojsonFileToMap(i);
        });
        document.querySelector('#map-toolbar-geojson-list').appendChild(li);
    }
};

/* Disabled State */
ButtonBar.prototype.setupButtonDisabledStates = function() {
    document.querySelector('#map-toolbar-sync-toggle').setAttribute('disabled', true);
};


/* ==== Chat ==== */

var Chat = function() {
    this.populateChatMessages();
    this.setupChat();
    this.chatWS = this.createChatWebSocket();
    if (isReadOnly()) {
        this.setupChatDisabledState();
    }
};

Chat.prototype.populateChatMessages = function() {
    var chatInfos = getMapRoomChatInfos();
    for (i = 0; i < chatInfos.length; i++) {
        chatInfo = chatInfos[i];
        this.appendNewChatMessage(chatInfo);
    }
    if (chatInfos.length === 0) {
        showElement(document.querySelector('#map-room-empty-message'));
    }
};

Chat.prototype.setupChat = function() {
    var self = this;
    var submitChatInput = function(e) {
        var chatInput = document.querySelector('#map-room-chat-input');
        self.sendWebSocketMessage(chatInput.value);
        chatInput.value = ''

        e.preventDefault();
    }

    var chatFormEl = document.querySelector('#map-room-chat form');
    chatFormEl.addEventListener('submit', submitChatInput);
}

Chat.prototype.appendNewChatMessage = function(chatInfo) {
    hideElement(document.querySelector('#map-room-empty-message'));
    var message = chatInfo['message'];
    var owner = chatInfo['owner'];

    var newMessageSpan = document.createElement('span');
    newMessageSpan.appendChild(document.createTextNode(owner + ' says'));

    var newMessageP = document.createElement('p');
    newMessageP.appendChild(newMessageSpan);
    newMessageP.appendChild(document.createTextNode(message));

    var newMessageDiv = document.createElement('div');
    addClass(newMessageDiv, 'map-room-message-container');
    newMessageDiv.appendChild(newMessageP);

    if (this.usernameIsLoggedInUser(owner)) {
        addClass(newMessageSpan, 'map-room-user-chat-message');
    }

    document.querySelector('#map-room-messages-container').appendChild(newMessageDiv);
    this.scrollChatToBottomSlowly();
}

Chat.prototype.usernameIsLoggedInUser = function(username) {
    return getUserInfo()['username'] == username;
}

Chat.prototype.scrollChatToBottomSlowly = function() {
    var mapRoomContainerEl = document.querySelector('#map-room-messages-container');

    var totalNeedsToScroll = mapRoomContainerEl.offsetHeight - mapRoomContainerEl.scrollTop;
    var maxTime = 300;
    var updateInterval = 50;
    var scrollIncremOffset = Math.max(10, totalNeedsToScroll / (maxTime / updateInterval));

    var animateMapContaierInterval = window.setInterval(function() {
        mapRoomContainerEl.scrollTop += scrollIncremOffset;

        if ((mapRoomContainerEl.scrollTop + mapRoomContainerEl.offsetHeight) >= mapRoomContainerEl.scrollHeight) {
            window.clearInterval(animateMapContaierInterval);
        }
    }, updateInterval);
}

Chat.prototype.scrollChatToBottom = function() {
    var mapRoomContainerEl = document.querySelector('#map-room-messages-container');
    mapRoomContainerEl.scrollTop = mapRoomContainerEl.scrollHeight;
}

Chat.prototype.createChatWebSocket = function() {
    chatWS = createWebSocket('chat');
    var self = this;

    chatWS.onmessage = function(e) {
        var message = JSON.parse(e.data);
        self.appendNewChatMessage(message);
    }
    return chatWS;
};

Chat.prototype.sendWebSocketMessage = function(messageText) {
    this.chatWS.send(JSON.stringify(this.createChatMessage(messageText)));
};

Chat.prototype.createChatMessage = function(messageText) {
    var message = {
        'type': 'chat',
        'messageText': messageText
    };

    return message;
};

/* Disabled State */
Chat.prototype.setupChatDisabledState = function() {
    // Input field
    var chatInputContainerEl = document.querySelector('#map-room-current-name-input');
    chatInputContainerEl.querySelector('input').setAttribute('disabled', true);
    chatInputContainerEl.querySelector('label').innerText = 'Please login to chat.';

    // Submit Button
    document.querySelector('#map-room-submit-chat').setAttribute('disabled', true);
};


/* ==== Util ==== */

var toggleClass = function(element, clazz) {
    if (hasClass(element, clazz)) {
        removeClass(element, clazz);
    } else {
        addClass(element, clazz);
    }
};

var hasClass = function(element, clazz) {
    return element.classList.contains(clazz);
};

var addClass = function(element, clazz) {
    element.classList.add(clazz);
};

var removeClass = function(element, clazz) {
    element.classList.remove(clazz);
};

var toggleElement = function(element) {
    if (element.style.display === 'none') {
        showElement(element);
    } else {
        hideElement(element);
    }
};

var hideElement = function(element) {
    element.style.display = 'none';
};

var showElement = function(element) {
    element.style.display = 'block';
};

var hasAttr = function(element, attr) {
    element.attributes.getNamedItem(attr) !== null;
};

var createWebSocket = function(path) {
    var ws_scheme = window.location.protocol == 'https:' ? 'wss' : 'ws';
    return new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + '/ws' + window.location.pathname + '/' + path);
};

var getMapRoomInfo = function() {
    return window.mapRoomInfo;
};

var getUserInfo = function() {
    return userInfo || {};
};

var isAuthenticated = function() {
    return getUserInfo()['isAuthenticated'];
};

/* Only authenticated users have write access */
var isReadOnly = function() {  // TODO: Encapsulate inside mapRoom
    return !isAuthenticated() || !isMapRoomOwner();
};

var isMapRoomOwner = function() {
    return getMapRoomInfo()['ownerUsername'] == getUserInfo()['username'];
};

var getMapRoomChatInfos = function() {
    return window.chatMessageInfos;
};

var GEOJSON_FILES = [
    {'varName': 'seattleBoundaries', 'title': 'Seattle Boundaries', 'description': 'A file showing the boundaries of the city of Seattle.', 'source': 'https://github.com/openseattle/'},
    {'varName': 'seattleParkBenches', 'title': 'Seattle Park Benches', 'description': 'Park Benches in Seattle.', 'source': 'https://github.com/Zacharilius/zacharilius.github.io/blob/master/js/seattle_parks_rec.json'}
];

var getStaticGeojsonFileInfos = function() {
    return GEOJSON_FILES;
};
