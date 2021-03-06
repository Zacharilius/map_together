# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-12-06 04:49
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('map_room', '0008_auto_20161203_1530'),
    ]

    operations = [
        migrations.RenameField(
            model_name='geojsonfile',
            old_name='geojson_file',
            new_name='geoJson',
        ),
        migrations.RemoveField(
            model_name='geojsonfile',
            name='description',
        ),
        migrations.RemoveField(
            model_name='geojsonfile',
            name='title',
        ),
        migrations.AddField(
            model_name='geojsonfile',
            name='map_room',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to='map_room.MapRoom'),
            preserve_default=False,
        ),
    ]
