import React from 'react'
import { useSearchParams } from 'react-router-dom'
import getEvents from '../Api/getEvent.js'

function Events() {
	const [params] = useSearchParams()
	const numberStand = params.get('number')

	return (
		<React.Fragment>
			<div className='events'>
				<div className='events__inner'></div>
			</div>
		</React.Fragment>
	)
}

export default Events
