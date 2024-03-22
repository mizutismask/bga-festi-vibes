/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * Festivibes implementation : © Séverine Kamycki <mizutismask@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * festivibes.ts
 *
 * Festivibes user interface script
 *
 * In this file, you are describing the logic of your user interface, in Typescript language.
 *
 */
const ANIMATION_MS = 500
const SCORE_MS = 1500
const IMAGE_FESTIVALS_PER_ROW = 6
const IMAGE_EVENTS_PER_ROW = 13
const IMAGE_TICKETS_PER_ROW = 4

const isDebug = window.location.host == 'studio.boardgamearena.com'
const log = isDebug ? console.log.bind(window.console) : function () {}

class Festivibes implements FestivibesGame {
	private gameFeatures: GameFeatureConfig
	private gamedatas: FestivibesGamedatas
	private player_id: string
	private players: { [playerId: number]: Player }
	private playerTables: { [playerId: number]: PlayerTable } = []
	private playerNumber: number
	public FestivalCardsManager: FestivalCardsManager
	private originalTextChooseAction: string

	public map: TtrMap
	private scoreBoard: ScoreBoard
	private ticketsCounters: Counter[] = []

	private animations: FestivibesAnimation[] = []
	public animationManager: AnimationManager
	private actionTimerId = null
	private isTouch = window.matchMedia('(hover: none)').matches
	private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined
	private settings = [new Setting('customSounds', 'pref', 1)]
	public clientActionData: ClientActionData
	private festivalStocks: { [festId: number]: LineStock<FestivalCard> } = []

	constructor() {
		console.log('festivibes constructor')

		// Here, you can init the global variables of your user interface
		// Example:
		// this.myGlobalValue = 0;
	}

	/*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */

	public setup(gamedatas: any) {
		log('Starting game setup')
		this.gameFeatures = new GameFeatureConfig()
		this.gamedatas = gamedatas
		log('gamedatas', gamedatas)

		this.map = new TtrMap(this)

		this.FestivalCardsManager = new FestivalCardsManager(this)
		this.animationManager = new AnimationManager(this)

		if (gamedatas.lastTurn) {
			this.notif_lastTurn(false)
		}
		if (Number(gamedatas.gamestate.id) >= 90) {
			// score or end
			this.onEnteringEndScore()
		}
		this.setupNotifications()

		Object.values(this.gamedatas.playerOrderWorkingWithSpectators).forEach((p) => {
			this.setupPlayer(this.gamedatas.players[p])
		})

		$('overall-content').classList.add(`player-count-${this.getPlayersCount()}`)

		this.setupSettingsIconInMainBar()
		this.setupPreferences()
		this.setupTooltips()
		;(this as any).onScreenWidthChange = () => this.map.setAutoZoom()

		this.scoreBoard = new ScoreBoard(this, Object.values(this.gamedatas.players))
		this.gamedatas.scores?.forEach((s) => this.scoreBoard.updateScore(s.playerId, s.scoreType, s.score))
		if (this.gamedatas.winners) {
			this.gamedatas.winners.forEach((pId) => this.scoreBoard.highlightWinnerScore(pId))
		}
		removeClass('animatedScore')

		this.setupFestivals(this.gamedatas.festivals)
		console.log('Ending game setup')
	}

	private setupFestivals(festivals: Array<FestivalCard>) {
		festivals.forEach((fest) => {
			const divId = 'festival-' + fest.id
			dojo.place(this.createDiv('', divId), 'festivals')

			this.festivalStocks[fest.id] = new SlotStock<FestivalCard>(this.FestivalCardsManager, $(divId), {
				center: true,
				gap: '7px',
				direction: 'row',
				wrap: 'nowrap',
				slotsIds: ['slot1'],
				mapCardToSlot: (card) => `slot${1}`
			})
			this.festivalStocks[fest.id].addCard(fest)
		})
	}

	private setupTooltips() {
		//todo change counter names
		this.setTooltipToClass('revealed-tokens-back-counter', _('counter1 tooltip'))
		this.setTooltipToClass('tickets-counter', _('counter2 tooltip'))

		this.setTooltipToClass('xpd-help-icon', `<div class="help-card recto"></div>`)
		this.setTooltipToClass('xpd-help-icon-mini', `<div class="help-card verso"></div>`)
		this.setTooltipToClass('player-turn-order', _('First player'))
	}

	private setupPlayer(player: FestivibesPlayer) {
		document.getElementById(`overall_player_board_${player.id}`).dataset.playerColor = player.color
		if (this.gameFeatures.showPlayerOrderHints) {
			this.setupPlayerOrderHints(player)
		}
		if (this.isNotSpectator()) {
			this.setupMiniPlayerBoard(player)
		}
		this.playerTables[player.id] = new PlayerTable(this, player)
	}

