#!/bin/bash

set -e

echo "=== Запуск Docker Compose ==="
docker-compose down
docker-compose up -d --build


echo "=== Создание туннеля с автоподтверждением ==="
SUBDOMAIN="django-$(date +%Y%m%d)"

echo "Ваше приложение будет доступно по адресу:"
echo "https://${SUBDOMAIN}.serveo.net"

ssh -o StrictHostKeyChecking=no -R ${SUBDOMAIN}.serveo.net:80:localhost:8000 serveo.net