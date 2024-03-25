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

    function pass() {
        self::checkAction('pass');

        $args = $this->argChooseAction();

        if (!$args['canPass']) {
            throw new BgaUserException("You cannot pass");
        }

        $this->gamestate->nextState('nextPlayer');
    }
}
