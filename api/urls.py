from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'participants', views.ParticipantViewSet, basename='participants')
router.register(r'stations', views.StationViewSet, basename='stations')
router.register(r'queue', views.QueueViewSet, basename='queue')
router.register(r'admin', views.AdminViewSet, basename='admin')

urlpatterns = [
    path('api/', include(router.urls)),
]