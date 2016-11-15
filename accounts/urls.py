from django.conf.urls import include, url
from django.conf.urls import include, url
from . import views

urlpatterns = [
    url(r'^profile/?$', views.profile, name='profile'),
    url(r'^login/?$', views.login, name='login'),
    url(r'^logout/?$', views.logout, name='logout'),
]
