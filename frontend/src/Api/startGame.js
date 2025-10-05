import { API_BASE_URL } from '../config.js'

async function startGame(data) {
	try {
		const response = await fetch(API_BASE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})

		if (!response.ok) {
			if (response.code == 400) {
				throw new Error('Вы не первый в очереди')
			} else {
				throw new Error('Ошибка')
			}
		}
		const responseData = await response.json()
		return responseData
	} catch (error) {}
}

export default startGame
