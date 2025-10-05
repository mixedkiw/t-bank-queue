from django.contrib import admin
from .models import GameStation, Participant, QueueEntry

@admin.register(GameStation)
class GameStationAdmin(admin.ModelAdmin):
    list_display = ['name', 'qr_code', 'game_duration', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'qr_code']

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ['name', 'device_id', 'created_at']
    search_fields = ['name', 'device_id']

@admin.register(QueueEntry)
class QueueEntryAdmin(admin.ModelAdmin):
    list_display = ['participant', 'station', 'status', 'joined_at']
    list_filter = ['status', 'station']
    search_fields = ['participant__name', 'station__name']