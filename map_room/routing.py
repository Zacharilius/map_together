from channels.routing import route
from .consumers import *

channel_routing = [
    route("websocket.connect", ws_connect, path=r"^/ws/maproom/(?P<room>[a-zA-Z0-9_]+)/$"),
    route("websocket.ws_receive", ws_receive, path=r"^/ws/maproom/"),
    route("websocket.disconnect", ws_disconnect, path=r"^/ws/maproom/"),
]
