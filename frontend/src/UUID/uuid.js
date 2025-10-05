import { v4 as uuidv4 } from 'uuid'

// Упрощенная функция для работы с cookies
export default class UserUUIDManager {
	constructor() {
		this.cookieName = 'user_uuid'
		this.expiryYears = 1
	}

	// Получить значение cookie
	getCookie(name) {
		const value = `; ${document.cookie}`
		const parts = value.split(`; ${name}=`)
		if (parts.length === 2) return parts.pop().split(';').shift()
	}

	// Установить cookie
	setCookie(name, value, days) {
		const expires = new Date()
		expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
		document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
	}

	// Получить или создать UUID пользователя
	getUserUUID() {
		let uuid = this.getCookie(this.cookieName)

		if (!uuid) {
			uuid = this.createUserUUID()
		}

		return uuid
	}

	// Создать новый UUID
	createUserUUID() {
		const uuid = uuidv4()
		this.setCookie(this.cookieName, uuid, this.expiryYears * 365)
		return uuid
	}

	// Проверить, есть ли UUID у пользователя
	hasUserUUID() {
		return !!this.getCookie(this.cookieName)
	}
}

// Использование
// const uuidManager = new UserUUIDManager()
// const userUUID = uuidManager.getUserUUID()

// console.log('User UUID:', userUUID)
// console.log('Has UUID:', uuidManager.hasUserUUID())
