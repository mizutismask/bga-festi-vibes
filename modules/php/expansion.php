<?php

trait ExpansionTrait {

    /**
     * List the destination tickets that will be used for the game.
     */
    function getDestinationToGenerate() {
        $destinations = [];
        $expansion = EXPANSION;

        switch ($expansion) {
            default:
                foreach ($this->DESTINATIONS[1] as $typeArg => $destination) {
                    if ($typeArg != 0) {//starting point is excluded
                        $destinations[] = ['type' => 1, 'type_arg' => $typeArg, 'nbr' => 1];
                    }
                }
                break;
        }

        return $destinations;
    }

    /**
     * Return the number of destinations cards shown at the beginning.
     */
    function getInitialDestinationCardNumber(): int {
        $playerCount = $this->getPlayerCount();
        switch (EXPANSION) {
            default:
                if ($playerCount == 2 || $playerCount == 3)
                    return 12;
                return 9;
        }
    }

    /**
     * Return the minimum number of destinations cards to keep at the beginning.
     */
    function getInitialDestinationMinimumKept() {
        switch (EXPANSION) {
            default:
                return 2;
        }
    }

    /**
     * Return the number of destinations cards shown at pick destination action.
     */
    function getAdditionalDestinationCardNumber() {
        switch (EXPANSION) {
            default:
                return 2;
        }
    }
}
