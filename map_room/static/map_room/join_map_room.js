var JoinMapRoom = function() {
    var init = function() {
        setupMapRoomContainers();
        setupClickMapRoomnameGenerator();
    }

    var setupMapRoomContainers = function() {
        /* Submit Name */
        $('#map-room-new-submit-button').click(function() {
            var mapRoomName = document.getElementById('map-room-room-name').value;
            if (mapRoomName.length == 0) {
                mapRoomName = createHaikuName();
            }

            $.ajax({
                url: '/map-room/create-map-room/',
                type: 'POST',
                data: {
                    'csrfmiddlewaretoken': $('#csrf-token').find('input').attr('value'),
                    'mapRoomName': mapRoomName
                },
                success: function(data) {
                    /* Go to map room */
                    window.location = data['map_room_url'];
                ;},
                error: function(e) {
                    console.error(e.message);
                }
            });
        });
    }

    /* MapRoom Name Generator */
    function setupClickMapRoomnameGenerator() {
        addNewHaikuNameToContainerName();

        document.getElementById('map-room-new-haiku-name-button').addEventListener('click', function() {
            addNewHaikuNameToContainerName();
        });
    }

    var addNewHaikuNameToContainerName = function() {
        var newMapRoom = document.getElementById('map-room-room-name');
        newMapRoom.value = createHaikuName();
    }

    var createHaikuName = function(){
        var adjectives = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry",
        "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring",
        "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered",
        "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green",
        "long", "late", "lingering", "bold", "little", "morning", "muddy", "old",
        "red", "rough", "still", "small", "sparkling", "throbbing", "shy",
        "wandering", "withered", "wild", "black", "young", "holy", "solitary",
        "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine",
        "polished", "ancient", "purple", "lively", "nameless"]

        var nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea",
        "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn",
        "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird",
        "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower",
        "firefly", "feather", "grass", "haze", "mountain", "night", "pond",
        "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf",
        "thunder", "violet", "water", "wildflower", "wave", "water", "resonance",
        "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper",
        "frog", "smoke", "star"];

        return adjectives[Math.floor(Math.random()*(adjectives.length-1))]+"-"+nouns[Math.floor(Math.random()*(nouns.length-1))];
    }

    init();
}

var joinMapRoom = JoinMapRoom();