	private setupMiniPlayerBoard(player: FestivibesPlayer) {
		const playerId = Number(player.id)
		dojo.place(
			`<div class="counters">
                    <div id="tickets-counter-${player.id}-wrapper" class="counter tickets-counter">
                        <div class="icon expTicket"></div> 
                        <span id="tickets-counter-${player.id}"></span>
                    </div>
                
                    <div id="revealed-tokens-back-counter-${player.id}-wrapper" class="counter revealed-tokens-back-counter">
                        <div class="icon token" data-player-color="${player.color}"></div> 
                        <span id="revealed-tokens-back-counter-${player.id}"></span> / 4
                    </div>
				</div>
				<div id="additional-info-${player.id}" class="counters additional-info">
					<div id="additional-icons-${player.id}" class="additional-icons"></div> 
				</div>
				`,
			`player_board_${player.id}`
		)

		/* const revealedTokensBackCounter = new ebg.counter();
            revealedTokensBackCounter.create(`revealed-tokens-back-counter-${player.id}`);
            revealedTokensBackCounter.setValue(player.revealedTokensBackCount);
            this.revealedTokensBackCounters[playerId] = revealedTokensBackCounter;

            const ticketsCounter = new ebg.counter();
            ticketsCounter.create(`tickets-counter-${player.id}`);
            ticketsCounter.setValue(player.ticketsCount);
            this.ticketsCounters[playerId] = ticketsCounter;*/

		if (this.gameFeatures.showPlayerHelp && this.getPlayerId() === playerId) {
			//help
			dojo.place(`<div id="player-help" class="css-icon xpd-help-icon">?</div>`, `additional-icons-${player.id}`)
		}

		if (this.gameFeatures.showFirstPlayer && player.playerNo === 1) {
			dojo.place(
				`<div id="firstPlayerIcon" class="css-icon player-turn-order">1</div>`,
				`additional-icons-${player.id}`,
				`last`
			)
		}

		if (this.gameFeatures.spyOnOtherPlayerBoard && this.getPlayerId() !== playerId) {
			//spy on other player
			dojo.place(
				`
            <div class="show-player-tableau"><a href="#anchor-player-${player.id}" classes="inherit-color">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85.333343 145.79321">
                    <path fill="currentColor" d="M 1.6,144.19321 C 0.72,143.31321 0,141.90343 0,141.06039 0,140.21734 5.019,125.35234 11.15333,108.02704 L 22.30665,76.526514 14.626511,68.826524 C 8.70498,62.889705 6.45637,59.468243 4.80652,53.884537 0.057,37.810464 3.28288,23.775161 14.266011,12.727735 23.2699,3.6711383 31.24961,0.09115725 42.633001,0.00129225 c 15.633879,-0.123414 29.7242,8.60107205 36.66277,22.70098475 8.00349,16.263927 4.02641,36.419057 -9.54327,48.363567 l -6.09937,5.36888 10.8401,30.526466 c 5.96206,16.78955 10.84011,32.03102 10.84011,33.86992 0,1.8389 -0.94908,3.70766 -2.10905,4.15278 -1.15998,0.44513 -19.63998,0.80932 -41.06667,0.80932 -28.52259,0 -39.386191,-0.42858 -40.557621,-1.6 z M 58.000011,54.483815 c 3.66666,-1.775301 9.06666,-5.706124 11.99999,-8.735161 l 5.33334,-5.507342 -6.66667,-6.09345 C 59.791321,26.035633 53.218971,23.191944 43.2618,23.15582 33.50202,23.12041 24.44122,27.164681 16.83985,34.94919 c -4.926849,5.045548 -5.023849,5.323672 -2.956989,8.478106 3.741259,5.709878 15.032709,12.667218 24.11715,14.860013 4.67992,1.129637 13.130429,-0.477436 20,-3.803494 z m -22.33337,-2.130758 c -2.8907,-1.683676 -6.3333,-8.148479 -6.3333,-11.893186 0,-11.58942 14.57544,-17.629692 22.76923,-9.435897 8.41012,8.410121 2.7035,22.821681 -9,22.728685 -2.80641,-0.0223 -6.15258,-0.652121 -7.43593,-1.399602 z m 14.6667,-6.075289 c 3.72801,-4.100734 3.78941,-7.121364 0.23656,-11.638085 -2.025061,-2.574448 -3.9845,-3.513145 -7.33333,-3.513145 -10.93129,0 -13.70837,13.126529 -3.90323,18.44946 3.50764,1.904196 7.30574,0.765377 11,-3.29823 z m -11.36999,0.106494 c -3.74071,-2.620092 -4.07008,-7.297494 -0.44716,-6.350078 3.2022,0.837394 4.87543,-1.760912 2.76868,-4.29939 -1.34051,-1.615208 -1.02878,-1.94159 1.85447,-1.94159 4.67573,0 8.31873,5.36324 6.2582,9.213366 -1.21644,2.27295 -5.30653,5.453301 -7.0132,5.453301 -0.25171,0 -1.79115,-0.934022 -3.42099,-2.075605 z"></path>
                </svg>
                </a>
            </div>
            `,
				`additional-icons-${player.id}`
			)
		}
	}

