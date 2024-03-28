/**
 * Player table.
 */
class PlayerTable {
	private handStock: LineStock<EventCard>

	constructor(private game: FestivibesGame, player: FestivibesPlayer, cards: Array<EventCard>) {
		const isMyTable = player.id === game.getPlayerId().toString()
		const ownClass = isMyTable ? 'own' : ''
		let html = `
			<a id="anchor-player-${player.id}"></a>
            <div id="player-table-${player.id}" class="player-order${player.playerNo} player-table ${ownClass}">
            </div>
        `
		dojo.place(html, 'player-tables')

		if (isMyTable) {
			const handHtml = `
			<div id="hand-${player.id}" class="nml-player-hand"></div>
        `
			dojo.place(handHtml, `player-table-${player.id}`, 'first')
			this.initHand(player, cards)
		}
	}

	private initHand(player: FestivibesPlayer, cards: Array<EventCard>) {
		const smallWidth = window.matchMedia('(max-width: 1120px)').matches
		var baseSettings = {
			center: true,
			gap: '10px'
		}
		if (smallWidth) {
			baseSettings['direction'] = 'row' as 'row'
			baseSettings['wrap'] = 'nowrap' as 'nowrap'
		} else {
			baseSettings['direction'] = 'column' as 'column'
			baseSettings['wrap'] = 'wrap' as 'wrap'
		}

		//log('smallWidth', smallWidth, baseSettings)

		this.handStock = new LineStock<EventCard>(this.game.eventCardsManager, $('hand-' + player.id), baseSettings)
		this.handStock.setSelectionMode('single')
		this.handStock.addCards(cards)
	}

	public getSelection() {
		return this.handStock.getSelection();
	}

	public addCard(card: EventCard) {
		this.handStock.addCard(card)
	}
}
