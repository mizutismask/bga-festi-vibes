<?php
//require_once(__DIR__ . '/objects/destination.php');
//require_once(__DIR__ . '/objects/route.php');

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////
    /*function getColorName(int $color) {
        switch ($color) {
            case BLUE:
                return clienttranslate("blue");
            case YELLOW:
                return clienttranslate("yellow");
            case RED:
                return clienttranslate("red");
        }
    }*/

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if ($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_index(array $array, callable $fn) {
        foreach ($array as $index => $value) {
            if ($fn($value)) {
                return $index;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if ($fn($value)) {
                return true;
            }
        }
        return false;
    }

    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if (!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Save (insert or update) any object/array as variable.
     */
    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    /**
     * Return a variable object/array.
     * To force object/array type, set $asArray to false/true.
     */
    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    /**
     * Delete a variable object/array.
     */
    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function incGlobalVariable(string $globalVariableName, int $value) {
        $old = $this->getGameStateValue($globalVariableName);
        $this->setGameStateValue($globalVariableName, $old + $value);
    }

    /**
     * Transforms a Destination Db object to Destination class.
     */
    /* function getDestinationFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Destination doesn't exists " . json_encode($dbObject));
        }

        //self::dump('************type_arg*******', $dbObject["type_arg"]);
        //self::dump('*******************', $this->DESTINATIONS[$dbObject["type"]][$dbObject["type_arg"]]);
        return new Destination($dbObject, $this->DESTINATIONS);
    }*/

    /**
     * Transforms a Destination Db object array to Destination class array.
     */
    function getDestinationsFromDb(array $dbObjects) {
        return array_map(fn ($dbObject) => $this->getDestinationFromDb($dbObject), array_values($dbObjects));
    }

    /**
     * Transforms a ClaimedRoute json decoded object to ClaimedRoute class.
     */
    /* function getClaimedRouteFromGlobal($dbObject) {
        //self::dump('*******************getClaimedRouteFromGlobal', $dbObject);
        if (
            $dbObject === null
        ) {
            return null;
        }
        if (!$dbObject) {
            throw new BgaSystemException("Claimed route doesn't exists " . json_encode($dbObject));
        }

        $class = new ClaimedRoute([]);
        foreach ($dbObject as $key => $value) $class->{$key} = $value;
        return $class;
    }*/


    function getNonZombiePlayersIds() {
        $sql = "SELECT player_id FROM player WHERE player_eliminated = 0 AND player_zombie = 0 ORDER BY player_no";
        $dbResults = self::getCollectionFromDB($sql);
        return array_map(fn ($dbResult) => intval($dbResult['player_id']), array_values($dbResults));
    }

    /**
     *
     * @return integer player position (as player_no) from database
     */
    function getPlayerPosition($player_id) {
        $players = $this->loadPlayersBasicInfos();
        if (!isset($players[$player_id])) {
            return -1;
        }
        return $players[$player_id]['player_no'];
    }

    public function getStateName() {
        $state = $this->gamestate->state();
        return $state['name'];
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerIdsInOrder($starting) {
        $player_ids = $this->getPlayersIds();
        $rotate_count = array_search($starting, $player_ids);
        if ($rotate_count === false) {
            return $player_ids;
        }
        for ($i = 0; $i < $rotate_count; $i++) {
            array_push($player_ids, array_shift($player_ids));
        }
        //var_dump("getPlayerIdsInOrder()",$player_ids); 
        return $player_ids;
    }

    function getPlayerCount() {
        return count($this->getPlayersIds());
    }

    function getPlayerIdByOrder($playerOrder = 1) {
        return $this->getUniqueIntValueFromDB("SELECT player_id FROM player where `player_no` = $playerOrder");
    }

    function getLastPlayer() {
        return $this->getPlayerIdByOrder($this->getPlayerCount());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDb("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function isLastPlayer(int $playerId) {
        return $this->getLastPlayer() == $playerId;
    }

    function getPlayerScore(int $playerId) {
        return $this->getUniqueIntValueFromDB("SELECT player_score FROM player where `player_id` = $playerId");
    }

    function incPlayerScore(int $playerId, int $delta, $message = null, $messageArgs = []) {
        self::DbQuery("UPDATE player SET `player_score` = `player_score` + $delta where `player_id` = $playerId");

        self::notifyAllPlayers('points', $message !== null ? $message : '', [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'points' => $this->getPlayerScore($playerId),
            'delta' => $delta,
        ] + $messageArgs);
    }

    function updatePlayer(int $playerId, String $field, int $newValue) {
        $this->DbQuery("UPDATE player SET $field = $newValue WHERE player_id = $playerId");
    }

    function updatePlayersExceptOne(int $playerId, String $field, int $newValue) {
        $this->DbQuery("UPDATE player SET $field = $newValue WHERE player_id != $playerId");
    }

    function getPlayerFieldValue(int $playerId, String $field) {
        return self::getUniqueValueFromDB("select $field from player WHERE player_id = $playerId");
    }

    /**
     * Auto initialize stats. Note for this to work your game stats ids have to be prefixed by game_ (verbatim)
     */
    public function initStats() {
        $all_stats = $this->getStatTypes();
        $player_stats = $all_stats['player'];
        // auto-initialize all stats that starts with game_
        // we need a prefix because there is some other system stuff
        foreach ($player_stats as $key => $value) {
            if ($this->startsWith($key, 'game_')) {
                $this->initStat('player', $key, 0);
            }
            if ($key === 'turns_number') {
                $this->initStat('player', $key, 0);
            }
        }
        $table_stats = $all_stats['table'];
        foreach ($table_stats as $key => $value) {
            if ($this->startsWith($key, 'game_')) {
                $this->initStat('table', $key, 0);
            }
            if ($key === 'turns_number') {
                $this->initStat('table', $key, 0);
            }
        }
    }

    /*
     * @Override to trim, because debugging does not work well with spaces (i.e. not at all).
     * cannot override debugChat because 'say' calling it statically
     */
    function say($message) {
        if ($this->isStudio()) {
            if ($this->debugChat(trim($message)))
                $message = ":$message";
        }
        return parent::say($message);
    }

    // Debug from chat: launch a PHP method of the current game for debugging purpose
    function debugChat($message) {
        $res = [];
        preg_match("/^(.*)\((.*)\)$/", $message, $res);
        if (count($res) == 3) {
            $method = $res[1];
            $args = explode(',', $res[2]);
            foreach ($args as &$value) {
                if ($value === 'null') {
                    $value = null;
                } else if ($value === '[]') {
                    $value = [];
                }
            }
            if (method_exists($this, $method)) {
                self::notifyAllPlayers('simplenotif', "DEBUG: calling $message", []);
                $ret = call_user_func_array(array($this, $method), $args);
                if ($ret !== null)
                    $this->debugConsole("RETURN: $method ->", $ret);
                return true;
            } else {
                self::notifyPlayer($this->getCurrentPlayerId(), 'simplenotif', "DEBUG: running $message; Error: method $method() does not exists", []);
                return true;
            }
        }
        return false;
    }


    function isStudio() {
        return ($this->getBgaEnvironment() == 'studio');
    }

    function debugConsole($info, $args = array()) {
        $this->notifyAllPlayers("log", '', ['log' => $info, 'args' => $args]);
        $this->warn($info);
    }

    function startsWith(string $haystack, string $needle): bool {
        // search backwards starting from haystack length characters from the end
        return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== false;
    }

    function endsWith(string $haystack, string  $needle): bool {
        $length = strlen($needle);
        return $length === 0 || (substr($haystack, -$length) === $needle);
    }

    function getPart(string $haystack, int $i, bool $noException = false): string {
        $parts = explode('_', $haystack);
        $len = count($parts);
        if ($noException && $i >= $len)
            return "";
        if ($noException && $len + $i < 0)
            return "";

        return $parts[$i >= 0 ? $i : $len + $i];
    }

    function getPartsPrefix(string $haystack, int $i) {
        $parts = explode('_', $haystack);
        $len = count($parts);
        if ($i < 0) {
            $i = $len + $i;
        }
        if ($i <= 0)
            return '';
        for (; $i < $len; $i++) {
            unset($parts[$i]);
        }
        return implode('_', $parts);
    }

    function toJson($data, $options = JSON_PRETTY_PRINT) {
        $json_string = json_encode($data, $options);
        return $json_string;
    }

    function array_value_get($array, $field, $default = null) {
        if (array_key_exists($field, $array)) {
            return $array[$field];
        } else {
            return $default;
        }
    }
    function array_value_inc(&$array, $field, $inc = 1) {
        if (array_key_exists($field, $array)) {
            $array[$field] += $inc;
        } else {
            $array[$field] = $inc;
        }
    }

    function getUniqueIntValueFromDB(string $sql) {
        return intval(self::getUniqueValueFromDB($sql));
    }

    function getUniqueBoolValueFromDB(string $sql) {
        return boolval(self::getUniqueValueFromDB($sql));
    }

    function dbIncField(String $table, String $field, int $value, String $pkfield, String $key) {
        $this->DbQuery("UPDATE $table SET $field = $field+$value WHERE $pkfield = '$key'");
    }

    function getColoredGameStateValue($gameStateValue, $color) {
        return $this->getGameStateValue($gameStateValue . "_" . strtoupper($this->getColorName($color)));
    }

    public function checkVersion(int $clientVersion): void {
        if ($clientVersion != intval($this->gamestate->table_globals[300])) {
            throw new BgaVisibleSystemException(self::_("A new version of this game is now available. Please reload the page (F5)."));
        }
    }

    /**
     * This will throw an exception if condition is false.
     * The message should be translated and shown to the user.
     *
     * @param $message string
     *            user side error message, translation is needed, use self::_() when passing string to it
     * @param $cond boolean condition of assert
     * @param $log string optional log message, not need to translate
     * @throws BgaUserException
     */
    function userAssertTrue($message, $cond = false, $log = "") {
        if ($cond)
            return;
        if ($log)
            $this->warn("$message $log|");
        throw new BgaUserException($message);
    }

    /**
     * This will throw an exception if condition is false.
     * This only can happened if user hacks the game, client must prevent this
     *
     * @param $log string
     *            server side log message, no translation needed
     * @param $cond boolean condition of assert
     * @throws BgaUserException
     */
    function systemAssertTrue($log, $cond = false) {
        if ($cond)
            return;
        $move = $this->getGameStateValue(GS_PLAYER_TURN_NUMBER);
        $this->error("Internal Error during move $move: $log|");
        $e = new Exception($log);
        $this->error($e->getTraceAsString());
        throw new BgaUserException(self::_("Internal Error. That should not have happened. Please raise a bug."));
    }

    function notifyWithName($type, $message = '', $args = null, $player_id = -1) {
        if ($args == null)
            $args = array();
        $this->systemAssertTrue("Invalid notification signature", is_array($args));
        if (array_key_exists('playerId', $args) && $player_id == -1) {
            $player_id = $args['playerId'];
        }
        if ($player_id == -1)
            $player_id = $this->getMostlyActivePlayerId();
        if ($player_id != 'all')
            $args['player_id'] = $player_id;
        if ($message) {
            $player_name = $this->getPlayerName($player_id);
            $args['player_name'] = $player_name;
        }
        if (array_key_exists('_notifType', $args)) {
            $type = $args['_notifType'];
            unset($args['_notifType']);
        }
        if ($this->array_value_get($args, 'noa', false) || $this->array_value_get($args, 'nop', false) || $this->array_value_get($args, 'nod', false)) {
            $type .= "Async";
        }
        if (array_key_exists('_private', $args) && $args['_private']) {
            unset($args['_private']);
            $this->notifyPlayer($player_id, $type, $message, $args);
        } else {
            $this->notifyAllPlayers($type, $message, $args);
        }
    }

    function getMostlyActivePlayerId() {
        $state = $this->gamestate->state();
        if ($state['type'] === "multipleactiveplayer") {
            return $this->getCurrentPlayerId();
        } else {
            return $this->getActivePlayerId();
        }
    }

    function getMostlyActivePlayerOrder() {
        return $this->getPlayerPosition($this->getMostlyActivePlayerId());
    }
}
