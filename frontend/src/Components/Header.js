import React from 'react'
import '../Styles/Header.css'
import tBankLogo from '../Images/t-bank.png'

function Header() {
	return (
		<React.Fragment>
			<div className='header'>
				<div className='header__content'>
					<div className='header__tbank-logo'>
						<a href='https://www.tbank.ru/' target='_blank'>
							<img src={tBankLogo}></img>
						</a>
					</div>
					<div className='header__about'>
						<ul className='header__list'>
							<li>Главная</li>
							<li>Новости</li>
							<li>О нас</li>
						</ul>
					</div>
				</div>
			</div>
		</React.Fragment>
	)
}

export default Header
