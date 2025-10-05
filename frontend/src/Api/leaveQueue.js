import api from './index.js'

async function leaveQueue(data) {
    try {
        const responseData = await api.leaveQueue(data)
        return responseData
    } catch (error) {
        console.error('Leave queue error:', error)
        throw error
    }
}

export default leaveQueue