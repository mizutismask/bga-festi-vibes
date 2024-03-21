<?php

/*
 * BGA constants 
 */
define("GS_PLAYER_TURN_NUMBER", 'playerturn_nbr');

/*
 * Custom framework constants
 */
const MATERIAL_TYPE_CARD = "CARD";
const MATERIAL_TYPE_TOKEN = "TOKEN";
const MATERIAL_TYPE_FIRST_PLAYER_TOKEN = "FIRST_PLAYER_TOKEN";

const MATERIAL_LOCATION_HAND = "HAND";
const MATERIAL_LOCATION_DECK = "DECK";
const MATERIAL_LOCATION_STOCK = "STOCK";

/* 
 * Game constants 
 */
//define('INITIAL_ARROW_COUNT', 45);


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

define('LAST_TURN', 'LAST_TURN');


/*
 * Global variables (objects)
 */
//define('LAST_BLUE_ROUTES', 'LAST_BLUE_ROUTES'); //array of the 3 last arrows

/*
    Stats
*/
//define('STAT_POINTS_WITH_PLAYER_COMPLETED_DESTINATIONS', 'pointsWithPlayerCompletedDestinations');
