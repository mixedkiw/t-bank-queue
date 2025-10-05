import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import getStations from '../Api/getEvents.js'
import '../Styles/Events.css'

function Events() {
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadStations = async () => {
            try {
                setLoading(true)
                const stationsData = await getStations()
                setStations(stationsData || [])
            } catch (err) {
                setError('Ошибка загрузки станций')
                console.error('Error loading stations:', err)
            } finally {
                setLoading(false)
            }
        }

        loadStations()
    }, [])

    if (loading) {
        return <div className="loading">Загрузка станций...</div>
    }

    if (error) {
        return <div className="error">{error}</div>
    }

    return (
        <div className='events'>
            <div className='events__inner'>
                <h1>Игровые станции</h1>
                <p className="events__subtitle">Выберите станцию для участия в игре</p>

                <div className='events-list'>
                    {stations.length === 0 ? (
                        <div className="no-stations">
                            <p>Нет доступных станций</p>
                        </div>
                    ) : (
                        stations.map(station => (
                            <div key={station.id} className='event-card'>
                                <h3>{station.name}</h3>
                                <p className="event-description">{station.description}</p>
                                <div className="event-info">
                                    <span className="duration">
                                        Длительность: {Math.floor(station.game_duration / 60)} мин
                                    </span>
                                    <span className="qr-code">QR: {station.qr_code}</span>
                                </div>
                                <Link
                                    to={`/station/${station.id}`}
                                    className="btn-join"
                                >
                                    Подробнее
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Events