import api from './index.js'

async function startGame(data) {
    try {
        const responseData = await api.startGame(data)
        return responseData
    } catch (error) {
        console.error('Start game error:', error)
        throw error
    }
}

export default startGame