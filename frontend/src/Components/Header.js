import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../Styles/Header.css'
import tBankLogo from '../Images/t-bank.png'

function Header() {
    const location = useLocation()

    return (
        <header className='header'>
            <div className='header__content'>
                <div className='header__tbank-logo'>
                    <a href='https://www.tbank.ru/' target='_blank' rel='noopener noreferrer'>
                        <img src={tBankLogo} alt='Черно-желтый банк' />
                    </a>
                </div>
                <nav className='header__about'>
                    <ul className='header__list'>
                        <li className={location.pathname === '/' || location.pathname === '/events' ? 'active' : ''}>
                            <Link to='/events'>Станции</Link>
                        </li>
                        <li className={location.pathname === '/my-slots' ? 'active' : ''}>
                            <Link to='/my-slots'>Мои слоты</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}

export default Header