import api from './index.js'

async function getStations() {
    try {
        const data = await api.getStations()
        return data
    } catch (error) {
        console.error('Get stations error:', error)
        throw error
    }
}

export default getStations