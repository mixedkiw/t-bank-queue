import { API_BASE_URL } from '../config.js'

class ApiService {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }))
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error(`API Error at ${endpoint}:`, error)
            throw error
        }
    }

    // User management
    async registerUser(userData) {
        return this.request('/participants/', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
    }

    // Stations
    async getStations() {
        return this.request('/stations/')
    }

    async getStationByQR(qrCode) {
        return this.request(`/stations/get_by_qr/?qr_code=${qrCode}`)
    }

    // Queue management
    async joinQueue(queueData) {
        return this.request('/queue/', {
            method: 'POST',
            body: JSON.stringify(queueData),
        })
    }

    async leaveQueue(leaveData) {
        return this.request('/queue/leave/', {
            method: 'POST',
            body: JSON.stringify(leaveData),
        })
    }

    async startGame(gameData) {
        return this.request('/queue/start_game/', {
            method: 'POST',
            body: JSON.stringify(gameData),
        })
    }

    async getMyQueueStatus(deviceId) {
        return this.request(`/queue/my_status/?device_id=${deviceId}`)
    }

    async getStationStatus(stationId) {
        return this.request(`/queue/station_status/?station_id=${stationId}`)
    }

    async getStationQueue(stationId) {
        return this.request(`/queue/station_queue/?station_id=${stationId}`)
    }
}

export default new ApiService()