from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Participant, GameStation, QueueEntry


class QueueAPITests(APITestCase):
    def setUp(self):
        self.station = GameStation.objects.create(
            name="Тестовый стенд",
            qr_code="test_qr_001",
            game_duration=600
        )

        self.participant1 = Participant.objects.create(
            device_id="user1",
            name="Тестовый пользователь 1"
        )

        self.participant2 = Participant.objects.create(
            device_id="user2",
            name="Тестовый пользователь 2"
        )

    def test_register_participant(self):
        url = reverse('participants-list')
        data = {
            'device_id': 'new_user',
            'name': 'Новый пользователь'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Participant.objects.count(), 3)

    def test_join_queue(self):
        url = reverse('queue-list')
        data = {
            'device_id': 'user1',
            'station_id': self.station.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QueueEntry.objects.count(), 1)

    def test_start_game_first_player(self):
        # Участник 1 встает в очередь
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant1
        )

        url = reverse('queue-start-game')
        data = {
            'device_id': 'user1',
            'station_id': self.station.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Проверяем что статус изменился на completed
        entry = QueueEntry.objects.get(participant=self.participant1)
        self.assertEqual(entry.status, 'completed')

    def test_start_game_not_first_player(self):
        # Два участника в очереди
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant1
        )
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant2
        )

        url = reverse('queue-start-game')
        data = {
            'device_id': 'user2',  # Второй участник пытается начать
            'station_id': self.station.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_leave_queue(self):
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant1
        )

        url = reverse('queue-leave')
        data = {
            'device_id': 'user1',
            'station_id': self.station.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        entry = QueueEntry.objects.get(participant=self.participant1)
        self.assertEqual(entry.status, 'cancelled')

    def test_get_my_status(self):
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant1
        )

        url = reverse('queue-my-status') + '?device_id=user1'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['position'], 1)

    def test_get_station_status(self):
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant1
        )

        url = reverse('queue-station-status') + f'?station_id={self.station.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['waiting_count'], 1)
        self.assertTrue(response.data['is_occupied'])

    def test_admin_skip_player(self):
        QueueEntry.objects.create(
            station=self.station,
            participant=self.participant1
        )

        url = reverse('admin-skip-player')
        data = {'station_id': self.station.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        entry = QueueEntry.objects.get(participant=self.participant1)
        self.assertEqual(entry.status, 'cancelled')


class ModelTests(TestCase):
    def test_station_creation(self):
        station = GameStation.objects.create(
            name="Тест",
            qr_code="test123"
        )
        self.assertEqual(str(station), "Тест")

    def test_participant_creation(self):
        participant = Participant.objects.create(
            device_id="test_device",
            name="Test User"
        )
        self.assertEqual(str(participant), "Test User (test_device)")