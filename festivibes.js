var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
function throttle(callback, delay) {
    var last;
    var timer;
    return function () {
        var context = this;
        var now = +new Date();
        var args = arguments;
        if (last && now < last + delay) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                callback.apply(context, args);
            }, delay);
        }
        else {
            last = now;
            callback.apply(context, args);
        }
    };
}
var advThrottle = function (func, delay, options) {
    if (options === void 0) { options = { leading: true, trailing: false }; }
    var timer = null, lastRan = null, trailingArgs = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timer) { //called within cooldown period
            lastRan = this; //update context
            trailingArgs = args; //save for later
            return;
        }
        if (options.leading) { // if leading
            func.call.apply(// if leading
            func, __spreadArray([this], args, false)); //call the 1st instance
        }
        else { // else it's trailing
            lastRan = this; //update context
            trailingArgs = args; //save for later
        }
        var coolDownPeriodComplete = function () {
            if (options.trailing && trailingArgs) { // if trailing and the trailing args exist
                func.call.apply(// if trailing and the trailing args exist
                func, __spreadArray([lastRan], trailingArgs, false)); //invoke the instance with stored context "lastRan"
                lastRan = null; //reset the status of lastRan
                trailingArgs = null; //reset trailing arguments
                timer = setTimeout(coolDownPeriodComplete, delay); //clear the timout
            }
            else {
                timer = null; // reset timer
            }
        };
        timer = setTimeout(coolDownPeriodComplete, delay);
    };
};
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this._zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', advThrottle(function () { return _this.zoomOrDimensionChanged(); }, this.throttleTime, { leading: true, trailing: true, }));
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        this.throttleTime = (_e = settings.throttleTime) !== null && _e !== void 0 ? _e : 100;
        window.addEventListener('resize', advThrottle(function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        }, this.throttleTime, { leading: true, trailing: true, }));
        if (window.ResizeObserver) {
            new ResizeObserver(advThrottle(function () { return _this.zoomOrDimensionChanged(); }, this.throttleTime, { leading: true, trailing: true, })).observe(settings.element);
        }
        if ((_f = this.settings.autoZoom) === null || _f === void 0 ? void 0 : _f.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ZoomManager.prototype, "zoomLevels", {
        /**
         * Returns the zoom levels
         */
        get: function () {
            return this._zoomLevels;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this._zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this._zoomLevels[this._zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Sets the available zoomLevels and new zoom to the provided values.
     * @param zoomLevels the new array of zoomLevels that can be used.
     * @param newZoom if provided the zoom will be set to this value, if not the last element of the zoomLevels array will be set as the new zoom
     */
    ZoomManager.prototype.setZoomLevels = function (zoomLevels, newZoom) {
        if (!zoomLevels || zoomLevels.length <= 0) {
            return;
        }
        this._zoomLevels = zoomLevels;
        var zoomIndex = newZoom && zoomLevels.includes(newZoom) ? this._zoomLevels.indexOf(newZoom) : this._zoomLevels.length - 1;
        this.setZoom(this._zoomLevels[zoomIndex]);
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this._zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     * Unsafe method as this is not protected by throttle. Surround with  `advThrottle(() => this.zoomOrDimensionChanged(), this.throttleTime, { leading: true, trailing: true, })` to avoid spamming recomputation.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this._zoomLevels[this._zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this._zoomLevels[0]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BgaHelpButton = /** @class */ (function () {
    function BgaHelpButton() {
    }
    return BgaHelpButton;
}());
var BgaHelpPopinButton = /** @class */ (function (_super) {
    __extends(BgaHelpPopinButton, _super);
    function BgaHelpPopinButton(settings) {
        var _this = _super.call(this) || this;
        _this.settings = settings;
        return _this;
    }
    BgaHelpPopinButton.prototype.add = function (toElement) {
        var _a;
        var _this = this;
        var button = document.createElement('button');
        (_a = button.classList).add.apply(_a, __spreadArray(['bga-help_button', 'bga-help_popin-button'], (this.settings.buttonExtraClasses ? this.settings.buttonExtraClasses.split(/\s+/g) : []), false));
        button.innerHTML = "?";
        if (this.settings.buttonBackground) {
            button.style.setProperty('--background', this.settings.buttonBackground);
        }
        if (this.settings.buttonColor) {
            button.style.setProperty('--color', this.settings.buttonColor);
        }
        toElement.appendChild(button);
        button.addEventListener('click', function () { return _this.showHelp(); });
    };
    BgaHelpPopinButton.prototype.showHelp = function () {
        var _a, _b, _c;
        var popinDialog = new window.ebg.popindialog();
        popinDialog.create('bgaHelpDialog');
        popinDialog.setTitle(this.settings.title);
        popinDialog.setContent("<div id=\"help-dialog-content\">".concat((_a = this.settings.html) !== null && _a !== void 0 ? _a : '', "</div>"));
        (_c = (_b = this.settings).onPopinCreated) === null || _c === void 0 ? void 0 : _c.call(_b, document.getElementById('help-dialog-content'));
        popinDialog.show();
    };
    return BgaHelpPopinButton;
}(BgaHelpButton));
var BgaHelpExpandableButton = /** @class */ (function (_super) {
    __extends(BgaHelpExpandableButton, _super);
    function BgaHelpExpandableButton(settings) {
        var _this = _super.call(this) || this;
        _this.settings = settings;
        return _this;
    }
    BgaHelpExpandableButton.prototype.add = function (toElement) {
        var _a;
        var _this = this;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        var folded = (_b = this.settings.defaultFolded) !== null && _b !== void 0 ? _b : true;
        if (this.settings.localStorageFoldedKey) {
            var localStorageValue = localStorage.getItem(this.settings.localStorageFoldedKey);
            if (localStorageValue) {
                folded = localStorageValue == 'true';
            }
        }
        var button = document.createElement('button');
        button.dataset.folded = folded.toString();
        (_a = button.classList).add.apply(_a, __spreadArray(['bga-help_button', 'bga-help_expandable-button'], (this.settings.buttonExtraClasses ? this.settings.buttonExtraClasses.split(/\s+/g) : []), false));
        button.innerHTML = "\n            <div class=\"bga-help_folded-content ".concat(((_c = this.settings.foldedContentExtraClasses) !== null && _c !== void 0 ? _c : '').split(/\s+/g), "\">").concat((_d = this.settings.foldedHtml) !== null && _d !== void 0 ? _d : '', "</div>\n            <div class=\"bga-help_unfolded-content  ").concat(((_e = this.settings.unfoldedContentExtraClasses) !== null && _e !== void 0 ? _e : '').split(/\s+/g), "\">").concat((_f = this.settings.unfoldedHtml) !== null && _f !== void 0 ? _f : '', "</div>\n        ");
        button.style.setProperty('--expanded-width', (_g = this.settings.expandedWidth) !== null && _g !== void 0 ? _g : 'auto');
        button.style.setProperty('--expanded-height', (_h = this.settings.expandedHeight) !== null && _h !== void 0 ? _h : 'auto');
        button.style.setProperty('--expanded-radius', (_j = this.settings.expandedRadius) !== null && _j !== void 0 ? _j : '10px');
        toElement.appendChild(button);
        button.addEventListener('click', function () {
            button.dataset.folded = button.dataset.folded == 'true' ? 'false' : 'true';
            if (_this.settings.localStorageFoldedKey) {
                localStorage.setItem(_this.settings.localStorageFoldedKey, button.dataset.folded);
            }
        });
    };
    return BgaHelpExpandableButton;
}(BgaHelpButton));
var HelpManager = /** @class */ (function () {
    function HelpManager(game, settings) {
        this.game = game;
        if (!(settings === null || settings === void 0 ? void 0 : settings.buttons)) {
            throw new Error('HelpManager need a `buttons` list in the settings.');
        }
        var leftSide = document.getElementById('left-side');
        var buttons = document.createElement('div');
        buttons.id = "bga-help_buttons";
        leftSide.appendChild(buttons);
        settings.buttons.forEach(function (button) { return button.add(buttons); });
    }
    return HelpManager;
}());
/**
 * Jump to entry.
 */
var JumpToEntry = /** @class */ (function () {
    function JumpToEntry(
    /**
     * Label shown on the entry. For players, it's player name.
     */
    label, 
    /**
     * HTML Element id, to scroll into view when clicked.
     */
    targetId, 
    /**
     * Any element that is useful to customize the link.
     * Basic ones are 'color' and 'colorback'.
     */
    data) {
        if (data === void 0) { data = {}; }
        this.label = label;
        this.targetId = targetId;
        this.data = data;
    }
    return JumpToEntry;
}());
var JumpToManager = /** @class */ (function () {
    function JumpToManager(game, settings) {
        var _a, _b, _c;
        this.game = game;
        this.settings = settings;
        var entries = __spreadArray(__spreadArray([], ((_a = settings === null || settings === void 0 ? void 0 : settings.topEntries) !== null && _a !== void 0 ? _a : []), true), ((_b = settings === null || settings === void 0 ? void 0 : settings.playersEntries) !== null && _b !== void 0 ? _b : this.createEntries(Object.values(game.gamedatas.players))), true);
        this.createPlayerJumps(entries);
        var folded = (_c = settings === null || settings === void 0 ? void 0 : settings.defaultFolded) !== null && _c !== void 0 ? _c : false;
        if (settings === null || settings === void 0 ? void 0 : settings.localStorageFoldedKey) {
            var localStorageValue = localStorage.getItem(settings.localStorageFoldedKey);
            if (localStorageValue) {
                folded = localStorageValue == 'true';
            }
        }
        document.getElementById('bga-jump-to_controls').classList.toggle('folded', folded);
    }
    JumpToManager.prototype.createPlayerJumps = function (entries) {
        var _this = this;
        var _a, _b, _c, _d;
        document.getElementById("game_play_area_wrap").insertAdjacentHTML('afterend', "\n        <div id=\"bga-jump-to_controls\">        \n            <div id=\"bga-jump-to_toggle\" class=\"bga-jump-to_link ".concat((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', " toggle\" style=\"--color: ").concat((_d = (_c = this.settings) === null || _c === void 0 ? void 0 : _c.toggleColor) !== null && _d !== void 0 ? _d : 'black', "\">\n                \u21D4\n            </div>\n        </div>"));
        document.getElementById("bga-jump-to_toggle").addEventListener('click', function () { return _this.jumpToggle(); });
        entries.forEach(function (entry) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var html = "<div id=\"bga-jump-to_".concat(entry.targetId, "\" class=\"bga-jump-to_link ").concat((_b = (_a = _this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', "\">");
            if ((_d = (_c = _this.settings) === null || _c === void 0 ? void 0 : _c.showEye) !== null && _d !== void 0 ? _d : true) {
                html += "<div class=\"eye\"></div>";
            }
            if (((_f = (_e = _this.settings) === null || _e === void 0 ? void 0 : _e.showAvatar) !== null && _f !== void 0 ? _f : true) && ((_g = entry.data) === null || _g === void 0 ? void 0 : _g.id)) {
                var cssUrl = (_h = entry.data) === null || _h === void 0 ? void 0 : _h.avatarUrl;
                if (!cssUrl) {
                    var img = document.getElementById("avatar_".concat(entry.data.id));
                    var url = img === null || img === void 0 ? void 0 : img.src;
                    // ? Custom image : Bga Image
                    //url = url.replace('_32', url.indexOf('data/avatar/defaults') > 0 ? '' : '_184');
                    if (url) {
                        cssUrl = "url('".concat(url, "')");
                    }
                }
                if (cssUrl) {
                    html += "<div class=\"bga-jump-to_avatar\" style=\"--avatar-url: ".concat(cssUrl, ";\"></div>");
                }
            }
            html += "\n                <span class=\"bga-jump-to_label\">".concat(entry.label, "</span>\n            </div>");
            //
            document.getElementById("bga-jump-to_controls").insertAdjacentHTML('beforeend', html);
            var entryDiv = document.getElementById("bga-jump-to_".concat(entry.targetId));
            Object.getOwnPropertyNames((_j = entry.data) !== null && _j !== void 0 ? _j : []).forEach(function (key) {
                entryDiv.dataset[key] = entry.data[key];
                entryDiv.style.setProperty("--".concat(key), entry.data[key]);
            });
            entryDiv.addEventListener('click', function () { return _this.jumpTo(entry.targetId); });
        });
        var jumpDiv = document.getElementById("bga-jump-to_controls");
        jumpDiv.style.marginTop = "-".concat(Math.round(jumpDiv.getBoundingClientRect().height / 2), "px");
    };
    JumpToManager.prototype.jumpToggle = function () {
        var _a;
        var jumpControls = document.getElementById('bga-jump-to_controls');
        jumpControls.classList.toggle('folded');
        if ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.localStorageFoldedKey) {
            localStorage.setItem(this.settings.localStorageFoldedKey, jumpControls.classList.contains('folded').toString());
        }
    };
    JumpToManager.prototype.jumpTo = function (targetId) {
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };
    JumpToManager.prototype.getOrderedPlayers = function (unorderedPlayers) {
        var _this = this;
        var players = unorderedPlayers.sort(function (a, b) { return Number(a.playerNo) - Number(b.playerNo); });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.game.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    JumpToManager.prototype.createEntries = function (players) {
        var orderedPlayers = this.getOrderedPlayers(players);
        return orderedPlayers.map(function (player) { return new JumpToEntry(player.name, "player-table-".concat(player.id), {
            'color': '#' + player.color,
            'colorback': player.color_back ? '#' + player.color_back : null,
            'id': player.id,
        }); });
    };
    return JumpToManager;
}());
var BgaAnimation = /** @class */ (function () {
    function BgaAnimation(animationFunction, settings) {
        this.animationFunction = animationFunction;
        this.settings = settings;
        this.played = null;
        this.result = null;
        this.playWhenNoAnimation = false;
    }
    return BgaAnimation;
}());
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function attachWithAnimation(animationManager, animation) {
    var _a;
    var settings = animation.settings;
    var element = settings.animation.settings.element;
    var fromRect = element.getBoundingClientRect();
    settings.animation.settings.fromRect = fromRect;
    settings.attachElement.appendChild(element);
    (_a = settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, settings.attachElement);
    return animationManager.play(settings.animation);
}
var BgaAttachWithAnimation = /** @class */ (function (_super) {
    __extends(BgaAttachWithAnimation, _super);
    function BgaAttachWithAnimation(settings) {
        var _this = _super.call(this, attachWithAnimation, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaAttachWithAnimation;
}(BgaAnimation));
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(animationManager, animation) {
    return animationManager.playSequence(animation.settings.animations);
}
var BgaCumulatedAnimation = /** @class */ (function (_super) {
    __extends(BgaCumulatedAnimation, _super);
    function BgaCumulatedAnimation(settings) {
        var _this = _super.call(this, cumulatedAnimations, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaCumulatedAnimation;
}(BgaAnimation));
/**
 * Slide of the element from destination to origin.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        var settings = animation.settings;
        var element = settings.element;
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "".concat((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms ").concat(transitionTimingFunction);
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0, "deg) scale(").concat((_e = settings.scale) !== null && _e !== void 0 ? _e : 1, ")");
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideToAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideToAnimation, _super);
    function BgaSlideToAnimation(settings) {
        return _super.call(this, slideToAnimation, settings) || this;
    }
    return BgaSlideToAnimation;
}(BgaAnimation));
/**
 * Slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        var settings = animation.settings;
        var element = settings.element;
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "".concat((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0, "deg)");
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms ").concat(transitionTimingFunction);
        element.offsetHeight;
        element.style.transform = (_e = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _e !== void 0 ? _e : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideAnimation, _super);
    function BgaSlideAnimation(settings) {
        return _super.call(this, slideAnimation, settings) || this;
    }
    return BgaSlideAnimation;
}(BgaAnimation));
/**
 * Just does nothing for the duration
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function pauseAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a;
        var settings = animation.settings;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        setTimeout(function () { return success(); }, duration);
    });
    return promise;
}
var BgaPauseAnimation = /** @class */ (function (_super) {
    __extends(BgaPauseAnimation, _super);
    function BgaPauseAnimation(settings) {
        return _super.call(this, pauseAnimation, settings) || this;
    }
    return BgaPauseAnimation;
}(BgaAnimation));
function shouldAnimate(settings) {
    var _a;
    return document.visibilityState !== 'hidden' && !((_a = settings === null || settings === void 0 ? void 0 : settings.game) === null || _a === void 0 ? void 0 : _a.instantaneousMode);
}
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element, settings) {
    var _a;
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error("[bga-animation] fromDelta, fromRect or fromElement need to be set");
    }
    var x = 0;
    var y = 0;
    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    }
    else {
        var originBR = (_a = settings.fromRect) !== null && _a !== void 0 ? _a : settings.fromElement.getBoundingClientRect();
        // TODO make it an option ?
        var originalTransform = element.style.transform;
        element.style.transform = '';
        var destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;
        x = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        y = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
    }
    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }
    return { x: x, y: y };
}
function logAnimation(animationManager, animation) {
    var settings = animation.settings;
    var element = settings.element;
    if (element) {
        console.log(animation, settings, element, element.getBoundingClientRect(), element.style.transform);
    }
    else {
        console.log(animation, settings);
    }
    return Promise.resolve(false);
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.zoomManager = settings === null || settings === void 0 ? void 0 : settings.zoomManager;
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
    }
    AnimationManager.prototype.getZoomManager = function () {
        return this.zoomManager;
    };
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    AnimationManager.prototype.setZoomManager = function (zoomManager) {
        this.zoomManager = zoomManager;
    };
    AnimationManager.prototype.getSettings = function () {
        return this.settings;
    };
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    AnimationManager.prototype.animationsActive = function () {
        return document.visibilityState !== 'hidden' && !this.game.instantaneousMode;
    };
    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @param animation the animation to play
     * @returns the animation promise.
     */
    AnimationManager.prototype.play = function (animation) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __awaiter(this, void 0, void 0, function () {
            var settings, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        animation.played = animation.playWhenNoAnimation || this.animationsActive();
                        if (!animation.played) return [3 /*break*/, 2];
                        settings = animation.settings;
                        (_a = settings.animationStart) === null || _a === void 0 ? void 0 : _a.call(settings, animation);
                        (_b = settings.element) === null || _b === void 0 ? void 0 : _b.classList.add((_c = settings.animationClass) !== null && _c !== void 0 ? _c : 'bga-animations_animated');
                        animation.settings = __assign({ duration: (_g = (_e = (_d = animation.settings) === null || _d === void 0 ? void 0 : _d.duration) !== null && _e !== void 0 ? _e : (_f = this.settings) === null || _f === void 0 ? void 0 : _f.duration) !== null && _g !== void 0 ? _g : 500, scale: (_l = (_j = (_h = animation.settings) === null || _h === void 0 ? void 0 : _h.scale) !== null && _j !== void 0 ? _j : (_k = this.zoomManager) === null || _k === void 0 ? void 0 : _k.zoom) !== null && _l !== void 0 ? _l : undefined }, animation.settings);
                        _r = animation;
                        return [4 /*yield*/, animation.animationFunction(this, animation)];
                    case 1:
                        _r.result = _s.sent();
                        (_o = (_m = animation.settings).animationEnd) === null || _o === void 0 ? void 0 : _o.call(_m, animation);
                        (_p = settings.element) === null || _p === void 0 ? void 0 : _p.classList.remove((_q = settings.animationClass) !== null && _q !== void 0 ? _q : 'bga-animations_animated');
                        return [3 /*break*/, 3];
                    case 2: return [2 /*return*/, Promise.resolve(animation)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Plays multiple animations in parallel.
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playParallel = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(animations.map(function (animation) { return _this.play(animation); }))];
            });
        });
    };
    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playSequence = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var result, others;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!animations.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.play(animations[0])];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.playSequence(animations.slice(1))];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, __spreadArray([result], others, true)];
                    case 3: return [2 /*return*/, Promise.resolve([])];
                }
            });
        });
    };
    /**
     * Plays multiple animations with a delay between each animation start.
     *
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playWithDelay = function (animations, delay) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (success) {
                    var promises = [];
                    var _loop_1 = function (i) {
                        setTimeout(function () {
                            promises.push(_this.play(animations[i]));
                            if (i == animations.length - 1) {
                                Promise.all(promises).then(function (result) {
                                    success(result);
                                });
                            }
                        }, i * delay);
                    };
                    for (var i = 0; i < animations.length; i++) {
                        _loop_1(i);
                    }
                });
                return [2 /*return*/, promise];
            });
        });
    };
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (animation, attachElement) {
        var attachWithAnimation = new BgaAttachWithAnimation({
            animation: animation,
            attachElement: attachElement
        });
        return this.play(attachWithAnimation);
    };
    return AnimationManager;
}());
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * Creates the stock and register it on the manager.
     *
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.settings = settings;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * Removes the stock and unregister it on the manager.
     */
    CardStock.prototype.remove = function () {
        var _a;
        this.manager.removeStock(this);
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.remove();
    };
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.isSelected = function (card) {
        var _this = this;
        return this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return this.manager.getCardElement(card);
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.contains(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in a stock
        var originStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        var updateInformations = (_a = settingsWithIndex.updateInformations) !== null && _a !== void 0 ? _a : true;
        var needsCreation = true;
        if (originStock === null || originStock === void 0 ? void 0 : originStock.contains(card)) {
            var element = this.getCardElement(card);
            if (element) {
                promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: originStock }), settingsWithIndex);
                needsCreation = false;
                if (!updateInformations) {
                    element.dataset.side = ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : this.manager.isCardVisible(card)) ? 'front' : 'back';
                }
            }
        }
        else if ((_c = animation === null || animation === void 0 ? void 0 : animation.fromStock) === null || _c === void 0 ? void 0 : _c.contains(card)) {
            var element = this.getCardElement(card);
            if (element) {
                promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
                needsCreation = false;
            }
        }
        if (needsCreation) {
            var element = this.manager.createCardElement(card, ((_d = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _d !== void 0 ? _d : this.manager.isCardVisible(card)));
            promise = this.moveFromElement(card, element, animation, settingsWithIndex);
        }
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (updateInformations) { // after splice/push
            this.manager.updateCardInformations(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if (this.selectionMode !== 'none') {
            // make selectable only at the end of the animation
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settingsWithIndex.selectable) !== null && _a !== void 0 ? _a : true); });
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        var element = animation.fromStock.contains(card) ? this.manager.getCardElement(card) : animation.fromStock.element;
        var fromRect = element === null || element === void 0 ? void 0 : element.getBoundingClientRect();
        this.addCardElementToParent(cardElement, settings);
        this.removeSelectionClassesFromElement(cardElement);
        promise = fromRect ? this.animationFromElement(cardElement, fromRect, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        }) : Promise.resolve(false);
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock && animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement(cardElement, animation.fromStock.element.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        if (shift === void 0) { shift = false; }
        return __awaiter(this, void 0, void 0, function () {
            var promises, result, others, _loop_2, i, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            shift = false;
                        }
                        promises = [];
                        if (!(shift === true)) return [3 /*break*/, 4];
                        if (!cards.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.addCard(cards[0], animation, settings)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.addCards(cards.slice(1), animation, settings, shift)];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, result || others];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        if (typeof shift === 'number') {
                            _loop_2 = function (i) {
                                setTimeout(function () { return promises.push(_this.addCard(cards[i], animation, settings)); }, i * shift);
                            };
                            for (i = 0; i < cards.length; i++) {
                                _loop_2(i);
                            }
                        }
                        else {
                            promises = cards.map(function (card) { return _this.addCard(card, animation, settings); });
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, Promise.all(promises)];
                    case 6:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCard = function (card, settings) {
        var promise;
        if (this.contains(card) && this.element.contains(this.getCardElement(card))) {
            promise = this.manager.removeCard(card, settings);
        }
        else {
            promise = Promise.resolve(false);
        }
        this.cardRemoved(card, settings);
        return promise;
    };
    /**
     * Notify the stock that a card is removed.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.cardRemoved = function (card, settings) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCards = function (cards, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var promises, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = cards.map(function (card) { return _this.removeCard(card, settings); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove all cards from the stock.
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeAll = function (settings) {
        var _this = this;
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (card) { return _this.removeCard(card, settings); });
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     * @param selectableCards the selectable cards (all if unset). Calls `setSelectableCards` method
     */
    CardStock.prototype.setSelectionMode = function (selectionMode, selectableCards) {
        var _this = this;
        if (selectionMode !== this.selectionMode) {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('bga-cards_selectable-stock', selectionMode != 'none');
        this.selectionMode = selectionMode;
        if (selectionMode === 'none') {
            this.getCards().forEach(function (card) { return _this.removeSelectionClasses(card); });
        }
        else {
            this.setSelectableCards(selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards());
        }
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        if (this.selectionMode === 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        if (selectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(selectableCardsClass, selectable);
        }
        if (unselectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(unselectableCardsClass, !selectable);
        }
        if (!selectable && this.isSelected(card)) {
            this.unselectCard(card, true);
        }
    };
    /**
     * Set the selectable class for each card.
     *
     * @param selectableCards the selectable cards. If unset, all cards are marked selectable. Default unset.
     */
    CardStock.prototype.setSelectableCards = function (selectableCards) {
        var _this = this;
        if (this.selectionMode === 'none') {
            return;
        }
        var selectableCardsIds = (selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards()).map(function (card) { return _this.manager.getId(card); });
        this.cards.forEach(function (card) {
            return _this.setSelectableCard(card, selectableCardsIds.includes(_this.manager.getId(card)));
        });
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        if (!element || !element.classList.contains(selectableCardsClass)) {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var selectedCardsClass = this.getSelectedCardClass();
        element.classList.add(selectedCardsClass);
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        var selectedCardsClass = this.getSelectedCardClass();
        element === null || element === void 0 ? void 0 : element.classList.remove(selectedCardsClass);
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    /**
     * @param element The element to animate. The element is added to the destination stock before the animation starts.
     * @param fromElement The HTMLElement to animate from.
     */
    CardStock.prototype.animationFromElement = function (element, fromRect, settings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var side, cardSides_1, animation, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        side = element.dataset.side;
                        if (settings.originalSide && settings.originalSide != side) {
                            cardSides_1 = element.getElementsByClassName('card-sides')[0];
                            cardSides_1.style.transition = 'none';
                            element.dataset.side = settings.originalSide;
                            setTimeout(function () {
                                cardSides_1.style.transition = null;
                                element.dataset.side = side;
                            });
                        }
                        animation = settings.animation;
                        if (animation) {
                            animation.settings.element = element;
                            animation.settings.fromRect = fromRect;
                        }
                        else {
                            animation = new BgaSlideAnimation({ element: element, fromRect: fromRect });
                        }
                        return [4 /*yield*/, this.manager.animationManager.play(animation)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result === null || result === void 0 ? void 0 : result.played) !== null && _a !== void 0 ? _a : false];
                }
            });
        });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? this.manager.getSelectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? this.manager.getUnselectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? this.manager.getSelectedCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardStock.prototype.removeSelectionClasses = function (card) {
        this.removeSelectionClassesFromElement(this.getCardElement(card));
    };
    CardStock.prototype.removeSelectionClassesFromElement = function (cardElement) {
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        var selectedCardsClass = this.getSelectedCardClass();
        cardElement === null || cardElement === void 0 ? void 0 : cardElement.classList.remove(selectableCardsClass, unselectableCardsClass, selectedCardsClass);
    };
    return CardStock;
}());
var SlideAndBackAnimation = /** @class */ (function (_super) {
    __extends(SlideAndBackAnimation, _super);
    function SlideAndBackAnimation(manager, element, tempElement) {
        var distance = (manager.getCardWidth() + manager.getCardHeight()) / 2;
        var angle = Math.random() * Math.PI * 2;
        var fromDelta = {
            x: distance * Math.cos(angle),
            y: distance * Math.sin(angle),
        };
        return _super.call(this, {
            animations: [
                new BgaSlideToAnimation({ element: element, fromDelta: fromDelta, duration: 250 }),
                new BgaSlideAnimation({ element: element, fromDelta: fromDelta, duration: 250, animationEnd: tempElement ? (function () { return element.remove(); }) : undefined }),
            ]
        }) || this;
    }
    return SlideAndBackAnimation;
}(BgaCumulatedAnimation));
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness). *
 * Needs cardWidth and cardHeight to be set in the card manager.
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        var cardWidth = _this.manager.getCardWidth();
        var cardHeight = _this.manager.getCardHeight();
        if (cardWidth && cardHeight) {
            _this.element.style.setProperty('--width', "".concat(cardWidth, "px"));
            _this.element.style.setProperty('--height', "".concat(cardHeight, "px"));
        }
        else {
            throw new Error("You need to set cardWidth and cardHeight in the card manager to use Deck.");
        }
        _this.fakeCardGenerator = (_a = settings === null || settings === void 0 ? void 0 : settings.fakeCardGenerator) !== null && _a !== void 0 ? _a : manager.getFakeCardGenerator();
        _this.thicknesses = (_b = settings.thicknesses) !== null && _b !== void 0 ? _b : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_c = settings.cardNumber) !== null && _c !== void 0 ? _c : 0);
        _this.autoUpdateCardNumber = (_d = settings.autoUpdateCardNumber) !== null && _d !== void 0 ? _d : true;
        _this.autoRemovePreviousCards = (_e = settings.autoRemovePreviousCards) !== null && _e !== void 0 ? _e : true;
        var shadowDirection = (_f = settings.shadowDirection) !== null && _f !== void 0 ? _f : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        if (settings.topCard) {
            _this.addCard(settings.topCard);
        }
        else if (settings.cardNumber > 0) {
            _this.addCard(_this.getFakeCard());
        }
        if (settings.counter && ((_g = settings.counter.show) !== null && _g !== void 0 ? _g : true)) {
            if (settings.cardNumber === null || settings.cardNumber === undefined) {
                console.warn("Deck card counter created without a cardNumber");
            }
            _this.createCounter((_h = settings.counter.position) !== null && _h !== void 0 ? _h : 'bottom', (_j = settings.counter.extraClasses) !== null && _j !== void 0 ? _j : 'round', settings.counter.counterId);
            if ((_k = settings.counter) === null || _k === void 0 ? void 0 : _k.hideWhenEmpty) {
                _this.element.querySelector('.bga-cards_deck-counter').classList.add('hide-when-empty');
            }
        }
        _this.setCardNumber((_l = settings.cardNumber) !== null && _l !== void 0 ? _l : 0);
        return _this;
    }
    Deck.prototype.createCounter = function (counterPosition, extraClasses, counterId) {
        var left = counterPosition.includes('right') ? 100 : (counterPosition.includes('left') ? 0 : 50);
        var top = counterPosition.includes('bottom') ? 100 : (counterPosition.includes('top') ? 0 : 50);
        this.element.style.setProperty('--bga-cards-deck-left', "".concat(left, "%"));
        this.element.style.setProperty('--bga-cards-deck-top', "".concat(top, "%"));
        this.element.insertAdjacentHTML('beforeend', "\n            <div ".concat(counterId ? "id=\"".concat(counterId, "\"") : '', " class=\"bga-cards_deck-counter ").concat(extraClasses, "\"></div>\n        "));
    };
    /**
     * Get the the cards number.
     *
     * @returns the cards number
     */
    Deck.prototype.getCardNumber = function () {
        return this.cardNumber;
    };
    /**
     * Set the the cards number.
     *
     * @param cardNumber the cards number
     * @param topCard the deck top card. If unset, will generated a fake card (default). Set it to null to not generate a new topCard.
     */
    Deck.prototype.setCardNumber = function (cardNumber, topCard) {
        var _this = this;
        if (topCard === void 0) { topCard = undefined; }
        var promise = topCard === null || cardNumber == 0 ?
            Promise.resolve(false) :
            _super.prototype.addCard.call(this, topCard || this.getFakeCard(), undefined, { autoUpdateCardNumber: false });
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', "".concat(thickness, "px"));
        var counterDiv = this.element.querySelector('.bga-cards_deck-counter');
        if (counterDiv) {
            counterDiv.innerHTML = "".concat(cardNumber);
        }
        return promise;
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber + 1, null);
        }
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoRemovePreviousCards) !== null && _b !== void 0 ? _b : this.autoRemovePreviousCards) {
            promise.then(function () {
                var previousCards = _this.getCards().slice(0, -1); // remove last cards
                _this.removeCards(previousCards, { autoUpdateCardNumber: false });
            });
        }
        return promise;
    };
    Deck.prototype.cardRemoved = function (card, settings) {
        var _a;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card, settings);
    };
    Deck.prototype.getTopCard = function () {
        var cards = this.getCards();
        return cards.length ? cards[cards.length - 1] : null;
    };
    /**
     * Shows a shuffle animation on the deck
     *
     * @param animatedCardsMax number of animated cards for shuffle animation.
     * @param fakeCardSetter a function to generate a fake card for animation. Required if the card id is not based on a numerci `id` field, or if you want to set custom card back
     * @returns promise when animation ends
     */
    Deck.prototype.shuffle = function (settings) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var animatedCardsMax, animatedCards, elements, getFakeCard, uid, i, newCard, newElement, pauseDelayAfterAnimation;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        animatedCardsMax = (_a = settings === null || settings === void 0 ? void 0 : settings.animatedCardsMax) !== null && _a !== void 0 ? _a : 10;
                        this.addCard((_b = settings === null || settings === void 0 ? void 0 : settings.newTopCard) !== null && _b !== void 0 ? _b : this.getFakeCard(), undefined, { autoUpdateCardNumber: false });
                        if (!this.manager.animationsActive()) {
                            return [2 /*return*/, Promise.resolve(false)]; // we don't execute as it's just visual temporary stuff
                        }
                        animatedCards = Math.min(10, animatedCardsMax, this.getCardNumber());
                        if (!(animatedCards > 1)) return [3 /*break*/, 4];
                        elements = [this.getCardElement(this.getTopCard())];
                        getFakeCard = function (uid) {
                            var newCard;
                            if (settings === null || settings === void 0 ? void 0 : settings.fakeCardSetter) {
                                newCard = {};
                                settings === null || settings === void 0 ? void 0 : settings.fakeCardSetter(newCard, uid);
                            }
                            else {
                                newCard = _this.fakeCardGenerator("".concat(_this.element.id, "-shuffle-").concat(uid));
                            }
                            return newCard;
                        };
                        uid = 0;
                        for (i = elements.length; i <= animatedCards; i++) {
                            newCard = void 0;
                            do {
                                newCard = getFakeCard(uid++);
                            } while (this.manager.getCardElement(newCard)); // To make sure there isn't a fake card remaining with the same uid
                            newElement = this.manager.createCardElement(newCard, false);
                            newElement.dataset.tempCardForShuffleAnimation = 'true';
                            this.element.prepend(newElement);
                            elements.push(newElement);
                        }
                        return [4 /*yield*/, this.manager.animationManager.playWithDelay(elements.map(function (element) { return new SlideAndBackAnimation(_this.manager, element, element.dataset.tempCardForShuffleAnimation == 'true'); }), 50)];
                    case 1:
                        _d.sent();
                        pauseDelayAfterAnimation = (_c = settings === null || settings === void 0 ? void 0 : settings.pauseDelayAfterAnimation) !== null && _c !== void 0 ? _c : 500;
                        if (!(pauseDelayAfterAnimation > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.manager.animationManager.play(new BgaPauseAnimation({ duration: pauseDelayAfterAnimation }))];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3: return [2 /*return*/, true];
                    case 4: return [2 /*return*/, Promise.resolve(false)];
                }
            });
        });
    };
    Deck.prototype.getFakeCard = function () {
        return this.fakeCardGenerator(this.element.id);
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses, true));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"".concat(slotId, "\" : slot \"").concat(slotId, "\" doesn't exists."));
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    /**
     * Add new slots ids. Will not change nor empty the existing ones.
     *
     * @param slotsIds the new slotsIds. Will be merged with the old ones.
     */
    SlotStock.prototype.addSlotsIds = function (newSlotsIds) {
        var _a;
        var _this = this;
        if (newSlotsIds.length == 0) {
            // no change
            return;
        }
        (_a = this.slotsIds).push.apply(_a, newSlotsIds);
        newSlotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.contains(card)) {
            return true;
        }
        else {
            var currentCardSlot = this.getCardElement(card).closest('.slot').dataset.slotId;
            var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
            return currentCardSlot != slotId;
        }
    };
    /**
     * Swap cards inside the slot stock.
     *
     * @param cards the cards to swap
     * @param settings for `updateInformations` and `selectable`
     */
    SlotStock.prototype.swapCards = function (cards, settings) {
        var _this = this;
        if (!this.mapCardToSlot) {
            throw new Error('You need to define SlotStock.mapCardToSlot to use SlotStock.swapCards');
        }
        var promises = [];
        var elements = cards.map(function (card) { return _this.manager.getCardElement(card); });
        var elementsRects = elements.map(function (element) { return element.getBoundingClientRect(); });
        var cssPositions = elements.map(function (element) { return element.style.position; });
        // we set to absolute so it doesn't mess with slide coordinates when 2 div are at the same place
        elements.forEach(function (element) { return element.style.position = 'absolute'; });
        cards.forEach(function (card, index) {
            var _a, _b;
            var cardElement = elements[index];
            var promise;
            var slotId = (_a = _this.mapCardToSlot) === null || _a === void 0 ? void 0 : _a.call(_this, card);
            _this.slots[slotId].appendChild(cardElement);
            cardElement.style.position = cssPositions[index];
            var cardIndex = _this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (cardIndex !== -1) {
                _this.cards.splice(cardIndex, 1, card);
            }
            if ((_b = settings === null || settings === void 0 ? void 0 : settings.updateInformations) !== null && _b !== void 0 ? _b : true) { // after splice/push
                _this.manager.updateCardInformations(card);
            }
            _this.removeSelectionClassesFromElement(cardElement);
            promise = _this.animationFromElement(cardElement, elementsRects[index], {});
            if (!promise) {
                console.warn("CardStock.animationFromElement didn't return a Promise");
                promise = Promise.resolve(false);
            }
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settings === null || settings === void 0 ? void 0 : settings.selectable) !== null && _a !== void 0 ? _a : true); });
            promises.push(promise);
        });
        return Promise.all(promises);
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToVoidStockSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        var originalLeft = cardElement.style.left;
        var originalTop = cardElement.style.top;
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.remove) !== null && _a !== void 0 ? _a : true) {
            return promise.then(function () {
                return _this.removeCard(card);
            });
        }
        else {
            cardElement.style.left = originalLeft;
            cardElement.style.top = originalTop;
            return promise;
        }
    };
    return VoidStock;
}(CardStock));
var AllVisibleDeck = /** @class */ (function (_super) {
    __extends(AllVisibleDeck, _super);
    function AllVisibleDeck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('all-visible-deck', (_a = settings.direction) !== null && _a !== void 0 ? _a : 'vertical');
        var cardWidth = _this.manager.getCardWidth();
        var cardHeight = _this.manager.getCardHeight();
        if (cardWidth && cardHeight) {
            _this.element.style.setProperty('--width', "".concat(cardWidth, "px"));
            _this.element.style.setProperty('--height', "".concat(cardHeight, "px"));
        }
        else {
            throw new Error("You need to set cardWidth and cardHeight in the card manager to use Deck.");
        }
        element.style.setProperty('--vertical-shift', (_c = (_b = settings.verticalShift) !== null && _b !== void 0 ? _b : settings.shift) !== null && _c !== void 0 ? _c : '3px');
        element.style.setProperty('--horizontal-shift', (_e = (_d = settings.horizontalShift) !== null && _d !== void 0 ? _d : settings.shift) !== null && _e !== void 0 ? _e : '3px');
        if (settings.counter && ((_f = settings.counter.show) !== null && _f !== void 0 ? _f : true)) {
            _this.createCounter((_g = settings.counter.position) !== null && _g !== void 0 ? _g : 'bottom', (_h = settings.counter.extraClasses) !== null && _h !== void 0 ? _h : 'round', settings.counter.counterId);
            if ((_j = settings.counter) === null || _j === void 0 ? void 0 : _j.hideWhenEmpty) {
                _this.element.querySelector('.bga-cards_deck-counter').classList.add('hide-when-empty');
                _this.element.dataset.empty = 'true';
            }
        }
        return _this;
    }
    AllVisibleDeck.prototype.addCard = function (card, animation, settings) {
        var promise;
        var order = this.cards.length;
        promise = _super.prototype.addCard.call(this, card, animation, settings);
        var cardId = this.manager.getId(card);
        var cardDiv = document.getElementById(cardId);
        cardDiv.style.setProperty('--order', '' + order);
        this.cardNumberUpdated();
        return promise;
    };
    /**
     * Set opened state. If true, all cards will be entirely visible.
     *
     * @param opened indicate if deck must be always opened. If false, will open only on hover/touch
     */
    AllVisibleDeck.prototype.setOpened = function (opened) {
        this.element.classList.toggle('opened', opened);
    };
    AllVisibleDeck.prototype.cardRemoved = function (card) {
        var _this = this;
        _super.prototype.cardRemoved.call(this, card);
        this.cards.forEach(function (c, index) {
            var cardId = _this.manager.getId(c);
            var cardDiv = document.getElementById(cardId);
            cardDiv.style.setProperty('--order', '' + index);
        });
        this.cardNumberUpdated();
    };
    AllVisibleDeck.prototype.createCounter = function (counterPosition, extraClasses, counterId) {
        var left = counterPosition.includes('right') ? 100 : (counterPosition.includes('left') ? 0 : 50);
        var top = counterPosition.includes('bottom') ? 100 : (counterPosition.includes('top') ? 0 : 50);
        this.element.style.setProperty('--bga-cards-deck-left', "".concat(left, "%"));
        this.element.style.setProperty('--bga-cards-deck-top', "".concat(top, "%"));
        this.element.insertAdjacentHTML('beforeend', "\n            <div ".concat(counterId ? "id=\"".concat(counterId, "\"") : '', " class=\"bga-cards_deck-counter ").concat(extraClasses, "\"></div>\n        "));
    };
    /**
     * Updates the cards number, if the counter is visible.
     */
    AllVisibleDeck.prototype.cardNumberUpdated = function () {
        var cardNumber = this.cards.length;
        this.element.style.setProperty('--tile-count', '' + cardNumber);
        this.element.dataset.empty = (cardNumber == 0).toString();
        var counterDiv = this.element.querySelector('.bga-cards_deck-counter');
        if (counterDiv) {
            counterDiv.innerHTML = "".concat(cardNumber);
        }
    };
    return AllVisibleDeck;
}(CardStock));
function sortFunction() {
    var sortedFields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sortedFields[_i] = arguments[_i];
    }
    return function (a, b) {
        for (var i = 0; i < sortedFields.length; i++) {
            var direction = 1;
            var field = sortedFields[i];
            if (field[0] == '-') {
                direction = -1;
                field = field.substring(1);
            }
            else if (field[0] == '+') {
                field = field.substring(1);
            }
            var type = typeof a[field];
            if (type === 'string') {
                var compare = a[field].localeCompare(b[field]);
                if (compare !== 0) {
                    return compare;
                }
            }
            else if (type === 'number') {
                var compare = (a[field] - b[field]) * direction;
                if (compare !== 0) {
                    return compare * direction;
                }
            }
        }
        return 0;
    };
}
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        var _a;
        this.game = game;
        this.settings = settings;
        this.stocks = [];
        this.updateMainTimeoutId = [];
        this.updateFrontTimeoutId = [];
        this.updateBackTimeoutId = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    CardManager.prototype.animationsActive = function () {
        return this.animationManager.animationsActive();
    };
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    CardManager.prototype.removeStock = function (stock) {
        var index = this.stocks.indexOf(stock);
        if (index !== -1) {
            this.stocks.splice(index, 1);
        }
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-".concat(card.id);
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        if (this.getCardElement(card)) {
            throw new Error('This card already exists ' + JSON.stringify(card));
        }
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div id=\"".concat(id, "-front\" class=\"card-side front\">\n                </div>\n                <div id=\"").concat(id, "-back\" class=\"card-side back\">\n                </div>\n            </div>\n        ");
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    /**
     * Remove a card.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardManager.prototype.removeCard = function (card, settings) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return Promise.resolve(false);
        }
        div.id = "deleted".concat(id);
        div.remove();
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card, settings);
        return Promise.resolve(true);
    };
    /**
     * Returns the stock containing the card.
     *
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Return if the card passed as parameter is suppose to be visible or not.
     * Use `isCardVisible` from settings if set, else will check if `card.type` is defined
     *
     * @param card the card informations
     * @return the visiblility of the card (true means front side should be displayed)
     */
    CardManager.prototype.isCardVisible = function (card) {
        var _a, _b, _c, _d;
        return (_c = (_b = (_a = this.settings).isCardVisible) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : ((_d = card.type) !== null && _d !== void 0 ? _d : false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     * @param visible if the card is set to visible face. If unset, will use isCardVisible(card)
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        var isVisible = visible !== null && visible !== void 0 ? visible : this.isCardVisible(card);
        element.dataset.side = isVisible ? 'front' : 'back';
        var stringId = JSON.stringify(this.getId(card));
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateMain) !== null && _a !== void 0 ? _a : false) {
            if (this.updateMainTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateMainTimeoutId[stringId]);
                delete this.updateMainTimeoutId[stringId];
            }
            var updateMainDelay = (_b = settings === null || settings === void 0 ? void 0 : settings.updateMainDelay) !== null && _b !== void 0 ? _b : 0;
            if (isVisible && updateMainDelay > 0 && this.animationsActive()) {
                this.updateMainTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element); }, updateMainDelay);
            }
            else {
                (_d = (_c = this.settings).setupDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element);
            }
        }
        if ((_e = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _e !== void 0 ? _e : true) {
            if (this.updateFrontTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateFrontTimeoutId[stringId]);
                delete this.updateFrontTimeoutId[stringId];
            }
            var updateFrontDelay = (_f = settings === null || settings === void 0 ? void 0 : settings.updateFrontDelay) !== null && _f !== void 0 ? _f : 500;
            if (!isVisible && updateFrontDelay > 0 && this.animationsActive()) {
                this.updateFrontTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupFrontDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('front')[0]); }, updateFrontDelay);
            }
            else {
                (_h = (_g = this.settings).setupFrontDiv) === null || _h === void 0 ? void 0 : _h.call(_g, card, element.getElementsByClassName('front')[0]);
            }
        }
        if ((_j = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _j !== void 0 ? _j : false) {
            if (this.updateBackTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateBackTimeoutId[stringId]);
                delete this.updateBackTimeoutId[stringId];
            }
            var updateBackDelay = (_k = settings === null || settings === void 0 ? void 0 : settings.updateBackDelay) !== null && _k !== void 0 ? _k : 0;
            if (isVisible && updateBackDelay > 0 && this.animationsActive()) {
                this.updateBackTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupBackDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('back')[0]); }, updateBackDelay);
            }
            else {
                (_m = (_l = this.settings).setupBackDiv) === null || _m === void 0 ? void 0 : _m.call(_l, card, element.getElementsByClassName('back')[0]);
            }
        }
        if ((_o = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _o !== void 0 ? _o : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    /**
     * Update the card informations. Used when a card with just an id (back shown) should be revealed, with all data needed to populate the front.
     *
     * @param card the card informations
     */
    CardManager.prototype.updateCardInformations = function (card, settings) {
        var newSettings = __assign(__assign({}, (settings !== null && settings !== void 0 ? settings : {})), { updateData: true });
        this.setCardVisible(card, undefined, newSettings);
    };
    /**
     * @returns the card with set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardWidth = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardWidth;
    };
    /**
     * @returns the card height set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardHeight = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardHeight;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_selectable-card'.
     */
    CardManager.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? 'bga-cards_selectable-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_disabled-card'.
     */
    CardManager.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? 'bga-cards_disabled-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Default 'bga-cards_selected-card'.
     */
    CardManager.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? 'bga-cards_selected-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardManager.prototype.getFakeCardGenerator = function () {
        var _this = this;
        var _a, _b;
        return (_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.fakeCardGenerator) !== null && _b !== void 0 ? _b : (function (deckId) { return ({ id: _this.getId({ id: "".concat(deckId, "-fake-top-card") }) }); });
    };
    return CardManager;
}());
// <reference path="../card-manager.ts"/>
var FestivalCardsManager = /** @class */ (function (_super) {
    __extends(FestivalCardsManager, _super);
    function FestivalCardsManager(game) {
        var _this = _super.call(this, game, {
            animationManager: game.animationManager,
            getId: function (card) { return "festival-card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('festival-card');
                div.dataset.cardId = '' + card.id;
                div.dataset.cardType = '' + card.type;
                div.style.position = 'relative';
                div.style.width = FESTIVAL_CARD_WIDTH;
                div.style.height = FESTIVAL_CARD_HEIGHT;
            },
            setupFrontDiv: function (card, div) {
                _this.setFrontBackground(div, card.type_arg);
            },
            setupBackDiv: function (card, div) {
                div.style.backgroundImage = "url('".concat(g_gamethemeurl, "img/festivibes-card-background.jpg')");
            }
        }) || this;
        _this.game = game;
        return _this;
    }
    FestivalCardsManager.prototype.setFrontBackground = function (cardDiv, cardType) {
        var eventsUrl = "".concat(g_gamethemeurl, "img/festivalCardsFront.jpg");
        cardDiv.style.backgroundImage = "url('".concat(eventsUrl, "')");
        var imagePosition = cardType - 1;
        var row = Math.floor(imagePosition / IMAGE_FESTIVALS_PER_ROW);
        var xBackgroundPercent = (imagePosition - row * IMAGE_FESTIVALS_PER_ROW) * 100;
        var yBackgroundPercent = row * 100;
        cardDiv.style.backgroundPositionX = "-".concat(xBackgroundPercent, "%");
        cardDiv.style.backgroundPositionY = "-".concat(yBackgroundPercent, "%");
        cardDiv.style.backgroundSize = "".concat(IMAGE_FESTIVALS_PER_ROW * 100, "%");
    };
    return FestivalCardsManager;
}(CardManager));
// <reference path="../card-manager.ts"/>
var EventCardsManager = /** @class */ (function (_super) {
    __extends(EventCardsManager, _super);
    function EventCardsManager(game) {
        var _this = _super.call(this, game, {
            animationManager: game.animationManager,
            getId: function (card) { return "event-card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('event-card');
                div.dataset.cardId = '' + card.id;
                div.dataset.cardType = '' + card.type;
                div.style.position = 'relative';
            },
            setupFrontDiv: function (card, div) {
                _this.setFrontBackground(div, card.type_arg);
                //this.setDivAsCard(div as HTMLDivElement, card.type);
                div.id = "".concat(_super.prototype.getId.call(_this, card), "-front");
                //add help
                var helpId = "".concat(_super.prototype.getId.call(_this, card), "-front-info");
                if (!$(helpId)) {
                    var info = document.createElement('div');
                    info.id = helpId;
                    info.innerText = '?';
                    info.classList.add('css-icon', 'card-info');
                    div.appendChild(info);
                    var cardTypeId = card.type * 100 + card.type_arg;
                    _this.game.addTooltipHtml(info.id, _this.getTooltip(card, cardTypeId));
                }
            },
            setupBackDiv: function (card, div) {
                //div.style.backgroundImage = `url('${g_gamethemeurl}img/festivibes-card-background.jpg')`
            }
        }) || this;
        _this.game = game;
        return _this;
    }
    EventCardsManager.prototype.getCardName = function (cardTypeId) {
        return 'todo';
    };
    EventCardsManager.prototype.getTooltip = function (card, cardUniqueId) {
        /*let tooltip = `
        <div class="xpd-city-zoom-wrapper">
            <div id="xpd-city-${cardUniqueId}-zoom" class="xpd-city-zoom" style="${getBackgroundInlineStyleForEventCard(
            card
        )}"></div>
            <div class="xpd-city-zoom-desc-wrapper">
                <div class="xpd-city">${dojo.string.substitute(_('${to}'), {
                    to: 'replace'
                })}</div>
            </div>
        </div>`*/
        //return tooltip
        return "tooltip";
    };
    EventCardsManager.prototype.setFrontBackground = function (cardDiv, cardType) {
        var eventsUrl = "".concat(g_gamethemeurl, "img/eventsCards.jpg");
        cardDiv.style.backgroundImage = "url('".concat(eventsUrl, "')");
        var imagePosition = cardType - 1;
        var row = Math.floor(imagePosition / IMAGE_EVENTS_PER_ROW);
        var xBackgroundPercent = (imagePosition - row * IMAGE_EVENTS_PER_ROW) * 100;
        var yBackgroundPercent = row * 100;
        cardDiv.style.backgroundPositionX = "-".concat(xBackgroundPercent, "%");
        cardDiv.style.backgroundPositionY = "-".concat(yBackgroundPercent, "%");
        cardDiv.style.backgroundSize = "".concat(IMAGE_EVENTS_PER_ROW * 100, "%");
    };
    return EventCardsManager;
}(CardManager));
var DRAG_AUTO_ZOOM_DELAY = 2000;
var MAP_WIDTH = 1744;
var MAP_HEIGHT = 1321;
var DECK_WIDTH = 0;
var PLAYER_WIDTH = 305;
var PLAYER_HEIGHT = 150; // avg height (4 destination cards)
var BOTTOM_RATIO = (MAP_WIDTH + DECK_WIDTH) / (MAP_HEIGHT + PLAYER_HEIGHT);
var LEFT_RATIO = (PLAYER_WIDTH + MAP_WIDTH + DECK_WIDTH) / MAP_HEIGHT;
/**
 * Manager for in-map zoom.
 */