	public setupPlayerOrderHints(player: FestivibesPlayer) {
		const nameDiv: HTMLElement = document.querySelector('#player_name_' + player.id + ' a')
		const surroundingPlayers = this.getSurroundingPlayersIds(player)
		const previousId = this.gamedatas.turnOrderClockwise ? surroundingPlayers[0] : surroundingPlayers[1]
		const nextId = this.gamedatas.turnOrderClockwise ? surroundingPlayers[1] : surroundingPlayers[0]

		this.updatePlayerHint(player, previousId, '_previous_player', _('Previous player: '), '&lt;', nameDiv, 'before')
		this.updatePlayerHint(player, nextId, '_next_player', _('Next player: '), '&gt;', nameDiv, 'after')
	}

	public updatePlayerHint(
		currentPlayer: FestivibesPlayer,
		otherPlayerId: string | number,
		divSuffix: string,
		titlePrefix: string,
		content: string,
		parentDivId: HTMLElement,
		location: string
	) {
		if (!$(currentPlayer.id + divSuffix)) {
			dojo.create(
				'span',
				{
					id: currentPlayer.id + divSuffix,
					class: 'playerOrderHelp',
					title: titlePrefix + this.gamedatas.players[otherPlayerId].name,
					style: 'color:#' + this.gamedatas.players[otherPlayerId]['color'] + ';',
					innerHTML: content
				},
				parentDivId,
				location
			)
		}
	}

	///////////////////////////////////////////////////
	//// Game & client states

	// onEnteringState: this method is called each time we are entering into a new game state.
	//                  You can use this method to perform some user interface changes at this moment.
	//
	public onEnteringState(stateName: string, args: any) {
		console.log('Entering state: ' + stateName)

		switch (stateName) {
			case 'chooseAction':
				if (args?.args) {
					const dataArgs = args.args as EnteringChooseActionArgs
					this.onEnteringChooseAction(dataArgs)
				}
				break
		}
		if (this.gameFeatures.spyOnActivePlayerInGeneralActions) {
			this.addArrowsToActivePlayer(args)
		}
	}

	private onEnteringChooseAction(args: EnteringChooseActionArgs) {
		//todo
	}

	/**
	 * Show score board.
	 */
	private onEnteringEndScore() {
		const lastTurnBar = document.getElementById('last-round')
		if (lastTurnBar) {
			lastTurnBar.style.display = 'none'
		}

		document.getElementById('score').style.display = 'flex'
	}

	// onLeavingState: this method is called each time we are leaving a game state.
	//                 You can use this method to perform some user interface changes at this moment.
	//
	public onLeavingState(stateName: string) {
		console.log('Leaving state: ' + stateName)

		switch (stateName) {
			/* Example:
        
        case 'myGameState':
        
            // Hide the HTML block we are displaying only during this game state
            dojo.style( 'my_html_block_id', 'display', 'none' );
            
            break;
        */

			case 'dummmy':
				break
		}
	}

	// onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
	//                        action status bar (ie: the HTML links in the status bar).
	//
	public onUpdateActionButtons(stateName: string, args: any) {
		console.log('onUpdateActionButtons: ' + stateName)

		if ((this as any).isCurrentPlayerActive()) {
			switch (
				stateName
				/*               
                Example:

                case 'myGameState':
                
                // Add 3 action buttons in the action status bar:
                
                (this as any).addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' ); 
                (this as any).addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' ); 
                (this as any).addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' ); 
                break;
*/
			) {
			}
		}
	}

