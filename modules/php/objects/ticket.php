<?php

/**
 * A TicketInfo is the graphic representation of a card (with additional informations on it).
 */
class TicketInfo {
    //public int $cardsCount;
  
   /* public function __construct(int $cardsCount) {
       // $this->cardsCount = $cardsCount;
    } */
    public function __construct() {
       // $this->cardsCount = $cardsCount;
    } 
}

/**
 * A TicketCard is a physical card. It contains informations from matching TicketCard, with technical informations like id and location.
 * Location : hand or festival_id
 * Location arg : order
 * Type : 1 
 * Type arg : color
 */
class TicketCard extends TicketInfo {
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
        //$card = $FESTIVALS[$this->type][$this->type_arg];
       // $this->cardsCount = $card->cardsCount;
    } 
}
?>
