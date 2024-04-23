// <reference path="../card-manager.ts"/>
const ACTION_SWAP_ANY_TICKETS = 'SWAP_ANY_TICKETS'
const ACTION_SWAP_MY_TICKET = 'SWAP_MY_TICKET'
const ACTION_REPLACE_TICKET = 'REPLACE_TICKET'
const ACTION_SWAP_EVENT = 'SWAP_EVENT'
const ACTION_DISCARD_EVENT = 'DISCARD_EVENT'
const ACTION_INC_FESTIVAL_SIZE = 'INC_FESTIVAL_SIZE'
const ACTION_SWAP_EVENT_WITH_HAND = 'SWAP_EVENT_WITH_HAND'
const NO_ACTION = 'NO_ACTION'

const ACTIONS = [
	ACTION_SWAP_ANY_TICKETS,
	ACTION_SWAP_MY_TICKET,
	ACTION_REPLACE_TICKET,
	ACTION_SWAP_EVENT,
	ACTION_DISCARD_EVENT,
	ACTION_INC_FESTIVAL_SIZE,
	ACTION_SWAP_EVENT_WITH_HAND
]

class EventCardsManager extends CardManager<EventCard> {
	constructor(public game: FestivibesGame) {
		super(game, {
			animationManager: game.animationManager,
			getId: (card) => `event-card-${card.id}`,
			setupDiv: (card: EventCard, div: HTMLElement) => {
				div.classList.add('event-card')
				div.dataset.cardId = '' + card.id
				div.dataset.cardType = '' + card.type
				div.style.position = 'relative'

				div.style.width = EVENT_CARD_WIDTH
				div.style.height = EVENT_CARD_HEIGHT
			},
			setupFrontDiv: (card: EventCard, div: HTMLElement) => {
				this.setFrontBackground(div as HTMLDivElement, card.type_arg)
				//this.setDivAsCard(div as HTMLDivElement, card.type);
				div.id = `${super.getId(card)}-front`

				//add help
				const helpId = `${super.getId(card)}-front-info`
				if (!$(helpId)) {
					const info: HTMLDivElement = document.createElement('div')
					info.id = helpId
					info.innerText = '?'
					info.classList.add('css-icon', 'card-info')
					div.appendChild(info)
					const cardTypeId = card.type * 100 + card.type_arg
					;(this.game as any).addTooltipHtml(info.id, this.getTooltip(card, cardTypeId))
				}
			},
			setupBackDiv: (card: EventCard, div: HTMLElement) => {
				//div.style.backgroundImage = `url('${g_gamethemeurl}img/festivibes-card-background.jpg')`
			}
		})
	}
	
	public getCardName(cardTypeId: number) {
		return 'todo'
	}
	/*
<div class="help-action-wrapper">
			<div id="xpd-city-${cardUniqueId}-zoom" class="xpd-city-zoom" style="${getBackgroundInlineStyleForEventCard(
			card
		)}"></div>
		*/
	public getTooltip(card: EventCard, cardUniqueId: number) {
		let tooltip = `
		<div class="tooltip-wrapper">
				<div class="">${dojo.string.substitute(_('Score: ${score} point(s)'), {
					score: card.points
				})}</div><br/>
				<div class="event-action ${card.action}"></div>
				<span>${this.game.actionHelps.get(card.action)}</span>
		</div>`
		return tooltip
	}

	private setFrontBackground(cardDiv: HTMLDivElement, cardType: number) {
		const eventsUrl = `${g_gamethemeurl}img/eventCards.jpg`
		cardDiv.style.backgroundImage = `url('${eventsUrl}')`
		const imagePosition = cardType - 1
		const row = Math.floor(imagePosition / IMAGE_EVENTS_PER_ROW)
		const xBackgroundPercent = (imagePosition - row * IMAGE_EVENTS_PER_ROW) * 100
		const yBackgroundPercent = row * 100
		cardDiv.style.backgroundPositionX = `-${xBackgroundPercent}%`
		cardDiv.style.backgroundPositionY = `-${yBackgroundPercent}%`
		cardDiv.style.backgroundSize = `${IMAGE_EVENTS_PER_ROW * 100}%`
	}
}
