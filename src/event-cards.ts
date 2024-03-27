// <reference path="../card-manager.ts"/>
const ACTION_SWAP_ANY_TICKETS = 'SWAP_ANY_TICKETS'
const ACTION_SWAP_MY_TICKET = 'SWAP_MY_TICKET'
const ACTION_REPLACE_TICKET = 'REPLACE_TICKET'
const ACTION_SWAP_EVENT = 'SWAP_EVENT'
const ACTION_DISCARD_EVENT = 'DISCARD_EVENT'
const ACTION_INC_FESTIVAL_SIZE = 'INC_FESTIVAL_SIZE'
const ACTION_SWAP_EVENT_WITH_HAND = 'SWAP_EVENT_WITH_HAND'
const NO_ACTION = 'NO_ACTION'

class EventCardsManager extends CardManager<EventCard> {
	actionHelps: Map<string, string>
	constructor(public game: FestivibesGame) {
		super(game, {
			animationManager: game.animationManager,
			getId: (card) => `event-card-${card.id}`,
			setupDiv: (card: EventCard, div: HTMLElement) => {
				div.classList.add('event-card')
				div.dataset.cardId = '' + card.id
				div.dataset.cardType = '' + card.type
				div.style.position = 'relative'

				div.style.width = FESTIVAL_CARD_WIDTH
				div.style.height = FESTIVAL_CARD_HEIGHT
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
		this.actionHelps = this.initActionHelps()
	}

	public initActionHelps() {
		const map = new Map<string, string>()
		map.set(
			ACTION_DISCARD_EVENT,
			_(
				'Place this card in the column of your choice, then replace and discard the Event card of your choice from that column.'
			)
		)
		map.set(
			ACTION_INC_FESTIVAL_SIZE,
			_(
				'This card increases the Event card limit by one in whichever column it is used, for as long as it stays there.'
			)
		)
		map.set(
			ACTION_REPLACE_TICKET,
			_(
				'Replace another player’s Ticket card in this column with one of your own that has not yet been played. The removed Ticket card is placed in another open spot chosen by the other player. <bold>If it is their last card played, two points are taken from their final score.</bold>'
			)
		)
		map.set(
			ACTION_SWAP_ANY_TICKETS,
			_(
				'Swap one Ticket card from this column, whether it is one of your own or from an opposing player, with a Ticket card taken from another Festival column, whether it belongs to you or not.'
			)
		)
		map.set(
			ACTION_SWAP_EVENT,
			_(
				'Place this card in the column of your choice, then select another Event card from that column and swap it with one from a different column.'
			)
		)
		map.set(
			ACTION_SWAP_EVENT_WITH_HAND,
			_(
				'Place this card in the column of your choice, then select another Event card from that column and swap it with one from your hand.'
			)
		)
		map.set(
			ACTION_SWAP_MY_TICKET,
			_('Swap one of your Ticket cards from this column with another player’s Ticket card from another column.')
		)
		map.set(NO_ACTION, _('This card has no action.'))
		return map
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
		
			<div class="xpd-city-zoom-desc-wrapper">
				<div class="xpd-city">${this.actionHelps.get(card.action)}</div>
			</div>
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
