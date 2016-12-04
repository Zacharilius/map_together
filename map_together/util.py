from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from django.utils.safestring import mark_safe
import json


def generate_nav_info_for_user(user):
    if user.is_authenticated():
        user_info=dict(
            isAuthenticated=True,
            username=user.username,
            firstName=user.first_name,
            lastName=user.last_name,
        )
    else:
        user_info=dict(
            isAuthenticated=False
        )
    return user_info



def generate_nav_info(user):
    return dict(
            username=user.username,
            is_logged_in=user.is_authenticated(),
            profile_url=reverse('profile'),
            login_url=reverse('login'),
            logout_url=reverse('logout'),
        )