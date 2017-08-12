$(function() {
    setupMapRoomUpdate();
});

function setupMapRoomUpdate() {
   $('.mr-update-button').click(function() {
        updateMapRoom($(this).closest('.map-room-map-container'));
   });

   $('.map-room-name-input').keypress(function(e) {
        if(e.which == 13) {
            updateMapRoom($(this).closest('.map-room-map-container'));
        }
   });
}

function updateMapRoom(mapRoomContainer) {
    $.ajax({
        url: '/map-room/update-map-room/',
        type: 'POST',
        data: {
            'csrfmiddlewaretoken': $('#csrf-token').find('input').attr('value'),
            'mapRoomInfo': generateMapRoomInfo(mapRoomContainer),
        },
        success: function(data) {
            mapRoomContainer.find('.map-room-name-input').val('');  // empty input
            mapRoomContainer.attr('data-map-room-label', data['map_room']['label']);
            mapRoomContainer.find('.map-room-name-label').text(data['map_room']['name']);  // replace with new name
            mapRoomContainer.find('.map-room-name').removeClass('is-dirty');
        },
        error: function(e) {
            console.error(e);
        }
    });
}

function generateMapRoomInfo(mapRoomContainer) {
    var name = mapRoomContainer.find('.map-room-name-input').val() || mapRoomContainer.find('.map-room-name-label').text();
    var label = mapRoomContainer.attr('data-map-room-label');
    var isPublic = mapRoomContainer.find('.mdl-switch').hasClass('is-checked');
    return {
        name: name,
        label: label,
        isPublic: isPublic
    };
}

/* Disabled Until Functional */
// document.getElementById("profile-upload-file-upload-button").onchange = function () {
//     document.getElementById("profile-upload-file-upload").value = this.files[0].name;
// };
