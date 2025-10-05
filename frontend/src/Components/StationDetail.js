import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import joinQueue from '../Api/joinQueue.js'
import getStationQueue from '../Api/getStationQueue.js'
import UserUUIDManager from '../UUID/uuid.js'
import '../Styles/StationDetail.css'

function StationDetail() {
    const { stationId } = useParams()
    const [station, setStation] = useState(null)
    const [queue, setQueue] = useState([])
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadStationQueue()
        const interval = setInterval(loadStationQueue, 10000) // Обновление каждые 10 сек
        return () => clearInterval(interval)
    }, [stationId])

    const loadStationQueue = async () => {
        try {
            const queueData = await getStationQueue(stationId)
            setQueue(queueData)
            // Предполагаем, что данные станции приходят вместе с очередью
            if (queueData.station_name && !station) {
                setStation({
                    id: queueData.station_id,
                    name: queueData.station_name
                })
            }
        } catch (err) {
            setError('Ошибка загрузки данных станции')
            console.error('Error loading station:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinQueue = async () => {
        try {
            setJoining(true)
            const uuidManager = new UserUUIDManager()
            const userUUID = uuidManager.getUserUUID()

            await joinQueue({
                device_id: userUUID,
                station_id: parseInt(stationId)
            })

            alert('Вы успешно встали в очередь!')
            await loadStationQueue() // Обновляем данные
        } catch (err) {
            alert('Ошибка при присоединении к очереди')
            console.error('Error joining queue:', err)
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return <div className="loading">Загрузка станции...</div>
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className="station-detail">
            <div className="station-header">
                <Link to="/events" className="btn-back">← Назад к станциям</Link>
                <h1>{station?.name || 'Станция'}</h1>
            </div>

            <div className="station-info">
                <div className="queue-status">
                    <h2>Текущая очередь</h2>
                    <div className="queue-stats">
                        <span>Всего в очереди: {queue.total_in_queue || 0}</span>
                        <span>Текущий игрок: {queue.current_player?.name || 'Нет'}</span>
                    </div>
                </div>

                <button
                    onClick={handleJoinQueue}
                    disabled={joining}
                    className="btn-join-queue"
                >
                    {joining ? 'Встаем в очередь...' : 'Встать в очередь'}
                </button>
            </div>

            <div className="queue-list">
                <h3>Участники в очереди:</h3>
                {queue.queue && queue.queue.length > 0 ? (
                    <div className="participants-list">
                        {queue.queue.map((participant, index) => (
                            <div key={index} className="participant">
                                <span className="position">{index + 1}</span>
                                <span className="name">{participant.name}</span>
                                <span className="status">
                                    {index === 0 ? 'Играет' : 'Ожидает'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Очередь пуста</p>
                )}
            </div>
        </div>
    )
}

export default StationDetail