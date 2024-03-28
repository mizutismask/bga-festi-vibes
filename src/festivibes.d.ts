/**
 * Your game interfaces
 */
declare const define
declare const ebg
declare const $
declare const dojo: Dojo
declare const _
declare const g_gamethemeurl

// remove this if you don't use cards. If you do, make sure the types are correct . By default, some number are send as string, I suggest to cast to right type in PHP.
interface Card {
	id: number
	location: string
	location_arg: number
	type: number
	type_arg: number
}
interface FestivalCard extends Card {
	cardsCount: number
}
interface EventCard extends Card {
	action: string
}
interface TicketCard extends Card {}

interface FestivibesPlayer extends Player {
	playerNo: number
	usedTicketsCount: number
}

interface FestivibesGamedatas {
	current_player_id: string
	decision: { decision_type: string }
	game_result_neutralized: string
	gamestate: Gamestate
	gamestates: { [gamestateId: number]: Gamestate }
	neutralized_player_id: string
	notifications: { last_packet_id: string; move_nbr: string }
	playerorder: (string | number)[]
	playerOrderWorkingWithSpectators: number[] //starting with current player
	players: { [playerId: number]: FestivibesPlayer }
	tablespeed: string
	lastTurn: boolean
	turnOrderClockwise: boolean
	// counters
	winners: number[]
	version: string
	festivals: Array<FestivalCard>
	soldOutfestivals: Array<FestivalCard>
	tickets: { [festivalId: number]: Array<TicketCard> }
	events: { [festivalId: number]: Array<EventCard> }
	hand: Array<EventCard>
	// Add here variables you set up in getAllDatas
}

interface FestivibesGame extends Game {
	festivalCardsManager: FestivalCardsManager
	eventCardsManager: EventCardsManager
	animationManager: AnimationManager
	getZoom(): number
	getCurrentPlayer(): FestivibesPlayer
	getPlayerId(): number
	setTooltip(id: string, html: string): void
	setTooltipToClass(className: string, html: string): void
	clientActionData: ClientActionData
	resetClientActionData(): void
}

interface EnteringChooseActionArgs {
	canPass: boolean
}

interface DiscardEventActionArgs {
	selectableCardsByFestival: { [festivalId: number]: Array<EventCard> }
}

interface SwapEventsActionArgs {
	selectableCardsByFestival: { [festivalId: number]: Array<EventCard> }
	mandatoryCardAmong: Array<EventCard>
	mandatoryFestivalId: number
}

interface SwapEventsWithHandActionArgs {
	mandatoryCardAmong: Array<EventCard>
	mandatoryFestivalId: number
}

interface SwapTicketsActionArgs {
	selectableCardsByFestival: { [festivalId: number]: Array<TicketCard> }
	mandatoryCardAmong: Array<TicketCard>
	mandatoryFestivalId: number
	swapMyTicket: boolean
}

interface ReplaceTicketActionArgs {
	mandatoryCardAmong: Array<TicketCard>
	mandatoryFestivalId: number
}

interface NotifPointsArgs {
	playerId: number
	points: number
	delta: number
	scoreType: string
}

interface NotifScoreArgs {
	playerId: number
	score: number
	scoreType: string
}

interface NotifWinnerArgs {
	playerId: number
}

interface NotifScorePointArgs {
	playerId: number
	points: number
}

interface NotifMaterialMove {
	type: 'EVENT' | 'TICKET' | 'FESTIVAL'
	from: 'HAND' | 'DECK' | 'FESTIVAL'
	to: 'HAND' | 'DECK' | 'FESTIVAL'
	fromArg: number
	toArg: number
	material: Array<any | string> //elements (cards for exemple), or tokenIds
}

interface ClientActionData {
	placedCardId: string
	destinationSquare: string
	previousCardParentInHand: HTMLElement
}
