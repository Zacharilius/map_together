from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from django.utils.safestring import mark_safe
import json
from map_room.models import MapRoom
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


@login_required
def profile(request):
    user = request.user
    return render(request, 'accounts/profile.html', {
                'nav_data': generate_nav_info(user),
                'nav_user_data': mark_safe(json.dumps(generate_nav_info_for_user(user))),
                'user_map_rooms': MapRoom.get_user_formatted_rooms(user),
            })


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
