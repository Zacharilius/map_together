from django.conf.urls import include, url
from . import views

urlpatterns = [
    url(r'^join/$', views.join_map_room, name='join_map_room'),
    url(r'^create-map-room/$', views.create_map_room, name='create_map_room'),
    url(r'^room/(?P<map_room>[\w-]{,50})/$', views.map_room, name='map_room'),
]
