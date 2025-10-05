import api from './index.js'

async function registration(data) {
    try {
        const responseData = await api.registerUser(data)
        return responseData
    } catch (error) {
        console.error('Registration error:', error)
        throw error
    }
}

export default registration