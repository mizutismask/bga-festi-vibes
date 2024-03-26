<?php

trait ContextTrait {

    function resolveLastContextIfAction($action) {
        $context = $this->dbGetLastContextToResolve();
        if ($context && $context["action"] == $action) {
            $this->dbResolveContextLog($context["id"]);
            //self::dump('*******************Context just resolved', $context);
        } else {
            //self::dump('*******************Last context not as expected', $action);
        }
    }

    function changeNextStateFromContext() {
        $nextState = "";
        $situation = $this->dbGetLastContextToResolve();
        //self::dump('******************situation*', $situation);
        if (!$situation) {
            $nextState = "nextPlayer";
        } else {
            switch ($situation["action"]) {
                case ACTION_PLAY_CARD: //main action
                    $nextState = "nextPlayer";
                    $cardAction = $situation["param3"];
                    if ($cardAction && $this->isActionPossible($situation)) {
                        $this->dbInsertContextLog($cardAction, $situation["param1"], $situation["param2"], $situation["param3"]);
                        $nextState = $cardAction;
                    } else {
                        $this->dbResolveContextLog($situation["id"]);
                    }

                    break;
                case ACTION_PLAY_TICKET:
                    $nextState = "nextPlayer";
                    $this->dbResolveContextLog($situation["id"]);
                    break;

                default:
                    # code...
                    break;
            }
        }

        self::dump('******************nextState*', $nextState);
        $this->gamestate->nextState($nextState);
    }

    function isActionPossible($situation) {
        $action = $situation["param3"];
        $playedCardId = $situation["param1"];
        $festivalId = $situation["param2"];
        $playerId = $situation["player"];
        switch ($action) {
            case ACTION_INC_FESTIVAL_SIZE:
            case NO_ACTION:
                return false; //nothing to do
                break;
            case ACTION_SWAP_EVENT:
                $evtsByFest = $this->getEventsOnFestivals();
                return count($evtsByFest[$festivalId]) > 1 && $this->array_some(array_keys($evtsByFest), fn ($festId) => $festId != $festivalId && count($evtsByFest[$festId]) > 0);
                break;
            case ACTION_DISCARD_EVENT:
                return true;
                break;
            case ACTION_REPLACE_TICKET:
                $color = $this->getPlayerColor($playerId);
                return $this->hasTicketInHand($playerId) && $this->array_some($this->getTicketsOnFestival($festivalId), fn ($t) => $t->type_arg != $this->getColorFromHexValue($color));
                break;
            case ACTION_SWAP_MY_TICKET:
                $color = $this->getPlayerColor($playerId);
                $ticketsByFest = $this->getTicketsOnFestivals();
                return $this->hasTicketInHand($playerId) && $this->array_some(array_keys($ticketsByFest), fn ($festId) => $festId != $festivalId && $this->array_some($ticketsByFest[$festId], fn ($t) => $t->type_arg != $this->getColorFromHexValue($color)));
                break;
            case ACTION_SWAP_ANY_TICKETS:
                $color = $this->getPlayerColor($playerId);
                $ticketsByFest = $this->getTicketsOnFestivals();
                return $this->doesFestivalHaveTicket($ticketsByFest, $festivalId)  && $this->doesOtherFestivalHaveTicket($ticketsByFest, $festivalId);
                break;
            case ACTION_SWAP_EVENT_WITH_HAND:
                return count($this->getPlayerEvents($playerId)) > 0 && count($this->getEventsOnFestival($festivalId)) > 0;
                break;
            default:
                throw new BgaVisibleSystemException(self::_("This action does not exist " . $action));
                break;
        }
        // return true;
    }

    function doesFestivalHaveTicket($ticketsByFest, $festivalId) {
        return $this->array_some(array_keys($ticketsByFest), fn ($festId) => $festId == $festivalId && isset($ticketsByFest[$festId]) && count($ticketsByFest[$festId]) > 0);
    }

    function doesOtherFestivalHaveTicket($ticketsByFest, $notThisFestivalId) {
        return $this->array_some(array_keys($ticketsByFest), fn ($festId) => $festId != $notThisFestivalId && isset($ticketsByFest[$festId]) && count($ticketsByFest[$festId]) > 0);
    }

    function dbInsertContextLog($action, $param1 = null, $param2 = null, $param3 = null) {
        $state = $this->gamestate->state()["name"];
        $player = $this->getMostlyActivePlayerId();
        $values[] = "( '$player', '$state', '$action', '$param1', '$param2', '$param3')";
        $sql = "INSERT INTO context_log (player, state, action, param1, param2, param3)";
        $sql .= " VALUES " . implode(",", $values);
        $this->DbQuery($sql);
    }

    function dbResolveContextLog($contextId) {
        if (!$contextId) {
            $this->error("resolve context log can not be called with an undefined id");
        } else {
            $value = 1;
            $sql = "UPDATE context_log SET resolved = '$value' WHERE id = $contextId";
            self::DbQuery($sql);
        }
    }

    function dbGetLastContextToResolve($count = 1) {
        $positiveCount = $count <= 0 ? 1 : $count;
        $sql = "select * from context_log where resolved = 0 order by id desc limit $positiveCount";
        $res = self::getObjectListFromDB($sql);
        if ($count == 1 && count($res)) return $res[0];
        return $res;
    }

    function dbGetLastResolvedContext() {
        $sql = "select * from context_log where resolved = 1 order by id desc limit 1";
        $res = self::getObjectListFromDB($sql);
        if (count($res)) return $res[0];
        return $res;
    }
}
