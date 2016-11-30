# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-11-30 02:37
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('map_room', '0006_geojsonfile'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='geojsonfile',
            name='file',
        ),
        migrations.AddField(
            model_name='geojsonfile',
            name='geojson_file',
            field=models.TextField(blank=True, default=None, null=True),
        ),
    ]
