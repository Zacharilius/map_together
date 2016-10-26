from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.utils.safestring import mark_safe
import json
from .models import MapRoom


def join_map_room(request):
    all_map_rooms = MapRoom.get_formatted_rooms()
    
    map_room_reversed = reverse('map_room', kwargs={'map_room': None})
    
    result = render(request, 'map_room/join_map_room.html', {
            'all_map_rooms': mark_safe(json.dumps(all_map_rooms))
        })
    
    return result


@require_POST
def create_map_room(request):
    map_room_name = request.POST.get('mapRoomName')

    map_room, created = MapRoom.objects.get_or_create(label=map_room_name)

    response_data = {
        'created': created,
        'map_room_url': map_room.get_absolute_url()
    }

    return HttpResponse(
        json.dumps(response_data),
        content_type="application/json"
    )


def map_room(request, map_room=None):
    if map_room is None:
        raise("Why is this none")
    room, created = MapRoom.objects.get_or_create(label=map_room)
    
    # TODO: Retrieve current map state
    return render(request, 'map_room/map_room.html')
