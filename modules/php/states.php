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
        $festivals = $this->getFestivals();
        return $this->array_every($festivals, fn($fest)=>$this->isFestivalFull($fest->id));
    }

    function stNextPlayer() {
        $playerId = self::getActivePlayerId();
        if (!$playerId) {
            $this->activateNextPlayerCustom();
            $this->gamestate->nextState('nextPlayer');
            return;
        }

        if ( $this->hasReachedEndOfGameRequirements($playerId)) {
            $this->gamestate->nextState('endScore');
        } else {
            //finishing round or playing normally
            $this->pickAdditionalEvent();
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

        $totalScore = [];
        foreach ($players as $playerId => $playerDb) {
            $totalScore[$playerId] = 0;
        }

        $festivals=$this->getFestivals();
        foreach ($festivals as $fest) {
            $festScore = $this->getFestivalScore();
            $tickets = $this->getTicketsOnFestival();
            foreach ($tickets as $tick) {
                $player = $this->getPlayerIdFromTicketColor($tick->type_arg);
                $totalScore[$playerId] += $festScore;
                $this->incPlayerScore($playerId, $festScore, clienttranslate('${player_name} scores ${delta} points with the festival ${cardsCount}'), ["cardCount" => $fest->cardsCount, "scoreType" => $this->getScoreType($fest, $playerId)]);
            }
        }

        foreach ($players as $playerId => $playerDb) {
            self::DbQuery("UPDATE player SET `player_score` = $totalScore[$playerId] where `player_id` = $playerId");
        }

        $bestScore = max($totalScore);
        $playersWithScore = [];
        foreach ($players as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
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
