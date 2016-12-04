from django.utils.safestring import mark_safe
from django.http import HttpResponse
from django.shortcuts import render
import json
from map_together.util import generate_nav_info, generate_nav_info_for_user

def index(request):
    user = request.user
    
    return render(request, 'home/home.html', {
        'nav_data': generate_nav_info(user),
        'user_info': mark_safe(json.dumps(generate_nav_info_for_user(user))),
    })
