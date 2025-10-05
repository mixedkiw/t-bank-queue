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

    @action(detail=True, methods=['get'])
    def queue(self, request, pk=None):
        """Получить очередь для конкретного стенда"""
        station = get_object_or_404(GameStation, id=pk)

        # Получаем очередь для стенда
        queue_data = QueueService.get_queue_for_station(pk)

        # Получаем текущего играющего
        current_player = queue_data[0]['participant_name'] if queue_data else None

        response_data = {
            'station_id': station.id,
            'station_name': station.name,
            'total_in_queue': len(queue_data),
            'current_player': current_player,
            'queue': queue_data
        }

        serializer = StationQueueSerializer(response_data)
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
    def start_game(self, request):
        """Начать игру (сканирование QR)"""
        device_id = request.data.get('device_id')
        station_id = request.data.get('station_id')

        participant = get_object_or_404(Participant, device_id=device_id)
        station = get_object_or_404(GameStation, id=station_id, is_active=True)

        previous_player, next_player = QueueService.start_game(station, participant)

        if previous_player:
            response_data = {
                'message': 'Игра начата',
                'previous_player': previous_player.participant,
                'next_player': next_player.participant if next_player else None
            }
            serializer = StartGameResponseSerializer(response_data)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Вы не первый в очереди'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def my_status(self, request):
        """Получить мой статус в очередях"""
        device_id = request.GET.get('device_id')
        participant = get_object_or_404(Participant, device_id=device_id)

        status_info = StatusService.get_participant_status(participant)
        serializer = ParticipantStatusSerializer(status_info, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def station_status(self, request):
        """Получить статус стенда"""
        station_id = request.GET.get('station_id')
        station = get_object_or_404(GameStation, id=station_id)

        status_info = StatusService.get_station_status(station)
        serializer = StationStatusSerializer(status_info)

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def station_queue(self, request):
        """Получить всех людей в очереди для стенда"""
        station_id = request.GET.get('station_id')

        if not station_id:
            return Response(
                {'error': 'station_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        station = get_object_or_404(GameStation, id=station_id)

        # Получаем очередь для стенда
        queue_data = QueueService.get_queue_for_station(station_id)

        # Получаем текущего играющего (первого в очереди)
        current_player = queue_data[0]['participant_name'] if queue_data else None

        response_data = {
            'station_id': station.id,
            'station_name': station.name,
            'total_in_queue': len(queue_data),
            'current_player': current_player,
            'queue': queue_data
        }

        serializer = StationQueueSerializer(response_data)
        return Response(serializer.data)


class AdminViewSet(viewsets.ViewSet):
    """API для организаторов"""

    @action(detail=False, methods=['post'])
    def skip_player(self, request):
        """Пропустить текущего игрока"""
        station_id = request.data.get('station_id')
        station = get_object_or_404(GameStation, id=station_id)

        skipped_player, next_player = QueueService.skip_current_player(station)

        if skipped_player:
            response_data = {
                'message': 'Текущий игрок пропущен',
                'skipped_player': skipped_player.participant,
                'next_player': next_player.participant if next_player else None
            }
            serializer = SkipPlayerResponseSerializer(response_data)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Нет игроков в очереди'},
                status=status.HTTP_400_BAD_REQUEST
            )