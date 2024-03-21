<?php

trait StateTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state actions
    ////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stDealInitialSetup() {
        $playersIds = $this->getPlayersIds();

        foreach ($playersIds as $playerId) {
            //$this->pickInitialDestinationCards($playerId);
        }

        $this->gamestate->nextState('');
    }

    function hasReachedEndOfGameRequirements($playerId): bool {
        $playersIds = $this->getPlayersIds();

        $end = false; //todo
        if ($end && intval(self::getGameStateValue(LAST_TURN) == 0)) {
            self::setGameStateValue(LAST_TURN, $this->getLastPlayer()); //we play until the last player to finish the round
            if (!$this->isLastPlayer($playerId)) {
                self::notifyWithName('lastTurn', clienttranslate('${player_name} has no more destination cards, finishing round !'), []);
            }
        }
        return $end;
    }

    function stNextPlayer() {
        $playerId = self::getActivePlayerId();
        if (!$playerId) {
            $this->activateNextPlayerCustom();
            $this->gamestate->nextState('nextPlayer');
            return;
        }

        //$this->setGameStateValue(TICKETS_USED, 0);
        $lastTurn = intval(self::getGameStateValue(LAST_TURN));

        // check if it was last action from the last player or if there is no arrow left
        if ($lastTurn == $playerId || ($this->hasReachedEndOfGameRequirements($playerId) && $this->isLastPlayer($playerId))) {
            $this->gamestate->nextState('endScore');
        } else {
            //finishing round or playing normally
            $this->activateNextPlayerCustom();
            $this->gamestate->nextState('nextPlayer');
        }
    }

    /**
     * Activates next player, also giving him extra time.
     */
    function activateNextPlayerCustom() {
        $player_id = $this->activeNextPlayer();
        $this->giveExtraTime($player_id);
        $this->incStat(1, 'turns_number', $player_id);
        $this->incStat(1, 'turns_number');
        $this->notifyWithName('msg', clienttranslate('&#10148; Start of ${player_name}\'s turn'));
    }


    function stEndScore() {
        $sql = "SELECT player_id id, player_score score, player_no playerNo FROM player ORDER BY player_no ASC";
        $players = self::getCollectionFromDb($sql);

        // points gained during the game
        $totalScore = [];
        foreach ($players as $playerId => $playerDb) {
            $totalScore[$playerId] = intval($playerDb['score']);
        }

        //end of game points

        // failed destinations 
        /* $destinationsResults = [];
        $completedDestinationsCount = [];
        foreach ($players as $playerId => $playerDb) {
            $completedDestinationsCount[$playerId] = 0;
            $uncompletedDestinations = [];
            $completedDestinations = [];

            $destinations = $this->getDestinationsFromDb($this->destinations->getCardsInLocation('hand', $playerId));

            foreach ($destinations as &$destination) {
                $completed = boolval(self::getUniqueValueFromDb("SELECT `completed` FROM `destination` WHERE `card_id` = $destination->id"));
                if ($completed) {
                    $completedDestinationsCount[$playerId]++;
                    $completedDestinations[] = $destination;
                    self::incStat(1, STAT_POINTS_WITH_PLAYER_COMPLETED_DESTINATIONS, $playerId);
                } else {
                    $totalScore[$playerId] += -1;
                    self::incScore($playerId, -1);
                    if ($this->isDestinationRevealed($destination->id)) {
                        $totalScore[$playerId] += -1;
                        self::incScore($playerId, -1);
                        self::incStat(-1, STAT_POINTS_WITH_REVEALED_DESTINATIONS, $playerId);
                    }
                    self::incStat(1, STAT_POINTS_LOST_WITH_UNCOMPLETED_DESTINATIONS, $playerId);
                    $uncompletedDestinations[] = $destination;
                }
            }

            $destinationsResults[$playerId] = $uncompletedDestinations;
        }
*/
        foreach ($players as $playerId => $playerDb) {
            self::DbQuery("UPDATE player SET `player_score` = $totalScore[$playerId] where `player_id` = $playerId");
            self::DbQuery("UPDATE player SET `player_score_aux` = `player_remaining_tickets` where `player_id` = $playerId");
        }

        $bestScore = max($totalScore);
        $playersWithScore = [];
        foreach ($players as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
            $player['ticketsCount'] = $this->getRemainingTicketsCount($playerId);
            $player['score'] = $totalScore[$playerId];
            $playersWithScore[$playerId] = $player;
        }
        self::notifyAllPlayers('bestScore', '', [
            'bestScore' => $bestScore,
            'players' => array_values($playersWithScore),
        ]);

        // highlight winner(s)
        foreach ($totalScore as $playerId => $playerScore) {
            if ($playerScore == $bestScore) {
                self::notifyAllPlayers('highlightWinnerScore', '', [
                    'playerId' => $playerId,
                ]);
            }
        }

        if ($this->isStudio()) {
            $this->gamestate->nextState('debugEndGame');
        } else {
            $this->gamestate->nextState('endGame');
        }
    }
}
