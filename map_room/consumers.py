from channels import Group
from channels.auth import http_session_user, channel_session_user, channel_session_user_from_http
from channels.generic.websockets import WebsocketConsumer
from channels.sessions import channel_session
from django.utils.safestring import mark_safe
import json
from .models import ChatMessage, MapRoom, SHARED, USER_OWNED, GeoJsonFile


class MapSync(WebsocketConsumer):
    http_user = True

    def connect(self, message, **kwargs):
        # Accept connection
        message.reply_channel.send({"accept": True})
        map_room = kwargs['map_room']
        map_room = MapRoom.objects.get(label=map_room)
        message.channel_session['map_room'] = map_room.label
        Group('map_room-sync-' + map_room.label).add(message.reply_channel)

    def receive(self, text, **kwargs):
        data = json.loads(text)
        label = kwargs['map_room']
        map_room = MapRoom.objects.get(label=label)
        # Authenticate: Only map room owners to
        if self.message.user != map_room.owner:
            return

        if data['type'] == 'mapSync':
            map_room.center_lng = data['mapCenter']['lng']
            map_room.center_lat = data['mapCenter']['lat']
            map_room.zoom_level = data['zoomLevel']
            map_room.save()
            map_room_info = map_room.format_map_room()
            text = dict(type='mapSync', message=data)
            Group('map_room-sync-'+label).send({'text': json.dumps(text)})
        elif data['type'] == 'geoJsonSync':
            geo_json_file, created = GeoJsonFile.objects.get_or_create(owner=self.message.user, map_room=map_room)
            geo_json_file.geoJson = data['geoJson']
            geo_json_file.file_type = USER_OWNED
            geo_json_file.save()
            geo_json_file_formatted = geo_json_file.format_geojson_files()
            text = dict(type='geoJsonSync', message=geo_json_file_formatted)
            Group('map_room-sync-'+label).send({'text': json.dumps(text)})
        else:
            raise Exception('Unrecognized type')


    def disconnect(self, message, **kwargs):
        label = message.channel_session['map_room']
        Group('map_room-sync-'+label).discard(message.reply_channel)


class Chat(WebsocketConsumer):
    http_user = True

    def connect(self, message, **kwargs):
        # Accept connection
        message.reply_channel.send({"accept": True})
        map_room = kwargs['map_room']
        map_room = MapRoom.objects.get(label=map_room)
        message.channel_session['map_room'] = map_room.label
        Group('map_room-chat-' + map_room.label).add(message.reply_channel)

    def receive(self, text, **kwargs):
        label = self.message.channel_session['map_room']
        map_room = MapRoom.objects.get(label=label)
        message = json.loads(text)
        chat_message = ChatMessage(owner=self.message.user, map_room=map_room, message=message['messageText'])
        chat_message.save()
        Group('map_room-chat-'+label).send({'text': json.dumps(chat_message.format_message_info())})


    def disconnect(self, message, **kwargs):
        label = message.channel_session['map_room']
        Group('map_room-chat-'+label).discard(message.reply_channel)
