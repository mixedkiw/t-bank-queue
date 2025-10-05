import React, { useState, useRef } from 'react'
import MySlots from './Slots.js'
import getAllSlots from '../Api/getSlots.js'

function AllSlots() {
	const [data, setData] = useState(null)

	const allSlots = function () {
		const data = getAllSlots()
			.then(data => {
				if (data) {
					setData(data)
				}
			})
			.catch(error => console.error(error))
	}

	return (
		<React.Fragment>
			<main className='slots'></main>
		</React.Fragment>
	)
}

export default AllSlots
