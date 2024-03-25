<?php

trait ArgsTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state arguments
    ////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
    /*function argChooseAdditionalEvents() {
        $playerId = intval(self::getActivePlayerId());

        $events = $this->getPickedDestinationCards($playerId);

        return [
            'minimum' => 3,
            '_private' => [          // Using "_private" keyword, all data inside this array will be made private
                'active' => [       // Using "active" keyword inside "_private", you select active player(s)
                    'events' => $events,   // will be send only to active player(s)
                ]
            ],
        ];
    }
*/

    function argChooseAction() {
        $playerId = intval(self::getActivePlayerId());

        $canPass = false;
        return [
            'canPass' => $canPass,
        ];
    }

    function argSwapEvent() {
        $playerId = intval(self::getActivePlayerId());
        $situation = $this->dbGetLastContextToResolve();
        $cardId = $situation["param1"];
        $festId = $situation["param2"];
        $mandatory = $this->getEventsOnFestival($festId);
        $mandatory = array_values(array_filter($mandatory, fn ($c) => $c->id != $cardId));
        $possible = $this->getEventsOnFestivals();
        unset($possible[$festId]);
        return [
            'mandatoryFestivalId' => $festId,
            'mandatoryCardAmong' => $mandatory,
            'selectableCardsByFestival' => $possible,
        ];
    }

    function argDiscardEvent() {
        $playerId = intval(self::getActivePlayerId());
        $situation = $this->dbGetLastContextToResolve();
        $festId = $situation["param2"];
        return [
            'selectableCardsByFestival' => [$festId => $this->getEventsOnFestival($festId)],
        ];
    }
    function argReplaceTicket() {
        $playerId = intval(self::getActivePlayerId());

        $canPass = false;
        return [
            'canPass' => $canPass,
        ];
    }
    function argSwapTicket() {
        $playerId = intval(self::getActivePlayerId());

        $canPass = false;
        return [
            'canPass' => $canPass,
        ];
    }
}
