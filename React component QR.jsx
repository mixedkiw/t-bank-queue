
import React, { useState, useEffect } from 'react';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { QueueAPI } from './api';

const ParticipantApp = () => {
    const [deviceId] = useState(() => localStorage.getItem('device_id') || generateDeviceId());
    const [participant, setParticipant] = useState(null);
    const [myStatus, setMyStatus] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [scannedStation, setScannedStation] = useState(null);

    function generateDeviceId() {
        const id = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('device_id', id);
        return id;
    }

    const registerParticipant = async (name) => {
        try {
            const participantData = await QueueAPI.registerParticipant(deviceId, name);
            setParticipant(participantData);
            localStorage.setItem('participant_name', name);
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const loadMyStatus = async () => {
        try {
            const status = await QueueAPI.getMyStatus(deviceId);
            setMyStatus(status);
        } catch (error) {
            console.error('Failed to load status:', error);
        }
    };

    // Обработка сканирования QR
    const handleScan = async (result) => {
        if (result) {
            setScanning(false);
            const stationId = parseInt(result);
            
            if (isNaN(stationId)) {
                alert('Неверный QR-код');
                return;
            }

            setScannedStation(stationId);
            
            // Проверяем статус участника на этом стенде
            const status = myStatus.find(s => s.station.id === stationId);
            
            if (status) {
                if (status.status === 'waiting' && status.position === 1) {
                    // Первый в очереди - может начать игру
                    try {
                        await QueueAPI.startPlaying(deviceId, stationId);
                        await loadMyStatus();
                        alert('Игра начата!');
                    } catch (error) {
                        alert('Не удалось начать игру');
                    }
                } else if (status.status === 'playing') {
                    // Уже играет - может завершить игру
                    try {
                        await QueueAPI.completePlaying(deviceId, stationId);
                        await loadMyStatus();
                        alert('Игра завершена!');
                    } catch (error) {
                        alert('Не удалось завершить игру');
                    }
                } else {
                    alert('Вы не первый в очереди');
                }
            } else {
                // Не в очереди - предлагаем встать в очередь
                if (confirm('Встать в очередь к этому стенду?')) {
                    try {
                        await QueueAPI.joinQueue(deviceId, stationId);
                        await loadMyStatus();
                        alert('Вы встали в очередь!');
                    } catch (error) {
                        alert('Не удалось встать в очередь');
                    }
                }
            }
        }
    };

    const joinQueue = async (stationId) => {
        try {
            await QueueAPI.joinQueue(deviceId, stationId);
            await loadMyStatus();
        } catch (error) {
            console.error('Failed to join queue:', error);
        }
    };

    const leaveQueue = async (stationId) => {
        try {
            await QueueAPI.leaveQueue(deviceId, stationId);
            await loadMyStatus();
        } catch (error) {
            console.error('Failed to leave queue:', error);
        }
    };

    useEffect(() => {
        if (participant) {
            loadMyStatus();
            const interval = setInterval(loadMyStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [participant]);

    useEffect(() => {
        const savedName = localStorage.getItem('participant_name');
        if (savedName) {
            registerParticipant(savedName);
        }
    }, []);

    if (!participant) {
        return <RegistrationForm onRegister={registerParticipant} />;
    }

    return (
        <div className="participant-app">
            <header>
                <h1>Электронная очередь</h1>
                <p>Добро пожаловать, {participant.name}!</p>
                <button 
                    onClick={() => setScanning(!scanning)}
                    className="scan-btn"
                >
                    {scanning ? 'Отменить сканирование' : '📷 Сканировать QR'}
                </button>
            </header>

            {scanning && (
                <div className="qr-scanner">
                    <QrScanner
                        onDecode={handleScan}
                        onError={(error) => console.error(error)}
                    />
                    <p>Наведите камеру на QR-код у стенда</p>
                </div>
            )}

            <div className="my-status">
                <h2>Мои очереди</h2>
                {myStatus.map(status => (
                    <QueueStatus 
                        key={status.station.id}
                        status={status}
                        onLeaveQueue={leaveQueue}
                        onStartPlaying={() => setScannedStation(status.station.id)}
                    />
                ))}
            </div>

            <StationsList onJoinQueue={joinQueue} />
        </div>
    );
};

const QueueStatus = ({ status, onLeaveQueue, onStartPlaying }) => {
    const { station, position, people_ahead, estimated_wait_minutes, is_playing, is_next } = status;

    return (
        <div className={`queue-status ${is_playing ? 'playing' : ''}`}>
            <h3>{station.name}</h3>
            <div className="status-info">
                {is_playing ? (
                    <>
                        <span className="status-badge playing">🎮 Играете сейчас</span>
                        <p>Подойдите к стенду и отсканируйте QR-код для завершения</p>
                    </>
                ) : is_next ? (
                    <>
                        <span className="status-badge next">⏰ Ваша очередь!</span>
                        <p>Подойдите к стенду и отсканируйте QR-код для начала игры</p>
                    </>
                ) : (
                    <span className="status-badge waiting">⏳ В очереди</span>
                )}
                
                <p>Позиция в очереди: <strong>{position}</strong></p>
                <p>Людей перед вами: <strong>{people_ahead}</strong></p>
                <p>Примерное время ожидания: <strong>{estimated_wait_minutes} мин.</strong></p>
                
                <div className="actions">
                    {!is_playing && (
                        <button onClick={() => onLeaveQueue(station.id)}>
                            Покинуть очередь
                        </button>
                    )}
                    {is_next && !is_playing && (
                        <button onClick={onStartPlaying} className="primary">
            Начать игру
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const StationsList = ({ onJoinQueue }) => {
    const [stations, setStations] = useState([]);

    useEffect(() => {
        loadStations();
    }, []);

    const loadStations = async () => {
        try {
            const stationsData = await QueueAPI.getStations();
            setStations(stationsData);
        } catch (error) {
            console.error('Failed to load stations:', error);
        }
    };

    return (
        <div className="stations-list">
            <h2>Доступные стенды</h2>
            {stations.map(station => (
                <div key={station.id} className="station-card">
                    <h3>{station.name}</h3>
                    <p>{station.description}</p>
                    <p>Время игры: {station.game_duration / 60} мин.</p>
                    <button onClick={() => onJoinQueue(station.id)}>
                        Встать в очередь
                    </button>
                </div>
            ))}
        </div>
    );
};

const RegistrationForm = ({ onRegister }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onRegister(name.trim());
        }
    };

    return (
        <div className="registration">
            <h1>Регистрация в очереди</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Введите ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <button type="submit">Продолжить</button>
            </form>
        </div>
    );
};

export default ParticipantApp;
