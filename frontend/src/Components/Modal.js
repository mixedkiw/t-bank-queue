import React, { useRef } from 'react'
import '../Styles/Modal.css'
import registration from '../Api/registration.js'
import UserUUIDManager from '../UUID/uuid.js'

function Modal({ onRegister }) {
	const userNameRef = useRef(null)
	const buttonRef = useRef(null)
	const modalRef = useRef(null)

	const handleClickButton = async function () {
		const userName = userNameRef.current.value
		if (userName) {
			const uuidManager = new UserUUIDManager()
			const userUUID = uuidManager.getUserUUID()
			// console.log({ device_id: userUUID, name: userName })

			try {
				await registration({ device_id: userUUID, name: userName })
				userNameRef.current.value = ''
				modalRef.current.classList.add('close')

				if (onRegister) onRegister()
			} catch (error) {
				console.error(error)
			}
		}
	}

	return (
		<React.Fragment>
			<div className='modal-wrapper' ref={modalRef}>
				<div className='modal-wrapper__modal'>
					<div className='registration-form-section'>
						<h1>Регистрация на событие</h1>
						<form className='registration-form'>
							<div className='form-group'>
								<label htmlFor='userName'>Ваше имя:</label>
								<input
									type='text'
									id='userName'
									name='name'
									placeholder='Введите имя'
									ref={userNameRef}
									autoComplete='off'
									required
								></input>
							</div>
							<div className='form-group'>
								<button
									type='button'
									className='btn-registrate'
									ref={buttonRef}
									onClick={handleClickButton}
								>
									Встать в очередь
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</React.Fragment>
	)
}

export default Modal
