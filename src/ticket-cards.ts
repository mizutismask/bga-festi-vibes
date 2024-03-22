// <reference path="../card-manager.ts"/>
class TicketCardsManager extends CardManager<TicketCard> {
	constructor(public game: FestivibesGame) {
		super(game, {
			animationManager: game.animationManager,
			getId: (card) => `festival-card-${card.id}`,
			setupDiv: (card: TicketCard, div: HTMLElement) => {
				div.classList.add('festival-card')
				div.dataset.cardId = '' + card.id
				div.dataset.cardType = '' + card.type
				div.style.position = 'relative'

				div.style.width = TICKET_CARD_WIDTH
				div.style.height = TICKET_CARD_HEIGHT
			},
			setupFrontDiv: (card: TicketCard, div: HTMLElement) => {
				this.setFrontBackground(div as HTMLDivElement, card.type_arg)
			},
			setupBackDiv: (card: TicketCard, div: HTMLElement) => {
				div.style.backgroundImage = `url('${g_gamethemeurl}img/festivibes-card-background.jpg')`
			}
		})
	}

	private setFrontBackground(cardDiv: HTMLDivElement, cardType: number) {
		const eventsUrl = `${g_gamethemeurl}img/ticketsCards.jpg`
		cardDiv.style.backgroundImage = `url('${eventsUrl}')`
		const imagePosition = cardType - 1
		const row = Math.floor(imagePosition / IMAGE_TICKETS_PER_ROW)
		const xBackgroundPercent = (imagePosition - row * IMAGE_TICKETS_PER_ROW) * 100
		const yBackgroundPercent = row * 100
		cardDiv.style.backgroundPositionX = `-${xBackgroundPercent}%`
		cardDiv.style.backgroundPositionY = `-${yBackgroundPercent}%`
		cardDiv.style.backgroundSize = `${IMAGE_TICKETS_PER_ROW*100}%`
	}
}
