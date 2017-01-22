from channels.routing import route, route_class
from channels.staticfiles import StaticFilesConsumer
from . import consumers


MAP_ROOM_ROUTE = r'^/ws/map-room/room/(?:(?P<map_room>[a-zA-Z0-9_-]+))/map-sync$'
MAP_ROOM_CHAT = r'^/ws/map-room/room/(?:(?P<map_room>[a-zA-Z0-9_-]+))/chat$'
channel_routing = [
    # This makes Django serve static files from settings.STATIC_URL, similar
    route('http.request', StaticFilesConsumer()),

    # Map Sync
    route_class(consumers.MapSync, path=r'^/ws/map-room/room/(?:(?P<map_room>[a-zA-Z0-9_-]+))/map-sync$'),

    # Chat
    route_class(consumers.Chat, path=r'^/ws/map-room/room/(?:(?P<map_room>[a-zA-Z0-9_-]+))/chat$'),
]
