from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import *
from .services import QueueService, StatusService
from .serializers import *


class ParticipantViewSet(viewsets.ViewSet):
    def create(self, request):
        device_id = request.data.get('device_id')
        name = request.data.get('name')

        if not device_id or not name:
            return Response(
                {'error': 'device_id и name обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        participant, created = Participant.objects.update_or_create(
            device_id=device_id,
            defaults={'name': name}
        )

        serializer = ParticipantSerializer(participant)
        return Response(serializer.data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class StationViewSet(viewsets.ViewSet):
    def list(self, request):
        """Список всех активных стендов"""
        stations = GameStation.objects.filter(is_active=True)
        serializer = StationSerializer(stations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_by_qr(self, request):
        """Получить стенд по QR-коду"""
        qr_code = request.GET.get('qr_code')
        station = get_object_or_404(GameStation, qr_code=qr_code, is_active=True)
        serializer = StationSerializer(station)
        return Response(serializer.data)


class QueueViewSet(viewsets.ViewSet):
    def create(self, request):
        """Встать в очередь к стенду"""
        device_id = request.data.get('device_id')
        station_id = request.data.get('station_id')

        participant = get_object_or_404(Participant, device_id=device_id)
        station = get_object_or_404(GameStation, id=station_id, is_active=True)

        queue_entry = QueueService.join_queue(station, participant)
        serializer = QueueEntrySerializer(queue_entry)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def leave(self, request):
        """Покинуть очередь"""
        device_id = request.data.get('device_id')
        station_id = request.data.get('station_id')

        participant = get_object_or_404(Participant, device_id=device_id)
        station = get_object_or_404(GameStation, id=station_id)

        result = QueueService.leave_queue(station, participant)

        if result:
            return Response({'message': 'Вы покинули очередь'})
        else:
            return Response({'error': 'Вы не находитесь в очереди'},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def start_playing(self, request):
        """Начать игру (сканирование QR)"""
        device_id = request.data.get('device_id')
        station_id = request.data.get('station_id')

        participant = get_object_or_404(Participant, device_id=device_id)
        station = get_object_or_404(GameStation, id=station_id, is_active=True)

        queue_entry = QueueService.start_playing(station, participant)

        if queue_entry:
            serializer = QueueEntrySerializer(queue_entry)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Невозможно начать игру. Убедитесь, что вы первый в очереди и стенд свободен.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def complete_playing(self, request):
        """Завершить игру"""
        device_id = request.data.get('device_id')
        station_id = request.data.get('station_id')

        participant = get_object_or_404(Participant, device_id=device_id)
        station = get_object_or_404(GameStation, id=station_id)

        result = QueueService.complete_playing(station, participant)

        if result:
            return Response({'message': 'Игра завершена'})
        else:
            return Response({'error': 'Вы не играете на этом стенде'},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_status(self, request):
        """Получить мой статус в очередях"""
        device_id = request.GET.get('device_id')
        participant = get_object_or_404(Participant, device_id=device_id)

        status_info = StatusService.get_participant_status(participant)
        serializer = ParticipantStatusSerializer(status_info, many=True)

        return Response(serializer.data)


class OrganizerViewSet(viewsets.ViewSet):
    """API для организаторов (опционально)"""

    @action(detail=False, methods=['get'])
    def station_status(self, request):
        """Получить статус стенда по QR"""
        qr_code = request.GET.get('qr_code')
        station = get_object_or_404(GameStation, qr_code=qr_code)

        status_info = StatusService.get_station_status(station)
        serializer = StationStatusSerializer(status_info)

        return Response(serializer.data)