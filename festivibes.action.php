<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * Festivibes implementation : © Séverine Kamycki <mizutismask@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * festivibes.action.php
 *
 * Festivibes main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/festivibes/festivibes/myAction.html", ...)
 *
 */


class action_festivibes extends APP_GameAction {
    // Constructor: please do not modify
    public function __default() {
        if (self::isArg('notifwindow')) {
            $this->view = "common_notifwindow";
            $this->viewArgs['table'] = self::getArg("table", AT_posint, true);
        } else {
            $this->view = "festivibes_festivibes";
            self::trace("Complete reinitialization of board game");
        }
    }

    private function checkVersion() {
        $clientVersion = (int) self::getArg('version', AT_int, false);
        $this->game->checkVersion($clientVersion);
    }

    public function placeTicket() {
        self::setAjaxMode();
        self::checkVersion();

        $festivalId = self::getArg("festivalId", AT_posint, true);
        $slotId = self::getArg("slotId", AT_posint, true);

        $this->game->placeTicket($festivalId, $slotId);

        self::ajaxResponse();
    }

    public function playCard() {
        self::setAjaxMode();
        self::checkVersion();

        $festivalId = intval(self::getArg("festivalId", AT_posint, true));
        $cardId = intval(self::getArg("cardId", AT_posint, true));

        $this->game->playCard($cardId, $festivalId);

        self::ajaxResponse();
    }

    public function discardEvent() {
        self::setAjaxMode();
        self::checkVersion();

        $cardId = intval(self::getArg("cardId", AT_posint, true));

        $this->game->discardEvent($cardId);

        self::ajaxResponse();
    }

    public function pass() {
        self::setAjaxMode();
        self::checkVersion();

        $this->game->pass();

        self::ajaxResponse();
    }
}
