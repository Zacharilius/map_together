from channels import Group
from channels.sessions import channel_session
import json
from .models import MapRoom, ChatMessage


@channel_session
def ws_map_sync_connect(message, map_room):
    print('==== ws_map_sync_connect ====')

    map_room = MapRoom.objects.get(label=map_room)
    Group('map_room-sync-' + map_room.label).add(message.reply_channel)
    message.channel_session['map_room'] = map_room.label


@channel_session
def ws_map_sync_receive(message, map_room):
    print('==== ws_map_sync_receive ====')
    
    label = message.channel_session['map_room']
    map_room = MapRoom.objects.get(label=label)
    data = json.loads(message['text'])
    
    map_room.center_lng = data['mapCenter']['lng']
    map_room.center_lat = data['mapCenter']['lat']
    map_room.zoom_level = data['zoomLevel']
    map_room.save()
    
    Group('map_room-sync-'+label).send({'text': message['text']})


@channel_session
def ws_map_sync_disconnect(message, map_room):
    print('==== ws_map_sync_disconnect ====')
    
    label = message.channel_session['map_room']
    Group('map_room-sync-'+label).discard(message.reply_channel)


@channel_session
def ws_chat_connect(message, map_room):
    print('==== ws_chat_connect ====')

    map_room = MapRoom.objects.get(label=map_room)
    Group('map_room-chat-' + map_room.label).add(message.reply_channel)
    message.channel_session['map_room'] = map_room.label


@channel_session
def ws_chat_receive(message, map_room):
    print('==== ws_chat_receive ====')
    
    label = message.channel_session['map_room']
    map_room = MapRoom.objects.get(label=label)
    
    data = json.loads(message['text'])
    message_text = data['messageText']
    chat_message = ChatMessage(map_room=map_room, message=message_text)
    chat_message.save()
    
    Group('map_room-chat-'+label).send({'text': message['text']})


@channel_session
def ws_chat_disconnect(message, map_room):
    print('==== ws_chat_disconnect ====')
    
    label = message.channel_session['map_room']
    Group('map_room-chat-'+label).discard(message.reply_channel)

