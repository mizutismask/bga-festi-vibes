<?php

/*
 * BGA constants 
 */
define("GS_PLAYER_TURN_NUMBER", 'playerturn_nbr');

/*
 * Custom framework constants
 */
const MATERIAL_TYPE_TICKET = "TICKET";
const MATERIAL_TYPE_EVENT = "EVENT";
const MATERIAL_TYPE_FESTIVAL = "FESTIVAL";

const MATERIAL_LOCATION_HAND = "HAND";
const MATERIAL_LOCATION_DECK = "DECK";
const MATERIAL_LOCATION_STOCK = "STOCK";
const MATERIAL_LOCATION_FESTIVAL = "FESTIVAL";

/* 
 * Game constants 
 */
const ACTION_SWAP_ANY_TICKETS = "ACTION_SWAP_ANY_TICKETS";
const ACTION_SWAP_MY_TICKET = "ACTION_SWAP_MY_TICKET";
const ACTION_REPLACE_TICKET = "ACTION_REPLACE_TICKET";
const ACTION_SWAP_EVENT = "ACTION_SWAP_EVENT";
const ACTION_DISCARD_EVENT = "ACTION_DISCARD_EVENT";
const ACTION_INC_FESTIVAL_SIZE = "ACTION_INC_FESTIVAL_SIZE";
const ACTION_SWAP_EVENT_WITH_HAND = "ACTION_SWAP_EVENT_WITH_HAND";
const NO_ACTION = "NO_ACTION";

const PINK = 1;
const RED = 2;
const YELLOW = 3;
const BROWN = 4;

const PLAYER_COLORS = [
    YELLOW => "fbbd0a",
    RED => "f04623",
    PINK => "de71c0",
    BROWN => "8a4921",
];


/**
 * Options
 */
define('EXPANSION', 0); // 0 => base game

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);
define('ST_DEAL_INITIAL_SETUP', 10);

define('ST_PLAYER_CHOOSE_ACTION', 30);

define('ST_NEXT_PLAYER', 80);
define('ST_NEXT_REVEAL', 81);

define('ST_DEBUG_END_GAME', 97);
define('ST_END_SCORE', 98);

define('ST_END_GAME', 99);
define('END_SCORE', 100);


/*
 * Variables (numbers)
 */


/*
 * Global variables (objects)
 */
//define('LAST_BLUE_ROUTES', 'LAST_BLUE_ROUTES'); //array of the 3 last arrows

/*
    Stats
*/
//define('STAT_POINTS_WITH_PLAYER_COMPLETED_DESTINATIONS', 'pointsWithPlayerCompletedEvents');
