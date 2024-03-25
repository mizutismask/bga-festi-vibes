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
 * states.inc.php
 *
 * Festivibes game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!
require_once("modules/php/constants.inc.php");
 
$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => ST_DEAL_INITIAL_SETUP]
    ],

    ST_DEBUG_END_GAME => [
        "name" => "debugGameEnd",
        "description" => clienttranslate("Debug end of game"),
        "type" => "manager",
        "args" => "argGameEnd",
        "transitions" => ["endGame" => ST_END_GAME],
    ],

    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];

$playerActionsGameStates = [

    ST_PLAYER_CHOOSE_ACTION => [
        "name" => "chooseAction",
        "description" => clienttranslate('${actplayer} must play a card or place a ticket on a festival'),
        "descriptionmyturn" => clienttranslate('${you} must play a card or place a ticket on a festival'),
        "type" => "activeplayer",
        "args" => "argChooseAction",
        "possibleactions" => [
            "placeTicket", "playCard"
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
            ACTION_SWAP_EVENT => ST_PLAYER_SWAP_EVENT,
            ACTION_SWAP_EVENT_WITH_HAND => ST_PLAYER_SWAP_EVENT_WITH_HAND,
            ACTION_DISCARD_EVENT => ST_PLAYER_DISCARD_EVENT,
            ACTION_REPLACE_TICKET => ST_PLAYER_REPLACE_TICKET,
            ACTION_SWAP_MY_TICKET => ST_PLAYER_SWAP_TICKET,
            ACTION_SWAP_ANY_TICKETS => ST_PLAYER_SWAP_TICKET,
        ]
    ],

    ST_PLAYER_SWAP_EVENT => [
        "name" => "swapEvent",
        "description" => clienttranslate('${actplayer} must swap events from the column he just played to another one'),
        "descriptionmyturn" => clienttranslate('${you} must swap events from the column you just played to another one'),
        "type" => "activeplayer",
        "args" => "argSwapEvent",
        "possibleactions" => [
            "swapEvent", 
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_SWAP_EVENT_WITH_HAND => [
        "name" => "swapEventWithHand",
        "description" => clienttranslate('${actplayer} must swap an event from the column he just played with one in his hand'),
        "descriptionmyturn" => clienttranslate('${you} must swap an event from the column you just played with one in your hand'),
        "type" => "activeplayer",
        "args" => "argSwapEventWithHand",
        "possibleactions" => [
            "swapEventWithHand",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_DISCARD_EVENT => [
        "name" => "discardEvent",
        "description" => clienttranslate('${actplayer} must discard an event from the column he just played'),
        "descriptionmyturn" => clienttranslate('${you} must discard an event from the column you just played'),
        "type" => "activeplayer",
        "args" => "argDiscardEvent",
        "possibleactions" => [
            "discardEvent", 
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_REPLACE_TICKET => [
        "name" => "replaceTicket",
        "description" => clienttranslate('${actplayer} must replace another players’s ticket with one of his own (not played yet)'),
        "descriptionmyturn" => clienttranslate('${you} must replace another players’s ticket with one of your own (not played yet)'),
        "type" => "activeplayer",
        "args" => "argReplaceTicket",
        "possibleactions" => [
            "replaceTicket", 
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_SWAP_TICKET => [
        "name" => "swapTicket",
        "description" => clienttranslate('${actplayer} must swap tickets from the column he just played with another one'),
        "descriptionmyturn" => clienttranslate('${you} must swap tickets from the column you just played with another one'),
        "descriptionMyTicket" => clienttranslate('${actplayer} must swap his own ticket from the column he just played with another one'),
        "descriptionmyturnMyTicket" => clienttranslate('${you} must swap his own ticket from the column you just played with another one'),
        "type" => "activeplayer",
        "args" => "argSwapTicket",
        "possibleactions" => [
            "swapTicket", 
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],
];

$gameGameStates = [
    ST_DEAL_INITIAL_SETUP => [
        "name" => "dealInitialSetup",
        "description" => "",
        "type" => "game",
        "action" => "stDealInitialSetup",
        "transitions" => [
            "" => ST_NEXT_PLAYER,
        ],
    ],

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => [
            "nextPlayer" => ST_PLAYER_CHOOSE_ACTION,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [
            "endGame" => ST_END_GAME,
            "debugEndGame" => ST_DEBUG_END_GAME,
        ],
    ],
];

$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;



