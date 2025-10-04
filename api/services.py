from django.utils import timezone
from django.db import transaction
from .models import *


class QueueService:
    @staticmethod
    def join_queue(station, participant):
        with transaction.atomic():
            # Проверяем, не стоит ли уже в очереди
            existing = QueueEntry.objects.filter(
                station=station,
                participant=participant,
                status='waiting'
            ).first()

            if existing:
                return existing

            # Создаем запись в очереди
            queue_entry = QueueEntry.objects.create(
                station=station,
                participant=participant
            )

            return queue_entry

    @staticmethod
    def start_game(station, participant):
        with transaction.atomic():
            # Получаем актуальную очередь
            waiting_entries = QueueEntry.objects.filter(
                station=station,
                status='waiting'
            ).order_by('joined_at')

            if not waiting_entries:
                return None, None

            current_player = waiting_entries.first()

            # Проверяем, что участник первый в очереди
            if current_player.participant != participant:
                return None, None

            # Завершаем игру текущего участника
            current_player.status = 'completed'
            current_player.completed_at = timezone.now()
            current_player.save()

            # Получаем следующего игрока (если есть)
            next_player = waiting_entries[1] if len(waiting_entries) > 1 else None

            return current_player, next_player

    @staticmethod
    def leave_queue(station, participant):
        with transaction.atomic():
            queue_entry = QueueEntry.objects.filter(
                station=station,
                participant=participant,
                status='waiting'
            ).first()

            if queue_entry:
                queue_entry.status = 'cancelled'
                queue_entry.save()
                return queue_entry
            return None

    @staticmethod
    def skip_current_player(station):
        with transaction.atomic():
            waiting_entries = QueueEntry.objects.filter(
                station=station,
                status='waiting'
            ).order_by('joined_at')

            if not waiting_entries:
                return None, None

            current_player = waiting_entries.first()
            current_player.status = 'cancelled'
            current_player.save()

            next_player = waiting_entries[1] if len(waiting_entries) > 1 else None
            return current_player, next_player

    @staticmethod
    def get_queue_for_station(station_id):
        """Получить всех людей в очереди для указанного стенда"""
        queue_entries = QueueEntry.objects.filter(
            station_id=station_id,
            status='waiting'
        ).select_related('participant').order_by('joined_at')

        queue_data = []
        for index, entry in enumerate(queue_entries, 1):
            queue_data.append({
                'position': index,
                'participant_id': entry.participant.id,
                'participant_name': entry.participant.name,
                'device_id': entry.participant.device_id,
                'joined_at': entry.joined_at,
                'estimated_wait_minutes': QueueService._calculate_wait_time(entry, index)
            })

        return queue_data

    @staticmethod
    def _calculate_wait_time(queue_entry, position):
        """Рассчитать время ожидания для позиции в очереди"""
        if position == 1:
            return 0  # Первый в очереди

        station = queue_entry.station
        # Расчет времени ожидания: (позиция - 1) * длительность игры
        return (position - 1) * station.game_duration // 60


class StatusService:
    @staticmethod
    def get_participant_status(participant):
        """Получить статус участника во всех очередях"""
        queue_entries = QueueEntry.objects.filter(
            participant=participant,
            status='waiting'
        ).select_related('station')

        result = []
        for entry in queue_entries:
            status_info = StatusService._calculate_queue_status(entry)
            result.append(status_info)

        return result

    @staticmethod
    def get_station_status(station):
        """Получить статус стенда"""
        waiting_entries = QueueEntry.objects.filter(
            station=station,
            status='waiting'
        ).order_by('joined_at')

        current_player = waiting_entries.first() if waiting_entries else None
        waiting_count = waiting_entries.count()

        return {
            'station': station,
            'current_player': current_player.participant if current_player else None,
            'next_player': waiting_entries[1].participant if len(waiting_entries) > 1 else None,
            'waiting_count': waiting_count,
            'is_occupied': current_player is not None,
        }

    @staticmethod
    def _calculate_queue_status(queue_entry):
        """Рассчитать статус для конкретной записи в очереди"""
        station = queue_entry.station
        waiting_entries = QueueEntry.objects.filter(
            station=station,
            status='waiting'
        ).order_by('joined_at')

        # Находим позицию участника
        position = None
        for index, entry in enumerate(waiting_entries, 1):
            if entry.id == queue_entry.id:
                position = index
                break

        if position is None:
            return None

        current_player = waiting_entries.first()
        is_current_player = current_player and current_player.id == queue_entry.id
        is_ready_to_play = position == 1
        current_player_exists = current_player is not None

        # Расчет времени ожидания
        if position == 1:
            estimated_wait_minutes = 0
        elif position == 2 and not current_player_exists:
            estimated_wait_minutes = 0
        else:
            games_ahead = position - 1 if current_player_exists else position - 2
            estimated_wait_minutes = max(0, games_ahead * station.game_duration // 60)

        return {
            'queue_entry': queue_entry,
            'station': station,
            'position': position,
            'status': queue_entry.status,
            'estimated_wait_minutes': estimated_wait_minutes,
            'people_ahead': position - 1,
            'is_playing': is_current_player,
            'is_ready_to_play': is_ready_to_play,
            'current_player_exists': current_player_exists
        }