	///////////////////////////////////////////////////
	//// Utility methods
	public resetClientActionData() {
		this.clientActionData = {
			placedCardId: undefined,
			destinationSquare: undefined,
			previousCardParentInHand: undefined
		}
	}
	public addArrowsToActivePlayer(state: Gamestate) {
		const notUsefulStates = ['todo']
		if (
			state.type === 'activeplayer' &&
			state.active_player !== this.player_id &&
			!notUsefulStates.includes(state.name)
		) {
			if (!$('goToCurrentPlayer')) {
				dojo.place(
					`
                    <div id="goToCurrentPlayer" class="show-player-tableau">
                        <a href="#anchor-player-${state.active_player}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85.333343 145.79321">
                                <path fill="currentColor" d="M 1.6,144.19321 C 0.72,143.31321 0,141.90343 0,141.06039 0,140.21734 5.019,125.35234 11.15333,108.02704 L 22.30665,76.526514 14.626511,68.826524 C 8.70498,62.889705 6.45637,59.468243 4.80652,53.884537 0.057,37.810464 3.28288,23.775161 14.266011,12.727735 23.2699,3.6711383 31.24961,0.09115725 42.633001,0.00129225 c 15.633879,-0.123414 29.7242,8.60107205 36.66277,22.70098475 8.00349,16.263927 4.02641,36.419057 -9.54327,48.363567 l -6.09937,5.36888 10.8401,30.526466 c 5.96206,16.78955 10.84011,32.03102 10.84011,33.86992 0,1.8389 -0.94908,3.70766 -2.10905,4.15278 -1.15998,0.44513 -19.63998,0.80932 -41.06667,0.80932 -28.52259,0 -39.386191,-0.42858 -40.557621,-1.6 z M 58.000011,54.483815 c 3.66666,-1.775301 9.06666,-5.706124 11.99999,-8.735161 l 5.33334,-5.507342 -6.66667,-6.09345 C 59.791321,26.035633 53.218971,23.191944 43.2618,23.15582 33.50202,23.12041 24.44122,27.164681 16.83985,34.94919 c -4.926849,5.045548 -5.023849,5.323672 -2.956989,8.478106 3.741259,5.709878 15.032709,12.667218 24.11715,14.860013 4.67992,1.129637 13.130429,-0.477436 20,-3.803494 z m -22.33337,-2.130758 c -2.8907,-1.683676 -6.3333,-8.148479 -6.3333,-11.893186 0,-11.58942 14.57544,-17.629692 22.76923,-9.435897 8.41012,8.410121 2.7035,22.821681 -9,22.728685 -2.80641,-0.0223 -6.15258,-0.652121 -7.43593,-1.399602 z m 14.6667,-6.075289 c 3.72801,-4.100734 3.78941,-7.121364 0.23656,-11.638085 -2.025061,-2.574448 -3.9845,-3.513145 -7.33333,-3.513145 -10.93129,0 -13.70837,13.126529 -3.90323,18.44946 3.50764,1.904196 7.30574,0.765377 11,-3.29823 z m -11.36999,0.106494 c -3.74071,-2.620092 -4.07008,-7.297494 -0.44716,-6.350078 3.2022,0.837394 4.87543,-1.760912 2.76868,-4.29939 -1.34051,-1.615208 -1.02878,-1.94159 1.85447,-1.94159 4.67573,0 8.31873,5.36324 6.2582,9.213366 -1.21644,2.27295 -5.30653,5.453301 -7.0132,5.453301 -0.25171,0 -1.79115,-0.934022 -3.42099,-2.075605 z"></path>
                            </svg>
                        </a>
                    </div>
                    `,
					'generalactions',
					'last'
				)
			}
			if (!$('goBackUp')) {
				dojo.place(
					`
                    <div id="goBackUp" class="show-player-tableau">
                        <a href="#">
                            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="1280.000000pt" height="1280.000000pt" viewBox="0 0 1280.000000 1280.000000" preserveAspectRatio="xMidYMid meet">
                                <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                fill="currentColor" stroke="none">
                                <path d="M6305 12787 c-74 -19 -152 -65 -197 -117 -30 -34 -786 -1537 -3070
                                -6105 -2924 -5849 -3029 -6062 -3035 -6126 -15 -173 76 -326 237 -403 59 -27
                                74 -30 160 -30 79 1 104 5 150 26 30 13 1359 894 2953 1956 l2897 1932 2897
                                -1932 c1594 -1062 2923 -1943 2953 -1957 47 -21 70 -25 150 -25 86 0 101 3
                                160 30 36 17 86 50 111 72 88 79 140 223 124 347 -6 51 -383 811 -3040 6125
                                -2901 5801 -3036 6069 -3082 6110 -100 90 -246 128 -368 97z"/>
                                </g>
                            </svg>
                        </a>
                    </div>
                    `,
					'generalactions',
					'last'
				)
			}
		}
	}

	/** Tells if seasons custom sounds are active in user prefs. */
	public isCustomSoundsOn(): boolean {
		return (this as any).prefs[1].value == 1
	}

	/*
	 * Play a given sound that should be first added in the tpl file
	 */
	public playCustomSound(sound: string, playNextMoveSound = true) {
		if (this.isCustomSoundsOn()) {
			playSound(sound)
			playNextMoveSound && (this as any).disableNextMoveSound()
		}
	}

