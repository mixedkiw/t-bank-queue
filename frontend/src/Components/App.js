import React, { useState, useEffect } from 'react'
import Main from './Main.js'
import Header from './Header.js'
import Footer from './Footer.js'
import Modal from './Modal.js'
import '../Styles/Modal.css'

function App() {
    const [isRegistered, setIsRegistered] = useState(false)
    const [userData, setUserData] = useState(null)

    // Проверка регистрации при загрузке
    useEffect(() => {
        const checkRegistration = () => {
            try {
                const userUUID = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('user_uuid='))
                    ?.split('=')[1]

                const userName = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('user_name='))
                    ?.split('=')[1]

                if (userUUID && userName) {
                    setIsRegistered(true)
                    setUserData({
                        device_id: userUUID,
                        name: decodeURIComponent(userName)
                    })
                }
            } catch (error) {
                console.error('Error reading cookie:', error)
            }
        }

        checkRegistration()
    }, [])

    // Обработка QR-кода из URL
    useEffect(() => {
        const handleQRCodeRegistration = () => {
            const urlParams = new URLSearchParams(window.location.search)
            const stationId = urlParams.get('station_id')

            if (stationId && isRegistered && userData) {
                // Автоматически встаем в очередь при переходе по QR-коду
                console.log('Auto-joining queue for station:', stationId)
                // Здесь будет логика автоматического присоединения к очереди
            }
        }

        if (isRegistered) {
            handleQRCodeRegistration()
        }
    }, [isRegistered, userData])

    const handleRegister = (userInfo) => {
        setIsRegistered(true)
        setUserData(userInfo)

        // Обработка QR-кода после регистрации
        const urlParams = new URLSearchParams(window.location.search)
        const stationId = urlParams.get('station_id')

        if (stationId) {
            console.log('Ready to join queue for station:', stationId)
        }
    }

    return (
        <div className="app">
            {!isRegistered && <Modal onRegister={handleRegister} />}
            <Header userData={userData} />
            <main className='main'>
                {isRegistered && <Main userData={userData} />}
            </main>
            <Footer />
        </div>
    )
}

export default App