<?php

/**
 * A EventInfo is the graphic representation of a card (informations on it : points, actions).
 */
class EventInfo {
    public int $points;
    public string $action;
  
    public function __construct(int $points,string $action) {
        $this->points = $points;
        $this->action = $action;
    } 
}

/**
 * A EventCard is a physical card. It contains informations from matching EventCard, with technical informations like id and location.
 * Location : deck or hand or festival_id
 * Location arg : order (in deck), playerId (in hand), order (in festival)
 * Type : 1 
 * Type arg : the card type (EventCard id)
 */
class EventCard extends EventInfo {
    public int $id;
    public string $location;
    public int $location_arg;
    public int $type;
    public int $type_arg;

    public function __construct($dbCard, $EVENTS) {
        array_key_exists('id', $dbCard) ? $this->id = intval($dbCard['id']):null;
        array_key_exists('location', $dbCard) ? $this->location = $dbCard['location']:null;
        array_key_exists('location_arg', $dbCard) ? $this->location_arg = intval($dbCard['location_arg']):null;
        array_key_exists('type', $dbCard) ? $this->type = intval($dbCard['type']):null;
        array_key_exists('type_arg', $dbCard) ? $this->type_arg = intval($dbCard['type_arg']):null;
        $card = $EVENTS[$this->type][$this->type_arg];
        $this->points = $card->points;
        $this->action = $card->action;
    } 
}
?>
