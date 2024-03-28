// <reference path="../card-manager.ts"/>
class FestivalCardsManager extends CardManager<FestivalCard> {
	constructor(public game: FestivibesGame) {
		super(game, {
			animationManager: game.animationManager,
			getId: (card) => `festival-card-${card.id}`,
			setupDiv: (card: FestivalCard, div: HTMLElement) => {
				div.classList.add('festival-card')
				div.dataset.cardId = '' + card.id
				div.dataset.cardType = '' + card.type
				div.style.position = 'relative'

				div.style.width = FESTIVAL_CARD_WIDTH
				div.style.height = FESTIVAL_CARD_HEIGHT
			},
			setupFrontDiv: (card: FestivalCard, div: HTMLElement) => {
				this.setBackground(div as HTMLDivElement, card.type_arg, `${g_gamethemeurl}img/festivalCardsFront.jpg`)
			},
			setupBackDiv: (card: FestivalCard, div: HTMLElement) => {
				this.setBackground(div as HTMLDivElement, card.type_arg, `${g_gamethemeurl}img/festivalCardsBack.jpg`)
			}
		})
	}

	private setBackground(cardDiv: HTMLDivElement, cardType: number, eventsUrl: string) {
		cardDiv.style.backgroundImage = `url('${eventsUrl}')`
		const imagePosition = cardType - 1
		const row = Math.floor(imagePosition / IMAGE_FESTIVALS_PER_ROW)
		const xBackgroundPercent = (imagePosition - row * IMAGE_FESTIVALS_PER_ROW) * 100
		const yBackgroundPercent = row * 100
		cardDiv.style.backgroundPositionX = `-${xBackgroundPercent}%`
		cardDiv.style.backgroundPositionY = `-${yBackgroundPercent}%`
		cardDiv.style.backgroundSize = `${IMAGE_FESTIVALS_PER_ROW * 100}%`
	}
}
