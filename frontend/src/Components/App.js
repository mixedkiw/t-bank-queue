import React, { useState, useEffect } from 'react'
import Main from './Main.js'
import Header from './Header.js'
import Footer from './Footer.js'
import Modal from './Modal.js'
import '../Styles/Modal.css'

function App(props) {
	const getInitialRegistration = () => {
		const userUUID = document.cookie
			.split('; ')
			.find(row => row.startsWith('user_uuid='))
			?.split('=')[1]
		return !!userUUID // true если есть, false если нет
	}

	const [isRegistered, setIsRegistered] = useState(getInitialRegistration())

	return (
		<React.Fragment>
			{!isRegistered && <Modal onRegister={() => setIsRegistered(true)} />}
			<Header />
			<main className='main'>{isRegistered && <Main />}</main>
			<Footer />
		</React.Fragment>
	)
}

export default App
