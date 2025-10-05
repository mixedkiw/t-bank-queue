import { API_BASE_URL } from '../config.js'

async function getEvent() {
	try {
		const response = await fetch(`${API_BASE_URL}/stations/`)

		if (!response.ok) {
			throw new Error('Ошибка')
		}
		const data = await response.json()
		return data
	} catch (error) {}
}

export default getEvent
