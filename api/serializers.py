from rest_framework import serializers
from .models import *


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ['device_id', 'name', 'created_at']


class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameStation
        fields = ['id', 'name', 'description', 'qr_code', 'game_duration']


class QueueEntrySerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    participant_name = serializers.CharField(source='participant.name', read_only=True)

    class Meta:
        model = QueueEntry
        fields = ['id', 'station_name', 'participant_name', 'status', 'joined_at', 'started_at']


class ParticipantStatusSerializer(serializers.Serializer):
    station = StationSerializer()
    position = serializers.IntegerField()
    status = serializers.CharField()
    estimated_wait_minutes = serializers.IntegerField()
    people_ahead = serializers.IntegerField()
    is_playing = serializers.BooleanField()
    is_ready_to_play = serializers.BooleanField()
    current_player_exists = serializers.BooleanField()


class StationStatusSerializer(serializers.Serializer):
    station = StationSerializer()
    current_player = ParticipantSerializer(allow_null=True)
    next_player = ParticipantSerializer(allow_null=True)
    waiting_count = serializers.IntegerField()
    is_occupied = serializers.BooleanField()


class StartGameResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    previous_player = ParticipantSerializer(allow_null=True)
    next_player = ParticipantSerializer(allow_null=True)


class SkipPlayerResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    skipped_player = ParticipantSerializer(allow_null=True)
    next_player = ParticipantSerializer(allow_null=True)


class QueueParticipantSerializer(serializers.Serializer):
    position = serializers.IntegerField()
    participant_id = serializers.IntegerField()
    participant_name = serializers.CharField()
    device_id = serializers.CharField()
    joined_at = serializers.DateTimeField()
    estimated_wait_minutes = serializers.IntegerField()


class StationQueueSerializer(serializers.Serializer):
    station_id = serializers.IntegerField()
    station_name = serializers.CharField()
    total_in_queue = serializers.IntegerField()
    current_player = serializers.CharField(allow_null=True)
    queue = QueueParticipantSerializer(many=True)