import React, { useState, useEffect, useRef } from 'react'
import getMyQueueStatus from '../Api/getMyQueueStatus.js'
import leaveQueue from '../Api/leaveQueue.js'
import joinQueue from '../Api/joinQueue.js'
import '../Styles/MySlots.css'

function MySlots({ userData }) {
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notifications, setNotifications] = useState([])
    const previousSlotsRef = useRef([])

    // Загрузка данных о очередях
    const loadMySlots = async () => {
        try {
            setLoading(true)
            const slotsData = await getMyQueueStatus(userData.device_id)
            setSlots(slotsData || [])

            // Проверка изменений для уведомлений
            checkForChanges(previousSlotsRef.current, slotsData || [])
            previousSlotsRef.current = slotsData || []

        } catch (err) {
            setError('Ошибка загрузки данных о очередях')
            console.error('Error loading slots:', err)
        } finally {
            setLoading(false)
        }
    }

    // Проверка изменений в очереди для уведомлений
    const checkForChanges = (previous, current) => {
        previous.forEach(prevSlot => {
            const currentSlot = current.find(s => s.station.id === prevSlot.station.id)
            if (currentSlot) {
                // Уведомление о быстром продвижении
                if (prevSlot.position > 2 && currentSlot.position === 1) {
                    addNotification(
                        '🚀 Быстрое продвижение!',
                        `Вы теперь первый в очереди на "${currentSlot.station.name}"`
                    )
                }
                // Уведомление о задержке
                else if (prevSlot.estimated_wait_minutes < currentSlot.estimated_wait_minutes + 5) {
                    addNotification(
                        '⚠️ Задержка в очереди',
                        `Время ожидания на "${currentSlot.station.name}" увеличилось`
                    )
                }
                // Уведомление когда подошла очередь
                else if (prevSlot.position > 1 && currentSlot.position === 1) {
                    addNotification(
                        '🎉 Ваша очередь!',
                        `Подошла очередь на станции "${currentSlot.station.name}"`
                    )
                }
            }
        })
    }

    // Добавление уведомления
    const addNotification = (title, message) => {
        const newNotification = {
            id: Date.now(),
            title,
            message,
            timestamp: new Date()
        }

        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]) // Максимум 5 уведомлений

        // Автоудаление через 10 секунд
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
        }, 10000)
    }

    // Автоматическое присоединение к очереди при загрузке по QR-коду
    useEffect(() => {
        const handleQRCodeJoin = async () => {
            const urlParams = new URLSearchParams(window.location.search)
            const stationId = urlParams.get('station_id')

            if (stationId && userData) {
                try {
                    setLoading(true)
                    await joinQueue({
                        device_id: userData.device_id,
                        station_id: parseInt(stationId)
                    })

                    addNotification(
                        '✅ Вы в очереди!',
                        'Вы успешно встали в очередь на эту станцию'
                    )

                    // Обновляем данные
                    await loadMySlots()

                    // Очищаем URL от параметров
                    window.history.replaceState({}, '', window.location.pathname)

                } catch (err) {
                    console.error('Error joining queue from QR:', err)
                    addNotification(
                        '❌ Ошибка',
                        'Не удалось встать в очередь. Попробуйте еще раз.'
                    )
                } finally {
                    setLoading(false)
                }
            }
        }

        if (userData) {
            loadMySlots()
            handleQRCodeJoin()
        }
    }, [userData])

    // Обновление данных каждые 30 секунд
    useEffect(() => {
        if (!userData) return

        const interval = setInterval(loadMySlots, 30000)
        return () => clearInterval(interval)
    }, [userData])

    // Выход из очереди
    const handleLeaveQueue = async (stationId, stationName) => {
        try {
            await leaveQueue({
                device_id: userData.device_id,
                station_id: stationId
            })

            addNotification(
                '👋 Вы вышли из очереди',
                `Вы покинули очередь на "${stationName}"`
            )

            await loadMySlots()
        } catch (err) {
            console.error('Error leaving queue:', err)
            addNotification(
                '❌ Ошибка',
                'Не удалось выйти из очереди'
            )
        }
    }

    if (loading) {
        return (
            <div className="slots-container">
                <div className="loading">Загрузка ваших очередей...</div>
            </div>
        )
    }

    return (
        <div className="slots-container">
            {/* Уведомления */}
            <div className="notifications-panel">
                {notifications.map(notification => (
                    <div key={notification.id} className="notification">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">
                            {notification.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Основной контент */}
            <div className="slots-content">
                <h2>Мои очереди</h2>

                {error && (
                    <div className="error-message global-error">{error}</div>
                )}

                {slots.length === 0 ? (
                    <div className="no-queues">
                        <div className="no-queues-icon">📋</div>
                        <h3>У вас нет активных очередей</h3>
                        <p>Отсканируйте QR-код на станции, чтобы встать в очередь</p>
                        <div className="qr-instruction">
                            <p>Как встать в очередь:</p>
                            <ol>
                                <li>Найдите QR-код на станции</li>
                                <li>Отсканируйте его камерой телефона</li>
                                <li>Или перейдите по ссылке из QR-кода</li>
                                <li>Вы автоматически попадете в очередь</li>
                            </ol>
                        </div>
                    </div>
                ) : (
                    <div className='queues-list'>
                        {slots.map((slot, index) => (
                            <QueueCard
                                key={index}
                                slot={slot}
                                onLeaveQueue={handleLeaveQueue}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Компонент карточки очереди
function QueueCard({ slot, onLeaveQueue }) {
    const getWaitTimeColor = (minutes) => {
        if (minutes <= 5) return '#28a745'
        if (minutes <= 15) return '#ffc107'
        return '#dc3545'
    }

    const getPositionText = (position) => {
        if (position === 1) return 'Сейчас ваша очередь!'
        if (position === 2) return 'Вы следующий'
        return `${position} место в очереди`
    }

    return (
        <div className={`queue-card ${slot.position === 1 ? 'current-turn' : ''}`}>
            <div className="queue-header">
                <h3>{slot.station.name}</h3>
                <div className="queue-status">
                    <span className={`status-badge ${slot.position === 1 ? 'ready' : 'waiting'}`}>
                        {slot.position === 1 ? 'Готов к игре' : 'В очереди'}
                    </span>
                </div>
            </div>

            <div className="queue-info">
                <div className="info-row">
                    <span className="info-label">Позиция:</span>
                    <span className="info-value highlight">
                        {getPositionText(slot.position)}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">Людей перед вами:</span>
                    <span className="info-value">{slot.people_ahead}</span>
                </div>

                <div className="info-row">
                    <span className="info-label">Примерное время ожидания:</span>
                    <span
                        className="info-value wait-time"
                        style={{ color: getWaitTimeColor(slot.estimated_wait_minutes) }}
                    >
                        {slot.estimated_wait_minutes} минут
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">Статус станции:</span>
                    <span className="info-value">
                        {slot.current_player_exists ? 'Занята' : 'Свободна'}
                    </span>
                </div>
            </div>

            <div className="queue-actions">
                <button
                    onClick={() => onLeaveQueue(slot.station.id, slot.station.name)}
                    className="btn-leave-queue"
                >
                    Покинуть очередь
                </button>
            </div>

            {slot.position === 1 && (
                <div className="current-turn-notice">
                    ⚡ Подойдите к станции для начала игры!
                </div>
            )}
        </div>
    )
}

export default MySlots