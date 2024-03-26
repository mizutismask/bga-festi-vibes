<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * Festivibes implementation : © Séverine Kamycki <mizutismask@gmail.com>
 * 
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * material.inc.php
 *
 * Festivibes game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

$this->EVENTS = [
  1 => [
    1 => new EventInfo(1, ACTION_REPLACE_TICKET),
    2 => new EventInfo(1, ACTION_SWAP_MY_TICKET),
    3 => new EventInfo(1, ACTION_DISCARD_EVENT),
    4 => new EventInfo(1, ACTION_SWAP_EVENT),
    5 => new EventInfo(1, ACTION_SWAP_ANY_TICKETS),
    6 => new EventInfo(1, ACTION_SWAP_ANY_TICKETS),

    7 => new EventInfo(2, ACTION_INC_FESTIVAL_SIZE),
    8 => new EventInfo(2, ACTION_SWAP_ANY_TICKETS),
    9 => new EventInfo(2, ACTION_SWAP_ANY_TICKETS),
    10 => new EventInfo(2, NO_ACTION),
    11 => new EventInfo(2, NO_ACTION),

    12 => new EventInfo(3, NO_ACTION),
    13 => new EventInfo(3, NO_ACTION),
    14 => new EventInfo(3, NO_ACTION),
    15 => new EventInfo(3, NO_ACTION),

    16 => new EventInfo(4, ACTION_SWAP_ANY_TICKETS),
    17 => new EventInfo(4, NO_ACTION),

    18 => new EventInfo(-1, ACTION_SWAP_ANY_TICKETS),
    19 => new EventInfo(-1, ACTION_DISCARD_EVENT),

    20 => new EventInfo(-2, ACTION_SWAP_EVENT),
    21 => new EventInfo(-2, ACTION_SWAP_EVENT),
    22 => new EventInfo(-2, ACTION_SWAP_EVENT),

    23 => new EventInfo(-3, ACTION_SWAP_EVENT_WITH_HAND),
    24 => new EventInfo(-3, NO_ACTION),

    25 => new EventInfo(-4, NO_ACTION),

    26 => new EventInfo(-5, NO_ACTION),
  ]
];

$this->FESTIVALS = [
  1 => [
    1 => new FestivalInfo(2),
    2 => new FestivalInfo(2),
    3 => new FestivalInfo(3),
    4 => new FestivalInfo(3),
    5 => new FestivalInfo(4),
    6 => new FestivalInfo(5),
  ]
];

$this->FESTIVALS_2PLAYERS = [
  1 => [
    1 => new FestivalInfo(2),
    3 => new FestivalInfo(3),//do not change indexes
    4 => new FestivalInfo(3),
    5 => new FestivalInfo(4),
    6 => new FestivalInfo(5),
  ]
];

$this->TICKETS = [
  1 => [
    1 => new TicketInfo(),
    2 => new TicketInfo(),
    3 => new TicketInfo(),
    4 => new TicketInfo(),
  ]
];
