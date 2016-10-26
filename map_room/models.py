from django.core.urlresolvers import reverse
from django.db import models


class MapRoom(models.Model):
    name = models.TextField()
    label = models.SlugField(unique=True)
    
    @staticmethod
    def get_formatted_rooms():
        map_rooms = MapRoom.objects.all()
        
        map_rooms_json_list = []
        for map_room in map_rooms:
            formatted_map_room = {
                'name': map_room.name,
                'label': map_room.label,
                'path': map_room.get_absolute_url(),
            }
            map_rooms_json_list.append(formatted_map_room)
        
        return map_rooms_json_list
    
    def get_absolute_url(self):
        return reverse('map_room', kwargs={'map_room': self.label})
