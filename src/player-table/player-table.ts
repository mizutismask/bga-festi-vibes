/**
 * Player table.
 */
class PlayerTable {
    private handStock: LineStock<FestivibesCard>

    constructor(private game: FestivibesGame, player: FestivibesPlayer) {
        const isMyTable = player.id === game.getPlayerId().toString();
        const ownClass = isMyTable ? 'own' : ''
        let html = `
			<a id="anchor-player-${player.id}"></a>
            <div id="player-table-${player.id}" class="player-order${player.playerNo} player-table ${ownClass}">
			    <span class="player-name">${player.name}</span>
            </div>
        `;
        dojo.place(html, 'player-tables');

        if (isMyTable) {
			const handHtml = `
			<div id="hand-${player.id}" class="nml-player-hand"></div>
        `
			dojo.place(handHtml, `player-table-${player.id}`, 'first')
			this.initHand(player)
		}
    }

    private initHand(player: FestivibesPlayer) {
		const smallWidth = window.matchMedia('(max-width: 830px)').matches
		var baseSettings = {
			center: true,
			gap: '10px'
		}
		if (smallWidth) {
			baseSettings['direction'] = 'row' as 'row'
			baseSettings['wrap'] = 'nowrap' as 'nowrap'
		} else {
			baseSettings['direction'] = 'col' as 'col'
			baseSettings['wrap'] = 'wrap' as 'wrap'
		}

		//console.log('smallWidth', smallWidth, baseSettings)

		this.handStock = new LineStock<FestivibesCard>(
			this.game.FestivalCardsManager,
			$('hand-' + player.id),
			baseSettings
		)
		this.handStock.setSelectionMode('single')
	}
}
