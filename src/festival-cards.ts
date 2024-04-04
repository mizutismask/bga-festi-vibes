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
				this.setBackground(
					div as HTMLDivElement,
					card.type_arg,
					`${g_gamethemeurl}img/smallFestivalCardsFront.jpg`,IMAGE_FESTIVALS_PER_ROW
				)
			},
			setupBackDiv: (card: FestivalCard, div: HTMLElement) => {
				this.setBackground(div as HTMLDivElement, 1, `${g_gamethemeurl}img/smallFestivalCardsBack.jpg`,1)
			}
		})
	}

	private setBackground(cardDiv: HTMLDivElement, cardType: number, eventsUrl: string, imagesPerRow:number) {
		cardDiv.style.backgroundImage = `url('${eventsUrl}')`
		const imagePosition = cardType - 1
		const row = Math.floor(imagePosition / imagesPerRow)
		const xBackgroundPercent = (imagePosition - row * imagesPerRow) * 100
		const yBackgroundPercent = row * 100
		cardDiv.style.backgroundPositionX = `-${xBackgroundPercent}%`
		cardDiv.style.backgroundPositionY = `-${yBackgroundPercent}%`
		cardDiv.style.backgroundSize = `${imagesPerRow * 100}%`
	}
}
