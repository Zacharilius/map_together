from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.utils.safestring import mark_safe
import json
from .models import ChatMessage, MapRoom, GeoJsonFile
from map_together.util import generate_nav_info, generate_nav_info_for_user


@login_required
def join_map_room(request):
    user = request.user

    all_map_rooms = MapRoom.get_formatted_rooms()
    map_room_reversed = reverse('map_room', kwargs={'map_room': None})

    result = render(request, 'map_room/join_map_room.html', {
            'nav_data': generate_nav_info(user),
            'user_info': mark_safe(json.dumps(generate_nav_info_for_user(user))),
            'all_map_rooms': mark_safe(json.dumps(all_map_rooms))
        })

    return result


@require_POST
@login_required
def create_map_room(request):
    user = request.user
    map_room_name = request.POST.get('mapRoomName')
    map_room, created = MapRoom.objects.get_or_create(
        owner=user,
        name=map_room_name,
    )

    response_data = {
        'created': created,
        'map_room_url': map_room.get_absolute_url(),
    }

    return HttpResponse(
        mark_safe(json.dumps(response_data)),
        content_type="application/json"
    )


@require_POST
@login_required
def update_map_room(request):
    user = request.user

    # import pdb; pdb.set_trace()
    name = request.POST.get('mapRoomInfo[name]')
    label = request.POST.get('mapRoomInfo[label]')
    is_public = json.loads(request.POST.get('mapRoomInfo[isPublic]'))

    map_room = MapRoom.objects.get(label=label, owner=user)

    map_room.name = name
    map_room.is_public = is_public
    map_room.save()

    response_data = {
        'map_room': map_room.format_map_room()
    }

    return HttpResponse(
        mark_safe(json.dumps(response_data)),
        content_type="application/json"
    )


def map_room(request, map_room=None):
    user = request.user
    if map_room is None:
        # TODO: auto create map room.
        raise("Why is this none")

    map_room, created = MapRoom.objects.get_or_create(label=map_room)
    chat_message_infos = ChatMessage.get_recent_messages_info(map_room)
    geojson_files = GeoJsonFile.get_map_room_geo_json_files(map_room)

    return render(request, 'map_room/map_room.html', {
        'nav_data': generate_nav_info(user),
        'user_info': mark_safe(json.dumps(generate_nav_info_for_user(user))),
        'chat_message_infos': mark_safe(json.dumps(chat_message_infos)),
        'geojson_files': mark_safe(json.dumps(geojson_files)),
        'map_room_info': mark_safe(json.dumps(map_room.format_map_room())),
    })

@login_required
def view_geo_json(request, geojson_file_id):
    user = request.user
    geojson_file = GeoJsonFile.objects.get(id=geojson_file_id)

    return render(request, 'map_room/geojson.html', {
        'nav_data': generate_nav_info(user),
        'user_info': mark_safe(json.dumps(generate_nav_info_for_user(user))),
        'geojson_file_info': geojson_file.format_geojson_files(),
    })
