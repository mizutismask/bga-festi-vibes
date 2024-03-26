<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in yourgamename.action.php)
    */
    public function placeTicket($festivalId, $slotId) {
        self::checkAction('placeTicket');

        $playerId = intval(self::getActivePlayerId());
        $this->userAssertTrue(self::_("You’ve already played all your tickets"), $this->hasTicketInHand($playerId));
        $this->userAssertTrue(self::_("This festival is sold out"), !$this->isFestivalFull($festivalId));


        $this->placeTicketOnFestivalSlot($playerId, $festivalId, $slotId);

        //  if ($keptEventsId)
        //self::incStat(1, STAT_KEPT_ADDITIONAL_DESTINATION_CARDS, $playerId);
        $this->dbInsertContextLog(ACTION_PLAY_TICKET, $festivalId, $slotId);
        $this->changeNextStateFromContext();
    }

    public function playCard($cardId, $festivalId) {
        self::checkAction('playCard');

        $playerId = intval(self::getActivePlayerId());
        $card = $this->getEventFromDb($this->events->getCard($cardId));

        $this->userAssertTrue(self::_("This card is not in your hand"), $card->location === "hand");
        $this->userAssertTrue(self::_("This card is not yours"), $card->location_arg === $playerId);

        $this->userAssertTrue(
            self::_("This festival is sold out"),
            !$this->isFestivalFull($festivalId)
        );
        $this->placeEventCardOnFestival($cardId, $festivalId);
        $this->dbInsertContextLog(ACTION_PLAY_CARD, $cardId, $festivalId, $card->action);

        $this->changeNextStateFromContext();
    }

    public function discardEvent($cardId) {
        self::checkAction('discardEvent');

        $args = $this->argDiscardEvent();
        $selectableCards = reset($args['selectableCardsByFestival']);
        $this->userAssertTrue(self::_("You can’t discard this card"), $this->array_some($selectableCards, fn ($card) => $card->id == $cardId));

        $this->events->playCard($cardId);
        $this->resolveLastContextIfAction(ACTION_DISCARD_EVENT);
        $this->resolveLastContextIfAction(ACTION_PLAY_CARD);

        $this->changeNextStateFromContext();
    }

    public function swapTickets($cardId1, $cardId2) {
        self::checkAction('swapTicket');
        $args = $this->argSwapTicket();
        $mandatoryCardAmong = $args['mandatoryCardAmong'];
        $isCard1Mandatory = $this->array_contains_card($mandatoryCardAmong, $cardId1);
        $this->userAssertTrue(self::_("You have to swap a ticket from the column you just played"), $isCard1Mandatory || $this->array_contains_card($mandatoryCardAmong, $cardId2));

        $selectableCards = $args['selectableCardsByFestival'];
        $this->userAssertTrue(
            self::_("You have to swap with a column different from the one you just played"),
            $this->array_some($selectableCards, fn ($possibleCards) => $this->array_contains_card($possibleCards, $isCard1Mandatory ? $cardId2 : $cardId1))
        );

        $this->swapTicketLocations($cardId1, $cardId2);
        $this->resolveLastContextIfAction($args["swapMyTicket"] ? ACTION_SWAP_MY_TICKET : ACTION_SWAP_ANY_TICKETS);
        $this->resolveLastContextIfAction(ACTION_PLAY_CARD);

        $this->changeNextStateFromContext();
    }

    public function swapEvents($cardId1, $cardId2) {
        self::checkAction('swapEvent');
        $args = $this->argSwapEvent();
        $mandatoryCardAmong = $args['mandatoryCardAmong'];
        $isCard1Mandatory = $this->array_contains_card($mandatoryCardAmong, $cardId1);
        $this->userAssertTrue(self::_("You have to swap a card from the column you just played"), $isCard1Mandatory || $this->array_contains_card($mandatoryCardAmong, $cardId2));

        $selectableCards = $args['selectableCardsByFestival'];
        $this->userAssertTrue(
            self::_("You have to swap with a column different from the one you just played"),
            $this->array_some($selectableCards, fn ($possibleCards) => $this->array_contains_card($possibleCards, $isCard1Mandatory ? $cardId2 : $cardId1))
        );

        $this->swapEventLocations($cardId1, $cardId2);
        $this->resolveLastContextIfAction(ACTION_SWAP_EVENT);
        $this->resolveLastContextIfAction(ACTION_PLAY_CARD);

        $this->changeNextStateFromContext();
    }

    public function swapEventWithHand($cardId, $cardFromHandId) {
        self::checkAction('swapEventWithHand');
        $playerId = intval(self::getActivePlayerId());
        $args = $this->argSwapEventWithHand();
        $mandatoryCardAmong = $args['mandatoryCardAmong'];
        $this->userAssertTrue(self::_("You have to swap a card from the column you just played"), $this->array_contains_card($mandatoryCardAmong, $cardId));

        $card = $this->getEventFromDb($this->events->getCard($cardFromHandId));
        $this->userAssertTrue(self::_("This card is not in your hand"), $card->location === "hand");
        $this->userAssertTrue(self::_("This card is not yours"), $card->location_arg === $playerId);

        $this->swapEventLocations($cardId, $cardFromHandId);
        $this->resolveLastContextIfAction(ACTION_SWAP_EVENT_WITH_HAND);
        $this->resolveLastContextIfAction(ACTION_PLAY_CARD);

        $this->changeNextStateFromContext();
    }

    function pass() {
        self::checkAction('pass');

        $args = $this->argChooseAction();

        if (!$args['canPass']) {
            throw new BgaUserException("You cannot pass");
        }

        $this->gamestate->nextState('nextPlayer');
    }
}
