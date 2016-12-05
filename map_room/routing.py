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
    # route("websocket.connect", ws_map_sync_connect, path=MAP_ROOM_ROUTE),
    # route("websocket.receive", ws_map_sync_receive, path=MAP_ROOM_ROUTE),
    # route("websocket.disconnect", ws_map_sync_disconnect, path=MAP_ROOM_ROUTE),
    
    # Chat
    route_class(consumers.Chat, path=r'^/ws/map-room/room/(?:(?P<map_room>[a-zA-Z0-9_-]+))/chat$'),
    # route("websocket.connect", ws_chat_connect, path=MAP_ROOM_CHAT),
    # route("websocket.receive", ws_chat_receive, path=MAP_ROOM_CHAT),
    # route("websocket.disconnect", ws_chat_disconnect, path=MAP_ROOM_CHAT),
]
