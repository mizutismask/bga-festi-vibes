<?php

require_once(__DIR__ . '/objects/event.php');

trait EventDeckTrait {

    /**
     * Create event cards.
     */
    public function createEvents() {
        $events = $this->getEventsToGenerate();
        $this->events->createCards($events, 'deck');
        $this->events->shuffle('deck');
    }

    /**
     * Deal events at the beginning of the game.
     */
    public function dealEvents(int $playerId) {
        $cardsNumber = $this->getInitialEventCardNumber();
        return $this->pickEvents($playerId, $cardsNumber);
    }

    public function placeEventCardOnFestival(int $eventId, int $festivalId) {
        $this->events->insertCardOnExtremePosition($eventId, "festival_" . $festivalId, true);
        $event = $this->getEventFromDB($this->events->getCard($eventId));
        $this->notifyWithName('materialMove', clienttranslate('${player_name} places a event of value ${cardValue} in the festival ${festivalOrder}'), [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_HAND,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => $festivalId,
            'material' => [$event],
            'cardValue' => $event->points,
            'festivalOrder' =>  $this->getFestivalOrder($this->getFestivalFromDB($this->festivals->getCard($festivalId))),
        ]);
    }

    public function getEventsOnFestivals() {
        $events = $this->getEventsFromDb($this->getCardsFromLocationLike("event", "festival_%"));
        $byFestivalId = $this->arrayGroupBy($events, fn ($t) => self::getPart($t->location, -1));
        return $byFestivalId;
    }

    public function getEventsOnFestival($festivalId) {
        $events = $this->getEventsFromDb($this->events->getCardsInLocation("festival_${festivalId}"));
        return $events;
    }

    public function isEventOnFestival($festivalId, $cardTypeArg) {
        $events = $this->events->getCardsOfTypeInLocation(1, $cardTypeArg, "festival_${festivalId}");
        return count($events) === 1;
    }

    public function getFestivalScore($festivalId) {
        $events = $this->getEventsFromDb($this->events->getCardsInLocation("festival_${festivalId}"));
        return array_reduce($events, fn ($carry, $evt) => $carry + $evt->points, 0);
    }

    public function swapEventLocations($cardId1, $cardId2): void {
        $evt1 = $this->getEventFromDb($this->events->getCard($cardId1));
        $evt2 = $this->getEventFromDb($this->events->getCard($cardId2));
        $this->events->moveCard($evt1->id, $evt2->location, $evt2->location_arg);
        $this->events->moveCard($evt2->id, $evt1->location, $evt1->location_arg);

        $this->notifyAllPlayers('materialMove', "", [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => self::getPart($evt2->location, -1),
            'material' => [$this->getEventFromDb($this->events->getCard($cardId1))],
        ]);

        $this->notifyAllPlayers('materialMove', "", [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => self::getPart($evt1->location, -1),
            'material' => [$this->getEventFromDb($this->events->getCard($cardId2))],
        ]);


        $this->notifyWithName('msg', clienttranslate('${player_name} swaps events between festivals ${festivalOrder1} and ${festivalOrder2}'), [
            'festivalOrder1' => $this->getFestivalOrder($this->getFestivalFromCardLocation($evt1->location)),
            'festivalOrder2' => $this->getFestivalOrder($this->getFestivalFromCardLocation($evt2->location)),
        ]);
    }

    public function swapEventLocationsWithHand($cardId1, $cardInHand): void {
        $evt1 = $this->getEventFromDb($this->events->getCard($cardId1));
        $evt2 = $this->getEventFromDb($this->events->getCard($cardInHand));
        $this->events->moveCard($evt1->id, $evt2->location, $evt2->location_arg);
        $this->events->moveCard($evt2->id, $evt1->location, $evt1->location_arg);

        $this->notifyAllPlayers('materialMove', "", [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_HAND,
            'to' => MATERIAL_LOCATION_FESTIVAL,
            'toArg' => self::getPart($evt1->location, -1),
            'material' => [$this->getEventFromDb($this->events->getCard($cardInHand))],
        ]);

        $this->notifyAllPlayers('materialMove', "", [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_HAND,
            'toArg' => $evt2->location_arg,
            'material' => [$this->getEventFromDb($this->events->getCard($cardId1))],
        ]);


        $this->notifyWithName('msg', clienttranslate('${player_name} swaps events between festivals ${festivalOrder1} and his hand'), [
            'festivalOrder1' => $this->getFestivalOrder($this->getFestivalFromCardLocation($evt1->location)),
        ]);
    }

    public function discardEventAndReorderFestival(EventCard $card){
        $this->events->playCard($card->id);
        $festival = $this->getFestivalFromCardLocation($card->location);
        $this->notifyWithName('materialMove', clienttranslate('${player_name} discards a ${cardValue} in the festival ${festivalOrder}'), [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_FESTIVAL,
            'to' => MATERIAL_LOCATION_DECK,
            'toArg' =>  $festival->id,
            'material' => [$card],
            'cardValue' => $card->points,
            'festivalOrder' =>  $this->getFestivalOrder($festival),
        ]);

        foreach ($this->getEventsOnFestival($festival->id) as $evt) {
            if($evt->location_arg > $card->location_arg){
                //move the card in the lower slot
                $this->events->moveCard($evt->id, $evt->location, $evt->location_arg-1);
                $this->notifyWithName('materialMove', "", [
                    'type' => MATERIAL_TYPE_EVENT,
                    'from' => MATERIAL_LOCATION_FESTIVAL,
                    'to' => MATERIAL_LOCATION_FESTIVAL,
                    'toArg' =>  $festival->id,
                    'material' => [$this->getEventFromDB($this->events->getCard($evt->id))],
                ]);
            }
        }
    }

    /**
     * Pick destination cards for pick destination action.
     */
    public function pickAdditionalEvent(int $playerId) {
        return $this->pickEvents($playerId, $this->getAdditionalDestinationCardNumber());
    }

    /**
     * Get event cards in player hand.
     */
    public function getPlayerEvents(int $playerId) {
        $cards = $this->getEventsFromDb($this->events->getCardsInLocation("hand", $playerId));
        return $cards;
    }

    /**
     * place a number of events cards to pick$playerId.
     */
    private function pickEvents($playerId, int $number) {
        $cards = $this->getEventsFromDb($this->events->pickCardsForLocation($number, 'deck', "hand", "$playerId"));

        $this->notifyPlayer($playerId, 'materialMove', "", [
            'type' => MATERIAL_TYPE_EVENT,
            'from' => MATERIAL_LOCATION_DECK,
            'to' => MATERIAL_LOCATION_HAND,
            'toArg' => $playerId,
            'material' => $cards
        ]);
        return $cards;
    }
}
