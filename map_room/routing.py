from channels.routing import route
from channels.staticfiles import StaticFilesConsumer
from .consumers import *


MAP_ROOM_ROUTE = r'^/ws/map-room/room/(?:(?P<map_room>[a-zA-Z0-9_-]+))/$'
channel_routing = [
    # This makes Django serve static files from settings.STATIC_URL, similar
    route('http.request', StaticFilesConsumer()),

    route("websocket.connect", ws_connect, path=MAP_ROOM_ROUTE),
    route("websocket.receive", ws_receive, path=MAP_ROOM_ROUTE),
    route("websocket.disconnect", ws_disconnect, path=r'^/ws/map-room/room/'),
]
