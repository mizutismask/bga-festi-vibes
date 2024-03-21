<?php

trait ExpansionTrait {

    /**
     * List the destination tickets that will be used for the game.
     */
    function getEventsToGenerate() {
        $cards = [];
        $expansion = EXPANSION;

        switch ($expansion) {
            default:
                foreach ($this->EVENTS[1] as $typeArg => $card) {
                    $cards[] = ['type' => 1, 'type_arg' => $typeArg, 'nbr' => 1];
                }
                break;
        }

        return $cards;
    }

    /**
     * Return the number of events cards shown at the beginning.
     */
    function getInitialEventCardNumber(): int {
        $playerCount = $this->getPlayerCount();
        switch (EXPANSION) {
            default:
                return 3;
        }
    }

    /**
     * Return the minimum number of events cards to keep at the beginning.
     */
    function getInitialDestinationMinimumKept() {
        switch (EXPANSION) {
            default:
                return 2;
        }
    }

    /**
     * Return the number of events cards shown at pick destination action.
     */
    function getAdditionalDestinationCardNumber() {
        switch (EXPANSION) {
            default:
                return 2;
        }
    }
}