	/**
	 * Gets the player ids of the previous and the next player regarding the player given in parameter
	 * @param player
	 * @returns an array with the previous player at 0 and the next player at 1
	 */
	public getSurroundingPlayersIds(player: FestivibesPlayer) {
		let playerIndex = this.gamedatas.playerorder.indexOf(parseInt(player.id)) //playerorder is a mixed types array
		if (playerIndex == -1) playerIndex = this.gamedatas.playerorder.indexOf(player.id)

		const previousId =
			playerIndex - 1 < 0
				? this.gamedatas.playerorder[this.gamedatas.playerorder.length - 1]
				: this.gamedatas.playerorder[playerIndex - 1]
		const nextId =
			playerIndex + 1 >= this.gamedatas.playerorder.length
				? this.gamedatas.playerorder[0]
				: this.gamedatas.playerorder[playerIndex + 1]

		return [previousId, nextId]
	}
	/**
	 * This method can be used instead of addActionButton, to add a button which is an image (i.e. resource). Can be useful when player
	 * need to make a choice of resources or tokens.
	 */
	public addImageActionButton(
		id: string,
		div: string,
		color: string = 'gray',
		tooltip: string,
		handler,
		parentClass: string = ''
	) {
		// this will actually make a transparent button
		;(this as any).addActionButton(id, div, handler, '', false, color)
		// remove boarder, for images it better without
		dojo.style(id, 'border', 'none')
		// but add shadow style (box-shadow, see css)
		dojo.addClass(id, 'shadow bgaimagebutton ' + parentClass)
		// you can also add addition styles, such as background
		if (tooltip) dojo.attr(id, 'title', tooltip)
		return $(id)
	}

	public createDiv(classes: string, id: string = '', value: string = '') {
		if (typeof value == 'undefined') value = ''
		const node: HTMLElement = dojo.create('div', { class: classes, innerHTML: value })
		if (id) node.id = id
		return node.outerHTML
	}

	public groupBy<T>(arr: T[], fn: (item: T) => any) {
		return arr.reduce<Record<string, T[]>>((prev, curr) => {
			const groupKey = fn(curr)
			const group = prev[groupKey] || []
			group.push(curr)
			return { ...prev, [groupKey]: group }
		}, {})
	}