var InMapZoomManager = /** @class */ (function () {
    function InMapZoomManager() {
        var _this = this;
        this.pos = { dragging: false, top: 0, left: 0, x: 0, y: 0 }; // for map drag (if zoomed)
        this.zoomed = false; // indicates if in-map zoom is active
        this.mapZoomDiv = document.getElementById('map-zoom');
        this.mapDiv = document.getElementById('map');
        // Attach the handler
        this.mapDiv.addEventListener('mousedown', function (e) { return _this.mouseDownHandler(e); });
        document.addEventListener('mousemove', function (e) { return _this.mouseMoveHandler(e); });
        document.addEventListener('mouseup', function (e) { return _this.mouseUpHandler(); });
        document.getElementById('zoom-button').addEventListener('click', function () { return _this.toggleZoom(); });
        this.mapDiv.addEventListener('dragover', function (e) {
            if (e.offsetX !== _this.dragClientX || e.offsetY !== _this.dragClientY) {
                _this.dragClientX = e.offsetX;
                _this.dragClientY = e.offsetY;
                _this.dragOverMouseMoved(e.offsetX, e.offsetY);
            }
        });
        this.mapDiv.addEventListener('dragleave', function (e) {
            clearTimeout(_this.autoZoomTimeout);
            _this.autoZoomTimeout = null;
        });
        this.mapDiv.addEventListener('drop', function (e) {
            clearTimeout(_this.autoZoomTimeout);
            _this.autoZoomTimeout = null;
        });
    }
    InMapZoomManager.prototype.dragOverMouseMoved = function (clientX, clientY) {
        var _this = this;
        if (this.autoZoomTimeout) {
            clearTimeout(this.autoZoomTimeout);
        }
        this.autoZoomTimeout = setTimeout(function () {
            // do not automatically change the zoom when player is dragging over a route!
            _this.toggleZoom(clientX / _this.mapDiv.clientWidth, clientY / _this.mapDiv.clientHeight);
            _this.autoZoomTimeout = null;
        }, DRAG_AUTO_ZOOM_DELAY);
    };
    /**
     * Handle click on zoom button. Toggle between full map and in-map zoom.
     */
    InMapZoomManager.prototype.toggleZoom = function (scrollRatioX, scrollRatioY) {
        if (scrollRatioX === void 0) { scrollRatioX = null; }
        if (scrollRatioY === void 0) { scrollRatioY = null; }
        this.zoomed = !this.zoomed;
        this.mapDiv.style.transform = this.zoomed ? "scale(1.8)" : '';
        dojo.toggleClass('zoom-button', 'zoomed', this.zoomed);
        dojo.toggleClass('map-zoom', 'scrollable', this.zoomed);
        this.mapDiv.style.cursor = this.zoomed ? 'grab' : 'default';
        if (this.zoomed) {
            if (scrollRatioX && scrollRatioY) {
                this.mapZoomDiv.scrollLeft = (this.mapZoomDiv.scrollWidth - this.mapZoomDiv.clientWidth) * scrollRatioX;
                this.mapZoomDiv.scrollTop =
                    (this.mapZoomDiv.scrollHeight - this.mapZoomDiv.clientHeight) * scrollRatioY;
            }
        }
        else {
            this.mapZoomDiv.scrollTop = 0;
            this.mapZoomDiv.scrollLeft = 0;
        }
    };
    /**
     * Handle mouse down, to grap map and scroll in it (imitate mobile touch scroll).
     */
    InMapZoomManager.prototype.mouseDownHandler = function (e) {
        if (!this.zoomed) {
            return;
        }
        this.mapDiv.style.cursor = 'grabbing';
        this.pos = {
            dragging: true,
            left: this.mapDiv.scrollLeft,
            top: this.mapDiv.scrollTop,
            // Get the current mouse position
            x: e.clientX,
            y: e.clientY,
        };
    };
    /**
     * Handle mouse move, to grap map and scroll in it (imitate mobile touch scroll).
     */
    InMapZoomManager.prototype.mouseMoveHandler = function (e) {
        if (!this.zoomed || !this.pos.dragging) {
            return;
        }
        // How far the mouse has been moved
        var dx = e.clientX - this.pos.x;
        var dy = e.clientY - this.pos.y;
        var factor = 0.1;
        // Scroll the element
        this.mapZoomDiv.scrollTop -= dy * factor;
        this.mapZoomDiv.scrollLeft -= dx * factor;
    };
    /**
     * Handle mouse up, to grap map and scroll in it (imitate mobile touch scroll).
     */
    InMapZoomManager.prototype.mouseUpHandler = function () {
        if (!this.zoomed || !this.pos.dragging) {
            return;
        }
        this.mapDiv.style.cursor = 'grab';
        this.pos.dragging = false;
    };
    return InMapZoomManager;
}());
/**
 * Map creation and in-map zoom handler.
 */
