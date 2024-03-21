<?php

require_once(__DIR__ . '/objects/ticket.php');

trait TicketDeckTrait {

    /**
     * Create ticket cards.
     */
    public function createTickets() {
        $tickets = $this->getTicketsToGenerate();
        $this->tickets->createCards($tickets, 'deck');
        $this->dealTickets();
    }

    /**
     * Deal tickets according to the player color.
     */
    public function dealTickets() {
        $players = $this->getPlayers();
        $colors = array_flip(PLAYER_COLORS);
        foreach ($players as $playerId => $player) {
            $color = $player["player_color"];
            $type = $colors[$color];
            $sql = "SELECT card_id id FROM `ticket` WHERE `card_type_arg` = $type";
            $cardIds = array_keys($this->getCollectionFromDb($sql, true));
            $this->tickets->moveCards($cardIds, "hand", $playerId);
        }
    }
}
