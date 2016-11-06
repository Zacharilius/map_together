from django.core.urlresolvers import reverse
from django.db import models


DEFAULT_LATITUDE =  47.6062
DEFAULT_LONGITUDE = -122.3321
DEFAULT_ZOOM = 13

class MapRoom(models.Model):
    name = models.TextField()
    label = models.SlugField(unique=True)
    center_lng = models.FloatField(
            default=DEFAULT_LATITUDE,
            blank=False,
            null=False,
        )
    center_lat = models.FloatField(
            default=DEFAULT_LONGITUDE,
            blank=False,
            null=False,
        )
    zoom_level = models.IntegerField(
            default=DEFAULT_ZOOM,
            blank=False,
            null=False,
        )
    
    def format_map_room(self):
        return {
                'name': self.name,
                'label': self.label,
                'path': self.get_absolute_url(),
                'mapCenter': {'lat': self.center_lat, 'lng': self.center_lng},
                'zoom': self.zoom_level,
            }
    
    @staticmethod
    def get_formatted_rooms():
        map_rooms = MapRoom.objects.all()
        
        map_rooms_list = []
        for map_room in map_rooms:
            map_rooms_list.append(self.format_map_room())
        
        return map_rooms_list
    
    def get_absolute_url(self):
        return reverse('map_room', kwargs={'map_room': self.label})

    def __str__(self):
        return self.label
