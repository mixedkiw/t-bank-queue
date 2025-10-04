from django.db import models
from django.utils import timezone


class GameStation(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    qr_code = models.CharField(max_length=255, unique=True)
    game_duration = models.IntegerField(default=600)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Participant(models.Model):
    device_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.device_id})"


class QueueEntry(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'В ожидании'),
        ('completed', 'Завершено'),
        ('cancelled', 'Отменено'),
    ]

    station = models.ForeignKey(GameStation, on_delete=models.CASCADE)
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    joined_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.participant.name} - {self.station.name}"