# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-11-27 04:46
from __future__ import unicode_literals

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('map_room', '0005_auto_20161113_1408'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeoJsonFile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField()),
                ('description', models.TextField()),
                ('file', models.FileField(upload_to='geo-json/')),
                ('timestamp', models.DateTimeField(blank=True, default=datetime.datetime.now)),
                ('file_type', models.CharField(choices=[('SH', 'Shared'), ('UO', 'User Owned')], default='SH', max_length=2)),
                ('owner', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
