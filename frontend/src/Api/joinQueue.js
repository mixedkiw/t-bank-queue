import api from './index.js'

async function joinQueue(data) {
    try {
        const responseData = await api.joinQueue(data)
        return responseData
    } catch (error) {
        console.error('Join queue error:', error)
        throw error
    }
}

export default joinQueue