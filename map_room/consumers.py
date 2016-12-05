from channels import Group
from channels.auth import http_session_user, channel_session_user, channel_session_user_from_http
from channels.generic.websockets import WebsocketConsumer
from channels.sessions import channel_session
from django.utils.safestring import mark_safe
import json
from .models import MapRoom, ChatMessage


class MapSync(WebsocketConsumer):
    http_user = True
    channel_session_user = True

    def connect(self, message, **kwargs):
        print('==== ws_map_sync_connect ====')

        map_room = kwargs['map_room']
        map_room = MapRoom.objects.get(label=map_room)
        Group('map_room-sync-' + map_room.label).add(message.reply_channel)
        message.channel_session['map_room'] = map_room.label


    def receive(self, text, **kwargs):
        print('==== ws_map_sync_receive ====')
        
        map_room = kwargs['map_room']
        label = self.message.channel_session['map_room']
        map_room = MapRoom.objects.get(label=label)
        data = json.loads(text)
        
        map_room.center_lng = data['mapCenter']['lng']
        map_room.center_lat = data['mapCenter']['lat']
        map_room.zoom_level = data['zoomLevel']
        map_room.save()
        
        Group('map_room-sync-'+label).send({'text': text})


    def disconnect(self, message, **kwargs):
        print('==== ws_map_sync_disconnect ====')
        
        label = message.channel_session['map_room']
        Group('map_room-sync-'+label).discard(message.reply_channel)


class Chat(WebsocketConsumer):
    http_user = True
    channel_session_user = True

    def connect(self, message, **kwargs):
        print('==== ws_chat_connect ====')

        map_room = kwargs['map_room']
        map_room = MapRoom.objects.get(label=map_room)
        Group('map_room-chat-' + map_room.label).add(message.reply_channel)
        message.channel_session['map_room'] = map_room.label


    def receive(self, text, **kwargs):
        print('==== ws_chat_receive ====')

        label = self.message.channel_session['map_room']
        map_room = MapRoom.objects.get(label=label)
        message = json.loads(text)
        chat_message = ChatMessage(owner=self.message.user, map_room=map_room, message=message['messageText'])
        chat_message.save()
        
        Group('map_room-chat-'+label).send({'text': json.dumps(chat_message.format_message_info())})


    def disconnect(self, message, **kwargs):
        print('==== ws_chat_disconnect ====')
        
        label = message.channel_session['map_room']
        Group('map_room-chat-'+label).discard(message.reply_channel)

