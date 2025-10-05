import api from './index.js'

async function getMyQueueStatus(deviceId) {
    try {
        const data = await api.getMyQueueStatus(deviceId)
        return data
    } catch (error) {
        console.error('Get queue status error:', error)
        throw error
    }
}

export default getMyQueueStatus