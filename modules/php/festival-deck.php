<?php

require_once(__DIR__ . '/objects/festival.php');

trait FestivalDeckTrait {

    /**
     * Create cards.
     */
    public function createFestivals() {
        $cards = $this->getFestivalsToGenerate();
        $this->festivals->createCards($cards, 'deck');
        $this->dealFestivals();
    }

    /**
     * Deal festivals according to their column.
     */
    public function dealFestivals() {
        $festivals = $this->getFestivalsFromDb($this->festivals->getCardsInLocation("deck", null, "card_type_arg"));
        foreach ($festivals as $i => $festival) {
            $this->festivals->moveCard($festival->id, "festival", $i + 1);
        }
    }

    public function isFestivalSoldOut($festivalId) {
        $festival = $this->getFestivalFromDb($this->festivals->getCard($festivalId));
        $events = $this->getEventsOnFestival($festivalId);
        $modifier = $this->isEventOnFestival($festivalId, 7);
        return $festival->cardsCount + ($modifier ? 1 : 0) === count($events);
    }

    public function getFestivals() {
        return $this->getFestivalsFromDb($this->festivals->getCardsInLocation("festival", null, "card_type_arg"));
    }
}
