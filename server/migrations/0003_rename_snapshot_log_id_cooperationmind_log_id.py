# Generated by Django 3.2.11 on 2022-02-24 21:39

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0002_auto_20220216_2059'),
    ]

    operations = [
        migrations.RenameField(
            model_name='cooperationmind',
            old_name='snapshot_log_id',
            new_name='log_id',
        ),
    ]
