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
        return $this->pickDestinationCards($playerId, $cardsNumber);
    }

    public function placeEventCardOnFestival(int $eventId, int $festivalId) {
        $this->events->insertCardOnExtremePosition($eventId, "festival_" . $festivalId, true);
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
        return count($events)===1;
    }

    /* public function checkVisibleSharedCardsAreEnough() {
        $visibleCardsCount = intval($this->events->countCardInLocation('shared'));
        if ($visibleCardsCount < NUMBER_OF_SHARED_DESTINATION_CARDS) {
            $spots = [];
            $citiesNames = [];
            for ($i = $visibleCardsCount; $i < NUMBER_OF_SHARED_DESTINATION_CARDS; $i++) {
                $newCard = $this->getEventFromDb($this->events->pickCardForLocation('deck', 'shared', $i));
                $citiesNames[] = $this->CITIES[$newCard->to];
                $spots[] = $newCard;
            }
            $this->notifyAllPlayers('newSharedEventsOnTable', clienttranslate('New shared destination drawn: ${cities_names}'), [
                'sharedEvents' => $spots,
                'cities_names' => implode(",", $citiesNames),
            ]);
        }
    }*/

    /**
     * Pick destination cards for pick destination action.
     */
    public function pickAdditionalDestinationCards(int $playerId) {
        return $this->pickDestinationCards($playerId, $this->getAdditionalDestinationCardNumber());
    }

    /**
     * Select kept destination card for pick destination action. 
     * Unused destination cards are discarded.
     */
    public function keepAdditionalDestinationCards(int $playerId, int $keptEventsId, int $discardedDestinationId) {
        $this->keepDestinationCards($playerId, $keptEventsId, $discardedDestinationId);
    }

    /**
     * Get destination picked cards (cards player can choose).
     */
    public function getPickedDestinationCards(int $playerId) {
        $cards = $this->getEventsFromDb($this->events->getCardsInLocation("pick$playerId"));
        return $cards;
    }

    /**
     * Get destination cards in player hand.
     */
    public function getPlayerDestinationCards(int $playerId) {
        $cards = $this->getEventsFromDb($this->events->getCardsInLocation("hand", $playerId));
        return $cards;
    }

    /**
     * get remaining destination cards in deck.
     */
    public function getRemainingDestinationCardsInDeck() {
        $remaining = intval($this->events->countCardInLocation('deck'));

        if ($remaining == 0) {
            $remaining = intval($this->events->countCardInLocation('discard'));
        }

        return $remaining;
    }

    /**
     * place a number of events cards to pick$playerId.
     */
    private function pickDestinationCards($playerId, int $number) {
        $cards = $this->getEventsFromDb($this->events->pickCardsForLocation($number, 'deck', "hand", "$playerId"));
        return $cards;
    }

    /**
     * move selected card to player hand, discard other selected card from the hand and empty pick$playerId.
     */
    private function keepDestinationCards(int $playerId, int $keptEventsId, int $discardedDestinationId) {
        if ($keptEventsId xor $discardedDestinationId) {
            throw new BgaUserException("You must discard a destination to take another one.");
        }
        $traded = $keptEventsId && $discardedDestinationId;
        if ($traded) {
            if (
                $this->getUniqueIntValueFromDB("SELECT count(*) FROM destination WHERE `card_location` = 'pick$playerId' AND `card_id` = $keptEventsId") == 0
                || $this->getUniqueIntValueFromDB("SELECT count(*) FROM destination WHERE `card_location` = 'hand' AND `card_location_arg` = '$playerId' AND `card_id` = $discardedDestinationId") == 0
            ) {
                throw new BgaUserException("Selected cards are not available.");
            }
            $this->events->moveCard($keptEventsId, 'hand', $playerId);
            $this->events->moveCard($discardedDestinationId, 'discard');

            $remainingCardsInPick = intval($this->events->countCardInLocation("pick$playerId"));
            if ($remainingCardsInPick > 0) {
                // we discard remaining cards in pick
                $this->events->moveAllCardsInLocationKeepOrder("pick$playerId", 'discard');
            }
        }
        $this->notifyAllPlayers('eventsPicked', clienttranslate('${player_name} trades ${count} destination'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'count' => intval($traded),
            'number' => 0, //1-1 or 0-0
            'remainingEventsInDeck' => $this->getRemainingDestinationCardsInDeck(),
            '_private' => [
                $playerId => [
                    'events' => $this->getEventsFromDb([$this->events->getCard($keptEventsId)]),
                    'discardedDestination' => $this->getEventFromDb($this->events->getCard($discardedDestinationId)),
                ],
            ],
        ]);
    }

    /**
     * Move selected cards to player hand.
     */
    private function keepInitialDestinationCards(int $playerId, array $ids) {
        $this->events->moveCards($ids, 'hand', $playerId);
        $this->notifyAllPlayers('eventsPicked', clienttranslate('${player_name} keeps ${count} events'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'count' => count($ids),
            'number' => count($ids),
            'remainingEventsInDeck' => $this->getRemainingDestinationCardsInDeck(),
            '_private' => [
                $playerId => [
                    'events' => $this->getEventsFromDb($this->events->getCards($ids)),
                ],
            ],
        ]);
    }
}
