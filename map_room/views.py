from django.http import HttpResponse
from django.shortcuts import render

def map_room(request, map_room_name=None):
    return render(request, 'map_room/map_room.html')
