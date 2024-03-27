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

    public function getColorFromHexValue($hexColor) {
        $colors = array_flip(PLAYER_COLORS);
        return $colors[$hexColor];
    }


    public function hasTicketInHand($playerId) {
        return $this->tickets->countCardInLocation("hand", $playerId) > 0;
    }

    public function placeTicketOnFestivalSlot($playerId, $festivalId, $slotId) {
        $freeTickets = $this->getTicketsFromDb($this->tickets->getCardsInLocation("hand", $playerId));
        $ticket = array_pop($freeTickets);
        $this->tickets->moveCard($ticket->id, "festival_" . $festivalId, $slotId);

        $card = $this->getTicketFromDb($this->tickets->getCard($ticket->id));
        $festival = $this->getFestivalFromDb($this->festivals->getCard($festivalId));
        $this->notifyWithName('materialMove', clienttranslate('🎟️ ${player_name} places a ticket in the festival ${festivalOrder}'), [
            'type' => MATERIAL_TYPE_TICKET,
            'from' => MATERIAL_LOCATION_HAND,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => $festivalId,
            'material' => [$card],
            'festivalOrder' =>  $this->getFestivalOrder($festival),
        ]);
    }

    public function getTicketsOnFestivals() {
        $tickets = $this->getFestivalsFromDb($this->getCardsFromLocationLike("ticket", "festival_%"));
        $ticketsByFestivalId = $this->arrayGroupBy($tickets, fn ($t) => self::getPart($t->location, -1));
        return $ticketsByFestivalId;
    }

    public function getTicketsOnFestival($festivalId) {
        return $this->getEventsFromDb($this->tickets->getCardsInLocation("festival_${festivalId}"));
    }
    public function getTicketsFromPlayerOnFestival($playerId, $festivalId) {
        $color = $this->getColorFromHexValue($this->getPlayerColor($playerId));
        return $this->getEventsFromDb($this->getCardsOfTypeArgFromLocation($color, "festival_${festivalId}"));
    }

    public function swapTicketLocations($cardId1, $cardId2): void {
        $evt1 = $this->getTicketFromDb($this->tickets->getCard($cardId1));
        $evt2 = $this->getTicketFromDb($this->tickets->getCard($cardId2));
        $this->tickets->moveCard($evt1->id, $evt2->location, $evt2->location_arg);
        $this->tickets->moveCard($evt2->id, $evt1->location, $evt1->location_arg);

        $this->notifyAllPlayers('materialMove', "", [
            'type' => MATERIAL_TYPE_TICKET,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => self::getPart($evt2->location, -1),
            'material' => [$this->getTicketFromDb($this->tickets->getCard($cardId1))],
        ]);

        $this->notifyAllPlayers('materialMove', "", [
            'type' => MATERIAL_TYPE_TICKET,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => self::getPart($evt1->location, -1),
            'material' => [$this->getTicketFromDb($this->tickets->getCard($cardId2))],
        ]);

        $this->notifyWithName('msg', clienttranslate('${player_name} swaps tickets between festivals ${festivalOrder1} and ${festivalOrder2}'), [
            'festivalOrder1' => $this->getFestivalOrder($this->getFestivalFromCardLocation($evt1->location)),
            'festivalOrder2' => $this->getFestivalOrder($this->getFestivalFromCardLocation($evt2->location)),
        ]);
    }

    public function playTicketInsteadOfThisOne($removedTicket) {
        $player = $this->array_find($this->getPlayers(), fn ($p) => $this->getColorFromHexValue($p["player_color"]) == $removedTicket->type_arg);
        //self::dump('*******************player', $player);
        $this->tickets->moveCard($removedTicket->id, "toReposition", $player["player_id"]);

        $festivalId = $this->getFestivalIdFromCardLocation($removedTicket->location);
        $this->notifyWithName('materialMove', clienttranslate('${player_name} removes a ticket from ${other_player_name}'), [
            'type' => MATERIAL_TYPE_TICKET,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_HAND,
            'fromArg' => $festivalId,
            'material' => [$removedTicket],
            'other_player_name' => $this->getPlayerName($player["player_id"]),
        ]);
        $this->placeTicketOnFestivalSlot($this->getMostlyActivePlayerId(), $festivalId, $removedTicket->location_arg);
        return $player["player_id"];
    }

    public function isFestivalFull($festivalId) {
        return $this->tickets->countCardInLocation("festival_", $festivalId) == 2;
    }
}
