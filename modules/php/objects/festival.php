<?php

/**
 * A FestivalInfo is the graphic representation of a card (with additional informations on it).
 */
class FestivalInfo {
    public int $cardsCount;
  
    public function __construct(int $cardsCount) {
        $this->cardsCount = $cardsCount;
    } 
}

/**
 * A FestivalCard is a physical card. It contains informations from matching FestivalCard, with technical informations like id and location.
 * Location : deck or festival_id
 * Location arg : 1 on front side, 0 on back side
 * Type : 1 
 * Type arg : the card type (FestivalCard id)
 */
class FestivalCard extends FestivalInfo {
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
        $card = $FESTIVALS[$this->type][$this->type_arg];
        $this->cardsCount = $card->cardsCount;
    } 
}
?>
