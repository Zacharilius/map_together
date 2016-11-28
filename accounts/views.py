from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from django.utils.safestring import mark_safe
import json
from map_room.models import GeoJsonFile, MapRoom, USER_OWNED
from map_together.util import generate_nav_info, generate_nav_info_for_user


def login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            django_login(request, user)
            return redirect(reverse('profile'))
        else:
            return redirect(reverse('login') + '?failed-login')
    # GET
    else:
        user = request.user
        return render(request, 'accounts/login.html', {
                'nav_data': generate_nav_info(user),
                'nav_user_data': mark_safe(json.dumps(generate_nav_info_for_user(user))),
            })


def logout(request):
    user = request.user
    django_logout(request)
    return redirect(reverse('login') + '?successful-logout', {
                'nav_data': generate_nav_info(user),
                'nav_user_data': mark_safe(json.dumps(generate_nav_info_for_user(user))),
            })


ONE_MEGABYTE = 1000000

@login_required
def profile(request):
    user = request.user

    if request.method == 'GET':
        
        return render(request, 'accounts/profile.html', {
                    'nav_data': generate_nav_info(user),
                    'nav_user_data': mark_safe(json.dumps(generate_nav_info_for_user(user))),
                    'user_map_rooms': MapRoom.get_user_formatted_rooms(user),
                })
    elif request.method == 'POST':
        post = request.POST
        owner = user
        title = post['title']
        description = post['description']
        geojsonFile = request.FILES['geojsonFile']
        file_type = USER_OWNED

        if geojsonFile.content_type not in ['application/json', 'text/javascript']:
            return HttpResponseBadRequest('Bad Request: Improper file type. Accepted file extnesion are ".json" and ".js"')
        
        if geojsonFile.size > ONE_MEGABYTE:
            return HttpResponse('Payload too large', status=413)

        geo_json_file = GeoJsonFile(
                            owner=owner,
                            title=title,
                            description=description,
                            file=geojsonFile,
                            file_type=file_type,
                        )

        geo_json_file.save()

        return redirect(reverse('profile'))

@require_POST
def signup(request):
    post = request.POST
    username = post['username']
    email = post['email']
    password = post['password']
    f_name = post['firstName']
    l_name = post['lastName']
    
    user = User.objects.create_user(username=username,
                                    email=email,
                                    password=password,
                                    first_name=f_name,
                                    last_name=l_name)
    # Must authenticate before using django_login
    user = authenticate(username=username, password=password)
    if user is not None:
        django_login(request, user)
        return redirect(reverse('profile'))
    else:
        return redirect(reverse('login') + '?failed-signup')