	public setTooltip(id: string, html: string) {
		;(this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY)
	}
	public setTooltipToClass(className: string, html: string) {
		;(this as any).addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY)
	}

	public isNotSpectator() {
		//console.log('isSpectator', (this as any).isSpectator)
		return (
			(this as any).isSpectator == false ||
			Object.keys(this.gamedatas.players).includes(this.getPlayerId().toString())
		)
	}

	private setGamestateDescription(property: string = '') {
		const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id]
		this.gamedatas.gamestate.description = originalState['description' + property]
		this.gamedatas.gamestate.descriptionmyturn = originalState['descriptionmyturn' + property]
		;(this as any).updatePageTitle()
	}

	/**
	 * Handle user preferences changes.
	 */
	private setupPreferences() {
		// Extract the ID and value from the UI control
		const onchange = (e) => {
			const match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/)
			if (!match) {
				return
			}
			let prefId = +match[1]
			let prefValue = +e.target.value
			;(this as any).prefs[prefId].value = prefValue
			this.onPreferenceChange(prefId, prefValue)
		}

		// Call onPreferenceChange() when any value changes
		dojo.query('.preference_control').connect('onchange', onchange)

		// Call onPreferenceChange() now
		dojo.forEach(dojo.query('#ingame_menu_content .preference_control'), (el) => onchange({ target: el }))
	}

	/**
	 * Handle user preferences changes.
	 */
	private onPreferenceChange(prefId: number, prefValue: number) {
		switch (prefId) {
		}
	}

	private setupSettingsIconInMainBar() {
		dojo.place(
			`
            <div class='upperrightmenu_item' id="player_board_config">
                <div id="player_config">
                    <div id="player_config_row">
                    <div id="show-settings">
                        <svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                        <g>
                            <path class="fa-secondary" fill="currentColor" d="M638.41 387a12.34 12.34 0 0 0-12.2-10.3h-16.5a86.33 86.33 0 0 0-15.9-27.4L602 335a12.42 12.42 0 0 0-2.8-15.7 110.5 110.5 0 0 0-32.1-18.6 12.36 12.36 0 0 0-15.1 5.4l-8.2 14.3a88.86 88.86 0 0 0-31.7 0l-8.2-14.3a12.36 12.36 0 0 0-15.1-5.4 111.83 111.83 0 0 0-32.1 18.6 12.3 12.3 0 0 0-2.8 15.7l8.2 14.3a86.33 86.33 0 0 0-15.9 27.4h-16.5a12.43 12.43 0 0 0-12.2 10.4 112.66 112.66 0 0 0 0 37.1 12.34 12.34 0 0 0 12.2 10.3h16.5a86.33 86.33 0 0 0 15.9 27.4l-8.2 14.3a12.42 12.42 0 0 0 2.8 15.7 110.5 110.5 0 0 0 32.1 18.6 12.36 12.36 0 0 0 15.1-5.4l8.2-14.3a88.86 88.86 0 0 0 31.7 0l8.2 14.3a12.36 12.36 0 0 0 15.1 5.4 111.83 111.83 0 0 0 32.1-18.6 12.3 12.3 0 0 0 2.8-15.7l-8.2-14.3a86.33 86.33 0 0 0 15.9-27.4h16.5a12.43 12.43 0 0 0 12.2-10.4 112.66 112.66 0 0 0 .01-37.1zm-136.8 44.9c-29.6-38.5 14.3-82.4 52.8-52.8 29.59 38.49-14.3 82.39-52.8 52.79zm136.8-343.8a12.34 12.34 0 0 0-12.2-10.3h-16.5a86.33 86.33 0 0 0-15.9-27.4l8.2-14.3a12.42 12.42 0 0 0-2.8-15.7 110.5 110.5 0 0 0-32.1-18.6A12.36 12.36 0 0 0 552 7.19l-8.2 14.3a88.86 88.86 0 0 0-31.7 0l-8.2-14.3a12.36 12.36 0 0 0-15.1-5.4 111.83 111.83 0 0 0-32.1 18.6 12.3 12.3 0 0 0-2.8 15.7l8.2 14.3a86.33 86.33 0 0 0-15.9 27.4h-16.5a12.43 12.43 0 0 0-12.2 10.4 112.66 112.66 0 0 0 0 37.1 12.34 12.34 0 0 0 12.2 10.3h16.5a86.33 86.33 0 0 0 15.9 27.4l-8.2 14.3a12.42 12.42 0 0 0 2.8 15.7 110.5 110.5 0 0 0 32.1 18.6 12.36 12.36 0 0 0 15.1-5.4l8.2-14.3a88.86 88.86 0 0 0 31.7 0l8.2 14.3a12.36 12.36 0 0 0 15.1 5.4 111.83 111.83 0 0 0 32.1-18.6 12.3 12.3 0 0 0 2.8-15.7l-8.2-14.3a86.33 86.33 0 0 0 15.9-27.4h16.5a12.43 12.43 0 0 0 12.2-10.4 112.66 112.66 0 0 0 .01-37.1zm-136.8 45c-29.6-38.5 14.3-82.5 52.8-52.8 29.59 38.49-14.3 82.39-52.8 52.79z" opacity="0.4"></path>
                            <path class="fa-primary" fill="currentColor" d="M420 303.79L386.31 287a173.78 173.78 0 0 0 0-63.5l33.7-16.8c10.1-5.9 14-18.2 10-29.1-8.9-24.2-25.9-46.4-42.1-65.8a23.93 23.93 0 0 0-30.3-5.3l-29.1 16.8a173.66 173.66 0 0 0-54.9-31.7V58a24 24 0 0 0-20-23.6 228.06 228.06 0 0 0-76 .1A23.82 23.82 0 0 0 158 58v33.7a171.78 171.78 0 0 0-54.9 31.7L74 106.59a23.91 23.91 0 0 0-30.3 5.3c-16.2 19.4-33.3 41.6-42.2 65.8a23.84 23.84 0 0 0 10.5 29l33.3 16.9a173.24 173.24 0 0 0 0 63.4L12 303.79a24.13 24.13 0 0 0-10.5 29.1c8.9 24.1 26 46.3 42.2 65.7a23.93 23.93 0 0 0 30.3 5.3l29.1-16.7a173.66 173.66 0 0 0 54.9 31.7v33.6a24 24 0 0 0 20 23.6 224.88 224.88 0 0 0 75.9 0 23.93 23.93 0 0 0 19.7-23.6v-33.6a171.78 171.78 0 0 0 54.9-31.7l29.1 16.8a23.91 23.91 0 0 0 30.3-5.3c16.2-19.4 33.7-41.6 42.6-65.8a24 24 0 0 0-10.5-29.1zm-151.3 4.3c-77 59.2-164.9-28.7-105.7-105.7 77-59.2 164.91 28.7 105.71 105.7z"></path>
                        </g>
                        </svg>
                    </div>
                    </div>
                    <div class='settingsControlsHidden' id="settings-controls-container"></div>
                </div>
            </div>
        `,
			'upperrightmenu',
			'first'
		)

		dojo.connect($('show-settings'), 'onclick', () => this.toggleSettings())
		this.setTooltip('show-settings', _('Display some settings about the game.'))
		let container = $('settings-controls-container')

		this.settings.forEach((setting) => {
			if (setting.type == 'pref') {
				// Pref type => just move the user pref around
				dojo.place($('preference_control_' + setting.prefId).parentNode.parentNode, container)
			}
		})
	}

	private toggleSettings() {
		dojo.toggleClass('settings-controls-container', 'settingsControlsHidden')

		// Hacking BGA framework
		if (dojo.hasClass('ebd-body', 'mobile_version')) {
			dojo.query('.player-board').forEach((elt) => {
				if (elt.style.height != 'auto') {
					dojo.style(elt, 'min-height', elt.style.height)
					elt.style.height = 'auto'
				}
			})
		}
	}

	public getPlayerId(): number {
		return Number((this as any).player_id)
	}

	public getPlayerScore(playerId: number): number {
		return (this as any).scoreCtrl[playerId]?.getValue() ?? Number(this.gamedatas.players[playerId].score)
	}

	public getPlayersCount(): number {
		return Object.values(this.gamedatas.players).length
	}

	/**
	 * Update player score.
	 */
	private setPoints(playerId: number, points: number) {
		;(this as any).scoreCtrl[playerId]?.toValue(points)
	}

	/**
	 * Add an animation to the animation queue, and start it if there is no current animations.
	 */
	public addAnimation(animation: FestivibesAnimation) {
		this.animations.push(animation)
		if (this.animations.length === 1) {
			this.animations[0].animate()
		}
	}

	/**
	 * Start the next animation in animation queue.
	 */
	public endAnimation(ended: FestivibesAnimation) {
		const index = this.animations.indexOf(ended)
		if (index !== -1) {
			this.animations.splice(index, 1)
		}
		if (this.animations.length >= 1) {
			this.animations[0].animate()
		}
	}

	/**
	 * Timer for Confirm button. Also adds a cancel button to stop timer.
	 * Cancel actions can be passed to be executed on cancel button click.
	 */
	private startActionTimer(buttonId: string, time: number, cancelFunction?) {
		if (this.actionTimerId) {
			window.clearInterval(this.actionTimerId)
			dojo.query('.timer-button').forEach((but: HTMLElement) => (but.innerHTML = this.stripTime(but.innerHTML)))
			dojo.destroy(`cancel-button`)
		}

		//adds cancel button
		const button = document.getElementById(buttonId)
		;(this as any).addActionButton(
			`cancel-button`,
			_('Cancel'),
			() => {
				window.clearInterval(this.actionTimerId)
				button.innerHTML = this.stripTime(button.innerHTML)
				cancelFunction?.()
				dojo.destroy(`cancel-button`)
			},
			null,
			null,
			'red'
		)

		const _actionTimerLabel = button.innerHTML
		let _actionTimerSeconds = time

		const actionTimerFunction = () => {
			const button = document.getElementById(buttonId)
			if (button == null) {
				window.clearInterval(this.actionTimerId)
			} else if (button.classList.contains('disabled')) {
				window.clearInterval(this.actionTimerId)
				button.innerHTML = this.stripTime(button.innerHTML)
			} else if (_actionTimerSeconds-- > 1) {
				button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')'
			} else {
				window.clearInterval(this.actionTimerId)
				button.click()
				button.innerHTML = this.stripTime(button.innerHTML)
			}
		}
		actionTimerFunction()
		this.actionTimerId = window.setInterval(() => actionTimerFunction(), 1000)
	}

	private stopActionTimer() {
		if (this.actionTimerId) {
			window.clearInterval(this.actionTimerId)
			dojo.query('.timer-button').forEach((but: HTMLElement) => dojo.destroy(but.id))
			dojo.destroy(`cancel-button`)
			this.actionTimerId = undefined
		}
	}

	private stripTime(buttonLabel: string): string {
		const regex = /\s*\([0-9]+\)$/
		return buttonLabel.replace(regex, '')
	}
	private setChooseActionGamestateDescription(newText?: string) {
		if (!this.originalTextChooseAction) {
			this.originalTextChooseAction = document.getElementById('pagemaintitletext').innerHTML
		}

		document.getElementById('pagemaintitletext').innerHTML = newText ?? this.originalTextChooseAction
	}

	/**
	 * Sets the action bar (title and buttons) for Choose action.
	 */
	private setActionBarChooseAction(fromCancel: boolean) {
		document.getElementById(`generalactions`).innerHTML = ''
		if (fromCancel) {
			this.setChooseActionGamestateDescription()
		}
		if (this.actionTimerId) {
			window.clearInterval(this.actionTimerId)
		}

		const chooseActionArgs = this.gamedatas.gamestate.args as EnteringChooseActionArgs

		/*this.addImageActionButton(
            'useTicket_button',
            this.createDiv('expTicket', 'expTicket-button'),
            'blue',
            _('Use a ticket to place another arrow, remove the last one of any expedition or exchange a card'),
            () => {
                this.useTicket();
            }
        );
        $('expTicket-button').parentElement.style.padding = '0';

        dojo.toggleClass('useTicket_button', 'disabled', !chooseActionArgs.canUseTicket);*/

		if (chooseActionArgs.canPass) {
			;(this as any).addActionButton('pass_button', _('End my turn'), () => this.pass())
		}
	}

	///////////////////////////////////////////////////
	//// Player's action

	/*
    
        Here, you are defining methods to handle player's action (ex: results of mouse click on 
        game objects).
        
        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server
    
    */

	/**
	 * Pass (in case of no possible action).
	 */
	public pass() {
		if (!(this as any).checkAction('pass')) {
			return
		}

		this.takeAction('pass')
	}

	public takeAction(action: string, data?: any) {
		data = data || {}
		data.lock = true
		data.version = this.gamedatas.version
		;(this as any).ajaxcall(`/festivibes/festivibes/${action}.html`, data, this, () => {})
	}
	///////////////////////////////////////////////////
	//// Reaction to cometD notifications

	/*
        setupNotifications:
        
        In this method, you associate each of your game notifications with your local method to handle it.
        
        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your festivibes.game.php file.
    
    */
	setupNotifications() {
		console.log('notifications subscriptions setup')

		// TODO: here, associate your game notifications with local methods

		// Example 1: standard notification handling
		// dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );

		// Example 2: standard notification handling + tell the user interface to wait
		//            during 3 seconds after calling the method in order to let the players
		//            see what is happening in the game.
		// dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
		// this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
		//

		const notifs = [
			//['claimedRoute', ANIMATION_MS],
			['points', 1],
			['score', ANIMATION_MS],
			['highlightWinnerScore', ANIMATION_MS],
			['materialMove', ANIMATION_MS],
			['lastTurn', 1]
		]

		notifs.forEach((notif) => {
			dojo.subscribe(notif[0], this, `notif_${notif[0]}`)
			;(this as any).notifqueue.setSynchronous(notif[0], notif[1])
		})
	}

	/**
	 * Update player score.
	 */
	notif_points(notif: Notif<NotifPointsArgs>) {
		this.setPoints(notif.args.playerId, notif.args.points)
	}

	/**
	 * Show last turn banner.
	 */
	notif_lastTurn(animate: boolean = true) {
		dojo.place(
			`<div id="last-round">
            <span class="last-round-text ${animate ? 'animate' : ''}">${_('Finishing round before end of game!')}</span>
        </div>`,
			'page-title'
		)
	}

	/**
	 * Updates a total or subtotal
	 * @param notif
	 */
	notif_score(notif: Notif<NotifScoreArgs>) {
		console.log('notif_score', notif)
		this.scoreBoard.updateScore(notif.args.playerId, notif.args.scoreType, notif.args.score)
	}

	notif_materialMove(notif: Notif<NotifMaterialMove>) {
		console.log('notif_materialMove', notif)
		const cards = notif.args.material as Array<FestivibesCard>
		cards.forEach((c) => console.log('c', c.id))
	}

	/**
	 * Highlight winner for end score.
	 */
	notif_highlightWinnerScore(notif: Notif<NotifWinnerArgs>) {
		this.scoreBoard?.highlightWinnerScore(notif.args.playerId)
	}

	/* This enable to inject translatable styled things to logs or action bar */
	/* @Override */
	public format_string_recursive(log: string, args: any) {
		try {
			if (log && args && !args.processed) {
				if (typeof args.ticket == 'number') {
					args.ticket = `<div class="icon expTicket"></div>`
				}

				// make cities names in bold
				;['from', 'to', 'cities_names'].forEach((field) => {
					if (args[field] !== null && args[field] !== undefined && args[field][0] != '<') {
						args[field] = `<span style="color:#2cd51e"><strong>${_(args[field])}</strong></span>`
					}
				})
				;['you', 'actplayer', 'player_name'].forEach((field) => {
					if (
						typeof args[field] === 'string' &&
						args[field].indexOf('#df74b2;') !== -1 &&
						args[field].indexOf('text-shadow') === -1
					) {
						args[field] = args[field].replace(
							'#df74b2;',
							'#df74b2; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;'
						)
					}
				})
			}
		} catch (e) {
			console.error(log, args, 'Exception thrown', e.stack)
		}
		return (this as any).inherited(arguments)
	}
	/**
	 * Get current zoom.
	 */
	public getZoom(): number {
		return this.map.getZoom()
	}

	/**
	 * Get current player.
	 */
	public getCurrentPlayer(): FestivibesPlayer {
		return this.gamedatas.players[this.getPlayerId()]
	}
}
