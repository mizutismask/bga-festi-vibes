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
        return $this->array_every($festivals, fn ($fest) => $this->isFestivalSoldOut($fest->id));
    }

    function stNextPlayer() {
        $playerId = self::getActivePlayerId();
        if (!$playerId) {
            $this->activateNextPlayerCustom();
            $this->gamestate->nextState('nextPlayer');
            return;
        }

        $owner = $this->getGlobalVariable(GS_REPLACED_TICKET_OWNER);
        if ($owner) {
            $context = $this->dbGetLastContextToResolve();
            $this->gamestate->changeActivePlayer($context["player"]);
            $this->setGlobalVariable(GS_REPLACED_TICKET_OWNER, null);
        }

        if ($this->hasReachedEndOfGameRequirements($playerId)) {
            $this->gamestate->nextState('endScore');
        } else {
            //finishing round or playing normally
            if (count($this->getPlayerEvents($playerId)) < 3) {
                $this->pickAdditionalEvent($playerId);
            }
            $this->activateNextPlayerCustom();
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stActivateReplacedTicketOwner() {
        $this->gamestate->changeActivePlayer($this->getGlobalVariable(GS_REPLACED_TICKET_OWNER));
        $this->gamestate->nextState('repositionTicket');
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

    function getPlayerIdFromTicketColor($ticketColor) : string {
        $player = $this->array_find($this->getPlayers(), fn ($p) => $this->getColorFromHexValue($p["player_color"]) == $ticketColor);
        return $player["player_id"];
    }

    function stEndScore() {
        $sql = "SELECT player_id id, player_score score, player_no playerNo FROM player ORDER BY player_no ASC";
        $players = self::getCollectionFromDb($sql);

        $totalScore = [];
        foreach ($players as $playerId => $playerDb) {
            $totalScore[$playerId] = 0;
        }

        $festivals = $this->getFestivals();
        foreach ($festivals as $fest) {
            $festScore = $this->getFestivalScore($fest->id);
            $tickets = $this->getTicketsOnFestival($fest->id);
            foreach ($tickets as $tick) {
                $playerId = $this->getPlayerIdFromTicketColor($tick->type_arg);
                $totalScore[$playerId] += $festScore;
                $this->incPlayerScore($playerId, $festScore, clienttranslate('${player_name} scores ${delta} points with the festival ${festivalOrder}'), ["festivalOrder" => $this->getFestivalOrder($fest)]);
            }
        }

        foreach ($players as $playerId => $playerDb) {
            self::DbQuery("UPDATE player SET `player_score` = $totalScore[$playerId] where `player_id` = $playerId");
        }

        if ($this->isStudio()) {
            $this->gamestate->nextState('debugEndGame');
        } else {
            $this->gamestate->nextState('endGame');
        }
    }
}
