from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    # Админка Django
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/', include('api.urls')),
]