// api.js
const API_BASE_URL = 'https://api.example.com/api/v1';

class QueueAPI {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        if (config.body) {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    // Участники
    static async registerParticipant(deviceId, name) {
        return this.request('/participants/', {
            method: 'POST',
            body: { device_id: deviceId, name }
        });
    }

    // Стенды
    static async getStations() {
        return this.request('/stations/');
    }

    // Очередь
    static async joinQueue(deviceId, stationId) {
        return this.request('/queue/', {
            method: 'POST',
            body: { device_id: deviceId, station_id: stationId }
        });
    }

    static async leaveQueue(deviceId, stationId) {
        return this.request('/queue/leave/', {
            method: 'POST',
            body: { device_id: deviceId, station_id: stationId }
        });
    }

    static async startPlaying(deviceId, stationId) {
        return this.request('/queue/start_playing/', {
            method: 'POST',
            body: { device_id: deviceId, station_id: stationId }
        });
    }

    static async completePlaying(deviceId, stationId) {
        return this.request('/queue/complete_playing/', {
            method: 'POST',
            body: { device_id: deviceId, station_id: stationId }
        });
    }

    static async getMyStatus(deviceId) {
        return this.request(`/queue/my_status/?device_id=${deviceId}`);
    }
}
