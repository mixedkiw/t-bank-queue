import React, { useRef, useState } from 'react'
import '../Styles/Modal.css'
import registration from '../Api/registration.js'
import UserUUIDManager from '../UUID/uuid.js'

function Modal({ onRegister }) {
    const userNameRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRegistration = async () => {
        const userName = userNameRef.current.value.trim()

        if (!userName) {
            setError('Пожалуйста, введите ваше имя')
            return
        }

        if (userName.length < 2) {
            setError('Имя должно содержать минимум 2 символа')
            return
        }

        setLoading(true)
        setError('')

        try {
            const uuidManager = new UserUUIDManager()
            const userUUID = uuidManager.getUserUUID()

            // Сохраняем имя в cookie
            const expires = new Date()
            expires.setFullYear(expires.getFullYear() + 1)
            document.cookie = `user_name=${encodeURIComponent(userName)};expires=${expires.toUTCString()};path=/;SameSite=Lax`

            const userData = {
                device_id: userUUID,
                name: userName
            }

            await registration(userData)
            onRegister(userData)

        } catch (err) {
            console.error('Registration error:', err)
            setError('Ошибка регистрации. Попробуйте еще раз.')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleRegistration()
        }
    }

    // Проверяем, есть ли station_id в URL для отображения в модалке
    const urlParams = new URLSearchParams(window.location.search)
    const stationId = urlParams.get('station_id')

    return (
        <div className='modal-wrapper'>
            <div className='modal-wrapper__modal'>
                <div className='registration-form-section'>
                    <h1>Регистрация в системе очередей</h1>

                    {stationId && (
                        <div className="qr-notification">
                            <p>📱 Вы сканировали QR-код станции</p>
                            <p>После регистрации вы автоматически встанете в очередь</p>
                        </div>
                    )}

                    <form className='registration-form' onSubmit={(e) => e.preventDefault()}>
                        <div className='form-group'>
                            <label htmlFor='userName'>Ваше имя:</label>
                            <input
                                type='text'
                                id='userName'
                                placeholder='Введите ваше имя'
                                ref={userNameRef}
                                autoComplete='off'
                                required
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                            />
                            {error && <div className="error-message">{error}</div>}
                        </div>

                        <div className='form-group'>
                            <button
                                type='button'
                                className='btn-registrate'
                                onClick={handleRegistration}
                                disabled={loading}
                            >
                                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                            </button>
                        </div>

                        <div className="registration-info">
                            <p>После регистрации вы сможете:</p>
                            <ul>
                                <li>Вставать в очередь на станции</li>
                                <li>Отслеживать свое положение в очереди</li>
                                <li>Получать уведомления о продвижении</li>
                                <li>Выходить из очереди при необходимости</li>
                            </ul>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Modal