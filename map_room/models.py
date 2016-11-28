import datetime
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.db import models


DEFAULT_LATITUDE = -122.3321
DEFAULT_LONGITUDE = 47.6062
DEFAULT_ZOOM = 13

class MapRoom(models.Model):
    owner = models.ForeignKey(
        User,
        default=None,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )
    
    name = models.TextField()
    
    label = models.SlugField(
        unique=True
    )
    
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
            map_rooms_list.append(map_room.format_map_room())
        
        return map_rooms_list
    
    @staticmethod
    def get_user_formatted_rooms(user):
        user_map_rooms = MapRoom.objects.filter(owner=user)
        return [m.format_map_room() for m in user_map_rooms]
    
    def get_absolute_url(self):
        return reverse('map_room', kwargs={'map_room': self.label})

    def __str__(self):
        return self.label

class ChatMessage(models.Model):
    owner = models.ForeignKey(
        User,
        default=None,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )
    
    message = models.TextField()
    
    map_room = models.ForeignKey(
        MapRoom,
        on_delete=models.CASCADE,
    )
    
    timestamp = models.DateTimeField(
        default=datetime.datetime.now,
        blank=True
    )
    
    @staticmethod
    def get_recent_messages(map_room):
        chat_messages = ChatMessage.objects.filter(map_room=map_room).order_by('timestamp')
        return [chat_message.message for chat_message in chat_messages]
    
    def __str__(self):
        return self.message


SHARED = 'SH'
USER_OWNED = 'UO'

GEO_JSON_FILE_TYPE = (
    (SHARED, 'Shared'),
    (USER_OWNED, 'User Owned'),
)

class GeoJsonFile(models.Model):
    owner = models.ForeignKey(
        User,
        default=None,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    title = models.TextField()

    description = models.TextField()

    file = models.FileField(
        upload_to='geo-json/'
    )

    timestamp = models.DateTimeField(
        default=datetime.datetime.now,
        blank=True
    )

    file_type = models.CharField(
        max_length=2,
        choices=GEO_JSON_FILE_TYPE,
        default=SHARED,
    )

    def format_geojson_files(self):
        return dict(
                owner=self.owner.username,
                title=self.title,
                description=self.description,
                path=self.file.path,
                timestamp=self.timestamp,
                fileType=self.file_type,
            )

    @staticmethod
    def get_shared_geojson_files():
        all_files = GeoJsonFile.objects.filter(file_type=SHARED).select_related('owner')
        all_files_formatted = [file.format_geojson_files() for file in all_files]
        return all_files_formatted
    
    def __str__(self):
        if self.owner is not None:
            return '%s\'s %s' % (self.owner.username, self.title)
        else:
            return self.title
