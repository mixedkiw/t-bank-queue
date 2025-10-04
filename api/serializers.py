from rest_framework import serializers
from .models import *


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ['device_id', 'name', 'created_at']


class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameStation
        fields = ['id', 'name', 'description', 'game_duration', 'qr_code']


class QueueEntrySerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    participant_name = serializers.CharField(source='participant.name', read_only=True)

    class Meta:
        model = QueueEntry
        fields = ['id', 'station_name', 'participant_name', 'status', 'position',
                  'estimated_wait_time', 'joined_at', 'started_at']


class ParticipantStatusSerializer(serializers.Serializer):
    station = StationSerializer()
    position = serializers.IntegerField()
    status = serializers.CharField()
    estimated_wait_minutes = serializers.IntegerField()
    people_ahead = serializers.IntegerField()
    is_playing = serializers.BooleanField()
    is_next = serializers.BooleanField()


class StationStatusSerializer(serializers.Serializer):
    station = StationSerializer()
    current_player = ParticipantSerializer(allow_null=True)
    waiting_count = serializers.IntegerField()
    waiting_queue = QueueEntrySerializer(many=True)
    is_available = serializers.BooleanField()