<?php

trait DebugUtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function debugSetup() {
        if (!$this->isStudio()) {
            return;
        }

        //$this->debugSetDestinationInHand(7, 2343492);
        //$this->gamestate->changeActivePlayer(2343492);
    }

    /*function cd() {
        $this->debugCompleteEvents();
    }*/

    /*function debugCompleteEvents() {
        $players = $this->getPlayersIds();
        $restriction = " limit " . ($this->getInitialEventCardNumber() - 1);
        foreach ($players as $playerId) {
            self::DbQuery("UPDATE `destination` set `completed` = true WHERE `card_location_arg`= $playerId" . $restriction);
        }
        $this->gamestate->jumpToState(ST_PLAYER_CHOOSE_ACTION);
    }*/

    /*function debugEmptyDestinationDeck() {
        $this->events->moveAllCardsInLocation('deck', 'void');
    }*/

    /*function debugAlmostEmptyDestinationDeck() {
        $moveNumber = $this->getRemainingDestinationCardsInDeck() - 1;
        $this->events->pickCardsForLocation($moveNumber, 'deck', 'discard');
    }*/


    /*function clear() {
        self::DbQuery("DELETE FROM `claimed_routes`");
        $this->setGlobalVariable(LAST_BLUE_ROUTES, [null, null, null]);
        $this->setGameStateValue(BLUEPOINT_ACTIONS_REMAINING, 0);
        $this->debugResetArrowsLeft();
        self::DbQuery("UPDATE `destination` set `completed` = false");
    }*/

    /*public function debugReplacePlayersIds() {
        if (!$this->isStudio() ) {
            return;
        }

        // These are the id's from the BGAtable I need to debug.
        // SELECT JSON_ARRAYAGG(`player_id`) FROM `player`
        $ids = [90574255, 93146640];

        // Id of the first player in BGA Studio
        $sid = 2343492;

        foreach ($ids as $id) {
            // basic tables
            $this->DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id");
            $this->DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id");
            $this->DbQuery("UPDATE stats SET stats_player_id=$sid WHERE stats_player_id = $id");

            // 'other' game specific tables. example:
            // tables specific to your schema that use player_ids
            $this->DbQuery("UPDATE traincar SET card_location_arg=$sid WHERE card_location_arg = $id");
            $this->DbQuery("UPDATE destination SET card_location_arg=$sid WHERE card_location_arg = $id");
            $this->DbQuery("UPDATE claimed_routes SET player_id=$sid WHERE player_id = $id");

            ++$sid;
        }
    }*/

    function debug($debugData) {
        if (!$this->isStudio()) {
            return;
        }
        die('debug data : ' . json_encode($debugData));
    }

    function endGame() {
        $this->gamestate->nextState("endGame");
    }

    public function loadBugReportSQL(int $reportId, array $studioPlayers): void {
        $prodPlayers = $this->getObjectListFromDb("SELECT `player_id` FROM `player`", true);
        $prodCount = count($prodPlayers);
        $studioCount = count($studioPlayers);
        if ($prodCount != $studioCount) {
            throw new BgaVisibleSystemException("Incorrect player count (bug report has $prodCount players, studio table has $studioCount players)");
        }

        // SQL specific to your game
        // For example, reset the current state if it's already game over
        $sql = [
            "UPDATE `global` SET `global_value` = 10 WHERE `global_id` = 1 AND `global_value` = 99"
        ];
        foreach ($prodPlayers as $index => $prodId) {
            $studioId = $studioPlayers[$index];
            // SQL common to all games
            $sql[] = "UPDATE `player` SET `player_id` = $studioId WHERE `player_id` = $prodId";
            $sql[] = "UPDATE `global` SET `global_value` = $studioId WHERE `global_value` = $prodId";
            $sql[] = "UPDATE `stats` SET `stats_player_id` = $studioId WHERE `stats_player_id` = $prodId";
            $sql[] = "UPDATE gamelog SET gamelog_player=$studioId WHERE gamelog_player=$prodId";
            $sql[] = "UPDATE gamelog SET gamelog_current_player=$studioId WHERE gamelog_current_player=$prodId";
            $sql[] = "UPDATE gamelog SET gamelog_notification=REPLACE(gamelog_notification, $prodId, $studioId)";

            // SQL specific to your game
            $sql[] = "UPDATE context_log SET player=$studioId WHERE player=$prodId";
            $sql[] = "UPDATE `ticket` SET `card_location_arg` = $studioId WHERE `card_location_arg` = $prodId";
            $sql[] = "UPDATE `event` SET `card_location_arg` = $studioId WHERE `card_location_arg` = $prodId";
            $sql[] = "UPDATE `global_variables` SET `value` = REPLACE(`value`, $prodId, $studioId)";
        }
        foreach ($sql as $q) {
            $this->DbQuery($q);
        }
    }
}
