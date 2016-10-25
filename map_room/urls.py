from django.conf.urls import include, url
from . import views

urlpatterns = [
    url(r'^room/(?P<map_room_name>[\w-]{,50})/$', views.map_room, name='map_room'),
]
