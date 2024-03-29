<?php

require_once(__DIR__ . '/objects/ticket.php');

const FAKE_PLAYER = 0;//id, must be int

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
        if ($this->getPlayerCount() == 2) {
            $otherTickets = $this->getTicketsFromDb($this->tickets->getCardsInLocation("deck"));
            $festivals = $this->getFestivals();
            for ($i = 0; $i < 3; $i++) {
                $ticket = array_pop($otherTickets);
                $this->botPlaceTicketOnFestivalSlot($ticket, $festivals[$i], 1);
            }
        }
    }

    public function getColorFromHexValue($hexColor) {
        $colors = array_flip(PLAYER_COLORS);
        return $colors[$hexColor];
    }


    public function hasTicketInHand($playerId) {
        return $this->tickets->countCardInLocation("hand", $playerId) > 0;
    }

    public function getTicketsInHandCount($playerId) {
        return $this->tickets->countCardInLocation("hand", $playerId);
    }

    public function botPlaceTicketOnFestivalSlot($ticket, $festival, $slotId) {
        $this->tickets->moveCard($ticket->id, "festival_" . $festival->id, $slotId);
        $this->notifyWithName('materialMove', "", [
            'type' => MATERIAL_TYPE_TICKET,
            'from' => MATERIAL_LOCATION_HAND,
            'fromArg' => FAKE_PLAYER,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' =>  $festival->id,
            'material' => [$this->getTicketFromDb($this->tickets->getCard($ticket->id))],
            'festivalOrder' =>  $this->getFestivalOrder($festival),
        ]);
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
            'fromArg' => $playerId,
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

    public function getTicketsFromOtherPlayersOnFestival($playerId, $festivalId) {
        $color = $this->getColorFromHexValue($this->getPlayerColor($playerId));
        return array_values(array_filter($this->getTicketsOnFestival($festivalId), fn ($t) => $t->type_arg != $color));
    }

    public function getTicketsFromPlayerOnFestival($playerId, $festivalId) {
        $color = $this->getColorFromHexValue($this->getPlayerColor($playerId));
        return $this->getEventsFromDb($this->getCardsOfTypeArgFromLocation("ticket", $color, "festival_${festivalId}"));
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
        $playerId = $this->getPlayerIdFromTicketColor($removedTicket->type_arg);
        if (!$playerId) {
            $playerId = FAKE_PLAYER;
            $otherPlayerName = clienttranslate('bot');
        } else {
            $otherPlayerName = $this->getPlayerName($playerId);
        }
        //self::dump('*******************player', $playerId);
        $this->tickets->moveCard($removedTicket->id, "toReposition", $playerId);

        $festivalId = $this->getFestivalIdFromCardLocation($removedTicket->location);
        $this->notifyWithName('materialMove', clienttranslate('${player_name} removes a ticket from ${other_player_name}'), [
            'type' => MATERIAL_TYPE_TICKET,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'fromArg' => $festivalId,
            'to' => MATERIAL_LOCATION_HAND,
            'toArg' => $playerId,
            'material' => [$removedTicket],
            'other_player_name' => $otherPlayerName,
        ]);
        $this->placeTicketOnFestivalSlot($this->getMostlyActivePlayerId(), $festivalId, $removedTicket->location_arg);

        if (!$playerId) {
            //reposition ticket for fake player
            $emptySlots = $this->findEmptySlots();
            $randIndex = bga_rand(0, count($emptySlots) - 1);
            $slot = $emptySlots[$randIndex];
            $this->botPlaceTicketOnFestivalSlot($removedTicket, $this->getFestivalFromDB($this->festivals->getCard($slot[0])), $slot[1]);
            $this->resolveLastContextIfAction(ACTION_REPLACE_TICKET);
            $this->resolveLastContextIfAction(ACTION_PLAY_CARD);
        }
        return $playerId;
    }

    private function findEmptySlots(): array {
        $slots = [];
        $ticketsByFestivalId = $this->getTicketsOnFestivals();
        foreach ($ticketsByFestivalId as $festivalId => $tickets) {
            if (count($tickets) != 2) {
                $possibleSlots = [1, 2];
                foreach ($tickets as $t) {
                    $possibleSlots = array_diff($possibleSlots, [$t->location_arg]);
                }
                foreach ($possibleSlots as $slot) {
                    $slots[] = [$festivalId, $slot];
                }
            }
        }
        self::dump('*******************solts', $slots);
        return $slots;
    }

    public function isFestivalFull($festivalId) {
        return $this->tickets->countCardInLocation("festival_", $festivalId) == 2;
    }
}
