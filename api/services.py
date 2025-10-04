from django.utils import timezone
from django.db import transaction, models
from .models import *


class QueueService:
    @staticmethod
    def join_queue(station, participant):
        with transaction.atomic():
            # Проверяем, не стоит ли уже в очереди
            existing = QueueEntry.objects.filter(
                station=station,
                participant=participant,
                status__in=['waiting', 'playing']
            ).first()

            if existing:
                return existing

            # Определяем позицию в очереди
            last_position = QueueEntry.objects.filter(
                station=station,
                status='waiting'
            ).aggregate(models.Max('position'))['position__max'] or 0

            new_position = last_position + 1

            # Расчет времени ожидания
            current_players = QueueEntry.objects.filter(
                station=station,
                status='playing'
            ).count()

            if current_players == 0:
                wait_time = (new_position - 1) * station.game_duration
            else:
                wait_time = new_position * station.game_duration

            queue_entry = QueueEntry.objects.create(
                station=station,
                participant=participant,
                position=new_position,
                estimated_wait_time=wait_time
            )

            return queue_entry

    @staticmethod
    def start_playing(station, participant):
        with transaction.atomic():
            # Проверяем, что участник первый в очереди и стенд свободен
            queue_entry = QueueEntry.objects.filter(
                station=station,
                participant=participant,
                status='waiting',
                position=1
            ).first()

            if not queue_entry:
                return None

            # Проверяем, что стенд свободен
            current_players = QueueEntry.objects.filter(
                station=station,
                status='playing'
            ).count()

            if current_players > 0:
                return None

            # Начинаем игру
            queue_entry.status = 'playing'
            queue_entry.started_at = timezone.now()
            queue_entry.estimated_wait_time = 0
            queue_entry.save()

            # Пересчитываем очередь для остальных
            QueueService._recalculate_waiting_times(station)

            return queue_entry

    @staticmethod
    def complete_playing(station, participant):
        with transaction.atomic():
            queue_entry = QueueEntry.objects.filter(
                station=station,
                participant=participant,
                status='playing'
            ).first()

            if queue_entry:
                queue_entry.status = 'completed'
                queue_entry.completed_at = timezone.now()
                queue_entry.save()

                # Пересчитываем очередь
                QueueService._recalculate_waiting_times(station)

                return queue_entry
            return None

    @staticmethod
    def leave_queue(station, participant):
        with transaction.atomic():
            queue_entry = QueueEntry.objects.filter(
                station=station,
                participant=participant,
                status='waiting'
            ).first()

            if queue_entry:
                old_position = queue_entry.position
                queue_entry.status = 'cancelled'
                queue_entry.save()

                # Пересчитываем только тех, кто был после ушедшего
                QueueService._recalculate_queue_after_position(station, old_position)

                return queue_entry
            return None

    @staticmethod
    def _recalculate_queue_after_position(station, from_position):
        """Пересчитать позиции участников после указанной позиции"""
        with transaction.atomic():
            # Находим участников, которые были после ушедшего
            entries_after = QueueEntry.objects.filter(
                station=station,
                status='waiting',
                position__gt=from_position
            ).order_by('position')

            # Сдвигаем позиции
            for index, entry in enumerate(entries_after, start=from_position):
                entry.position = index
                entry.save()

            # Пересчитываем время ожидания для всех ожидающих
            QueueService._recalculate_waiting_times(station)

    @staticmethod
    def _recalculate_waiting_times(station):
        """Пересчитать время ожидания для всех в очереди"""
        waiting_entries = QueueEntry.objects.filter(
            station=station,
            status='waiting'
        ).order_by('position')

        current_players = QueueEntry.objects.filter(
            station=station,
            status='playing'
        ).count()

        for entry in waiting_entries:
            if current_players == 0:
                wait_time = (entry.position - 1) * station.game_duration
            else:
                wait_time = entry.position * station.game_duration

            entry.estimated_wait_time = wait_time
            entry.save()


class StatusService:
    @staticmethod
    def get_station_status(station):
        """Получить полный статус стенда"""
        current_player = QueueEntry.objects.filter(
            station=station,
            status='playing'
        ).first()

        waiting_entries = QueueEntry.objects.filter(
            station=station,
            status='waiting'
        ).order_by('position')

        waiting_count = waiting_entries.count()

        return {
            'station': station,
            'current_player': current_player.participant if current_player else None,
            'waiting_count': waiting_count,
            'waiting_queue': waiting_entries,
            'is_available': current_player is None,
        }

    @staticmethod
    def get_participant_status(participant):
        """Получить статус участника во всех очередях"""
        queue_entries = QueueEntry.objects.filter(
            participant=participant,
            status__in=['waiting', 'playing']
        ).select_related('station')

        result = []
        for entry in queue_entries:
            # Количество людей перед участником
            people_ahead = entry.position - 1 if entry.status == 'waiting' else 0
            is_next = entry.position == 1 and entry.status == 'waiting'

            status_info = {
                'queue_entry': entry,
                'station': entry.station,
                'position': entry.position,
                'status': entry.status,
                'estimated_wait_minutes': entry.estimated_wait_time // 60,
                'people_ahead': people_ahead,
                'is_playing': entry.status == 'playing',
                'is_next': is_next
            }

            result.append(status_info)

        return result