var TtrMap = /** @class */ (function () {
    /**
     * Place map illustration and other objects, and bind events.
     */
    function TtrMap(game) {
        this.game = game;
        // map border
        dojo.place("\n            <div id=\"cities\"></div>\n        ", 'map', 'first');
        this.resizedDiv = document.getElementById('resized');
        this.mapDiv = document.getElementById('map');
        this.inMapZoomManager = new InMapZoomManager();
    }
    /**
     * Set map size, depending on available screen size.
     */
    TtrMap.prototype.setAutoZoom = function () {
        var _this = this;
        if (!this.mapDiv.clientWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var gameWidth = MAP_WIDTH + DECK_WIDTH;
        var gameHeight = MAP_HEIGHT + (PLAYER_HEIGHT * 0.75);
        var horizontalScale = document.getElementById('game_play_area').clientWidth / gameWidth;
        var verticalScale = (window.innerHeight - 80) / gameHeight;
        this.scale = Math.min(1, horizontalScale, verticalScale);
        this.resizedDiv.style.transform = this.scale === 1 ? '' : "scale(".concat(this.scale, ")");
        this.resizedDiv.style.marginBottom = "-".concat((1 - this.scale) * gameHeight, "px");
    };
    /**
     * Get current zoom.
     */
    TtrMap.prototype.getZoom = function () {
        return this.scale;
    };
    return TtrMap;
}());
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * Festivibes implementation : © Séverine Kamycki <mizutismask@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * festivibes.ts
 *
 * Festivibes user interface script
 *
 * In this file, you are describing the logic of your user interface, in Typescript language.
 *
 */
var ANIMATION_MS = 500;
var SCORE_MS = 1500;
var IMAGE_FESTIVALS_PER_ROW = 6;
var IMAGE_EVENTS_PER_ROW = 13;
var IMAGE_TICKETS_PER_ROW = 4;
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var Festivibes = /** @class */ (function () {
    function Festivibes() {
        this.playerTables = [];
        this.ticketsCounters = [];
        this.animations = [];
        this.actionTimerId = null;
        this.isTouch = window.matchMedia('(hover: none)').matches;
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
        this.settings = [new Setting('customSounds', 'pref', 1)];
        this.festivalStocks = [];
        console.log('festivibes constructor');
        // Here, you can init the global variables of your user interface
        // Example:
        // this.myGlobalValue = 0;
    }
    /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
    Festivibes.prototype.setup = function (gamedatas) {
        var _this = this;
        var _a;
        log('Starting game setup');
        this.gameFeatures = new GameFeatureConfig();
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.map = new TtrMap(this);
        this.FestivalCardsManager = new FestivalCardsManager(this);
        this.animationManager = new AnimationManager(this);
        if (gamedatas.lastTurn) {
            this.notif_lastTurn(false);
        }
        if (Number(gamedatas.gamestate.id) >= 90) {
            // score or end
            this.onEnteringEndScore();
        }
        this.setupNotifications();
        Object.values(this.gamedatas.playerOrderWorkingWithSpectators).forEach(function (p) {
            _this.setupPlayer(_this.gamedatas.players[p]);
        });
        $('overall-content').classList.add("player-count-".concat(this.getPlayersCount()));
        this.setupSettingsIconInMainBar();
        this.setupPreferences();
        this.setupTooltips();
        this.onScreenWidthChange = function () { return _this.map.setAutoZoom(); };
        this.scoreBoard = new ScoreBoard(this, Object.values(this.gamedatas.players));
        (_a = this.gamedatas.scores) === null || _a === void 0 ? void 0 : _a.forEach(function (s) { return _this.scoreBoard.updateScore(s.playerId, s.scoreType, s.score); });
        if (this.gamedatas.winners) {
            this.gamedatas.winners.forEach(function (pId) { return _this.scoreBoard.highlightWinnerScore(pId); });
        }
        removeClass('animatedScore');
        this.setupFestivals(this.gamedatas.festivals);
        console.log('Ending game setup');
    };
    Festivibes.prototype.setupFestivals = function (festivals) {
        var _this = this;
        festivals.forEach(function (fest) {
            var divId = 'festival-' + fest.id;
            dojo.place(_this.createDiv('', divId), 'festivals');
            _this.festivalStocks[fest.id] = new SlotStock(_this.FestivalCardsManager, $(divId), {
                center: true,
                gap: '7px',
                direction: 'row',
                wrap: 'nowrap',
                slotsIds: ['slot1'],
                mapCardToSlot: function (card) { return "slot".concat(1); }
            });
            _this.festivalStocks[fest.id].addCard(fest);
        });
    };
    Festivibes.prototype.setupTooltips = function () {
        //todo change counter names
        this.setTooltipToClass('revealed-tokens-back-counter', _('counter1 tooltip'));
        this.setTooltipToClass('tickets-counter', _('counter2 tooltip'));
        this.setTooltipToClass('xpd-help-icon', "<div class=\"help-card recto\"></div>");
        this.setTooltipToClass('xpd-help-icon-mini', "<div class=\"help-card verso\"></div>");
        this.setTooltipToClass('player-turn-order', _('First player'));
    };
    Festivibes.prototype.setupPlayer = function (player) {
        document.getElementById("overall_player_board_".concat(player.id)).dataset.playerColor = player.color;
        if (this.gameFeatures.showPlayerOrderHints) {
            this.setupPlayerOrderHints(player);
        }
        if (this.isNotSpectator()) {
            this.setupMiniPlayerBoard(player);
        }
        this.playerTables[player.id] = new PlayerTable(this, player);
    };
    Festivibes.prototype.setupMiniPlayerBoard = function (player) {
        var playerId = Number(player.id);
        dojo.place("<div class=\"counters\">\n                    <div id=\"tickets-counter-".concat(player.id, "-wrapper\" class=\"counter tickets-counter\">\n                        <div class=\"icon expTicket\"></div> \n                        <span id=\"tickets-counter-").concat(player.id, "\"></span>\n                    </div>\n                \n                    <div id=\"revealed-tokens-back-counter-").concat(player.id, "-wrapper\" class=\"counter revealed-tokens-back-counter\">\n                        <div class=\"icon token\" data-player-color=\"").concat(player.color, "\"></div> \n                        <span id=\"revealed-tokens-back-counter-").concat(player.id, "\"></span> / 4\n                    </div>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"additional-info-").concat(player.id, "\" class=\"counters additional-info\">\n\t\t\t\t\t<div id=\"additional-icons-").concat(player.id, "\" class=\"additional-icons\"></div> \n\t\t\t\t</div>\n\t\t\t\t"), "player_board_".concat(player.id));
        /* const revealedTokensBackCounter = new ebg.counter();
            revealedTokensBackCounter.create(`revealed-tokens-back-counter-${player.id}`);
            revealedTokensBackCounter.setValue(player.revealedTokensBackCount);
            this.revealedTokensBackCounters[playerId] = revealedTokensBackCounter;

            const ticketsCounter = new ebg.counter();
            ticketsCounter.create(`tickets-counter-${player.id}`);
            ticketsCounter.setValue(player.ticketsCount);
            this.ticketsCounters[playerId] = ticketsCounter;*/
        if (this.gameFeatures.showPlayerHelp && this.getPlayerId() === playerId) {
            //help
            dojo.place("<div id=\"player-help\" class=\"css-icon xpd-help-icon\">?</div>", "additional-icons-".concat(player.id));
        }
        if (this.gameFeatures.showFirstPlayer && player.playerNo === 1) {
            dojo.place("<div id=\"firstPlayerIcon\" class=\"css-icon player-turn-order\">1</div>", "additional-icons-".concat(player.id), "last");
        }
        if (this.gameFeatures.spyOnOtherPlayerBoard && this.getPlayerId() !== playerId) {
            //spy on other player
            dojo.place("\n            <div class=\"show-player-tableau\"><a href=\"#anchor-player-".concat(player.id, "\" classes=\"inherit-color\">\n                <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 85.333343 145.79321\">\n                    <path fill=\"currentColor\" d=\"M 1.6,144.19321 C 0.72,143.31321 0,141.90343 0,141.06039 0,140.21734 5.019,125.35234 11.15333,108.02704 L 22.30665,76.526514 14.626511,68.826524 C 8.70498,62.889705 6.45637,59.468243 4.80652,53.884537 0.057,37.810464 3.28288,23.775161 14.266011,12.727735 23.2699,3.6711383 31.24961,0.09115725 42.633001,0.00129225 c 15.633879,-0.123414 29.7242,8.60107205 36.66277,22.70098475 8.00349,16.263927 4.02641,36.419057 -9.54327,48.363567 l -6.09937,5.36888 10.8401,30.526466 c 5.96206,16.78955 10.84011,32.03102 10.84011,33.86992 0,1.8389 -0.94908,3.70766 -2.10905,4.15278 -1.15998,0.44513 -19.63998,0.80932 -41.06667,0.80932 -28.52259,0 -39.386191,-0.42858 -40.557621,-1.6 z M 58.000011,54.483815 c 3.66666,-1.775301 9.06666,-5.706124 11.99999,-8.735161 l 5.33334,-5.507342 -6.66667,-6.09345 C 59.791321,26.035633 53.218971,23.191944 43.2618,23.15582 33.50202,23.12041 24.44122,27.164681 16.83985,34.94919 c -4.926849,5.045548 -5.023849,5.323672 -2.956989,8.478106 3.741259,5.709878 15.032709,12.667218 24.11715,14.860013 4.67992,1.129637 13.130429,-0.477436 20,-3.803494 z m -22.33337,-2.130758 c -2.8907,-1.683676 -6.3333,-8.148479 -6.3333,-11.893186 0,-11.58942 14.57544,-17.629692 22.76923,-9.435897 8.41012,8.410121 2.7035,22.821681 -9,22.728685 -2.80641,-0.0223 -6.15258,-0.652121 -7.43593,-1.399602 z m 14.6667,-6.075289 c 3.72801,-4.100734 3.78941,-7.121364 0.23656,-11.638085 -2.025061,-2.574448 -3.9845,-3.513145 -7.33333,-3.513145 -10.93129,0 -13.70837,13.126529 -3.90323,18.44946 3.50764,1.904196 7.30574,0.765377 11,-3.29823 z m -11.36999,0.106494 c -3.74071,-2.620092 -4.07008,-7.297494 -0.44716,-6.350078 3.2022,0.837394 4.87543,-1.760912 2.76868,-4.29939 -1.34051,-1.615208 -1.02878,-1.94159 1.85447,-1.94159 4.67573,0 8.31873,5.36324 6.2582,9.213366 -1.21644,2.27295 -5.30653,5.453301 -7.0132,5.453301 -0.25171,0 -1.79115,-0.934022 -3.42099,-2.075605 z\"></path>\n                </svg>\n                </a>\n            </div>\n            "), "additional-icons-".concat(player.id));
        }
    };
    Festivibes.prototype.setupPlayerOrderHints = function (player) {
        var nameDiv = document.querySelector('#player_name_' + player.id + ' a');
        var surroundingPlayers = this.getSurroundingPlayersIds(player);
        var previousId = this.gamedatas.turnOrderClockwise ? surroundingPlayers[0] : surroundingPlayers[1];
        var nextId = this.gamedatas.turnOrderClockwise ? surroundingPlayers[1] : surroundingPlayers[0];
        this.updatePlayerHint(player, previousId, '_previous_player', _('Previous player: '), '&lt;', nameDiv, 'before');
        this.updatePlayerHint(player, nextId, '_next_player', _('Next player: '), '&gt;', nameDiv, 'after');
    };
    Festivibes.prototype.updatePlayerHint = function (currentPlayer, otherPlayerId, divSuffix, titlePrefix, content, parentDivId, location) {
        if (!$(currentPlayer.id + divSuffix)) {
            dojo.create('span', {
                id: currentPlayer.id + divSuffix,
                class: 'playerOrderHelp',
                title: titlePrefix + this.gamedatas.players[otherPlayerId].name,
                style: 'color:#' + this.gamedatas.players[otherPlayerId]['color'] + ';',
                innerHTML: content
            }, parentDivId, location);
        }
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Festivibes.prototype.onEnteringState = function (stateName, args) {
        console.log('Entering state: ' + stateName);
        switch (stateName) {
            case 'chooseAction':
                if (args === null || args === void 0 ? void 0 : args.args) {
                    var dataArgs = args.args;
                    this.onEnteringChooseAction(dataArgs);
                }
                break;
        }
        if (this.gameFeatures.spyOnActivePlayerInGeneralActions) {
            this.addArrowsToActivePlayer(args);
        }
    };
    Festivibes.prototype.onEnteringChooseAction = function (args) {
        //todo
    };
    /**
     * Show score board.
     */
    Festivibes.prototype.onEnteringEndScore = function () {
        var lastTurnBar = document.getElementById('last-round');
        if (lastTurnBar) {
            lastTurnBar.style.display = 'none';
        }
        document.getElementById('score').style.display = 'flex';
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Festivibes.prototype.onLeavingState = function (stateName) {
        console.log('Leaving state: ' + stateName);
        switch (stateName) {
            /* Example:
        
        case 'myGameState':
        
            // Hide the HTML block we are displaying only during this game state
            dojo.style( 'my_html_block_id', 'display', 'none' );
            
            break;
        */
            case 'dummmy':
                break;
        }
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Festivibes.prototype.onUpdateActionButtons = function (stateName, args) {
        console.log('onUpdateActionButtons: ' + stateName);
        if (this.isCurrentPlayerActive()) {
            switch (stateName
            /*
            Example:

            case 'myGameState':
            
            // Add 3 action buttons in the action status bar:
            
            (this as any).addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' );
            (this as any).addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' );
            (this as any).addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' );
            break;
*/
            ) {
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    Festivibes.prototype.resetClientActionData = function () {
        this.clientActionData = {
            placedCardId: undefined,
            destinationSquare: undefined,
            previousCardParentInHand: undefined
        };
    };
    Festivibes.prototype.addArrowsToActivePlayer = function (state) {
        var notUsefulStates = ['todo'];
        if (state.type === 'activeplayer' &&
            state.active_player !== this.player_id &&
            !notUsefulStates.includes(state.name)) {
            if (!$('goToCurrentPlayer')) {
                dojo.place("\n                    <div id=\"goToCurrentPlayer\" class=\"show-player-tableau\">\n                        <a href=\"#anchor-player-".concat(state.active_player, "\">\n                            <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 85.333343 145.79321\">\n                                <path fill=\"currentColor\" d=\"M 1.6,144.19321 C 0.72,143.31321 0,141.90343 0,141.06039 0,140.21734 5.019,125.35234 11.15333,108.02704 L 22.30665,76.526514 14.626511,68.826524 C 8.70498,62.889705 6.45637,59.468243 4.80652,53.884537 0.057,37.810464 3.28288,23.775161 14.266011,12.727735 23.2699,3.6711383 31.24961,0.09115725 42.633001,0.00129225 c 15.633879,-0.123414 29.7242,8.60107205 36.66277,22.70098475 8.00349,16.263927 4.02641,36.419057 -9.54327,48.363567 l -6.09937,5.36888 10.8401,30.526466 c 5.96206,16.78955 10.84011,32.03102 10.84011,33.86992 0,1.8389 -0.94908,3.70766 -2.10905,4.15278 -1.15998,0.44513 -19.63998,0.80932 -41.06667,0.80932 -28.52259,0 -39.386191,-0.42858 -40.557621,-1.6 z M 58.000011,54.483815 c 3.66666,-1.775301 9.06666,-5.706124 11.99999,-8.735161 l 5.33334,-5.507342 -6.66667,-6.09345 C 59.791321,26.035633 53.218971,23.191944 43.2618,23.15582 33.50202,23.12041 24.44122,27.164681 16.83985,34.94919 c -4.926849,5.045548 -5.023849,5.323672 -2.956989,8.478106 3.741259,5.709878 15.032709,12.667218 24.11715,14.860013 4.67992,1.129637 13.130429,-0.477436 20,-3.803494 z m -22.33337,-2.130758 c -2.8907,-1.683676 -6.3333,-8.148479 -6.3333,-11.893186 0,-11.58942 14.57544,-17.629692 22.76923,-9.435897 8.41012,8.410121 2.7035,22.821681 -9,22.728685 -2.80641,-0.0223 -6.15258,-0.652121 -7.43593,-1.399602 z m 14.6667,-6.075289 c 3.72801,-4.100734 3.78941,-7.121364 0.23656,-11.638085 -2.025061,-2.574448 -3.9845,-3.513145 -7.33333,-3.513145 -10.93129,0 -13.70837,13.126529 -3.90323,18.44946 3.50764,1.904196 7.30574,0.765377 11,-3.29823 z m -11.36999,0.106494 c -3.74071,-2.620092 -4.07008,-7.297494 -0.44716,-6.350078 3.2022,0.837394 4.87543,-1.760912 2.76868,-4.29939 -1.34051,-1.615208 -1.02878,-1.94159 1.85447,-1.94159 4.67573,0 8.31873,5.36324 6.2582,9.213366 -1.21644,2.27295 -5.30653,5.453301 -7.0132,5.453301 -0.25171,0 -1.79115,-0.934022 -3.42099,-2.075605 z\"></path>\n                            </svg>\n                        </a>\n                    </div>\n                    "), 'generalactions', 'last');
            }
            if (!$('goBackUp')) {
                dojo.place("\n                    <div id=\"goBackUp\" class=\"show-player-tableau\">\n                        <a href=\"#\">\n                            <svg version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\" width=\"1280.000000pt\" height=\"1280.000000pt\" viewBox=\"0 0 1280.000000 1280.000000\" preserveAspectRatio=\"xMidYMid meet\">\n                                <g transform=\"translate(0.000000,1280.000000) scale(0.100000,-0.100000)\"\n                                fill=\"currentColor\" stroke=\"none\">\n                                <path d=\"M6305 12787 c-74 -19 -152 -65 -197 -117 -30 -34 -786 -1537 -3070\n                                -6105 -2924 -5849 -3029 -6062 -3035 -6126 -15 -173 76 -326 237 -403 59 -27\n                                74 -30 160 -30 79 1 104 5 150 26 30 13 1359 894 2953 1956 l2897 1932 2897\n                                -1932 c1594 -1062 2923 -1943 2953 -1957 47 -21 70 -25 150 -25 86 0 101 3\n                                160 30 36 17 86 50 111 72 88 79 140 223 124 347 -6 51 -383 811 -3040 6125\n                                -2901 5801 -3036 6069 -3082 6110 -100 90 -246 128 -368 97z\"/>\n                                </g>\n                            </svg>\n                        </a>\n                    </div>\n                    ", 'generalactions', 'last');
            }
        }
    };
    /** Tells if seasons custom sounds are active in user prefs. */
    Festivibes.prototype.isCustomSoundsOn = function () {
        return this.prefs[1].value == 1;
    };
    /*
     * Play a given sound that should be first added in the tpl file
     */
    Festivibes.prototype.playCustomSound = function (sound, playNextMoveSound) {
        if (playNextMoveSound === void 0) { playNextMoveSound = true; }
        if (this.isCustomSoundsOn()) {
            playSound(sound);
            playNextMoveSound && this.disableNextMoveSound();
        }
    };
    /**
     * Gets the player ids of the previous and the next player regarding the player given in parameter
     * @param player
     * @returns an array with the previous player at 0 and the next player at 1
     */
    Festivibes.prototype.getSurroundingPlayersIds = function (player) {
        var playerIndex = this.gamedatas.playerorder.indexOf(parseInt(player.id)); //playerorder is a mixed types array
        if (playerIndex == -1)
            playerIndex = this.gamedatas.playerorder.indexOf(player.id);
        var previousId = playerIndex - 1 < 0
            ? this.gamedatas.playerorder[this.gamedatas.playerorder.length - 1]
            : this.gamedatas.playerorder[playerIndex - 1];
        var nextId = playerIndex + 1 >= this.gamedatas.playerorder.length
            ? this.gamedatas.playerorder[0]
            : this.gamedatas.playerorder[playerIndex + 1];
        return [previousId, nextId];
    };
    /**
     * This method can be used instead of addActionButton, to add a button which is an image (i.e. resource). Can be useful when player
     * need to make a choice of resources or tokens.
     */
    Festivibes.prototype.addImageActionButton = function (id, div, color, tooltip, handler, parentClass) {
        if (color === void 0) { color = 'gray'; }
        if (parentClass === void 0) { parentClass = ''; }
        // this will actually make a transparent button
        ;
        this.addActionButton(id, div, handler, '', false, color);
        // remove boarder, for images it better without
        dojo.style(id, 'border', 'none');
        // but add shadow style (box-shadow, see css)
        dojo.addClass(id, 'shadow bgaimagebutton ' + parentClass);
        // you can also add addition styles, such as background
        if (tooltip)
            dojo.attr(id, 'title', tooltip);
        return $(id);
    };
    Festivibes.prototype.createDiv = function (classes, id, value) {
        if (id === void 0) { id = ''; }
        if (value === void 0) { value = ''; }
        if (typeof value == 'undefined')
            value = '';
        var node = dojo.create('div', { class: classes, innerHTML: value });
        if (id)
            node.id = id;
        return node.outerHTML;
    };
    Festivibes.prototype.groupBy = function (arr, fn) {
        return arr.reduce(function (prev, curr) {
            var _a;
            var groupKey = fn(curr);
            var group = prev[groupKey] || [];
            group.push(curr);
            return __assign(__assign({}, prev), (_a = {}, _a[groupKey] = group, _a));
        }, {});
    };
    Festivibes.prototype.setTooltip = function (id, html) {
        ;
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    Festivibes.prototype.setTooltipToClass = function (className, html) {
        ;
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    Festivibes.prototype.isNotSpectator = function () {
        //console.log('isSpectator', (this as any).isSpectator)
        return (this.isSpectator == false ||
            Object.keys(this.gamedatas.players).includes(this.getPlayerId().toString()));
    };
    Festivibes.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = originalState['description' + property];
        this.gamedatas.gamestate.descriptionmyturn = originalState['descriptionmyturn' + property];
        this.updatePageTitle();
    };
    /**
     * Handle user preferences changes.
     */
    Festivibes.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
            _this.onPreferenceChange(prefId, prefValue);
        };
        // Call onPreferenceChange() when any value changes
        dojo.query('.preference_control').connect('onchange', onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query('#ingame_menu_content .preference_control'), function (el) { return onchange({ target: el }); });
    };
    /**
     * Handle user preferences changes.
     */
    Festivibes.prototype.onPreferenceChange = function (prefId, prefValue) {
        switch (prefId) {
        }
    };
    Festivibes.prototype.setupSettingsIconInMainBar = function () {
        var _this = this;
        dojo.place("\n            <div class='upperrightmenu_item' id=\"player_board_config\">\n                <div id=\"player_config\">\n                    <div id=\"player_config_row\">\n                    <div id=\"show-settings\">\n                        <svg  xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 512\">\n                        <g>\n                            <path class=\"fa-secondary\" fill=\"currentColor\" d=\"M638.41 387a12.34 12.34 0 0 0-12.2-10.3h-16.5a86.33 86.33 0 0 0-15.9-27.4L602 335a12.42 12.42 0 0 0-2.8-15.7 110.5 110.5 0 0 0-32.1-18.6 12.36 12.36 0 0 0-15.1 5.4l-8.2 14.3a88.86 88.86 0 0 0-31.7 0l-8.2-14.3a12.36 12.36 0 0 0-15.1-5.4 111.83 111.83 0 0 0-32.1 18.6 12.3 12.3 0 0 0-2.8 15.7l8.2 14.3a86.33 86.33 0 0 0-15.9 27.4h-16.5a12.43 12.43 0 0 0-12.2 10.4 112.66 112.66 0 0 0 0 37.1 12.34 12.34 0 0 0 12.2 10.3h16.5a86.33 86.33 0 0 0 15.9 27.4l-8.2 14.3a12.42 12.42 0 0 0 2.8 15.7 110.5 110.5 0 0 0 32.1 18.6 12.36 12.36 0 0 0 15.1-5.4l8.2-14.3a88.86 88.86 0 0 0 31.7 0l8.2 14.3a12.36 12.36 0 0 0 15.1 5.4 111.83 111.83 0 0 0 32.1-18.6 12.3 12.3 0 0 0 2.8-15.7l-8.2-14.3a86.33 86.33 0 0 0 15.9-27.4h16.5a12.43 12.43 0 0 0 12.2-10.4 112.66 112.66 0 0 0 .01-37.1zm-136.8 44.9c-29.6-38.5 14.3-82.4 52.8-52.8 29.59 38.49-14.3 82.39-52.8 52.79zm136.8-343.8a12.34 12.34 0 0 0-12.2-10.3h-16.5a86.33 86.33 0 0 0-15.9-27.4l8.2-14.3a12.42 12.42 0 0 0-2.8-15.7 110.5 110.5 0 0 0-32.1-18.6A12.36 12.36 0 0 0 552 7.19l-8.2 14.3a88.86 88.86 0 0 0-31.7 0l-8.2-14.3a12.36 12.36 0 0 0-15.1-5.4 111.83 111.83 0 0 0-32.1 18.6 12.3 12.3 0 0 0-2.8 15.7l8.2 14.3a86.33 86.33 0 0 0-15.9 27.4h-16.5a12.43 12.43 0 0 0-12.2 10.4 112.66 112.66 0 0 0 0 37.1 12.34 12.34 0 0 0 12.2 10.3h16.5a86.33 86.33 0 0 0 15.9 27.4l-8.2 14.3a12.42 12.42 0 0 0 2.8 15.7 110.5 110.5 0 0 0 32.1 18.6 12.36 12.36 0 0 0 15.1-5.4l8.2-14.3a88.86 88.86 0 0 0 31.7 0l8.2 14.3a12.36 12.36 0 0 0 15.1 5.4 111.83 111.83 0 0 0 32.1-18.6 12.3 12.3 0 0 0 2.8-15.7l-8.2-14.3a86.33 86.33 0 0 0 15.9-27.4h16.5a12.43 12.43 0 0 0 12.2-10.4 112.66 112.66 0 0 0 .01-37.1zm-136.8 45c-29.6-38.5 14.3-82.5 52.8-52.8 29.59 38.49-14.3 82.39-52.8 52.79z\" opacity=\"0.4\"></path>\n                            <path class=\"fa-primary\" fill=\"currentColor\" d=\"M420 303.79L386.31 287a173.78 173.78 0 0 0 0-63.5l33.7-16.8c10.1-5.9 14-18.2 10-29.1-8.9-24.2-25.9-46.4-42.1-65.8a23.93 23.93 0 0 0-30.3-5.3l-29.1 16.8a173.66 173.66 0 0 0-54.9-31.7V58a24 24 0 0 0-20-23.6 228.06 228.06 0 0 0-76 .1A23.82 23.82 0 0 0 158 58v33.7a171.78 171.78 0 0 0-54.9 31.7L74 106.59a23.91 23.91 0 0 0-30.3 5.3c-16.2 19.4-33.3 41.6-42.2 65.8a23.84 23.84 0 0 0 10.5 29l33.3 16.9a173.24 173.24 0 0 0 0 63.4L12 303.79a24.13 24.13 0 0 0-10.5 29.1c8.9 24.1 26 46.3 42.2 65.7a23.93 23.93 0 0 0 30.3 5.3l29.1-16.7a173.66 173.66 0 0 0 54.9 31.7v33.6a24 24 0 0 0 20 23.6 224.88 224.88 0 0 0 75.9 0 23.93 23.93 0 0 0 19.7-23.6v-33.6a171.78 171.78 0 0 0 54.9-31.7l29.1 16.8a23.91 23.91 0 0 0 30.3-5.3c16.2-19.4 33.7-41.6 42.6-65.8a24 24 0 0 0-10.5-29.1zm-151.3 4.3c-77 59.2-164.9-28.7-105.7-105.7 77-59.2 164.91 28.7 105.71 105.7z\"></path>\n                        </g>\n                        </svg>\n                    </div>\n                    </div>\n                    <div class='settingsControlsHidden' id=\"settings-controls-container\"></div>\n                </div>\n            </div>\n        ", 'upperrightmenu', 'first');
        dojo.connect($('show-settings'), 'onclick', function () { return _this.toggleSettings(); });
        this.setTooltip('show-settings', _('Display some settings about the game.'));
        var container = $('settings-controls-container');
        this.settings.forEach(function (setting) {
            if (setting.type == 'pref') {
                // Pref type => just move the user pref around
                dojo.place($('preference_control_' + setting.prefId).parentNode.parentNode, container);
            }
        });
    };
    Festivibes.prototype.toggleSettings = function () {
        dojo.toggleClass('settings-controls-container', 'settingsControlsHidden');
        // Hacking BGA framework
        if (dojo.hasClass('ebd-body', 'mobile_version')) {
            dojo.query('.player-board').forEach(function (elt) {
                if (elt.style.height != 'auto') {
                    dojo.style(elt, 'min-height', elt.style.height);
                    elt.style.height = 'auto';
                }
            });
        }
    };
    Festivibes.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Festivibes.prototype.getPlayerScore = function (playerId) {
        var _a, _b;
        return (_b = (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.getValue()) !== null && _b !== void 0 ? _b : Number(this.gamedatas.players[playerId].score);
    };
    Festivibes.prototype.getPlayersCount = function () {
        return Object.values(this.gamedatas.players).length;
    };
    /**
     * Update player score.
     */
    Festivibes.prototype.setPoints = function (playerId, points) {
        var _a;
        ;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(points);
    };
    /**
     * Add an animation to the animation queue, and start it if there is no current animations.
     */
    Festivibes.prototype.addAnimation = function (animation) {
        this.animations.push(animation);
        if (this.animations.length === 1) {
            this.animations[0].animate();
        }
    };
    /**
     * Start the next animation in animation queue.
     */
    Festivibes.prototype.endAnimation = function (ended) {
        var index = this.animations.indexOf(ended);
        if (index !== -1) {
            this.animations.splice(index, 1);
        }
        if (this.animations.length >= 1) {
            this.animations[0].animate();
        }
    };
    /**
     * Timer for Confirm button. Also adds a cancel button to stop timer.
     * Cancel actions can be passed to be executed on cancel button click.
     */
    Festivibes.prototype.startActionTimer = function (buttonId, time, cancelFunction) {
        var _this = this;
        if (this.actionTimerId) {
            window.clearInterval(this.actionTimerId);
            dojo.query('.timer-button').forEach(function (but) { return (but.innerHTML = _this.stripTime(but.innerHTML)); });
            dojo.destroy("cancel-button");
        }
        //adds cancel button
        var button = document.getElementById(buttonId);
        this.addActionButton("cancel-button", _('Cancel'), function () {
            window.clearInterval(_this.actionTimerId);
            button.innerHTML = _this.stripTime(button.innerHTML);
            cancelFunction === null || cancelFunction === void 0 ? void 0 : cancelFunction();
            dojo.destroy("cancel-button");
        }, null, null, 'red');
        var _actionTimerLabel = button.innerHTML;
        var _actionTimerSeconds = time;
        var actionTimerFunction = function () {
            var button = document.getElementById(buttonId);
            if (button == null) {
                window.clearInterval(_this.actionTimerId);
            }
            else if (button.classList.contains('disabled')) {
                window.clearInterval(_this.actionTimerId);
                button.innerHTML = _this.stripTime(button.innerHTML);
            }
            else if (_actionTimerSeconds-- > 1) {
                button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')';
            }
            else {
                window.clearInterval(_this.actionTimerId);
                button.click();
                button.innerHTML = _this.stripTime(button.innerHTML);
            }
        };
        actionTimerFunction();
        this.actionTimerId = window.setInterval(function () { return actionTimerFunction(); }, 1000);
    };
    Festivibes.prototype.stopActionTimer = function () {
        if (this.actionTimerId) {
            window.clearInterval(this.actionTimerId);
            dojo.query('.timer-button').forEach(function (but) { return dojo.destroy(but.id); });
            dojo.destroy("cancel-button");
            this.actionTimerId = undefined;
        }
    };
    Festivibes.prototype.stripTime = function (buttonLabel) {
        var regex = /\s*\([0-9]+\)$/;
        return buttonLabel.replace(regex, '');
    };
    Festivibes.prototype.setChooseActionGamestateDescription = function (newText) {
        if (!this.originalTextChooseAction) {
            this.originalTextChooseAction = document.getElementById('pagemaintitletext').innerHTML;
        }
        document.getElementById('pagemaintitletext').innerHTML = newText !== null && newText !== void 0 ? newText : this.originalTextChooseAction;
    };
    /**
     * Sets the action bar (title and buttons) for Choose action.
     */
    Festivibes.prototype.setActionBarChooseAction = function (fromCancel) {
        var _this = this;
        document.getElementById("generalactions").innerHTML = '';
        if (fromCancel) {
            this.setChooseActionGamestateDescription();
        }
        if (this.actionTimerId) {
            window.clearInterval(this.actionTimerId);
        }
        var chooseActionArgs = this.gamedatas.gamestate.args;
        /*this.addImageActionButton(
            'useTicket_button',
            this.createDiv('expTicket', 'expTicket-button'),
            'blue',
            _('Use a ticket to place another arrow, remove the last one of any expedition or exchange a card'),
            () => {
                this.useTicket();
            }
        );
        $('expTicket-button').parentElement.style.padding = '0';

        dojo.toggleClass('useTicket_button', 'disabled', !chooseActionArgs.canUseTicket);*/
        if (chooseActionArgs.canPass) {
            ;
            this.addActionButton('pass_button', _('End my turn'), function () { return _this.pass(); });
        }
    };
    ///////////////////////////////////////////////////
    //// Player's action
    /*
    
        Here, you are defining methods to handle player's action (ex: results of mouse click on
        game objects).
        
        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server
    
    */
    /**
     * Pass (in case of no possible action).
     */
    Festivibes.prototype.pass = function () {
        if (!this.checkAction('pass')) {
            return;
        }
        this.takeAction('pass');
    };
    Festivibes.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        data.version = this.gamedatas.version;
        this.ajaxcall("/festivibes/festivibes/".concat(action, ".html"), data, this, function () { });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:
        
        In this method, you associate each of your game notifications with your local method to handle it.
        
        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your festivibes.game.php file.
    
    */
    Festivibes.prototype.setupNotifications = function () {
        var _this = this;
        console.log('notifications subscriptions setup');
        // TODO: here, associate your game notifications with local methods
        // Example 1: standard notification handling
        // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
        // Example 2: standard notification handling + tell the user interface to wait
        //            during 3 seconds after calling the method in order to let the players
        //            see what is happening in the game.
        // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
        // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
        //
        var notifs = [
            //['claimedRoute', ANIMATION_MS],
            ['points', 1],
            ['score', ANIMATION_MS],
            ['highlightWinnerScore', ANIMATION_MS],
            ['materialMove', ANIMATION_MS],
            ['lastTurn', 1]
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    /**
     * Update player score.
     */
    Festivibes.prototype.notif_points = function (notif) {
        this.setPoints(notif.args.playerId, notif.args.points);
    };
    /**
     * Show last turn banner.
     */
    Festivibes.prototype.notif_lastTurn = function (animate) {
        if (animate === void 0) { animate = true; }
        dojo.place("<div id=\"last-round\">\n            <span class=\"last-round-text ".concat(animate ? 'animate' : '', "\">").concat(_('Finishing round before end of game!'), "</span>\n        </div>"), 'page-title');
    };
    /**
     * Updates a total or subtotal
     * @param notif
     */
    Festivibes.prototype.notif_score = function (notif) {
        console.log('notif_score', notif);
        this.scoreBoard.updateScore(notif.args.playerId, notif.args.scoreType, notif.args.score);
    };
    Festivibes.prototype.notif_materialMove = function (notif) {
        console.log('notif_materialMove', notif);
        var cards = notif.args.material;
        cards.forEach(function (c) { return console.log('c', c.id); });
    };
    /**
     * Highlight winner for end score.
     */
    Festivibes.prototype.notif_highlightWinnerScore = function (notif) {
        var _a;
        (_a = this.scoreBoard) === null || _a === void 0 ? void 0 : _a.highlightWinnerScore(notif.args.playerId);
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Festivibes.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (typeof args.ticket == 'number') {
                    args.ticket = "<div class=\"icon expTicket\"></div>";
                }
                // make cities names in bold
                ;
                ['from', 'to', 'cities_names'].forEach(function (field) {
                    if (args[field] !== null && args[field] !== undefined && args[field][0] != '<') {
                        args[field] = "<span style=\"color:#2cd51e\"><strong>".concat(_(args[field]), "</strong></span>");
                    }
                });
                ['you', 'actplayer', 'player_name'].forEach(function (field) {
                    if (typeof args[field] === 'string' &&
                        args[field].indexOf('#df74b2;') !== -1 &&
                        args[field].indexOf('text-shadow') === -1) {
                        args[field] = args[field].replace('#df74b2;', '#df74b2; text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black;');
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, 'Exception thrown', e.stack);
        }
        return this.inherited(arguments);
    };
    /**
     * Get current zoom.
     */
    Festivibes.prototype.getZoom = function () {
        return this.map.getZoom();
    };
    /**
     * Get current player.
     */
    Festivibes.prototype.getCurrentPlayer = function () {
        return this.gamedatas.players[this.getPlayerId()];
    };
    return Festivibes;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.festivibes", ebg.core.gamegui, new Festivibes());
});
/**
 * Base class for animations.
 */
var FestivibesAnimation = /** @class */ (function () {
    function FestivibesAnimation(game) {
        this.game = game;
        this.zoom = this.game.getZoom();
    }
    return FestivibesAnimation;
}());
var FESTIVAL_CARD_WIDTH = '238px'; //also change in scss
var FESTIVAL_CARD_HEIGHT = '439px';
function getBackgroundInlineStyleForFestivibesCard(destination) {
    var file;
    switch (destination.type) {
        case 1:
            file = 'festivalCardsFront.jpg';
            break;
    }
    var imagePosition = destination.type_arg - 1;
    var row = Math.floor(imagePosition / IMAGE_FESTIVALS_PER_ROW);
    var xBackgroundPercent = (imagePosition - row * IMAGE_FESTIVALS_PER_ROW) * 100;
    var yBackgroundPercent = row * 100;
    return "background-image: url('".concat(g_gamethemeurl, "img/").concat(file, "'); background-position: -").concat(xBackgroundPercent, "% -").concat(yBackgroundPercent, "%; background-size:1000%;");
}
function addTemporaryClass(element, className, removalDelay) {
    dojo.addClass(element, className);
    setTimeout(function () { return dojo.removeClass(element, className); }, removalDelay);
}
function removeClass(className, rootNode) {
    if (!rootNode)
        rootNode = document;
    else
        rootNode = rootNode;
    rootNode.querySelectorAll('.' + className).forEach(function (item) { return item.classList.remove(className); });
}
/*
 * Detect if spectator or replay
 */
function isReadOnly() {
    return this.isSpectator || typeof this.g_replayFrom != 'undefined' || this.g_archive_mode;
}
/**
 * End score board.
 * No notifications.
 */
var ScoreBoard = /** @class */ (function () {
    function ScoreBoard(game, players) {
        this.game = game;
        this.players = players;
        var headers = document.getElementById('scoretr');
        if (!headers.childElementCount) {
            dojo.place("\n                <th></th>\n                <th id=\"th-destination-reached-score\" class=\"\">_(\"Events reached\")</th>\n                <th id=\"th-revealed-tokens-back-score\" class=\"\">_(\"Revealed events reached\")</th>\n                <th id=\"th-destination-unreached-score\" class=\"\">_(\"Events not reached\")</th>\n                <th id=\"th-revelead-tokens-left-score\" class=\"\">$(\"Revealed events not reached\")</th>\n                <th id=\"th-total-score\" class=\"total-score\">_(\"Total\")</th>\n            ", headers);
        }
        players.forEach(function (player) {
            var playerId = Number(player.id);
            /*dojo.place(
                `<tr id="score${player.id}">
                    <td id="score-name-${player.id}" class="player-name" style="color: #${
                    player.color
                }"><span id="score-winner-${player.id}"/> <span>${player.name}</span></td>
                    <td id="destination-reached${player.id}" class="score-number">${
                    player.completedEvents.length + player.sharedCompletedEventsCount
                }</td>
                    <td id="revealed-tokens-back${player.id}" class="score-number">${
                    player.revealedTokensBackCount
                }</td>
                    <td id="destination-unreached${player.id}" class="score-number">${this.preventMinusZero(
                    player.uncompletedEvents?.length
                )}</td>
                    <td id="revealed-tokens-left${player.id}" class="score-number">${this.preventMinusZero(
                    player.revealedTokensLeftCount
                )}</td>
                    <td id="total${player.id}" class="score-number total">${player.score}</td>
                </tr>`,
                "score-table-body"
            );*/
        });
    }
    ScoreBoard.prototype.updateScores = function (players) {
        /*players.forEach((p) => {
            document.getElementById(`destination-reached${p.id}`).innerHTML = (
                p.completedEvents.length + p.sharedCompletedEventsCount
            ).toString();
            document.getElementById(`revealed-tokens-back${p.id}`).innerHTML = p.revealedTokensBackCount.toString();
            document.getElementById(`destination-unreached${p.id}`).innerHTML = this.preventMinusZero(
                p.uncompletedEvents?.length
            );
            document.getElementById(`revealed-tokens-left${p.id}`).innerHTML = this.preventMinusZero(
                p.revealedTokensLeftCount
            );
            document.getElementById(`total${p.id}`).innerHTML = p.score.toString();
        });*/
    };
    ScoreBoard.prototype.preventMinusZero = function (score) {
        if (score === 0) {
            return '0';
        }
        return '-' + score.toString();
    };
    ScoreBoard.prototype.updateScore = function (playerId, scoreType, score) {
        var elt = dojo.byId(scoreType);
        elt.innerHTML = score.toString();
        dojo.addClass(scoreType, 'animatedScore');
    };
    /**
     * Add trophee icon to top score player(s)
     */
    ScoreBoard.prototype.highlightWinnerScore = function (playerId) {
        document.getElementById("score".concat(playerId)).classList.add('highlight');
        document.getElementById("score-winner-".concat(playerId)).classList.add('fa', 'fa-trophy', 'fa-lg');
    };
    return ScoreBoard;
}());
/**
 * Player table.
 */
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        this.game = game;
        var isMyTable = player.id === game.getPlayerId().toString();
        var ownClass = isMyTable ? 'own' : '';
        var html = "\n\t\t\t<a id=\"anchor-player-".concat(player.id, "\"></a>\n            <div id=\"player-table-").concat(player.id, "\" class=\"player-order").concat(player.playerNo, " player-table ").concat(ownClass, "\">\n\t\t\t    <span class=\"player-name\">").concat(player.name, "</span>\n            </div>\n        ");
        dojo.place(html, 'player-tables');
        if (isMyTable) {
            var handHtml = "\n\t\t\t<div id=\"hand-".concat(player.id, "\" class=\"nml-player-hand\"></div>\n        ");
            dojo.place(handHtml, "player-table-".concat(player.id), 'first');
            this.initHand(player);
        }
    }
    PlayerTable.prototype.initHand = function (player) {
        var smallWidth = window.matchMedia('(max-width: 830px)').matches;
        var baseSettings = {
            center: true,
            gap: '10px'
        };
        if (smallWidth) {
            baseSettings['direction'] = 'row';
            baseSettings['wrap'] = 'nowrap';
        }
        else {
            baseSettings['direction'] = 'col';
            baseSettings['wrap'] = 'wrap';
        }
        //console.log('smallWidth', smallWidth, baseSettings)
        this.handStock = new LineStock(this.game.FestivalCardsManager, $('hand-' + player.id), baseSettings);
        this.handStock.setSelectionMode('single');
    };
    return PlayerTable;
}());
var Setting = /** @class */ (function () {
    function Setting(name, type, prefId) {
        this.name = name;
        this.type = type;
        this.prefId = prefId;
    }
    return Setting;
}());
/**
 * Enable/Disable default features changing here boolean values.
 * Those are read only since they can’t be modified during the game.
 */
var GameFeatureConfig = /** @class */ (function () {
    function GameFeatureConfig() {
        /** Adds the spy icon in other players miniboard. */
        this._spyOnOtherPlayerBoard = false;
        /** Adds the spy active player icon in the main action bar. */
        this._spyOnActivePlayerInGeneralActions = false;
        /** Adds colored <> around the player name in miniboards to show who are the previous and next players. */
        this._showPlayerOrderHints = true;
        /** Shows a player help card in the player miniboard. */
        this._showPlayerHelp = true;
        /** Shows a first player icon in the player miniboard */
        this._showFirstPlayer = false;
    }
    Object.defineProperty(GameFeatureConfig.prototype, "showFirstPlayer", {
        get: function () {
            return this._showFirstPlayer;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameFeatureConfig.prototype, "showPlayerHelp", {
        get: function () {
            return this._showPlayerHelp;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameFeatureConfig.prototype, "showPlayerOrderHints", {
        get: function () {
            return this._showPlayerOrderHints;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameFeatureConfig.prototype, "spyOnActivePlayerInGeneralActions", {
        get: function () {
            return this._spyOnActivePlayerInGeneralActions;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GameFeatureConfig.prototype, "spyOnOtherPlayerBoard", {
        get: function () {
            return this._spyOnOtherPlayerBoard;
        },
        enumerable: false,
        configurable: true
    });
    return GameFeatureConfig;
}());
