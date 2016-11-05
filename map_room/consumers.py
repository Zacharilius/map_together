from channels import Group
from channels.sessions import channel_session
import json
from .models import MapRoom


@channel_session
def ws_connect(message, map_room):
    print('====== ws_connect =====')
    
    split_message_url = message['path'].strip('/').split('/')
    label = split_message_url[-1]
    room = MapRoom.objects.get(label=label)
    Group('map_room-' + label).add(message.reply_channel)
    message.channel_session['map_room'] = room.label


@channel_session
def ws_receive(message, map_room):
    print('====== ws_receive')
    
    label = message.channel_session['map_room']
    room = MapRoom.objects.get(label=label)
    data = json.loads(message['text'])
    
    room.center_lng = data['mapCenter']['lng']
    room.center_lat = data['mapCenter']['lat']
    room.zoom_level = data['zoomLevel']
    room.save()
    
    Group('map_room-'+label).send({'text': message['text']})


@channel_session
def ws_disconnect(message):
    print('====== ws_disconnect')
    
    label = message.channel_session['map_room']
    Group('map_room-'+label).discard(message.reply_channel)
