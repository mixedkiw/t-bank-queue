import React from 'react'
import MySlots from './MySlots.js'
import '../Styles/Main.css'

function Main({ userData }) {
    return (
        <div className="main-content">
            <div className="welcome-section">
                <h1>Добро пожаловать, {userData?.name}!</h1>
                <p>Здесь вы можете управлять своими очередями на станциях</p>
            </div>
            <MySlots userData={userData} />
        </div>
    )
}

export default Main