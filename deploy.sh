#!/bin/bash

set -e

echo "=== Запуск Docker Compose ==="
docker-compose down
docker-compose up -d --build

echo "=== Ожидание запуска сервисов ==="
echo "Ожидаем запуск бэкенда (30 секунд)..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/stations/ > /dev/null 2>&1; then
        echo "✅ Бэкенд запущен успешно (через ${i} секунд)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Бэкенд не запустился за 30 секунд"
        docker-compose logs web
        exit 1
    fi
    sleep 1
done

echo "Ожидаем запуск фронтенда (20 секунд)..."
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Фронтенд запущен успешно (через ${i} секунд)"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "⚠️ Фронтенд не запустился, продолжаем без него..."
        break
    fi
    sleep 1
done

echo "=== Сборка фронтенда для продакшена ==="
cd frontend
echo "Установка зависимостей..."
npm install

echo "Сборка проекта..."
npm run build

echo "Проверка сборки..."
if [ -f "dist/index.html" ] && [ -f "dist/bundle.js" ]; then
    echo "✅ Фронтенд собран успешно"
else
    echo "❌ Ошибка сборки фронтенда"
    exit 1
fi

cd ..

echo "=== Запуск продакшен сервера для фронтенда ==="
# Останавливаем dev сервер фронтенда
docker-compose stop frontend

# Запускаем продакшен сервер
cd frontend
npx serve -s dist -l 3000 &
FRONTEND_PID=$!
cd ..

echo "Ожидаем запуск продакшен фронтенда (5 секунд)..."
sleep 5

echo "=== Создание туннелей ==="
SUBDOMAIN_BACKEND="django-$(date +%Y%m%d)"
SUBDOMAIN_FRONTEND="react-$(date +%Y%m%d)"

echo ""
echo "🌐 Ваши приложения будут доступны по адресам:"
echo "   Фронтенд: https://${SUBDOMAIN_FRONTEND}.serveo.net"
echo "   Бэкенд API: https://${SUBDOMAIN_BACKEND}.serveo.net/api"
echo ""
echo "📱 QR-коды для станций:"
echo "   Станция 1: https://${SUBDOMAIN_FRONTEND}.serveo.net?station_id=1"
echo "   Станция 2: https://${SUBDOMAIN_FRONTEND}.serveo.net?station_id=2"
echo "   Станция 3: https://${SUBDOMAIN_FRONTEND}.serveo.net?station_id=3"
echo ""

# Функция для обработки прерывания
cleanup() {
    echo ""
    echo "=== Остановка приложений ==="
    kill $FRONTEND_PID 2>/dev/null || true
    docker-compose down
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "=== Запуск туннелей ==="
echo "Запуск туннеля для бэкенда (порт 8000)..."
ssh -o StrictHostKeyChecking=no -R ${SUBDOMAIN_BACKEND}.serveo.net:80:localhost:8000 serveo.net &
BACKEND_TUNNEL_PID=$!

sleep 3

echo "Запуск туннеля для фронтенда (порт 3000)..."
ssh -o StrictHostKeyChecking=no -R ${SUBDOMAIN_FRONTEND}.serveo.net:80:localhost:3000 serveo.net &
FRONTEND_TUNNEL_PID=$!

echo ""
echo "✅ Туннели запущены!"
echo "Для остановки нажмите Ctrl+C"
echo ""

# Проверяем туннели
sleep 5
if curl -s https://${SUBDOMAIN_BACKEND}.serveo.net/api/stations/ > /dev/null 2>&1; then
    echo "✅ Туннель бэкенда работает"
else
    echo "⚠️ Туннель бэкенда может не работать"
fi

if curl -s https://${SUBDOMAIN_FRONTEND}.serveo.net > /dev/null 2>&1; then
    echo "✅ Туннель фронтенда работает"
else
    echo "⚠️ Туннель фронтенда может не работать"
fi

# Бесконечное ожидание
while true; do
    sleep 60
    echo "🔄 Проверка туннелей..."

    # Проверяем что туннели еще работают
    if ! kill -0 $BACKEND_TUNNEL_PID 2>/dev/null; then
        echo "❌ Туннель бэкенда упал, перезапускаем..."
        ssh -o StrictHostKeyChecking=no -R ${SUBDOMAIN_BACKEND}.serveo.net:80:localhost:8000 serveo.net &
        BACKEND_TUNNEL_PID=$!
    fi

    if ! kill -0 $FRONTEND_TUNNEL_PID 2>/dev/null; then
        echo "❌ Туннель фронтенда упал, перезапускаем..."
        ssh -o StrictHostKeyChecking=no -R ${SUBDOMAIN_FRONTEND}.serveo.net:80:localhost:3000 serveo.net &
        FRONTEND_TUNNEL_PID=$!
    fi
done