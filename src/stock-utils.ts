const FESTIVAL_CARD_WIDTH = '143px' //also change in scss
const FESTIVAL_CARD_HEIGHT = '263px'

function getBackgroundInlineStyleForFestivibesCard(destination: FestivalCard) {
	let file
	switch (destination.type) {
		case 1:
			file = 'festivalCardsFront.jpg'
			break
	}

	const imagePosition = destination.type_arg - 1
	const row = Math.floor(imagePosition / IMAGE_FESTIVALS_PER_ROW)
	const xBackgroundPercent = (imagePosition - row * IMAGE_FESTIVALS_PER_ROW) * 100
	const yBackgroundPercent = row * 100
	return `background-image: url('${g_gamethemeurl}img/${file}'); background-position: -${xBackgroundPercent}% -${yBackgroundPercent}%; background-size:1000%;`
}
