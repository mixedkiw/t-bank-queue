import { API_BASE_URL } from '../config.js'

async function registration(data) {
	try {
		const response = await fetch(`${API_BASE_URL}/participants/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})

		if (!response.ok) {
			throw new Error('Ошибка')
		}
		const responseData = await response.json()
		return responseData
	} catch (error) {}
}

export default registration
