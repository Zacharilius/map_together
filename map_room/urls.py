from django.conf.urls import include, url
from . import views

urlpatterns = [
    url(r'^create-map-room/?$', views.create_map_room, name='create_map_room'),
    url(r'^update-map-room/?$', views.update_map_room, name='update_map_room'),
    url(r'^public-map-rooms/?$', views.public_map_rooms, name='public_map_rooms'),
    url(r'^geojson/(?P<geojson_file_id>[\d])/?$', views.view_geo_json, name='view_geo_json'),
    url(r'^join/?$', views.join_map_room, name='join_map_room'),
    url(r'^(?P<owner_id>[\d])/(?P<label>[\w-]{1,50})/?$', views.map_room, name='map_room'),
]
