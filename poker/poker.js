"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        function locale(key) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return Client.Model.locale.getString(key, args);
        }
        Client.locale = locale;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var SceneController = (function () {
            function SceneController() {
                this._paused = false;
            }
            SceneController.prototype.init = function (container, containerReal, containerSafe) {
                this._container = container;
                this._containerReal = containerReal;
                this._containerSafe = containerSafe;
            };
            SceneController.prototype.onResize = function () {
                Client.Resources.clearCache();
            };
            SceneController.prototype.update = function () {
            };
            SceneController.prototype.pause = function () {
                this._paused = true;
            };
            SceneController.prototype.resume = function () {
                this._paused = false;
            };
            SceneController.prototype.isPaused = function () {
                return this._paused;
            };
            SceneController.removeFromParent = function (objects) {
                for (var i = 0; i < objects.length; i++)
                    if (objects[i].parent)
                        objects[i].parent.removeChild(objects[i]);
            };
            SceneController.prototype.destroy = function () {
            };
            return SceneController;
        }());
        Client.SceneController = SceneController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ScenesManager = (function () {
            function ScenesManager() {
            }
            ScenesManager.init = function (container, containerReal, containerSafe) {
                ScenesManager._container = container;
                ScenesManager._containerReal = containerReal;
                ScenesManager._containerSafe = containerSafe;
            };
            ScenesManager.onResize = function () {
                if (ScenesManager.currentScene)
                    ScenesManager.currentScene.onResize();
            };
            ScenesManager.loop = function () {
                if (!ScenesManager.currentScene || ScenesManager.currentScene.isPaused())
                    return;
                ScenesManager.currentScene.update();
            };
            ScenesManager.createScene = function (id, TScene) {
                if (TScene === void 0) { TScene = Client.SceneController; }
                if (ScenesManager._scenes[id])
                    return ScenesManager._scenes[id];
                var scene = new TScene();
                scene.init(ScenesManager._container, ScenesManager._containerReal, ScenesManager._containerSafe);
                ScenesManager._scenes[id] = scene;
                return scene;
            };
            ScenesManager.goToScene = function (id) {
                if (ScenesManager._scenes[id]) {
                    if (ScenesManager.currentScene)
                        ScenesManager.currentScene.pause();
                    ScenesManager.currentScene = ScenesManager._scenes[id];
                    ScenesManager.currentScene.resume();
                    return true;
                }
                return false;
            };
            ScenesManager._scenes = {};
            return ScenesManager;
        }());
        Client.ScenesManager = ScenesManager;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Event = (function () {
            function Event() {
            }
            Event.CHANGE = 'change';
            return Event;
        }());
        Client.Event = Event;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MouseEvent = (function () {
            function MouseEvent() {
            }
            MouseEvent.contains = function (displayObject, event) {
                if (event.target)
                    return MouseEvent.containsRecursive(displayObject, event.target);
                else if (event.data && event.data.target)
                    return MouseEvent.containsRecursive(displayObject, event.data.target);
                else
                    return false;
            };
            MouseEvent.containsRecursive = function (displayObject, target) {
                if (displayObject === target)
                    return true;
                else if (target.parent)
                    return MouseEvent.containsRecursive(displayObject, target.parent);
                else
                    return false;
            };
            MouseEvent.MOUSE_OVER = 'pointerover';
            MouseEvent.MOUSE_OUT = 'pointerout';
            MouseEvent.MOUSE_DOWN = 'pointerdown';
            MouseEvent.MOUSE_UP = 'pointerup';
            MouseEvent.MOUSE_MOVE = 'pointermove';
            MouseEvent.MOUSE_OUTSIDE = 'pointerupoutside';
            return MouseEvent;
        }());
        Client.MouseEvent = MouseEvent;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MathHelper = (function () {
            function MathHelper() {
            }
            MathHelper.setSeed = function (value) { MathHelper._seed = value; };
            MathHelper.randomBySeed = function () {
                var x = Math.sin(MathHelper._seed++) * 10000;
                return x - Math.floor(x);
            };
            MathHelper.getRandomBySeedMinToMax = function (min, max) {
                return Math.floor(MathHelper.randomBySeed() * (max - min + 1)) + min;
            };
            MathHelper.getRandomMinToMax = function (min, max) {
                return (Math.floor(Math.random() * (max - min + 1)) + min) >> 0;
            };
            MathHelper._seed = 1;
            return MathHelper;
        }());
        Client.MathHelper = MathHelper;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ObjectPool = (function () {
            function ObjectPool(cls) {
                this._metrics = {};
                this._class = cls;
                this._metrics = {};
                this.clearMetrics();
                this._pool = [];
            }
            ObjectPool.prototype.alloc = function () {
                var obj;
                if (this._pool.length == 0) {
                    obj = new this._class();
                    this._metrics.totalalloc++;
                }
                else {
                    obj = this._pool.pop();
                    this._metrics.totalfree--;
                }
                return obj;
            };
            ObjectPool.prototype.free = function (obj) {
                this._pool.push(obj);
                this._metrics.totalfree++;
            };
            ObjectPool.prototype.collect = function () {
                this._pool = [];
                var inUse = this._metrics.totalalloc - this._metrics.totalfree;
                this.clearMetrics(inUse);
            };
            ObjectPool.prototype.clearMetrics = function (allocated) {
                if (allocated === void 0) { allocated = 0; }
                this._metrics.totalalloc = allocated || 0;
                this._metrics.totalfree = 0;
            };
            return ObjectPool;
        }());
        Client.ObjectPool = ObjectPool;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ResizeHelper = (function () {
            function ResizeHelper() {
            }
            ResizeHelper.getNewRectByWidth = function (rect, newWidth) {
                return new PIXI.Rectangle(0, 0, newWidth, newWidth / rect.width * rect.height);
            };
            ResizeHelper.getNewRectByHeight = function (rect, newHeight) {
                return new PIXI.Rectangle(0, 0, newHeight / rect.height * rect.width, newHeight);
            };
            return ResizeHelper;
        }());
        Client.ResizeHelper = ResizeHelper;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Guid = (function () {
            function Guid() {
            }
            Guid.newGuid = function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };
            return Guid;
        }());
        Client.Guid = Guid;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Sounds = (function () {
            function Sounds() {
            }
            Sounds.add = function (sounds, musics) {
                Sounds._sounds = sounds;
                Sounds._musics = musics;
            };
            Object.defineProperty(Sounds, "musicEnabled", {
                get: function () {
                    return Sounds._musicEnabled;
                },
                set: function (value) {
                    Sounds._musicEnabled = value;
                    for (var i = 0; i < Sounds._musics.length; i++)
                        PIXI.sound.find(Sounds._musics[i]).muted = !value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sounds, "globalMute", {
                set: function (value) {
                    PIXI.sound.volumeAll = value ? 0 : 1;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sounds, "soundsEnabled", {
                get: function () {
                    return Sounds._soundsEnabled;
                },
                set: function (value) {
                    Sounds._soundsEnabled = value;
                    for (var i = 0; i < Sounds._sounds.length; i++)
                        PIXI.sound.find(Sounds._sounds[i]).muted = !value;
                },
                enumerable: true,
                configurable: true
            });
            Sounds.play = function (alias, options) {
                if (PIXI.sound.exists(alias))
                    return PIXI.sound.find(alias).play(options);
                else
                    return PIXI.sound.add(alias, 'assets/sounds/' + alias + '.mp3').play(options);
            };
            Sounds.volume = function (alias, value) {
                if (PIXI.sound.exists(alias))
                    PIXI.sound.find(alias).volume = value;
            };
            Sounds.load = function (alias, options) {
                return PIXI.sound.add(alias, options);
            };
            Sounds._musicEnabled = true;
            Sounds._soundsEnabled = true;
            Sounds._sounds = [];
            Sounds._musics = [];
            return Sounds;
        }());
        Client.Sounds = Sounds;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StatCounters;
        (function (StatCounters) {
            StatCounters[StatCounters["session_start"] = 0] = "session_start";
            StatCounters[StatCounters["menu_load"] = 1] = "menu_load";
            StatCounters[StatCounters["player_table_choose"] = 2] = "player_table_choose";
            StatCounters[StatCounters["player_table_dropped"] = 3] = "player_table_dropped";
            StatCounters[StatCounters["player_table_join"] = 4] = "player_table_join";
            StatCounters[StatCounters["player_table_leave"] = 5] = "player_table_leave";
            StatCounters[StatCounters["player_table_bust"] = 6] = "player_table_bust";
            StatCounters[StatCounters["hand_start"] = 7] = "hand_start";
            StatCounters[StatCounters["hand_flop"] = 8] = "hand_flop";
            StatCounters[StatCounters["hand_turn"] = 9] = "hand_turn";
            StatCounters[StatCounters["hand_river"] = 10] = "hand_river";
            StatCounters[StatCounters["hand_complete"] = 11] = "hand_complete";
            StatCounters[StatCounters["table_created"] = 12] = "table_created";
            StatCounters[StatCounters["table_destroyed"] = 13] = "table_destroyed";
            StatCounters[StatCounters["currency_sink"] = 14] = "currency_sink";
            StatCounters[StatCounters["currency_source"] = 15] = "currency_source";
            StatCounters[StatCounters["tap_hourly_drip"] = 16] = "tap_hourly_drip";
            StatCounters[StatCounters["tap_w2e"] = 17] = "tap_w2e";
        })(StatCounters = Client.StatCounters || (Client.StatCounters = {}));
        var Statistic = (function () {
            function Statistic() {
            }
            Object.defineProperty(Statistic, "s", {
                get: function () {
                    return Client.Platform.service;
                },
                enumerable: true,
                configurable: true
            });
            Statistic.Log = function (counter, value, meta) {
                var _meta = meta || {};
                _meta.counter = StatCounters[counter];
                if (value != null)
                    _meta.value = Math.round(value);
                return Statistic.s.fireStats(_meta);
            };
            return Statistic;
        }());
        Client.Statistic = Statistic;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Store = (function () {
            function Store() {
            }
            Store.set = function (key, data) {
                store.set(key, data);
            };
            Store.get = function (key) {
                return store.get(key);
            };
            Store.remove = function (key) {
                return store.remove(key);
            };
            Store.clearAll = function () {
                return store.clearAll();
            };
            return Store;
        }());
        Client.Store = Store;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StringHelper = (function () {
            function StringHelper() {
            }
            StringHelper.numericShortening = function (num, order, digitsAfterDot) {
                if (digitsAfterDot === void 0) { digitsAfterDot = 2; }
                var _ = Math.pow(10, digitsAfterDot), __ = Math.pow(1000, Math.min(order, this.MAX_ORDER_FOR_SHORTENING));
                return Math.floor(num * _ / __) / _;
            };
            StringHelper.getSuffix = function (order) {
                switch (order) {
                    case 1:
                        return 'K';
                    case 2:
                        return 'M';
                    default:
                        return 'MM';
                }
            };
            StringHelper.shortenNumber = function (num) {
                if (!num)
                    return '';
                var countOfDigitsAfterFirst = num.toString().length - 1, numberOrder = Math.floor(countOfDigitsAfterFirst / 3);
                if (numberOrder <= 0) {
                    return num.toString();
                }
                var shortened = this.numericShortening(num, numberOrder);
                var suffix = this.getSuffix(numberOrder);
                return "" + shortened + suffix;
            };
            StringHelper.numberWithCommas = function (num) {
                return num && num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            };
            StringHelper.MAX_ORDER_FOR_SHORTENING = 3;
            return StringHelper;
        }());
        Client.StringHelper = StringHelper;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var SvgHelper = (function () {
            function SvgHelper() {
            }
            SvgHelper._origSizes = {};
            return SvgHelper;
        }());
        Client.SvgHelper = SvgHelper;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Tweener = (function () {
            function Tweener() {
            }
            Tweener.to = function (target, duration, vars) {
                return TweenLite.to(target, duration, vars);
            };
            Tweener.killTweensOf = function (target, onlyActive, vars) {
                if (onlyActive === void 0) { onlyActive = false; }
                if (vars === void 0) { vars = null; }
                TweenLite.killTweensOf(target, onlyActive, vars);
            };
            Tweener.delayedCall = function (delay, callback, params, scope, useFrames) {
                if (params === void 0) { params = null; }
                if (scope === void 0) { scope = null; }
                if (useFrames === void 0) { useFrames = false; }
                return TweenLite.delayedCall(delay, callback, params, scope, useFrames);
            };
            Tweener.killDelayedCallsTo = function (func, scope) {
                if (scope === void 0) { scope = null; }
                var calls = TweenLite.getTweensOf(func);
                for (var i = 0; i < calls.length; i++) {
                    if (calls[i].vars.onCompleteScope === scope || calls[i].vars.callbackScope === scope) {
                        calls[i].kill();
                    }
                }
            };
            Tweener.Power0_easeNone = Power0.easeNone;
            return Tweener;
        }());
        Client.Tweener = Tweener;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var FontsHelper;
        (function (FontsHelper) {
            var Text = (function () {
                function Text() {
                }
                Text.loadFonts = function (timeout, onLoadCallback, onErrorCallback) {
                    var fontsFamilies = [Text.FONT_MAIN, Text.FONT_MYRIAD, Text.FONT_3];
                    Promise.all(fontsFamilies
                        .map(function (family) { return new FontFaceObserver(family); })
                        .map(function (observer) { return observer.load(null, timeout); }))
                        .then(onLoadCallback, onErrorCallback);
                };
                Text.FONT_MAIN = 'Lato Regular';
                Text.FONT_MYRIAD = 'Myriad Pro Condensed';
                Text.FONT_3 = 'Bebas Neue';
                Text.fontWhite10 = { fontFamily: Text.FONT_MAIN, fill: 0xffffff, fontSize: 10 };
                Text.fontFps = { fontFamily: Text.FONT_MAIN, fill: 0xffffff, fontSize: 18 };
                Text.fontWhiteStroke16 = { fontFamily: Text.FONT_MAIN, fill: 0xffffff, fontSize: 18, stroke: 0, strokeThickness: 2, align: 'center', lineJoin: 'round' };
                Text.fontRaiseSwype = { fontFamily: Text.FONT_MAIN, fill: 0xf7ae4f, fontSize: 18, stroke: 0, strokeThickness: 2, align: 'center', lineJoin: 'round' };
                Text.fontRaiseBet = { fontFamily: Text.FONT_MAIN, fill: 0xffffff, fontSize: 18, stroke: 0, strokeThickness: 2, align: 'center', lineJoin: 'round' };
                Text.fontForButton = { fontFamily: Text.FONT_MAIN, fill: 0xACA9D4, fontSize: 24, stroke: 0x413996, strokeThickness: 2, align: 'center', fontWeight: 'bold', lineJoin: 'round' };
                Text.fontForButtonBet = { fontFamily: Text.FONT_MAIN, fill: 0xffffff, fontSize: 10, align: 'center', fontWeight: 'normal', lineJoin: 'round' };
                Text.fontForButtonIconBet = { fontFamily: Text.FONT_MYRIAD, fill: 0x000000, fontSize: 10, align: 'center', fontWeight: 'bold', lineJoin: 'round' };
                Text.fontWhiteStroke18 = { fontFamily: 'Arial', fill: 0xffffff, fontSize: 18, stroke: 0, strokeThickness: 2, align: 'center', fontWeight: 'bold', lineJoin: 'round' };
                Text.fontWhiteStroke26 = { fontFamily: 'Arial', fill: 0xffffff, fontSize: 24, stroke: 0, strokeThickness: 2, align: 'center', fontWeight: 'bold', lineJoin: 'round' };
                Text.fontForLevelBar = {
                    fontFamily: 'Lato Regular',
                    fill: 0xffffff,
                    fontSize: 10,
                    align: 'left',
                    fontWeight: 'bold',
                };
                Text.fontForSelectTableButton = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xf3d7a0,
                    fontSize: 16,
                    align: 'center',
                    letterSpacing: 0,
                    fontWeight: 'normal',
                };
                Text.fontForTableUnitBodyStakes = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xb56804,
                    fontSize: 16,
                    align: 'center',
                    letterSpacing: 0,
                    fontWeight: 'normal',
                };
                Text.fontForTableUnitBodyName = {
                    fontFamily: 'Bebas Neue',
                    fill: 0x791b0a,
                    fontSize: 16,
                    align: 'center',
                    letterSpacing: -0.4,
                    fontWeight: 'bold',
                };
                Text.fontForTableUnitBodyStakesRange = {
                    fontFamily: 'Lato Regular',
                    fill: 0xb56804,
                    fontSize: 10,
                    align: 'right',
                };
                Text.fontForSettingsHeader = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xf3d7a0,
                    fontSize: 16,
                    align: 'left',
                    letterSpacing: 0,
                    fontWeight: 'bold',
                };
                Text.fontForSettingsUnit = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xf3d7a0,
                    fontSize: 16,
                    align: 'left',
                    fontWeight: 'bold',
                };
                Text.fontForNextHandLabel = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xffffff,
                    fontSize: 16,
                    fontWeight: 'bold',
                };
                Text.fontForChipCounter = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'left',
                };
                Text.fontForHourlyDrip = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0x42091d,
                    fontSize: 16,
                    align: 'left',
                    lineHeight: 8.5,
                    letterSpacing: 0.3,
                };
                Text.fontForHourlyDripTip = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xf3d7a0,
                    fontSize: 16,
                    align: 'left',
                    dropShadowColor: 0xffffff,
                    dropShadowBlur: 1,
                    dropShadowDistance: 2,
                };
                Text.fontForFreeChipsButton = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForFreeChipsPanelTopLabel = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xfdaeb2,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForFreeChipsPanelBottomLabel = {
                    fontFamily: 'Bebas Neue',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForRewardVideoPopupHeader = {
                    fontFamily: 'Bebas Neue',
                    fill: 0xefddbc,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForRewardVideoPopupBody = {
                    fontFamily: 'Lato Regular',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                    wordWrap: true,
                };
                Text.fontForRewardVideoPopupButton = {
                    fontFamily: 'Bebas Neue',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForNotEnoughPopupHeader = {
                    fontFamily: 'Bebas Neue',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForNotEnoughPopupBody = {
                    fontFamily: 'Lato Regular',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                    fontWeight: 'normal',
                    wordWrap: true,
                };
                Text.fontForStandUpPopupHeader = {
                    fontFamily: 'Bebas Neue',
                    fill: 0xefddbc,
                    fontSize: 16,
                    align: 'center',
                };
                Text.fontForStandUpPopupUnit = {
                    fontFamily: 'Myriad Pro Condensed',
                    fill: 0xffffff,
                    fontSize: 16,
                    align: 'center',
                    fontWeight: 'normal',
                };
                return Text;
            }());
            FontsHelper.Text = Text;
            var BitmapText = (function () {
                function BitmapText() {
                }
                BitmapText.fontSmall = { font: 'font0' };
                BitmapText.fontMedium = { font: 'font1' };
                BitmapText.fontBig = { font: 'font2' };
                return BitmapText;
            }());
            FontsHelper.BitmapText = BitmapText;
        })(FontsHelper = Client.FontsHelper || (Client.FontsHelper = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        ;
        var PlatformBase = (function (_super) {
            __extends(PlatformBase, _super);
            function PlatformBase() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.token = '';
                _this.userId = '';
                _this.username = '';
                _this.signature = '';
                _this.userPhotoUrl = '';
                return _this;
            }
            PlatformBase.READY = 'PlatformBase_READY';
            PlatformBase.INIT = 'PlatformBase_INIT';
            PlatformBase.START = 'PlatformBase_START';
            return PlatformBase;
        }(PIXI.utils.EventEmitter));
        Client.PlatformBase = PlatformBase;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var FBInstantGames = (function (_super) {
            __extends(FBInstantGames, _super);
            function FBInstantGames() {
                var _this = _super.call(this) || this;
                _this._lastVideo = null;
                return _this;
            }
            FBInstantGames.prototype.fireStats = function (data) {
                throw new Error("Method not implemented.");
            };
            FBInstantGames.prototype.getInviteData = function () {
                throw new Error("Method not implemented.");
            };
            FBInstantGames.prototype.requestShareAsync = function (data) {
                throw new Error("Method not implemented.");
            };
            FBInstantGames.prototype.init = function () {
                FBInstant.initializeAsync().then(this.onInitFBInstant.bind(this));
            };
            FBInstantGames.prototype.start = function () {
                FBInstant.startGameAsync().then(this.onStartFBInstant.bind(this));
            };
            FBInstantGames.prototype.onInitFBInstant = function () {
                this.emit(Client.PlatformBase.INIT);
            };
            FBInstantGames.prototype.onStartFBInstant = function () {
                this.emit(Client.PlatformBase.START);
                this.userId = FBInstant.player.getID();
                this.username = FBInstant.player.getName();
                this.userPhotoUrl = FBInstant.player.getPhoto();
                this.emit(Client.PlatformBase.READY);
                throw new Error('need create token');
            };
            FBInstantGames.prototype.requestRewardedVideo = function (callback) {
                var _this = this;
                FBInstant.getRewardedVideoAsync(0)
                    .then(function (rewardedVideo) {
                    _this._lastVideo = rewardedVideo;
                    callback({ code: "OK", message: "" });
                }, callback);
            };
            FBInstantGames.prototype.showRewardedVideo = function (callback) {
                var _this = this;
                if (this._lastVideo) {
                    this._lastVideo.loadAsync()
                        .then(function () {
                        return _this._lastVideo.showAsync();
                    }, callback)
                        .then(function () {
                        callback({ code: "SHOWED", message: "" });
                    }, callback);
                }
            };
            Object.defineProperty(FBInstantGames.prototype, "progress", {
                get: function () {
                    return this._progress;
                },
                set: function (p) {
                    this._progress = p;
                    FBInstant.setLoadingProgress(p);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FBInstantGames.prototype, "appId", {
                get: function () {
                    return -1;
                },
                enumerable: true,
                configurable: true
            });
            FBInstantGames.FB_REWARDEDVIDEO_PLACEMENT = "my_placement_id";
            return FBInstantGames;
        }(Client.PlatformBase));
        Client.FBInstantGames = FBInstantGames;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Platform = (function (_super) {
            __extends(Platform, _super);
            function Platform() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Platform.createService = function (test) {
                this.service = test ? new Client.TestService() : new Client.ZyngaGames();
                return this.service;
            };
            return Platform;
        }(PIXI.utils.EventEmitter));
        Client.Platform = Platform;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var RewardedVideoController = (function (_super) {
            __extends(RewardedVideoController, _super);
            function RewardedVideoController() {
                var _this = _super.call(this) || this;
                _this._tickerID = -1;
                _this._status = RewardedVideoController.STOP;
                return _this;
            }
            Object.defineProperty(RewardedVideoController.prototype, "status", {
                get: function () {
                    return this._status;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RewardedVideoController, "instance", {
                get: function () {
                    if (!RewardedVideoController._instance) {
                        RewardedVideoController._instance = new RewardedVideoController();
                    }
                    return RewardedVideoController._instance;
                },
                enumerable: true,
                configurable: true
            });
            RewardedVideoController.prototype.run = function (force, duration) {
                if (force === void 0) { force = false; }
                if (duration === void 0) { duration = undefined; }
                this._duration = duration || Client.Config.REWARDED_VIDEO_DELAY_DURATION;
                if (force)
                    this._duration = 0;
                this._lastRunnedTime = new Date();
                this._status = RewardedVideoController.TICK;
                clearInterval(this._tickerID);
                this._tickerID = setInterval(this.tick.bind(this), 1000);
            };
            RewardedVideoController.run = function (force) {
                if (force === void 0) { force = false; }
                this.instance.run(force);
            };
            RewardedVideoController.prototype.stop = function () {
                clearInterval(this._tickerID);
                this._status = RewardedVideoController.STOP;
                Client.trace("[RewardedVideoController] TIMER WAS BE STOPED");
            };
            RewardedVideoController.stop = function () {
                this.instance.stop();
            };
            RewardedVideoController.prototype.tick = function () {
                var _this = this;
                if (this.left <= 0) {
                    this.stop();
                    Client.trace("[RewardedVideoController] Try get ADS");
                    Client.Platform.service.requestRewardedVideo(function (status) {
                        Client.trace(status.message, status);
                        if (status.code == "OK" || status.code == "UNSUPPORTED") {
                            _this._status = RewardedVideoController.AVAILABLE;
                            _this.emit(RewardedVideoController.AVAILABLE);
                        }
                        else {
                            _this.run();
                            _this.run(false, RewardedVideoController.TIME_OFFSET);
                            Client.trace("[RewardedVideoController] shift timer on 1min. Run time:" + _this._lastRunnedTime);
                        }
                    });
                }
                this.emit(RewardedVideoController.TICK, {
                    start: this._lastRunnedTime,
                    expired: this.expired,
                    left: this.left
                });
            };
            RewardedVideoController.prototype.show = function (callback) {
                if (this._status != RewardedVideoController.AVAILABLE)
                    throw new Error("[RewardedVideoController]" + "you cant't show video. Wait again " + this.left + "sec");
                Client.Platform.service.showRewardedVideo(function (e) {
                    Client.trace("[RewardedVideoController] show status:", e);
                    callback(e);
                    if (e.code == "SHOWED") {
                    }
                    else {
                        throw new Error("[RewardedVideoController] error:" + e);
                    }
                });
            };
            Object.defineProperty(RewardedVideoController.prototype, "expired", {
                get: function () {
                    return (Date.now() - this._lastRunnedTime.valueOf()) / 1000;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RewardedVideoController.prototype, "left", {
                get: function () {
                    return this._duration - this.expired;
                },
                enumerable: true,
                configurable: true
            });
            RewardedVideoController.STOP = "Rewarded_timer_STOP";
            RewardedVideoController.TICK = "Rewarded_timer_TICK";
            RewardedVideoController.AVAILABLE = "Rewarded_AVAILABLE";
            RewardedVideoController.TIME_OFFSET = 60;
            return RewardedVideoController;
        }(PIXI.utils.EventEmitter));
        Client.RewardedVideoController = RewardedVideoController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var TestService = (function (_super) {
            __extends(TestService, _super);
            function TestService() {
                var _this = _super.call(this) || this;
                _this.appId = -1;
                return _this;
            }
            TestService.prototype.init = function () {
                this.emit(Client.PlatformBase.INIT);
                var users = new Client.MUsers();
                users.generateRandomUsers();
                var testUser = users.getRandomUser();
                this.userId = testUser.id;
                this.username = testUser.name;
                this.userPhotoUrl = testUser.photo;
                this.token = this.getRandomToken();
            };
            TestService.prototype.getRandomToken = function () {
                var token;
                var max = 0;
                while (true && max < 100) {
                    token = TestService.TEST_TOKENS[Client.MathHelper.getRandomMinToMax(0, TestService.TEST_TOKENS.length - 1)];
                    if (Client.Store.get(token)) {
                        max++;
                        Client.trace(' token already used');
                        continue;
                    }
                    Client.Store.set(token, true);
                    Client.trace(' token found');
                    break;
                }
                return token;
            };
            TestService.prototype.start = function () {
                this.emit(Client.PlatformBase.START);
                this.emit(Client.PlatformBase.READY);
            };
            Object.defineProperty(TestService.prototype, "progress", {
                get: function () {
                    return this._progress;
                },
                set: function (p) {
                    this._progress = p;
                },
                enumerable: true,
                configurable: true
            });
            TestService.prototype.requestRewardedVideo = function (callback) {
                console.warn("Method can't support on this platform");
                callback({
                    code: "UNSUPPORTED",
                    message: "Method can't support on this platform"
                });
            };
            TestService.prototype.showRewardedVideo = function (callback) {
                callback({
                    code: "SHOWED",
                    message: "Method can't support on this platform"
                });
            };
            TestService.prototype.requestShareAsync = function (data) {
                console.warn("Method can't support on this platform.");
                return new Promise(function (res, rej) {
                    setTimeout(function () {
                        rej({ code: "UNSUPPOROT", message: "Method can't support on this platform" });
                    }, 0);
                });
            };
            TestService.prototype.fireStats = function (data) {
                console.log("[TEST SERVICE STATISTIC]", data);
                return new Promise(function (res, rej) { });
            };
            TestService.prototype.getInviteData = function () {
                return null;
            };
            TestService.TEST_TOKENS = ['sn42v1.h7sZg9C8dDzQVVd5YXgB4RnDeGU3cTfRZhcu1BQWJtk.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiOWM0MWVhNDctMDA4Zi00ZWM5LWEyMmItNzFhNjMyOWNjYzcyIiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.oeL61O3xGW3xcP5soFGlEA2pIaWOjRyJ5YqvGJJicto.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiMDc2NGZiNzMtNDQwYi00ZTJiLTkyZTItZWIwMTgyMTQ4MzAwIiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.nfSCt89ahTBL_94ZzQQdQQosUMmJU6qRbkH6UB58h_s.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiODZmMjhjN2EtNjdmNC00NTllLTk0YWEtMWQ5ZDU2MTIzYWM2IiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.azbDq5-S7T5rM5WZnwAeQ4PvOBbGFH5O3NqC_xO6F98.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiYWJkMDE4OTAtMThlNi00YWRlLWE2NTUtMTg3NTE1MDJmMGZkIiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.kJ858i8zBQ53XHHxev_Fv3jbaysTDdWgfJcPOBiulkQ.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiMTZmMGRkZTMtNDU5ZS00MDM4LWE4YTctNDgxN2ZmYjIxZTg3IiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.lhVrOF5poE0qaQYiR1JbfE1KLSZ1zqzfCFUutBwesWc.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiNDljMWNiNmQtYzQ2Ny00ZjZkLTk1MTktMWY5NDMzM2VkYzFiIiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.S6z7mgL8ruE1rg63JjtaV3b_TbyGL-YMbrLYgzdKlK8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiNDRlNGJjZjItNTk2OC00MTcyLTgwZDUtZjAwZThmMmRhMjEzIiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.jfujrRYAznB2SMiuuV4Dj6cMkENsWq3X14c_WYirVMc.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiYjRkOWFlODItODIxZS00ZGQzLWJhNTEtNDc1ZjQ0NjFhODU1IiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.2D-gvuBdWd6ZcxGLEXUhETLlAfT7zjPeefkS2H47cfQ.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiYTBjMWMwZjYtZDhiOS00MWU1LWI4YzEtMTY5ZjQ4NTI4MDNkIiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ',
                'sn42v1.eDSBlU2RNMWvuDNJLzt6IS3g0M5dSpKWuym17JRzr38.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUyMjEwNTA5NSwicGxheWVyX2lkIjoiOTgxMzk4MmMtNWZlNi00ZWI3LWJlOTEtOGY5YTlkMDIwNzk4IiwicmVxdWVzdF9wYXlsb2FkIjoie1wiYVwiOjEyM30ifQ'
            ];
            return TestService;
        }(Client.PlatformBase));
        Client.TestService = TestService;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ZyngaGames = (function (_super) {
            __extends(ZyngaGames, _super);
            function ZyngaGames() {
                var _this = _super.call(this) || this;
                _this._config = {
                    authSocialNetworkID: 42,
                    clientVersion: '1.0.32',
                    apiURLBase: '/atg-turns/v1',
                    apps: {
                        '947228248768459': {
                            appName: 'Zynga Poker',
                            appId: 5004678,
                            interstitialAd: '947228248768459_952386758252608',
                            rewardedVideoAd: '947228248768459_952387361585881'
                        },
                        '1734191989960724': {
                            appName: 'Zynga Poker - Stage',
                            appId: 5004677,
                            interstitialAd: '1734191989960724_1745121708867752',
                            rewardedVideoAd: '1734191989960724_1745123258867597'
                        },
                        '1875658362720017': {
                            appName: 'Zynga Poker - Dev',
                            appId: 5004676,
                            interstitialAd: '1875658362720017_1899391040346749',
                            rewardedVideoAd: '1875658362720017_1880351825584004'
                        }
                    }
                };
                _this._lastVideo = null;
                return _this;
            }
            Object.defineProperty(ZyngaGames.prototype, "FB_REWARDEDVIDEO_PLACEMENT", {
                get: function () {
                    switch (Client.Config.appLocation) {
                        case Client.APP_LOCATION.PROD:
                            return this._config.apps["947228248768459"].rewardedVideoAd;
                        case Client.APP_LOCATION.STAGING:
                            return this._config.apps["1734191989960724"].rewardedVideoAd;
                        case Client.APP_LOCATION.DEV:
                            return this._config.apps["1875658362720017"].rewardedVideoAd;
                    }
                },
                enumerable: true,
                configurable: true
            });
            ;
            ZyngaGames.prototype.init = function () {
                Zynga.init(this._config);
                Zynga.Instant.initializeAsync()
                    .then(this.onInitZyngaInstant.bind(this));
            };
            ZyngaGames.prototype.start = function () {
                Zynga.Instant.startGameAsync()
                    .then(this.onStartZyngaInstant.bind(this));
            };
            ZyngaGames.prototype.onInitZyngaInstant = function () {
                this.emit(Client.PlatformBase.INIT);
            };
            ZyngaGames.prototype.onStartZyngaInstant = function () {
                this.emit(Client.PlatformBase.START);
                Zynga.Account.Event.
                    last(Zynga.Account.Events.ACCOUNT_DETAILS)
                    .then(this.onAccountDetails.bind(this));
            };
            ZyngaGames.prototype.onAccountDetails = function (data) {
                this.userId = Zynga.Instant.player.getID();
                this.username = Zynga.Instant.player.getName();
                this.userPhotoUrl = Zynga.Instant.player.getPhoto();
                this.token = data.token;
                this.emit(Client.PlatformBase.READY);
            };
            ZyngaGames.prototype.requestRewardedVideo = function (callback) {
                var _this = this;
                var token = this.FB_REWARDEDVIDEO_PLACEMENT;
                Client.trace("[Zynga Games] request ADS ID:", token);
                var promise = null;
                if (this._lastVideo) {
                    Client.trace("[Rewarded] try load last video");
                    promise = this._lastVideo.loadAsync();
                }
                else {
                    promise = Zynga.Instant.getRewardedVideoAsync(token)
                        .then(function (rewardedVideo) {
                        _this._lastVideo = rewardedVideo;
                        Client.trace("[Rewarded] Try load video", _this._lastVideo);
                        return _this._lastVideo.loadAsync();
                    });
                }
                promise.then(function () {
                    Client.trace("[Rewarded] Video was loaded");
                    callback({ code: "OK", message: "" });
                }).catch(function (status) {
                    callback(status);
                    Client.trace("[Loading Rewarded ERROR] ", status);
                });
            };
            ZyngaGames.prototype.showRewardedVideo = function (callback) {
                var _this = this;
                if (this._lastVideo) {
                    this._lastVideo.showAsync()
                        .then(function () {
                        _this._lastVideo = null;
                        callback({ code: "SHOWED", message: "" });
                    }, function (e) {
                        callback(e);
                        _this._lastVideo = null;
                    });
                }
            };
            ZyngaGames.prototype.requestShareAsync = function (data) {
                data.data = data.data || ZyngaGames.DEFAULT_SHARE.data;
                data.image = data.image || ZyngaGames.DEFAULT_SHARE.image;
                data.intent = data.intent || ZyngaGames.DEFAULT_SHARE.intent;
                data.text = data.text || ZyngaGames.DEFAULT_SHARE.text;
                return Zynga.Instant.shareAsync(data);
            };
            ZyngaGames.prototype.getInviteData = function () {
                return Zynga.Instant.getEntryPointData();
            };
            ZyngaGames.prototype.fireStats = function (data) {
                return Zynga.Analytics.logCount(data)
                    .then(function (msg) {
                    Client.trace("[ZYNGA STATS SEND]", msg);
                }, function (err) {
                    Client.trace("[ZYNGA STATS ERR]", err);
                });
            };
            Object.defineProperty(ZyngaGames.prototype, "progress", {
                get: function () {
                    return this._progress;
                },
                set: function (p) {
                    this._progress = p;
                    Zynga.Instant.setLoadingProgress(p);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ZyngaGames.prototype, "appId", {
                get: function () {
                    return -1;
                },
                enumerable: true,
                configurable: true
            });
            ZyngaGames.APP_ID_DEV = '1875658362720017';
            ZyngaGames.APP_ID_STAGING = '1734191989960724';
            ZyngaGames.APP_ID_PROD = '947228248768459';
            ZyngaGames.DEFAULT_SHARE = {
                text: "Common!",
                intent: "REQUEST",
                data: {},
                image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAE0lEQVR42mM0u5RSz4AEGEkXAAAzAwex00cg9AAAAABJRU5ErkJggg=="
            };
            return ZyngaGames;
        }(Client.PlatformBase));
        Client.ZyngaGames = ZyngaGames;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var FPSCounter = (function (_super) {
            __extends(FPSCounter, _super);
            function FPSCounter() {
                var _this = _super.call(this, '', Client.FontsHelper.Text.fontFps) || this;
                _this._filterStrength = 20;
                _this._frameTime = 0;
                _this._lastLoop = new Date();
                _this._thisLoop = new Date();
                return _this;
            }
            FPSCounter.prototype.onRender = function () {
                this._thisLoop = new Date();
                var thisFrameTime = this._thisLoop.getTime() - this._lastLoop.getTime();
                this._frameTime += (thisFrameTime - this._frameTime) / this._filterStrength;
                this._lastLoop = this._thisLoop;
                this.text = (1000 / this._frameTime).toFixed(0) + ' fps';
            };
            FPSCounter.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return FPSCounter;
        }(PIXI.Text));
        Client.FPSCounter = FPSCounter;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonBase = (function (_super) {
            __extends(ButtonBase, _super);
            function ButtonBase(w, h) {
                var _this = _super.call(this) || this;
                _this._w = 1;
                _this._h = 1;
                _this._isDown = false;
                _this._isOver = false;
                _this._curState = ButtonBase.STATE_UP;
                _this._w = w;
                _this._h = h;
                _this.interactive = true;
                _this.buttonMode = true;
                _this.on(Client.MouseEvent.MOUSE_DOWN, _this.onDown, _this);
                _this.on(Client.MouseEvent.MOUSE_UP, _this.onUp, _this);
                _this.on(Client.MouseEvent.MOUSE_OUTSIDE, _this.onUp, _this);
                _this.on(Client.MouseEvent.MOUSE_OVER, _this.onOver, _this);
                _this.on(Client.MouseEvent.MOUSE_OUT, _this.onOut, _this);
                return _this;
            }
            Object.defineProperty(ButtonBase.prototype, "disabled", {
                get: function () {
                    return this._curState == ButtonBase.STATE_DISABLED;
                },
                set: function (value) {
                    this._curState = value ? ButtonBase.STATE_DISABLED : ButtonBase.STATE_UP;
                    this.onChangeState();
                },
                enumerable: true,
                configurable: true
            });
            ButtonBase.prototype.onDown = function () {
                if (this.disabled)
                    return;
                this._isDown = true;
                this._curState = ButtonBase.STATE_DOWN;
                this.onChangeState();
            };
            ButtonBase.prototype.emitClick = function () {
                this.emit(ButtonBase.EVENT_CLICK, this);
                Client.Sounds.play(Client.SoundsHelper.BUTTON_CLICK);
            };
            ButtonBase.prototype.onUp = function (e) {
                if (this.disabled)
                    return;
                var wasDown = this._isDown;
                this._isDown = false;
                if (this._isOver)
                    this._curState = ButtonBase.STATE_OVER;
                else
                    this._curState = ButtonBase.STATE_UP;
                this.onChangeState();
                if (wasDown) {
                    var mousePos = e.data.getLocalPosition(this);
                    if (mousePos.x > 0 && mousePos.y > 0 && mousePos.x < this._w && mousePos.y < this._h)
                        this.emitClick();
                }
            };
            ButtonBase.prototype.onOver = function () {
                if (this.disabled)
                    return;
                this._isOver = true;
                if (this._isDown)
                    return;
                this._curState = ButtonBase.STATE_OVER;
                this.onChangeState();
            };
            ButtonBase.prototype.onOut = function () {
                if (this.disabled)
                    return;
                this._isOver = false;
                if (this._isDown)
                    return;
                this._curState = ButtonBase.STATE_UP;
                this.onChangeState();
            };
            ButtonBase.prototype.onChangeState = function () {
                this.buttonMode = this.interactive = !this.disabled;
            };
            ButtonBase.prototype.getWidth = function () {
                return this._w;
            };
            ButtonBase.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                var scale = value / this._w;
                this._w = value;
                if (saveProportions)
                    this._h *= scale;
            };
            ButtonBase.prototype.getHeight = function () {
                return this._h;
            };
            ButtonBase.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                var scale = value / this._h;
                this._h = value;
                if (saveProportions)
                    this._w *= scale;
            };
            ButtonBase.prototype.destroy = function () {
                this.off(Client.MouseEvent.MOUSE_DOWN, this.onDown, this);
                this.off(Client.MouseEvent.MOUSE_UP, this.onUp, this);
                this.off(Client.MouseEvent.MOUSE_OUTSIDE, this.onUp, this);
                this.off(Client.MouseEvent.MOUSE_OVER, this.onOver, this);
                this.off(Client.MouseEvent.MOUSE_OUT, this.onOut, this);
                _super.prototype.destroy.call(this);
            };
            ButtonBase.EVENT_CLICK = 'EVENT_CLICK';
            ButtonBase.STATE_UP = 1;
            ButtonBase.STATE_DOWN = 2;
            ButtonBase.STATE_OVER = 3;
            ButtonBase.STATE_DISABLED = 4;
            return ButtonBase;
        }(PIXI.Container));
        Client.ButtonBase = ButtonBase;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonIcon = (function (_super) {
            __extends(ButtonIcon, _super);
            function ButtonIcon(icon) {
                var _this = this;
                var bgTexture = PIXI.loader.resources.atlas.textures['btn_bg.png'];
                _this = _super.call(this, bgTexture.orig.width, bgTexture.orig.height) || this;
                _this.origSize = bgTexture.orig;
                _this._shadowOffset = 1;
                _this._shadow = new PIXI.Sprite(PIXI.loader.resources.atlas.textures['btn_bg.png']);
                _this._shadow.tint = 0;
                _this._shadow.filters = [new PIXI.filters.BlurFilter(3)];
                _this.addChild(_this._shadow);
                _this._cont = new PIXI.Container();
                _this.addChild(_this._cont);
                _this._bg = PIXI.Sprite.fromFrame('btn_bg.png');
                _this._cont.addChild(_this._bg);
                _this._icon = icon;
                _this._icon.width = _this._w / 1.6;
                _this._icon.height = _this._h / 1.6;
                _this._icon.x = _this._w / 2 - _this._icon.width / 2;
                _this._icon.y = _this._h / 2 - _this._icon.height / 2;
                _this._cont.addChild(_this._icon);
                _this.onResize();
                _this.onChangeState();
                return _this;
            }
            ButtonIcon.prototype.onResize = function () {
                this._shadowOffset = this._h / 24;
                this._shadow.width = this._w;
                this._shadow.height = this._h;
                this._shadow.x = this._shadowOffset;
                this._shadow.y = this._shadowOffset;
                this._cont.width = this._w;
                this._cont.height = this._h;
            };
            ButtonIcon.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setWidth.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonIcon.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setHeight.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonIcon.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this._shadow.visible = this._curState != Client.ButtonBase.STATE_DOWN;
                this._cont.x = this._curState == Client.ButtonBase.STATE_DOWN ? this._shadowOffset : 0;
                this._cont.y = this._curState == Client.ButtonBase.STATE_DOWN ? this._shadowOffset : 0;
            };
            ButtonIcon.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._icon.destroy();
                this._shadow.destroy();
                this._cont.destroy();
            };
            return ButtonIcon;
        }(Client.ButtonBase));
        Client.ButtonIcon = ButtonIcon;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonImage = (function (_super) {
            __extends(ButtonImage, _super);
            function ButtonImage(up, over, down, disabled) {
                if (disabled === void 0) { disabled = null; }
                var _this = this;
                var texture = ButtonImage.getTexture(up);
                _this = _super.call(this, texture.width, texture.height) || this;
                _this._upStr = up;
                _this._overStr = over;
                _this._downStr = down;
                _this._disabledStr = disabled;
                _this._sprite = new PIXI.Sprite(texture);
                _this.addChild(_this._sprite);
                return _this;
            }
            ButtonImage.prototype.onResize = function () {
                this._sprite.texture = ButtonImage.getTexture(this.getActualTextureKey(), this._w);
                this._sprite.width = this._w;
                this._sprite.height = this._h;
            };
            ButtonImage.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setWidth.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonImage.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setHeight.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonImage.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this.alpha = 1;
                var textureKey = this.getActualTextureKey();
                if (this._curState == Client.ButtonBase.STATE_DISABLED && !this._disabledStr) {
                    this.alpha = 0.5;
                }
                this._sprite.texture = ButtonImage.getTexture(textureKey, this._w);
            };
            ButtonImage.getTexture = function (key, width) {
                return Client.Resources.getTexture(key, { width: width, drawNewTexture: true });
            };
            ButtonImage.prototype.getActualTextureKey = function () {
                switch (this._curState) {
                    case Client.ButtonBase.STATE_UP:
                        return this._upStr;
                    case Client.ButtonBase.STATE_OVER:
                        return this._overStr;
                    case Client.ButtonBase.STATE_DOWN:
                        return this._downStr;
                    case Client.ButtonBase.STATE_DISABLED:
                        return this._disabledStr || this._upStr;
                }
            };
            ButtonImage.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._sprite.destroy();
            };
            return ButtonImage;
        }(Client.ButtonBase));
        Client.ButtonImage = ButtonImage;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonText = (function (_super) {
            __extends(ButtonText, _super);
            function ButtonText(text, width, height, textScale) {
                if (textScale === void 0) { textScale = 1; }
                var _this = this;
                var bgTexture = PIXI.loader.resources.atlas.textures['btn_bg.png'];
                _this = _super.call(this, width, height) || this;
                _this._textScale = textScale;
                _this._shadowOffset = 1;
                _this._origSize = bgTexture.orig;
                _this._shadow = new PIXI.mesh.NineSlicePlane(bgTexture, 120, 110, 120, 110);
                _this._shadow.tint = 0;
                _this._shadow.filters = [new PIXI.filters.BlurFilter(3)];
                _this.addChild(_this._shadow);
                _this._bg = new PIXI.mesh.NineSlicePlane(bgTexture, 120, 110, 120, 110);
                _this.addChild(_this._bg);
                var options = Client.FontsHelper.Text.fontForButton;
                _this._label = new PIXI.Text(text, Client.FontsHelper.Text.fontForButton);
                _this.addChild(_this._label);
                _this.onResize();
                _this.onChangeState();
                return _this;
            }
            ButtonText.prototype.onResize = function () {
                var hScale = this._h / this._origSize.height;
                this._shadowOffset = this._h / 24;
                this._shadow.width = this._w / hScale;
                this._shadow.scale.set(hScale, hScale);
                this._shadow.x = this._shadowOffset;
                this._shadow.y = this._shadowOffset;
                this._bg.width = this._w / hScale;
                this._bg.scale.set(hScale, hScale);
                this._label.style.fontSize = this._h / 2.5 * this._textScale;
                this._label.x = this._w / 2 - this._label.width / 2;
                this._label.y = this._h / 2 - this._label.height / 2;
            };
            ButtonText.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setWidth.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonText.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setHeight.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonText.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this._shadow.visible = this._curState != Client.ButtonBase.STATE_DOWN;
                var offset = this._curState == Client.ButtonBase.STATE_DOWN ? this._shadowOffset : 0;
                this._bg.x = offset;
                this._bg.y = offset;
                this._label.x = this._w / 2 - this._label.width / 2 + offset;
                this._label.y = this._h / 2 - this._label.height / 2 + offset;
            };
            ButtonText.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._label.destroy();
                this._shadow.destroy();
            };
            return ButtonText;
        }(Client.ButtonBase));
        Client.ButtonText = ButtonText;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var AppMain = (function () {
            function AppMain() {
                var _this = this;
                this.MAX_RES = {
                    w: 1920,
                    h: 1080
                };
                this._latestRWSatus = false;
                AppMain.instance = this;
                var cmdUser = new Client.CommandUser();
                Object.defineProperty(window, 'setBalance', {
                    value: cmdUser.setBalance.bind(cmdUser)
                });
                var canv = document.getElementById('canv');
                this._renderer = PIXI.autoDetectRenderer(1920, 1080, {
                    backgroundColor: 0x1099bb,
                    view: canv,
                    antialias: true,
                    roundPixels: true,
                    resolution: 1
                });
                this._renderer.clearBeforeRender = false;
                Client.Config.renderer = this._renderer;
                this._stage = new PIXI.Container();
                Client.Config.stage = this._stage;
                this._container = new PIXI.Graphics();
                this._stage.addChild(this._container);
                this._containerReal = new PIXI.Graphics();
                this._stage.addChild(this._containerReal);
                this._containerSafe = new PIXI.Graphics();
                this._stage.addChild(this._containerSafe);
                Client.ScenesManager.init(this._container, this._containerReal, this._containerSafe);
                window.addEventListener("resize", function () {
                    setTimeout(_this.onResize.bind(_this), 100);
                }, false);
                window.onbeforeunload = this.onUnloadPage.bind(this);
                Client.Logger.init();
                this.init();
            }
            AppMain.prototype.init = function () {
                if (PIXI.loader.resources['locale_lang'])
                    Client.Model.locale.parse(PIXI.loader.resources['locale_lang'].data, PIXI.loader.resources['locale_en'] ? PIXI.loader.resources['locale_en'].data : null);
                Client.Model.view.devicePixelRatio = this._renderer.resolution;
                this._tfFPS = new Client.FPSCounter();
                this._tfFPS.x = 10;
                this._tfFPS.y = 10;
                this._stage.addChild(this._tfFPS);
                this._btnSendLogs = new Client.Lobby.SelectTableButton('SEND LOGS');
                this._btnSendLogs.on(Client.ButtonBase.EVENT_CLICK, this.onSendLogs, this);
                this._stage.addChild(this._btnSendLogs);
                this.onResize(true);
                Client.SoundsHelper.init();
                Client.EffectManager.init();
                this.onPlatformReady();
                this.loop();
                this.connectToServer();
            };
            AppMain.prototype.connectToServer = function () {
                if (Client.Config.isLocalHost)
                    Client.AuthController.connectToServer(Client.Config.CONF_TEST);
                else if (Client.Config.isDev)
                    Client.AuthController.connectToServer(Client.Config.CONF_DEV);
                else if (Client.Config.isStaging)
                    Client.AuthController.connectToServer(Client.Config.CONF_STAGING);
                else if (Client.Config.isProd)
                    Client.AuthController.connectToServer(Client.Config.CONF_PROD);
            };
            AppMain.prototype.onPlatformReady = function () {
                var _this = this;
                Client.Model.initMe(Client.Platform.service);
                Client.ScenesManager.createScene('game', Client.GameSceneController);
                Client.ScenesManager.createScene('lobby', Client.Lobby.LobbySceneController);
                Client.ScenesManager.goToScene('lobby');
                Client.ModelEvents.on(Client.ModelEvent.MODEL_ME, function (e) {
                    if (Client.Model.me.availableRewardedVideo != _this._latestRWSatus && Client.Model.me.availableRewardedVideo) {
                        Client.RewardedVideoController.run(Client.Model.me.availableRewardedVideo);
                    }
                    _this._latestRWSatus = Client.Model.me.availableRewardedVideo;
                });
                Client.Statistic.Log(Client.StatCounters.session_start, null, { kingdom: "player_wallet" });
            };
            AppMain.prototype.loop = function () {
                this._tfFPS.onRender();
                Client.ScenesManager.loop();
                this._renderer.render(this._stage);
                requestAnimationFrame(this.loop.bind(this));
            };
            AppMain.prototype.onResize = function (force) {
                if (force === void 0) { force = false; }
                var w = window.innerWidth * window.devicePixelRatio;
                var h = window.innerHeight * window.devicePixelRatio;
                Client.trace('window size: ' + window.innerWidth.toString() + ', ' + window.innerHeight.toString());
                Client.trace('window fullsize: ' + w.toString() + ', ' + h.toString());
                this._renderer.resize(w, h);
                this._renderer.view.width = w;
                this._renderer.view.height = h;
                this._renderer.view.style.width = window.innerWidth + "px";
                this._renderer.view.style.height = window.innerHeight + "px";
                this._renderer.screen.width = window.innerWidth;
                this._renderer.screen.height = window.innerHeight;
                var view = Client.Model.view;
                view.setScreenSize(w, h);
                this._container.x = view.gameFullX;
                this._container.y = view.gameFullY;
                this._container.clear();
                this._container.lineStyle(10, 0xff0000);
                this._containerReal.x = view.gameRealX;
                this._containerReal.y = view.gameRealY;
                this._containerReal.clear();
                this._containerReal.lineStyle(5, 0x00ff00);
                this._containerSafe.x = view.gameSafeX;
                this._containerSafe.y = view.gameSafeY;
                this._containerSafe.clear();
                this._containerSafe.lineStyle(1, 0xffff00);
                Client.ScenesManager.onResize();
                this._btnSendLogs.setWidth(view.screenWidth * 0.1, true);
                this._btnSendLogs.x = this._containerReal.x + this._btnSendLogs.getWidth() * 1.4;
                this._btnSendLogs.y = this._containerReal.y + view.gameRealHeight - this._btnSendLogs.getHeight() * 2;
            };
            AppMain.prototype.calculateTargetResolution = function () {
                if (Client.Config.isBitball || Client.Config.isLocalHost)
                    return this.MAX_RES;
                var res = { w: window.innerWidth * window.devicePixelRatio, h: window.innerHeight * window.devicePixelRatio };
                return res;
            };
            AppMain.prototype.onUnloadPage = function () {
                new Client.CommandAuth().logout();
            };
            AppMain.prototype.onSendLogs = function () {
                Client.Logger.sendLogs();
            };
            AppMain.USE_SCALING = false;
            AppMain.STATE_PRELOADER = 'preloader';
            return AppMain;
        }());
        Client.AppMain = AppMain;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Bootstrap = (function () {
            function Bootstrap(locale) {
                var _this = this;
                this._pageLoaded = false;
                this._resLoaded = false;
                this._fontsLoaded = false;
                Client.Config.locale = locale;
                var service = Client.Platform.createService(Client.Config.isLocalHost || Client.Config.isBitball);
                service.once(Client.PlatformBase.INIT, function () { return _this.init(); });
                service.once(Client.PlatformBase.READY, function () { return _this.startApp(); });
                service.init();
            }
            Bootstrap.prototype.init = function () {
                var i;
                var loader = PIXI.loader;
                for (i = 0; i < Client.Resources.cardsNumbers.length; i++)
                    loader.add('card_' + Client.Resources.cardsNumbers[i], 'assets/sprites/cards/numbers/' + Client.Resources.cardsNumbers[i] + '.svg');
                for (i = 0; i < Client.Resources.cardsSuits.length; i++)
                    loader.add('card_' + Client.Resources.cardsSuits[i], 'assets/sprites/cards/suits/suit_' + Client.Resources.cardsSuits[i] + '.svg');
                for (i = 0; i < Client.Resources.cardsFaces.length; i++)
                    loader.add('card_image_' + Client.Resources.cardsFaces[i], 'assets/sprites/cards/faces/' + Client.Resources.cardsFaces[i] + '.svg');
                loader.add('card_face', 'assets/sprites/cards/face.svg');
                loader.add('card_back', 'assets/sprites/cards/back.svg');
                loader.add('bet_b_green', 'assets/sprites/bets/bet_b_green.svg');
                loader.add('bet_b_orange', 'assets/sprites/bets/bet_b_orange.svg');
                loader.add('bet_call', 'assets/sprites/bets/bet_call.svg');
                loader.add('bet_check', 'assets/sprites/bets/bet_check.svg');
                loader.add('bet_chip', 'assets/sprites/bets/bet_chip.svg');
                loader.add('bet_fold', 'assets/sprites/bets/bet_fold.svg');
                loader.add('bet_raise', 'assets/sprites/bets/bet_raise.svg');
                loader.add('bg_game', 'assets/sprites/bg_game.jpg');
                loader.add('light', 'assets/sprites/light.png');
                loader.add('bg_tile', 'assets/sprites/bg_tile.svg');
                loader.add('btn_bet_bg', 'assets/sprites/btn_bet_bg.svg');
                loader.add('chip', 'assets/sprites/chip.svg');
                loader.add('btn_back_up', 'assets/sprites/btn_back_up.svg');
                loader.add('btn_back_down', 'assets/sprites/btn_back_down.svg');
                loader.add('btn_watch_up', 'assets/sprites/btn_watch_up.svg');
                loader.add('btn_watch_down', 'assets/sprites/btn_watch_down.svg');
                loader.add('icon_arrowup', 'assets/sprites/icon_arrowup.svg');
                loader.add('icon_cross', 'assets/sprites/icon_cross.svg');
                loader.add('icon_check', 'assets/sprites/icon_check.svg');
                loader.add('icon_dealer', 'assets/sprites/icon_dealer.svg');
                loader.add('btn_plus_up', 'assets/sprites/btn_plus_up.svg');
                loader.add('btn_plus_down', 'assets/sprites/btn_plus_down.svg');
                loader.add('btn_minus_up', 'assets/sprites/btn_minus_up.svg');
                loader.add('btn_minus_down', 'assets/sprites/btn_minus_down.svg');
                loader.add('raise_view_bg', 'assets/sprites/raise_view_bg.svg');
                loader.add('dealer', 'assets/sprites/dealer.svg');
                loader.add('gradient_line', 'assets/sprites/gradient_line.svg');
                loader.add('avatar/1', 'assets/sprites/avatars/avatar0.jpg');
                loader.add('avatar/2', 'assets/sprites/avatars/avatar1.jpg');
                loader.add('avatar/3', 'assets/sprites/avatars/avatar2.jpg');
                loader.add('lobby/bg', 'assets/sprites/lobby/GradientBG.svg');
                loader.add('lobby/bg_pattern', 'assets/sprites/lobby/PatternBG.svg');
                loader.add('lobby/star', 'assets/sprites/lobby/Star.svg');
                loader.add('lobby/table_unit_bg', 'assets/sprites/lobby/TableUnitBg.svg');
                loader.add('lobby/table_unit_bg_pattern', 'assets/sprites/lobby/PatternTableUnit.svg');
                loader.add('lobby/table_unit_picture/1', 'assets/sprites/lobby/Arts.png');
                loader.add('lobby/table_unit_picture/2', 'assets/sprites/lobby/Arts1.png');
                loader.add('lobby/table_unit_picture/3', 'assets/sprites/lobby/Arts2.png');
                loader.add('lobby/table_unit_picture/4', 'assets/sprites/lobby/Arts3.png');
                loader.add('lobby/knobe', 'assets/sprites/lobby/knobe.svg');
                loader.add('particle/star', 'assets/emiters/star.png');
                loader.add('particle/star/emiter', 'assets/emiters/winParticlesEmiter.json');
                loader.add('lobby/close_icon', 'assets/sprites/lobby/IconCross3.svg');
                loader.add('lobby/settings_icon', 'assets/sprites/lobby/Options.svg');
                loader.add('lobby/add_user_icon', 'assets/sprites/lobby/AddUser.svg');
                loader.add('lobby/chip', 'assets/sprites/lobby/IconChip_1.svg');
                loader.add('lobby/free_chips_bg', 'assets/sprites/lobby/video_BG.svg');
                loader.add('lobby/free_chips_mask', 'assets/sprites/lobby/video_BG_mask.svg');
                loader.add('lobby/free_chips_button', 'assets/sprites/lobby/VideoFree_button.svg');
                loader.add('lobby/free_chips_picture/1', 'assets/sprites/lobby/Arts4.png');
                loader.add('lobby/hourly_drip', 'assets/sprites/lobby/DailyBonus.svg');
                loader.add('lobby/reward_video/bg', 'assets/sprites/lobby/reward-video/MainBG.svg');
                loader.add('lobby/reward_video/close_button', 'assets/sprites/lobby/reward-video/ClosePopUp.svg');
                loader.add('lobby/reward_video/close_button_down', 'assets/sprites/lobby/reward-video/ClosePopUp_down.svg');
                loader.add('lobby/reward_video/bg_inner', 'assets/sprites/lobby/reward-video/PurpleBG.svg');
                loader.add('lobby/reward_video/star/1', 'assets/sprites/lobby/reward-video/Star1.svg');
                loader.add('lobby/reward_video/star/2', 'assets/sprites/lobby/reward-video/Star2.svg');
                loader.add('lobby/reward_video/star/3', 'assets/sprites/lobby/reward-video/Star3.svg');
                loader.add('lobby/reward_video/star/4', 'assets/sprites/lobby/reward-video/Star4.svg');
                loader.add('lobby/reward_video/star/5', 'assets/sprites/lobby/reward-video/Star6.svg');
                loader.add('lobby/reward_video/chip/1', 'assets/sprites/lobby/reward-video/Chip1.svg');
                loader.add('lobby/reward_video/chip/2', 'assets/sprites/lobby/reward-video/Chip2.svg');
                loader.add('lobby/reward_video/chip/3', 'assets/sprites/lobby/reward-video/Chip3.svg');
                loader.add('lobby/reward_video/video_icon', 'assets/sprites/lobby/reward-video/PlayVideo.svg');
                loader.add('lobby/reward_video/line', 'assets/sprites/lobby/reward-video/Line.svg');
                loader.add('lobby/reward_video/button', 'assets/sprites/lobby/reward-video/Button.svg');
                loader.add('lobby/reward_video/beams', 'assets/sprites/lobby/reward-video/Beams.svg');
                loader.add('lobby/reward_video/picture', 'assets/sprites/lobby/reward-video/Out of chips3-2.png');
                loader.add('stand_up_popup/bg', 'assets/sprites/stand_up/PopUpBG.svg');
                loader.add('stand_up_popup/exit', 'assets/sprites/stand_up/ExitToLobby.svg');
                loader.add('stand_up_popup/stand_up', 'assets/sprites/stand_up/StandUp.svg');
                loader.add('stand_up_popup/new_table', 'assets/sprites/stand_up/NewTable.svg');
                loader.add('stand_up_popup/select_new_table', 'assets/sprites/stand_up/SelectNewTable.svg');
                loader.add('button_seat', 'assets/sprites/SitDown.svg');
                loader.add('button_seat_anim', 'assets/sprites/SitAnimation.svg');
                loader.add('winning/line_pattern', 'assets/sprites/win_line_pattern.svg');
                loader.add('winning/line_mask', 'assets/sprites/win_line_mask.png');
                for (i = 0; i < Client.SoundsHelper.PRELOAD_SOUNDS.length; i++)
                    loader.add(Client.SoundsHelper.PRELOAD_SOUNDS[i], 'assets/sounds/' + Client.SoundsHelper.PRELOAD_SOUNDS[i] + '.mp3');
                loader.add('locale_ALL', 'assets/locale/locale.json');
                loader.once('complete', function () {
                    Client.Platform.service.start();
                });
                loader.on("progress", function (loader, res) {
                    Client.Platform.service.progress = loader.progress;
                });
                loader.load();
                Client.FontsHelper.Text.loadFonts(7000, this.onFontsLoad.bind(this), this.onFontsError.bind(this));
                this._pageLoaded = true;
            };
            Bootstrap.prototype.onPageLoad = function () {
                this._pageLoaded = true;
            };
            Bootstrap.prototype.onResLoaded = function (instant) {
                this._resLoaded = true;
            };
            Bootstrap.prototype.onFontsError = function () {
                Client.trace('onFontsError, try again');
                Client.FontsHelper.Text.loadFonts(7000, this.onFontsLoad.bind(this), this.onFontsError.bind(this));
            };
            Bootstrap.prototype.onFontsLoad = function () {
                this._fontsLoaded = true;
            };
            Bootstrap.prototype.startApp = function () {
                new Client.AppMain();
            };
            return Bootstrap;
        }());
        Client.Bootstrap = Bootstrap;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var APP_LOCATION;
        (function (APP_LOCATION) {
            APP_LOCATION[APP_LOCATION["DEV"] = 0] = "DEV";
            APP_LOCATION[APP_LOCATION["STAGING"] = 1] = "STAGING";
            APP_LOCATION[APP_LOCATION["PROD"] = 2] = "PROD";
            APP_LOCATION[APP_LOCATION["BITBALL"] = 3] = "BITBALL";
            APP_LOCATION[APP_LOCATION["LOCAL"] = 4] = "LOCAL";
        })(APP_LOCATION = Client.APP_LOCATION || (Client.APP_LOCATION = {}));
        ;
        var Config = (function () {
            function Config() {
            }
            Config.setServerConf = function (confName) {
                if (confName == Config.CONF_TEST)
                    Config.currentConf = Config._confTest;
                else if (confName == Config.CONF_AWS1)
                    Config.currentConf = Config._confAws1;
                else if (confName == Config.CONF_AWS2)
                    Config.currentConf = Config._confAws2;
                else if (confName == Config.CONF_DEV)
                    Config.currentConf = Config._confDev;
                else if (confName == Config.CONF_STAGING)
                    Config.currentConf = Config._confStaging;
                else if (confName == Config.CONF_PROD)
                    Config.currentConf = Config._confProd;
            };
            Object.defineProperty(Config, "isLocalHost", {
                get: function () {
                    return window.location.hostname == 'localhost';
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "isBitball", {
                get: function () {
                    return window.location.hostname == 'bitball.io' || window.location.hostname == 'sergeydevjatov.github.io';
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "isDev", {
                get: function () {
                    return window.location.hostname.indexOf(Client.ZyngaGames.APP_ID_DEV) != -1;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "isStaging", {
                get: function () {
                    return window.location.hostname.indexOf(Client.ZyngaGames.APP_ID_STAGING) != -1;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "isProd", {
                get: function () {
                    return window.location.hostname.indexOf(Client.ZyngaGames.APP_ID_PROD) != -1;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "appLocation", {
                get: function () {
                    if (this.isDev)
                        return APP_LOCATION.DEV;
                    if (this.isStaging)
                        return APP_LOCATION.STAGING;
                    if (this.isProd)
                        return APP_LOCATION.PROD;
                    if (this.isBitball)
                        return APP_LOCATION.BITBALL;
                    if (this.isLocalHost)
                        return APP_LOCATION.LOCAL;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "host", {
                get: function () {
                    return Config.currentConf.host;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "port", {
                get: function () {
                    return Config.currentConf.port;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "useSSL", {
                get: function () {
                    return Config.currentConf.ssl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "httpKey", {
                get: function () {
                    return Config.currentConf.httpKey;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "serverKey", {
                get: function () {
                    return Config.currentConf.serverKey;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Config, "useDebug", {
                get: function () {
                    return Config.currentConf.debug;
                },
                enumerable: true,
                configurable: true
            });
            Config.CONF_TEST = 'test';
            Config.CONF_AWS1 = 'aws1';
            Config.CONF_AWS2 = 'aws2';
            Config.CONF_DEV = 'dev';
            Config.CONF_QA = 'qa';
            Config.CONF_PROD = 'prod';
            Config.CONF_STAGING = 'staging';
            Config.REWARDED_VIDEO_DELAY_DURATION = 20;
            Config.locale = 'en';
            Config._confTest = { host: '37.143.15.166', port: 7349, httpKey: 'defaultkey', serverKey: 'defaultkey', ssl: false, debug: false };
            Config._confAws1 = { host: 'ec2-54-187-235-102.us-west-2.compute.amazonaws.com', port: 7349, httpKey: 'defaultkey', serverKey: 'defaultkey', ssl: false, debug: false };
            Config._confAws2 = { host: 'ec2-18-236-100-240.us-west-2.compute.amazonaws.com', port: 7349, httpKey: 'defaultkey', serverKey: 'defaultkey', ssl: false, debug: false };
            Config._confDev = { host: 'poker-dev1-us-west1.zyheroes.com', port: 443, httpKey: 'usEdJ8XufjQYDUAoTJW', serverKey: 'EkpUsEHPV4XYuZPjZmh', ssl: true, debug: false };
            Config._confStaging = { host: 'poker-qa1-us-west1.zyheroes.com', port: 443, httpKey: 'BPGZdNz%tTpuWoWN8CYo', serverKey: 'VjsBXw7k[XRdEAVxCyGw', ssl: true, debug: false };
            Config._confProd = { host: 'poker-prod1-us-west1.zyheroes.com', port: 443, httpKey: 'F%rssMze2emMNEpoPvqw', serverKey: 'Rw/dqw9fUCWPRhULpiqP', ssl: true, debug: false };
            Config.currentConf = Config._confTest;
            return Config;
        }());
        Client.Config = Config;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        Client.trace = console.log;
        var Logger = (function () {
            function Logger() {
            }
            Logger.init = function () {
                console._log = console.log;
                console._info = console.info;
                console._warn = console.warn;
                console._error = console.error;
                console._debug = console.debug;
                Logger._history = [];
                Client.trace = console.log = function () { return console._intercept('log', arguments); };
                console.info = function () { return console._intercept('info', arguments); };
                console.warn = function () { return console._intercept('warn', arguments); };
                console.error = function () { return console._intercept('error', arguments); };
                console.debug = function () { return console._intercept('debug', arguments); };
                console._intercept = function (type, args) {
                    console._collect(type, args);
                };
                console._collect = function (type, args) {
                    if (!args || args.length == 0)
                        return;
                    var time = new Date().toUTCString();
                    if (!type)
                        type = 'log';
                    console['_' + type].apply(console, args);
                    Logger._history.push({ type: type, timestamp: time, message: args[0] });
                };
                window.onerror = Logger.onError;
                window.addEventListener('unhandledrejection', Logger.browserRejectionHandler);
                Logger._inited = true;
            };
            Logger.browserRejectionHandler = function (event) {
                var error = event ? event.reason : undefined;
                if (error != undefined)
                    Logger.__send(false, error.message, error.stack);
            };
            Logger.clearHistory = function () {
                Logger._history = [];
            };
            Logger.sendLogs = function () {
                Logger.__send(true);
            };
            Logger.getHistory = function () {
                var logHistory = '';
                if (!Logger._history)
                    return logHistory;
                var arr = Logger._history;
                for (var i = 0; i < arr.length; i++) {
                    logHistory += '[' + arr[i].type + '] [' + arr[i].timestamp + ']: ' + arr[i].message + '\r\n';
                }
                return logHistory;
            };
            Logger.onError = function (msg, url, lineNo, columnNo, error) {
                Logger.__send(false, msg.toString(), '[' + lineNo + '][' + columnNo + ']' + error.message + ', ' + error.stack);
            };
            Logger.__send = function (onDemand, errType, stackTrace) {
                if (onDemand === void 0) { onDemand = true; }
                if (errType === void 0) { errType = ''; }
                if (stackTrace === void 0) { stackTrace = ''; }
                Client.trace('send logs || Logger._history.length = ' + Logger._history.length);
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://bitball.io/poker/addlog.php', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                var body = 'username=' + encodeURIComponent(Client.Model.me.name) +
                    '&user_id=' + Client.Model.me.id + '&browser=' + encodeURIComponent(window.navigator.userAgent) + '&platform=poker' + '&log=' + encodeURIComponent(Logger.getHistory()) +
                    '&on_demand=' + (onDemand ? '1' : '0') + '&stack_trace=' + encodeURIComponent(stackTrace) + '&type=' + encodeURIComponent(errType);
                xhr.send(body);
            };
            Logger._inited = false;
            Logger._history = [];
            return Logger;
        }());
        Client.Logger = Logger;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Resources = (function () {
            function Resources() {
            }
            Resources.clearCache = function () {
                for (var key in Resources._cache) {
                    var arr = Resources._cache[key];
                    for (var i = 0; i < arr.length; i++)
                        arr[i].texture.destroy(true);
                }
                Resources._cache = {};
            };
            Resources.addToCache = function (key, texture, width, height) {
                if (!Resources._cache[key])
                    Resources._cache[key] = [];
                Resources._cache[key].push({ width: width >> 0, height: height >> 0, texture: texture });
            };
            Resources.getFromCache = function (key, width, height) {
                if (!Resources._cache[key])
                    Resources._cache[key] = [];
                var arr = Resources._cache[key];
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].width >> 0 == width >> 0 && arr[i].height >> 0 == height >> 0)
                        return arr[i].texture;
                }
                return null;
            };
            Resources.getTexture = function (key, scaleParams, cacheName) {
                if (scaleParams === void 0) { scaleParams = null; }
                if (cacheName === void 0) { cacheName = null; }
                var texture = PIXI.utils.TextureCache[key];
                if (!texture || !scaleParams)
                    return texture;
                var origSize = Resources.getOrigSize(texture.baseTexture);
                var scale = 1;
                if (scaleParams.scale)
                    scale = scaleParams.scale;
                else if (scaleParams.width)
                    scale = scaleParams.width / origSize.width;
                else if (scaleParams.height)
                    scale = scaleParams.height / origSize.height;
                if (cacheName) {
                    var fullKey = key + '_' + cacheName;
                    if (!Resources._cache[fullKey])
                        Resources._cache[fullKey] = [];
                    var arr = Resources._cache[fullKey];
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].width >> 0 == (origSize.width * scale) >> 0 && arr[i].height >> 0 == (origSize.height * scale) >> 0)
                            return arr[i].texture;
                    }
                    texture = Resources.scaleTexture(texture, scaleParams, cacheName);
                    Resources._cache[fullKey].push({ width: (origSize.width * scale) >> 0, height: (origSize.height * scale) >> 0, texture: texture });
                    return texture;
                }
                return Resources.scaleTexture(texture, scaleParams);
            };
            Resources.scaleTexture = function (texture, scaleParams, type) {
                if (type === void 0) { type = null; }
                var isSvg = texture.baseTexture.imageUrl && texture.baseTexture.imageUrl.indexOf('.svg') != -1;
                if (!isSvg)
                    return texture;
                var origSize = Resources.getOrigSize(texture.baseTexture);
                var scale = 1;
                if (scaleParams.scale)
                    scale = scaleParams.scale;
                else if (scaleParams.width)
                    scale = scaleParams.width / origSize.width;
                else if (scaleParams.height)
                    scale = scaleParams.height / origSize.height;
                if (scale == 1 && !type)
                    return texture;
                var rect = new PIXI.Rectangle(0, 0, origSize.width * scale, origSize.height * scale);
                if (scaleParams.drawNewTexture || type)
                    texture = Resources.generateNewTexture(texture.baseTexture, scale);
                else
                    Resources.scaleBaseTexture(texture.baseTexture, scale);
                return scaleParams.returnNewTexture || type ? new PIXI.Texture(texture.baseTexture) : texture;
            };
            Resources.getOrigSize = function (baseTexture) {
                var origWidth = baseTexture.width;
                var origHeight = baseTexture.height;
                if (Resources._origSizes[baseTexture.imageUrl]) {
                    origWidth = Resources._origSizes[baseTexture.imageUrl].width;
                    origHeight = Resources._origSizes[baseTexture.imageUrl].height;
                }
                else
                    Resources._origSizes[baseTexture.imageUrl] = { width: baseTexture.width, height: baseTexture.height };
                return new PIXI.Rectangle(0, 0, origWidth, origHeight);
            };
            Resources.scaleBaseTexture = function (baseTexture, scale) {
                if (!Resources._origSizes[baseTexture.imageUrl])
                    Resources._origSizes[baseTexture.imageUrl] = { width: baseTexture.width, height: baseTexture.height };
                var origRect = Resources.getOrigSize(baseTexture);
                baseTexture.sourceScale = scale;
                baseTexture.realWidth = Math.round(origRect.width * baseTexture.sourceScale);
                baseTexture.realHeight = Math.round(origRect.height * baseTexture.sourceScale);
                baseTexture._updateDimensions();
                baseTexture.source.width = baseTexture.realWidth;
                baseTexture.source.height = baseTexture.realHeight;
            };
            Resources.generateNewTexture = function (baseTexture, scale) {
                var origRect = Resources.getOrigSize(baseTexture);
                var rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var img = baseTexture.source;
                canvas.width = rect.width;
                canvas.height = rect.height;
                ctx.clearRect(0, 0, rect.width, rect.height);
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, rect.width, rect.height);
                return PIXI.Texture.fromCanvas(canvas);
            };
            Resources.cardsNumbers = ['2', '3', '4', '5', '6', '7', '8', '9', 't', 'j', 'q', 'k', 'a'];
            Resources.cardsSuits = ['d', 'c', 'h', 's'];
            Resources.cardsFaces = ['jd', 'jc', 'jh', 'js', 'qd', 'qc', 'qh', 'qs', 'kd', 'kc', 'kh', 'ks'];
            Resources.TABLE_CARD = 'TABLE_CARD';
            Resources.USER_CARD = 'USER_CARD';
            Resources._origSizes = {};
            Resources._cache = {};
            return Resources;
        }());
        Client.Resources = Resources;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poket;
(function (poket) {
    var Client;
    (function (Client) {
        var AnimationController = (function () {
            function AnimationController() {
            }
            return AnimationController;
        }());
        Client.AnimationController = AnimationController;
    })(Client = poket.Client || (poket.Client = {}));
})(poket || (poket = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var AuthController = (function () {
            function AuthController() {
            }
            AuthController.connectToServer = function (serverConfig) {
                Client.Config.setServerConf(serverConfig);
                Client.Server.instance.init();
                new Client.CommandAuth().login(Client.Model.me);
            };
            return AuthController;
        }());
        Client.AuthController = AuthController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonWatchAnimationController = (function () {
            function ButtonWatchAnimationController() {
            }
            ButtonWatchAnimationController.prototype.setViews = function (buttonWatch, hourlyDrip) {
                this._buttonWatch = buttonWatch;
                this._hourlyDrip = hourlyDrip;
            };
            ButtonWatchAnimationController.prototype.show = function (nextHourlyDripX, nextHourlyDripY) {
                if (this.notAllViewsExist()) {
                    return;
                }
                this._nextHourlyDripX = nextHourlyDripX;
                this._nextHourlyDripY = nextHourlyDripY;
                this.moveHourlyDrip(this.showButtonWatchAfterHourlyDripMoved, this);
            };
            ButtonWatchAnimationController.prototype.hide = function (nextHourlyDripX, nextHourlyDripY) {
                if (this.notAllViewsExist()) {
                    return;
                }
                this._nextHourlyDripX = nextHourlyDripX;
                this._nextHourlyDripY = nextHourlyDripY;
                this._buttonWatch.disabled = true;
                this.changeButtonWatchAlpha(0, this.moveHourlyDripAfterButtonWatchHidden, this);
            };
            ButtonWatchAnimationController.prototype.notAllViewsExist = function () {
                return !(this._buttonWatch && this._hourlyDrip);
            };
            ButtonWatchAnimationController.prototype.showButtonWatchAfterHourlyDripMoved = function () {
                this._buttonWatch.disabled = false;
                this._buttonWatch.visible = true;
                this.changeButtonWatchAlpha(1);
            };
            ButtonWatchAnimationController.prototype.moveHourlyDripAfterButtonWatchHidden = function () {
                this._buttonWatch.visible = false;
                this.moveHourlyDrip();
            };
            ButtonWatchAnimationController.prototype.moveHourlyDrip = function (onComplete, onCompleteScope) {
                Client.Tweener.to(this._hourlyDrip, 0.5, {
                    x: this._nextHourlyDripX,
                    y: this._nextHourlyDripY,
                    onComplete: onComplete,
                    onCompleteScope: onCompleteScope,
                });
            };
            ButtonWatchAnimationController.prototype.changeButtonWatchAlpha = function (alpha, onComplete, onCompleteScope) {
                Client.Tweener.to(this._buttonWatch, 0.5, {
                    alpha: alpha,
                    onComplete: onComplete,
                    onCompleteScope: onCompleteScope,
                });
            };
            return ButtonWatchAnimationController;
        }());
        Client.ButtonWatchAnimationController = ButtonWatchAnimationController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var GameSceneController = (function (_super) {
            __extends(GameSceneController, _super);
            function GameSceneController() {
                var _this = _super.call(this) || this;
                _this.BOARD_WIDTH_KOEF = 0.95;
                _this.DEALER_WIDTH_KOEF = 0.25;
                _this.CARDS_CONT_WIDTH_KOEF = 0.38;
                _this.CARDS_CONT_TOP_OFFSET_KOEF = 0.43;
                _this.BUTTON_BACK_WIDTH_KOEF = 0.08;
                _this.BUTTON_BACK_OFFSET_KOEF = 0.03;
                _this.BUY_INTO_GAME_POPUP_WIDTH_KOEF = 0.6;
                _this.BUY_INTO_GAME_POPUP_HEIGHT_KOEF = 0.5;
                _this.NOT_ENOUGH_POPUP_WIDTH_KOEF = 0.62;
                _this.NOT_ENOUGH_POPUP_HEIGHT_KOEF = 0.91;
                _this.BUTTONS_BETS_WIDTH_KOEF = 0.34;
                _this.BUTTONS_BETS_BOTTOM_RIGHT_OFFSET_KOEF = 0.025;
                _this.RAISE_VIEW_HEIGHT_KOEF = 0.6;
                _this.RAISE_VIEW_BOTTOM_OFFSET_KOEF = 0.25;
                _this.RAISE_VIEW_RIGHT_OFFSET_KOEF = 0.03;
                _this.LEVEL_PANEL_TOP_OFFSET_KOEF = _this.BUTTON_BACK_OFFSET_KOEF;
                _this.LEVEL_PANEL_LEFT_OFFSET_KOEF = _this.BUTTON_BACK_OFFSET_KOEF +
                    _this.BUTTON_BACK_WIDTH_KOEF + 0.08;
                _this.LEVEL_PANEL_HEIGHT_KOEF = 0.03;
                _this.HOURLY_DRIP_OFFSET_TOP_KOEF = 0.03;
                _this.HOURLY_DRIP_OFFSET_RIGHT_KOEF = 0.013;
                _this.HOURLY_DRIP_HEIGHT_KOEF = 0.138;
                _this.BUTTON_WATCH_WIDTH_KOEF = 0.08;
                _this.BUTTON_WATCH_OFFSET_KOEF = 0.03;
                _this.HOURLY_DRIP_TIP_FONT_SIZE_KOEF = 0.051;
                _this.BET_POPUP_WIDTH_KOEF = 0.3;
                _this._bg = new Client.Bg();
                _this._dealer = new Client.Dealer();
                _this._cardsContainer = new Client.BoardCardsContainer();
                _this._table = new Client.Table();
                _this._raiseView = new Client.RaiseView();
                _this._levelPanel = new Client.LevelPanel();
                _this.updateLevel();
                _this._buttonsBetsContainer = new Client.ButtonsBetsContainer();
                _this._buttonBack = new Client.ButtonImage('btn_back_up', 'btn_back_up', 'btn_back_down', 'btn_back_up');
                _this._buttonBack.on(Client.ButtonImage.EVENT_CLICK, _this.toggleStandUpPopup, _this);
                _this._buttonWatch = new Client.ButtonImage('btn_watch_up', 'btn_watch_up', 'btn_watch_down');
                _this._buttonWatch.on(Client.ButtonImage.EVENT_CLICK, _this.onButtonWatchClick, _this);
                _this._tableController = new Client.TableController();
                _this._tableController.setViews(_this._table, _this._cardsContainer);
                _this._playController = new Client.PlayController();
                _this._playController.setViews(_this._buttonsBetsContainer, _this._raiseView);
                _this._standUpPopup = new Client.StandUpPopup();
                _this._standUpPopup.visible = false;
                _this._standUpPopup.on(Client.StandUpPopup.EVENT_CLOSE, _this.toggleStandUpPopup, _this);
                _this._standUpPopup.on(Client.StandUpPopup.EVENT_SELECT_OPTION, _this.onSelectStandUpOption, _this);
                _this._buyIntoGamePopup = new Client.BuyIntoGamePopup();
                _this._buyIntoGamePopup.visible = false;
                _this._buyIntoGamePopup.on(Client.BuyIntoGamePopup.EVENT_CLOSE, _this.onBuyIntoGameClose, _this);
                _this._buyIntoGamePopup.on(Client.BuyIntoGamePopup.EVENT_EXIT, _this.onBuyIntoGameClose, _this);
                _this._buyIntoGamePopup.on(Client.BuyIntoGamePopup.EVENT_OK, _this.onBuyIntoGameOk, _this);
                _this._notEnoughPopup = new Client.Lobby.NotEnoughPopup();
                _this._notEnoughPopup.visible = false;
                _this._notEnoughPopup.on(Client.Lobby.NotEnoughPopup.EVENT_CLOSE, _this.onNotEnoughPopupClose, _this);
                _this._notEnoughPopup.on(Client.Lobby.NotEnoughPopup.EVENT_OK, _this.onNotEnoughPopupOk, _this);
                _this._hourlyDrip = new Client.Lobby.HourlyDrip();
                _this._hourlyDripTip = new Client.Lobby.HourlyDripTip();
                _this._hourlyDripTip.anchor.set(0.5, 0);
                _this._buttonWatchAnimationController = new Client.ButtonWatchAnimationController();
                _this._buttonWatchAnimationController.setViews(_this._buttonWatch, _this._hourlyDrip);
                _this.setButtonWatchVisibility(Client.RewardedVideoController.instance.status == Client.RewardedVideoController.AVAILABLE);
                Client.ModelEvents.on(Client.ModelEvent.MODEL_ME, _this.onChangeMe, _this);
                Client.RewardedVideoController.instance.on(Client.RewardedVideoController.AVAILABLE, function (x) {
                    _this.setButtonWatchVisibility(Client.RewardedVideoController.instance.status == Client.RewardedVideoController.AVAILABLE);
                    _this._notEnoughPopup.disabled = !(Client.RewardedVideoController.instance.status == Client.RewardedVideoController.AVAILABLE);
                });
                return _this;
            }
            GameSceneController.prototype.onChangeMe = function (event) {
                if (event.type === Client.ModelEvent.UPDATE) {
                    this.updateLevel();
                    this._hourlyDrip.disabled = !Client.Model.me.availableHourlyDrip && (Client.Model.me.timeHourlyDrip != 0);
                    this._hourlyDrip.time = Client.Model.me.timeHourlyDrip;
                }
            };
            GameSceneController.prototype.getHourlyDrip = function () {
                new Client.CommandUser().getHourlyDrip();
            };
            GameSceneController.prototype.updateLevel = function () {
                this._levelPanel.level = Client.Model.me.level;
                this._levelPanel.progress = Client.Model.me.progressForNextLevel;
            };
            GameSceneController.prototype.toggleStandUpPopup = function () {
                this._standUpPopup.visible = !(this._buttonBack.visible = this._standUpPopup.visible);
            };
            GameSceneController.prototype.toggleNotEnoughPopup = function () {
                this._notEnoughPopup.disabled = !(Client.RewardedVideoController.instance.status == Client.RewardedVideoController.AVAILABLE);
                this._notEnoughPopup.visible = !this._notEnoughPopup.visible;
                if (this._notEnoughPopup.visible) {
                    Client.Statistic.Log(Client.StatCounters.player_table_bust, Client.Model.me.stack, { kingdom: Client.Model.table.level.toString() });
                }
            };
            GameSceneController.prototype.setButtonWatchVisibility = function (visible) {
                Client.trace('[SET BUTTON WATCH VISIBILITY]', visible);
                if (this._buttonWatch.visible !== visible) {
                    var hourlyDripPosition = this.getNextHourlyDripPosition(visible);
                    if (visible) {
                        this._buttonWatchAnimationController.show(hourlyDripPosition.x, hourlyDripPosition.y);
                    }
                    else {
                        this._buttonWatchAnimationController.hide(hourlyDripPosition.x, hourlyDripPosition.y);
                    }
                }
            };
            GameSceneController.prototype.onHourlyDrip = function (event) {
                this.attachHourlyDripTipToWatchButton();
                this._hourlyDripTip.show(Client.Model.me.earned);
                Client.Statistic.Log(Client.StatCounters.tap_hourly_drip, Client.Model.me.earned, { kingdom: "success" });
                Client.Statistic.Log(Client.StatCounters.currency_source, Client.Model.me.earned, {
                    kingdom: (Client.Model.me.balance >> 0).toString(),
                    class: "hourly_drip"
                });
            };
            GameSceneController.prototype.onSelectStandUpOption = function (option) {
                this.toggleStandUpPopup();
                switch (option) {
                    case Client.StandUpPopup.OPTION_EXIT:
                        new Client.CommandUser().leaveTable(Client.Model.table.id);
                        var table_wallet = Client.Model.me.stack;
                        Client.Statistic.Log(Client.StatCounters.player_table_leave, table_wallet, { kingdom: Client.Model.table.level.toString() });
                        break;
                    case Client.StandUpPopup.OPTION_STAND_UP:
                        new Client.CommandUser().standUp(Client.Model.table.id);
                        break;
                    case Client.StandUpPopup.OPTION_NEW_TABLE:
                        break;
                    case Client.StandUpPopup.OPTION_SELECT_NEW_TABLE:
                        break;
                }
            };
            GameSceneController.prototype.onBuyIntoGameClose = function () {
                new Client.CommandUser().leaveTable(Client.Model.table.id);
            };
            GameSceneController.prototype.onBuyIntoGameOk = function () {
            };
            GameSceneController.prototype.onNotEnoughPopupClose = function () {
                this.toggleNotEnoughPopup();
                this._tableController.tryToSeat();
            };
            GameSceneController.prototype.onNotEnoughPopupOk = function () {
                this.toggleNotEnoughPopup();
                this.attachHourlyDripTipToCenter();
                this.showRewarded();
            };
            GameSceneController.prototype.onButtonWatchClick = function () {
                this.attachHourlyDripTipToWatchButton();
                this.showRewarded();
            };
            GameSceneController.prototype.showRewarded = function () {
                var _this = this;
                Client.RewardedVideoController.instance.show(function (status) {
                    if (status.code == "SHOWED") {
                        _this.isWathedOk();
                    }
                    else {
                        Client.Statistic.Log(Client.StatCounters.tap_w2e, null, { kingdom: "failure" });
                    }
                });
            };
            GameSceneController.prototype.isWathedOk = function () {
                new Client.CommandUser().getRewardedVideo();
            };
            GameSceneController.prototype.onRewardedVideo = function () {
                this._hourlyDripTip.show(Client.Model.me.earned);
                Client.RewardedVideoController.instance.run(false, Client.Model.me.timeRewardedVideo);
                this.setButtonWatchVisibility(false);
                var canSeat = this._tableController.tryToSeat();
                if (!canSeat) {
                    this.toggleNotEnoughPopup();
                }
            };
            GameSceneController.prototype.onExitGame = function () {
                Client.ScenesManager.goToScene('lobby');
            };
            GameSceneController.prototype.onBetUpdate = function (bet) {
            };
            GameSceneController.prototype.pause = function () {
                _super.prototype.pause.call(this);
                this._tableController.enabled = false;
                this._tableController.off(Client.TableController.EXIT_GAME, this.onExitGame, this);
                this._tableController.off(Client.TableController.MONEY_EXPIRED, this.toggleNotEnoughPopup, this);
                this._tableController.off(Client.TableController.NOT_ENOUGH_BANKROLL, this.toggleNotEnoughPopup, this);
                this._hourlyDrip.off(Client.Lobby.HourlyDrip.EVENT_CLICK, this.getHourlyDrip, this);
                Client.ModelEvents.off(Client.ModelEvent.MODEL_ME_REWARDED, this.onRewardedVideo, this);
                Client.ModelEvents.off(Client.ModelEvent.MODEL_ME_HOURLY_DRIP, this.onHourlyDrip, this);
                Client.SceneController.removeFromParent([
                    this._bg, this._dealer, this._buttonWatch,
                    this._raiseView, this._table, this._hourlyDripTip,
                    this._levelPanel, this._buyIntoGamePopup, this._standUpPopup,
                    this._notEnoughPopup, this._cardsContainer,
                    this._buttonsBetsContainer, this._buttonBack, this._hourlyDrip,
                ]);
            };
            GameSceneController.prototype.resume = function () {
                _super.prototype.resume.call(this);
                this.onResize();
                this.setButtonWatchVisibility(Client.RewardedVideoController.instance.status == Client.RewardedVideoController.AVAILABLE);
                this._tableController.enabled = true;
                this._tableController.on(Client.TableController.EXIT_GAME, this.onExitGame, this);
                this._tableController.on(Client.TableController.MONEY_EXPIRED, this.toggleNotEnoughPopup, this);
                this._tableController.on(Client.TableController.NOT_ENOUGH_BANKROLL, this.toggleNotEnoughPopup, this);
                this._hourlyDrip.on(Client.Lobby.HourlyDrip.EVENT_CLICK, this.getHourlyDrip, this);
                this._tableController.initGame();
                this._container.addChild(this._bg);
                this._containerReal.addChild(this._cardsContainer);
                this._containerReal.addChild(this._table);
                this._containerReal.addChild(this._levelPanel);
                this._containerReal.addChild(this._hourlyDrip);
                this._containerReal.addChild(this._buttonWatch);
                this._containerReal.addChild(this._hourlyDripTip);
                this._containerReal.addChild(this._raiseView);
                this._containerReal.addChild(this._buttonsBetsContainer);
                this._containerReal.addChild(this._buttonBack);
                this._containerReal.addChild(this._standUpPopup);
                this._containerReal.addChild(this._buyIntoGamePopup);
                this._containerReal.addChild(this._notEnoughPopup);
                Client.ModelEvents.on(Client.ModelEvent.MODEL_ME_REWARDED, this.onRewardedVideo, this);
                Client.ModelEvents.on(Client.ModelEvent.MODEL_ME_HOURLY_DRIP, this.onHourlyDrip, this);
            };
            GameSceneController.prototype.onResize = function () {
                _super.prototype.onResize.call(this);
                var view = Client.Model.view;
                this._bg.setSize(view.gameFullWidth, view.gameFullHeight);
                this._dealer.setWidth(view.gameRealWidth * this.DEALER_WIDTH_KOEF);
                this._dealer.x = view.gameRealWidth / 2 - this._dealer.getWidth() / 2;
                this._dealer.y = 0;
                this._cardsContainer.setWidth(view.gameRealWidth * this.CARDS_CONT_WIDTH_KOEF);
                this._cardsContainer.x = view.gameRealWidth / 2;
                this._cardsContainer.y = view.gameRealHeight * this.CARDS_CONT_TOP_OFFSET_KOEF;
                this._table.setSize(view.gameRealWidth, view.gameRealHeight);
                this._raiseView.setHeight(view.gameRealHeight);
                this._raiseView.x = view.gameRealWidth - this._raiseView.getWidth();
                this._raiseView.y = 0;
                this._standUpPopup.setHeight(view.gameRealHeight);
                this._standUpPopup.x = 0;
                this._standUpPopup.y = 0;
                this._buyIntoGamePopup.setSize(view.gameRealWidth * this.BUY_INTO_GAME_POPUP_WIDTH_KOEF, view.gameRealHeight * this.BUY_INTO_GAME_POPUP_HEIGHT_KOEF);
                this._buyIntoGamePopup.x = view.gameRealWidth / 2 - this._buyIntoGamePopup.getWidth() / 2;
                this._buyIntoGamePopup.y = view.gameRealHeight / 2 - this._buyIntoGamePopup.getHeight() / 2;
                var notEnoughPopupWidth = view.gameRealWidth * this.NOT_ENOUGH_POPUP_WIDTH_KOEF, notEnoughPopupHeight = view.gameRealHeight * this.NOT_ENOUGH_POPUP_HEIGHT_KOEF, notEnoughPopupX = view.gameRealWidth / 2 - notEnoughPopupWidth / 2, notEnoughPopupY = view.gameRealHeight / 2 - notEnoughPopupHeight / 2;
                this._notEnoughPopup.setSize(notEnoughPopupWidth, notEnoughPopupHeight);
                this._notEnoughPopup.position.set(notEnoughPopupX, notEnoughPopupY);
                this._levelPanel.setHeight(view.gameRealHeight * this.LEVEL_PANEL_HEIGHT_KOEF);
                this._levelPanel.x = view.gameRealHeight * this.LEVEL_PANEL_LEFT_OFFSET_KOEF;
                this._levelPanel.y = view.gameRealHeight * this.LEVEL_PANEL_TOP_OFFSET_KOEF;
                this._hourlyDripTip.fontSize = view.gameRealHeight * this.HOURLY_DRIP_TIP_FONT_SIZE_KOEF;
                var hourlyDripTipX = this._hourlyDrip.x + this._hourlyDrip.getWidth() / 1.65, hourlyDripTipY = this._hourlyDrip.y + this._hourlyDrip.getHeight() * 1.05;
                this._hourlyDripTip.position.set(hourlyDripTipX, hourlyDripTipY);
                this._buttonsBetsContainer.setWidth(view.gameRealWidth * this.BUTTONS_BETS_WIDTH_KOEF);
                this._buttonsBetsContainer.x = view.gameRealWidth - this._buttonsBetsContainer.getWidth() - view.gameRealWidth * this.BUTTONS_BETS_BOTTOM_RIGHT_OFFSET_KOEF;
                this._buttonsBetsContainer.y = view.gameRealHeight - this._buttonsBetsContainer.getHeight() - view.gameRealHeight * this.BUTTONS_BETS_BOTTOM_RIGHT_OFFSET_KOEF;
                this._buttonBack.setWidth(view.gameRealWidth * this.BUTTON_BACK_WIDTH_KOEF, true);
                this._buttonBack.x = this._buttonBack.y = view.gameRealHeight * this.BUTTON_BACK_OFFSET_KOEF;
                this._buttonWatch.setWidth(view.gameRealWidth * this.BUTTON_WATCH_WIDTH_KOEF, true);
                var buttonWatchOffset = view.gameRealHeight * this.BUTTON_WATCH_OFFSET_KOEF;
                this._buttonWatch.y = buttonWatchOffset;
                this._buttonWatch.x = view.gameRealWidth - this._buttonWatch.getWidth() - buttonWatchOffset;
                this._hourlyDrip.setHeight(view.gameRealHeight * this.HOURLY_DRIP_HEIGHT_KOEF);
                var hourlyDripPosition = this.getNextHourlyDripPosition(this._buttonWatch.visible);
                this._hourlyDrip.position.set(hourlyDripPosition.x, hourlyDripPosition.y);
            };
            GameSceneController.prototype.getNextHourlyDripPosition = function (buttonWatchVisible) {
                var view = Client.Model.view;
                Client.trace('buttonwatchx', this._buttonWatch.x);
                var x = (buttonWatchVisible ? this._buttonWatch.x : view.gameRealWidth) -
                    view.gameRealWidth * (this.HOURLY_DRIP_OFFSET_RIGHT_KOEF) - this._hourlyDrip.getWidth(), y = view.gameRealHeight * this.HOURLY_DRIP_OFFSET_TOP_KOEF;
                return { x: x, y: y };
            };
            GameSceneController.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._cardsContainer.destroy();
                this._cardsContainer.destroy();
                this._levelPanel.destroy();
                this._standUpPopup.destroy();
                this._buttonWatch.destroy();
                this._raiseView.destroy();
                this._buttonsBetsContainer.destroy();
                this._buyIntoGamePopup.destroy();
                this._tableController.destroy();
            };
            GameSceneController.prototype.initHourlyDrip = function () {
                setInterval(function () {
                    Client.Model.me.hourlyDripDecrement();
                }, 1000);
            };
            GameSceneController.prototype.attachHourlyDripTipToWatchButton = function () {
                var hourlyDripTipX = this._buttonWatch.x - this._buttonWatch.getWidth() / 7, hourlyDripTipY = this._buttonWatch.y + this._buttonWatch.getHeight() * 1.05;
                this._hourlyDripTip.position.set(hourlyDripTipX, hourlyDripTipY);
            };
            GameSceneController.prototype.attachHourlyDripTipToCenter = function () {
                var view = Client.Model.view;
                var hourlyDripTipX = (view.gameRealWidth - this._hourlyDripTip.getWidth()) / 2, hourlyDripTipY = (view.gameRealHeight - this._hourlyDripTip.getHeight()) / 2;
                this._hourlyDripTip.position.set(hourlyDripTipX, hourlyDripTipY);
            };
            return GameSceneController;
        }(Client.SceneController));
        Client.GameSceneController = GameSceneController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var LobbySceneController = (function (_super) {
                __extends(LobbySceneController, _super);
                function LobbySceneController() {
                    var _this = _super.call(this) || this;
                    _this.USER_PANEL_WIDTH_KOEF = 0.25;
                    _this.USER_PANEL_OFFSET_LEFT_KOEF = 0.022;
                    _this.USER_PANEL_OFFSET_TOP_KOEF = 0.03;
                    _this.SETTINGS_WIDTH_KOEF = 0.3;
                    _this.SETTINGS_HEIGHT_KOEF = 1;
                    _this.SETTINGS_OFFSET_RIGHT_KOEF = 0;
                    _this.SETTINGS_OFFSET_TOP_KOEF = 0;
                    _this.REWARD_VIDEO_POPUP_WIDTH_KOEF = 0.62;
                    _this.REWARD_VIDEO_POPUP_HEIGHT_KOEF = 0.91;
                    _this.TABLE_UNIT_WIDTH_KOEF = 0.2;
                    _this.TABLE_UNIT_OFFSET_LEFT_KOEF = 0.28;
                    _this.TABLE_UNIT_OFFSET_TOP_KOEF = 0.21;
                    _this.TABLE_UNITS_INTERVAL_KOEF = 0.04;
                    _this.FREE_CHIPS_PANEL_WIDTH_KOEF = 0.195;
                    _this.FREE_CHIPS_PANEL_OFFSET_LEFT_KOEF = 0.035;
                    _this.FREE_CHIPS_PANEL_OFFSET_TOP_KOEF = 0.21;
                    _this.OPEN_SETTINGS_BUTTON_WIDTH_KOEF = 0.082;
                    _this.OPEN_SETTINGS_BUTTON_OFFSET_LEFT_KOEF = 0.9;
                    _this.OPEN_SETTINGS_BUTTON_OFFSET_TOP_KOEF = 0.033;
                    _this.ADD_FRIEND_BUTTON_WIDTH_KOEF = 0.08;
                    _this.ADD_FRIEND_BUTTON_OFFSET_LEFT_KOEF = 0.035;
                    _this.ADD_FRIEND_BUTTON_OFFSET_TOP_KOEF = 0.804;
                    _this.CHIP_COUNTER_OFFSET_TOP_KOEF = 0.066;
                    _this.CHIP_COUNTER_HEIGHT_KOEF = 0.085;
                    _this.HOURLY_DRIP_OFFSET_TOP_KOEF = 0.03;
                    _this.HOURLY_DRIP_OFFSET_LEFT_KOEF = 0.7;
                    _this.HOURLY_DRIP_HEIGHT_KOEF = 0.138;
                    _this.HOURLY_DRIP_TIP_FONT_SIZE_KOEF = 0.051;
                    _this._settingsData = [
                        { title: 'Sound FX', value: true, },
                    ];
                    _this._tableUnits = new Array();
                    _this._tableUnitsPairs = {};
                    _this._showSettings = false;
                    _this._showRewardVideoPopup = false;
                    _this.needConnect = true;
                    _this._lobbyContReal = new PIXI.Container();
                    _this._bg = new Lobby.Bg();
                    _this._userPanel = new Lobby.UserPanel();
                    _this._lobbyContReal.addChild(_this._userPanel);
                    _this.updateUserPanelData();
                    _this._openSettingsButton = new Lobby.OpenSettingsButton();
                    _this._openSettingsButton.on(Lobby.OpenSettingsButton.EVENT_CLICK, _this.toggleSettings, _this);
                    _this._lobbyContReal.addChild(_this._openSettingsButton);
                    _this._addFriendButton = new Client.AddFriendButton();
                    _this._addFriendButton.on(Client.AddFriendButton.EVENT_CLICK, _this.onAddFriendButtonClick, _this);
                    _this._lobbyContReal.addChild(_this._addFriendButton);
                    _this._chipCounter = new Lobby.ChipCounter();
                    _this._lobbyContReal.addChild(_this._chipCounter);
                    _this._hourlyDrip = new Lobby.HourlyDrip();
                    _this._hourlyDrip.visible = false;
                    _this._hourlyDrip.on(Lobby.HourlyDrip.EVENT_CLICK, _this.getHourlyDrip, _this);
                    _this._lobbyContReal.addChild(_this._hourlyDrip);
                    _this._freeChipsPanel = new Lobby.FreeChipsPanel();
                    _this._lobbyContReal.addChild(_this._freeChipsPanel);
                    _this._freeChipsPanel.disabled = Client.RewardedVideoController.instance.status != Client.RewardedVideoController.AVAILABLE;
                    Client.RewardedVideoController.instance.on(Client.RewardedVideoController.AVAILABLE, function () {
                        _this._freeChipsPanel.disabled = false;
                    });
                    Client.RewardedVideoController.instance.on(Client.RewardedVideoController.TICK, function (tick) {
                    });
                    _this._freeChipsPanel.pictureTexture = Client.Resources.getTexture('lobby/free_chips_picture/1');
                    _this._freeChipsPanel.on(Lobby.FreeChipsPanel.EVENT_CLICK, _this.tryWathVideo, _this);
                    var self = _this;
                    _this._tableUnitsCont = new PIXI.Container();
                    _this._lobbyContReal.addChild(_this._tableUnitsCont);
                    _this.prefarmTables();
                    _this.initChipsCount();
                    _this.initHourlyDrip();
                    _this._settings = new Lobby.Settings(function () { return self.toggleSettings(); });
                    _this.initSettings();
                    _this._lobbyContReal.addChild(_this._settings);
                    if (Client.Config.isLocalHost || Client.Config.isBitball) {
                        _this._btnsCont = new PIXI.Container();
                        _this._btnTest = new Lobby.SelectTableButton('Test');
                        _this._btnTest.on(Lobby.SelectTableButton.EVENT_CLICK, _this.onButtonConnectClick, _this);
                        _this._btnDev = new Lobby.SelectTableButton('Dev');
                        _this._btnDev.on(Lobby.SelectTableButton.EVENT_CLICK, _this.onButtonConnectClick, _this);
                        _this._btnStaging = new Lobby.SelectTableButton('Staging');
                        _this._btnStaging.on(Lobby.SelectTableButton.EVENT_CLICK, _this.onButtonConnectClick, _this);
                        _this._btnProd = new Lobby.SelectTableButton('Prod');
                        _this._btnProd.on(Lobby.SelectTableButton.EVENT_CLICK, _this.onButtonConnectClick, _this);
                        _this._btnsCont.addChild(_this._btnTest);
                        _this._btnsCont.addChild(_this._btnDev);
                        _this._btnsCont.addChild(_this._btnStaging);
                        _this._btnsCont.addChild(_this._btnProd);
                    }
                    _this.initPopups();
                    _this._hourlyDripTip = new Lobby.HourlyDripTip();
                    _this._lobbyContReal.addChild(_this._hourlyDripTip);
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_ME, _this.onChangeMe, _this);
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_ME_MONEY, _this.onMoneyUpdated, _this);
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_ME_HOURLY_DRIP, _this.onHourlyDrip, _this);
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_TABLE, _this.onChangeTable, _this);
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_TABLES_CONFIG, _this.onTablesConfigLoaded, _this);
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_ME_REWARDED, function (e) {
                        _this.attachHourlyDripTipToFreeChipsPanel();
                        _this._hourlyDripTip.show(Client.Model.me.earned);
                        _this._freeChipsPanel.disabled = true;
                        _this._rewardVideoPopup.earned = Client.Model.me.earned;
                        Client.Statistic.Log(Client.StatCounters.tap_w2e, Client.Model.me.earned, { kingdom: "success" });
                        Client.Statistic.Log(Client.StatCounters.currency_source, Client.Model.me.earned, {
                            kingdom: (Client.Model.me.balance >> 0).toString(),
                            class: "w2e"
                        });
                    }, _this);
                    window.joinTable = function (id) {
                        new Client.CommandUser().joinTable(id);
                    };
                    return _this;
                }
                LobbySceneController.prototype.pause = function () {
                    _super.prototype.pause.call(this);
                    Client.SceneController.removeFromParent([this._bg, this._lobbyContReal]);
                    Client.ModelEvents.off(Client.ModelEvent.MODEL_ME_REWARDED, this.onRewarded, this);
                };
                LobbySceneController.prototype.resume = function () {
                    _super.prototype.resume.call(this);
                    this.onResize();
                    Client.ModelEvents.on(Client.ModelEvent.MODEL_ME_REWARDED, this.onRewarded, this);
                    this.onMoneyUpdated();
                    this._container.addChild(this._bg);
                    if ((!Client.Server.instance || !Client.Server.instance.connected) && this._btnsCont)
                        this._lobbyContReal.addChild(this._btnsCont);
                    this._settings.visible = false;
                    this._containerReal.addChild(this._lobbyContReal);
                    Client.Server.instance.once(Client.Server.READY, this.onServerConnect, this);
                    if (Client.Server.instance && Client.Server.instance.connected) {
                        Client.Statistic.Log(Client.StatCounters.menu_load, Client.Model.me.balance);
                    }
                    else {
                        Client.Server.instance.once(Client.Server.READY, function () {
                            setTimeout(function () {
                                Client.Statistic.Log(Client.StatCounters.menu_load, Client.Model.me.balance);
                            }, 100);
                        });
                    }
                };
                LobbySceneController.prototype.onResize = function () {
                    _super.prototype.onResize.call(this);
                    var view = Client.Model.view;
                    this._bg.setSize(view.gameFullWidth, view.gameFullHeight);
                    this._userPanel.setWidth(view.gameRealWidth * this.USER_PANEL_WIDTH_KOEF);
                    this._userPanel.setPosition(view.gameRealWidth * this.USER_PANEL_OFFSET_LEFT_KOEF, view.gameRealHeight * this.USER_PANEL_OFFSET_TOP_KOEF);
                    this._openSettingsButton.setDiameter(view.gameRealWidth * this.OPEN_SETTINGS_BUTTON_WIDTH_KOEF);
                    this._openSettingsButton.setPosition(view.gameRealWidth * this.OPEN_SETTINGS_BUTTON_OFFSET_LEFT_KOEF, view.gameRealHeight * this.OPEN_SETTINGS_BUTTON_OFFSET_TOP_KOEF);
                    this._addFriendButton.setDiameter(view.gameRealWidth * this.ADD_FRIEND_BUTTON_WIDTH_KOEF);
                    this._addFriendButton.setPosition(view.gameRealWidth * this.ADD_FRIEND_BUTTON_OFFSET_LEFT_KOEF, view.gameRealHeight * this.ADD_FRIEND_BUTTON_OFFSET_TOP_KOEF);
                    this._freeChipsPanel.setWidth(view.gameRealWidth * this.FREE_CHIPS_PANEL_WIDTH_KOEF);
                    this._freeChipsPanel.setPosition(view.gameRealWidth * this.FREE_CHIPS_PANEL_OFFSET_LEFT_KOEF, view.gameRealHeight * this.FREE_CHIPS_PANEL_OFFSET_TOP_KOEF);
                    this._chipCounter.setHeight(view.gameRealHeight * this.CHIP_COUNTER_HEIGHT_KOEF);
                    this._chipCounter.position.set(view.gameRealWidth / 2 - this._chipCounter.actualWidth / 2, view.gameRealHeight * this.CHIP_COUNTER_OFFSET_TOP_KOEF);
                    this._hourlyDrip.setHeight(view.gameRealHeight * this.HOURLY_DRIP_HEIGHT_KOEF);
                    this._hourlyDrip.position.set(view.gameRealWidth * this.HOURLY_DRIP_OFFSET_LEFT_KOEF, view.gameRealHeight * this.HOURLY_DRIP_OFFSET_TOP_KOEF);
                    var rewardVideoPopupWidth = view.gameRealWidth * this.REWARD_VIDEO_POPUP_WIDTH_KOEF, rewardVideoPopupHeight = view.gameRealHeight * this.REWARD_VIDEO_POPUP_HEIGHT_KOEF, rewardVideoPopupX = view.gameRealWidth / 2 - rewardVideoPopupWidth / 2, rewardVideoPopupY = view.gameRealHeight / 2 - rewardVideoPopupHeight / 2;
                    this._rewardVideoPopup.setSize(rewardVideoPopupWidth, rewardVideoPopupHeight);
                    this._rewardVideoPopup.position.set(rewardVideoPopupX, rewardVideoPopupY);
                    var notEnoughPopupWidth = view.gameRealWidth * this.REWARD_VIDEO_POPUP_WIDTH_KOEF, notEnoughPopupHeight = view.gameRealHeight * this.REWARD_VIDEO_POPUP_HEIGHT_KOEF, notEnoughPopupX = view.gameRealWidth / 2 - rewardVideoPopupWidth / 2, notEnoughPopupY = view.gameRealHeight / 2 - rewardVideoPopupHeight / 2;
                    this._notEnoughPopup.setSize(notEnoughPopupWidth, notEnoughPopupHeight);
                    this._notEnoughPopup.position.set(notEnoughPopupX, notEnoughPopupY);
                    var videoPlayerWidth = view.gameRealWidth * 0.9, videoPlayerHeight = view.gameRealHeight * 0.9;
                    this._videoPlayer.setSize(videoPlayerWidth, videoPlayerHeight);
                    var videoPlayerX = (view.gameRealWidth - this._videoPlayer.getWidth()) / 2, videoPlayerY = (view.gameRealHeight - this._videoPlayer.getHeight()) / 2;
                    this._videoPlayer.position.set(videoPlayerX, videoPlayerY);
                    this._hourlyDripTip.fontSize = view.gameRealHeight * this.HOURLY_DRIP_TIP_FONT_SIZE_KOEF;
                    this.resizeTableUnits();
                    var btnWidth = view.gameRealWidth * this.TABLE_UNIT_WIDTH_KOEF / 2;
                    var offset = btnWidth * 1.1;
                    if (this._btnsCont) {
                        this._btnTest.setWidth(btnWidth, true);
                        this._btnDev.setWidth(btnWidth, true);
                        this._btnStaging.setWidth(btnWidth, true);
                        this._btnProd.setWidth(btnWidth, true);
                        this._btnsCont.x = view.gameRealWidth - btnWidth * 5;
                        this._btnsCont.y = this._addFriendButton.y;
                        this._btnTest.x = 0;
                        this._btnDev.x = this._btnTest.x + offset;
                        this._btnStaging.x = this._btnDev.x + offset;
                        this._btnProd.x = this._btnStaging.x + offset;
                    }
                    var settingsWidth = view.gameFullWidth * this.SETTINGS_WIDTH_KOEF, settingsHeight = view.gameFullHeight * this.SETTINGS_HEIGHT_KOEF, settingsX = view.gameRealWidth * (1 - this.SETTINGS_OFFSET_RIGHT_KOEF) - settingsWidth, settingsY = view.gameRealHeight * this.SETTINGS_OFFSET_TOP_KOEF;
                    this._settings.setSize(settingsWidth, settingsHeight);
                    this._settings.setPosition(settingsX, settingsY);
                };
                LobbySceneController.prototype.attachHourlyDripTipToHourlyDrip = function () {
                    var view = Client.Model.view;
                    var hourlyDripTipX = this._hourlyDrip.x - this._hourlyDripTip.width - view.gameRealWidth * 0.1, hourlyDripTipY = this._hourlyDrip.y + this._hourlyDrip.getHeight() - this._hourlyDripTip.height;
                    this._hourlyDripTip.position.set(hourlyDripTipX, hourlyDripTipY);
                };
                LobbySceneController.prototype.attachHourlyDripTipToFreeChipsPanel = function () {
                    var hourlyDripTipX = this._freeChipsPanel.x + this._freeChipsPanel.getWidth() / 2 - this._hourlyDripTip.getWidth() / 2, hourlyDripTipY = this._freeChipsPanel.y + this._freeChipsPanel.getHeight() / 2;
                    this._hourlyDripTip.position.set(hourlyDripTipX, hourlyDripTipY);
                };
                LobbySceneController.prototype.resizeTableUnits = function () {
                    var _this = this;
                    var view = Client.Model.view;
                    var count = 0;
                    this._tableUnits.forEach(function (unit) {
                        var width = view.gameRealWidth * _this.TABLE_UNIT_WIDTH_KOEF, x = view.gameRealWidth * (_this.TABLE_UNIT_OFFSET_LEFT_KOEF
                            + _this.TABLE_UNITS_INTERVAL_KOEF * count)
                            + width * count, y = view.gameRealHeight * _this.TABLE_UNIT_OFFSET_TOP_KOEF;
                        unit.setWidth(width);
                        unit.setPosition(x, y);
                        count++;
                    });
                };
                LobbySceneController.prototype.onChangeMe = function (event) {
                    this._hourlyDrip.disabled = !Client.Model.me.availableHourlyDrip && (Client.Model.me.timeHourlyDrip != 0);
                    this._hourlyDrip.time = Client.Model.me.timeHourlyDrip;
                    this.updateUserPanelData();
                };
                LobbySceneController.prototype.updateUserPanelData = function () {
                    this._userPanel.avatarSource = Client.Model.me.photo;
                    this._userPanel.level = Client.Model.me.level;
                    this._userPanel.progress = Client.Model.me.progressForNextLevel;
                };
                LobbySceneController.prototype.onVideoStart = function (source) {
                    this._videoPlayer.visible = true;
                    Client.trace('video started with source', source);
                };
                LobbySceneController.prototype.onVideoFinish = function (source) {
                    this._videoPlayer.visible = false;
                    Client.trace('video finished with source', source);
                };
                LobbySceneController.prototype.onHourlyDrip = function (event) {
                    this._hourlyDripTip.show(Client.Model.me.earned);
                    this.attachHourlyDripTipToHourlyDrip();
                    this._hourlyDripTip.show(Client.Model.me.earned);
                    Client.Statistic.Log(Client.StatCounters.tap_hourly_drip, Client.Model.me.earned, { kingdom: "success" });
                    Client.Statistic.Log(Client.StatCounters.currency_source, Client.Model.me.earned, {
                        kingdom: (Client.Model.me.balance >> 0).toString(),
                        class: "hourly_drip"
                    });
                };
                LobbySceneController.prototype.onChangeTable = function (event) {
                    if (event.type == Client.ModelEvent.INIT) {
                        Client.ScenesManager.goToScene('game');
                        var table_wallet = Client.Model.me.stack;
                        Client.Statistic.Log(Client.StatCounters.player_table_join, table_wallet, { kingdom: Client.Model.table.level.toString() });
                    }
                };
                LobbySceneController.prototype.onServerConnect = function () {
                    if (this._btnsCont && this._btnsCont.parent)
                        this._btnsCont.parent.removeChild(this._btnsCont);
                    if (this.needConnect) {
                        var entryPointData = Client.Platform.service.getInviteData();
                        Client.trace("[Entry Point Data]", entryPointData);
                        if (entryPointData && entryPointData.from == "table") {
                            new Client.CommandUser().joinTable(entryPointData.tableId);
                            this.trackServerRejected();
                        }
                    }
                    this.needConnect = false;
                };
                LobbySceneController.prototype.trackServerRejected = function () {
                    Client.Server.instance.once(Client.Server.ERROR, function (e) {
                        Client.trace("Error:", e);
                        if (e.code == 4) {
                            Client.Statistic.Log(Client.StatCounters.player_table_dropped, Math.min(Client.Model.me.balance, Client.Model.table.maxBuyIn), { kingdom: Client.Model.table.level.toString() });
                        }
                    });
                };
                LobbySceneController.prototype.onButtonConnectClick = function (btn) {
                    if (btn === this._btnTest)
                        Client.AuthController.connectToServer(Client.Config.CONF_TEST);
                    else if (btn === this._btnDev)
                        Client.AuthController.connectToServer(Client.Config.CONF_DEV);
                    else if (btn === this._btnStaging)
                        Client.AuthController.connectToServer(Client.Config.CONF_STAGING);
                    else if (btn === this._btnProd)
                        Client.AuthController.connectToServer(Client.Config.CONF_PROD);
                    if (Client.Server.instance)
                        Client.Server.instance.once(Client.Server.READY, this.onServerConnect, this);
                };
                LobbySceneController.prototype.getHourlyDrip = function () {
                    new Client.CommandUser().getHourlyDrip();
                };
                LobbySceneController.prototype.onMoneyUpdated = function () {
                    var money = Client.Model.me.balance;
                    if (money !== undefined) {
                        this._hourlyDrip.visible = true;
                    }
                    this._chipCounter.count = money;
                    this.calculateBuyIn();
                };
                LobbySceneController.prototype.calculateBuyIn = function () {
                    var _this = this;
                    var money = Client.Model.me.balance;
                    var minBuyIn = null;
                    Client.Model.tables.getTables().forEach(function (tableData) {
                        var unit = _this._tableUnitsPairs[tableData.id];
                        if (!unit)
                            return;
                        var buyIn = Client.Model.tables.calculateBuyIn(tableData.id, money);
                        minBuyIn = minBuyIn !== null ? Math.min(minBuyIn, buyIn) : buyIn;
                        unit.updateBuyIn(buyIn);
                        unit.available = buyIn <= money;
                    });
                    this._notEnoughPopup.visible = money < minBuyIn;
                };
                LobbySceneController.prototype.onTablesConfigLoaded = function () {
                    var _this = this;
                    this._tableUnits.forEach(function (u) { return _this._tableUnitsCont.removeChild(u); });
                    this.initTables();
                    this._tableUnits.forEach(function (u) { return _this._tableUnitsCont.addChild(u); });
                    this.calculateBuyIn();
                };
                LobbySceneController.prototype.toggleSettings = function () {
                    var _this = this;
                    this._showSettings = !this._showSettings;
                    if (this._showSettings) {
                        this._settings.musicEnabled = Client.Sounds.musicEnabled;
                        this._settings.soundsEnabled = Client.Sounds.soundsEnabled;
                        this._settings.visible = true;
                        this._settings.position.x = Client.Model.view.gameRealWidth;
                        Client.Tweener.to(this._settings, 0.25, {
                            pixi: {
                                positionX: Client.Model.view.gameRealWidth - this._settings._w
                            }
                        });
                    }
                    else {
                        Client.Tweener.to(this._settings, 0.25, {
                            pixi: {
                                positionX: Client.Model.view.gameRealWidth
                            },
                            onComplete: function () {
                                _this._settings.visible = false;
                            }
                        });
                    }
                };
                LobbySceneController.prototype.onAddFriendButtonClick = function () {
                    var data = {
                        text: "Go to Poker!"
                    };
                    Client.Platform.service.requestShareAsync(data)
                        .then(function (status) {
                        new Client.CommandUser().setBalance(Client.Model.me.balance + 1000);
                        console.warn('[FRIEND BUTTON] send ShareToFriend on server for getting reward');
                    }, function (status) {
                        console.error("[share request rejected]", status);
                    });
                };
                LobbySceneController.prototype.onSelectTable = function (level) {
                    this.trackServerRejected();
                    new Client.CommandUser().findTable(level);
                    Client.Model.table.minBuyIn = Client.Model.tables.getTable(level).minBuyIn;
                    Client.Model.table.maxBuyIn = Client.Model.tables.getTable(level).maxBuyIn;
                    Client.Model.table.level = level;
                    var table_wallet = Math.min(Client.Model.me.balance, Client.Model.table.maxBuyIn);
                    Client.Statistic.Log(Client.StatCounters.player_table_choose, table_wallet, { kingdom: Client.Model.table.level.toString() });
                };
                LobbySceneController.prototype.isWathedOk = function () {
                    console.log('Watch reward video ok');
                    new Client.CommandUser().getRewardedVideo();
                };
                LobbySceneController.prototype.tryWathVideo = function () {
                    var _this = this;
                    Client.RewardedVideoController.instance.show(function (status) {
                        if (status.code == "SHOWED") {
                            _this.isWathedOk();
                        }
                        else {
                            Client.Statistic.Log(Client.StatCounters.tap_w2e, null, { kingdom: "failure" });
                        }
                    });
                };
                LobbySceneController.prototype.onNotEnoughOk = function () {
                    this.tryWathVideo();
                    this.toggleNotEnoughPopup();
                };
                LobbySceneController.prototype.onSelectTableWithSettings = function (level) {
                    this.onSelectTable(level);
                };
                LobbySceneController.prototype.onRewarded = function () {
                    Client.RewardedVideoController.instance.run(false, Client.Model.me.timeRewardedVideo);
                    this._rewardVideoPopup.visible = !this._rewardVideoPopup.visible;
                    this._freeChipsPanel.interactive = !this._rewardVideoPopup.visible;
                };
                LobbySceneController.prototype.toggleNotEnoughPopup = function () {
                    console.log('toggle to ', !this._notEnoughPopup.visible);
                    this._notEnoughPopup.disabled = !(Client.RewardedVideoController.instance.status === Client.RewardedVideoController.AVAILABLE);
                    this._notEnoughPopup.visible = !this._notEnoughPopup.visible;
                };
                LobbySceneController.prototype.destroy = function () {
                    Client.trace('destroy');
                    _super.prototype.destroy.call(this);
                    this._container.destroy({ children: true });
                    this._containerReal.destroy({ children: true });
                };
                LobbySceneController.prototype.initPopups = function () {
                    this._rewardVideoPopup = new Lobby.RewardVideoPopup();
                    this._rewardVideoPopup.earned = 45000;
                    this._rewardVideoPopup.visible = false;
                    this._rewardVideoPopup.on(Lobby.RewardVideoPopup.EVENT_CLOSE, this.onRewarded, this);
                    this._rewardVideoPopup.on(Lobby.RewardVideoPopup.EVENT_OK, this.tryWathVideo, this);
                    this._lobbyContReal.addChild(this._rewardVideoPopup);
                    this._notEnoughPopup = new Lobby.NotEnoughPopup();
                    this._notEnoughPopup.on(Lobby.NotEnoughPopup.EVENT_CLOSE, this.toggleNotEnoughPopup, this);
                    this._notEnoughPopup.on(Lobby.NotEnoughPopup.EVENT_OK, this.onNotEnoughOk, this);
                    this._notEnoughPopup.visible = false;
                    this._lobbyContReal.addChild(this._notEnoughPopup);
                    this._videoPlayer = new Lobby.VideoPlayer();
                    this._videoPlayer.visible = false;
                    this._videoPlayer.on(Lobby.VideoPlayer.EVENT_START, this.onVideoStart, this);
                    this._videoPlayer.on(Lobby.VideoPlayer.EVENT_FINISH, this.onVideoFinish, this);
                    this._lobbyContReal.addChild(this._videoPlayer);
                };
                LobbySceneController.prototype.initChipsCount = function () {
                    this._chipCounter.count = Client.Model.me.balance;
                };
                LobbySceneController.prototype.initSettings = function () {
                    var _this = this;
                    var self = this;
                    this._settingsData.forEach(function (_a, index) {
                        var title = _a.title, value = _a.value;
                        _this._settings.addSettings(title, value, index % 2 === 0, function (nextValue) {
                            self._settingsData[index].value = nextValue;
                            if (title == 'Sound FX') {
                                Client.Sounds.soundsEnabled = nextValue;
                                _this._settings.soundsEnabled = Client.Sounds.soundsEnabled;
                                Client.Store.set('sound', { sounds: Client.Sounds.soundsEnabled, music: Client.Sounds.musicEnabled });
                            }
                            else if (title == 'Music') {
                                Client.Sounds.musicEnabled = nextValue;
                                _this._settings.musicEnabled = Client.Sounds.musicEnabled;
                                Client.Store.set('sound', { sounds: Client.Sounds.soundsEnabled, music: Client.Sounds.musicEnabled });
                            }
                        });
                    });
                    this._settings.soundsEnabled = Client.Sounds.soundsEnabled;
                    this._settings.musicEnabled = Client.Sounds.musicEnabled;
                };
                LobbySceneController.prototype.prefarmTables = function () {
                    for (var i = 0; i < 3; i++) {
                        var unit = new Lobby.TableUnit();
                        unit.setParams({ name: ["BASIC", "STANDART", "PRO"][i] });
                        unit.available = false;
                        this._tableUnits.push(unit);
                        this._tableUnitsCont.addChild(unit);
                    }
                };
                LobbySceneController.prototype.initTables = function () {
                    var _this = this;
                    var index = 0;
                    Client.Model.tables.getTables().forEach(function (tableData) {
                        var unit = _this._tableUnits[index++];
                        if (!unit) {
                            unit = new Lobby.TableUnit();
                            _this._tableUnits.push(unit);
                        }
                        _this._tableUnitsPairs[tableData.id] = unit;
                        unit.setParams(tableData);
                        unit.on(Lobby.TableUnit.EVENT_SELECT_TABLE, function () { return _this.onSelectTable(tableData.id); }, _this);
                        unit.on(Lobby.TableUnit.EVENT_SELECT_TABLE_WITH_SETTINGS, function () { return _this.onSelectTableWithSettings(tableData.id); }, _this);
                    });
                    this.resizeTableUnits();
                };
                LobbySceneController.prototype.initHourlyDrip = function () {
                    setInterval(function () {
                        Client.Model.me.hourlyDripDecrement();
                    }, 1000);
                };
                return LobbySceneController;
            }(Client.SceneController));
            Lobby.LobbySceneController = LobbySceneController;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var PlayController = (function () {
            function PlayController() {
                this._bet = false;
                Client.ModelEvents.on(Client.ModelEvent.MODEL_TABLE, this.onChangeTable, this);
                Client.ModelEvents.on(Client.ModelEvent.MODEL_USERS, this.onChangeUsers, this);
                Client.ModelEvents.on(Client.ModelEvent.MODEL_ME, this.onChangeMe, this);
            }
            PlayController.prototype.setViews = function (playButtonsView, raiseView) {
                this._playButtonsView = playButtonsView;
                this._raiseView = raiseView;
                this._playButtonsView.on(Client.AppEvent.CLICK_BET, this.onClickBet, this);
                this._playButtonsView.on(Client.AppEvent.CLICK_CALL, this.onClickCall, this);
                this._playButtonsView.on(Client.AppEvent.CLICK_CHECK, this.onClickCheck, this);
                this._playButtonsView.on(Client.AppEvent.CLICK_FOLD, this.onClickFold, this);
                this._playButtonsView.on(Client.AppEvent.CLICK_RAISE, this.onClickRaise, this);
                this._playButtonsView.on(Client.AppEvent.CLICK_ALL_IN, this.onClickAllIn, this);
                this._playButtonsView.on(Client.AppEvent.CLICK_CONFIRM, this.onClickConfirm, this);
            };
            PlayController.prototype.onChangeTable = function (event) {
                this._raiseView.hide();
                var myBetting = Client.Model.table.playerBetting && Client.Model.table.playerBetting.id == Client.Model.me.id && event.type != Client.ModelEvent.BET_ACTION;
                var showButtons = Client.Model.table.state == Client.MTable.STATE_WAIT_BET;
                this._playButtonsView.updateButtons(myBetting && showButtons, Client.Model.me.stack, Client.Model.me.bet, Client.Model.table.users.maxBet, Client.Model.table.minBetToRaise, Client.Model.table.maxBetToRaise);
                var hasRaise = Client.Model.table.users.maxBet != 0 && Client.Model.table.users.maxBet < (Client.Model.me.stack + Client.Model.me.bet);
                this._raiseView.updateParams({
                    minBet: Client.Model.table.minBetToRaise,
                    maxBet: Client.Model.table.maxBetToRaise,
                    fullPot: Client.Model.table.fullPot,
                    halfOfPot: Client.Model.table.halfOfPot,
                    offset: Client.Model.table.betStep,
                });
            };
            PlayController.prototype.onChangeMe = function (event) {
            };
            PlayController.prototype.onChangeUsers = function (event) {
            };
            PlayController.prototype.onClickBet = function () {
                this._bet = true;
                this._raiseView.show();
                this._playButtonsView.showConfirmButton();
                Client.Sounds.play(Client.SoundsHelper.CHIP_STACK);
            };
            PlayController.prototype.onClickCall = function () {
                new Client.CommandAction().call();
                this._raiseView.hide();
                this._playButtonsView.hide();
            };
            PlayController.prototype.onClickCheck = function () {
                new Client.CommandAction().check();
                this._raiseView.hide();
                this._playButtonsView.hide();
            };
            PlayController.prototype.onClickFold = function () {
                new Client.CommandAction().fold();
                this._raiseView.hide();
                this._playButtonsView.hide();
            };
            PlayController.prototype.onClickRaise = function () {
                this._bet = false;
                this._raiseView.show();
                this._playButtonsView.showConfirmButton();
                Client.Sounds.play(Client.SoundsHelper.CHIP_STACK);
            };
            PlayController.prototype.onClickAllIn = function () {
                new Client.CommandAction().raise(Client.Model.table.maxBetToRaise - Client.Model.me.bet);
                this._raiseView.hide();
                this._playButtonsView.hide();
            };
            PlayController.prototype.onClickConfirm = function () {
                if (this._bet)
                    new Client.CommandAction().bet(this._raiseView.getSelectedBet());
                else
                    new Client.CommandAction().raise(this._raiseView.getSelectedBet() - Client.Model.me.bet);
                this._raiseView.hide();
                this._playButtonsView.hide();
            };
            PlayController.prototype.destroy = function () {
            };
            return PlayController;
        }());
        Client.PlayController = PlayController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var TableController = (function (_super) {
            __extends(TableController, _super);
            function TableController() {
                return _super.call(this) || this;
            }
            TableController.prototype.setViews = function (tableView, tableCards) {
                this._tableView = tableView;
                this._tableView.setSeatCallback(this.seatClick.bind(this));
                this._tableView.setAddFriendCallback(this.addFriendClick.bind(this));
                this._tableCards = tableCards;
            };
            TableController.prototype.seatClick = function (seatId) {
                var canSeat = this.tryToSeat(seatId);
                if (!canSeat)
                    this.emit(TableController.NOT_ENOUGH_BANKROLL);
            };
            TableController.prototype.getFreeSeatId = function () {
                var allSeats = Client.Model.table.seats;
                return allSeats.find(function (seat) { return !Client.Model.table.users.getUserBySeat(seat); });
            };
            TableController.prototype.tryToSeat = function (seatId) {
                var canSeat = Client.Model.me.balance >= Client.Model.table.minBuyIn;
                Client.trace('[try to seat: <balance, min buy-in]', Client.Model.me.balance, Client.Model.table.minBuyIn);
                if (canSeat) {
                    var finalSeatId = seatId || this.getFreeSeatId();
                    if (finalSeatId !== undefined) {
                        new Client.CommandUser().seat(Client.Model.table.id, finalSeatId);
                    }
                }
                return canSeat;
            };
            TableController.prototype.addFriendClick = function (seatId) {
                Client.trace("[Clicled on Add Friend] seatID", seatId);
                var data = {
                    text: "Play with me!",
                    data: {
                        from: "table",
                        tableId: Client.Model.table.id
                    }
                };
                Client.Platform.service.requestShareAsync(data)
                    .then(function (ok) {
                    Client.trace("[Add Player From Table]", ok);
                }, function (err) {
                    Client.trace("[Add Player From Table]", err);
                });
            };
            Object.defineProperty(TableController.prototype, "enabled", {
                set: function (value) {
                    Client.ModelEvents.off(Client.ModelEvent.MODEL_TABLE, this.onChangeTable, this);
                    Client.ModelEvents.off(Client.ModelEvent.MODEL_USERS, this.onChangeUsers, this);
                    Client.ModelEvents.off(Client.ModelEvent.MODEL_ME, this.onChangeMe, this);
                    if (value) {
                        Client.ModelEvents.on(Client.ModelEvent.MODEL_TABLE, this.onChangeTable, this);
                        Client.ModelEvents.on(Client.ModelEvent.MODEL_USERS, this.onChangeUsers, this);
                        Client.ModelEvents.on(Client.ModelEvent.MODEL_ME, this.onChangeMe, this);
                    }
                },
                enumerable: true,
                configurable: true
            });
            TableController.prototype.initGame = function () {
                if (!Client.Model.table.inited)
                    return;
                var i;
                var users;
                this._tableView.removeAllPlayers();
                this._tableView.setSeats(Client.Model.table.seats);
                if (Client.Model.table.potsSum > 0)
                    this._tableView.showPot(Client.Model.table.potsSum);
                else
                    this._tableView.hidePot();
                users = Client.Model.table.users.getAll(true);
                for (i = 0; i < users.length; i++)
                    this._tableView.addPlayer(users[i], users[i].isMe);
                this._tableView.updatePlayer(Client.Model.me.id, { isWaitForPlayers: Client.Model.table.state == Client.MTable.STATE_WAIT_PLAYERS, updateStack: true, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                if (Client.Model.table.dealer)
                    this._tableView.updateDealer(Client.Model.table.dealer.id);
                var tableState = Client.Model.table.state;
                if (tableState != Client.MTable.STATE_WAIT_PLAYERS && tableState != Client.MTable.STATE_START_GAME) {
                    this._tableView.giveOutCards(true);
                }
                users = Client.Model.table.users.getAll(true);
                for (i = 0; i < users.length; i++) {
                    if (users[i].betAction == Client.MBet.ACTION_FOLD)
                        this._tableView.returnCards(users[i].id, true);
                }
                if (Client.Model.table.state == Client.MTable.STATE_WAIT_BET && Client.Model.table.playerBetting)
                    this._tableView.waitBet(Client.Model.table.playerBetting.id, Client.Model.table.bettingTime);
                if (Client.Model.table.state == Client.MTable.STATE_SHOWDOWN || Client.Model.table.state == Client.MTable.STATE_HAND_RANKING)
                    this._tableView.showPlayersCards();
                else
                    this._tableView.hidePlayersCards();
                this._tableCards.startRound();
                this._tableCards.openCards(Client.Model.table.cards);
                this._tableView.updatePlaceButtons(!Client.Model.me.seatInGame);
            };
            TableController.prototype.onChangeTable = function (event) {
                if (!this._tableView)
                    return;
                var i;
                var users;
                if (event.type == Client.ModelEvent.INIT) {
                    this.initGame();
                }
                else if (event.type == Client.ModelEvent.SET_SEATS) {
                    this._tableView.setSeats(Client.Model.table.seats);
                }
                else if (event.type == Client.ModelEvent.TABLE_DEAL) {
                    this._tableView.giveOutCards(false);
                }
                else if (event.type == Client.ModelEvent.BET_ACTION) {
                    this._tableView.clearPlayersWaiting();
                    if (Client.Model.table.playerBetting) {
                        this._tableView.updatePlayer(Client.Model.table.playerBetting.id, { isWaitForPlayers: Client.Model.table.state == Client.MTable.STATE_WAIT_PLAYERS, updateStack: true, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                        if (Client.Model.table.playerBetting.betAction == Client.MBet.ACTION_FOLD) {
                            Client.Sounds.play(Client.SoundsHelper.FOLD);
                            this._tableView.returnCards(Client.Model.table.playerBetting.id, false);
                        }
                        else if (Client.Model.table.playerBetting.betAction == Client.MBet.ACTION_All_IN) {
                            Client.Sounds.play(Client.SoundsHelper.ALL_IN);
                        }
                        else if (Client.Model.table.playerBetting.betAction == Client.MBet.ACTION_CHECK) {
                            Client.Sounds.play(Client.SoundsHelper.CHECK);
                        }
                    }
                }
                else if (event.type == Client.ModelEvent.BEFORE_CHANGE_STATE) {
                    switch (event.data.state) {
                        case Client.MTable.STATE_FLOP:
                        case Client.MTable.STATE_TURN:
                        case Client.MTable.STATE_RIVER:
                        case Client.MTable.STATE_SHOWDOWN:
                        case Client.MTable.STATE_HAND_RANKING:
                            {
                                this._tableView.chipsToPot();
                                break;
                            }
                    }
                }
                else if (event.type == Client.ModelEvent.ALL_IN_SHOWDOWN) {
                    this._tableView.showPlayersCards();
                }
                else if (event.type == Client.ModelEvent.CHANGE_STATE) {
                    this._tableView.clearPlayersWaiting();
                    var _break_case = false;
                    switch (Client.Model.table.state) {
                        case Client.MTable.STATE_WAIT_PLAYERS:
                            {
                                this._tableCards.startRound();
                                this._tableView.reset();
                                this._tableView.hidePot();
                                break;
                            }
                        case Client.MTable.STATE_START_GAME:
                            {
                                this._tableCards.startRound();
                                this._tableView.reset();
                                this._tableView.hidePot();
                                this._tableView.hidePlayersCards();
                                this._tableView.hideMyCards();
                                this._tableView.updateDealer(Client.Model.table.dealer.id);
                                Client.Sounds.play(Client.SoundsHelper.SHUFFLE);
                                this._loop_Hand_id = Client.Model.table.id + "_" + Client.Guid.newGuid();
                                var table_wallet = Client.Model.me.stack;
                                Client.Statistic.Log(Client.StatCounters.hand_start, table_wallet, { kingdom: Client.Model.table.users.getAll(true).length.toString(), attribute: this._loop_Hand_id });
                                _break_case = true;
                                break;
                            }
                        case Client.MTable.STATE_WAIT_BET:
                            {
                                if (Client.Model.table.playerBetting) {
                                    this._tableView.waitBet(Client.Model.table.playerBetting.id, Client.Model.table.bettingTime);
                                    if (Client.Model.table.playerBetting.id == Client.Model.me.id)
                                        Client.Sounds.play(Client.SoundsHelper.MY_BETTING);
                                }
                                break;
                            }
                        case Client.MTable.STATE_FLOP:
                            if (!_break_case) {
                                var table_wallet = Client.Model.me.stack;
                                var _active = Client.Model.table.users.getAll(true).filter(function (users) { return !users.folded; });
                                Client.Statistic.Log(Client.StatCounters.hand_flop, table_wallet, { kingdom: _active.length.toString(), attribute: this._loop_Hand_id });
                                _break_case = true;
                            }
                        case Client.MTable.STATE_TURN:
                            if (!_break_case) {
                                var table_wallet = Client.Model.me.stack;
                                var _active = Client.Model.table.users.getAll(true).filter(function (users) { return !users.folded; });
                                Client.Statistic.Log(Client.StatCounters.hand_turn, table_wallet, { kingdom: _active.length.toString(), attribute: this._loop_Hand_id });
                                _break_case = true;
                            }
                        case Client.MTable.STATE_RIVER:
                            {
                                if (Client.Model.table.state == Client.MTable.STATE_FLOP)
                                    Client.Sounds.play(Client.SoundsHelper.FLOP_DEAL);
                                else
                                    Client.Sounds.play(Math.random() > 0.5 ? Client.SoundsHelper.OPEN_TABLE_CARDS1 : Client.SoundsHelper.OPEN_TABLE_CARDS2);
                                this._tableView.updatePlayers({ isWaitForPlayers: Client.Model.table.state == Client.MTable.STATE_WAIT_PLAYERS, updateStack: true, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                                this._tableView.showPot(Client.Model.table.potsSum);
                                this._tableCards.openCards(Client.Model.table.cards);
                                if (!_break_case) {
                                    var table_wallet = Client.Model.me.stack;
                                    var _active = Client.Model.table.users.getAll(true).filter(function (users) { return !users.folded; });
                                    Client.Statistic.Log(Client.StatCounters.hand_river, table_wallet, { kingdom: _active.length.toString(), attribute: this._loop_Hand_id });
                                    _break_case = true;
                                }
                                break;
                            }
                        case Client.MTable.STATE_SHOWDOWN:
                            {
                                this._tableView.showPlayersCards();
                                this._tableView.updatePlayers({ updateStack: false, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                                users = Client.Model.table.users.getAll(false);
                                for (i = 0; i < users.length; i++)
                                    this._tableView.returnCards(users[i].id, false);
                                break;
                            }
                        case Client.MTable.STATE_HAND_RANKING:
                            {
                                this._tableView.showWinState();
                                this._tableCards.showWinState();
                                this._tableView.updatePlayers({ updateStack: false, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                                users = Client.Model.table.users.getWinners();
                                this._tableView.giveOutPots(users, Client.Model.table.pots);
                                Client.Sounds.play(Client.SoundsHelper.WIN);
                                if (!_break_case) {
                                    var table_wallet = Client.Model.me.stack;
                                    var _active = Client.Model.table.users.getAll(true).filter(function (users) { return !users.folded; });
                                    var win_1 = "";
                                    Client.Model.table.handRankinkResult.banks.forEach(function (b) {
                                        if (b.players.length > 0 && b.players[0].comb > 0)
                                            win_1 += Client.HandRankCombination[b.players[0].comb] + " ";
                                    });
                                    win_1 = win_1.trim();
                                    if (win_1 == "")
                                        win_1 = "fold-win";
                                    Client.Statistic.Log(Client.StatCounters.hand_complete, table_wallet, { kingdom: _active.length.toString(), phylum: win_1, attribute: this._loop_Hand_id });
                                    _break_case = true;
                                }
                                var reason = Client.Model.me.winner ? Client.StatCounters.currency_source : Client.StatCounters.currency_sink;
                                Client.Statistic.Log(reason, Client.Model.me.earned, {
                                    kingdom: (Client.Model.me.balance >> 0).toString(),
                                    phylum: (Client.Model.me.stack >> 0).toString(),
                                    class: "bet"
                                });
                                break;
                            }
                    }
                }
                else if (event.type == Client.ModelEvent.CLEAR) {
                    this._tableView.clearGame();
                    this._tableCards.clearGame();
                    this.emit(TableController.EXIT_GAME);
                }
            };
            TableController.prototype.onChangeMe = function (event) {
                this._tableView.updatePlayer(Client.Model.me.id, { isWaitForPlayers: Client.Model.table.state == Client.MTable.STATE_WAIT_PLAYERS, updateStack: true, updateBetExpanded: false, updateBetInfo: false, updateBetVisible: false });
            };
            TableController.prototype.onChangeUsers = function (event) {
                if (!this._tableView)
                    return;
                if (event.type == Client.ModelEvent.ADD) {
                    var userId = event.data.user_id;
                    var user = Client.Model.table.users.getUserById(userId);
                    this._tableView.addPlayer(user, user.isMe);
                    this._tableView.updatePlayer(user.id, { isWaitForPlayers: Client.Model.table.state == Client.MTable.STATE_WAIT_PLAYERS, updateStack: true, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                    this._tableView.updatePlaceButtons(!Client.Model.me.seatInGame);
                }
                else if (event.type == Client.ModelEvent.DELETE) {
                    var userId = event.data.user_id;
                    this._tableView.removePlayer(userId);
                    this._tableView.updatePlaceButtons(!Client.Model.me.seatInGame);
                    if (Client.Model.me.id == userId) {
                        if (Client.Model.me.stack <= 0) {
                            this.emit(TableController.MONEY_EXPIRED);
                        }
                    }
                }
                else if (event.type == Client.ModelEvent.UPDATE) {
                    this._tableView.updatePlayer(event.data.user_id, { isWaitForPlayers: Client.Model.table.state == Client.MTable.STATE_WAIT_PLAYERS, updateStack: true, updateBetExpanded: true, updateBetInfo: true, updateBetVisible: true });
                }
            };
            TableController.prototype.destroy = function () {
                this.enabled = false;
            };
            TableController.EXIT_GAME = 'EXIT_GAME';
            TableController.MONEY_EXPIRED = 'MONEY_EXPIRED';
            TableController.NOT_ENOUGH_BANKROLL = 'NOT_ENOUGH_BANKROLL';
            return TableController;
        }(PIXI.utils.EventEmitter));
        Client.TableController = TableController;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var AppEvent = (function () {
            function AppEvent(event, data) {
                if (data === void 0) { data = null; }
                this.event = event;
                this.data = data;
            }
            AppEvent.CLICK_BET = 'CLICK_BET';
            AppEvent.CLICK_FOLD = 'CLICK_FOLD';
            AppEvent.CLICK_CHECK = 'CLICK_CHECK';
            AppEvent.CLICK_CALL = 'CLICK_CALL';
            AppEvent.CLICK_RAISE = 'CLICK_RAISE';
            AppEvent.CLICK_ALL_IN = 'CLICK_ALL_IN';
            AppEvent.CLICK_CONFIRM = 'CLICK_CONFIRM';
            return AppEvent;
        }());
        Client.AppEvent = AppEvent;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var AppEvents = (function (_super) {
            __extends(AppEvents, _super);
            function AppEvents() {
                var _this = _super.call(this) || this;
                if (AppEvents._instance)
                    throw new Error('AppEvents is singleton');
                return _this;
            }
            AppEvents.emit = function (event, data) {
                if (data === void 0) { data = null; }
                AppEvents._instance.emit(event, new Client.AppEvent(event, data));
            };
            AppEvents.on = function (event, listener, context) {
                if (context === void 0) { context = null; }
                AppEvents._instance.on(event, listener, context);
            };
            AppEvents.off = function (event, listener, context) {
                if (context === void 0) { context = null; }
                AppEvents._instance.off(event, listener, context);
            };
            AppEvents._instance = new AppEvents();
            return AppEvents;
        }(PIXI.utils.EventEmitter));
        Client.AppEvents = AppEvents;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var EffectManager = (function () {
            function EffectManager() {
            }
            EffectManager.init = function () {
            };
            EffectManager.getEffect = function (name, callback) {
                var _anim = this._anims[name];
                if (_anim == null)
                    Client.trace("[EffectManager] can't found:" + name);
                if (!_anim.loaded) {
                    PIXI.animate.load(_anim.clipConstructor, null, function (clip) {
                        Client.trace("[EffectManager] anim loaded:", clip);
                        _anim.loaded = true;
                        callback(clip);
                    }, _anim.basePath);
                }
                else {
                    callback(new _anim.clipConstructor);
                }
            };
            EffectManager._anims = {
                "Avatar": {
                    clipConstructor: Effects.avatarEffect,
                    basePath: "./assets/effects",
                    loaded: false
                }
            };
            return EffectManager;
        }());
        Client.EffectManager = EffectManager;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var SoundsHelper = (function () {
            function SoundsHelper() {
            }
            SoundsHelper.init = function () {
                Client.Sounds.add(SoundsHelper.SOUNDS, SoundsHelper.MUSICS);
                for (var i = 0; i < SoundsHelper.BACK_LOAD_SOUNDS.length; i++)
                    Client.Sounds.load(SoundsHelper.BACK_LOAD_SOUNDS[i], { preload: true, url: 'assets/sounds/' + SoundsHelper.BACK_LOAD_SOUNDS[i] + '.mp3' });
                var data = Client.Store.get('sound');
                if (data) {
                    Client.Sounds.soundsEnabled = data.sounds;
                    Client.Sounds.musicEnabled = data.music;
                }
            };
            SoundsHelper.ALL_IN = 'all_in';
            SoundsHelper.GIVE_OUT_CARD = 'Card_deal_dealer_01';
            SoundsHelper.OPEN_TABLE_CARDS1 = 'Card_deal_flip_08';
            SoundsHelper.OPEN_TABLE_CARDS2 = 'Card_deal_flip_10';
            SoundsHelper.CHECK = 'check_01';
            SoundsHelper.BUTTON_CLICK = 'Digital Click Neutral 07_1';
            SoundsHelper.FLOP_DEAL = 'flop_deal_01';
            SoundsHelper.TURN_TIMER_TICK = 'Fold_TimerTick';
            SoundsHelper.SHUFFLE = 'shuffle_01';
            SoundsHelper.CHIP_STACK = 'ui_bet_chipstack_01';
            SoundsHelper.FOLD = 'ui_clear_whoosh_01';
            SoundsHelper.WIN = 'win_small';
            SoundsHelper.MY_BETTING = 'your_turn';
            SoundsHelper.MUSICS = [];
            SoundsHelper.SOUNDS = [SoundsHelper.ALL_IN, SoundsHelper.GIVE_OUT_CARD, SoundsHelper.OPEN_TABLE_CARDS1, SoundsHelper.OPEN_TABLE_CARDS2,
                SoundsHelper.CHECK, SoundsHelper.BUTTON_CLICK, SoundsHelper.FLOP_DEAL, SoundsHelper.TURN_TIMER_TICK,
                SoundsHelper.SHUFFLE, SoundsHelper.CHIP_STACK, SoundsHelper.FOLD, SoundsHelper.WIN, SoundsHelper.MY_BETTING];
            SoundsHelper.PRELOAD_SOUNDS = [];
            SoundsHelper.BACK_LOAD_SOUNDS = [SoundsHelper.ALL_IN, SoundsHelper.GIVE_OUT_CARD, SoundsHelper.OPEN_TABLE_CARDS1, SoundsHelper.OPEN_TABLE_CARDS2,
                SoundsHelper.CHECK, SoundsHelper.BUTTON_CLICK, SoundsHelper.FLOP_DEAL, SoundsHelper.TURN_TIMER_TICK,
                SoundsHelper.SHUFFLE, SoundsHelper.CHIP_STACK, SoundsHelper.FOLD, SoundsHelper.WIN, SoundsHelper.MY_BETTING];
            return SoundsHelper;
        }());
        Client.SoundsHelper = SoundsHelper;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MDLevels = (function () {
            function MDLevels() {
                this._levels = [];
            }
            MDLevels.prototype.setData = function (data) {
                if (!data)
                    return;
                if (data.func == 'balance' && data.data.levels != undefined) {
                    this._levels = [];
                    var arr = data.data.levels;
                    for (var i = 0; i < arr.length; i++)
                        this._levels.push({ level: arr[i].level, totalXp: arr[i].total_xp });
                    this._levels.sort(function (lvl1, lvl2) { return lvl1.level - lvl2.level; });
                }
            };
            MDLevels.prototype.getLevelByXp = function (xp) {
                for (var i = 0; i < this._levels.length; i++) {
                    if (xp < this._levels[i].totalXp)
                        return this._levels[i].level;
                }
                return 0;
            };
            MDLevels.prototype.getProgressByXp = function (xp) {
                var minXp = 0;
                for (var i = 0; i < this._levels.length; i++) {
                    if (xp < this._levels[i].totalXp)
                        return (xp - minXp) / (this._levels[i].totalXp - minXp);
                    else
                        minXp = this._levels[i].totalXp;
                }
                return 0;
            };
            return MDLevels;
        }());
        Client.MDLevels = MDLevels;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var HandRankCombination;
        (function (HandRankCombination) {
            HandRankCombination[HandRankCombination["HighCard"] = 1] = "HighCard";
            HandRankCombination[HandRankCombination["OnePair"] = 2] = "OnePair";
            HandRankCombination[HandRankCombination["TwoPair"] = 3] = "TwoPair";
            HandRankCombination[HandRankCombination["ThreeKind"] = 4] = "ThreeKind";
            HandRankCombination[HandRankCombination["Straight"] = 5] = "Straight";
            HandRankCombination[HandRankCombination["Flush"] = 6] = "Flush";
            HandRankCombination[HandRankCombination["FullHouse"] = 7] = "FullHouse";
            HandRankCombination[HandRankCombination["FourKind"] = 8] = "FourKind";
            HandRankCombination[HandRankCombination["StraightFlush"] = 9] = "StraightFlush";
            HandRankCombination[HandRankCombination["RoyalFlush"] = 10] = "RoyalFlush";
        })(HandRankCombination = Client.HandRankCombination || (Client.HandRankCombination = {}));
        var MHandRankingResult = (function () {
            function MHandRankingResult() {
            }
            MHandRankingResult.parse = function (data) {
                var result = new MHandRankingResult();
                result.update(data);
            };
            MHandRankingResult.prototype.update = function (data) {
                this.banks = new Array();
                for (var _i = 0, _a = data.data; _i < _a.length; _i++) {
                    var bank = _a[_i];
                    var b = { players: Array() };
                    for (var _b = 0, bank_1 = bank; _b < bank_1.length; _b++) {
                        var player = bank_1[_b];
                        b.players.push({
                            cards: Client.MCard.parseCards(player.cards),
                            kickers: Client.MCard.parseCards(player.kickers),
                            playerId: player.playerId,
                            comb: player.comb,
                            seatIdx: player.seatIdx,
                            stack: player.stack,
                            winSumm: player.winSumm
                        });
                    }
                    this.banks.push(b);
                }
            };
            return MHandRankingResult;
        }());
        Client.MHandRankingResult = MHandRankingResult;
        var MTable = (function () {
            function MTable() {
                this.users = new Client.MUsers();
                this.seats = [1, 2, 3, 4, 5];
                this.pots = [];
                this.cards = [];
                this.bettingTime = 30;
                this.handRankinkResult = new MHandRankingResult();
                this.inited = false;
            }
            Object.defineProperty(MTable.prototype, "fullPot", {
                get: function () {
                    var pots = this.pots[0] || 0, maxBet = this.users.maxBet || 0;
                    var betSum = 0;
                    for (var _i = 0, _a = this.users.getAll(false); _i < _a.length; _i++) {
                        var u = _a[_i];
                        betSum += u.bet;
                    }
                    Client.trace("[FULL POT] = pot(" + pots + ") + betSum(" + betSum + ") + maxBet (" + maxBet + ")");
                    return pots + betSum + maxBet;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MTable.prototype, "halfOfPot", {
                get: function () {
                    return this.fullPot / 2;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MTable.prototype, "betStep", {
                get: function () {
                    return this.bigBlind;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MTable.prototype, "minBetToRaise", {
                get: function () {
                    return Math.min((this.users.maxBet && this.users.maxBet * 2)
                        || this.bigBlind, this.maxBetToRaise);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MTable.prototype, "maxBetToRaise", {
                get: function () {
                    var me = this.users.me;
                    return Math.min(Client.Model.table.users.maxNotMyFullStack, me.stack + me.bet);
                },
                enumerable: true,
                configurable: true
            });
            MTable.prototype.setData = function (data) {
                if (!data)
                    return;
                var funcs = { Flop: MTable.STATE_FLOP, Turn: MTable.STATE_TURN, River: MTable.STATE_RIVER, Showdown: MTable.STATE_SHOWDOWN, HandRanking: MTable.STATE_HAND_RANKING };
                if (funcs[data.func])
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.BEFORE_CHANGE_STATE, { state: funcs[data.func] });
                if (data.func == 'AddPlayer') {
                    var userId = data.data.data.id;
                    if (userId == this.users.me.id)
                        this.setSeats(data.data.data.seatIdx);
                }
                this.users.setData(data);
                var i;
                var card;
                if (data.func == 'poker.findTable') {
                    this.id = data.data.id;
                }
                else if (data.func == 'Leave') {
                    this.clearGame();
                }
                else if (data.func == 'WaitPlayers') {
                    this.state = MTable.STATE_WAIT_PLAYERS;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                }
                else if (data.func == 'TableInfo') {
                    this.smallBet = data.data.smallBet;
                    this.smallBlind = data.data.smallBlind;
                    this.bigBet = data.data.bigBet;
                    this.bigBlind = data.data.bigBlind;
                    this.betType = data.data.betType;
                    this.dealer = this.users.getUserBySeat(data.data.dealerSeat);
                    this.state = data.data.gameState;
                    this.playerBetting = this.users.getUserBySeat(data.data.playerBetting);
                    this.bettingTime = data.data.speed;
                    Client.trace('this.users.me.seatId = ' + this.users.me.seatId);
                    this.setSeats(this.users.me.seatId);
                    this.cards = Client.MCard.parseCards(data.data.cards);
                    this.inited = true;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.INIT);
                }
                else if (data.func == 'StartGame') {
                    this.cards = [];
                    this.users.setAllActive();
                    this.pots = [];
                    this.state = MTable.STATE_START_GAME;
                    this.dealer = this.users.getUserBySeat(data.data.data.dealerSeat);
                    this.winSeatIds = [];
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                }
                else if (data.func == 'Deal') {
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.TABLE_DEAL);
                }
                else if (data.func == 'SmallBlind') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    this.smallBlind = data.data.data.bet;
                    this.state = MTable.STATE_SMALL_BLIND;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.BET_ACTION);
                }
                else if (data.func == 'BigBlind') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    this.bigBlind = data.data.data.bet;
                    this.state = MTable.STATE_BIG_BLIND;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.BET_ACTION);
                }
                else if (data.func == 'Preflop') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    this.state = MTable.STATE_PREFLOP;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                }
                else if (data.func == 'Flop') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    this.pots = data.data.data.pots;
                    this.cards = Client.MCard.parseCards(data.data.data.cards);
                    this.state = MTable.STATE_FLOP;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                    this.gotoWaitBet();
                }
                else if (data.func == 'Turn' || data.func == 'River') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    this.pots = data.data.data.pots;
                    this.cards.push(Client.MCard.parseCard(data.data.data.card));
                    this.state = data.func == 'Turn' ? MTable.STATE_TURN : MTable.STATE_RIVER;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                    this.gotoWaitBet();
                }
                else if (data.func == 'WaitBet') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    this.state = MTable.STATE_WAIT_BET;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                }
                else if (data.func == 'Bet') {
                    this.playerBetting = this.users.getUserBySeat(data.data.data.playerBetting);
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.BET_ACTION);
                }
                else if (data.func == 'Showdown') {
                    this.pots = data.data.data.pots;
                    this.state = MTable.STATE_SHOWDOWN;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                }
                else if (data.func == 'AllInShowdown') {
                    this.pots = data.data.data.pots;
                    this.playerBetting = null;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.ALL_IN_SHOWDOWN);
                }
                else if (data.func == 'HandRanking') {
                    this.state = MTable.STATE_HAND_RANKING;
                    this.handRankinkResult.update(data.data);
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
                }
            };
            MTable.prototype.setSeats = function (mySeatId) {
                this.seats = [];
                var index;
                for (var i = 0; i < MTable.MAX_PLAYERS; i++) {
                    index = mySeatId + i;
                    if (index > MTable.MAX_PLAYERS)
                        index -= MTable.MAX_PLAYERS;
                    this.seats.push(index);
                }
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.SET_SEATS);
            };
            Object.defineProperty(MTable.prototype, "potsSum", {
                get: function () {
                    var sum = 0;
                    for (var i = 0; i < this.pots.length; i++) {
                        sum += this.pots[i];
                    }
                    return sum;
                },
                enumerable: true,
                configurable: true
            });
            MTable.prototype.gotoWaitBet = function () {
                this.state = MTable.STATE_WAIT_BET;
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CHANGE_STATE);
            };
            MTable.prototype.clearGame = function () {
                this.users.clearGame();
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLE, Client.ModelEvent.CLEAR);
            };
            MTable.STATE_WAIT_PLAYERS = 0;
            MTable.STATE_START_GAME = 1;
            MTable.STATE_SMALL_BLIND = 2;
            MTable.STATE_BIG_BLIND = 3;
            MTable.STATE_WAIT_BET = 4;
            MTable.STATE_PREFLOP = 5;
            MTable.STATE_FLOP = 6;
            MTable.STATE_TURN = 7;
            MTable.STATE_RIVER = 8;
            MTable.STATE_SHOWDOWN = 9;
            MTable.STATE_HAND_RANKING = 10;
            MTable.MAX_PLAYERS = 5;
            return MTable;
        }());
        Client.MTable = MTable;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StakesType;
        (function (StakesType) {
            StakesType[StakesType["STAKES"] = 1] = "STAKES";
            StakesType[StakesType["BUY_IN"] = 2] = "BUY_IN";
        })(StakesType = Client.StakesType || (Client.StakesType = {}));
        var MDTablesConfig = (function () {
            function MDTablesConfig() {
                this._tables = [];
            }
            MDTablesConfig.prototype.setData = function (data) {
                var _this = this;
                if (!data || !data.data || !data.data.tableConfig)
                    return;
                Client.trace('TABLES CONFIG LOADED');
                data.data.tableConfig.forEach(function (table) {
                    var id = table.table_id, bigBlind = table.big_blind, smallBlind = table.big_blind / 2, minBuyIn = table.min_buyin, maxBuyIn = table.max_buyin;
                    _this._tables[id] = {
                        id: id,
                        bigBlind: bigBlind,
                        smallBlind: smallBlind,
                        minBuyIn: minBuyIn,
                        maxBuyIn: maxBuyIn,
                        name: MDTablesConfig.TABLES_INFO[id].name,
                        type: MDTablesConfig.TABLES_INFO[id].type,
                        stakesType: MDTablesConfig.TABLES_INFO[id].stakesType,
                        avatarId: MDTablesConfig.TABLES_INFO[id].avatarId,
                    };
                });
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_TABLES_CONFIG, Client.ModelEvent.UPDATE);
            };
            MDTablesConfig.prototype.getTable = function (level) {
                return this._tables[level];
            };
            MDTablesConfig.prototype.getTables = function () {
                return this._tables;
            };
            MDTablesConfig.prototype.calculateBuyIn = function (level, money) {
                var bankroll = money || 0;
                var tableConfig = this._tables[level];
                if (!tableConfig)
                    Client.trace('[table config is not exists]');
                var buyIn = Math.max(Math.min(bankroll, tableConfig.maxBuyIn), tableConfig.minBuyIn);
                if (buyIn < 1000)
                    return buyIn;
                else {
                    return buyIn - buyIn % 1000;
                }
            };
            MDTablesConfig.TABLES_INFO = {
                1: {
                    name: 'BASIC',
                    type: 'CASH TABLES',
                    stakesType: StakesType.STAKES,
                    avatarId: 3,
                },
                2: {
                    id: 2,
                    name: 'STANDARD',
                    type: 'CASH TABLES',
                    stakesType: StakesType.STAKES,
                    avatarId: 1,
                },
                3: {
                    id: 3,
                    name: 'PRO',
                    type: 'CASH TABLES',
                    stakesType: StakesType.STAKES,
                    avatarId: 2,
                },
            };
            return MDTablesConfig;
        }());
        Client.MDTablesConfig = MDTablesConfig;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MView = (function () {
            function MView() {
                this.screenDefaultWidth = 1920;
                this.screenDefaultHeight = 1080;
                this.screenDefaultSafeWidth = 1700;
                this.screenDefaultSafeHeight = 1080;
                this.screenWidth = 100;
                this.screenHeight = 100;
                this.gameFullX = 0;
                this.gameFullY = 0;
                this.gameFullWidth = 100;
                this.gameFullHeight = 100;
                this.gameRealWidth = 100;
                this.gameRealHeight = 100;
                this.gameRealX = 0;
                this.gameRealY = 0;
                this.gameSafeWidth = 100;
                this.gameSafeHeight = 100;
                this.gameSafeX = 0;
                this.gameSafeY = 0;
                this.scale = 1;
                this.devicePixelRatio = 1;
                this.fullscreen = false;
            }
            MView.prototype.setScreenSize = function (width, height) {
                this.screenWidth = width;
                this.screenHeight = height;
                var newGameWidth;
                var newGameHeight;
                var newGameX;
                var newGameY;
                if (this.screenDefaultHeight / this.screenDefaultWidth > this.screenHeight / this.screenWidth) {
                    if (this.screenDefaultSafeHeight / this.screenDefaultWidth > this.screenHeight / this.screenWidth) {
                        this.gameFullHeight = this.screenHeight * this.screenDefaultHeight / this.screenDefaultSafeHeight;
                        this.gameFullWidth = this.gameFullHeight * this.screenDefaultWidth / this.screenDefaultHeight;
                    }
                    else {
                        this.gameFullWidth = this.screenWidth;
                        this.gameFullHeight = this.gameFullWidth * this.screenDefaultHeight / this.screenDefaultWidth;
                    }
                }
                else {
                    if (this.screenDefaultHeight / this.screenDefaultSafeWidth > this.screenHeight / this.screenWidth) {
                        this.gameFullHeight = this.screenHeight;
                        this.gameFullWidth = this.gameFullHeight * this.screenDefaultWidth / this.screenDefaultHeight;
                    }
                    else {
                        this.gameFullWidth = this.screenWidth * this.screenDefaultWidth / this.screenDefaultSafeWidth;
                        this.gameFullHeight = this.gameFullWidth * this.screenDefaultHeight / this.screenDefaultWidth;
                    }
                }
                this.gameFullX = (this.screenWidth - this.gameFullWidth) / 2;
                this.gameFullY = (this.screenHeight - this.gameFullHeight) / 2;
                this.gameSafeWidth = this.screenDefaultSafeWidth / this.screenDefaultWidth * this.gameFullWidth;
                this.gameSafeHeight = this.screenDefaultSafeHeight / this.screenDefaultHeight * this.gameFullHeight;
                this.gameSafeX = this.gameFullX + (this.gameFullWidth - this.gameSafeWidth) / 2;
                this.gameSafeY = this.gameFullY + (this.gameFullHeight - this.gameSafeHeight) / 2;
                this.gameRealWidth = Math.min(this.gameFullWidth, this.screenWidth);
                this.gameRealHeight = Math.min(this.gameFullHeight, this.screenHeight);
                this.gameRealX = this.gameFullX < 0 ? 0 : this.gameFullX;
                this.gameRealY = this.gameFullY < 0 ? 0 : this.gameFullY;
                this.scale = this.gameSafeWidth / this.screenDefaultSafeWidth;
            };
            MView.prototype.toggleFullScreen = function () {
                var canv = document.getElementById('canv');
                var doc = document;
                if (!Client.Model.view.fullscreen) {
                    if (canv.requestFullscreen)
                        canv.requestFullscreen();
                    else if (canv.mozRequestFullScreen)
                        canv.mozRequestFullScreen();
                    else if (canv.webkitRequestFullscreen)
                        canv.webkitRequestFullscreen();
                    else if (canv.msRequestFullscreen)
                        canv.msRequestFullscreen();
                }
                else {
                    if (doc.cancelFullScreen)
                        doc.cancelFullScreen();
                    else if (doc.mozCancelFullScreen)
                        doc.mozCancelFullScreen();
                    else if (doc.webkitCancelFullScreen)
                        doc.webkitCancelFullScreen();
                    else if (doc.msCancelFullScreen)
                        doc.msCancelFullScreen();
                }
                this.fullscreen = !this.fullscreen;
            };
            MView.prototype.setData = function (data) {
            };
            return MView;
        }());
        Client.MView = MView;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MBet = (function () {
            function MBet() {
            }
            MBet.getTypeByAction = function (betAction) {
                if (betAction == MBet.ACTION_NONE || betAction == MBet.ACTION_SMALL_BLIND || betAction == MBet.ACTION_BET)
                    return MBet.TYPE_BET_GREEN;
                else if (betAction == MBet.ACTION_BIG_BLIND)
                    return MBet.TYPE_BET_ORANGE;
                else if (betAction == MBet.ACTION_FOLD)
                    return MBet.TYPE_FOLD;
                else if (betAction == MBet.ACTION_CHECK)
                    return MBet.TYPE_CHECK;
                else if (betAction == MBet.ACTION_CALL)
                    return MBet.TYPE_CALL;
                else if (betAction == MBet.ACTION_RAISE || betAction == MBet.ACTION_All_IN)
                    return MBet.TYPE_RAISE;
            };
            MBet.ACTION_NONE = 0;
            MBet.ACTION_SMALL_BLIND = 1;
            MBet.ACTION_BIG_BLIND = 2;
            MBet.ACTION_FOLD = 3;
            MBet.ACTION_CHECK = 4;
            MBet.ACTION_BET = 5;
            MBet.ACTION_CALL = 6;
            MBet.ACTION_RAISE = 7;
            MBet.ACTION_All_IN = 8;
            MBet.TYPE_CHIP = 'bet_chip';
            MBet.TYPE_BET_GREEN = 'bet_b_green';
            MBet.TYPE_BET_ORANGE = 'bet_b_orange';
            MBet.TYPE_CALL = 'bet_call';
            MBet.TYPE_FOLD = 'bet_fold';
            MBet.TYPE_CHECK = 'bet_check';
            MBet.TYPE_RAISE = 'bet_raise';
            return MBet;
        }());
        Client.MBet = MBet;
        var MUser = (function () {
            function MUser() {
                this.stack = 0;
                this.dealer = false;
                this.seatId = 0;
                this.state = 0;
                this.betAction = 0;
                this.bet = 0;
                this.winPot1 = 0;
                this.winPot2 = 0;
                this.isMe = false;
                this.folded = false;
            }
            MUser.prototype.setData = function (data) {
                this.id = data.id || data.userId || this.id;
                this.name = data.display_name || data.name || data.login || data.username || this.name;
                this.photo = data.photo || this.photo;
                this.stack = data.stack != undefined ? data.stack : this.stack;
                this.seatId = data.seatIdx || this.seatId;
                this.betAction = data.betAction != undefined ? data.betAction : this.betAction;
                this.state = data.state != undefined ? data.state : this.state;
                this.updateFolded();
                if (data.cards)
                    this.setCards(data.cards);
            };
            MUser.prototype.setCards = function (array) {
                var arr = Client.MCard.parseCards(array);
                if (arr.length >= 2) {
                    this.card1 = arr[0];
                    this.card2 = arr[1];
                }
            };
            MUser.prototype.updateFolded = function () {
                this.folded = this.betAction == MBet.ACTION_FOLD;
            };
            MUser.prototype.clearCards = function () {
                this.card1 = this.card2 = null;
            };
            MUser.prototype.setWinPot1 = function (amount) {
                this.winPot1 = amount;
            };
            MUser.prototype.setWinPot2 = function (amount) {
                this.winPot2 = amount;
            };
            MUser.prototype.updateStackByWin = function (stack) {
                if (stack < this.stack)
                    return;
                this.stack = stack;
            };
            Object.defineProperty(MUser.prototype, "winner", {
                get: function () {
                    return this.winPot1 > 0 || this.winPot2 > 0;
                },
                enumerable: true,
                configurable: true
            });
            MUser.prototype.getJSON = function () {
                return { id: this.id, platformId: this.platformId, name: this.name, photo: this.photo, money: this.stack };
            };
            MUser.STATE_WAIT = 0;
            MUser.STATE_PLAING = 1;
            MUser.STATE_GET_UP = 2;
            MUser.STATE_DISCONNECT = 3;
            MUser.STATE_NOT_RESPONCE = 4;
            return MUser;
        }());
        Client.MUser = MUser;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MMyUser = (function (_super) {
            __extends(MMyUser, _super);
            function MMyUser() {
                var _this = _super.call(this) || this;
                _this.timeHourlyDrip = MMyUser.DEFAULT_TIME_HOURLY_DRIP;
                _this.earned = 0;
                _this.level = 1;
                _this.xp = 0;
                _this.progressForNextLevel = 0;
                _this.seatInGame = false;
                _this.isMe = true;
                return _this;
            }
            MMyUser.prototype.setData = function (data) {
                _super.prototype.setData.call(this, data);
                this.balance = data.bankroll != undefined ? data.bankroll : this.balance;
            };
            MMyUser.prototype.updateBalance = function (data) {
                var nextBalance = undefined;
                if (data.bankroll != undefined)
                    nextBalance = data.bankroll;
                else if (data.chips != undefined)
                    nextBalance = data.chips;
                if (nextBalance != undefined) {
                    var earned = nextBalance - this.balance;
                    this.earned = Number.isNaN(earned) ? 0 : earned;
                }
                this.balance = nextBalance == undefined ? this.balance : nextBalance;
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME, Client.ModelEvent.UPDATE);
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME_MONEY, Client.ModelEvent.UPDATE);
                if (data.isHourlyDrip) {
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME_HOURLY_DRIP, Client.ModelEvent.UPDATE);
                }
                if (data.isRewardedVideo) {
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME_REWARDED, Client.ModelEvent.UPDATE);
                }
            };
            MMyUser.prototype.updateAvailabilities = function (data) {
                if (data.availableHourlyDrip !== undefined)
                    this.availableHourlyDrip = data.availableHourlyDrip;
                if (data.timeHourlyDrip !== undefined)
                    this.timeHourlyDrip = data.timeHourlyDrip;
                if (data.availableRewardedVideo !== undefined)
                    this.availableRewardedVideo = data.availableRewardedVideo;
                if (data.availableRewardVideo !== undefined)
                    this.timeRewardedVideo = data.timeRewardVideo;
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME, Client.ModelEvent.UPDATE);
            };
            MMyUser.prototype.updateLevel = function (data) {
                if (data.xp !== undefined) {
                    this.xp = data.xp;
                    this.level = Client.Model.levels.getLevelByXp(this.xp);
                    this.progressForNextLevel = Client.Model.levels.getProgressByXp(this.xp);
                }
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME, Client.ModelEvent.UPDATE);
            };
            MMyUser.prototype.login = function (data) {
                _super.prototype.setData.call(this, data);
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME, Client.ModelEvent.UPDATE);
            };
            MMyUser.prototype.hourlyDripDecrement = function () {
                if (this.timeHourlyDrip <= 0) {
                    this.timeHourlyDrip = 0;
                    return;
                }
                this.timeHourlyDrip--;
                this.availableHourlyDrip = (this.timeHourlyDrip === 0);
                Client.ModelEvents.emit(Client.ModelEvent.MODEL_ME, Client.ModelEvent.UPDATE);
            };
            MMyUser.prototype.getJSON = function () {
                return _super.prototype.getJSON.call(this);
            };
            MMyUser.DEFAULT_TIME_HOURLY_DRIP = 5 * 60;
            return MMyUser;
        }(Client.MUser));
        Client.MMyUser = MMyUser;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MUsers = (function () {
            function MUsers() {
                this._me = new Client.MMyUser();
                this._users = [];
            }
            Object.defineProperty(MUsers.prototype, "me", {
                get: function () {
                    return this._me;
                },
                enumerable: true,
                configurable: true
            });
            MUsers.prototype.initMe = function (service) {
                this._me.platformId = service.userId;
                this._me.name = service.username;
                this._me.photo = service.userPhotoUrl;
            };
            Object.defineProperty(MUsers.prototype, "maxBet", {
                get: function () {
                    var max = 0;
                    for (var i = 0; i < this._users.length; i++) {
                        if (this._users[i].bet > max)
                            max = this._users[i].bet;
                    }
                    return max;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MUsers.prototype, "maxNotMyFullStack", {
                get: function () {
                    var max = 0;
                    for (var _i = 0, _a = this._users; _i < _a.length; _i++) {
                        var user = _a[_i];
                        if (!user.isMe) {
                            max = Math.max(max, user.stack + user.bet);
                        }
                    }
                    return max;
                },
                enumerable: true,
                configurable: true
            });
            MUsers.prototype.setData = function (data) {
                var user;
                var i;
                var arr;
                if (data.func == 'login') {
                    this._me.login(data.data);
                }
                else if (data.func == 'balance') {
                    this._me.updateBalance(data.data);
                    this._me.updateAvailabilities(data.data);
                    this._me.updateLevel(data.data);
                }
                else if (data.func == 'UpdateBalance') {
                    this._me.updateBalance(data.data);
                }
                else if (data.func == 'UpdateXp') {
                    this._me.updateLevel(data.data);
                }
                else if (data.func == 'users_info') {
                    arr = data.data.users;
                    for (i = 0; i < arr.length; i++) {
                        user = this.getUserById(arr[i].id);
                        if (user) {
                            user.photo = arr[i].avatar_url || user.photo;
                            user.name = arr[i].display_name || user.name;
                            Client.ModelEvents.emit(Client.ModelEvent.MODEL_USERS, Client.ModelEvent.UPDATE, { user_id: user.id });
                        }
                    }
                }
                else if (data.func == 'TableInfo') {
                    this._users = [];
                    for (i = 0; i < data.data.players.length; i++) {
                        user = data.data.players[i].id == this._me.id ? this._me : new Client.MUser();
                        user.setData(data.data.players[i]);
                        this._users.push(user);
                    }
                    this._me.seatInGame = this._users.indexOf(this._me) != -1;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_USERS, Client.ModelEvent.INIT);
                }
                else if (data.func == 'Deal') {
                    for (i = 0; i < this._users.length; i++)
                        this._users[i].winPot1 = this._users[i].winPot2 = 0;
                    this._me.setCards(data.data.data.cards);
                }
                else if (data.func == 'AddPlayer') {
                    user = data.data.data.id == this._me.id ? this._me : new Client.MUser();
                    user.setData(data.data.data);
                    this._users.push(user);
                    this._me.seatInGame = this._users.indexOf(this._me) != -1;
                    Client.ModelEvents.emit(Client.ModelEvent.MODEL_USERS, Client.ModelEvent.ADD, { user_id: user.id });
                }
                else if (data.func == 'ErasePlayer') {
                    var user_1 = this.getUserById(data.data.data.id);
                    if (user_1) {
                        var index = this._users.indexOf(user_1);
                        if (index != -1)
                            this._users.splice(index, 1);
                        this._me.seatInGame = this._users.indexOf(this._me) != -1;
                        Client.ModelEvents.emit(Client.ModelEvent.MODEL_USERS, Client.ModelEvent.DELETE, { user_id: user_1.id });
                    }
                }
                else if (data.func == 'SmallBlind' || data.func == 'BigBlind' || data.func == 'Bet') {
                    user = this.getUserBySeat(data.data.data.playerBetting);
                    if (user) {
                        user.stack = data.data.data.stack;
                        user.bet = data.data.data.bet;
                        if (data.func == 'Bet') {
                            user.betAction = data.data.data.betAction;
                            user.updateFolded();
                        }
                        else if (data.func == 'SmallBlind')
                            user.betAction = Client.MBet.ACTION_SMALL_BLIND;
                        else if (data.func == 'BigBlind')
                            user.betAction = Client.MBet.ACTION_BIG_BLIND;
                        Client.ModelEvents.emit(Client.ModelEvent.MODEL_USERS, Client.ModelEvent.UPDATE, { user_id: user.id });
                    }
                }
                else if (data.func == 'StartGame' || data.func == 'Flop' || data.func == 'Turn' || data.func == 'River') {
                    this.clearBets();
                }
                else if (data.func == 'Showdown' || data.func == 'AllInShowdown') {
                    if (data.func == 'Showdown')
                        this.clearBets();
                    var arr_1 = data.data.data.cards;
                    for (i = 0; i < arr_1.length; i++) {
                        user = this.getUserBySeat(arr_1[i].seatIdx);
                        if (user)
                            user.setCards(arr_1[i].cards);
                    }
                }
                else if (data.func == 'HandRanking') {
                    this.clearBets();
                    var arr_2 = data.data.data;
                    var potArr1 = arr_2[0];
                    var potArr2 = arr_2.length > 1 ? arr_2[1] : [];
                    for (i = 0; i < potArr1.length; i++) {
                        user = this.getUserBySeat(potArr1[i].seatIdx);
                        if (user) {
                            user.setWinPot1(potArr1[i].winSumm);
                            user.updateStackByWin(potArr1[i].stack);
                        }
                    }
                    for (i = 0; i < potArr2.length; i++) {
                        user = this.getUserBySeat(potArr2[i].seatIdx);
                        if (user) {
                            user.setWinPot2(potArr1[i].winSumm);
                            user.updateStackByWin(potArr2[i].stack);
                        }
                    }
                }
            };
            MUsers.prototype.clearBets = function () {
                for (var i = 0; i < this._users.length; i++) {
                    this._users[i].bet = 0;
                    this._users[i].betAction = Client.MBet.ACTION_NONE;
                }
            };
            MUsers.prototype.getAll = function (withMe) {
                return withMe ? this._users : this._users.filter(function (user) { return !user.isMe; });
            };
            MUsers.prototype.getWinners = function () {
                return this._users.filter(function (user) { return user.winner; });
            };
            MUsers.prototype.setAllActive = function () {
                for (var i = 0; i < this._users.length; i++) {
                    this._users[i].folded = false;
                    if (this._users[i].state == Client.MUser.STATE_WAIT)
                        this._users[i].state = Client.MUser.STATE_PLAING;
                }
            };
            MUsers.prototype.getUserById = function (id) {
                if (this._me.id == id)
                    return this._me;
                for (var i = 0; i < this._users.length; i++)
                    if (this._users[i].id == id)
                        return this._users[i];
                return null;
            };
            MUsers.prototype.getUserBySeat = function (seatId) {
                if (this._me.seatId == seatId)
                    return this._me;
                for (var i = 0; i < this._users.length; i++)
                    if (this._users[i].seatId == seatId)
                        return this._users[i];
                return null;
            };
            MUsers.prototype.getOccupiedSeats = function () {
                return this._users.map(function (u) { return u.seatId; });
            };
            MUsers.prototype.clearGame = function () {
                this._me.clearCards();
                this._users = [];
            };
            MUsers.prototype.generateRandomUsers = function () {
                var user;
                for (var i = 0; i < 10; i++) {
                    user = new Client.MUser();
                    user.id = i.toString();
                    user.name = 'Test' + i;
                    user.photo = 'assets/sprites/avatars/avatar' + i + '.jpg';
                    this._users.push(user);
                }
            };
            MUsers.prototype.getRandomUser = function () {
                if (this._users.length == 0)
                    return null;
                return this._users[Client.MathHelper.getRandomMinToMax(0, this._users.length - 1)];
            };
            return MUsers;
        }());
        Client.MUsers = MUsers;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MDLocale = (function () {
            function MDLocale() {
                this._words = ['common_type', 'common_close', 'common_save', 'common_add', 'common_cancel', 'common_done', 'common_show', 'common_yes', 'common_no', 'common_team',
                    'common_players'];
                this._textsHash = {};
                this._json = {};
                this._isJson = false;
            }
            MDLocale.prototype.getWordsIds = function () {
                var arr = this._words.concat();
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = 'fp_' + arr[i];
                }
                return arr;
            };
            MDLocale.prototype.parse = function (langData, langEnData) {
                if (langEnData) {
                    this._textsHash = this.doParse(langEnData, this._textsHash);
                }
                this._textsHash = this.doParse(langData, this._textsHash);
            };
            MDLocale.prototype.doParse = function (data, obj) {
                var lineArr;
                var arr = data.split('\n');
                for (var i = 0; i < arr.length; i++) {
                    if (!arr[i] || arr[i].indexOf('=') == -1)
                        continue;
                    lineArr = arr[i].split('=');
                    lineArr[0] = lineArr[0].trim();
                    lineArr[1] = lineArr[1].trim();
                    obj[lineArr[0]] = lineArr[1];
                }
                return obj;
            };
            MDLocale.prototype.setData = function (data) {
                if (!data)
                    return;
                if (data.func == 'locale') {
                    var obj = data.data;
                    for (var key in obj)
                        this._textsHash[key] = obj[key];
                    this.checkAllKeys();
                }
            };
            MDLocale.prototype.getString = function (key) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var result = undefined;
                console.log("Get sctring:" + key);
                if (this._isJson) {
                    var locale_1 = this._json[Client.Config.locale];
                    if (locale_1 == null) {
                        locale_1 = this._json["en_US"];
                        console.warn("Can't found locale:" + Client.Config.locale + "\n Was used en_US");
                    }
                    result = locale_1[key] ? (locale_1[key]) : (this._json["en_US"][key]);
                }
                else {
                    result = this._textsHash[key];
                }
                if (result) {
                    while (result.search('%') != -1)
                        result = result.replace('%', '\n');
                    for (var i = 0; i < args.length; i++)
                        result = result.replace("#" + i.toString(), args[i]);
                    return result;
                }
                return "";
            };
            MDLocale.prototype.checkAllKeys = function () {
                var keys = this.getWordsIds();
                for (var i = 0; i < keys.length; i++) {
                    if (!this._textsHash[keys[i]] || this._textsHash[keys[i]] == keys[i])
                        console.log('locale:: ' + keys[i] + ' is local!');
                }
            };
            MDLocale.prototype.setJson = function (data) {
                this._isJson = true;
                this._json = data;
            };
            return MDLocale;
        }());
        Client.MDLocale = MDLocale;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Model = (function () {
            function Model() {
            }
            Object.defineProperty(Model, "locale", {
                get: function () { return Model._locale; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Model, "levels", {
                get: function () { return Model._levels; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Model, "view", {
                get: function () { return Model._view; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Model, "table", {
                get: function () { return Model._table; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Model, "tables", {
                get: function () { return Model._tablesConfig; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Model, "availableTables", {
                get: function () { return Model._availableTables; },
                enumerable: true,
                configurable: true
            });
            ;
            Object.defineProperty(Model, "me", {
                get: function () { return this._table.users.me; },
                enumerable: true,
                configurable: true
            });
            Model.initMe = function (service) {
                Model._table.users.initMe(service);
            };
            Model.setData = function (data) {
                Model._levels.setData(data);
                Model._tablesConfig.setData(data);
                Model._table.setData(data);
                Model._locale.setData(data);
                Model._view.setData(data);
            };
            Model._locale = new Client.MDLocale();
            Model._levels = new Client.MDLevels();
            Model._view = new Client.MView();
            Model._table = new Client.MTable();
            Model._tablesConfig = new Client.MDTablesConfig();
            Model._availableTables = [];
            return Model;
        }());
        Client.Model = Model;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ModelEvent = (function () {
            function ModelEvent(model, type, data) {
                if (data === void 0) { data = null; }
                this.model = model;
                this.type = type;
                this.data = data;
            }
            ModelEvent.MODEL_TABLE = 'MODEL_TABLE';
            ModelEvent.MODEL_ME = 'MODEL_ME';
            ModelEvent.MODEL_ME_MONEY = 'MODEL_ME_MONEY';
            ModelEvent.MODEL_ME_HOURLY_DRIP = 'MODEL_ME_HOURLY_DRIP';
            ModelEvent.MODEL_ME_REWARDED = 'MODEL_ME_REWARDED';
            ModelEvent.MODEL_USERS = 'MODEL_USERS';
            ModelEvent.MODEL_TABLES_CONFIG = 'MODEL_TABLES_CONFIG';
            ModelEvent.INIT = 1;
            ModelEvent.UPDATE = 2;
            ModelEvent.ADD = 3;
            ModelEvent.DELETE = 4;
            ModelEvent.CLEAR = 5;
            ModelEvent.START_ROUND = 6;
            ModelEvent.UPDATE_TABLE_CARDS = 7;
            ModelEvent.TABLE_DEAL = 8;
            ModelEvent.SET_SEATS = 9;
            ModelEvent.BET_ACTION = 10;
            ModelEvent.CHANGE_STATE = 11;
            ModelEvent.BEFORE_CHANGE_STATE = 12;
            ModelEvent.ALL_IN_SHOWDOWN = 13;
            return ModelEvent;
        }());
        Client.ModelEvent = ModelEvent;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ModelEvents = (function (_super) {
            __extends(ModelEvents, _super);
            function ModelEvents() {
                var _this = _super.call(this) || this;
                if (ModelEvents._instance)
                    throw new Error('ModelEvents is singleton');
                return _this;
            }
            ModelEvents.emit = function (model, type, data) {
                if (data === void 0) { data = null; }
                ModelEvents._instance.emit(model, new Client.ModelEvent(model, type, data));
            };
            ModelEvents.on = function (model, listener, context) {
                if (context === void 0) { context = null; }
                ModelEvents._instance.on(model, listener, context);
            };
            ModelEvents.off = function (model, listener, context) {
                if (context === void 0) { context = null; }
                ModelEvents._instance.off(model, listener, context);
            };
            ModelEvents._instance = new ModelEvents();
            return ModelEvents;
        }(PIXI.utils.EventEmitter));
        Client.ModelEvents = ModelEvents;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MCard = (function () {
            function MCard() {
                this.setRandom();
            }
            MCard.parseCards = function (array) {
                if (!array)
                    return [];
                var cards = [];
                for (var i = 0; i < array.length; i++)
                    cards.push(MCard.parseCard(array[i]));
                return cards;
            };
            MCard.parseCard = function (data) {
                var card = new MCard();
                card.weight = data.charAt(0).toLowerCase();
                card.suit = data.charAt(1).toLowerCase();
                return card;
            };
            MCard.prototype.setData = function (data) {
                if (!data)
                    return;
            };
            MCard.prototype.setRandom = function () {
                var index = Client.MathHelper.getRandomMinToMax(9, MCard.WEIGHTS.length - 1);
                this._weight = MCard.WEIGHTS[index];
                index = Client.MathHelper.getRandomMinToMax(0, MCard.SUITS.length - 1);
                this._suit = MCard.SUITS[index];
            };
            Object.defineProperty(MCard.prototype, "weight", {
                get: function () {
                    return this._weight;
                },
                set: function (value) {
                    this._weight = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MCard.prototype, "suit", {
                get: function () {
                    return this._suit;
                },
                set: function (value) {
                    this._suit = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MCard.prototype, "weightIndex", {
                get: function () {
                    return MCard.WEIGHTS.indexOf(this._weight);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MCard.prototype, "suitIndex", {
                get: function () {
                    return MCard.SUITS.indexOf(this._suit);
                },
                enumerable: true,
                configurable: true
            });
            MCard.prototype.equals = function (card) {
                if (!card)
                    return false;
                return this._weight == card._weight && this._suit == card._suit;
            };
            Object.defineProperty(MCard.prototype, "isHighlighted", {
                get: function () {
                    return this._isHighlighted;
                },
                set: function (value) {
                    this._isHighlighted = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MCard.prototype, "imageName", {
                get: function () {
                    if (this._weight == 'j' || this._weight == 'q' || this._weight == 'k')
                        return 'card_image_' + this._weight + this._suit;
                    else
                        return 'card_' + this._suit;
                },
                enumerable: true,
                configurable: true
            });
            MCard.prototype.getJSON = function () {
                return { w: this.weight, s: this.suit };
            };
            MCard.prototype.toString = function () {
                return this.weight.toUpperCase() + this.suit.toLowerCase();
            };
            MCard.WEIGHTS = ['2', '3', '4', '5', '6', '7', '8', '9', 't', 'j', 'q', 'k', 'a'];
            MCard.SUITS = ['d', 'c', 's', 'h'];
            return MCard;
        }());
        Client.MCard = MCard;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var OppCodes;
        (function (OppCodes) {
            OppCodes[OppCodes["AddPlayer"] = 1] = "AddPlayer";
            OppCodes[OppCodes["ErasePlayer"] = 2] = "ErasePlayer";
            OppCodes[OppCodes["Leave"] = 9] = "Leave";
            OppCodes[OppCodes["StartGame"] = 100] = "StartGame";
            OppCodes[OppCodes["Deal"] = 101] = "Deal";
            OppCodes[OppCodes["SmallBlind"] = 102] = "SmallBlind";
            OppCodes[OppCodes["BigBlind"] = 103] = "BigBlind";
            OppCodes[OppCodes["WaitBet"] = 104] = "WaitBet";
            OppCodes[OppCodes["Bet"] = 105] = "Bet";
            OppCodes[OppCodes["Preflop"] = 106] = "Preflop";
            OppCodes[OppCodes["Flop"] = 107] = "Flop";
            OppCodes[OppCodes["Turn"] = 108] = "Turn";
            OppCodes[OppCodes["River"] = 109] = "River";
            OppCodes[OppCodes["Showdown"] = 110] = "Showdown";
            OppCodes[OppCodes["HandRanking"] = 111] = "HandRanking";
            OppCodes[OppCodes["WaitPlayers"] = 112] = "WaitPlayers";
            OppCodes[OppCodes["AllInShowdown"] = 113] = "AllInShowdown";
        })(OppCodes = Client.OppCodes || (Client.OppCodes = {}));
        var NakamaHardCode = (function () {
            function NakamaHardCode() {
            }
            NakamaHardCode.prototype.beforeSend = function (data) {
                var message;
                if (data.func == Client.CommandUser.COMMAND_FIND_TABLE) {
                    message = { rpc: { id: Client.CommandUser.COMMAND_FIND_TABLE, payload: JSON.stringify({ level: data.data.level }) } };
                }
                else if (data.func == Client.CommandUser.COMMAND_GET_HOURLY_DRIP) {
                    message = { rpc: { id: 'getHourlyDrip', payload: JSON.stringify(undefined) } };
                }
                else if (data.func == Client.CommandUser.COMMAND_GET_REWARDED_VIDEO) {
                    message = { rpc: { id: 'getRewardVideo', payload: JSON.stringify(undefined) } };
                }
                else if (data.func == Client.CommandUser.COMMAND_STAND_UP) {
                    message = { match_data_send: { match_id: data.data.id, op_code: 6, data: {} } };
                }
                else if (data.func == Client.CommandUser.COMMAND_SEAT) {
                    message = { match_data_send: { match_id: data.data.id, op_code: 8, data: { seatIdx: data.data.seatIdx } } };
                }
                else if (data.func == Client.CommandUser.COMMAND_JOIN_TABLE) {
                    message = { match_join: { match_id: data.data.id } };
                }
                else if (data.func == Client.CommandUser.COMMAND_LEAVE_TABLE) {
                    message = { match_data_send: { match_id: data.data.id, op_code: 9, data: {} } };
                }
                else if (data.func == Client.CommandUser.COMMAND_SET_BALANCE) {
                    message = { rpc: { id: 'setChips', payload: JSON.stringify({ chips: data.data.amount }) } };
                }
                else if (data.func == Client.CommandAction.COMMAND_FOLD || data.func == Client.CommandAction.COMMAND_CHECK || data.func == Client.CommandAction.COMMAND_CALL ||
                    data.func == Client.CommandAction.COMMAND_BET || data.func == Client.CommandAction.COMMAND_RAISE || data.func == Client.CommandAction.COMMAND_ALL_IN) {
                    message = { match_data_send: { match_id: data.data.table_id, op_code: 105, data: { action: data.func } } };
                    if (data.func == Client.CommandAction.COMMAND_BET || data.func == Client.CommandAction.COMMAND_RAISE)
                        message.match_data_send.data.amount = data.data.amount;
                }
                else
                    message = data;
                return message;
            };
            NakamaHardCode.prototype.beforeReceive = function (data) {
                if (!data)
                    return null;
                var message;
                if (data.user) {
                    message = { func: 'login', data: data.user };
                }
                else if (data.users) {
                    message = { func: 'users_info', data: data };
                }
                else if (data.payload && (data.payload.chips !== undefined) && data.payload.token) {
                    message = {
                        func: 'balance', data: {
                            bankroll: data.payload.chips,
                            availableHourlyDrip: data.payload.availableHourlyDrip,
                            availableRewardedVideo: data.payload.availableRewardedVideo,
                            timeHourlyDrip: data.payload.timeHourlyDrip,
                            levels: data.payload.levels,
                            xp: data.payload.xp,
                            tableConfig: data.payload.tableConfig,
                        }
                    };
                }
                else if (data.rpc && data.rpc.id && data.rpc.id == 'setChips') {
                    data = JSON.parse(data.rpc.payload);
                    message = { func: 'balance', data: { bankroll: data.chips } };
                }
                else if (data.rpc && data.rpc.id && (data.rpc.id == 'getHourlyDrip' || data.rpc.id == 'getRewardVideo')) {
                    var _data = JSON.parse(data.rpc.payload);
                    var isHourlyDrip = (data.rpc.id === 'getHourlyDrip'), isRewardedVideo = (data.rpc.id === 'getRewardVideo');
                    message = {
                        func: 'balance', data: {
                            isHourlyDrip: isHourlyDrip,
                            isRewardedVideo: isRewardedVideo,
                            bankroll: _data.chips,
                            availableHourlyDrip: isHourlyDrip ? !isHourlyDrip : undefined,
                            availableRewardedVideo: isRewardedVideo ? !isRewardedVideo : undefined,
                            timeHourlyDrip: _data.timeHourlyDrip,
                            timeRewardVideo: _data.timeRewardVideo,
                        }
                    };
                }
                else if (data.op_code) {
                    var func = OppCodes[data.op_code];
                    message = { func: func, data: data.data };
                }
                else if (data.rpc && data.rpc.id) {
                    message = { func: data.rpc.id, data: JSON.parse(data.rpc.payload).data };
                }
                else if (data.subject && data.subject) {
                    data.content = JSON.parse(data.content);
                    message = { func: data.subject, data: data.content };
                }
                else if (data.match) {
                    message = { func: Client.CommandUser.EVENT_MATCH, data: data.match };
                }
                else
                    message = data;
                return message;
            };
            return NakamaHardCode;
        }());
        Client.NakamaHardCode = NakamaHardCode;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Server = (function (_super) {
            __extends(Server, _super);
            function Server() {
                var _this = _super.call(this) || this;
                _this._timeout = 10000;
                _this._connected = false;
                return _this;
            }
            Object.defineProperty(Server, "instance", {
                get: function () {
                    if (!Server._instance)
                        Server._instance = new Server();
                    return Server._instance;
                },
                enumerable: true,
                configurable: true
            });
            Server.prototype.receive = function (data) {
                this.onMessage(data);
            };
            Server.create = function () {
                if (Server.instance)
                    throw new Error('Server is singleton');
            };
            Server.prototype.init = function () {
                if (!nakamajs)
                    return;
                if (Client.Platform.service instanceof Client.ZyngaGames) {
                    Client.trace('-----USING ZYNGA TOKEN IN FB----');
                    Client.trace(Client.Platform.service.token);
                }
                Client.trace('connecting to: ' + Client.Config.host);
                this.zToken = Client.Platform.service.token;
                this._client = new nakamajs.Client(Client.Config.serverKey, Client.Config.host, Client.Config.port, Client.Config.useSSL, this._timeout);
                this._client.verbose = Client.Config.useDebug;
                this._nakamaHardCode = new Client.NakamaHardCode();
            };
            Server.prototype.loginCustom = function () {
                var customId = Client.Store.get('custom_id') || Date.now().toString();
                this._client.authenticateCustom({ id: customId }).then(this.onSession.bind(this)).catch(this.onError.bind(this));
                Client.Store.set('custom_id', customId);
            };
            Server.prototype.loginFake = function (playerInfo) {
                var _this = this;
                this._playerName = playerInfo.name;
                this._playerPhoto = playerInfo.photo;
                var fakeId = this._playerName;
                this._client.rpcGet("authFake", null, Client.Config.httpKey, { idFake: fakeId })
                    .then(function (response) {
                    _this.onMessage(response);
                    return nakamajs.Session.restore(response.payload.token);
                })
                    .then(this.onSession.bind(this)).catch(this.onError.bind(this));
            };
            Server.prototype.login = function (playerInfo) {
                var _this = this;
                this._playerName = playerInfo.name;
                this._playerPhoto = playerInfo.photo;
                this._client.rpcGet("zauth.authenticate", null, Client.Config.httpKey, { ztoken: this.zToken })
                    .then(function (response) {
                    _this.onMessage(response);
                    return nakamajs.Session.restore(response.payload.token);
                })
                    .then(this.onSession.bind(this)).catch(this.onError.bind(this));
            };
            Server.prototype.onSession = function (session) {
                this._session = session;
                var nowUnixEpoch = Math.floor(Date.now() / 1000);
                Client.trace('isexpired : ' + session.isexpired(nowUnixEpoch));
                this._client.getAccount(session).then(this.onAccount.bind(this)).catch(this.onError.bind(this));
            };
            Server.prototype.onAccount = function (data) {
                this.onMessage(data);
                if (data.user.display_name != this._playerName || data.user.avatar_url != this._playerPhoto)
                    this._client.updateAccount(this._session, { display_name: this._playerName, avatar_url: this._playerPhoto });
                Client.trace('account.user.id = ' + data.user.id);
                Client.trace('account.user.username = ' + data.user.display_name);
                this._socket = this._client.createSocket(Client.Config.useSSL, Client.Config.useDebug);
                this._socket.ondisconnect = this.onDisconnect.bind(this);
                this._socket.onnotification = this.onMessage.bind(this);
                this._socket.onmatchdata = this.onMessage.bind(this);
                this._socket.connect(this._session).then(this.onConnect.bind(this)).catch(this.onError.bind(this));
            };
            Server.prototype.onConnect = function () {
                this._connected = true;
                Client.trace("onConnect");
                this.emit(Server.READY);
            };
            Server.prototype.onMessage = function (data) {
                if (!data || data == undefined)
                    return;
                data = this._nakamaHardCode.beforeReceive(data);
                Client.trace('rcvd: ' + JSON.stringify(data));
                Client.trace('-------------------');
                Client.MessageParser.parseData(data);
            };
            Server.prototype.onError = function (error) {
                Client.MessageParser.parseData({ status: 'error', error: error });
                this.emit(Server.ERROR, error);
            };
            Server.prototype.send = function (data) {
                data = this._nakamaHardCode.beforeSend(data);
                Client.trace('send: ' + JSON.stringify(data));
                Client.trace('-------------------');
                if (data.func == Client.CommandAuth.COMMAND_LOGIN)
                    (Client.Config.isLocalHost || Client.Config.isBitball) ? this.loginFake(data.data.player) : this.login(data.data.player);
                else if (data.func == Client.CommandAuth.COMMAND_LOGOUT)
                    this.logout();
                else if (data.func == Client.CommandUser.COMMAND_USERS_INFO)
                    this._client.getUsers(this._session, data.data.ids).then(this.onMessage.bind(this)).catch(this.onError.bind(this));
                else {
                    this._socket.send(data).then(this.onMessage.bind(this)).catch(this.onError.bind(this));
                }
            };
            Server.prototype.logout = function () {
                Client.Store.remove(this.zToken);
                this._socket.disconnect();
                this._connected = false;
            };
            Object.defineProperty(Server.prototype, "connected", {
                get: function () {
                    return this._connected;
                },
                enumerable: true,
                configurable: true
            });
            Server.prototype.onDisconnect = function (event) {
                Client.trace("Disconnected from the server. Event: %o", event);
                this._connected = false;
            };
            Server.READY = 'Server_READY';
            Server.ERROR = 'Server_ERROR';
            return Server;
        }(PIXI.utils.EventEmitter));
        Client.Server = Server;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Command = (function () {
            function Command() {
            }
            Command.prototype.sendCommand = function (command, data) {
                if (data === void 0) { data = null; }
                if (!Client.Server.instance)
                    return;
                if (!data)
                    data = {};
                if (command == Client.CommandAuth.COMMAND_LOGIN) {
                    Client.Server.instance.send({ func: command, data: data });
                }
                else {
                    if (!Client.Server.instance.connected)
                        return;
                    Client.Server.instance.send({ func: command, data: data });
                }
            };
            return Command;
        }());
        Client.Command = Command;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var CommandAction = (function (_super) {
            __extends(CommandAction, _super);
            function CommandAction() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandAction.prototype.fold = function () {
                _super.prototype.sendCommand.call(this, CommandAction.COMMAND_FOLD, { table_id: Client.Model.table.id });
            };
            CommandAction.prototype.check = function () {
                _super.prototype.sendCommand.call(this, CommandAction.COMMAND_CHECK, { table_id: Client.Model.table.id });
            };
            CommandAction.prototype.bet = function (amount) {
                _super.prototype.sendCommand.call(this, CommandAction.COMMAND_BET, { table_id: Client.Model.table.id, amount: amount });
            };
            CommandAction.prototype.call = function () {
                _super.prototype.sendCommand.call(this, CommandAction.COMMAND_CALL, { table_id: Client.Model.table.id });
            };
            CommandAction.prototype.raise = function (amount) {
                _super.prototype.sendCommand.call(this, CommandAction.COMMAND_RAISE, { table_id: Client.Model.table.id, amount: amount });
            };
            CommandAction.prototype.allIn = function () {
                _super.prototype.sendCommand.call(this, CommandAction.COMMAND_ALL_IN, { table_id: Client.Model.table.id });
            };
            CommandAction.COMMAND_FOLD = 'Fold';
            CommandAction.COMMAND_CHECK = 'Check';
            CommandAction.COMMAND_BET = 'Bet';
            CommandAction.COMMAND_CALL = 'Call';
            CommandAction.COMMAND_RAISE = 'Raise';
            CommandAction.COMMAND_ALL_IN = 'AllIn';
            return CommandAction;
        }(Client.Command));
        Client.CommandAction = CommandAction;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var CommandAuth = (function (_super) {
            __extends(CommandAuth, _super);
            function CommandAuth() {
                return _super.call(this) || this;
            }
            CommandAuth.prototype.login = function (player) {
                _super.prototype.sendCommand.call(this, CommandAuth.COMMAND_LOGIN, { player: player.getJSON() });
            };
            CommandAuth.prototype.logout = function () {
                _super.prototype.sendCommand.call(this, CommandAuth.COMMAND_LOGOUT);
            };
            CommandAuth.COMMAND_LOGIN = 'login';
            CommandAuth.COMMAND_LOGOUT = 'logout';
            return CommandAuth;
        }(Client.Command));
        Client.CommandAuth = CommandAuth;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var CommandUser = (function (_super) {
            __extends(CommandUser, _super);
            function CommandUser() {
                var _this = _super.call(this) || this;
                window.SetBalance = _this.setBalance.bind(_this);
                return _this;
            }
            CommandUser.prototype.getUsersInfo = function (ids) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_USERS_INFO, { ids: ids });
            };
            CommandUser.prototype.findTable = function (level) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_FIND_TABLE, { level: level });
            };
            CommandUser.prototype.joinTable = function (id) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_JOIN_TABLE, { id: id });
            };
            CommandUser.prototype.leaveTable = function (id) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_LEAVE_TABLE, { id: id });
            };
            CommandUser.prototype.setBalance = function (amount) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_SET_BALANCE, { amount: amount });
            };
            CommandUser.prototype.getHourlyDrip = function () {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_GET_HOURLY_DRIP);
            };
            CommandUser.prototype.getRewardedVideo = function () {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_GET_REWARDED_VIDEO);
            };
            CommandUser.prototype.standUp = function (tableId) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_STAND_UP, { id: tableId });
            };
            CommandUser.prototype.seat = function (tableId, seatId) {
                _super.prototype.sendCommand.call(this, CommandUser.COMMAND_SEAT, { id: tableId, seatIdx: seatId });
            };
            CommandUser.COMMAND_FIND_TABLE = 'poker.findTable';
            CommandUser.COMMAND_JOIN_TABLE = 'poker.joinTable';
            CommandUser.COMMAND_LEAVE_TABLE = 'poker.leaveTable';
            CommandUser.COMMAND_USERS_INFO = 'poker.usersInfo';
            CommandUser.COMMAND_SET_BALANCE = 'poker.setBalance';
            CommandUser.COMMAND_GET_HOURLY_DRIP = 'poker.getHourlyDrip';
            CommandUser.COMMAND_GET_REWARDED_VIDEO = 'poker.getRewardedVideo';
            CommandUser.COMMAND_STAND_UP = 'poker.standUp';
            CommandUser.COMMAND_SEAT = 'poker.seat';
            CommandUser.EVENT_TABLE_INFO = 'TableInfo';
            CommandUser.EVENT_MATCH = 'match';
            return CommandUser;
        }(Client.Command));
        Client.CommandUser = CommandUser;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ParserAuth = (function () {
            function ParserAuth() {
            }
            ParserAuth.login = function (data) {
            };
            ParserAuth.loginError = function (data) {
            };
            return ParserAuth;
        }());
        Client.ParserAuth = ParserAuth;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ParserUser = (function () {
            function ParserUser() {
            }
            ParserUser.findTable = function (data) {
                new Client.CommandUser().joinTable(data.data.id);
            };
            ParserUser.tableInfo = function (data) {
                ParserUser.loadUsersInfo();
            };
            ParserUser.addPlayer = function (data) {
                ParserUser.loadUsersInfo();
            };
            ParserUser.loadUsersInfo = function () {
                var users = Client.Model.table.users.getAll(true);
                var ids = [];
                for (var i = 0; i < users.length; i++) {
                    if (!users[i].photo || users[i].photo.indexOf('assets') != -1) {
                        ids.push(users[i].id);
                    }
                }
                if (ids.length > 0)
                    new Client.CommandUser().getUsersInfo(ids);
            };
            ParserUser.loginError = function (data) {
            };
            return ParserUser;
        }());
        Client.ParserUser = ParserUser;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MessageParser = (function () {
            function MessageParser() {
            }
            MessageParser.parseMessage = function (message) {
                var data = null;
                try {
                    data = JSON.parse(message);
                    MessageParser.parseData(data);
                }
                catch (e) {
                    Client.trace(e.message + "\nJson:" + message);
                }
            };
            MessageParser.parseData = function (data) {
                if (data['status'])
                    data['status'] = data['status'].toUpperCase();
                if (data['status'] != "ERROR") {
                    Client.Model.setData(data);
                    if (MessageParser._dataFunctions[data['func']])
                        MessageParser._dataFunctions[data['func']](data);
                }
                else {
                    if (!data.error)
                        data.error = {};
                    if (!data.func) {
                        var func = 'none';
                        if (data.error.request && (data.error.request.email || data.error.request.custom))
                            func = 'login';
                        data.func = func;
                    }
                    var message = data.error.message ? data.error.message : '';
                    Client.trace("Message parser Status = ERROR: " + message);
                    if (MessageParser._dataErrorFunctions[data['func']])
                        MessageParser._dataErrorFunctions[data['func']](data);
                }
            };
            MessageParser._dataFunctions = {
                login: Client.ParserAuth.login,
                'poker.findTable': Client.ParserUser.findTable,
                'TableInfo': Client.ParserUser.tableInfo,
                'AddPlayer': Client.ParserUser.addPlayer,
            };
            MessageParser._dataErrorFunctions = {
                login: Client.ParserAuth.loginError
            };
            return MessageParser;
        }());
        Client.MessageParser = MessageParser;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Text = (function (_super) {
            __extends(Text, _super);
            function Text(text, style) {
                var _this = _super.call(this) || this;
                if (Text.useBitmapText) {
                    var bmpStyle = {};
                    if (style.fill && style.fill instanceof Number)
                        bmpStyle.tint = style.fill;
                    if (style.fontFamily)
                        bmpStyle.font = { name: style.fontFamily instanceof Array ? style.fontFamily[0] : style.fontFamily };
                    _this._textBmp = new PIXI.extras.BitmapText(text, bmpStyle);
                    _this.addChild(_this._textBmp);
                    if (style.fontSize)
                        _this.fontSize = (typeof style.fontSize === 'number') ? style.fontSize : parseInt(style.fontSize);
                }
                else {
                    _this._text = new PIXI.Text(text, style);
                    _this.addChild(_this._text);
                }
                return _this;
            }
            Object.defineProperty(Text.prototype, "text", {
                get: function () {
                    if (this._textBmp)
                        return this._textBmp.text;
                    else if (this._text)
                        return this._text.text;
                },
                set: function (value) {
                    if (this._textBmp)
                        this._textBmp.text = value;
                    else if (this._text)
                        this._text.text = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Text.prototype, "anchor", {
                get: function () {
                    if (this._textBmp)
                        return this._textBmp.anchor;
                    else
                        return this._text.anchor;
                },
                set: function (value) {
                    if (this._textBmp)
                        this._textBmp.anchor = new PIXI.Point(value.x, value.y);
                    else if (this._text)
                        this._text.anchor.set(value.x, value.y);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Text.prototype, "fontSize", {
                set: function (value) {
                    if (this._textBmp) {
                        var family = this._textBmp.font.name;
                        var data = PIXI.extras.BitmapText.fonts[family];
                        value *= data.size / data.lineHeight;
                        this._textBmp.font = { name: family, size: value };
                    }
                    else if (this._text)
                        this._text.style.fontSize = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Text.prototype, "wrapWidth", {
                set: function (value) {
                    if (this._text)
                        this._text.style.wordWrapWidth = value;
                },
                enumerable: true,
                configurable: true
            });
            Text.prototype.getWidth = function () {
                return this._textBmp ? this._textBmp.width : this._text.width;
            };
            Text.prototype.setWidth = function (value) {
                if (this._textBmp)
                    this._textBmp.width = value;
                else if (this._text)
                    this._text.width = value;
            };
            Text.prototype.getHeight = function () {
                return this._textBmp ? this._textBmp.height : this._text.height;
            };
            Text.prototype.setHeight = function (value) {
                if (this._textBmp)
                    this._textBmp.height = value;
                else if (this._text)
                    this._text.height = value;
            };
            Text.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                if (this._text)
                    this._text.destroy();
                else if (this._textBmp)
                    this._textBmp.destroy();
            };
            Text.useBitmapText = false;
            return Text;
        }(PIXI.Container));
        Client.Text = Text;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Bg = (function (_super) {
            __extends(Bg, _super);
            function Bg() {
                var _this = _super.call(this, Client.Resources.getTexture('bg_game')) || this;
                _this._w = 50;
                _this._h = 50;
                return _this;
            }
            Bg.prototype.setSize = function (width, height) {
                this.width = width;
                this.height = height;
            };
            Bg.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return Bg;
        }(PIXI.Sprite));
        Client.Bg = Bg;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonBet = (function (_super) {
            __extends(ButtonBet, _super);
            function ButtonBet(caption, colorUp, colorDown, icon) {
                var _this = this;
                var bgTexture = Client.Resources.getTexture('btn_bet_bg');
                _this = _super.call(this, bgTexture.width, bgTexture.height) || this;
                _this._text = caption;
                _this._colorUp = colorUp;
                _this._colorDown = colorDown;
                _this._icon = icon;
                _this._bg = new PIXI.Sprite(bgTexture);
                _this.addChild(_this._bg);
                _this._bg.tint = _this._colorUp;
                _this._label = new PIXI.Text(_this._text, Client.FontsHelper.Text.fontForButtonBet);
                _this.addChild(_this._label);
                _this._label.tint = _this._colorUp;
                _this.addChild(_this._icon);
                return _this;
            }
            ButtonBet.prototype.setCaption = function (caption) {
                this._label.text = caption;
                this._label.x = this._w / 2 - this._label.width / 2;
            };
            ButtonBet.prototype.setIcon = function (icon) {
                if (this._icon)
                    this._icon.destroy();
                this._icon = icon;
                this.addChild(this._icon);
                this.updateIconSize();
            };
            ButtonBet.prototype.onResize = function () {
                this._bg.texture = Client.Resources.getTexture('btn_bet_bg', { width: this._w, returnNewTexture: true });
                this._bg.width = this._w;
                this._bg.height = this._h;
                this._label.style.fontSize = this._h / ButtonBet.CAPTION_FONT_SIZE_KOEF;
                this._label.x = this._w / 2 - this._label.width / 2;
                this._label.y = -this._label.height;
                this.updateIconSize();
            };
            ButtonBet.prototype.updateIconSize = function () {
                if (this._icon instanceof PIXI.Text) {
                    this.updateIconFontSize();
                }
                else {
                    var origSize = Client.Resources.getOrigSize(this._icon.texture.baseTexture);
                    var iconWidth = this._w / ButtonBet.ICON_SIZE_KOEF;
                    this._icon.texture = Client.Resources.scaleTexture(this._icon.texture, { width: iconWidth });
                    this._icon.width = iconWidth;
                    this._icon.height = iconWidth / origSize.width * origSize.height;
                }
                this._icon.x = this._w / 2 - this._icon.width / 2;
                this._icon.y = this._h / 2 - this._icon.height / 2 - this._h / ButtonBet.ICON_Y_OFFSET_KOEF;
            };
            ButtonBet.prototype.updateIconFontSize = function () {
                var iconAsText = this._icon, iconTextLength = iconAsText.text.length, iconAdditionalKoef = iconTextLength < 3
                    ? 1 : ButtonBet.ICON_ADDITIONAL_FONT_SIZE_KOEF / iconTextLength, iconFontSize = this._h / ButtonBet.ICON_FONT_SIZE_KOEF * iconAdditionalKoef;
                iconAsText.style.fontSize = iconFontSize;
            };
            ButtonBet.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this._bg.tint = this._curState == Client.ButtonBase.STATE_DOWN ? this._colorDown : this._colorUp;
                this._label.tint = this._curState == Client.ButtonBase.STATE_DOWN ? this._colorDown : this._colorUp;
            };
            ButtonBet.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setWidth.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonBet.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setHeight.call(this, value, saveProportions);
                this.onResize();
            };
            ButtonBet.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._label.destroy();
                this._icon.destroy();
            };
            ButtonBet.CAPTION_FONT_SIZE_KOEF = 4;
            ButtonBet.ICON_FONT_SIZE_KOEF = 2;
            ButtonBet.ICON_SIZE_KOEF = 4;
            ButtonBet.ICON_Y_OFFSET_KOEF = 12;
            ButtonBet.ICON_ADDITIONAL_FONT_SIZE_KOEF = 2.7;
            return ButtonBet;
        }(Client.ButtonBase));
        Client.ButtonBet = ButtonBet;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonSeat = (function (_super) {
            __extends(ButtonSeat, _super);
            function ButtonSeat() {
                var _this = this;
                var texture = Client.Resources.getTexture('button_seat');
                _this = _super.call(this, texture.orig.width, texture.orig.height) || this;
                _this._bgColor = 0;
                _this._bg = new PIXI.Graphics();
                _this.addChild(_this._bg);
                _this._sprite = new PIXI.Sprite(texture);
                _this.addChild(_this._sprite);
                _this._spriteAnim = new PIXI.Sprite(Client.Resources.getTexture('button_seat_anim'));
                _this._spriteAnim.anchor.set(0.5, 1);
                _this.addChild(_this._spriteAnim);
                _this.startAnimation();
                return _this;
            }
            ButtonSeat.prototype.startAnimation = function () {
                this._spriteAnim.alpha = 1;
                this._spriteAnim.scale.set(2, 2);
                Client.Tweener.to(this._spriteAnim.scale, 0.8, { x: 0.01, y: 0.01 });
                Client.Tweener.to(this._spriteAnim, 0.8, { alpha: 0 });
                Client.Tweener.delayedCall(3, this.startAnimation, null, this);
            };
            ButtonSeat.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                var scale = this._curState == Client.ButtonBase.STATE_DOWN ? 0.9 : 1;
                this.scale.set(scale, scale);
                this._sprite.tint = this._curState == Client.ButtonBase.STATE_DOWN ? 0 : 0xffffff;
                this._bg.alpha = this._curState == Client.ButtonBase.STATE_DOWN ? 0.4 : 0.2;
                this.drawBg();
            };
            ButtonSeat.prototype.onResize = function () {
                this._sprite.texture = Client.Resources.getTexture('button_seat', { width: this._w });
                this._sprite.width = this._w;
                this._sprite.height = this._h;
                this._spriteAnim.texture = Client.Resources.getTexture('button_seat_anim', { width: this._w });
                this._spriteAnim.x = this._w / 2;
                this._spriteAnim.y = this._h * 0.75;
                this.pivot.set(this._w / 2, this._h / 2);
            };
            ButtonSeat.prototype.setWidth = function (value) {
                _super.prototype.setWidth.call(this, value, true);
                this.onResize();
            };
            ButtonSeat.prototype.drawBg = function () {
                var radius = this._sprite.width / 2 * (1 - ButtonSeat.BORDER_KOEF);
                var pos = this._sprite.x + this._sprite.width / 2;
                this._bg.clear();
                this._bg.beginFill(this._curState === Client.ButtonBase.STATE_DOWN ? 0xffffff : 0);
                this._bg.drawCircle(pos, pos, radius);
                this._bg.endFill();
            };
            ButtonSeat.prototype.destroy = function () {
                Client.Tweener.killTweensOf(this._spriteAnim);
                Client.Tweener.killTweensOf(this._spriteAnim.scale);
                Client.Tweener.killDelayedCallsTo(this.startAnimation, this);
                _super.prototype.destroy.call(this);
                this._sprite.destroy();
                this._bg.destroy();
            };
            ButtonSeat.SCALE_OFFSET_KOEF = 0.025;
            ButtonSeat.BORDER_KOEF = 0.066;
            return ButtonSeat;
        }(Client.ButtonBase));
        Client.ButtonSeat = ButtonSeat;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var ButtonsBetsContainer = (function (_super) {
            __extends(ButtonsBetsContainer, _super);
            function ButtonsBetsContainer() {
                var _this = _super.call(this) || this;
                _this._buttonOffsetKoef = 3;
                _this._colorRedUp = 0xFB3B3B;
                _this._colorRedDown = 0xC73030;
                _this._colorGreenUp = 0x29ABA7;
                _this._colorGreenDown = 0x1D8F93;
                _this._colorOrangeUp = 0xFFDC87;
                _this._colorOrangeDown = 0xE8C570;
                _this._w = 10;
                _this._h = 10;
                _this._hasCheck = false;
                _this._hasCall = false;
                _this._hasBet = false;
                _this._hasRaise = false;
                _this._hasAllIn = false;
                _this._hasConfirm = false;
                _this._btnFold = new Client.ButtonBet('Fold', _this._colorRedUp, _this._colorRedDown, PIXI.Sprite.fromFrame('icon_cross'));
                _this.addChild(_this._btnFold);
                _this._btnFold.on(Client.ButtonBase.EVENT_CLICK, _this.onClick, _this);
                var labelBet = new PIXI.Text('', Client.FontsHelper.Text.fontForButtonIconBet);
                _this._btnCall = new Client.ButtonBet('Call', _this._colorGreenUp, _this._colorGreenDown, labelBet);
                _this.addChild(_this._btnCall);
                _this._btnCall.on(Client.ButtonBase.EVENT_CLICK, _this.onClick, _this);
                _this._btnRaise = new Client.ButtonBet('Raise', _this._colorOrangeUp, _this._colorOrangeDown, PIXI.Sprite.fromFrame('icon_arrowup'));
                _this.addChild(_this._btnRaise);
                _this._btnRaise.on(Client.ButtonBase.EVENT_CLICK, _this.onClick, _this);
                return _this;
            }
            ButtonsBetsContainer.prototype.updateButtons = function (myBetting, myMoney, myCurrentBet, maxUsersBet, minBetToRaise, maxBetToRaise) {
                this.hide();
                if (!myBetting)
                    return;
                this._btnFold.visible = this._btnRaise.visible = true;
                var label;
                this._hasCheck = maxUsersBet == 0 || maxUsersBet == myCurrentBet;
                this._hasCall = myCurrentBet < maxUsersBet && maxUsersBet < (myMoney + myCurrentBet);
                this._hasBet = maxUsersBet == 0;
                this._hasAllIn = maxUsersBet >= (myMoney + myCurrentBet) || maxBetToRaise <= minBetToRaise;
                this._hasRaise = !this._hasAllIn;
                this._btnCall.visible = this._hasCheck || this._hasCall;
                if (this._hasCheck) {
                    this._btnCall.setIcon(new PIXI.Sprite(Client.Resources.getTexture('icon_check')));
                    this._btnCall.setCaption('Check');
                }
                else if (this._hasCall) {
                    label = new PIXI.Text(Client.StringHelper.shortenNumber(maxUsersBet - myCurrentBet), Client.FontsHelper.Text.fontForButtonIconBet);
                    this._btnCall.setIcon(label);
                    this._btnCall.setCaption('Call');
                }
                if (this._hasBet) {
                    this._btnRaise.setIcon(new PIXI.Sprite(Client.Resources.getTexture('icon_arrowup')));
                    this._btnRaise.setCaption('Bet');
                }
                else if (this._hasRaise) {
                    this._btnRaise.setIcon(new PIXI.Sprite(Client.Resources.getTexture('icon_arrowup')));
                    this._btnRaise.setCaption('Raise');
                }
                else if (this._hasAllIn) {
                    label = new PIXI.Text(Client.StringHelper.shortenNumber(maxBetToRaise), Client.FontsHelper.Text.fontForButtonIconBet);
                    this._btnRaise.setCaption('All-in');
                    this._btnRaise.setIcon(label);
                }
            };
            ButtonsBetsContainer.prototype.hide = function () {
                this._hasConfirm = false;
                this._btnFold.visible = this._btnCall.visible = this._btnRaise.visible = false;
            };
            ButtonsBetsContainer.prototype.showConfirmButton = function () {
                this._hasConfirm = true;
                this._btnRaise.setCaption('Confirm');
            };
            ButtonsBetsContainer.prototype.onClick = function (btn) {
                if (btn === this._btnFold)
                    this.emit(Client.AppEvent.CLICK_FOLD);
                else if (btn === this._btnCall)
                    this.emit(this._hasCheck ? Client.AppEvent.CLICK_CHECK : Client.AppEvent.CLICK_CALL);
                else if (btn === this._btnRaise) {
                    if (this._hasConfirm)
                        this.emit(Client.AppEvent.CLICK_CONFIRM);
                    else if (this._hasBet)
                        this.emit(Client.AppEvent.CLICK_BET);
                    else if (this._hasRaise)
                        this.emit(Client.AppEvent.CLICK_RAISE);
                    else if (this._hasAllIn)
                        this.emit(Client.AppEvent.CLICK_ALL_IN);
                }
            };
            ButtonsBetsContainer.prototype.getWidth = function () {
                return this._w;
            };
            ButtonsBetsContainer.prototype.setWidth = function (value) {
                this._w = value;
                var btnWidth = this._w * this._buttonOffsetKoef / (3 * this._buttonOffsetKoef + 2);
                var offset = (this._w - btnWidth * 3) / 2;
                this._btnFold.setWidth(btnWidth, true);
                this._btnCall.setWidth(btnWidth, true);
                this._btnRaise.setWidth(btnWidth, true);
                this._btnFold.x = 0;
                this._btnCall.x = this._btnFold.x + this._btnFold.getWidth() + offset;
                this._btnRaise.x = this._btnCall.x + this._btnCall.getWidth() + offset;
                this._h = this._btnFold.getHeight();
            };
            ButtonsBetsContainer.prototype.getHeight = function () {
                return this._h;
            };
            ButtonsBetsContainer.prototype.redraw = function () {
            };
            return ButtonsBetsContainer;
        }(PIXI.Container));
        Client.ButtonsBetsContainer = ButtonsBetsContainer;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Chip = (function (_super) {
            __extends(Chip, _super);
            function Chip() {
                var _this = _super.call(this, Client.Resources.getTexture('chip')) || this;
                _this._w = 100;
                _this._h = 61;
                return _this;
            }
            Chip.prototype.setWidth = function (value) {
                this.texture = Client.Resources.getTexture('chip', { width: value, returnNewTexture: true });
            };
            Chip.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return Chip;
        }(PIXI.Sprite));
        Client.Chip = Chip;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Dealer = (function (_super) {
            __extends(Dealer, _super);
            function Dealer() {
                var _this = this;
                var texture = PIXI.utils.TextureCache['dealer'];
                _this = _super.call(this, texture) || this;
                _this._w = texture.width;
                _this._h = texture.height;
                return _this;
            }
            Dealer.prototype.getWidth = function () {
                return this._w;
            };
            Dealer.prototype.setWidth = function (value) {
                this._w = value;
            };
            Dealer.prototype.getHeight = function () {
                return this._h;
            };
            Dealer.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return Dealer;
        }(PIXI.Sprite));
        Client.Dealer = Dealer;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Light = (function (_super) {
            __extends(Light, _super);
            function Light() {
                var _this = _super.call(this, Client.Resources.getTexture('light')) || this;
                _this._fadeTime = 1;
                _this._rotationSpeed = Math.PI / 2;
                return _this;
            }
            Light.alloc = function () { return Light._lightsPool.alloc(); };
            Light.prototype.init = function (lifeTime, size) {
                this.width = this.height = size;
                this.alpha = 1;
                this.rotation = 0;
                this.anchor.set(0.5, 0.5);
                var fullTime = lifeTime + this._fadeTime;
                Client.Tweener.to(this, fullTime, { rotation: this._rotationSpeed * fullTime });
                Client.Tweener.delayedCall(lifeTime, this.fadeOut, null, this);
            };
            Light.prototype.fadeOut = function () {
                Client.Tweener.to(this, this._fadeTime, { alpha: 0, onComplete: this.destroy, onCompleteScope: this });
            };
            Light.prototype.destroy = function () {
                Client.Tweener.killTweensOf(this);
                Client.Tweener.killDelayedCallsTo(this.fadeOut, this);
                if (this.parent)
                    this.parent.removeChild(this);
                Light._lightsPool.free(this);
            };
            Light._lightsPool = new Client.ObjectPool(Light);
            return Light;
        }(PIXI.Sprite));
        Client.Light = Light;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var RaiseView = (function (_super) {
            __extends(RaiseView, _super);
            function RaiseView() {
                var _this = _super.call(this) || this;
                _this.RAISE_VIEW_HEIGHT_KOEF = 0.6;
                _this.RAISE_VIEW_BOTTOM_OFFSET_KOEF = 0.25;
                _this.RAISE_VIEW_RIGHT_OFFSET_KOEF = 0.03;
                _this.TOP_CHIP_SCALE_FACTOR = 1.2;
                _this.BUTTON_WIDTH_KOEF = 0.37;
                _this.BUTTON_X_OFFSET_KOEF = 0.15;
                _this.BUTTON_TOP_OFFSET_KOEF = 0.12;
                _this.BUTTON_Y_INTERVAL_KOEF = 0.05;
                _this.SWYPE_LEFT_OFFSET = 0.7;
                _this.SWYPE_TOP_OFFSET = 0.12;
                _this.SWYPE_WIDTH_KOEF = 0.25;
                _this.SWYPE_HEIGHT_KOEF = 0.65;
                _this.CUR_BET_FONT_SIZE_KOEF = 0.1;
                _this.RATIO = 0.45;
                _this._soundDelay = 80;
                _this._soundTime = 0;
                _this._w = 100;
                _this._h = 400;
                _this._labelCurBet = new PIXI.Text('', Client.FontsHelper.Text.fontRaiseBet);
                _this._buttonSwypeMax = new Client.RaiseViewButton('ALL IN');
                _this._buttonSwypePot = new Client.RaiseViewButton('FULL POT');
                _this._buttonSwypeHalfPot = new Client.RaiseViewButton('1/2 POT');
                _this._labelSwypeBigBet = new PIXI.Text('1', Client.FontsHelper.Text.fontRaiseSwype);
                _this._labelSwypeMediumBet = new PIXI.Text('2', Client.FontsHelper.Text.fontRaiseSwype);
                _this._labelSwypeSmallBet = new PIXI.Text('3', Client.FontsHelper.Text.fontRaiseSwype);
                _this._minBet = 10;
                _this._maxBet = 1000;
                _this._offset = 50;
                _this._fullPot = 0;
                _this._halfOfPot = 0;
                _this._curBet = 0;
                _this._swypeDowned = false;
                _this._bg = new Client.RaiseViewBg();
                _this.addChild(_this._bg);
                _this._btnBetInc = new Client.ButtonImage('btn_plus_up', 'btn_plus_up', 'btn_plus_down');
                _this._btnBetInc.on(Client.ButtonBase.EVENT_CLICK, _this.onButtonClick, _this);
                _this._btnBetDec = new Client.ButtonImage('btn_minus_up', 'btn_minus_up', 'btn_minus_down');
                _this._btnBetDec.on(Client.ButtonBase.EVENT_CLICK, _this.onButtonClick, _this);
                _this._labelCurBet.anchor.set(0.5, 0.5);
                _this.addChild(_this._labelCurBet);
                _this._swypeContainer = new PIXI.Sprite(Client.Resources.getTexture('raise_view_bg'));
                _this._swypeContainer.interactive = true;
                _this.addChild(_this._swypeContainer);
                _this._swypeContainerDots = new PIXI.Graphics();
                _this.addChild(_this._swypeContainerDots);
                _this._buttonsContainer = new PIXI.Container();
                _this.addChild(_this._buttonsContainer);
                _this._buttonsContainer.addChild(_this._btnBetInc);
                _this._buttonsContainer.addChild(_this._btnBetDec);
                _this._buttonsContainer.addChild(_this._buttonSwypePot);
                _this._buttonsContainer.addChild(_this._buttonSwypeMax);
                _this._buttonsContainer.addChild(_this._buttonSwypeHalfPot);
                _this._labelSwypeBigBet.anchor.set(0.5, 0);
                _this._labelSwypeMediumBet.anchor.set(0.5, 0);
                _this._labelSwypeSmallBet.anchor.set(0.5, 0);
                _this._chipsContainer = new PIXI.Container();
                _this._chipsContainer.name = "chips_container";
                _this.addChild(_this._chipsContainer);
                _this._swypeContainer.on(Client.MouseEvent.MOUSE_DOWN, _this.onSwypeDown, _this);
                _this._swypeContainer.on(Client.MouseEvent.MOUSE_UP, _this.onSwypeUp, _this);
                _this._swypeContainer.on(Client.MouseEvent.MOUSE_OUT, _this.onSwypeOut, _this);
                _this._swypeContainer.on(Client.MouseEvent.MOUSE_OUTSIDE, _this.onSwypeOut, _this);
                _this._swypeContainer.on(Client.MouseEvent.MOUSE_MOVE, _this.onSwypeMove, _this);
                _this._buttonSwypeMax.on(Client.RaiseViewButton.EVENT_CLICK, function () { return _this.setBet(_this._maxBet); }, _this);
                _this._buttonSwypePot.on(Client.RaiseViewButton.EVENT_CLICK, function () { return _this.setBet(_this._fullPot); }, _this);
                _this._buttonSwypeHalfPot.on(Client.RaiseViewButton.EVENT_CLICK, function () { return _this.setBet(_this._halfOfPot); }, _this);
                _this.setBet(_this._minBet);
                _this.hide();
                return _this;
            }
            RaiseView.prototype.setWidth = function (value) {
                this._w = value;
                this._h = this._w / this.RATIO;
                this.redraw();
            };
            RaiseView.prototype.setHeight = function (value) {
                this._h = value;
                this._w = this._h * this.RATIO;
                this.redraw();
                this.createChips();
            };
            RaiseView.prototype.redraw = function () {
                this._bg.setSize(this._w, this._h);
                this._bg.x = 0;
                var buttonWidth = this._w * this.BUTTON_WIDTH_KOEF, buttonLeftOffset = this._w * this.BUTTON_X_OFFSET_KOEF, buttonsTopOffset = this._h * this.BUTTON_TOP_OFFSET_KOEF, buttonsInterval = this._h * this.BUTTON_Y_INTERVAL_KOEF, buttonTopOffset = function (number, height) { return (height + buttonsInterval) * (number - 1); };
                this._btnBetInc.setWidth(buttonWidth / 2.5, true);
                this._btnBetDec.setWidth(buttonWidth / 2.5, true);
                this._labelCurBet.style.fontSize = this._w * this.CUR_BET_FONT_SIZE_KOEF;
                this._labelCurBet.x = this._w / 2;
                this._labelCurBet.y = this._h * 0.05;
                this._buttonSwypeMax.setWidth(buttonWidth, true);
                this._buttonSwypePot.setWidth(buttonWidth, true);
                this._buttonSwypeHalfPot.setWidth(buttonWidth, true);
                this._labelSwypeBigBet.style.fontSize = this._w * 0.2;
                this._labelSwypeMediumBet.style.fontSize = this._w * 0.2;
                this._labelSwypeSmallBet.style.fontSize = this._w * 0.2;
                this._buttonsContainer.y = buttonsTopOffset;
                this._buttonSwypeMax.y = buttonTopOffset(1, this._buttonSwypeMax.height);
                this._buttonSwypePot.y = buttonTopOffset(2, this._buttonSwypePot.height);
                this._buttonSwypeHalfPot.y = buttonTopOffset(3, this._buttonSwypeHalfPot.height);
                this._btnBetInc.y = buttonTopOffset(4, this._buttonSwypePot.height);
                this._btnBetDec.y = buttonTopOffset(5, this._buttonSwypePot.height);
                this._buttonSwypeMax.x = 0;
                this._buttonSwypePot.x = 0;
                this._buttonSwypeHalfPot.x = 0;
                this._btnBetInc.x = buttonWidth / 2 - this._btnBetInc.width / 2;
                this._btnBetDec.x = buttonWidth / 2 - this._btnBetDec.width / 2;
                this._swypeContainer.texture = Client.Resources.scaleTexture(this._swypeContainer.texture, {
                    width: this._w * this.SWYPE_WIDTH_KOEF,
                    height: this._h * this.SWYPE_HEIGHT_KOEF,
                });
                this._swypeContainer.x = this._w * this.SWYPE_LEFT_OFFSET;
                this._swypeContainer.y = this._h * this.SWYPE_TOP_OFFSET;
                this._swypeContainerDots.x = this._w * this.SWYPE_LEFT_OFFSET;
                this._swypeContainerDots.y = this._h * this.SWYPE_TOP_OFFSET;
                this._swypeContainer.width = this._w * this.SWYPE_WIDTH_KOEF;
                this._swypeContainer.height = this._h * this.SWYPE_HEIGHT_KOEF;
                this._swypeContainerDots.clear();
                this._buttonsContainer.x = this._swypeContainer.x / 2 - buttonWidth / 2;
                this._swypeContainerDots.beginFill(0xf7ae4f, 0.5);
                var pointsCount = 8;
                var pointsOffset = this._swypeContainer.height / pointsCount;
                var curY;
                for (var i = 0; i < pointsCount - 1; i++) {
                    curY = pointsOffset * (i + 1);
                    this._swypeContainerDots.drawCircle(this._swypeContainer.width / 2, curY, this._swypeContainer.width / 16);
                }
                this._swypeContainerDots.endFill();
                this._labelSwypeBigBet.x = this._swypeContainer.x + this._swypeContainer.width / 2;
                this._labelSwypeBigBet.y = this._swypeContainer.y + this._swypeContainer.height * 0.18;
                this._labelSwypeMediumBet.x = this._swypeContainer.x + this._swypeContainer.width / 2;
                this._labelSwypeMediumBet.y = this._swypeContainer.y + this._swypeContainer.height * 0.4;
                this._labelSwypeSmallBet.x = this._swypeContainer.x + this._swypeContainer.width / 2;
                this._labelSwypeSmallBet.y = this._swypeContainer.y + this._swypeContainer.height * 0.67;
                this._chipsContainer.x = this._swypeContainer.x;
                this._chipsContainer.y = this._swypeContainer.y;
                this.setBet(this._curBet);
            };
            Object.defineProperty(RaiseView.prototype, "incrementionBet", {
                get: function () {
                    return this._curBet + this._offset;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RaiseView.prototype, "decrementionBet", {
                get: function () {
                    return this._curBet - this._offset;
                },
                enumerable: true,
                configurable: true
            });
            RaiseView.prototype.isBetAvailable = function (bet) {
                return bet > this._minBet && bet < this._maxBet;
            };
            RaiseView.prototype.onButtonClick = function (btn) {
                if (btn === this._btnBetInc)
                    this.setBet(this.incrementionBet);
                else if (btn === this._btnBetDec)
                    this.setBet(this.decrementionBet);
            };
            RaiseView.prototype.onSwypeMove = function (e) {
                if (!this._swypeDowned)
                    return;
                var offsetSwypeTop = this._swypeContainer.y;
                var offsetSwypeBottom = 0;
                var availableSwypeHeight = this._swypeContainer.height - offsetSwypeTop - offsetSwypeBottom;
                var mousePos = e.data.getLocalPosition(this._swypeContainer.parent);
                var percent = 1 - (mousePos.y - offsetSwypeTop) / this._swypeContainer.height;
                percent = Math.max(0, Math.min(percent, 1));
                var stepsCount = Math.ceil((this._maxBet - this._minBet) / Client.Model.table.betStep), betIncrementaion = Math.round(percent * stepsCount) * Client.Model.table.betStep;
                var betValue = this._minBet + betIncrementaion;
                this.setBet(betValue);
            };
            RaiseView.prototype.updateParams = function (params) {
                this._minBet = params.minBet !== undefined && params.minBet;
                this._maxBet = params.maxBet !== undefined && params.maxBet;
                this._fullPot = params.fullPot !== undefined && params.fullPot;
                this._halfOfPot = params.halfOfPot !== undefined && params.halfOfPot;
                this._offset = params.offset !== undefined && params.offset;
                console.log('PARAMS', params);
                this.setBet(this._minBet);
                this.updateSwypeButtonAvailabilities();
                this._labelSwypeBigBet.text = '$' + (this._minBet + (this._maxBet - this._minBet) * 3 / 4).toFixed();
                this._labelSwypeMediumBet.text = '$' + (this._minBet + (this._maxBet - this._minBet) / 2).toFixed();
                this._labelSwypeSmallBet.text = '$' + (this._minBet + (this._maxBet - this._minBet) * 1 / 4).toFixed();
            };
            RaiseView.prototype.setBet = function (value) {
                console.debug("setBet(" + value + ")");
                this._curBet = Math.max(this._minBet, Math.min(value, this._maxBet));
                if (this._chipsContainer.children.length == 0)
                    return;
                var percent = this._maxBet > this._minBet
                    ? (this._curBet - this._minBet) / (this._maxBet - this._minBet)
                    : 1;
                this.updateInDeCrementButtonAvailabilities();
                this._labelCurBet.text = '$' + (this._curBet >> 0).toFixed();
                Client.MathHelper.setSeed(100);
                var maxHeight = this._swypeContainer.height * 0.9;
                var chipHeight = 7 * this._btnBetInc.scale.x;
                var chipsCount = Math.max(1, percent * maxHeight / chipHeight);
                var chip;
                for (var i = 0; i < this._chipsContainer.children.length; i++) {
                    var chip_1 = this._chipsContainer.getChildAt(i);
                    chip_1.visible = i < chipsCount;
                    if (i < chipsCount - 1) {
                        chip_1.scale.set(1);
                    }
                    else if (this._swypeDowned) {
                        chip_1.scale.set(this.TOP_CHIP_SCALE_FACTOR);
                    }
                }
                if (this.visible && new Date().getTime() - this._soundTime > this._soundDelay) {
                    this._soundTime = new Date().getTime();
                    Client.Sounds.play(Client.SoundsHelper.CHIP_STACK);
                }
            };
            RaiseView.prototype.updateSwypeButtonAvailabilities = function () {
                this._buttonSwypePot.disabled = !this.isBetAvailable(this._fullPot);
                this._buttonSwypeHalfPot.disabled = !this.isBetAvailable(this._halfOfPot);
            };
            RaiseView.prototype.updateInDeCrementButtonAvailabilities = function () {
                this._btnBetInc.disabled = this._curBet >= this._maxBet;
                this._btnBetDec.disabled = this._curBet <= this._minBet;
            };
            RaiseView.prototype.createChips = function () {
                var maxHeight = this._swypeContainer.height * 0.9;
                var chipHeight = 7 * this._btnBetInc.scale.x;
                var chipsCount = Math.floor(maxHeight / chipHeight);
                var chip;
                for (var i = 0; i < chipsCount; i++) {
                    if (i >= this._chipsContainer.children.length) {
                        chip = new Client.Chip();
                        this._chipsContainer.addChild(chip);
                    }
                    else {
                        chip = this._chipsContainer.getChildAt(i);
                    }
                    chip.setWidth(this._swypeContainer.width);
                    var offset = this._swypeContainer.width / 10;
                    chip.x = Client.MathHelper.getRandomBySeedMinToMax(-offset, offset);
                    chip.y = this._swypeContainer.height - chip.height - chipHeight * i + Client.MathHelper.getRandomBySeedMinToMax(-1, 1);
                }
                this.setBet(this._curBet);
            };
            RaiseView.prototype.show = function () {
                this.visible = true;
            };
            RaiseView.prototype.hide = function () {
                this.visible = false;
            };
            RaiseView.prototype.getSelectedBet = function () {
                return this._curBet >> 0;
            };
            RaiseView.prototype.onSwypeDown = function (e) {
                this._swypeDowned = true;
                this.onSwypeMove(e);
            };
            RaiseView.prototype.onSwypeOut = function (e) {
                this.onSwypeMove(e);
                this.onSwypeUp();
            };
            RaiseView.prototype.onSwypeUp = function () {
                this._swypeDowned = false;
                for (var _i = 0, _a = this._chipsContainer.children; _i < _a.length; _i++) {
                    var chip = _a[_i];
                    chip.scale.set(1);
                }
            };
            RaiseView.prototype.getWidth = function () {
                return this._w;
            };
            RaiseView.prototype.getHeight = function () {
                return this._h;
            };
            RaiseView.prototype.destroy = function () {
                this._btnBetInc.off(Client.ButtonBase.EVENT_CLICK, this.onButtonClick, this);
                this._btnBetDec.off(Client.ButtonBase.EVENT_CLICK, this.onButtonClick, this);
                this._swypeContainer.off(Client.MouseEvent.MOUSE_DOWN, this.onSwypeDown, this);
                this._swypeContainer.off(Client.MouseEvent.MOUSE_UP, this.onSwypeUp, this);
                this._swypeContainer.off(Client.MouseEvent.MOUSE_OUT, this.onSwypeOut, this);
                this._swypeContainer.off(Client.MouseEvent.MOUSE_OUTSIDE, this.onSwypeOut, this);
                this._swypeContainer.off(Client.MouseEvent.MOUSE_MOVE, this.onSwypeMove, this);
                _super.prototype.destroy.call(this, { children: true });
            };
            return RaiseView;
        }(PIXI.Container));
        Client.RaiseView = RaiseView;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var RaiseViewBg = (function (_super) {
            __extends(RaiseViewBg, _super);
            function RaiseViewBg() {
                var _this = _super.call(this) || this;
                _this.BACKGROUND_COLOR = 0x800d20;
                _this.BORDER_LEFT_COLOR = 0x4b051c;
                _this.BORDER_LEFT_KOEF = 0.02;
                _this.interactive = true;
                _this._bg = new PIXI.Graphics();
                _this.addChild(_this._bg);
                _this._border = new PIXI.Graphics();
                _this.addChild(_this._border);
                return _this;
            }
            RaiseViewBg.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            RaiseViewBg.prototype.setSize = function (width, height) {
                this._w = width;
                this._h = height;
                this.update();
            };
            RaiseViewBg.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            RaiseViewBg.prototype.drawBg = function () {
                this._bg.clear();
                this._bg.beginFill(this.BACKGROUND_COLOR);
                this._bg.drawRect(0, 0, this._w, this._h);
                this._bg.endFill();
            };
            RaiseViewBg.prototype.drawBorder = function () {
                this._border.clear();
                this._border
                    .lineStyle(this._w * this.BORDER_LEFT_KOEF, this.BORDER_LEFT_COLOR)
                    .moveTo(0, 0)
                    .lineTo(0, this._h);
            };
            RaiseViewBg.prototype.update = function () {
                this.drawBg();
                this.drawBorder();
            };
            return RaiseViewBg;
        }(PIXI.Container));
        Client.RaiseViewBg = RaiseViewBg;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var RaiseViewButton = (function (_super) {
            __extends(RaiseViewButton, _super);
            function RaiseViewButton(text) {
                var _this = _super.call(this, 420, 200) || this;
                _this._text = '';
                _this._enabled = true;
                _this._colorUp = 0x930616;
                _this._colorDisabled = 0x888888;
                _this._colorDown = 0xb10616;
                _this._text = text;
                _this._bg = new PIXI.Graphics();
                _this._bg.tint = _this._colorUp;
                _this.addChild(_this._bg);
                _this._label = new PIXI.Text(_this._text, Client.FontsHelper.Text.fontRaiseSwype);
                _this.addChild(_this._label);
                return _this;
            }
            Object.defineProperty(RaiseViewButton.prototype, "currentState", {
                get: function () {
                    return this._curState;
                },
                enumerable: true,
                configurable: true
            });
            RaiseViewButton.prototype.onResize = function () {
                this.drawBg();
                this._label.style.fontSize = this._w * RaiseViewButton.CAPTION_FONT_SIZE_KOEF;
                this._label.x = this._w / 2 - this._label.width / 2;
                this._label.y = this._h / 2 - this._label.height / 2;
            };
            RaiseViewButton.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                if (this._curState === RaiseViewButton.STATE_DISABLED) {
                    this.visible = false;
                }
                else {
                    this.visible = true;
                }
                this.onResize();
            };
            RaiseViewButton.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setWidth.call(this, value, saveProportions);
                this.onResize();
            };
            RaiseViewButton.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setHeight.call(this, value, saveProportions);
                this.onResize();
            };
            RaiseViewButton.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._label.destroy();
            };
            RaiseViewButton.prototype.drawBg = function () {
                var downX = this._w * RaiseViewButton.SCALE_X_KOEF, downY = this._h * RaiseViewButton.SCALE_Y_KOEF, downWidth = this._w * (1 - 2 * RaiseViewButton.SCALE_X_KOEF), downHeight = this._h * (1 - 2 * RaiseViewButton.SCALE_Y_KOEF);
                var x = this._curState === RaiseViewButton.STATE_DOWN ? downX : 0, y = this._curState === RaiseViewButton.STATE_DOWN ? downY : 0, w = this._curState === RaiseViewButton.STATE_DOWN ? downWidth : this._w, h = this._curState === RaiseViewButton.STATE_DOWN ? downHeight : this._h;
                this._bg.clear();
                this._bg.beginFill(0xffffff, 0);
                this._bg.lineStyle(2, 0xffffff);
                this._bg.drawRoundedRect(x, y, w, h, h / 2.5);
                this._bg.endFill();
            };
            RaiseViewButton.CAPTION_FONT_SIZE_KOEF = 0.2;
            RaiseViewButton.SCALE_X_KOEF = 0.025;
            RaiseViewButton.SCALE_Y_KOEF = 0.075;
            return RaiseViewButton;
        }(Client.ButtonBase));
        Client.RaiseViewButton = RaiseViewButton;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Rect = (function (_super) {
            __extends(Rect, _super);
            function Rect() {
                var _this = _super.call(this) || this;
                _this._w = 50;
                _this._h = 50;
                _this.clear();
                _this.beginFill(0x660000, 1);
                _this.drawRect(0, 0, Rect.SIZE, Rect.SIZE);
                _this._text = new PIXI.Text('', Client.FontsHelper.Text.fontWhite10);
                _this._text.x = _this._text.y = 10;
                _this.addChild(_this._text);
                return _this;
            }
            Rect.prototype.setPos = function (x, y) {
                this._text.text = x + '\n' + y;
                this._text.text = Client.Model.view.screenWidth + '\n' + Client.Model.view.screenHeight;
                this.x = x;
                this.y = y;
            };
            Rect.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._text.destroy();
            };
            Rect.SIZE = 50;
            return Rect;
        }(PIXI.Graphics));
        Client.Rect = Rect;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Table = (function (_super) {
            __extends(Table, _super);
            function Table() {
                var _this = _super.call(this) || this;
                _this.MY_PLAYER_HEIGHT_KOEF = 0.22;
                _this.PLAYER_HEIGHT_KOEF = 0.17;
                _this.TABLE_HEIGHT_KOEF = 0.43;
                _this.TABLE_WIDTH_KOEF = 0.63;
                _this.TABLE_TOP_OFFSET_KOEF = 0.25;
                _this.PLAYERS_IN_TOP_OFFSET_X = 0.08;
                _this.DELAY_GIVE_OUT_CARDS = 0.2;
                _this.DEALER_COORDS = new PIXI.Point(0.5, 0.05);
                _this._seats = [1, 2, 3, 4, 5];
                _this._w = 50;
                _this._h = 50;
                _this._players = [];
                _this._tableRect = new PIXI.Rectangle(0, 0, 10, 10);
                _this._dealerCoords = new PIXI.Point();
                _this._places = [];
                _this._placesHash = {};
                var place;
                for (var i = 0; i < _this._seats.length; i++) {
                    place = new Client.TablePlace(i);
                    place.setSeat(_this._seats[i]);
                    _this._places.push(place);
                    _this.addChild(place);
                }
                _this.setSeats(_this._seats);
                _this._potBet = new Client.PlayerBet();
                _this._potBet.expand(true, true);
                _this._potBet.setIcon(Client.MBet.TYPE_CHIP);
                _this.hidePot();
                _this.addChild(_this._potBet);
                return _this;
            }
            Table.prototype.setSeats = function (seats) {
                var i;
                this._seats = seats;
                this._placesHash = {};
                var place;
                for (i = 0; i < this._seats.length; i++) {
                    place = this.getPlaceBySeat(this._seats[i]);
                    if (place) {
                        place.setIndex(i);
                        place.setSeat(this._seats[i]);
                    }
                }
                for (i = 0; i < this._places.length; i++)
                    this._placesHash[this._places[i].seatId] = this._places[i];
                for (var i_1 = 0; i_1 < this._places.length; i_1++)
                    this._places[i_1].resize();
            };
            Table.prototype.getPlaceBySeat = function (seatId) {
                for (var i = 0; i < this._places.length; i++) {
                    if (this._places[i].seatId == seatId)
                        return this._places[i];
                }
                return null;
            };
            Table.prototype.setSeatCallback = function (callback) {
                for (var i = 0; i < this._places.length; i++)
                    this._places[i].setSeatCallback(callback);
            };
            Table.prototype.addPlayer = function (mPlayer, isMyPlayer) {
                if (!mPlayer)
                    return;
                var player = this._placesHash[mPlayer.seatId].setMPlayer(mPlayer);
                if (player instanceof Client.MyPlayer)
                    this._myPlayer = player;
                else
                    this._players.push(player);
            };
            Table.prototype.removePlayer = function (id) {
                if (this._myPlayer && id == this._myPlayer.userId) {
                    this._placesHash[this._myPlayer.seatId].removePlayer();
                    this._myPlayer.destroy();
                    this._myPlayer = null;
                    return;
                }
                for (var i = 0; i < this._players.length; i++) {
                    if (this._players[i].userId == id) {
                        this._placesHash[this._players[i].seatId].removePlayer();
                        this._players[i].destroy();
                        this._players.splice(i, 1);
                        return;
                    }
                }
            };
            Table.prototype.removeAllPlayers = function () {
                if (this._myPlayer)
                    this.removePlayer(this._myPlayer.userId);
                while (this._players.length > 0)
                    this.removePlayer(this._players[0].userId);
                this._players = [];
            };
            Table.prototype.updatePlaceButtons = function (showSeats) {
                for (var i = 0; i < this._places.length; i++) {
                    this._places[i].updateButtons(showSeats);
                }
            };
            Table.prototype.setAddFriendCallback = function (callback) {
                for (var _i = 0, _a = this._places; _i < _a.length; _i++) {
                    var p = _a[_i];
                    p.setAddFriendCallback(callback);
                }
            };
            Table.prototype.updatePlayer = function (id, params) {
                var player = this.getPlayerById(id);
                if (player)
                    player.updateInfo(params);
            };
            Table.prototype.updatePlayers = function (params) {
                if (this._myPlayer)
                    this._myPlayer.updateInfo(params);
                for (var i = 0; i < this._players.length; i++)
                    this._players[i].updateInfo(params);
            };
            Table.prototype.showPot = function (amount) {
                this._potBet.visible = true;
                this._potBet.setText(Client.StringHelper.shortenNumber(amount));
            };
            Table.prototype.hidePot = function () {
                this._potBet.visible = false;
            };
            Table.prototype.showPlayersCards = function () {
                for (var i = 0; i < this._players.length; i++)
                    this._players[i].showCards();
            };
            Table.prototype.hidePlayersCards = function () {
                for (var i = 0; i < this._players.length; i++)
                    this._players[i].hideCards();
            };
            Table.prototype.hideMyCards = function () {
                if (this._myPlayer)
                    this._myPlayer.hideCards();
            };
            Table.prototype.updateDealer = function (id) {
                if (this._myPlayer)
                    this._myPlayer.dealer = this._myPlayer.userId == id;
                for (var i = 0; i < this._players.length; i++)
                    this._players[i].dealer = this._players[i].userId == id;
            };
            Table.prototype.waitBet = function (id, waitTime) {
                var player = this.getPlayerById(id);
                if (player)
                    player.waitBet(waitTime);
            };
            Table.prototype.clearPlayersWaiting = function () {
                if (this._myPlayer)
                    this._myPlayer.clearWaiting();
                for (var i = 0; i < this._players.length; i++)
                    this._players[i].clearWaiting();
            };
            Table.prototype.getPlayerById = function (id) {
                if (this._myPlayer && this._myPlayer.userId == id)
                    return this._myPlayer;
                for (var i = 0; i < this._players.length; i++)
                    if (this._players[i].userId == id) {
                        return this._players[i];
                    }
                return null;
            };
            Table.prototype.getPlayersBySeatsID = function (seatsId) {
                if (this._myPlayer && this._myPlayer.seatId == seatsId)
                    return this._myPlayer;
                for (var _i = 0, _a = this._players; _i < _a.length; _i++) {
                    var p = _a[_i];
                    if (p.seatId == seatsId)
                        return p;
                }
                return null;
            };
            Table.prototype.returnCards = function (id, immediately) {
                if (Client.Model.me.id == id)
                    return;
                var player = this.getPlayerById(id);
                if (!player)
                    return;
                player.returnCards(player.toLocal(this._dealerCoords, this), immediately);
            };
            Table.prototype.giveOutCards = function (immediately) {
                var playersInGame = [];
                for (var i = 0; i < this._players.length; i++) {
                    if (this._players[i].waitNewGame)
                        continue;
                    playersInGame.push(this._players[i]);
                }
                var circleDelay = this.DELAY_GIVE_OUT_CARDS * playersInGame.length;
                for (var i = 0; i < playersInGame.length; i++) {
                    playersInGame[i].giveOutCards(playersInGame[i].toLocal(this._dealerCoords, this), immediately, i * this.DELAY_GIVE_OUT_CARDS, circleDelay);
                }
                if (this._myPlayer && !this._myPlayer.waitNewGame)
                    this._myPlayer.showCards();
            };
            Table.prototype.chipsToPot = function () {
                var chip;
                var localPos;
                for (var i = 0; i < this._players.length; i++) {
                    chip = this._players[i].cloneChip();
                    if (!chip)
                        continue;
                    localPos = this.toLocal(chip.position);
                    chip.x = localPos.x;
                    chip.y = localPos.y;
                    this.addChild(chip);
                    Client.Tweener.to(chip, 1.2, { x: this._dealerCoords.x - chip.width / 2, y: this._dealerCoords.y, onComplete: this.destroyChip, onCompleteParams: [chip], onCompleteScope: this });
                }
                if (this._myPlayer) {
                    chip = this._myPlayer.cloneChip();
                    if (!chip)
                        return;
                    localPos = this.toLocal(chip.position);
                    chip.x = localPos.x;
                    chip.y = localPos.y;
                    this.addChild(chip);
                    Client.Tweener.to(chip, 1.2, { x: this._dealerCoords.x - chip.width / 2, y: this._dealerCoords.y, onComplete: this.destroyChip, onCompleteParams: [chip], onCompleteScope: this });
                }
            };
            Table.prototype.giveOutPots = function (users, pots) {
                var delay = 1.2;
                Client.Tweener.delayedCall(delay, this.updatePlayers, [{ updateStack: true }], this);
                if (pots.length <= 1) {
                    this._giveOutPotToPlayer(users, false);
                    this.hidePot();
                }
                else {
                    this._giveOutPotToPlayer(users, true);
                    Client.Tweener.delayedCall(delay, this._giveOutPotToPlayer, [users, false], this);
                    this.showPot(pots[0]);
                    Client.Tweener.delayedCall(delay, this.hidePot, null, this);
                }
            };
            Table.prototype._giveOutPotToPlayer = function (users, firstAnimation) {
                for (var i = 0; i < users.length; i++) {
                    var win = firstAnimation ? users[i].winPot2 : users[i].winPot1;
                    if (win == 0)
                        continue;
                    var player = this.getPlayerById(users[i].id);
                    if (!player)
                        continue;
                    var winBet = new Client.PlayerBet();
                    winBet.setIcon(Client.MBet.TYPE_CHIP);
                    winBet.setText('$' + Client.StringHelper.shortenNumber(win));
                    winBet.expandToRight = true;
                    winBet.expand(true, true);
                    winBet.x = this._dealerCoords.x;
                    winBet.y = this._dealerCoords.y;
                    winBet.resize();
                    this.addChild(winBet);
                    var playerPos = this.toLocal(player.position, player);
                    Client.Tweener.to(winBet, 1.2, { x: playerPos.x + player.stackPos.x, y: playerPos.y + player.stackPos.y, onComplete: this.destroyChip, onCompleteParams: [winBet], onCompleteScope: this });
                }
            };
            Table.prototype.destroyChip = function (chip) {
                if (chip.parent)
                    chip.parent.removeChild(chip);
                chip.destroy();
            };
            Table.prototype.setSize = function (width, height) {
                this._w = width;
                this._h = height;
                var myPlayerWidth = height * this.MY_PLAYER_HEIGHT_KOEF;
                var playersWidth = height * this.PLAYER_HEIGHT_KOEF;
                var tableWidth = this._w * this.TABLE_WIDTH_KOEF;
                var tableHeight = this._h * this.TABLE_HEIGHT_KOEF;
                this._tableRect = new PIXI.Rectangle(this._w / 2 - tableWidth / 2, this._h * this.TABLE_TOP_OFFSET_KOEF, tableWidth, tableHeight);
                this._dealerCoords = new PIXI.Point(this._tableRect.x + this.DEALER_COORDS.x * this._tableRect.width, this._tableRect.y + this.DEALER_COORDS.y * this._tableRect.height);
                Client.PlayerBet.setIconSize(playersWidth / 5);
                Client.PlayerBase.setDealerIconSize(playersWidth / 5);
                this._potBet.resize();
                Client.TablePlace.setParams(this._tableRect, this.PLAYERS_IN_TOP_OFFSET_X, myPlayerWidth, playersWidth);
                this._potBet.x = this._dealerCoords.x;
                this._potBet.y = this._dealerCoords.y;
                for (var i = 0; i < this._places.length; i++)
                    this._places[i].resize();
            };
            Table.prototype.showWinState = function () {
                console.log("Can't support multiplayers winning");
                var hp = Client.Model.table.handRankinkResult.banks[0].players[0];
                for (var _i = 0, _a = this._players; _i < _a.length; _i++) {
                    var p = _a[_i];
                    p.updateWinState(hp);
                }
                if (this._myPlayer)
                    this._myPlayer.updateWinState(hp);
            };
            Table.prototype.reset = function () {
                var users = Client.Model.table.users.getAll(true);
                for (var i = 0; i < users.length; i++)
                    this.getPlayerById(users[i].id).hideWinAnimation();
                this.hidePot();
                this.hidePlayersCards();
                this.hideMyCards();
                this.updateDealer(Client.Model.table.dealer.id);
            };
            Table.prototype.clearGame = function () {
                if (this._myPlayer)
                    this._myPlayer.hideWinAnimation();
                this.hideMyCards();
                this.removeAllPlayers();
                this.hidePot();
                this.clearPlayersWaiting();
            };
            Table.prototype.getWidth = function () {
                return this._w;
            };
            Table.prototype.getHeight = function () {
                return this._h;
            };
            Table.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return Table;
        }(PIXI.Container));
        Client.Table = Table;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var RoundButton = (function (_super) {
            __extends(RoundButton, _super);
            function RoundButton(textureName) {
                var _this = _super.call(this, 50, 50) || this;
                _this._textureName = textureName;
                _this._sprite = new PIXI.Sprite();
                _this.addChild(_this._sprite);
                return _this;
            }
            RoundButton.getPreRenderedTexture = function (texId, from, state) {
                var id = texId + "_" + state.toString();
                var pairs = RoundButton._preRenderedTextures[id] || {};
                if (from == null)
                    return pairs.texture;
                var met = pairs.metrics || {};
                var indent = (met.width == from.width && met.height == from.height)
                    && (met.ref && met.ref.baseTexture.imageUrl == from.baseTexture.imageUrl)
                    && pairs.texture != null;
                var _bathedTex = null;
                if (indent) {
                    _bathedTex = pairs.texture;
                }
                else {
                    met.width = from.width;
                    met.height = from.height;
                    met.ref = from;
                    _bathedTex = RoundButton.generateTexture(from, state);
                }
                pairs.texture = _bathedTex;
                pairs.metrics = met;
                RoundButton._preRenderedTextures[id] = pairs;
                return _bathedTex;
            };
            RoundButton.generateTexture = function (base, state) {
                if (base == null)
                    return null;
                var c = new PIXI.Container();
                var tmp = new PIXI.Sprite(base);
                tmp.tint = state === Client.ButtonBase.STATE_DOWN ? RoundButton.colorDown : RoundButton.colorUP;
                var g = new PIXI.Graphics();
                g.beginFill(state === Client.ButtonBase.STATE_DOWN ? RoundButton.colorUP : RoundButton.colorDown);
                var radius = tmp.width / 2 * (1 - RoundButton.BORDER_KOEF);
                g.drawCircle(tmp.width * 0.5, tmp.width * 0.5, radius);
                g.endFill();
                c.addChild(g);
                c.addChild(tmp);
                var ret = Client.Config.renderer.generateTexture(c, PIXI.SCALE_MODES.LINEAR, Client.Config.renderer.resolution);
                c.destroy({ children: true });
                return ret;
            };
            Object.defineProperty(RoundButton.prototype, "state", {
                set: function (state) {
                    if (!this.interactive) {
                        this._curState = state;
                        this.onChangeState();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RoundButton.prototype, "currentState", {
                get: function () {
                    return this._curState;
                },
                enumerable: true,
                configurable: true
            });
            RoundButton.prototype.update = function () {
                var downX = 0;
                var downWidth = this._w;
                this._sprite.texture = RoundButton.getPreRenderedTexture(this._textureName, null, this._curState === Client.ButtonBase.STATE_DOWN ? Client.ButtonBase.STATE_DOWN : Client.ButtonBase.STATE_UP);
                this._sprite.x =
                    this._sprite.y = this._curState === Client.ButtonBase.STATE_DOWN
                        ? downX
                        : 0;
                this._sprite.height =
                    this._sprite.width = this._curState === Client.ButtonBase.STATE_DOWN
                        ? downWidth
                        : this._w;
            };
            RoundButton.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this.update();
            };
            RoundButton.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            RoundButton.prototype.setDiameter = function (value) {
                this.createTexture(value);
                this.setWidth(value);
                this.setHeight(value);
                this.update();
            };
            RoundButton.prototype.createTexture = function (value) {
                var tex = Client.Resources.getTexture(this._textureName, {
                    width: value,
                    drawNewTexture: true,
                });
                RoundButton.getPreRenderedTexture(this._textureName, tex, Client.ButtonBase.STATE_DOWN);
                this._sprite.texture = RoundButton.getPreRenderedTexture(this._textureName, tex, Client.ButtonBase.STATE_UP);
            };
            RoundButton.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._sprite.destroy();
            };
            RoundButton.prototype.drawBg = function () {
            };
            RoundButton.SCALE_OFFSET_KOEF = 0.025;
            RoundButton.BORDER_KOEF = 0.066;
            RoundButton.colorUP = 0xffffff;
            RoundButton.colorDown = 0;
            RoundButton._preRenderedTextures = {};
            return RoundButton;
        }(Client.ButtonBase));
        Client.RoundButton = RoundButton;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var AddFriendButton = (function (_super) {
            __extends(AddFriendButton, _super);
            function AddFriendButton() {
                return _super.call(this, 'lobby/add_user_icon') || this;
            }
            return AddFriendButton;
        }(Client.RoundButton));
        Client.AddFriendButton = AddFriendButton;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var PlayerParams = (function () {
            function PlayerParams(cardPosDegree, dealerPosDegree, betPosDegree, betExpantToRight, endCardsRotaion) {
                if (cardPosDegree === void 0) { cardPosDegree = 0; }
                if (dealerPosDegree === void 0) { dealerPosDegree = 0; }
                if (betPosDegree === void 0) { betPosDegree = 0; }
                if (betExpantToRight === void 0) { betExpantToRight = true; }
                if (endCardsRotaion === void 0) { endCardsRotaion = 0; }
                this.cardPosDegree = cardPosDegree;
                this.dealerPosDegree = dealerPosDegree;
                this.betPosDegree = betPosDegree;
                this.betExpantToRight = betExpantToRight;
                this.endCardsRotaion = endCardsRotaion;
            }
            return PlayerParams;
        }());
        var TablePlaceParams = (function () {
            function TablePlaceParams(x, y) {
                this.x = x;
                this.y = y;
            }
            return TablePlaceParams;
        }());
        var TablePlace = (function (_super) {
            __extends(TablePlace, _super);
            function TablePlace(index) {
                var _this = _super.call(this) || this;
                _this.player = null;
                _this.index = index;
                _this._btnAddPlayer = new Client.AddFriendButton();
                _this.addChild(_this._btnAddPlayer);
                _this._btnAddPlayer.setDiameter(TablePlace._playersWidth);
                _this._btnAddPlayer.setPosition(-TablePlace._playersWidth * 0.5, -TablePlace._playersWidth * 0.5);
                _this._btnAddPlayer.on(Client.ButtonBase.EVENT_CLICK, _this.onAddFriendClick, _this);
                _this._btnSeat = new Client.ButtonSeat();
                _this._btnSeat.on(Client.ButtonBase.EVENT_CLICK, _this.onSeatClick, _this);
                _this._btnSeat.setWidth(TablePlace._playersWidth);
                _this.addChild(_this._btnSeat);
                return _this;
            }
            TablePlace.setParams = function (tableRect, playersInTopOffsetXKoef, myPlayerWidth, playersWidth) {
                TablePlace._tableRect = tableRect;
                TablePlace._myPlayerWidth = myPlayerWidth;
                TablePlace._playersWidth = playersWidth;
                TablePlace._placesParams = [
                    new TablePlaceParams(0.5, 1.15),
                    new TablePlaceParams(0, 1),
                    new TablePlaceParams(playersInTopOffsetXKoef, 0),
                    new TablePlaceParams(1 - playersInTopOffsetXKoef, 0),
                    new TablePlaceParams(1, 1)
                ];
            };
            TablePlace.prototype.setSeatCallback = function (callback) {
                this._seatCallback = callback;
            };
            TablePlace.prototype.setAddFriendCallback = function (callback) {
                this._addFriendCallback = callback;
            };
            TablePlace.prototype.setIndex = function (index) {
                this.index = index;
                var params = TablePlace._playersParams[this.index];
                if (this.player)
                    this.player.setParams(params.cardPosDegree, params.dealerPosDegree, params.betPosDegree, params.betExpantToRight, params.endCardsRotaion);
            };
            TablePlace.prototype.setSeat = function (seatId) {
                this.seatId = seatId;
            };
            TablePlace.prototype.onSeatClick = function () {
                this._seatCallback(this.seatId);
            };
            TablePlace.prototype.onAddFriendClick = function () {
                this._addFriendCallback(this.seatId);
            };
            TablePlace.prototype.setMPlayer = function (mPlayer) {
                if (mPlayer.isMe)
                    this.player = new Client.MyPlayer(mPlayer);
                else {
                    var params = TablePlace._playersParams[this.index];
                    this.player = new Client.Player(mPlayer, params.cardPosDegree, params.dealerPosDegree, params.betPosDegree, params.betExpantToRight, params.endCardsRotaion);
                }
                this.addChild(this.player);
                this.player.setAvatarSize(this.index == 0 ? TablePlace._myPlayerWidth : TablePlace._playersWidth);
                return this.player;
            };
            TablePlace.prototype.removePlayer = function () {
                var pl = this.player;
                if (this.player) {
                    if (this.player.parent)
                        this.player.parent.removeChild(this.player);
                    this.player = null;
                }
                return pl;
            };
            TablePlace.prototype.updateButtons = function (showSeats) {
                this._btnSeat.visible = this._btnSeat.interactive = showSeats && !this.player;
                this._btnAddPlayer.visible = this._btnAddPlayer.interactive = !showSeats && !this.player;
            };
            TablePlace.prototype.resize = function () {
                if (!TablePlace._placesParams)
                    return;
                this.x = TablePlace._tableRect.x + TablePlace._tableRect.width * TablePlace._placesParams[this.index].x;
                this.y = TablePlace._tableRect.y + TablePlace._tableRect.height * TablePlace._placesParams[this.index].y;
                if (this.player)
                    this.player.setAvatarSize(this.index == 0 ? TablePlace._myPlayerWidth : TablePlace._playersWidth);
                this._btnAddPlayer.setDiameter(TablePlace._playersWidth);
                this._btnAddPlayer.setPosition(-TablePlace._playersWidth * 0.5, -TablePlace._playersWidth * 0.5);
                this._btnSeat.setWidth(TablePlace._playersWidth);
            };
            TablePlace.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._btnSeat.destroy();
                this._btnAddPlayer.destroy();
            };
            TablePlace._tableRect = new PIXI.Rectangle(0, 0, 10, 10);
            TablePlace._myPlayerWidth = 10;
            TablePlace._playersWidth = 10;
            TablePlace._playersParams = [
                new PlayerParams(),
                new PlayerParams(45, 65, 0, true, Math.PI * (1 / 5)),
                new PlayerParams(140, 104, 180, true, Math.PI * (-1 / 6)),
                new PlayerParams(-140, -104, 180, false, Math.PI * (-5 / 6)),
                new PlayerParams(-45, -65, 0, false, Math.PI * (4 / 5))
            ];
            return TablePlace;
        }(PIXI.Container));
        Client.TablePlace = TablePlace;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MiniCard = (function (_super) {
            __extends(MiniCard, _super);
            function MiniCard(height) {
                var _this = _super.call(this) || this;
                var texture = MiniCard.createBgTexture(height);
                _this._bg = new PIXI.Sprite(texture);
                _this.addChild(_this._bg);
                var font = Client.FontsHelper.Text.fontWhiteStroke26;
                font.strokeThickness = 0;
                font.fontSize = height * 0.6;
                _this._label = new PIXI.Text("A", font);
                _this._label.tint = WinLabelWithCards.LABEL_TINT;
                _this._label.anchor.set(0.5, 0.5);
                _this._label.x = _this._bg.width * 0.5;
                _this._label.y = _this._bg.height * 0.5;
                _this.addChild(_this._label);
                return _this;
            }
            MiniCard.createBgTexture = function (height) {
                if (!this._bgTexture) {
                    var w = height / 1.4;
                    var g = new PIXI.Graphics();
                    var thinkness = (height / 15 >> 0);
                    g.lineStyle(thinkness, WinLabelWithCards.BORDER_TINT);
                    g.beginFill(WinLabelWithCards.BG_TINT);
                    g.drawRoundedRect(0, 0, w, height, thinkness);
                    g.endFill();
                    this._bgTexture = g.generateCanvasTexture();
                    g.destroy();
                }
                return this._bgTexture;
            };
            MiniCard.destroyBgTexture = function () {
                if (MiniCard._bgTexture)
                    MiniCard._bgTexture.destroy();
                MiniCard._bgTexture = null;
            };
            MiniCard.prototype.setCardWeight = function (weight) {
                weight = weight.toUpperCase();
                this._label.text = weight == 'T' ? '10' : weight;
                this._label.scale.x = weight == 'T' ? 0.7 : 1;
            };
            MiniCard.prototype.getWidth = function () {
                return this._bg.width;
            };
            MiniCard.prototype.destroy = function () {
                this._bg.destroy();
                this._label.destroy();
            };
            return MiniCard;
        }(PIXI.Container));
        var MiniCardGroup = (function (_super) {
            __extends(MiniCardGroup, _super);
            function MiniCardGroup() {
                var _this = _super.call(this) || this;
                _this.showedCards = 0;
                _this._calculatedWidth = 0;
                _this._miniCards = [];
                return _this;
            }
            MiniCardGroup.prototype.show = function (reason, cards) {
                this.showedCards = 0;
                this._calculatedWidth = 0;
                var accumX = 0;
                for (var i = 0; i < this._miniCards.length; i++) {
                    var card = this._miniCards[i];
                    if (i < cards.length) {
                        card.visible = true;
                        card.setCardWeight(cards[i].weight);
                        this.showedCards++;
                        card.x = accumX;
                        this._calculatedWidth = accumX + card.getWidth();
                        switch (reason) {
                            case Client.HandRankCombination.OnePair:
                            case Client.HandRankCombination.ThreeKind:
                                if (i == cards.length - 1) {
                                    accumX += card.getWidth() * 1.1;
                                }
                                break;
                            case Client.HandRankCombination.TwoPair:
                                if ((i + 1) % 2 === 0) {
                                    accumX += card.getWidth() * 1.1;
                                }
                                else {
                                    accumX += card.getWidth() * 0.2;
                                }
                                break;
                            default:
                                accumX += card.getWidth() * 1.1;
                        }
                    }
                    else
                        card.visible = false;
                }
            };
            MiniCardGroup.prototype.create = function (height) {
                while (this._miniCards.length > 0) {
                    if (this._miniCards[0].parent)
                        this._miniCards[0].parent.removeChild(this._miniCards[0]);
                    this._miniCards[0].destroy();
                    this._miniCards.shift();
                }
                var card;
                for (var i = 0; i < 7; i++) {
                    card = new MiniCard(height);
                    this._miniCards.push(card);
                    this.addChild(card);
                }
            };
            Object.defineProperty(MiniCardGroup.prototype, "visibelWidth", {
                get: function () {
                    return this._calculatedWidth;
                },
                enumerable: true,
                configurable: true
            });
            MiniCardGroup.CARD_OFFSET = 0.1;
            return MiniCardGroup;
        }(PIXI.Container));
        Client.MiniCardGroup = MiniCardGroup;
        var WinLabelWithCards = (function (_super) {
            __extends(WinLabelWithCards, _super);
            function WinLabelWithCards() {
                var _this = _super.call(this) || this;
                _this._mainCards = new MiniCardGroup();
                _this._kickerCards = new MiniCardGroup();
                _this._bg = new PIXI.Sprite(PIXI.Texture.WHITE);
                _this.addChild(_this._bg);
                _this.mask = new PIXI.Sprite(Client.Resources.getTexture("winning/line_mask"));
                _this.addChild(_this.mask);
                _this._font = Object.create(Client.FontsHelper.Text.fontWhiteStroke26);
                _this._font.strokeThickness = 0;
                _this._font.fontSize = 38;
                _this._mainLabel = new PIXI.Text("PAIR", _this._font);
                _this._realLabelH = _this._mainLabel.height;
                _this._mainLabel.tint = WinLabelWithCards.TEXT_TINT;
                _this.addChild(_this._mainLabel);
                _this._kickerLabel = new PIXI.Text("+ KICKER", _this._font);
                _this._kickerLabel.tint = WinLabelWithCards.TEXT_TINT;
                _this.addChild(_this._kickerLabel);
                _this.mask.anchor.x = 0.5;
                _this._bg.anchor.x = 0.5;
                _this._mainLabel.anchor.x = 1;
                _this.addChild(_this._mainCards);
                _this.addChild(_this._kickerCards);
                return _this;
            }
            WinLabelWithCards.prototype.show = function (reason, cards, kickers) {
                cards = cards.sort(function (first, second) {
                    return (first.weightIndex - second.weightIndex);
                });
                if (!kickers)
                    kickers = [];
                kickers = kickers.sort(function (first, second) {
                    return (first.weightIndex - second.weightIndex);
                });
                var hasKickers = kickers.length > 0;
                this._mainLabel.text = WinLabelWithCards.COMBINATION_NAMINGS[reason - 1].toUpperCase();
                this._mainCards.show(reason, cards);
                if (hasKickers)
                    this._kickerCards.show(Client.HandRankCombination.HighCard, kickers);
                this._kickerCards.visible = hasKickers;
                this._kickerLabel.visible = hasKickers;
                var fullw = this._mainCards.visibelWidth + this._mainLabel.width + 10;
                if (hasKickers)
                    fullw += 20 + this._kickerLabel.width + this._kickerCards.visibelWidth;
                this._mainLabel.x = this._mainLabel.width - fullw / 2 - 5;
                this._mainCards.x = this._mainLabel.x + 10;
                this._kickerLabel.x = this._mainCards.visibelWidth + this._mainCards.x + 10;
                this._kickerCards.x = this._kickerLabel.x + this._kickerLabel.width + 10;
                this.visible = true;
                this.mask.width = 0;
                Client.Tweener.to(this.mask, WinLabelWithCards.ANIM_DUTRATION, {
                    pixi: {
                        width: this._bg.width
                    }
                });
            };
            WinLabelWithCards.prototype.hide = function () {
                var _this = this;
                Client.Tweener.to(this.mask, WinLabelWithCards.ANIM_DUTRATION, {
                    pixi: {
                        width: 0,
                    },
                    onComplete: function () {
                        _this.visible = false;
                    }
                });
            };
            WinLabelWithCards.prototype.setWidth = function (value, aspect) {
                var tex = Client.Resources.getTexture("winning/line_pattern", { width: value, returnNewTexture: true });
                this._bg.texture = tex;
                this.createCards();
                this.refresh();
            };
            WinLabelWithCards.prototype.refresh = function () {
                this.mask.height = this._bg.height;
                this.mask.y = this._bg.y;
                this.mask.width = this._bg.width;
                this.mask.x = this._bg.x;
                this._mainLabel.scale.set(0.4 * this._bg.height / this._realLabelH, 0.8 * this._bg.height / this._realLabelH);
                this._kickerLabel.scale.copy(this._mainLabel.scale);
                this._mainLabel.y = (this._bg.height - this._mainLabel.height) * 0.5;
                this._kickerLabel.y = this._mainLabel.y;
            };
            WinLabelWithCards.prototype.createCards = function () {
                MiniCard.destroyBgTexture();
                var h = 0.6 * this._bg.height;
                this._mainCards.create(h);
                this._kickerCards.create(h);
                this._kickerCards.y = (this._bg.height - h) * 0.5;
                this._mainCards.y = this._kickerCards.y;
            };
            WinLabelWithCards.ANIM_DUTRATION = 0.5;
            WinLabelWithCards.TEXT_TINT = 0xffd948;
            WinLabelWithCards.BG_TINT = 0x652631;
            WinLabelWithCards.BORDER_TINT = 0xeb9848;
            WinLabelWithCards.LABEL_TINT = 0xebd7a4;
            WinLabelWithCards.COMBINATION_NAMINGS = [
                'Kicker',
                'Pair',
                'Two Pairs',
                'Three of a Kind',
                'Straight',
                'Flush',
                'Full House',
                'Four of a Kind',
                'Straight Flush',
                'Royal Flush'
            ];
            return WinLabelWithCards;
        }(PIXI.Container));
        Client.WinLabelWithCards = WinLabelWithCards;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var WinLabel = (function (_super) {
            __extends(WinLabel, _super);
            function WinLabel() {
                var _this = _super.call(this) || this;
                _this._aspect = 10 / 2;
                _this.name = "WinLabel";
                var texture = PIXI.Texture.WHITE;
                _this.bg = new PIXI.Sprite(texture);
                _this.height = 20;
                _this.label = new PIXI.Text("WINNER", Client.FontsHelper.Text.fontForSettingsHeader);
                _this.label.tint = 0;
                _this.addChild(_this.bg);
                _this.addChild(_this.label);
                _this.text = "WINNER";
                _this.update();
                return _this;
            }
            Object.defineProperty(WinLabel.prototype, "text", {
                get: function () {
                    return this._text;
                },
                set: function (_t) {
                    this._text = _t;
                    this.label.text = this._text;
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            WinLabel.prototype.update = function () {
                this.label.x = (this.width / this.scale.x - this.label.width) * 0.5;
                this.label.y = (this.height / this.scale.y - this.label.height) * 0.5;
            };
            WinLabel.prototype.setWidth = function (value, aspect) {
                if (aspect === void 0) { aspect = null; }
                this.label.height = this.bg.height - 8;
                this.label.width = this.label.scale.y;
            };
            WinLabel.prototype.destroy = function () {
                this.label.destroy();
                this.bg.destroy();
            };
            return WinLabel;
        }(PIXI.Container));
        Client.WinLabel = WinLabel;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var WinPlayerBGEffect = (function (_super) {
            __extends(WinPlayerBGEffect, _super);
            function WinPlayerBGEffect() {
                var _this = _super.call(this) || this;
                _this.RING_SIZE = 400;
                _this.RECT = 600;
                _this.ANIMS = {
                    fadeIn: [0, 11],
                    loop: [11, 38],
                    fadeOut: [38, 59]
                };
                _this._visible = true;
                _this._wasDestroyed = false;
                Client.EffectManager.getEffect("Avatar", function (clip) {
                    _this._clip = clip;
                    _this._clip.selfAdvance = false;
                    _this._clip.loop = false;
                    _this.addChild(_this._clip);
                    var _sc = 2 * _this._targetW / _this.RING_SIZE;
                    _this._clip.scale.set(_sc);
                    _this._clip.position.x = -_this.RECT * _sc * 0.5;
                    _this._clip.position.y = -_this.RECT * _sc * 0.5;
                    _this.visible = false;
                });
                return _this;
            }
            WinPlayerBGEffect.prototype.show = function () {
                var _this = this;
                this.visible = true;
                if (!this._clip)
                    return;
                this._clip.selfAdvance = true;
                PIXI.animate.Animator.fromTo(this._clip, this.ANIMS.fadeIn[0], this.ANIMS.fadeIn[1], false, function () {
                    PIXI.animate.Animator.fromTo(_this._clip, _this.ANIMS.loop[0], _this.ANIMS.loop[1], true);
                });
            };
            WinPlayerBGEffect.prototype.hide = function () {
                var _this = this;
                if (this._wasDestroyed || !this.visible)
                    return;
                if (!this._clip) {
                    this.visible = false;
                    return;
                }
                PIXI.animate.Animator.fromTo(this._clip, this.ANIMS.fadeOut[0], this.ANIMS.fadeOut[1], false, function () {
                    _this.visible = false;
                    _this._clip.selfAdvance = false;
                });
            };
            WinPlayerBGEffect.prototype.setWidth = function (value) {
                this._targetW = value;
                if (this._clip) {
                    var _sc = 2 * this._targetW / this.RING_SIZE;
                    this._clip.scale.set(_sc);
                    this._clip.position.x = -this.RECT * _sc * 0.5;
                    this._clip.position.y = -this.RECT * _sc * 0.5;
                }
            };
            WinPlayerBGEffect.prototype.destroy = function () {
                this._wasDestroyed = true;
                PIXI.animate.Animator.stop(this._clip);
                this._clip.destroy();
            };
            return WinPlayerBGEffect;
        }(PIXI.Container));
        Client.WinPlayerBGEffect = WinPlayerBGEffect;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BuyIntoGamePopup = (function (_super) {
            __extends(BuyIntoGamePopup, _super);
            function BuyIntoGamePopup() {
                var _this = _super.call(this) || this;
                _this.BUTTON_WIDTH_KOEF = 0.3;
                _this.BUTTON_HEIGHT_KOEF = 0.185;
                _this.BUTTON_TOP_OFFSET = 0.736;
                _this.BUTTONS_INTERVAL_KOEF = 0.08;
                _this.HEADER_FONT_SIZE_KOEF = 0.18;
                _this.HEADER_TOP_OFFSET = 0.1;
                _this.CLOSE_BUTTON_DIAMETER_KOEF = 0.076;
                _this.init();
                return _this;
            }
            BuyIntoGamePopup.prototype.getWidth = function () {
                return this._w;
            };
            BuyIntoGamePopup.prototype.getHeight = function () {
                return this._h;
            };
            BuyIntoGamePopup.prototype.setSize = function (width, height) {
                this._h = height;
                this._w = width;
                this.update();
            };
            BuyIntoGamePopup.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._okButton.destroy();
                this._exitButton.destroy();
                this._header.destroy();
            };
            BuyIntoGamePopup.prototype.init = function () {
                var _this = this;
                this._bg = new Client.BuyIntoGamePopupBg();
                this.addChild(this._bg);
                this._okButton = new Client.BuyIntoGamePopupButton('Buy into game');
                this._okButton.on(Client.BuyIntoGamePopupButton.EVENT_CLICK, function () {
                    _this.emit(BuyIntoGamePopup.EVENT_OK);
                });
                this.addChild(this._okButton);
                this._exitButton = new Client.BuyIntoGamePopupButton('Exit to lobby');
                this._exitButton.on(Client.BuyIntoGamePopupButton.EVENT_CLICK, function () {
                    _this.emit(BuyIntoGamePopup.EVENT_EXIT);
                });
                this._exitButton.tint = 0xcccccc;
                this.addChild(this._exitButton);
                this._closeButton = new Client.ButtonImage('lobby/reward_video/close_button', 'lobby/reward_video/close_button', 'lobby/reward_video/close_button_down');
                this._closeButton.on(Client.ButtonImage.EVENT_CLICK, function () {
                    _this.emit(BuyIntoGamePopup.EVENT_CLOSE);
                });
                this.addChild(this._closeButton);
                this._header = new Client.Text(BuyIntoGamePopup.HEADER_TEXT_TEMPLATE, Client.FontsHelper.Text.fontForRewardVideoPopupHeader);
                this.addChild(this._header);
            };
            BuyIntoGamePopup.prototype.update = function () {
                var x = 0, y = 0, w = this._w, h = this._h;
                this._bg.setPosition(x, y);
                this._bg.setSize(w, h);
                var buttonWidth = w * this.BUTTON_WIDTH_KOEF, buttonHeight = h * this.BUTTON_HEIGHT_KOEF;
                this._okButton.y = h * this.BUTTON_TOP_OFFSET;
                this._exitButton.y = h * this.BUTTON_TOP_OFFSET;
                this._okButton.setWidth(buttonWidth);
                this._okButton.setHeight(buttonHeight);
                this._exitButton.setWidth(buttonWidth);
                this._exitButton.setHeight(buttonHeight);
                var fullButtonsWidth = buttonWidth * 2 + h * this.BUTTONS_INTERVAL_KOEF;
                this._okButton.x = w / 2 + fullButtonsWidth / 2 - buttonWidth;
                this._exitButton.x = w / 2 - fullButtonsWidth / 2;
                var closeButtonDiameter = w * this.CLOSE_BUTTON_DIAMETER_KOEF;
                this._closeButton.x = w - closeButtonDiameter / 4 * 3;
                this._closeButton.y = 0 - closeButtonDiameter / 4 * 1;
                this._closeButton.setWidth(closeButtonDiameter, true);
                this._header.fontSize = h * this.HEADER_FONT_SIZE_KOEF;
                var headerX = w / 2 - this._header.width / 2, headerY = h * this.HEADER_TOP_OFFSET;
                this._header.position.set(headerX, headerY);
            };
            BuyIntoGamePopup.EVENT_CLOSE = 'buyintogamepopupclose';
            BuyIntoGamePopup.EVENT_OK = 'buyintogamepopupok';
            BuyIntoGamePopup.EVENT_EXIT = 'buyintogamepopupexit';
            BuyIntoGamePopup.HEADER_TEXT_TEMPLATE = 'BUY INTO GAME';
            return BuyIntoGamePopup;
        }(PIXI.Container));
        Client.BuyIntoGamePopup = BuyIntoGamePopup;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BuyIntoGamePopupBg = (function (_super) {
            __extends(BuyIntoGamePopupBg, _super);
            function BuyIntoGamePopupBg() {
                var _this = _super.call(this) || this;
                _this.interactive = true;
                _this._bgSprite = new PIXI.Sprite();
                _this.addChild(_this._bgSprite);
                _this._bgMask = new PIXI.Graphics();
                return _this;
            }
            BuyIntoGamePopupBg.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            BuyIntoGamePopupBg.prototype.setSize = function (width, height) {
                this._w = width;
                this._h = height;
                this.update();
            };
            BuyIntoGamePopupBg.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bgSprite.destroy();
                this._bgMask.destroy();
            };
            BuyIntoGamePopupBg.prototype.update = function () {
                this.resizeBg();
            };
            BuyIntoGamePopupBg.prototype.resizeBg = function () {
                var origRect = Client.Resources.getOrigSize(Client.Resources
                    .getTexture(BuyIntoGamePopupBg.BG_TEXTURE_NAME)
                    .baseTexture);
                this._bgSprite.texture = Client.Resources.getTexture(BuyIntoGamePopupBg.BG_TEXTURE_NAME, {
                    scale: this._h / origRect.height,
                    drawNewTexture: true,
                });
                this._bgSprite.width = this._w;
                this._bgSprite.height = this._h;
                var offset = this._h * 0.019;
                this._bgMask.clear();
                this._bgMask.beginFill(0xcccccc);
                this._bgMask.drawRect(offset, offset, this._w - 2 * offset, this._h - 2 * offset);
                this._bgMask.endFill();
            };
            BuyIntoGamePopupBg.BG_TEXTURE_NAME = 'lobby/reward_video/bg';
            BuyIntoGamePopupBg.BORDER_OFFSET_X_KOEF = 0.041;
            BuyIntoGamePopupBg.BORDER_OFFSET_Y_KOEF = 0.027;
            BuyIntoGamePopupBg.SHADOW_OFFSET_KOEF = 0.02;
            return BuyIntoGamePopupBg;
        }(PIXI.Container));
        Client.BuyIntoGamePopupBg = BuyIntoGamePopupBg;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BuyIntoGamePopupButton = (function (_super) {
            __extends(BuyIntoGamePopupButton, _super);
            function BuyIntoGamePopupButton(text) {
                var _this = _super.call(this, 10, 10) || this;
                _this._colorUp = 0x930616;
                _this._colorDown = 0xb10616;
                _this._bg = new PIXI.Sprite();
                _this.addChild(_this._bg);
                _this._label = new Client.Text(text, Client.FontsHelper.Text.fontForButtonBet);
                _this.addChild(_this._label);
                return _this;
            }
            Object.defineProperty(BuyIntoGamePopupButton.prototype, "currentState", {
                get: function () {
                    return this._curState;
                },
                enumerable: true,
                configurable: true
            });
            BuyIntoGamePopupButton.prototype.onResize = function () {
                this._label.fontSize = Math.min(5, (this._h * BuyIntoGamePopupButton.CAPTION_FONT_SIZE_KOEF) >> 0);
                this._label.x = (this._w / 2 - this._label.width / 2) >> 0;
                this._label.y = (this._h / 2 - this._label.height / 2) >> 0;
                this.resizeBg();
            };
            Object.defineProperty(BuyIntoGamePopupButton.prototype, "tint", {
                set: function (value) {
                    this._bg.tint = value;
                },
                enumerable: true,
                configurable: true
            });
            BuyIntoGamePopupButton.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this.onResize();
            };
            BuyIntoGamePopupButton.prototype.setWidth = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setWidth.call(this, value, saveProportions);
                this.onResize();
            };
            BuyIntoGamePopupButton.prototype.setHeight = function (value, saveProportions) {
                if (saveProportions === void 0) { saveProportions = false; }
                _super.prototype.setHeight.call(this, value, saveProportions);
                this.onResize();
            };
            BuyIntoGamePopupButton.prototype.resizeBg = function () {
                var downX = this._w * BuyIntoGamePopupButton.SCALE_X_KOEF, downY = this._h * BuyIntoGamePopupButton.SCALE_Y_KOEF, downWidth = this._w * (1 - 2 * BuyIntoGamePopupButton.SCALE_X_KOEF), downHeight = this._h * (1 - 2 * BuyIntoGamePopupButton.SCALE_Y_KOEF);
                var bgX = this._curState === BuyIntoGamePopupButton.STATE_DOWN ? downX : 0, bgY = this._curState === BuyIntoGamePopupButton.STATE_DOWN ? downY : 0, bgWidth = this._curState === BuyIntoGamePopupButton.STATE_DOWN ? downWidth : this._w, bgHeight = this._curState === BuyIntoGamePopupButton.STATE_DOWN ? downHeight : this._h;
                var textureName = 'lobby/reward_video/button';
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(textureName).baseTexture);
                var scale = bgWidth / origRect.width;
                this._bg.texture = Client.Resources.getTexture(textureName, {
                    scale: scale,
                    drawNewTexture: true,
                });
                this._bg.x = bgX;
                this._bg.y = bgY;
                this._bg.width = bgWidth;
                this._bg.height = bgHeight;
            };
            BuyIntoGamePopupButton.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._label.destroy();
            };
            BuyIntoGamePopupButton.CAPTION_FONT_SIZE_KOEF = 0.35;
            BuyIntoGamePopupButton.CAPTION_LEFT_OFFSET = 0.483;
            BuyIntoGamePopupButton.SCALE_X_KOEF = 0.025;
            BuyIntoGamePopupButton.SCALE_Y_KOEF = 0.075;
            BuyIntoGamePopupButton.BG_COLOR = 0x13849f;
            return BuyIntoGamePopupButton;
        }(Client.ButtonBase));
        Client.BuyIntoGamePopupButton = BuyIntoGamePopupButton;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var HightliteState;
        (function (HightliteState) {
            HightliteState[HightliteState["NONE"] = 0] = "NONE";
            HightliteState[HightliteState["HIGHLIGHT"] = 1] = "HIGHLIGHT";
            HightliteState[HightliteState["LOWLIGHT"] = 2] = "LOWLIGHT";
        })(HightliteState = Client.HightliteState || (Client.HightliteState = {}));
        var BoardCard = (function (_super) {
            __extends(BoardCard, _super);
            function BoardCard() {
                var _this = _super.call(this) || this;
                _this._w = 100;
                _this._h = 140;
                _this._showed = false;
                _this._showShadow = true;
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_back').baseTexture);
                _this._w = origRect.width;
                _this._h = origRect.height;
                _this._cardShadow = new Client.BoardCardShadow();
                _this._cardShadow.tint = 0;
                _this.addChild(_this._cardShadow);
                _this._cardFace = new PIXI.Container();
                _this.addChild(_this._cardFace);
                _this._face = new PIXI.Sprite();
                _this._cardFace.addChild(_this._face);
                _this._imageCont = new PIXI.Container();
                _this._cardFace.addChild(_this._imageCont);
                _this._cardBack = new PIXI.Sprite();
                _this.addChild(_this._cardBack);
                _this._cardFace.visible = _this._showed;
                _this._cardBack.visible = !_this._showed;
                _this.pivot.set(_this._w / 2, _this._h / 2);
                return _this;
            }
            BoardCard.prototype.setMCard = function (mCard) {
                this.highlight(HightliteState.NONE);
                if (!mCard)
                    return;
                this._mCard = mCard;
                this.clearFace();
                var origRect;
                var scale;
                var rect;
                var sprite;
                origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_' + this._mCard.weight).baseTexture);
                scale = this._h / BoardCard.WEIGHT_HEIGHT_KOEF / origRect.height;
                rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                this._spriteWeight = new PIXI.Sprite(Client.Resources.getTexture('card_' + this._mCard.weight, { scale: scale, drawNewTexture: true }, 'BoardCard'));
                this._spriteWeight.width = rect.width;
                this._spriteWeight.height = rect.height;
                this._spriteWeight.x = this._w / 10;
                this._spriteWeight.y = this._h / 20;
                if (this._mCard.suit == 's' || this._mCard.suit == 'c')
                    this._spriteWeight.tint = 0;
                this._imageCont.addChild(this._spriteWeight);
                origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_' + this._mCard.suit).baseTexture);
                scale = this._h / BoardCard.SUIT_HEIGHT_KOEF / origRect.height;
                rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                sprite = new PIXI.Sprite(Client.Resources.getTexture('card_' + this._mCard.suit, { scale: scale, drawNewTexture: true }, 'BoardCard'));
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.x = this._w / 10;
                sprite.y = this._h / 3.1;
                this._imageCont.addChild(sprite);
                origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(this._mCard.imageName).baseTexture);
                scale = this._w / BoardCard.IMAGE_WIDTH_KOEF / origRect.width;
                rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                sprite = new PIXI.Sprite(Client.Resources.getTexture(this._mCard.imageName, { scale: scale, drawNewTexture: true }, 'BoardCard'));
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.x = this._w - sprite.width - this._w / 20;
                sprite.y = this._h - sprite.height - this._h / 20;
                this._imageCont.addChild(sprite);
            };
            BoardCard.prototype.clearFace = function () {
                var displ;
                while (this._imageCont.children.length > 0) {
                    displ = this._imageCont.removeChildAt(0);
                    displ.destroy();
                }
            };
            Object.defineProperty(BoardCard.prototype, "showShadow", {
                set: function (value) {
                    this._showShadow = value;
                    this._cardShadow.visible = value;
                },
                enumerable: true,
                configurable: true
            });
            BoardCard.prototype.showCard = function (show, immediate) {
                if (immediate === void 0) { immediate = false; }
                if (this._showed == show)
                    return;
                Client.Tweener.killTweensOf(this);
                this._showed = show;
                if (immediate) {
                    this._cardFace.visible = this._showed;
                    this._cardBack.visible = !this._showed;
                }
                else
                    Client.Tweener.to(this.scale, 0.2, { x: 0, onComplete: this.onCompleteFirstAnim, onCompleteScope: this });
            };
            BoardCard.prototype.onCompleteFirstAnim = function () {
                this._cardFace.visible = this._showed;
                this._cardBack.visible = !this._showed;
                Client.Tweener.to(this.scale, 0.2, { x: 1 });
            };
            BoardCard.prototype.onClick = function () {
                this.showCard(!this._showed);
            };
            BoardCard.prototype.onResize = function () {
                Client.Tweener.killTweensOf(this);
                Client.Tweener.killTweensOf(this.scale);
                this.scale.x = 1;
                this._face.texture = Client.Resources.getTexture('card_face', { width: this._w, drawNewTexture: true }, 'BoardCard');
                var _backTexture = Client.Resources.getTexture('card_back', { width: this._w, drawNewTexture: true }, 'BoardCard');
                this._cardBack.texture = _backTexture;
                this._cardShadow.changeTexture(_backTexture);
                this._face.width = this._cardBack.width = this._w;
                this._face.height = this._cardBack.height = this._h;
                this._cardShadow.width = this._w * BoardCard.SHADOW_SCALE_KOEF;
                this._cardShadow.height = this._h * BoardCard.SHADOW_SCALE_KOEF;
                this._cardShadow.x = -(this._cardShadow.width - this._w) * 0.5;
                this._cardShadow.y = -(this._cardShadow.height - this._h) * 0.5;
                this.setMCard(this._mCard);
                this.pivot.set(this._w * 0.5, this._h * 0.5);
                this.showCard(this._showed, true);
            };
            BoardCard.prototype.getWidth = function () {
                return this._w;
            };
            BoardCard.prototype.setWidth = function (value) {
                var scale = value / this._w;
                this._w = value;
                this._h *= scale;
                this.onResize();
            };
            BoardCard.prototype.getHeight = function () {
                return this._h;
            };
            BoardCard.prototype.setHeight = function (value) {
                var scale = value / this._h;
                this._h = value;
                this._w *= scale;
                this.onResize();
            };
            BoardCard.prototype.highlight = function (hightlight) {
                var faceTint = 0xFFFFFF;
                switch (hightlight) {
                    case HightliteState.NONE: {
                        this.showShadow = true;
                        this._cardShadow.tint = 0;
                        this._cardShadow.blendMode = PIXI.BLEND_MODES.NORMAL;
                        this._cardShadow.alpha = 0.5;
                        break;
                    }
                    case HightliteState.HIGHLIGHT: {
                        this.showShadow = true;
                        this._cardShadow.tint = BoardCard.HIGHTLIGHT_COLOR;
                        this._cardShadow.blendMode = PIXI.BLEND_MODES.ADD;
                        this._cardShadow.alpha = 1;
                        break;
                    }
                    case HightliteState.LOWLIGHT: {
                        this.highlight(HightliteState.NONE);
                        faceTint = BoardCard.LOWLIGHT_COLOR;
                        break;
                    }
                }
                this._face.tint = faceTint;
                for (var _i = 0, _a = this._imageCont.children; _i < _a.length; _i++) {
                    var img = _a[_i];
                    img.tint = faceTint;
                }
                if (this._spriteWeight && this._mCard && (this._mCard.suit == 's' || this._mCard.suit == 'c'))
                    this._spriteWeight.tint = 0;
            };
            BoardCard.prototype.destroy = function () {
                Client.Tweener.killTweensOf(this);
                Client.Tweener.killTweensOf(this.scale);
                this.clearFace();
                this._cardFace.destroy();
                this._cardBack.destroy();
                this._cardShadow.destroy();
                this._face.destroy();
                this._imageCont.destroy();
                _super.prototype.destroy.call(this);
            };
            BoardCard.HIGHTLIGHT_COLOR = 0xffea07;
            BoardCard.LOWLIGHT_COLOR = 0x666666;
            BoardCard.BACK_SCALE_KOEF = 1.3;
            BoardCard.SHADOW_SCALE_KOEF = 1.28;
            BoardCard.WEIGHT_HEIGHT_KOEF = 3.8;
            BoardCard.SUIT_HEIGHT_KOEF = 5;
            BoardCard.IMAGE_WIDTH_KOEF = 1.4;
            return BoardCard;
        }(PIXI.Container));
        Client.BoardCard = BoardCard;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BoardCard2 = (function (_super) {
            __extends(BoardCard2, _super);
            function BoardCard2() {
                var _this = _super.call(this) || this;
                _this._w = 100;
                _this._h = 140;
                _this._showed = false;
                _this._showShadow = true;
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_back').baseTexture);
                _this._w = origRect.width;
                _this._h = origRect.height;
                _this._cardShadow = new PIXI.Sprite();
                _this._cardShadow.tint = 0;
                _this.addChild(_this._cardShadow);
                _this._cardFace = new PIXI.Container();
                _this.addChild(_this._cardFace);
                _this._face = new PIXI.Sprite();
                _this._cardFace.addChild(_this._face);
                _this._imageCont = new PIXI.Container();
                _this._cardFace.addChild(_this._imageCont);
                _this._cardBack = new PIXI.Sprite();
                _this.addChild(_this._cardBack);
                _this._cardFace.visible = _this._showed;
                _this._cardBack.visible = !_this._showed;
                _this.pivot.set(_this._w / 2, _this._h / 2);
                return _this;
            }
            BoardCard2.generateTexturesCardByWidth = function (width) {
                var time = new Date().getTime();
                width *= BoardCard2.BACK_SCALE_KOEF;
                var rendererTex;
                BoardCard2._texturesHash = {};
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_back').baseTexture);
                var rect = new PIXI.Rectangle(0, 0, width, width / origRect.width * origRect.height);
                rendererTex = Client.Resources.getTexture('card_back', { width: width, drawNewTexture: true });
                BoardCard2._texturesHash['card_back'] = rendererTex;
                rendererTex = Client.Resources.getTexture('card_face', { width: width, drawNewTexture: true });
                BoardCard2._texturesHash['card_face'] = rendererTex;
                var i;
                var key;
                var elementWidth;
                var elementHeight;
                elementHeight = rect.height / BoardCard2.WEIGHT_HEIGHT_KOEF;
                for (i = 0; i < Client.Resources.cardsNumbers.length; i++) {
                    key = 'card_' + Client.Resources.cardsNumbers[i];
                    rendererTex = Client.Resources.getTexture(key, { height: elementHeight, drawNewTexture: true });
                    BoardCard2._texturesHash[key] = rendererTex;
                }
                elementHeight = rect.height / BoardCard2.SUIT_HEIGHT_KOEF;
                for (i = 0; i < Client.Resources.cardsSuits.length; i++) {
                    key = 'card_' + Client.Resources.cardsSuits[i];
                    rendererTex = Client.Resources.getTexture(key, { height: elementHeight, drawNewTexture: true });
                    BoardCard2._texturesHash[key] = rendererTex;
                }
                elementWidth = rect.width / BoardCard2.IMAGE_WIDTH_KOEF;
                for (i = 0; i < Client.Resources.cardsSuits.length; i++) {
                    key = 'card_' + Client.Resources.cardsSuits[i];
                    rendererTex = Client.Resources.getTexture(key, { width: elementWidth, drawNewTexture: true });
                    BoardCard2._texturesHash['card_image_' + Client.Resources.cardsSuits[i]] = rendererTex;
                }
                elementWidth = rect.width / BoardCard2.IMAGE_WIDTH_KOEF;
                for (i = 0; i < Client.Resources.cardsFaces.length; i++) {
                    key = 'card_image_' + Client.Resources.cardsFaces[i];
                    rendererTex = Client.Resources.getTexture(key, { width: elementWidth, drawNewTexture: true });
                    BoardCard2._texturesHash[key] = rendererTex;
                }
            };
            BoardCard2.prototype.setMCard = function (mCard) {
                if (!mCard)
                    return;
                if (this._mCard && this._mCard.equals(mCard))
                    return;
                this._mCard = mCard;
                this.clearFace();
                var time = new Date().getTime();
                var origRect;
                var scale;
                var rect;
                var sprite;
                origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_' + this._mCard.weight).baseTexture);
                scale = this._h / BoardCard2.WEIGHT_HEIGHT_KOEF / origRect.height;
                rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                sprite = new PIXI.Sprite(BoardCard2._texturesHash['card_' + this._mCard.weight]);
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.x = this._w / 10;
                sprite.y = this._h / 20;
                if (this._mCard.suit == 's' || this._mCard.suit == 'c')
                    sprite.tint = 0;
                this._imageCont.addChild(sprite);
                origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_' + this._mCard.suit).baseTexture);
                scale = this._h / BoardCard2.SUIT_HEIGHT_KOEF / origRect.height;
                rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                sprite = new PIXI.Sprite(BoardCard2._texturesHash['card_' + this._mCard.suit]);
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.x = this._w / 10;
                sprite.y = this._h / 3.1;
                this._imageCont.addChild(sprite);
                var key;
                if (this._mCard.weight == 'j' || this._mCard.weight == 'q' || this._mCard.weight == 'k')
                    key = 'card_image_' + this._mCard.weight + this._mCard.suit;
                else
                    key = 'card_image_' + this._mCard.suit;
                origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(this._mCard.imageName).baseTexture);
                scale = this._w / BoardCard2.IMAGE_WIDTH_KOEF / origRect.width;
                rect = new PIXI.Rectangle(0, 0, origRect.width * scale, origRect.height * scale);
                sprite = new PIXI.Sprite(BoardCard2._texturesHash[key]);
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.x = this._w - sprite.width - this._w / 20;
                sprite.y = this._h - sprite.height - this._h / 20;
                this._imageCont.addChild(sprite);
            };
            BoardCard2.prototype.clearFace = function () {
                var displ;
                while (this._imageCont.children.length > 0) {
                    displ = this._imageCont.removeChildAt(0);
                    if (displ.parent)
                        displ.parent.removeChild(displ);
                    displ.destroy();
                }
            };
            Object.defineProperty(BoardCard2.prototype, "showShadow", {
                set: function (value) {
                    this._showShadow = value;
                    this._cardShadow.visible = value;
                },
                enumerable: true,
                configurable: true
            });
            BoardCard2.prototype.showCard = function (show, immediate) {
                if (immediate === void 0) { immediate = false; }
                if (this._showed == show)
                    return;
                Client.Tweener.killTweensOf(this);
                this._showed = show;
                if (immediate) {
                    this._cardFace.visible = this._showed;
                    this._cardBack.visible = !this._showed;
                }
                else
                    Client.Tweener.to(this, 0.2, { width: 0, onComplete: this.onCompleteFirstAnim, onCompleteScope: this });
            };
            BoardCard2.prototype.onCompleteFirstAnim = function () {
                this._cardFace.visible = this._showed;
                this._cardBack.visible = !this._showed;
                Client.Tweener.to(this, 0.2, { width: this._w });
            };
            BoardCard2.prototype.onClick = function () {
                this.showCard(!this._showed);
            };
            BoardCard2.prototype.onResize = function () {
                Client.Tweener.killTweensOf(this);
                this._face.texture = Client.Resources.getTexture('card_face', { width: this._w, drawNewTexture: true });
                this._cardBack.texture = Client.Resources.getTexture('card_back', { width: this._w, drawNewTexture: true });
                this._cardShadow.texture = Client.Resources.getTexture('card_back', { width: this._w, drawNewTexture: true });
                this._cardShadow.tint = 0;
                this._cardShadow.filters = [new PIXI.filters.BlurFilter()];
                this._face.width = this._cardBack.width = this._cardShadow.width = this._w;
                this._face.height = this._cardBack.height = this._cardShadow.height = this._h;
                this.setMCard(this._mCard);
                this.pivot.set(this._w / 2, this._h / 2);
                this.showCard(this._showed, true);
            };
            BoardCard2.prototype.getWidth = function () {
                return this._w;
            };
            BoardCard2.prototype.setWidth = function (value) {
                var scale = value / this._w;
                this._w = value;
                this._h *= scale;
                this.onResize();
            };
            BoardCard2.prototype.getHeight = function () {
                return this._h;
            };
            BoardCard2.prototype.setHeight = function (value) {
                var scale = value / this._h;
                this._h = value;
                this._w *= scale;
                this.onResize();
            };
            BoardCard2.prototype.destroy = function () {
                Client.Tweener.killTweensOf(this);
                this.clearFace();
                this._cardFace.destroy();
                this._cardBack.destroy();
                this._cardShadow.destroy();
                this._face.destroy();
                this._imageCont.destroy();
                _super.prototype.destroy.call(this);
            };
            BoardCard2.BACK_SCALE_KOEF = 1;
            BoardCard2.WEIGHT_HEIGHT_KOEF = 3.8;
            BoardCard2.SUIT_HEIGHT_KOEF = 5;
            BoardCard2.IMAGE_WIDTH_KOEF = 1.4;
            BoardCard2._texturesHash = {};
            return BoardCard2;
        }(PIXI.Container));
        Client.BoardCard2 = BoardCard2;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BoardCard3d = (function (_super) {
            __extends(BoardCard3d, _super);
            function BoardCard3d(offsetAxisX, scaleY) {
                var _this = _super.call(this) || this;
                _this._width = 100;
                _this._height = 140;
                _this._showed = false;
                _this._rotation = Math.PI / 2;
                _this._cardValue = '1';
                _this._cardTextureBack = true;
                _this._curAnim = BoardCard3d.ANIM_NONE;
                _this._firstInited = false;
                _this._offsetAxisX = 0;
                _this._curY = 0;
                return _this;
            }
            BoardCard3d.prototype.onComplete = function () {
                console.log('onComplete');
            };
            BoardCard3d.prototype.updateRotation = function () {
                this._cardCont.proj.clear();
                this._cardCont.updateTransform();
                this._cardCont.proj.setAxisY(new PIXI.Point(this._offsetAxisX, 800), -1);
                this._shadowCont.proj.clear();
                this._shadowCont.updateTransform();
                this._shadowCont.proj.setAxisY(new PIXI.Point(this._offsetAxisX, 800), -1);
                var point = new PIXI.Point();
                point.x = Math.sin(this._rotation) * 1000;
                point.y = Math.cos(this._rotation) * 1000;
                this._cardCont.proj.setAxisX(point, 0);
                this._shadowCont.proj.setAxisX(point, 0);
            };
            BoardCard3d.prototype.setCard = function (value) {
                this._cardValue = value;
            };
            BoardCard3d.prototype.showCard = function (show) {
                if (this._showed == show)
                    return;
                this._showed = show;
            };
            BoardCard3d.prototype.onClick = function () {
                this.showCard(!this._showed);
            };
            BoardCard3d.prototype.onTimer = function (dt) {
                if (!this._firstInited) {
                    this._firstInited = true;
                    this.updateRotation();
                }
                var minY = -100;
                if (this._showed && this._cardTextureBack || !this._showed && !this._cardTextureBack || this._curAnim != BoardCard3d.ANIM_NONE) {
                    if (this._curAnim == BoardCard3d.ANIM_NONE) {
                        this._rotation = Math.PI / 2;
                        this._curAnim = BoardCard3d.ANIM_FIRST_PHASE;
                        this._shadowCont.visible = true;
                    }
                    else if (this._curAnim == BoardCard3d.ANIM_FIRST_PHASE) {
                        this._rotation += PIXI.ticker.shared.elapsedMS / 130;
                        this._cardCont.y = minY * (this._rotation - Math.PI / 2) / (Math.PI / 2);
                        if (this._rotation >= Math.PI) {
                            this._rotation -= Math.PI;
                            this._curAnim = BoardCard3d.ANIM_SECOND_PHASE;
                            if (this._showed)
                                this._card.texture = PIXI.Texture.fromImage(Math.random() > 0.5 ? 'assets/sprites/card_6.png' : 'assets/sprites/card_j.png');
                            else
                                this._card.texture = PIXI.Texture.fromImage('assets/sprites/card_back.png');
                        }
                    }
                    else if (this._curAnim == BoardCard3d.ANIM_SECOND_PHASE) {
                        this._rotation += PIXI.ticker.shared.elapsedMS / 130;
                        this._cardCont.y = minY - minY * (this._rotation) / (Math.PI / 2);
                        if (this._rotation >= Math.PI / 2) {
                            this._rotation = Math.PI / 2;
                            this._curAnim = BoardCard3d.ANIM_NONE;
                            this._cardTextureBack = !this._showed;
                            this._cardCont.y = 0;
                            this._shadowCont.visible = false;
                        }
                    }
                    this.updateRotation();
                }
            };
            BoardCard3d.prototype.setHeight = function (h) {
            };
            BoardCard3d.prototype.getWidth = function () {
                return this._width;
            };
            BoardCard3d.prototype.getHeight = function () {
                return this._height;
            };
            BoardCard3d.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                PIXI.ticker.shared.remove(this.onTimer, this);
                this._cardCont.destroy();
                this._card.destroy();
                this._shadowCont.destroy();
                this._shadow.destroy();
            };
            BoardCard3d.ANIM_NONE = 1;
            BoardCard3d.ANIM_FIRST_PHASE = 2;
            BoardCard3d.ANIM_SECOND_PHASE = 3;
            return BoardCard3d;
        }(PIXI.Container));
        Client.BoardCard3d = BoardCard3d;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BoardCardShadow = (function (_super) {
            __extends(BoardCardShadow, _super);
            function BoardCardShadow() {
                return _super.call(this) || this;
            }
            BoardCardShadow.prototype.changeTexture = function (from) {
                var sprite = new PIXI.Sprite(from);
                var filter = new PIXI.filters.BlurFilter();
                filter.blur = 3;
                var c = new PIXI.Container();
                c.addChild(sprite);
                var b = c.getLocalBounds();
                var old_w = b.width;
                var old_h = b.height;
                b.width *= 1.2;
                b.height *= 1.2;
                b.x -= (b.width - old_w) * 0.5;
                b.y -= (b.height - old_h) * 0.5;
                sprite.filters = [filter];
                var tex = Client.Resources.getFromCache('BoardCardShadow', b.width, b.height);
                if (tex)
                    this.texture = tex;
                else {
                    from = Client.Config.renderer.generateTexture(c, PIXI.SCALE_MODES.LINEAR, Client.Config.renderer.resolution, b);
                    Client.Resources.addToCache('BoardCardShadow', from, from.width, from.height);
                    sprite.destroy(false);
                    filter = null;
                    sprite = null;
                    this.texture = from;
                }
            };
            return BoardCardShadow;
        }(PIXI.Sprite));
        Client.BoardCardShadow = BoardCardShadow;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BoardCardsContainer = (function (_super) {
            __extends(BoardCardsContainer, _super);
            function BoardCardsContainer() {
                var _this = _super.call(this) || this;
                _this._cardOffsetKoef = 20;
                _this._w = 50;
                _this._h = 50;
                _this._cards = [];
                _this._mCards = [];
                _this._openedCards = 0;
                var card;
                for (var i = 0; i < 5; i++) {
                    card = new Client.BoardCard();
                    card.visible = false;
                    _this._cards.push(card);
                    _this.addChild(card);
                }
                _this._winLabel = new Client.WinLabelWithCards();
                _this.addChild(_this._winLabel);
                _this._winLabel.visible = false;
                return _this;
            }
            BoardCardsContainer.prototype.startRound = function () {
                for (var i = 0; i < this._cards.length; i++) {
                    this._cards[i].visible = false;
                    this._cards[i].showCard(false, true);
                }
                this._openedCards = 0;
                this._winLabel.hide();
            };
            BoardCardsContainer.prototype.openCards = function (mCards) {
                for (var i = 0; i < mCards.length; i++) {
                    if (this._cards[i].visible)
                        continue;
                    this._cards[i].visible = true;
                    this._cards[i].setMCard(mCards[i]);
                    this._cards[i].showCard(true, this._openedCards > i);
                }
                this._mCards = mCards;
                this._openedCards = mCards.length;
            };
            BoardCardsContainer.prototype.showWinState = function () {
                var banks = Client.Model.table.handRankinkResult.banks;
                console.warn("Multibunking and multiwinners can't support currently!");
                var winner = banks[0].players[0];
                for (var idx = 0; idx < this._mCards.length; idx++) {
                    var card = this._mCards[idx];
                    var there = false;
                    for (var i = 0; i < winner.cards.length; i++) {
                        if (winner.cards[i].equals(card)) {
                            there = true;
                            break;
                        }
                    }
                    this._cards[idx].highlight(there ? Client.HightliteState.HIGHLIGHT : Client.HightliteState.LOWLIGHT);
                }
                if (winner.cards.length > 0)
                    this._winLabel.show(winner.comb, winner.cards, winner.kickers);
            };
            BoardCardsContainer.prototype.setWidth = function (value) {
                this._w = value;
                var cardWidth = this._w * this._cardOffsetKoef / (5 * this._cardOffsetKoef + 4);
                var offset = cardWidth / this._cardOffsetKoef;
                var curX = -this._w / 2 + cardWidth / 2;
                for (var i = 0; i < this._cards.length; i++) {
                    this._cards[i].setWidth(cardWidth);
                    this._cards[i].x = curX;
                    curX += cardWidth + offset;
                }
                var width = 1.5 * value;
                this._winLabel.setWidth(width, 430 / 46);
                this._winLabel.position.y = this._cards[0].height * 0.5 - this._winLabel.height * 0.25;
                this._winLabel.refresh();
            };
            BoardCardsContainer.prototype.getWidth = function () {
                return this._w;
            };
            BoardCardsContainer.prototype.getHeight = function () {
                return this._h;
            };
            BoardCardsContainer.prototype.clearGame = function () {
                this.startRound();
            };
            BoardCardsContainer.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                for (var i = 0; i < this._cards.length; i++) {
                    this._cards[i].destroy();
                    if (this._cards[i].parent)
                        this._cards[i].parent.removeChild(this._cards[i]);
                }
            };
            return BoardCardsContainer;
        }(PIXI.Container));
        Client.BoardCardsContainer = BoardCardsContainer;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var BoardCardsContainer3d = (function (_super) {
            __extends(BoardCardsContainer3d, _super);
            function BoardCardsContainer3d() {
                var _this = _super.call(this) || this;
                _this.cardOffset = 110;
                _this._w = 50;
                _this._h = 50;
                return _this;
            }
            BoardCardsContainer3d.prototype.onResize = function () {
                this._w = Client.Model.view.gameRealWidth * 0.7;
                var scale = this._w / (this.cardOffset * 5);
                this.scale.set(scale);
                this.x = Client.Model.view.gameRealWidth / 2;
                this.y = Client.Model.view.gameRealHeight / 1.5;
            };
            BoardCardsContainer3d.prototype.redraw = function () {
            };
            return BoardCardsContainer3d;
        }(PIXI.Container));
        Client.BoardCardsContainer3d = BoardCardsContainer3d;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var CardBack = (function (_super) {
            __extends(CardBack, _super);
            function CardBack() {
                var _this = this;
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('card_back').baseTexture);
                _this = _super.call(this, Client.Resources.getTexture('card_back')) || this;
                _this._w = origRect.width;
                _this._h = origRect.height;
                _this.anchor.set(0.5, 0.5);
                _this.cacheAsBitmap = true;
                return _this;
            }
            CardBack.prototype.onResize = function () {
                this.cacheAsBitmap = false;
                this.texture = Client.Resources.getTexture('card_back', { width: this._w }, 'CardBack');
                this.width = this._w;
                this.height = this._h;
                this.cacheAsBitmap = true;
            };
            CardBack.prototype.setWidth = function (value) {
                var scale = value / this._w;
                this._w = value;
                this._h *= scale;
                this.onResize();
            };
            CardBack.prototype.setHeight = function (value) {
                var scale = value / this._h;
                this._h = value;
                this._w *= scale;
                this.onResize();
            };
            CardBack.prototype.getWidth = function () {
                return this._w;
            };
            CardBack.prototype.getHeight = function () {
                return this._h;
            };
            CardBack.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return CardBack;
        }(PIXI.Sprite));
        Client.CardBack = CardBack;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var PlayerCardsBase = (function (_super) {
            __extends(PlayerCardsBase, _super);
            function PlayerCardsBase() {
                var _this = _super.call(this) || this;
                _this._w = 50;
                _this._h = 50;
                return _this;
            }
            PlayerCardsBase.prototype.showCards = function (mCard1, mCard2) {
                this._mCard1 = mCard1;
                this._mCard2 = mCard2;
                this._card1.setMCard(this._mCard1);
                this._card2.setMCard(this._mCard2);
                this._card1.showCard(true);
                this._card2.showCard(true);
            };
            PlayerCardsBase.prototype.hideCards = function () {
                this._card1.showCard(false, true);
                this._card2.showCard(false, true);
                this._card1.highlight(Client.HightliteState.NONE);
                this._card2.highlight(Client.HightliteState.NONE);
            };
            PlayerCardsBase.prototype.highlightCards = function (cards) {
                var isHL1 = false;
                var isHL2 = false;
                for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
                    var card = cards_1[_i];
                    if (this._mCard1 && this._mCard1.equals(card))
                        isHL1 = true;
                    if (this._mCard2 && this._mCard2.equals(card))
                        isHL2 = true;
                }
                this._card1.highlight(isHL1 ? Client.HightliteState.HIGHLIGHT : Client.HightliteState.LOWLIGHT);
                this._card2.highlight(isHL2 ? Client.HightliteState.HIGHLIGHT : Client.HightliteState.LOWLIGHT);
            };
            PlayerCardsBase.prototype.setSize = function (value) {
            };
            PlayerCardsBase.prototype.destroy = function () {
                if (this._card1)
                    this._card1.destroy();
                if (this._card2)
                    this._card2.destroy();
                _super.prototype.destroy.call(this);
            };
            return PlayerCardsBase;
        }(PIXI.Container));
        Client.PlayerCardsBase = PlayerCardsBase;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MyCards = (function (_super) {
            __extends(MyCards, _super);
            function MyCards() {
                var _this = _super.call(this) || this;
                _this.KOEF_CARDS_OFFSET_X = 0.25;
                _this.KOEF_CARDS_OFFSET_Y = -0.15;
                _this._cardsCont = new PIXI.Container();
                _this.addChild(_this._cardsCont);
                _this._cardsMask = new PIXI.Graphics();
                _this.addChild(_this._cardsMask);
                _this._cardsCont.mask = _this._cardsMask;
                _this._card1 = new Client.BoardCard();
                _this._card1.visible = false;
                _this._card1.rotation = -15 * Math.PI / 180;
                _this._cardsCont.addChild(_this._card1);
                _this._card2 = new Client.BoardCard();
                _this._card2.visible = false;
                _this._card2.rotation = 15 * Math.PI / 180;
                _this._cardsCont.addChild(_this._card2);
                _this._gradientLine = new PIXI.Sprite(Client.Resources.getTexture('gradient_line'));
                _this.addChild(_this._gradientLine);
                return _this;
            }
            MyCards.prototype.showCards = function (mCard1, mCard2) {
                _super.prototype.showCards.call(this, mCard1, mCard2);
                this._card1.visible = true;
                this._card2.visible = true;
            };
            MyCards.prototype.setSize = function (value) {
                _super.prototype.setSize.call(this, value);
                var origRect = Client.Resources.getOrigSize(this._gradientLine.texture.baseTexture);
                var scale = value / origRect.width;
                var newRect = new PIXI.Rectangle(0, 0, value, origRect.height * scale);
                this._gradientLine.texture = Client.Resources.scaleTexture(this._gradientLine.texture, { scale: scale, returnNewTexture: true });
                this._gradientLine.width = newRect.width;
                this._gradientLine.height = newRect.height;
                this._gradientLine.x = -this._gradientLine.width / 2;
                this._gradientLine.y = -this._gradientLine.height;
                this._cardsMask.clear();
                this._cardsMask.beginFill(0xff0000);
                this._cardsMask.drawRect(0, 0, value * 1.2, value * 1.2);
                this._cardsMask.x = -this._cardsMask.width / 2;
                this._cardsMask.y = -this._cardsMask.height - 3;
                this._card1.setWidth(value / 2);
                this._card2.setWidth(value / 2);
                var offset = this._card1.getWidth() * this.KOEF_CARDS_OFFSET_X;
                this._card1.x = -offset;
                this._card2.x = offset;
                offset = this._card1.getHeight() * this.KOEF_CARDS_OFFSET_Y;
                this._card1.y = offset;
                this._card2.y = offset;
            };
            MyCards.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._gradientLine.destroy();
                this._cardsCont.destroy();
                this._cardsMask.destroy();
            };
            return MyCards;
        }(Client.PlayerCardsBase));
        Client.MyCards = MyCards;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var PlayerCards = (function (_super) {
            __extends(PlayerCards, _super);
            function PlayerCards() {
                var _this = _super.call(this) || this;
                _this.KOEF_CARDS_OFFSET_X = 0.1;
                _this._card1 = new Client.BoardCard();
                _this.addChild(_this._card1);
                _this._card2 = new Client.BoardCard();
                _this.addChild(_this._card2);
                _this.hideCards();
                return _this;
            }
            PlayerCards.prototype.setSize = function (value) {
                _super.prototype.setSize.call(this, value);
                this._card1.setHeight(value);
                this._card2.setHeight(value);
                var offset = this._card1.getWidth() * this.KOEF_CARDS_OFFSET_X;
                this._card1.x = -this._card1.getWidth() / 2 - offset / 2;
                this._card2.x = this._card2.getWidth() / 2 + offset / 2;
            };
            PlayerCards.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return PlayerCards;
        }(Client.PlayerCardsBase));
        Client.PlayerCards = PlayerCards;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var LevelPanel = (function (_super) {
            __extends(LevelPanel, _super);
            function LevelPanel() {
                var _this = _super.call(this) || this;
                _this._h = 1;
                _this.init();
                return _this;
            }
            LevelPanel.prototype.setHeight = function (value) {
                this._h = value;
                this.update();
            };
            LevelPanel.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
                this.update();
            };
            Object.defineProperty(LevelPanel.prototype, "level", {
                set: function (value) {
                    var nextText = value.toString(), needToResize = this._level.text.length !== nextText.length;
                    this._level.text = nextText;
                    if (needToResize) {
                        this.update();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelPanel.prototype, "progress", {
                set: function (value) {
                    this._progressBar.progress = value;
                },
                enumerable: true,
                configurable: true
            });
            LevelPanel.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._star.destroy();
                this._progressBar.destroy();
                this._level.destroy();
            };
            LevelPanel.prototype.init = function () {
                this._star = new PIXI.Sprite(Client.Resources.getTexture(LevelPanel.STAR_TEXTURE_NAME));
                this.addChild(this._star);
                this._progressBar = new Client.LevelProgressBar();
                this._progressBar.ratio = 11;
                this.addChild(this._progressBar);
                this._level = new Client.Text('1', Client.FontsHelper.Text.fontForLevelBar);
                this.addChild(this._level);
            };
            LevelPanel.prototype.update = function () {
                var starHeight = this._h;
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(LevelPanel.STAR_TEXTURE_NAME).baseTexture);
                var scale = starHeight / origRect.height, starWidth = origRect.width * scale;
                this._star.x = 0;
                this._star.y = 0;
                this._star.texture = Client.Resources.getTexture(LevelPanel.STAR_TEXTURE_NAME, {
                    scale: scale,
                    drawNewTexture: true,
                });
                this._star.width = starWidth;
                this._star.height = starHeight;
                this._level.fontSize = this._h * LevelPanel.LEVEL_FONT_SIZE_KOEF;
                this._level.x = starWidth + this._h * LevelPanel.INTERVAL_KOEF;
                this._level.y = this._h / 2 - this._level.height / 2;
                this._progressBar.setHeight(this._h * LevelPanel.PROGRESS_BAR_HEIGHT_KOEF);
                this._progressBar.x = this._level.x + this._level.width + this._h * LevelPanel.INTERVAL_KOEF;
                this._progressBar.y = this._h / 2 - this._h * LevelPanel.PROGRESS_BAR_HEIGHT_KOEF / 2;
            };
            LevelPanel.STAR_TEXTURE_NAME = 'lobby/star';
            LevelPanel.LEVEL_FONT_SIZE_KOEF = 0.9;
            LevelPanel.PROGRESS_BAR_HEIGHT_KOEF = 0.6;
            LevelPanel.INTERVAL_KOEF = 0.14;
            return LevelPanel;
        }(PIXI.Container));
        Client.LevelPanel = LevelPanel;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var LevelProgressBar = (function (_super) {
            __extends(LevelProgressBar, _super);
            function LevelProgressBar() {
                var _this = _super.call(this) || this;
                _this._ratio = 9;
                _this._progress = 0;
                _this.RADIUS_KOEF = 0.06;
                _this.WHOLE_COLOR = 0x050001;
                _this.PROGRESS_COLOR = 0x6cd54b;
                _this.MIN_PROGRESS = 0.09;
                _this._w = 0;
                _this._h = 0;
                _this.init();
                return _this;
            }
            Object.defineProperty(LevelProgressBar.prototype, "ratio", {
                set: function (value) {
                    this._ratio = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelProgressBar.prototype, "progress", {
                get: function () {
                    return this._progress;
                },
                set: function (nextProgress) {
                    Client.Tweener.to(this, 1, {
                        _progress: nextProgress,
                        onUpdate: this.drawProgressLine,
                        onUpdateScope: this,
                        onComplete: this.drawProgressLine,
                        onCompleteScope: this,
                    });
                },
                enumerable: true,
                configurable: true
            });
            LevelProgressBar.prototype.setHeight = function (value) {
                this._h = value;
                this._w = this._h * this._ratio;
                this.drawProgressLine();
                this.drawWholeLine();
            };
            LevelProgressBar.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            LevelProgressBar.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._wholeLine.destroy();
                this._progressLine.destroy();
            };
            LevelProgressBar.prototype.init = function () {
                this._wholeLine = new PIXI.Graphics();
                this._wholeLine.position.set(0, 0);
                this.drawWholeLine();
                this.addChild(this._wholeLine);
                this._progressLine = new PIXI.Graphics();
                this._progressLine.position.set(0, 0);
                this.drawProgressLine();
                this.addChild(this._progressLine);
            };
            LevelProgressBar.prototype.drawWholeLine = function () {
                var w = this._w, h = this._h, r = this._w * this.RADIUS_KOEF;
                this._wholeLine.clear();
                this._wholeLine.lineStyle(0);
                this._wholeLine.beginFill(this.WHOLE_COLOR, 0.65);
                this._wholeLine.drawRoundedRect(0, 0, w, h, r);
                this._wholeLine.endFill();
            };
            LevelProgressBar.prototype.drawProgressLine = function () {
                var w = this._w * Math.max(this._progress, this.MIN_PROGRESS), h = this._h, r = this._w * this.RADIUS_KOEF;
                this._progressLine.clear();
                this._progressLine.lineStyle(0);
                this._progressLine.beginFill(this.PROGRESS_COLOR, 1);
                this._progressLine.drawRoundedRect(0, 0, w, h, r);
                this._progressLine.endFill();
            };
            return LevelProgressBar;
        }(PIXI.Container));
        Client.LevelProgressBar = LevelProgressBar;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var AvatarTimeCounter = (function (_super) {
            __extends(AvatarTimeCounter, _super);
            function AvatarTimeCounter() {
                var _this = _super.call(this) || this;
                _this._radius = 50;
                _this._lastLightShowTime = 0;
                _this._newDelayForLightShow = 0;
                _this._lastProgress = 1000;
                _this._progress = 0;
                _this._lightsCont = new PIXI.particles.ParticleContainer(20, { alpha: true, vertices: true, rotation: true, scale: true, position: true });
                _this.addChild(_this._lightsCont);
                _this._mainLight = new PIXI.Sprite(Client.Resources.getTexture('light'));
                _this._mainLight.anchor.set(0.5, 0.5);
                _this._lightsCont.addChild(_this._mainLight);
                return _this;
            }
            AvatarTimeCounter.getCurColor = function (color1, color2, progress) {
                var r1 = color1 >> 16 & 0xFF;
                var g1 = color1 >> 8 & 0xFF;
                var b1 = color1 & 0xFF;
                var r2 = color2 >> 16 & 0xFF;
                var g2 = color2 >> 8 & 0xFF;
                var b2 = color2 & 0xFF;
                var r3;
                var g3;
                var b3;
                r3 = r1 + ((progress * 255 * (r2 - r1)) / 255);
                g3 = g1 + ((progress * 255 * (g2 - g1)) / 255);
                b3 = b1 + ((progress * 255 * (b2 - b1)) / 255);
                return r3 << 16 | g3 << 8 | b3;
            };
            AvatarTimeCounter.prototype.getRadius = function () {
                return this._radius;
            };
            AvatarTimeCounter.prototype.setRadius = function (value) {
                this._radius = value;
                this._mainLightBaseSize = this._radius * 1.3;
                this._lightBaseSize = this._mainLightBaseSize / 2.7;
                this._mainLight.width = this._mainLight.height = this._mainLightBaseSize;
            };
            Object.defineProperty(AvatarTimeCounter.prototype, "progress", {
                get: function () {
                    return this._progress;
                },
                set: function (value) {
                    this._progress = value;
                    var color = AvatarTimeCounter.getCurColor(AvatarTimeCounter.FROM_COLOR, AvatarTimeCounter.TO_COLOR, this._progress);
                    var segmentRad = (value * Math.PI * 2) % (Math.PI * 2) - Math.PI / 2;
                    this.clear();
                    this.beginFill(color, 0.3);
                    this.moveTo(this._radius, this._radius);
                    this.arc(this._radius, this._radius, this._radius, -Math.PI / 2, segmentRad);
                    this.endFill();
                    this.lineStyle(4, color, 0.9);
                    this.moveTo(this._radius, 0);
                    this.arc(this._radius, this._radius, this._radius, -Math.PI / 2, segmentRad);
                    this._mainLight.x = -Math.sin(segmentRad - Math.PI / 2) * this._radius + this._radius;
                    this._mainLight.y = Math.cos(segmentRad - Math.PI / 2) * this._radius + this._radius;
                    this._mainLight.rotation = segmentRad * 1.5;
                    if (value < this._lastProgress) {
                        this._mainLight.width = this._mainLight.height = this._mainLightBaseSize * 1;
                        Client.Tweener.killTweensOf(this._mainLight);
                        var tl = new TimelineLite();
                        tl.to(this._mainLight, 0.2, { width: this._mainLightBaseSize * 1.5, height: this._mainLightBaseSize * 1.5 });
                        tl.to(this._mainLight, 1.2, { width: this._mainLightBaseSize * 1, height: this._mainLightBaseSize * 1 });
                    }
                    if (new Date().getTime() - this._lastLightShowTime > this._newDelayForLightShow) {
                        this._newDelayForLightShow = (120 + Math.random() * 360);
                        this._lastLightShowTime = new Date().getTime();
                        var light = Client.Light.alloc();
                        light.init(0.3, this._lightBaseSize);
                        light.x = -Math.sin(segmentRad - Math.PI / 2 - 0.2) * this._radius + this._radius;
                        light.y = Math.cos(segmentRad - Math.PI / 2 - 0.2) * this._radius + this._radius;
                        this._lightsCont.addChild(light);
                    }
                    this._lastProgress = value;
                },
                enumerable: true,
                configurable: true
            });
            AvatarTimeCounter.prototype.clearGraphics = function () {
                this.clear();
                this._lastProgress = 1000;
            };
            AvatarTimeCounter.prototype.destroy = function () {
                Client.Tweener.killTweensOf(this._mainLight);
                this._lightsCont.destroy();
                this._mainLight.destroy();
            };
            AvatarTimeCounter.FROM_COLOR = 0x00ff00;
            AvatarTimeCounter.TO_COLOR = 0xff0000;
            return AvatarTimeCounter;
        }(PIXI.Graphics));
        Client.AvatarTimeCounter = AvatarTimeCounter;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var DefaultAvatar = (function (_super) {
            __extends(DefaultAvatar, _super);
            function DefaultAvatar() {
                var _this = _super.call(this) || this;
                _this._avatarSize = 50;
                _this._circle = new PIXI.Graphics();
                _this.addChild(_this._circle);
                _this._username = new Client.Text(' ', Client.FontsHelper.Text.fontWhite10);
                _this.addChild(_this._username);
                _this._starLevelCont = new PIXI.Container();
                _this.addChild(_this._starLevelCont);
                _this._star = new PIXI.Sprite(Client.Resources.getTexture(DefaultAvatar.STAR_TEXTURE_NAME));
                _this._starLevelCont.addChild(_this._star);
                _this._level = new Client.Text(' ', Client.FontsHelper.Text.fontWhite10);
                _this._starLevelCont.addChild(_this._level);
                return _this;
            }
            Object.defineProperty(DefaultAvatar.prototype, "level", {
                set: function (value) {
                    this._level.text = value.toString();
                    this.resizeLevelCont();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DefaultAvatar.prototype, "username", {
                set: function (value) {
                    this._username.text = value;
                    this.resizeUsername();
                },
                enumerable: true,
                configurable: true
            });
            DefaultAvatar.prototype.setAvatarSize = function (value) {
                this._avatarSize = value;
                this._circle.clear();
                this._circle.beginFill(0x200000);
                this._circle.drawCircle(this._avatarSize / 2, this._avatarSize / 2, this._avatarSize / 2);
                this._circle.x = 0;
                this._circle.y = 0;
                this.resizeLevelCont();
                this.resizeUsername();
            };
            DefaultAvatar.prototype.resizeUsername = function () {
                this._username.fontSize = Math.max(this._avatarSize * DefaultAvatar.USERNAME_FONT_SIZE_KOEF, 5);
                this._username.x = this._avatarSize / 2 - this._username.width / 2;
                this._username.y = this._avatarSize * DefaultAvatar.USERNAME_TOP_OFFSET_KOEF;
            };
            DefaultAvatar.prototype.resizeLevelCont = function () {
                var starHeight = this._avatarSize * DefaultAvatar.STAR_HEIGHT_KOEF;
                var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(DefaultAvatar.STAR_TEXTURE_NAME).baseTexture), scale = starHeight / origRect.height, starWidth = origRect.width * scale;
                this._star.texture = Client.Resources.getTexture(DefaultAvatar.STAR_TEXTURE_NAME, {
                    scale: scale,
                    drawNewTexture: true,
                });
                this._star.width = starWidth;
                this._star.height = starHeight;
                this._star.x = 0;
                this._star.y = 0;
                var levelFontSizeKoef = (this._level.text && 6 / this._level.text.length) || 1;
                this._level.fontSize = Math.max(this._avatarSize * DefaultAvatar.LEVEL_FONT_SIZE_KOEF *
                    Math.min(levelFontSizeKoef, 1), 5);
                this._level.x = this._star.x + this._star.width + this._avatarSize * DefaultAvatar.LEVEL_LEFT_OFFSET_KOEF;
                this._level.y = this._star.height / 2 - this._level.height / 2;
                this._starLevelCont.x = this._avatarSize / 2 - (this._star.width + this._level.width) / 2;
                if (this._level.width)
                    this._starLevelCont.x += this._avatarSize * DefaultAvatar.LEVEL_LEFT_OFFSET_KOEF / 2;
                this._starLevelCont.y = this._avatarSize / 2 - this._star.height / 2;
            };
            DefaultAvatar.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._starLevelCont.destroy();
                this._star.destroy();
                this._username.destroy();
                this._level.destroy();
                this._circle.destroy();
            };
            DefaultAvatar.STAR_TEXTURE_NAME = 'lobby/star';
            DefaultAvatar.STAR_HEIGHT_KOEF = 0.15;
            DefaultAvatar.LEVEL_FONT_SIZE_KOEF = 0.15;
            DefaultAvatar.LEVEL_LEFT_OFFSET_KOEF = 0.05;
            DefaultAvatar.USERNAME_FONT_SIZE_KOEF = 0.2;
            DefaultAvatar.USERNAME_TOP_OFFSET_KOEF = 0.1;
            return DefaultAvatar;
        }(PIXI.Container));
        Client.DefaultAvatar = DefaultAvatar;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var PlayerBase = (function (_super) {
            __extends(PlayerBase, _super);
            function PlayerBase(mUser, betExpantToRight) {
                if (betExpantToRight === void 0) { betExpantToRight = true; }
                var _this = _super.call(this) || this;
                _this._waitBetSoundsLeft = false;
                _this._startWaitBet = 0;
                _this._avatarSize = 50;
                _this._waitTime = 1;
                _this._mUser = mUser;
                _this._cont = new PIXI.Container();
                _this.addChild(_this._cont);
                _this._avatar = new PIXI.Sprite();
                _this._defaultAvatar = new Client.DefaultAvatar();
                _this._cont.addChild(_this._defaultAvatar);
                _this._cont.addChild(_this._avatar);
                _this._avatarTimeCounter = new Client.AvatarTimeCounter();
                _this._cont.addChild(_this._avatarTimeCounter);
                _this._avatarMask = new PIXI.Graphics();
                _this._cont.addChild(_this._avatarMask);
                _this._avatar.mask = _this._avatarMask;
                _this._tfStack = new Client.Text('$' + _this._mUser.stack, Client.FontsHelper.Text.fontWhite10);
                _this._tfStack.anchor.set(0.5, 0);
                _this._cont.addChild(_this._tfStack);
                _this._bet = new Client.PlayerBet();
                _this._bet.visible = false;
                _this.betExpantToRight = betExpantToRight;
                _this.addChild(_this._bet);
                _this._dealerIcon = new PIXI.Sprite(Client.Resources.getTexture('icon_dealer'));
                _this.addChild(_this._dealerIcon);
                _this.dealer = false;
                _this._avatarTimeCounter.visible = false;
                _this._winBackEffect = new Client.WinPlayerBGEffect();
                _this._cont.addChild(_this._winBackEffect);
                _this._winnerLabel = new Client.WinLabel();
                _this._winnerLabel.visible = false;
                _this.addChild(_this._winnerLabel);
                _this.hideWinAnimation();
                _this.updateInfo();
                return _this;
            }
            PlayerBase.setDealerIconSize = function (value) {
                PlayerBase._dealerIconSize = value;
            };
            Object.defineProperty(PlayerBase.prototype, "dealer", {
                set: function (value) {
                    this._dealerIcon.visible = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PlayerBase.prototype, "betExpantToRight", {
                set: function (value) {
                    this._bet.expandToRight = value;
                },
                enumerable: true,
                configurable: true
            });
            PlayerBase.prototype.setAvatarSize = function (value) {
                this._avatarSize = value;
                this._avatar.width = this._avatarSize;
                this._avatar.height = this._avatarSize;
                this._avatar.x = -this._avatarSize / 2;
                this._avatar.y = -this._avatarSize / 2;
                this._defaultAvatar.x = -this._avatarSize / 2;
                this._defaultAvatar.y = -this._avatarSize / 2;
                this._defaultAvatar.setAvatarSize(this._avatarSize);
                this._avatarMask.clear();
                this._avatarMask.beginFill(0);
                this._avatarMask.drawCircle(this._avatarSize / 2, this._avatarSize / 2, this._avatarSize / 2);
                this._avatarMask.x = this._avatar.x;
                this._avatarMask.y = this._avatar.y;
                this._avatarTimeCounter.setRadius(this._avatarSize / 2);
                this._avatarTimeCounter.x = this._avatar.x;
                this._avatarTimeCounter.y = this._avatar.y;
                this._bet.resize();
                this._dealerIcon.texture = Client.Resources.scaleTexture(this._dealerIcon.texture, { height: PlayerBase._dealerIconSize });
                this._dealerIcon.width = this._dealerIcon.height = PlayerBase._dealerIconSize;
            };
            Object.defineProperty(PlayerBase.prototype, "stackPos", {
                get: function () {
                    return this._tfStack.position;
                },
                enumerable: true,
                configurable: true
            });
            PlayerBase.prototype.showCards = function () {
                this._cards.showCards(this._mUser.card1, this._mUser.card2);
                this._cards.visible = true;
            };
            PlayerBase.prototype.hideCards = function () {
                this._cards.visible = false;
                this._cards.hideCards();
            };
            PlayerBase.prototype.updateWinState = function (playerState) {
                if (this._mUser.winner) {
                    this.showWinAnimation(playerState.comb);
                    this.highlightCards(playerState.cards, playerState.kickers);
                }
                else {
                    this.hideWinAnimation();
                    this.highlightCards([], []);
                }
            };
            PlayerBase.prototype.highlightCards = function (cards, kikers) {
                var mix = cards.concat(kikers);
                this._cards.highlightCards(mix);
            };
            PlayerBase.prototype.showWinAnimation = function (reason) {
                this._cont.addChild(this._cards);
                this._winnerLabel.text = Client.HandRankCombination[reason];
                this._winBackEffect.show();
            };
            PlayerBase.prototype.hideWinAnimation = function () {
                this._winBackEffect.hide();
            };
            PlayerBase.prototype.waitBet = function (waitTime) {
                Client.Tweener.killDelayedCallsTo(this.updateProgress, this);
                this._waitTime = waitTime;
                this._avatarTimeCounter.visible = true;
                this.progress = 0;
                this._waitBetSoundsLeft = false;
                this._startWaitBet = new Date().getTime();
                this.updateProgress();
            };
            PlayerBase.prototype.updateProgress = function () {
                var timeProgress = new Date().getTime() - this._startWaitBet;
                var progress = Math.min(timeProgress / (this._waitTime * 1000), 0.999);
                this.progress = progress;
                Client.Tweener.delayedCall(1 / 50, this.updateProgress, null, this);
            };
            PlayerBase.prototype.clearWaiting = function () {
                Client.Tweener.killDelayedCallsTo(this.updateProgress, this);
                this._avatarTimeCounter.visible = false;
                this._avatarTimeCounter.clearGraphics();
            };
            PlayerBase.prototype.updateInfo = function (params) {
                if (params === void 0) { params = { isWaitForPlayers: false, updateStack: true, updateBetInfo: true, updateBetVisible: true, updateBetExpanded: true }; }
                this.updatePhoto();
                this._defaultAvatar.username = this._mUser.name;
                if (this._mUser.isMe) {
                    var myUser = this._mUser;
                    this._defaultAvatar.level = myUser.level;
                }
                if (params.updateStack) {
                    var isWait = this._mUser.state === Client.MUser.STATE_WAIT;
                    if (!isWait) {
                        this.showStack();
                        if (this._mUser.isMe) {
                            this.hideNextHandLabel();
                        }
                        this.setStack(this._mUser.stack);
                    }
                    else {
                        this.hideStack();
                        if (this._mUser.isMe && !params.isWaitForPlayers) {
                            this.showNextHandLabel();
                        }
                    }
                }
                if (params.updateBetInfo) {
                    this.setBetText('$' + this._mUser.bet);
                    this.setBetType(Client.MBet.getTypeByAction(this._mUser.betAction));
                    this.updateFoldActionView();
                }
                if (params.updateBetVisible) {
                    this.updateBetVisible();
                }
                if (params.updateBetExpanded) {
                    this.betExpandOrCollapse(false);
                }
            };
            PlayerBase.prototype.showNextHandLabel = function () { };
            PlayerBase.prototype.hideNextHandLabel = function () { };
            PlayerBase.prototype.showStack = function () {
                this._tfStack.visible = true;
            };
            PlayerBase.prototype.hideStack = function () {
                this._tfStack.visible = false;
            };
            PlayerBase.prototype.updatePhoto = function () {
                if (this._mUser.photo != this._photo) {
                    this._avatar.texture = PIXI.Texture.from(this._mUser.photo);
                }
                this._defaultAvatar.visible = !this._avatar.texture.valid;
                this._avatar.visible = this._avatar.texture.valid;
            };
            PlayerBase.prototype.updateBetVisible = function () {
                this._bet.visible = this._mUser.betAction != Client.MBet.ACTION_NONE;
            };
            PlayerBase.prototype.updateFoldActionView = function () {
                if (this._mUser.folded) {
                    var clMatrix = new PIXI.filters.ColorMatrixFilter();
                    clMatrix.brightness(0.5);
                    this._cont.filters = [clMatrix];
                    Client.Tweener.to(this._cont.scale, 0.5, { x: 0.8, y: 0.8 });
                }
                else {
                    this._cont.filters = [];
                    Client.Tweener.to(this._cont.scale, 0.5, { x: 1, y: 1 });
                }
            };
            PlayerBase.prototype.betExpand = function (immediately) {
                if (immediately === void 0) { immediately = false; }
                this._bet.expand(true, immediately);
            };
            PlayerBase.prototype.betCollapse = function (immediately) {
                if (immediately === void 0) { immediately = false; }
                this._bet.expand(false, immediately);
            };
            PlayerBase.prototype.betExpandOrCollapse = function (immediately) {
                if (immediately === void 0) { immediately = false; }
                if (this._mUser.betAction != Client.MBet.ACTION_NONE && this._mUser.bet > 0)
                    this.betExpand(immediately);
                else
                    this.betCollapse(immediately);
            };
            PlayerBase.prototype.setStack = function (value) {
                this._tfStack.text = value && ('$' + value) || 'All In';
            };
            PlayerBase.prototype.setBetType = function (type) {
                this._bet.setIcon(type);
            };
            PlayerBase.prototype.setBetText = function (text) {
                this._bet.setText(text);
            };
            PlayerBase.prototype.cloneChip = function () {
                return this._mUser.bet == 0 ? null : this._bet.getClonedSprite();
            };
            Object.defineProperty(PlayerBase.prototype, "progress", {
                get: function () {
                    return this._avatarTimeCounter.progress;
                },
                set: function (value) {
                    this._avatarTimeCounter.progress = value;
                },
                enumerable: true,
                configurable: true
            });
            PlayerBase.prototype.getSize = function () {
                return this._avatarSize;
            };
            Object.defineProperty(PlayerBase.prototype, "userId", {
                get: function () {
                    return this._mUser.id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PlayerBase.prototype, "seatId", {
                get: function () {
                    return this._mUser.seatId;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PlayerBase.prototype, "waitNewGame", {
                get: function () {
                    return this._mUser.state == Client.MUser.STATE_WAIT;
                },
                enumerable: true,
                configurable: true
            });
            PlayerBase.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._cont.filters = null;
                Client.Tweener.killTweensOf(this._cont.scale);
                this._cont.destroy();
                Client.Tweener.killDelayedCallsTo(this.updateProgress, this);
                this._avatar.destroy();
                this._avatarTimeCounter.destroy();
                this._defaultAvatar.destroy();
                this._avatarMask.destroy();
                this._tfStack.destroy();
                this._bet.destroy();
                if (this._dealerIcon)
                    this._dealerIcon.destroy();
                if (this._cards)
                    this._cards.destroy();
                if (this._winBackEffect)
                    this._winBackEffect.destroy();
                if (this._winnerLabel)
                    this._winnerLabel.destroy();
            };
            PlayerBase._dealerIconSize = 10;
            PlayerBase._waitBetSoundsStart = 1500;
            return PlayerBase;
        }(PIXI.Container));
        Client.PlayerBase = PlayerBase;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var MyPlayer = (function (_super) {
            __extends(MyPlayer, _super);
            function MyPlayer(mUser) {
                var _this = _super.call(this, mUser, true) || this;
                _this.WAIT_FOR_NEXT_HAND_LABEL_FONT_SIZE_KOEF = 0.12;
                _this.WAIT_FOR_NEXT_HAND_LABEL_TOP_OFFSET_KOEF = 0.88;
                _this._waitForNextHandLabel = new Client.Text('PLEASE WAIT FOR THE NEXT HAND...', Client.FontsHelper.Text.fontForNextHandLabel);
                _this._waitForNextHandLabel.visible = false;
                _this._waitForNextHandLabel.anchor.set(0.5, 0.5);
                _this._cont.addChild(_this._waitForNextHandLabel);
                _this._cards = new Client.MyCards();
                _this._cont.addChild(_this._cards);
                _this.hideCards();
                return _this;
            }
            MyPlayer.prototype.showNextHandLabel = function () {
                if (this._waitForNextHandLabel) {
                    this._waitForNextHandLabel.visible = true;
                }
            };
            MyPlayer.prototype.hideNextHandLabel = function () {
                if (this._waitForNextHandLabel) {
                    this._waitForNextHandLabel.visible = false;
                }
            };
            MyPlayer.prototype.setAvatarSize = function (value) {
                _super.prototype.setAvatarSize.call(this, value);
                this._bet.y = -this._avatarSize / 2 - this._bet.height - this._bet.getIconSize() / 2;
                this._cards.setSize(this._avatar.width * 1.3);
                this._cards.x = 0;
                this._cards.y = this._avatar.height / 2 + this._avatar.height * 0.3;
                this._tfStack.fontSize = this._avatar.height / 5;
                this._tfStack.y = this._cards.y + this._avatar.height / 20;
                this._dealerIcon.x = -this._avatarSize / 1.3;
                this._dealerIcon.y = -this._avatarSize / 1.7;
                this._winnerLabel.setWidth(value);
                this._winnerLabel.x = -value * 0.5;
                this._winnerLabel.y = this._avatar.position.y;
                this._winBackEffect.setWidth(value);
                this._winBackEffect.position.set(0, 0);
                this._waitForNextHandLabel.fontSize = this._avatar.height / 4;
                this._waitForNextHandLabel.y = this._tfStack.y;
            };
            MyPlayer.prototype.updateProgress = function () {
                _super.prototype.updateProgress.call(this);
                var leftTime = this._waitTime * 1000 - (new Date().getTime() - this._startWaitBet);
                if (!this._waitBetSoundsLeft && leftTime < Client.PlayerBase._waitBetSoundsStart) {
                    Client.trace('Sounds.play(SoundsHelper.TURN_TIMER_TICK)');
                    this._waitBetSoundsLeft = true;
                    Client.Sounds.play(Client.SoundsHelper.TURN_TIMER_TICK);
                }
            };
            MyPlayer.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            return MyPlayer;
        }(Client.PlayerBase));
        Client.MyPlayer = MyPlayer;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Player = (function (_super) {
            __extends(Player, _super);
            function Player(mUser, cardPosDegree, dealerPosDegree, betPosDegree, betExpantToRight, endCardsRotation) {
                var _this = _super.call(this, mUser) || this;
                _this._w = 50;
                _this._h = 50;
                _this._cardsBack = [];
                _this._endCardsRotation = 0;
                _this._cards = new Client.PlayerCards();
                _this._cont.addChild(_this._cards);
                _this.hideCards();
                _this.setParams(cardPosDegree, dealerPosDegree, betPosDegree, betExpantToRight, endCardsRotation);
                return _this;
            }
            Player.prototype.setParams = function (cardPosDegree, dealerPosDegree, betPosDegree, betExpantToRight, endCardsRotation) {
                cardPosDegree -= 90;
                this._cardsPos = new PIXI.Point(Math.cos(cardPosDegree * Math.PI / 180) * Player.KOEF_CARDS_POS_OFFSET, Math.sin(cardPosDegree * Math.PI / 180) * Player.KOEF_CARDS_POS_OFFSET);
                dealerPosDegree -= 90;
                this._dealerPos = new PIXI.Point(Math.cos(dealerPosDegree * Math.PI / 180) * Player.KOEF_DEALER_POS_OFFSET, Math.sin(dealerPosDegree * Math.PI / 180) * Player.KOEF_DEALER_POS_OFFSET);
                betPosDegree -= 90;
                this._betPos = new PIXI.Point(Math.cos(betPosDegree * Math.PI / 180) * Player.KOEF_BET_POS_OFFSET, Math.sin(betPosDegree * Math.PI / 180) * Player.KOEF_BET_POS_OFFSET);
                this.betExpantToRight = betExpantToRight;
                this._endCardsRotation = endCardsRotation;
                this.setAvatarSize(this._avatarSize);
            };
            Player.prototype.showCards = function () {
                if (this._mUser.folded || this._mUser.state == Client.MUser.STATE_WAIT)
                    return;
                _super.prototype.showCards.call(this);
                this._cont.addChild(this._cards);
            };
            Player.prototype.returnCards = function (animationTo, immediately) {
                if (this._cardsBack.length == 0)
                    return;
                if (immediately) {
                    this.destroyCardBacks();
                    this._cardsBack = [];
                }
                else {
                    for (var i = 0; i < this._cardsBack.length; i++)
                        Client.Tweener.to(this._cardsBack[i], 0.3, { x: animationTo.x, y: animationTo.y });
                    Client.Tweener.delayedCall(0.32, this.returnCards, [animationTo, true], this);
                }
            };
            Player.prototype.destroyCardBacks = function () {
                for (var i = 0; i < this._cardsBack.length; i++) {
                    Client.Tweener.killTweensOf(this._cardsBack[i]);
                    this._cardsBack[i].destroy();
                    if (this._cardsBack[i].parent)
                        this._cardsBack[i].parent.removeChild(this._cardsBack[i]);
                }
            };
            Player.prototype.giveOutCards = function (animationFrom, immediately, delay, circleDelay) {
                this.destroyCardBacks();
                this._cardsBack = [];
                Client.Tweener.killDelayedCallsTo(this._startAnimationGiveOutCards, this);
                if (immediately) {
                    this._startAnimationGiveOutCards(animationFrom, true);
                    this._startAnimationGiveOutCards(animationFrom, true);
                }
                else {
                    Client.Tweener.delayedCall(delay, this._startAnimationGiveOutCards, [animationFrom, false], this);
                    Client.Tweener.delayedCall(delay + circleDelay, this._startAnimationGiveOutCards, [animationFrom, false], this);
                }
            };
            Player.prototype._startAnimationGiveOutCards = function (animationFrom, immediately) {
                var card = new Client.CardBack();
                card.rotation = Math.random() * Math.PI;
                card.setWidth(this._avatarSize / 5);
                card.x = animationFrom.x;
                card.y = animationFrom.y;
                this.addChildAt(card, 0);
                this._cardsBack.push(card);
                var coords = this._cardsPos.clone();
                coords.x = this._cardsPos.x * this._avatar.width / 2;
                coords.y = this._cardsPos.y * this._avatar.width / 2;
                if (immediately) {
                    card.x = coords.x;
                    card.y = coords.y;
                    card.rotation = this._endCardsRotation + (this._cardsBack.length == 1 ? 0 : 0.25);
                }
                else {
                    Client.Sounds.play(Client.SoundsHelper.GIVE_OUT_CARD);
                    Client.Tweener.to(card, 0.3, { x: coords.x, y: coords.y, rotation: this._endCardsRotation + (this._cardsBack.length == 1 ? 0 : 0.25) });
                }
            };
            Player.prototype.setAvatarSize = function (value) {
                _super.prototype.setAvatarSize.call(this, value);
                this._cards.setSize(value * 0.7);
                this._tfStack.fontSize = this._avatar.height / 5;
                this._tfStack.y = this._avatar.y + this._avatar.height + this._avatar.height / 20;
                this._bet.resize();
                this._bet.setIcon(Client.MBet.TYPE_FOLD);
                for (var i = 0; i < this._cardsBack.length; i++) {
                    this._cardsBack[i].setWidth(this._avatar.width / 5);
                    this._cardsBack[i].x = this._cardsPos.x * this._avatar.width / 2;
                    this._cardsBack[i].y = this._cardsPos.y * this._avatar.height / 2;
                }
                this._bet.x = this._betPos.x * this._avatar.width / 2;
                this._bet.y = this._betPos.y * this._avatar.height / 2;
                this._dealerIcon.x = this._dealerPos.x * this._avatar.width / 2;
                this._dealerIcon.y = this._dealerPos.y * this._avatar.height / 2;
                this._winnerLabel.setWidth(value);
                this._winnerLabel.x = -value * 0.5 + this._cards.x;
                this._winnerLabel.y = this._cards.height * 0.5 - this._winnerLabel.height;
                this._winBackEffect.setWidth(value);
                this._winBackEffect.position.set(0, 0);
            };
            Player.prototype.onCompleteAvatarCounter = function () {
                this._avatarTimeCounter.visible = false;
            };
            Player.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                Client.Tweener.killDelayedCallsTo(this._startAnimationGiveOutCards, this);
                this.destroyCardBacks();
            };
            Player.KOEF_CARDS_POS_OFFSET = 1.5;
            Player.KOEF_BET_POS_OFFSET = 1.6;
            Player.KOEF_DEALER_POS_OFFSET = 1.9;
            return Player;
        }(Client.PlayerBase));
        Client.Player = Player;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var PlayerBet = (function (_super) {
            __extends(PlayerBet, _super);
            function PlayerBet() {
                var _this = _super.call(this) || this;
                _this._expandSize = 20;
                _this._textOffset = 1;
                _this._maxExpandedWidth = 10;
                _this._expandToRight = true;
                _this._expanded = false;
                _this._expandAnimating = false;
                _this._cont = new PIXI.Container();
                _this.addChild(_this._cont);
                _this._bg = new PIXI.Graphics();
                _this._cont.addChild(_this._bg);
                _this._maskTf = new PIXI.Graphics();
                _this._cont.addChild(_this._maskTf);
                _this._icon = new PIXI.Sprite(Client.Resources.getTexture(Client.MBet.TYPE_BET_GREEN));
                _this._cont.addChild(_this._icon);
                _this._tfBet = new PIXI.Text('', Client.FontsHelper.Text.fontWhite10);
                _this._cont.addChild(_this._tfBet);
                _this._tfBet.mask = _this._maskTf;
                _this.draw();
                _this.setText('');
                _this.expandToRight = true;
                return _this;
            }
            PlayerBet.setIconSize = function (value) {
                PlayerBet._iconSize = value;
            };
            PlayerBet.prototype.expand = function (expand, immediately) {
                if (immediately === void 0) { immediately = false; }
                var oldExpanded = this._expanded;
                this._expanded = expand;
                Client.Tweener.killTweensOf(this);
                if (immediately) {
                    this._expandSize = expand ? this._maxExpandedWidth : PlayerBet._iconSize;
                    this.draw();
                }
                else {
                    if (this._expanded && oldExpanded)
                        this.expand(false, true);
                    this._expandAnimating = true;
                    Client.Tweener.to(this, 0.5, { _expandSize: (expand ? this._maxExpandedWidth : PlayerBet._iconSize), onUpdate: this.draw, onUpdateScope: this, onComplete: this.onCompleteExpandAnimation, onCompleteScope: this });
                }
            };
            PlayerBet.prototype.onCompleteExpandAnimation = function () {
                this._expandAnimating = false;
            };
            Object.defineProperty(PlayerBet.prototype, "expandToRight", {
                set: function (value) {
                    this._expandToRight = value;
                    this.updateTextParams();
                },
                enumerable: true,
                configurable: true
            });
            PlayerBet.prototype.resize = function () {
                Client.Tweener.killTweensOf(this);
                this._textOffset = PlayerBet._iconSize / 5;
                this._icon.texture = Client.Resources.scaleTexture(this._icon.texture, { height: PlayerBet._iconSize });
                this._icon.width = this._icon.height = PlayerBet._iconSize;
                this._tfBet.style.fontSize = PlayerBet._iconSize / 1.2;
                this._tfBet.y = PlayerBet._iconSize / 2 - this._tfBet.height / 2;
                this.updateTextParams();
                this.expand(this._expanded, true);
                this.draw();
            };
            PlayerBet.prototype.setIcon = function (key) {
                this._icon.texture = Client.Resources.getTexture(key, { height: PlayerBet._iconSize });
            };
            PlayerBet.prototype.setText = function (bet) {
                this._tfBet.text = bet;
                this.updateTextParams();
                this.expand(this._expanded, !this._expandAnimating);
            };
            PlayerBet.prototype.updateTextParams = function () {
                this._tfBet.x = this._expandToRight ? (this._icon.x + this._icon.width + this._textOffset) : (this._icon.x - this._tfBet.width - this._textOffset);
                this._maxExpandedWidth = this._icon.width + this._tfBet.width + this._textOffset * 2;
            };
            PlayerBet.prototype.draw = function () {
                var bgX = this._expandToRight ? 0 : -this._expandSize + PlayerBet._iconSize;
                this._bg.clear();
                this._bg.beginFill(0, 0.5);
                this._bg.drawRoundedRect(bgX, 0, this._expandSize, PlayerBet._iconSize, PlayerBet._iconSize / 2);
                this._maskTf.clear();
                this._maskTf.beginFill(0);
                this._maskTf.drawRect(bgX, 0, this._expandSize, PlayerBet._iconSize);
                this._cont.x = this._expandToRight ? -this._bg.width / 2 : this._bg.width / 2 - PlayerBet._iconSize;
            };
            PlayerBet.prototype.getClonedSprite = function () {
                var spr = new PIXI.Sprite(Client.Resources.scaleTexture(this._icon.texture, { height: PlayerBet._iconSize }));
                spr.width = spr.height = PlayerBet._iconSize;
                var global = this._icon.parent.toGlobal(this._icon.position);
                spr.x = global.x;
                spr.y = global.y;
                return spr;
            };
            PlayerBet.prototype.getIconSize = function () {
                return PlayerBet._iconSize;
            };
            PlayerBet.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                Client.Tweener.killTweensOf(this);
                this._bg.destroy();
                this._maskTf.destroy();
                this._tfBet.destroy();
                this._cont.destroy();
                this._icon.destroy();
            };
            PlayerBet._iconSize = 10;
            return PlayerBet;
        }(PIXI.Container));
        Client.PlayerBet = PlayerBet;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StandUpPopup = (function (_super) {
            __extends(StandUpPopup, _super);
            function StandUpPopup() {
                var _this = _super.call(this) || this;
                _this.HEADER_WIDTH_KOEF = 1;
                _this.HEADER_HEIGHT_KOEF = 0.176;
                _this.SETTINGS_UNIT_WIDTH_KOEF = 1;
                _this.SETTINGS_UNIT_HEIGHT_KOEF = 0.143;
                _this._units = new Array();
                _this._bg = new PIXI.Sprite(Client.Resources.getTexture(StandUpPopup.BG_TEXTURE_NAME));
                _this._bg.interactive = true;
                _this.addChild(_this._bg);
                _this._header = new Client.StandUpPopupHeader();
                _this._header.on(Client.StandUpPopupHeader.EVENT_CLOSE, function () { return _this.emit(StandUpPopup.EVENT_CLOSE); }, _this);
                _this.addChild(_this._header);
                _this.addUnit('stand_up_popup/exit', 'Exit to Lobby', StandUpPopup.OPTION_EXIT);
                _this.addUnit('stand_up_popup/stand_up', 'Stand Up', StandUpPopup.OPTION_STAND_UP);
                return _this;
            }
            StandUpPopup.prototype.setHeight = function (height) {
                this._h = height;
                var origBgTextureRect = Client.Resources.getOrigSize(this._bg.texture.baseTexture);
                this._w = this._h / origBgTextureRect.height * origBgTextureRect.width;
                this.update();
            };
            StandUpPopup.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            StandUpPopup.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._bg.destroy();
                this._header.destroy();
                this._units.forEach(function (u) { return u.destroy(); });
            };
            StandUpPopup.prototype.addUnit = function (texture, label, option) {
                var _this = this;
                var unit = new Client.StandUpPopupUnit(texture, label);
                unit.on(Client.StandUpPopupUnit.EVENT_CLICK, function () { return _this.emit(StandUpPopup.EVENT_SELECT_OPTION, option); });
                this._units.push(unit);
                this.addChild(unit);
            };
            StandUpPopup.prototype.update = function () {
                this._bg.texture = Client.Resources.getTexture(StandUpPopup.BG_TEXTURE_NAME, {
                    width: this._w,
                    height: this._h
                });
                this._bg.x = this._bg.y = 0;
                this._bg.width = this._w;
                this._bg.height = this._h;
                var headerWidth = this._w * this.HEADER_WIDTH_KOEF, headerHeight = this._h * this.HEADER_HEIGHT_KOEF;
                this._header.setPosition(0, 0);
                this._header.setSize(headerWidth, headerHeight);
                var settingsUnitWidth = this._w * this.SETTINGS_UNIT_WIDTH_KOEF, settingsUnitHeight = this._h * this.SETTINGS_UNIT_HEIGHT_KOEF;
                this._units.forEach(function (u, index) {
                    var x = 0, y = headerHeight + settingsUnitHeight * index;
                    u.setPosition(x, y);
                    u.setSize(settingsUnitWidth, settingsUnitHeight);
                });
            };
            StandUpPopup.EVENT_CLOSE = 'standuppopupclose';
            StandUpPopup.EVENT_SELECT_OPTION = 'standuppopupselectoption';
            StandUpPopup.OPTION_EXIT = 'OPTION_EXIT';
            StandUpPopup.OPTION_STAND_UP = 'OPTION_STAND_UP';
            StandUpPopup.OPTION_NEW_TABLE = 'OPTION_NEW_TABLE';
            StandUpPopup.OPTION_SELECT_NEW_TABLE = 'OPTION_SELECT_NEW_TABLE';
            StandUpPopup.BG_TEXTURE_NAME = 'stand_up_popup/bg';
            return StandUpPopup;
        }(PIXI.Container));
        Client.StandUpPopup = StandUpPopup;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StandUpPopupBg = (function (_super) {
            __extends(StandUpPopupBg, _super);
            function StandUpPopupBg() {
                var _this = _super.call(this) || this;
                _this.BACKGROUND_COLOR = 0x800d20;
                _this.BORDER_LEFT_COLOR = 0x4b051c;
                _this.BORDER_LEFT_KOEF = 0.02;
                _this.interactive = true;
                _this._bg = new PIXI.Graphics();
                _this.addChild(_this._bg);
                _this._border = new PIXI.Graphics();
                _this.addChild(_this._border);
                return _this;
            }
            StandUpPopupBg.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            StandUpPopupBg.prototype.setSize = function (width, height) {
                this._w = width;
                this._h = height;
                this.update();
            };
            StandUpPopupBg.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
            };
            StandUpPopupBg.prototype.drawBg = function () {
                this._bg.clear();
                this._bg.beginFill(this.BACKGROUND_COLOR);
                this._bg.drawRect(0, 0, this._w, this._h);
                this._bg.endFill();
            };
            StandUpPopupBg.prototype.drawBorder = function () {
                this._border.clear();
                this._border
                    .lineStyle(this._w * this.BORDER_LEFT_KOEF, this.BORDER_LEFT_COLOR)
                    .moveTo(0, 0)
                    .lineTo(0, this._h);
            };
            StandUpPopupBg.prototype.update = function () {
                this.drawBg();
                this.drawBorder();
            };
            return StandUpPopupBg;
        }(PIXI.Container));
        Client.StandUpPopupBg = StandUpPopupBg;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StandUpPopupHeader = (function (_super) {
            __extends(StandUpPopupHeader, _super);
            function StandUpPopupHeader() {
                var _this = _super.call(this) || this;
                _this.TITLE_FONT_SIZE_KOEF = 0.2;
                _this.TITLE_LEFT_OFFSET = 0.076;
                _this.CLOSE_BUTTON_RIGHT_OFFSET = 0.05;
                _this.CLOSE_BUTTON_WIDTH_KOEF = 0.223;
                _this._title = new PIXI.Text('OPTIONS', Client.FontsHelper.Text.fontForStandUpPopupUnit);
                _this.addChild(_this._title);
                _this._closeButton = new Client.ButtonImage('lobby/reward_video/close_button', 'lobby/reward_video/close_button', 'lobby/reward_video/close_button_down');
                _this._closeButton.on(Client.ButtonImage.EVENT_CLICK, _this.onCloseButtonClick, _this);
                _this.addChild(_this._closeButton);
                return _this;
            }
            StandUpPopupHeader.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            StandUpPopupHeader.prototype.setSize = function (width, height) {
                this._w = width;
                this._h = height;
                this.update();
            };
            StandUpPopupHeader.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._title.destroy();
                this._closeButton.destroy();
            };
            StandUpPopupHeader.prototype.onCloseButtonClick = function () {
                this.emit(StandUpPopupHeader.EVENT_CLOSE);
            };
            StandUpPopupHeader.prototype.update = function () {
                this._title.style.fontSize = this._w * this.TITLE_FONT_SIZE_KOEF;
                var titleX = this._w * this.TITLE_LEFT_OFFSET, titleY = this._h / 2 - this._title.height / 2;
                this._title.position.set(titleX, titleY);
                var buttonWidth = this._w * this.CLOSE_BUTTON_WIDTH_KOEF;
                this._closeButton.setWidth(buttonWidth, true);
                var buttonX = this._w * (1 - this.CLOSE_BUTTON_RIGHT_OFFSET) - buttonWidth, buttonY = this._h / 2 - this._closeButton.getHeight() / 1.75;
                this._closeButton.x = buttonX;
                this._closeButton.y = buttonY;
            };
            StandUpPopupHeader.EVENT_CLOSE = 'standuppopupheaderclose';
            return StandUpPopupHeader;
        }(PIXI.Container));
        Client.StandUpPopupHeader = StandUpPopupHeader;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var StandUpPopupUnit = (function (_super) {
            __extends(StandUpPopupUnit, _super);
            function StandUpPopupUnit(iconTextureName, label) {
                var _this = _super.call(this, 50, 50) || this;
                _this._iconTextureName = iconTextureName;
                _this._icon = new Client.RoundButton(iconTextureName);
                _this._icon.interactive = false;
                _this.addChild(_this._icon);
                _this._label = new Client.Text(label, Client.FontsHelper.Text.fontForStandUpPopupUnit);
                _this.addChild(_this._label);
                return _this;
            }
            StandUpPopupUnit.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            StandUpPopupUnit.prototype.setSize = function (width, height) {
                this._w = width;
                this._h = height;
                this.update();
            };
            StandUpPopupUnit.prototype.destroy = function () {
                _super.prototype.destroy.call(this);
                this._icon.destroy();
                this._label && this._label.destroy();
            };
            StandUpPopupUnit.prototype.onChangeState = function () {
                _super.prototype.onChangeState.call(this);
                this._icon.state = this._curState;
            };
            StandUpPopupUnit.prototype.update = function () {
                var iconHeight = this._w * StandUpPopupUnit.ICON_HEIGHT_KOEF;
                var iconX = this._w * StandUpPopupUnit.ICON_LEFT_OFFSET, iconY = this._h / 2 - iconHeight / 2;
                this._icon.setPosition(iconX, iconY);
                this._icon.setDiameter(iconHeight);
                this._label.fontSize = this._h * StandUpPopupUnit.LABEL_FONT_SIZE_KOEF;
                var labelX = this._w * (StandUpPopupUnit.ICON_LEFT_OFFSET + 0.07) + this._icon.getWidth(), labelY = this._h / 2 - this._label.height / 2;
                this._label.position.set(labelX, labelY);
            };
            StandUpPopupUnit.ICON_HEIGHT_KOEF = 0.25;
            StandUpPopupUnit.ICON_LEFT_OFFSET = 0.076;
            StandUpPopupUnit.LABEL_FONT_SIZE_KOEF = 0.3;
            return StandUpPopupUnit;
        }(Client.ButtonBase));
        Client.StandUpPopupUnit = StandUpPopupUnit;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var Bg = (function (_super) {
                __extends(Bg, _super);
                function Bg() {
                    var _this = _super.call(this) || this;
                    _this._w = 50;
                    _this._h = 50;
                    _this._patternSprites = [];
                    _this._bgSprite = new PIXI.Sprite(Client.Resources.getTexture(Bg.BG_TEXTURE_NAME));
                    _this.addChild(_this._bgSprite);
                    _this.__mask = new PIXI.Graphics();
                    _this._bgSprite.mask = _this.__mask;
                    _this.addChild(_this.__mask);
                    _this.fillByPattern();
                    return _this;
                }
                Bg.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    var origSize = Client.Resources.getOrigSize(this._bgSprite.texture.baseTexture), textureRatio = origSize.width / origSize.height, containerRatio = this._w / this._h, isScaleByWidth = textureRatio < containerRatio, scale = isScaleByWidth
                        ? this._w / origSize.width
                        : this._h / origSize.height;
                    this._bgSprite.texture = Client.Resources.getTexture(Bg.BG_TEXTURE_NAME, {
                        scale: scale,
                    });
                    this._bgSprite.width = origSize.width * scale;
                    this._bgSprite.height = origSize.height * scale;
                    this.drawMask();
                    this.resizePatternSprites();
                };
                Bg.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                };
                Bg.prototype.fillByPattern = function () {
                    var texture = Client.Resources.getTexture(Bg.BG_PATTERN_TEXTURE_NAME);
                    for (var i = 0; i < Bg.BG_PATTERN_COUNT_BY_Y; i++) {
                        var line = [];
                        this._patternSprites.push(line);
                        for (var j = 0; j < Bg.BG_PATTERN_COUNT_BY_X; j++) {
                            var sprite = new PIXI.Sprite(texture);
                            sprite.tint = 0;
                            sprite.alpha = 0.15;
                            line.push(sprite);
                            this.addChild(sprite);
                        }
                    }
                };
                Bg.prototype.resizePatternSprites = function () {
                    var texture = Client.Resources.getTexture(Bg.BG_PATTERN_TEXTURE_NAME);
                    var origSize = Client.Resources.getOrigSize(texture.baseTexture);
                    var width = Bg.BG_PATTERN_WIDTH_KOEF * this._bgSprite.width, height = width;
                    var x = 0, y = 0;
                    for (var i = 0; i < this._patternSprites.length; i++) {
                        var line = this._patternSprites[i];
                        y = (i - 1) * height * 1.25 / 2;
                        for (var j = 0; j < line.length; j++) {
                            var sprite = line[j];
                            x = j * width * 1.25 + (i % 2 - 1) * width * 1.25 / 2;
                            sprite.x = x;
                            sprite.y = y;
                            sprite.width = width;
                            sprite.height = height;
                        }
                    }
                };
                Bg.prototype.drawMask = function () {
                    this.__mask.clear();
                    this.__mask.beginFill(0);
                    this.__mask.drawRect(0, 0, this._w, this._h);
                    this.__mask.endFill();
                };
                Bg.BG_TEXTURE_NAME = 'lobby/bg';
                Bg.BG_PATTERN_TEXTURE_NAME = 'lobby/bg_pattern';
                Bg.BG_PATTERN_WIDTH_KOEF = 0.095;
                Bg.BG_PATTERN_COUNT_BY_X = 17;
                Bg.BG_PATTERN_COUNT_BY_Y = 12;
                return Bg;
            }(PIXI.Container));
            Lobby.Bg = Bg;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var ChipCounter = (function (_super) {
                __extends(ChipCounter, _super);
                function ChipCounter() {
                    var _this = _super.call(this) || this;
                    _this.CHIP_DIAMETER_KOEF = 1;
                    _this.CHIP_LEFT_OFFSET = 0;
                    _this.CHIP_TOP_OFFSET = 0;
                    _this.COUNT_FONT_SIZE_KOEF = 0.889;
                    _this.COUNT_LEFT_OFFSET = 1.238;
                    _this._maxExpandedWidth = 10;
                    _this._expandSize = 0;
                    _this._inited = false;
                    _this._cont = new PIXI.Container();
                    _this.addChild(_this._cont);
                    _this._maskTf = new PIXI.Graphics();
                    _this._cont.addChild(_this._maskTf);
                    _this._count = new PIXI.Text('', Client.FontsHelper.Text.fontForChipCounter);
                    _this._cont.addChild(_this._count);
                    _this._chipSprite = new PIXI.Sprite(Client.Resources.getTexture('lobby/chip', { drawNewTexture: true }));
                    _this._cont.addChild(_this._chipSprite);
                    _this._count.mask = _this._maskTf;
                    return _this;
                }
                Object.defineProperty(ChipCounter.prototype, "count", {
                    set: function (value) {
                        if (value == undefined)
                            return;
                        var formattedValue = Client.StringHelper.numberWithCommas(value);
                        this._count.text = "$" + formattedValue;
                        this.updateTextParams();
                        if (!this._inited) {
                            this._inited = true;
                            Client.Tweener.to(this, 0.5, { _expandSize: this._maxExpandedWidth, onUpdate: this.draw, onUpdateScope: this, onComplete: this.onCompleteExpandAnimation, onCompleteScope: this });
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                ChipCounter.prototype.onCompleteExpandAnimation = function () {
                    this._count.mask = null;
                    if (this._maskTf.parent)
                        this._maskTf.parent.removeChild(this._maskTf);
                    this._maskTf.destroy();
                };
                ChipCounter.prototype.draw = function () {
                    this._maskTf.clear();
                    this._maskTf.beginFill(0);
                    this._maskTf.drawRect(0, 0, this._expandSize, this._chipSprite.height);
                    this._cont.x = -this._expandSize / 2;
                };
                Object.defineProperty(ChipCounter.prototype, "actualWidth", {
                    get: function () {
                        return this._count.x + this._count.width;
                    },
                    enumerable: true,
                    configurable: true
                });
                ChipCounter.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                ChipCounter.prototype.setHeight = function (height) {
                    this._h = height;
                    this.update();
                };
                ChipCounter.prototype.updateTextParams = function () {
                    var titleX = this._h * this.COUNT_LEFT_OFFSET, titleY = this._h / 2 - this._count.height / 2;
                    this._count.position.set(titleX, titleY);
                    this._maxExpandedWidth = this.actualWidth;
                };
                ChipCounter.prototype.update = function () {
                    Client.Tweener.killTweensOf(this);
                    this._count.style.fontSize = this._h * this.COUNT_FONT_SIZE_KOEF;
                    var chipDiameter = this._h * this.CHIP_DIAMETER_KOEF, chipX = this._h * this.CHIP_LEFT_OFFSET, chipY = this._h * this.CHIP_TOP_OFFSET;
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('lobby/chip').baseTexture);
                    var scale = chipDiameter / origRect.height;
                    this._chipSprite.texture = Client.Resources.scaleTexture(this._chipSprite.texture, { scale: scale });
                    this._chipSprite.position.set(chipX, chipY);
                    this._chipSprite.width = this._chipSprite.height = chipDiameter;
                    this.updateTextParams();
                    this.pivot.x = -this.actualWidth / 2;
                };
                ChipCounter.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    Client.Tweener.killTweensOf(this);
                    this._count.destroy();
                    this._chipSprite.destroy();
                };
                return ChipCounter;
            }(PIXI.Container));
            Lobby.ChipCounter = ChipCounter;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var HourlyDrip = (function (_super) {
                __extends(HourlyDrip, _super);
                function HourlyDrip() {
                    var _this = _super.call(this, 10, 10) || this;
                    _this.SPRITE_HEIGHT_KOEF = 1;
                    _this.SPRITE_LEFT_OFFSET = 0;
                    _this.SPRITE_TOP_OFFSET = 0;
                    _this.REST_OF_TIME_FONT_SIZE_KOEF = 0.206;
                    _this.REST_OF_TIME_LEFT_OFFSET = 0.188;
                    _this._sprite = new PIXI.Sprite();
                    _this.addChild(_this._sprite);
                    _this._restOfTime = new PIXI.Text('', Client.FontsHelper.Text.fontForHourlyDrip);
                    _this.addChild(_this._restOfTime);
                    _this._availibilityLabel = new PIXI.Text(HourlyDrip.AVAILABILITY_TEXT, Client.FontsHelper.Text.fontForHourlyDrip);
                    _this.addChild(_this._availibilityLabel);
                    return _this;
                }
                Object.defineProperty(HourlyDrip.prototype, "time", {
                    set: function (fullSeconds) {
                        if (!fullSeconds) {
                            this.disabled = false;
                            return;
                        }
                        var seconds = fullSeconds % 60, fullMinutes = (fullSeconds / 60) >> 0, minutes = fullMinutes % 60, hours = (fullMinutes / 60) >> 0;
                        var text = '';
                        if (hours) {
                            text += ":" + hours + "h";
                        }
                        if (hours || minutes) {
                            text += ":" + (((minutes < 10) && hours) ? 0 : '') + minutes + "m";
                        }
                        text += ":" + ((seconds < 10) ? 0 : '') + seconds + "s";
                        this._restOfTime.text = text;
                        this.setTextPosition();
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(HourlyDrip.prototype, "actualWidth", {
                    get: function () {
                        return this._restOfTime.x + this._restOfTime.width;
                    },
                    enumerable: true,
                    configurable: true
                });
                HourlyDrip.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                HourlyDrip.prototype.setHeight = function (height) {
                    this._h = height;
                    this.update();
                };
                HourlyDrip.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._restOfTime.destroy();
                    this._sprite.destroy();
                };
                HourlyDrip.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    var isDisabledState = this._curState === HourlyDrip.STATE_DISABLED;
                    this.buttonMode = !isDisabledState;
                    this.alpha = !isDisabledState && 1 || 0.75;
                    this._availibilityLabel.visible = !(this._restOfTime.visible = isDisabledState);
                };
                HourlyDrip.prototype.update = function () {
                    var spriteHeight = this._h * this.SPRITE_HEIGHT_KOEF, spriteX = this._h * this.SPRITE_LEFT_OFFSET, spriteY = this._h * this.SPRITE_TOP_OFFSET;
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('lobby/hourly_drip').baseTexture);
                    var scale = spriteHeight / origRect.height;
                    this._w = origRect.width * scale * (2 - this.SPRITE_HEIGHT_KOEF);
                    this._sprite.texture = Client.Resources.getTexture('lobby/hourly_drip', {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._sprite.position.set(spriteX, spriteY);
                    this._sprite.height = scale * origRect.height;
                    this._sprite.width = scale * origRect.width;
                    this.resizeText();
                };
                HourlyDrip.prototype.resizeText = function () {
                    this._availibilityLabel.style.fontSize = this._restOfTime.style.fontSize = this._h * this.REST_OF_TIME_FONT_SIZE_KOEF;
                    this.setTextPosition();
                };
                HourlyDrip.prototype.setTextPosition = function () {
                    var lineWidth = this._w * 0.48, lineOffset = this._w * 0.067;
                    var restOfTimeX = lineWidth - this._restOfTime.width, availabilityX = lineOffset + (lineWidth - this._availibilityLabel.width) / 2, titleY = (this._h - this._restOfTime.height) / 1.98;
                    this._restOfTime.position.set(restOfTimeX, titleY);
                    this._availibilityLabel.position.set(availabilityX, titleY);
                };
                HourlyDrip.AVAILABILITY_TEXT = 'Get chips';
                return HourlyDrip;
            }(Client.ButtonBase));
            Lobby.HourlyDrip = HourlyDrip;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var HourlyDripTip = (function (_super) {
                __extends(HourlyDripTip, _super);
                function HourlyDripTip() {
                    var _this = _super.call(this, '', Client.FontsHelper.Text.fontForHourlyDripTip) || this;
                    _this.visible = false;
                    return _this;
                }
                HourlyDripTip.prototype.show = function (earned) {
                    this.earned = earned;
                    this.beforeShow();
                    Client.Tweener.to(this, HourlyDripTip.SHOWING_DURATION, {
                        alpha: 1,
                        onComplete: this.waitAndHide,
                        onCompleteScope: this,
                    });
                };
                HourlyDripTip.prototype.hide = function () {
                    Client.trace('[HourlyDripTip] before hide');
                    Client.Tweener.to(this, HourlyDripTip.HIDING_DURATION, {
                        alpha: 0,
                        onComplete: this.afterHide,
                        onCompleteScope: this,
                    });
                };
                HourlyDripTip.prototype.waitAndHide = function () {
                    Client.Tweener.killTweensOf(this);
                    Client.trace('[HourlyDripTip] after show');
                    setTimeout(this.hide.bind(this), HourlyDripTip.WAITING_DURATION);
                };
                HourlyDripTip.prototype.beforeShow = function () {
                    this.visible = true;
                    this.alpha = 0;
                    Client.trace('[HourlyDripTip] before show');
                };
                HourlyDripTip.prototype.afterHide = function () {
                    this.visible = false;
                    Client.trace('[HourlyDripTip] after hide');
                };
                Object.defineProperty(HourlyDripTip.prototype, "earned", {
                    set: function (value) {
                        this.text = HourlyDripTip.TEXT_FORMAT.replace('%count%', Client.StringHelper.numberWithCommas(value));
                    },
                    enumerable: true,
                    configurable: true
                });
                HourlyDripTip.TEXT_FORMAT = '+%count% chips';
                HourlyDripTip.SHOWING_DURATION = 0.3;
                HourlyDripTip.HIDING_DURATION = 0.8;
                HourlyDripTip.WAITING_DURATION = 1500;
                return HourlyDripTip;
            }(Client.Text));
            Lobby.HourlyDripTip = HourlyDripTip;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var OpenSettingsButton = (function (_super) {
                __extends(OpenSettingsButton, _super);
                function OpenSettingsButton() {
                    return _super.call(this, 'lobby/settings_icon') || this;
                }
                return OpenSettingsButton;
            }(Client.RoundButton));
            Lobby.OpenSettingsButton = OpenSettingsButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var NamedAligns = (function () {
                function NamedAligns() {
                }
                NamedAligns.LEFT = 0;
                NamedAligns.RIGHT = 1;
                NamedAligns.CENTER = 1 / 2;
                return NamedAligns;
            }());
            Lobby.NamedAligns = NamedAligns;
            var Sprite = (function () {
                function Sprite(textureName) {
                    this.offset = { left: 0, right: 0, top: 0, bottom: 0 };
                    this.scale = { width: 1, height: 1 };
                    this.align = { x: NamedAligns.LEFT, y: NamedAligns.LEFT };
                    this._textureName = textureName;
                    this._sprite = new PIXI.Sprite();
                }
                Sprite.prototype.addTo = function (parent) {
                    parent.addChild(this._sprite);
                };
                Sprite.prototype.resize = function (outerWidth, outerHeight) {
                    var baseTexture = this.getTexture().baseTexture, origRect = Client.Resources.getOrigSize(baseTexture);
                    var availableWidth = outerWidth * (1 - this.offset.right - this.offset.left), availableHeight = outerHeight * (1 - this.offset.top - this.offset.bottom);
                    var width = availableWidth * this.scale.width, height = availableHeight * this.scale.height;
                    switch (this.saveProportionsBy) {
                        case 'width':
                            height = origRect.height * (width / origRect.width);
                            break;
                        case 'height':
                            width = origRect.width * (height / origRect.height);
                            break;
                    }
                    var leftOffset = outerWidth * this.offset.left, topOffset = outerHeight * this.offset.top, x = leftOffset + this.align.x * (availableWidth - width), y = topOffset + this.align.y * (availableHeight - height);
                    this._sprite.texture = this.getTexture({
                        scale: height / origRect.height,
                        drawNewTexture: true,
                    });
                    this._sprite.x = x;
                    this._sprite.y = y;
                    this._sprite.width = width;
                    this._sprite.height = height;
                };
                Sprite.prototype.destroy = function () {
                    this._sprite.destroy();
                };
                Sprite.prototype.getTexture = function (params) {
                    return Client.Resources.getTexture(this._textureName, params);
                };
                return Sprite;
            }());
            Lobby.Sprite = Sprite;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var VideoPlayer = (function (_super) {
                __extends(VideoPlayer, _super);
                function VideoPlayer() {
                    var _this = _super.call(this) || this;
                    _this._bgSprite = new PIXI.Sprite(Client.Resources.getTexture(VideoPlayer.BG_TEXTURE_NAME));
                    _this.addChild(_this._bgSprite);
                    _this._videoSprite = new PIXI.Sprite();
                    _this.addChild(_this._videoSprite);
                    return _this;
                }
                Object.defineProperty(VideoPlayer.prototype, "source", {
                    set: function (source) {
                        this._source = source;
                        this._videoSprite.texture = PIXI.Texture.fromVideo(source);
                        var el = this._videoSprite.texture.baseTexture.source;
                        el.onplaying = this.onStart.bind(this);
                        el.onended = this.onFinish.bind(this);
                    },
                    enumerable: true,
                    configurable: true
                });
                VideoPlayer.prototype.onLoad = function () {
                };
                VideoPlayer.prototype.onStart = function () {
                    this.resizeVideo(this._videoSprite.texture.baseTexture.width, this._videoSprite.texture.baseTexture.height);
                    this.emit(VideoPlayer.EVENT_START, this._source);
                };
                VideoPlayer.prototype.onFinish = function () {
                    this.emit(VideoPlayer.EVENT_FINISH, this._source);
                };
                VideoPlayer.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                VideoPlayer.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                VideoPlayer.prototype.getWidth = function () {
                    return this._w;
                };
                VideoPlayer.prototype.getHeight = function () {
                    return this._h;
                };
                VideoPlayer.prototype.update = function () {
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(VideoPlayer.BG_TEXTURE_NAME).baseTexture);
                    this._bgSprite.texture = Client.Resources.getTexture(VideoPlayer.BG_TEXTURE_NAME, {
                        width: this._w,
                        height: this._h,
                        drawNewTexture: true,
                    });
                    this._bgSprite.width = this._w;
                    this._bgSprite.height = this._h;
                };
                VideoPlayer.prototype.resizeVideo = function (origWidth, origHeight) {
                    Client.trace('[origVideoSize]', origWidth, origHeight);
                    var componentRatio = this._w / this._h, videoRatio = origWidth / origHeight;
                    var videoWidth = 0, videoHeight = 0;
                    if (componentRatio < videoRatio) {
                        videoWidth = this._w * VideoPlayer.VIDEO_SCALE_KOEF;
                        videoHeight = videoWidth / videoRatio;
                    }
                    else {
                        videoHeight = this._h * VideoPlayer.VIDEO_SCALE_KOEF;
                        videoWidth = videoHeight * videoRatio;
                    }
                    this._videoSprite.width = videoWidth;
                    this._videoSprite.height = videoHeight;
                    Client.trace('[videoSize]', videoWidth, videoHeight);
                    this._videoSprite.x = (this._bgSprite.width - this._videoSprite.width) / 2;
                    this._videoSprite.y = (this._bgSprite.height - this._videoSprite.height) / 2;
                };
                VideoPlayer.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bgSprite.destroy();
                    this._videoSprite.destroy();
                };
                VideoPlayer.EVENT_START = 'videoplayerstart';
                VideoPlayer.EVENT_FINISH = 'videoplayerfinish';
                VideoPlayer.BG_TEXTURE_NAME = 'lobby/reward_video/bg';
                VideoPlayer.VIDEO_SCALE_KOEF = 0.9;
                return VideoPlayer;
            }(PIXI.Container));
            Lobby.VideoPlayer = VideoPlayer;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var FreeChipsBg = (function (_super) {
                __extends(FreeChipsBg, _super);
                function FreeChipsBg() {
                    var _this = _super.call(this) || this;
                    _this._bgSprite = new PIXI.Sprite();
                    _this.addChild(_this._bgSprite);
                    _this._bgSpriteMask = new PIXI.Sprite();
                    _this._bgSpriteMask.tint = 0;
                    _this._picture = new PIXI.Sprite();
                    _this._picture.mask = _this._bgSpriteMask;
                    _this.addChild(_this._picture);
                    _this.addChild(_this._bgSpriteMask);
                    return _this;
                }
                Object.defineProperty(FreeChipsBg.prototype, "pictureTexture", {
                    set: function (nextPictureTexture) {
                        this._picture.texture = nextPictureTexture;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FreeChipsBg.prototype, "tint", {
                    set: function (value) {
                        this._bgSprite.tint = value;
                        this._picture.tint = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                FreeChipsBg.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                FreeChipsBg.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                FreeChipsBg.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bgSprite.destroy();
                    this._bgSpriteMask.destroy();
                    this._picture.destroy();
                };
                FreeChipsBg.prototype.update = function () {
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('lobby/free_chips_bg').baseTexture);
                    this._bgSprite.texture = Client.Resources.getTexture('lobby/free_chips_bg', {
                        scale: this._h / origRect.height,
                        drawNewTexture: true,
                    });
                    this._bgSprite.width = this._w;
                    this._bgSprite.height = this._h;
                    this._bgSpriteMask.texture = Client.Resources.getTexture('lobby/free_chips_mask', {
                        scale: this._h / origRect.height,
                        drawNewTexture: true,
                    });
                    this._bgSpriteMask.width = this._bgSprite.width;
                    this._bgSpriteMask.height = this._bgSprite.height;
                    this._picture.x = this._w * FreeChipsBg.PICTURE_X_OFFSET;
                    this._picture.width = this._w * (1 - 2 * FreeChipsBg.PICTURE_X_OFFSET);
                    this._picture.height = this._h * FreeChipsBg.PICTURE_HEIGHT_KOEF;
                };
                FreeChipsBg.BORDER_OFFSET_X_KOEF = 0.041;
                FreeChipsBg.BORDER_OFFSET_Y_KOEF = 0.027;
                FreeChipsBg.SHADOW_OFFSET_KOEF = 0.02;
                FreeChipsBg.PICTURE_TOP_OFFSET = 0;
                FreeChipsBg.PICTURE_X_OFFSET = 0;
                FreeChipsBg.PICTURE_HEIGHT_KOEF = 0.55;
                return FreeChipsBg;
            }(PIXI.Container));
            Lobby.FreeChipsBg = FreeChipsBg;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var FreeChipsBody = (function (_super) {
                __extends(FreeChipsBody, _super);
                function FreeChipsBody() {
                    var _this = _super.call(this) || this;
                    _this.init();
                    return _this;
                }
                Object.defineProperty(FreeChipsBody.prototype, "tint", {
                    set: function (value) {
                        this._topLabel.tint = value;
                        this._bottomLabel.tint = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                FreeChipsBody.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                FreeChipsBody.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                    this.update();
                };
                FreeChipsBody.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._topLabel.destroy();
                    this._bottomLabel.destroy();
                };
                FreeChipsBody.prototype.init = function () {
                    this._topLabel = new PIXI.Text(FreeChipsBody.TOP_LABEL_TEXT, Client.FontsHelper.Text.fontForFreeChipsPanelTopLabel);
                    this.addChild(this._topLabel);
                    this._bottomLabel = new PIXI.Text(FreeChipsBody.BOTTOM_LABEL_TEXT, Client.FontsHelper.Text.fontForFreeChipsPanelBottomLabel);
                    this.addChild(this._bottomLabel);
                };
                FreeChipsBody.prototype.update = function () {
                    this._topLabel.style.fontSize = this._h * FreeChipsBody.TOP_LABEL_FONT_SIZE_KOEF;
                    this._bottomLabel.style.fontSize = this._h * FreeChipsBody.BOTTOM_LABEL_FONT_SIZE_KOEF;
                    this._topLabel.y = this._h * FreeChipsBody.TOP_LABEL_TOP_OFFSET;
                    this._bottomLabel.y = this._h * FreeChipsBody.BOTTOM_LABEL_TOP_OFFSET;
                    this._topLabel.x = this._w / 2 - this._topLabel.width / 2;
                    this._bottomLabel.x = this._w / 2 - this._bottomLabel.width / 2;
                };
                FreeChipsBody.TOP_LABEL_TEXT = 'WATCH TO';
                FreeChipsBody.BOTTOM_LABEL_TEXT = 'GET MORE CHIPS';
                FreeChipsBody.TOP_LABEL_TOP_OFFSET = 0.594;
                FreeChipsBody.BOTTOM_LABEL_TOP_OFFSET = 0.696;
                FreeChipsBody.TOP_LABEL_FONT_SIZE_KOEF = 0.082;
                FreeChipsBody.BOTTOM_LABEL_FONT_SIZE_KOEF = 0.104;
                return FreeChipsBody;
            }(PIXI.Container));
            Lobby.FreeChipsBody = FreeChipsBody;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var FreeChipsButton = (function (_super) {
                __extends(FreeChipsButton, _super);
                function FreeChipsButton() {
                    var _this = _super.call(this, 220, 57) || this;
                    _this._text = 'FREE';
                    _this._colorDisabled = 0xcccccc;
                    _this._colorUp = 0x930616;
                    _this._colorDown = 0xb10616;
                    _this._bg = new PIXI.Sprite();
                    _this.addChild(_this._bg);
                    _this._label = new PIXI.Text(_this._text, Client.FontsHelper.Text.fontForFreeChipsButton);
                    _this.addChild(_this._label);
                    return _this;
                }
                Object.defineProperty(FreeChipsButton.prototype, "currentState", {
                    get: function () {
                        return this._curState;
                    },
                    enumerable: true,
                    configurable: true
                });
                FreeChipsButton.prototype.onResize = function () {
                    var downX = this._w * FreeChipsButton.SCALE_X_KOEF, downY = this._h * FreeChipsButton.SCALE_Y_KOEF, downWidth = this._w * (1 - 2 * FreeChipsButton.SCALE_X_KOEF), downHeight = this._h * (1 - 2 * FreeChipsButton.SCALE_Y_KOEF);
                    var bgX = this._bg.x = this._curState === FreeChipsButton.STATE_DOWN ? downX : 0, bgY = this._curState === FreeChipsButton.STATE_DOWN ? downY : 0, bgWidth = this._curState === FreeChipsButton.STATE_DOWN ? downWidth : this._w, bgHeight = this._curState === FreeChipsButton.STATE_DOWN ? downHeight : this._h;
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture('lobby/free_chips_button').baseTexture);
                    this._bg.texture = Client.Resources.getTexture('lobby/free_chips_button', {
                        scale: bgHeight / origRect.height,
                        drawNewTexture: true,
                    });
                    this._bg.x = bgX;
                    this._bg.y = bgY;
                    this._bg.width = bgWidth;
                    this._bg.height = bgHeight;
                    this._label.style.fontSize = this._w * FreeChipsButton.CAPTION_FONT_SIZE_KOEF;
                    this._label.x = this._w * FreeChipsButton.CAPTION_LEFT_OFFSET;
                    this._label.y = this._h / 2 - this._label.height / 2;
                };
                FreeChipsButton.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    if (this._curState === FreeChipsButton.STATE_DISABLED) {
                        this._bg.tint = this._colorDisabled;
                        this._label.alpha = 0.7;
                    }
                    else {
                        this._bg.tint = 0xffffff;
                        this._label.alpha = 1;
                    }
                    this.onResize();
                };
                FreeChipsButton.prototype.setWidth = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setWidth.call(this, value, saveProportions);
                    this.onResize();
                };
                FreeChipsButton.prototype.setHeight = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setHeight.call(this, value, saveProportions);
                    this.onResize();
                };
                FreeChipsButton.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._label.destroy();
                };
                FreeChipsButton.CAPTION_FONT_SIZE_KOEF = 0.155;
                FreeChipsButton.CAPTION_LEFT_OFFSET = 0.483;
                FreeChipsButton.SCALE_X_KOEF = 0.025;
                FreeChipsButton.SCALE_Y_KOEF = 0.075;
                return FreeChipsButton;
            }(Client.ButtonBase));
            Lobby.FreeChipsButton = FreeChipsButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var FreeChipsPanel = (function (_super) {
                __extends(FreeChipsPanel, _super);
                function FreeChipsPanel() {
                    var _this = _super.call(this, 270, 440) || this;
                    _this.BUTTON_WIDTH_KOEF = 0.889;
                    _this.BUTTON_HEIGHT_KOEF = 0.165;
                    _this.BUTTON_TOP_OFFSET = 0.79;
                    _this.BUTTON_LEFT_OFFSET = 0.09;
                    _this.SCALE_X_KOEF = 0.016;
                    _this.SCALE_Y_KOEF = 0.01;
                    _this.isScaled = false;
                    _this._colorDisabled = 0xcccccc;
                    _this.init();
                    return _this;
                }
                Object.defineProperty(FreeChipsPanel.prototype, "disabled", {
                    get: function () {
                        return this._curState == Client.ButtonBase.STATE_DISABLED;
                    },
                    set: function (value) {
                        this._curState = value ? Client.ButtonBase.STATE_DISABLED : Client.ButtonBase.STATE_UP;
                        this._button.disabled = value;
                        this.onChangeState();
                    },
                    enumerable: true,
                    configurable: true
                });
                FreeChipsPanel.prototype.setWidth = function (value) {
                    this._h *= value / this._w;
                    this._w = value;
                    this.update();
                };
                FreeChipsPanel.prototype.setPosition = function (x, y) {
                    this._x = x;
                    this._y = y;
                    this.update();
                };
                Object.defineProperty(FreeChipsPanel.prototype, "pictureTexture", {
                    set: function (value) {
                        this._bg.pictureTexture = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FreeChipsPanel.prototype, "isNeedToScale", {
                    get: function () {
                        return this._curState === Lobby.FreeChipsButton.STATE_DOWN &&
                            this._button.currentState === Lobby.FreeChipsButton.STATE_UP;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FreeChipsPanel.prototype, "actualX", {
                    get: function () {
                        return this.isNeedToScale && this._w * this.SCALE_X_KOEF || 0;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FreeChipsPanel.prototype, "actualY", {
                    get: function () {
                        return this.isNeedToScale && this._h * this.SCALE_X_KOEF || 0;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FreeChipsPanel.prototype, "actualWidth", {
                    get: function () {
                        return this.isNeedToScale && this._w * (1 - 2 * this.SCALE_X_KOEF) || this._w;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(FreeChipsPanel.prototype, "actualHeight", {
                    get: function () {
                        return this.isNeedToScale && this._h * (1 - 2 * this.SCALE_X_KOEF) || this._h;
                    },
                    enumerable: true,
                    configurable: true
                });
                FreeChipsPanel.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._button.destroy();
                    this._body.destroy();
                };
                FreeChipsPanel.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    if (this._curState === Lobby.SelectTableButton.STATE_DISABLED) {
                        this._bg.tint = this._body.tint = this._colorDisabled;
                        this._bg.alpha = this._body.alpha = 0.7;
                    }
                    else {
                        this._bg.tint = this._body.tint = 0xffffff;
                        this._bg.alpha = this._body.alpha = 1;
                    }
                    this.update();
                };
                FreeChipsPanel.prototype.init = function () {
                    this._bg = new Lobby.FreeChipsBg();
                    this.addChild(this._bg);
                    this._button = new Lobby.FreeChipsButton();
                    this.addChild(this._button);
                    this._body = new Lobby.FreeChipsBody();
                    this.addChild(this._body);
                };
                FreeChipsPanel.prototype.update = function () {
                    this.x = this._x + this.actualX;
                    this.y = this._y + this.actualY;
                    if (this.isNeedToScale && !this.isScaled) {
                        this.width *= (1 - 2 * this.SCALE_X_KOEF);
                        this.height *= (1 - 2 * this.SCALE_Y_KOEF);
                        this.isScaled = true;
                    }
                    else if (!this.isNeedToScale && this.isScaled) {
                        this.width /= (1 - 2 * this.SCALE_X_KOEF);
                        this.height /= (1 - 2 * this.SCALE_Y_KOEF);
                        this.isScaled = false;
                    }
                    var x = 0, y = 0, w = this._w, h = this._h;
                    this._bg.setPosition(x, y);
                    this._bg.setSize(w, h);
                    var buttonWidth = w * this.BUTTON_WIDTH_KOEF, buttonHeight = h * this.BUTTON_HEIGHT_KOEF;
                    this._button.x = x + w / 2 - buttonWidth / 2;
                    this._button.y = h * this.BUTTON_TOP_OFFSET;
                    this._button.setWidth(buttonWidth);
                    this._button.setHeight(buttonHeight);
                    this._body.setPosition(x, y);
                    this._body.setSize(w, h);
                };
                return FreeChipsPanel;
            }(Client.ButtonBase));
            Lobby.FreeChipsPanel = FreeChipsPanel;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var NotEnoughPopup = (function (_super) {
                __extends(NotEnoughPopup, _super);
                function NotEnoughPopup() {
                    var _this = _super.call(this) || this;
                    _this.BUTTON_WIDTH_KOEF = 0.396;
                    _this.BUTTON_HEIGHT_KOEF = 0.1;
                    _this.BUTTON_TOP_OFFSET = 0.816;
                    _this.HEADER_FONT_SIZE_KOEF = 0.06;
                    _this.HEADER_TOP_OFFSET = 0.09;
                    _this.BODY_FONT_SIZE_KOEF = 0.04;
                    _this.BODY_WRAP_WIDTH_KOEF = 0.86;
                    _this.BODY_TOP_OFFSET = 0.195;
                    _this.PICTURE_WIDTH_KOEF = 0.781;
                    _this.PICTURE_TOP_OFFSET = 0.277;
                    _this.CLOSE_BUTTON_DIAMETER_KOEF = 0.076;
                    _this.init();
                    return _this;
                }
                NotEnoughPopup.prototype.setSize = function (width, height) {
                    this._h = height;
                    this._w = width;
                    this.update();
                };
                NotEnoughPopup.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._button.destroy();
                    this._header.destroy();
                    this._body.destroy();
                };
                NotEnoughPopup.prototype.init = function () {
                    var _this = this;
                    this._bg = new Lobby.NotEnoughPopupBg();
                    this.addChild(this._bg);
                    this._button = new Lobby.NotEnoughPopupButton();
                    this._button.on(Lobby.NotEnoughPopupButton.EVENT_CLICK, function () {
                        _this.emit(NotEnoughPopup.EVENT_OK);
                    });
                    this.addChild(this._button);
                    this._closeButton = new Client.ButtonImage('lobby/reward_video/close_button', 'lobby/reward_video/close_button', 'lobby/reward_video/close_button_down');
                    this._closeButton.on(Client.RoundButton.EVENT_CLICK, function () {
                        _this.emit(NotEnoughPopup.EVENT_CLOSE);
                    });
                    this.addChild(this._closeButton);
                    this._header = new Client.Text(NotEnoughPopup.HEADER_TEXT_TEMPLATE, Client.FontsHelper.Text.fontForNotEnoughPopupHeader);
                    this.addChild(this._header);
                    this._body = new Client.Text(NotEnoughPopup.BODY_TEXT_TEMPLATE, Client.FontsHelper.Text.fontForNotEnoughPopupBody);
                    this.addChild(this._body);
                    this._picture = new PIXI.Sprite(Client.Resources.getTexture('lobby/reward_video/picture'));
                    this.addChild(this._picture);
                };
                Object.defineProperty(NotEnoughPopup.prototype, "disabled", {
                    get: function () {
                        return this._button.disabled;
                    },
                    set: function (d) {
                        this._button.disabled = d;
                    },
                    enumerable: true,
                    configurable: true
                });
                NotEnoughPopup.prototype.update = function () {
                    var x = 0, y = 0, w = this._w, h = this._h;
                    this._bg.setPosition(x, y);
                    this._bg.setSize(w, h);
                    var buttonWidth = w * this.BUTTON_WIDTH_KOEF, buttonHeight = h * this.BUTTON_HEIGHT_KOEF;
                    this._button.x = x + w / 2 - buttonWidth / 2;
                    this._button.y = h * this.BUTTON_TOP_OFFSET;
                    this._button.setWidth(buttonWidth);
                    this._button.setHeight(buttonHeight);
                    var closeButtonDiameter = w * this.CLOSE_BUTTON_DIAMETER_KOEF;
                    this._closeButton.x = w - closeButtonDiameter / 4 * 3;
                    this._closeButton.y = 0 - closeButtonDiameter / 4 * 1;
                    this._closeButton.setWidth(closeButtonDiameter, true);
                    this._header.fontSize = h * this.HEADER_FONT_SIZE_KOEF;
                    var headerX = w / 2 - this._header.width / 2, headerY = h * this.HEADER_TOP_OFFSET;
                    this._header.position.set(headerX, headerY);
                    this._body.fontSize = h * this.BODY_FONT_SIZE_KOEF;
                    this._body.wrapWidth = w * this.BODY_WRAP_WIDTH_KOEF;
                    var bodyX = w / 2 - this._body.width / 2, bodyY = h * this.BODY_TOP_OFFSET;
                    this._body.position.set(bodyX, bodyY);
                    var pictureWidth = this._w * this.PICTURE_WIDTH_KOEF, origRect = Client.Resources.getOrigSize(this._picture.texture.baseTexture), pictureHeight = pictureWidth / origRect.width * origRect.height;
                    this._picture.width = pictureWidth;
                    this._picture.height = pictureHeight;
                    this._picture.x = this._w / 2 - pictureWidth / 2;
                    this._picture.y = this._h * this.PICTURE_TOP_OFFSET;
                };
                NotEnoughPopup.EVENT_CLOSE = 'notenoughpopupclose';
                NotEnoughPopup.EVENT_OK = 'notenoughpopupok';
                NotEnoughPopup.HEADER_TEXT_TEMPLATE = 'NOT ENOUGH CHIPS';
                NotEnoughPopup.BODY_TEXT_TEMPLATE = 'Watch video to earn more chips.';
                return NotEnoughPopup;
            }(PIXI.Container));
            Lobby.NotEnoughPopup = NotEnoughPopup;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var NotEnoughPopupBg = (function (_super) {
                __extends(NotEnoughPopupBg, _super);
                function NotEnoughPopupBg() {
                    var _this = _super.call(this) || this;
                    _this._stars = [];
                    _this._bottomChips = [];
                    _this._bottomChipsKoefs = [
                        { x: 0.243, y: 0.306, width: 0.101, id: 1 },
                        { x: 0.207, y: 0.233, width: 0.083, id: 2 },
                        { x: 0.879, y: 0.403, width: 0.110, id: 3 },
                        { x: 0.202, y: 0.482, width: 0.102, id: 1 },
                        { x: 0.091, y: 0.381, width: 0.071, id: 1 },
                        { x: 0.767, y: 0.541, width: 0.083, id: 2 },
                        { x: 0.688, y: 0.213, width: 0.111, id: 2 },
                        { x: 0.05, y: 0.9, width: 0.101, id: 1 },
                        { x: 0.169, y: 0.83, width: 0.1, id: 3 },
                        { x: 0.621, y: 0.89, width: 0.107, id: 2 },
                        { x: 0.889, y: 0.89, width: 0.112, id: 2 },
                        { x: 0.791, y: 0.84, width: 0.101, id: 1 },
                    ];
                    _this.interactive = true;
                    _this._bgSprite = new PIXI.Sprite();
                    _this.addChild(_this._bgSprite);
                    _this._beamsSprite = new PIXI.Sprite();
                    _this.addChild(_this._beamsSprite);
                    _this._line = new PIXI.Sprite();
                    _this.addChild(_this._line);
                    _this._bgMask = new PIXI.Graphics();
                    _this._starsContainer = new PIXI.Container();
                    _this._starsContainer.alpha = 0.55;
                    _this._starsContainer.mask = _this._bgMask;
                    _this._beamsSprite.mask = _this._bgMask;
                    _this.addChild(_this._starsContainer);
                    _this.initStars();
                    _this._bottomChipsContainer = new PIXI.Container();
                    _this._bottomChipsContainer.mask = _this._bgMask;
                    _this.addChild(_this._bottomChipsContainer);
                    _this.initBottomChips();
                    _this.addChild(_this._bgMask);
                    return _this;
                }
                NotEnoughPopupBg.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                NotEnoughPopupBg.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                NotEnoughPopupBg.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bgSprite.destroy();
                    this._beamsSprite.destroy();
                    this._line.destroy();
                    this._bgMask.destroy();
                    this._starsContainer.destroy();
                    this._bottomChipsContainer.destroy();
                };
                NotEnoughPopupBg.prototype.update = function () {
                    this.resizeBg();
                    this.resizeBeams();
                    this.resizeLine();
                    this.resizeStars();
                    this.resizeBottomChips();
                };
                NotEnoughPopupBg.prototype.initStars = function () {
                    var starsCount = 25;
                    for (var i = 0; i < starsCount; i++) {
                        var star = new PIXI.Sprite();
                        star.rotation = Client.MathHelper.getRandomMinToMax(0, Math.PI * 2 * 100) / 100;
                        this._stars.push(star);
                        this._starsContainer.addChild(star);
                    }
                };
                NotEnoughPopupBg.prototype.initBottomChips = function () {
                    var _this = this;
                    this._bottomChipsKoefs.forEach(function (chipKoefs, index) {
                        var chip = new PIXI.Sprite();
                        chip.tint = 0xcccccc;
                        _this._bottomChips[index] = chip;
                        _this._bottomChipsContainer.addChild(chip);
                    });
                };
                NotEnoughPopupBg.prototype.resizeBg = function () {
                    var origRect = Client.Resources.getOrigSize(Client.Resources
                        .getTexture(NotEnoughPopupBg.BG_TEXTURE_NAME)
                        .baseTexture);
                    this._bgSprite.texture = Client.Resources.getTexture(NotEnoughPopupBg.BG_TEXTURE_NAME, {
                        scale: this._h / origRect.height,
                        drawNewTexture: true,
                    });
                    this._bgSprite.width = this._w;
                    this._bgSprite.height = this._h;
                    var offset = this._h * 0.019;
                    this._bgMask.clear();
                    this._bgMask.beginFill(0xcccccc);
                    this._bgMask.drawRect(offset, offset, this._w - 2 * offset, this._h - 2 * offset);
                    this._bgMask.endFill();
                };
                NotEnoughPopupBg.prototype.resizeBeams = function () {
                    var origRect = Client.Resources.getOrigSize(Client.Resources
                        .getTexture(NotEnoughPopupBg.BEAMS_TEXTURE_NAME)
                        .baseTexture);
                    this._beamsSprite.texture = Client.Resources.getTexture(NotEnoughPopupBg.BEAMS_TEXTURE_NAME, {
                        scale: this._h / origRect.height,
                        drawNewTexture: true,
                    });
                    this._beamsSprite.width = this._w;
                    this._beamsSprite.height = this._h;
                };
                NotEnoughPopupBg.prototype.resizeLine = function () {
                    var textureName = NotEnoughPopupBg.LINE_TEXTURE_NAME;
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(textureName).baseTexture);
                    var width = this._w * NotEnoughPopupBg.LINE_WIDTH_KOEF, scale = width / origRect.width, height = origRect.height * scale;
                    this._line.texture = Client.Resources.getTexture(textureName, {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._line.width = width;
                    this._line.height = height;
                    this._line.x = this._w / 2 - width / 2;
                    this._line.y = this._h * NotEnoughPopupBg.LINE_TOP_OFFSET;
                };
                NotEnoughPopupBg.prototype.resizeStars = function () {
                    var _this = this;
                    this._stars.forEach(function (star, index) {
                        var textureName = NotEnoughPopupBg.BG_STARS_TEXTURE_NAME.replace('%id%', Client.MathHelper.getRandomMinToMax(1, 5).toString());
                        var origRect = Client.Resources
                            .getOrigSize(Client.Resources
                            .getTexture(textureName)
                            .baseTexture);
                        var starH = _this._h * Client.MathHelper.getRandomMinToMax(10, 15) / 100, scale = starH / origRect.height, starW = scale * origRect.width;
                        star.texture = Client.Resources.getTexture(textureName, {
                            scale: scale,
                            drawNewTexture: true,
                        });
                        star.width = starW;
                        star.height = starH;
                        star.x = Client.MathHelper.getRandomMinToMax(2 * _this._w / 3, _this._w);
                        if (index % 2) {
                            star.x = _this._w - star.x;
                        }
                        star.y = Client.MathHelper.getRandomMinToMax(0, _this._h / 7);
                    });
                };
                NotEnoughPopupBg.prototype.resizeBottomChips = function () {
                    var _this = this;
                    this._bottomChips.forEach(function (chip, index) {
                        var chipKoefs = _this._bottomChipsKoefs[index];
                        var textureName = NotEnoughPopupBg.BG_CHIPS_TEXTURE_NAME.replace('%id%', chipKoefs.id.toString());
                        var txt = Client.Resources.getTexture(textureName);
                        if (!txt)
                            return;
                        var origRect = Client.Resources.getOrigSize(txt.baseTexture);
                        var w = _this._w * chipKoefs.width, scale = w / origRect.width, h = scale * origRect.height;
                        chip.texture = Client.Resources.getTexture(textureName, {
                            scale: scale,
                            drawNewTexture: true,
                        });
                        chip.width = w;
                        chip.height = h;
                        chip.x = _this._w * chipKoefs.x;
                        chip.y = _this._h * chipKoefs.y;
                    });
                };
                NotEnoughPopupBg.BG_TEXTURE_NAME = 'lobby/reward_video/bg';
                NotEnoughPopupBg.LINE_TEXTURE_NAME = 'lobby/reward_video/line';
                NotEnoughPopupBg.BEAMS_TEXTURE_NAME = 'lobby/reward_video/beams';
                NotEnoughPopupBg.BG_STARS_TEXTURE_NAME = 'lobby/reward_video/star/%id%';
                NotEnoughPopupBg.BG_CHIPS_TEXTURE_NAME = 'lobby/reward_video/chip/%id%';
                NotEnoughPopupBg.BORDER_OFFSET_X_KOEF = 0.041;
                NotEnoughPopupBg.BORDER_OFFSET_Y_KOEF = 0.027;
                NotEnoughPopupBg.SHADOW_OFFSET_KOEF = 0.02;
                NotEnoughPopupBg.INNER_BG_TOP_OFFSET = 0.295;
                NotEnoughPopupBg.INNER_BG_WIDTH_KOEF = 0.276;
                NotEnoughPopupBg.VIDEO_ICON_WIDTH_KOEF = 0.458;
                NotEnoughPopupBg.LINE_TOP_OFFSET = 0.122;
                NotEnoughPopupBg.LINE_WIDTH_KOEF = 0.9;
                return NotEnoughPopupBg;
            }(PIXI.Container));
            Lobby.NotEnoughPopupBg = NotEnoughPopupBg;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var NotEnoughPopupButton = (function (_super) {
                __extends(NotEnoughPopupButton, _super);
                function NotEnoughPopupButton() {
                    var _this = _super.call(this, 220, 57) || this;
                    _this._text = 'Watch video for free chips';
                    _this._colorUp = 0x930616;
                    _this._colorDown = 0xb10616;
                    _this._bg = new PIXI.Sprite();
                    _this.addChild(_this._bg);
                    _this._label = new PIXI.Text(_this._text, Client.FontsHelper.Text.fontForFreeChipsButton);
                    _this.addChild(_this._label);
                    return _this;
                }
                Object.defineProperty(NotEnoughPopupButton.prototype, "currentState", {
                    get: function () {
                        return this._curState;
                    },
                    enumerable: true,
                    configurable: true
                });
                NotEnoughPopupButton.prototype.onResize = function () {
                    this.resizeBg();
                    this._label.style.fontSize = this._w * NotEnoughPopupButton.CAPTION_FONT_SIZE_KOEF;
                    this._label.x = this._w / 2 - this._label.width / 2;
                    this._label.y = this._h / 2 - this._label.height / 2;
                };
                NotEnoughPopupButton.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    this.onResize();
                };
                NotEnoughPopupButton.prototype.setWidth = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setWidth.call(this, value, saveProportions);
                    this.onResize();
                };
                NotEnoughPopupButton.prototype.setHeight = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setHeight.call(this, value, saveProportions);
                    this.onResize();
                };
                NotEnoughPopupButton.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._label.destroy();
                };
                NotEnoughPopupButton.prototype.resizeBg = function () {
                    var downX = this._w * NotEnoughPopupButton.SCALE_X_KOEF, downY = this._h * NotEnoughPopupButton.SCALE_Y_KOEF, downWidth = this._w * (1 - 2 * NotEnoughPopupButton.SCALE_X_KOEF), downHeight = this._h * (1 - 2 * NotEnoughPopupButton.SCALE_Y_KOEF);
                    var bgX = this._curState === NotEnoughPopupButton.STATE_DOWN ? downX : 0, bgY = this._curState === NotEnoughPopupButton.STATE_DOWN ? downY : 0, bgWidth = this._curState === NotEnoughPopupButton.STATE_DOWN ? downWidth : this._w, bgHeight = this._curState === NotEnoughPopupButton.STATE_DOWN ? downHeight : this._h;
                    var textureName = 'lobby/reward_video/button';
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(textureName).baseTexture);
                    var scale = bgWidth / origRect.width;
                    this._bg.texture = Client.Resources.getTexture(textureName, {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._bg.x = bgX;
                    this._bg.y = bgY;
                    this._bg.width = bgWidth;
                    this._bg.height = bgHeight;
                };
                NotEnoughPopupButton.CAPTION_FONT_SIZE_KOEF = 0.105;
                NotEnoughPopupButton.CAPTION_LEFT_OFFSET = 0.483;
                NotEnoughPopupButton.SCALE_X_KOEF = 0.025;
                NotEnoughPopupButton.SCALE_Y_KOEF = 0.075;
                NotEnoughPopupButton.BG_COLOR = 0x13849f;
                return NotEnoughPopupButton;
            }(Client.ButtonBase));
            Lobby.NotEnoughPopupButton = NotEnoughPopupButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var RewardVideoPopup = (function (_super) {
                __extends(RewardVideoPopup, _super);
                function RewardVideoPopup() {
                    var _this = _super.call(this) || this;
                    _this.BUTTON_WIDTH_KOEF = 0.249;
                    _this.BUTTON_HEIGHT_KOEF = 0.082;
                    _this.BUTTON_TOP_OFFSET = 0.824;
                    _this.HEADER_FONT_SIZE_KOEF = 0.1;
                    _this.HEADER_TOP_OFFSET = 0.095;
                    _this.BODY_FONT_SIZE_KOEF = 0.04;
                    _this.BODY_WRAP_WIDTH_KOEF = 0.86;
                    _this.BODY_TOP_OFFSET = 0.677;
                    _this.CLOSE_BUTTON_DIAMETER_KOEF = 0.076;
                    _this.init();
                    return _this;
                }
                RewardVideoPopup.prototype.setSize = function (width, height) {
                    this._h = height;
                    this._w = width;
                    this.update();
                };
                Object.defineProperty(RewardVideoPopup.prototype, "earned", {
                    set: function (value) {
                        var formattedValue = Client.StringHelper.numberWithCommas(value);
                        this._header.text = RewardVideoPopup.HEADER_TEXT_TEMPLATE
                            .replace('%chipsCount%', formattedValue);
                        this._body.text = RewardVideoPopup.BODY_TEXT_TEMPLATE
                            .replace('%chipsCount%', formattedValue);
                    },
                    enumerable: true,
                    configurable: true
                });
                RewardVideoPopup.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._button.destroy();
                    this._header.destroy();
                    this._body.destroy();
                };
                RewardVideoPopup.prototype.init = function () {
                    var _this = this;
                    this._bg = new Lobby.RewardVideoPopupBg();
                    this.addChild(this._bg);
                    this._button = new Lobby.RewardVideoPopupButton();
                    this._button.on(Lobby.RewardVideoPopupButton.EVENT_CLICK, function () {
                        _this.emit(RewardVideoPopup.EVENT_OK);
                    });
                    this.addChild(this._button);
                    this._closeButton = new Lobby.RewardVideoPopupCloseButton();
                    this._closeButton.on(Lobby.RewardVideoPopupCloseButton.EVENT_CLICK, function () {
                        _this.emit(RewardVideoPopup.EVENT_CLOSE);
                    });
                    this.addChild(this._closeButton);
                    this._header = new Client.Text('', Client.FontsHelper.Text.fontForRewardVideoPopupHeader);
                    this.addChild(this._header);
                    this._body = new Client.Text('', Client.FontsHelper.Text.fontForRewardVideoPopupBody);
                    this.addChild(this._body);
                };
                RewardVideoPopup.prototype.update = function () {
                    var x = 0, y = 0, w = this._w, h = this._h;
                    this._bg.setPosition(x, y);
                    this._bg.setSize(w, h);
                    var buttonWidth = w * this.BUTTON_WIDTH_KOEF, buttonHeight = h * this.BUTTON_HEIGHT_KOEF;
                    this._button.x = x + w / 2 - buttonWidth / 2;
                    this._button.y = h * this.BUTTON_TOP_OFFSET;
                    this._button.setWidth(buttonWidth);
                    this._button.setHeight(buttonHeight);
                    var closeButtonDiameter = w * this.CLOSE_BUTTON_DIAMETER_KOEF;
                    this._closeButton.x = w - closeButtonDiameter / 4 * 3;
                    this._closeButton.y = 0 - closeButtonDiameter / 4 * 1;
                    this._closeButton.setWidth(closeButtonDiameter, true);
                    this._header.fontSize = h * this.HEADER_FONT_SIZE_KOEF;
                    var headerX = w / 2 - this._header.width / 2, headerY = h * this.HEADER_TOP_OFFSET;
                    this._header.position.set(headerX, headerY);
                    this._body.fontSize = h * this.BODY_FONT_SIZE_KOEF;
                    this._body.wrapWidth = w * this.BODY_WRAP_WIDTH_KOEF;
                    var bodyX = w / 2 - this._body.width / 2, bodyY = h * this.BODY_TOP_OFFSET;
                    this._body.position.set(bodyX, bodyY);
                };
                RewardVideoPopup.EVENT_CLOSE = 'rewardvideopopupclose';
                RewardVideoPopup.EVENT_OK = 'rewardvideopopupok';
                RewardVideoPopup.HEADER_TEXT_TEMPLATE = 'You earned $%chipsCount% chips!';
                RewardVideoPopup.BODY_TEXT_TEMPLATE = 'Your chips will arrive shortly! Want even MORE CHIPS? ' +
                    'Watch another short video and earn $%chipsCount% chips!';
                return RewardVideoPopup;
            }(PIXI.Container));
            Lobby.RewardVideoPopup = RewardVideoPopup;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var RewardVideoPopupBg = (function (_super) {
                __extends(RewardVideoPopupBg, _super);
                function RewardVideoPopupBg() {
                    var _this = _super.call(this) || this;
                    _this._stars = [];
                    _this._innerChips = [];
                    _this._innerChipsKoefs = [
                        { x: 0.233, y: 0.306, width: 0.101, id: 2 },
                        { x: 0.267, y: 0.233, width: 0.083, id: 2 },
                        { x: 0.579, y: 0.403, width: 0.110, id: 3 },
                        { x: 0.232, y: 0.482, width: 0.102, id: 1 },
                        { x: 0.321, y: 0.381, width: 0.071, id: 1 },
                        { x: 0.557, y: 0.541, width: 0.083, id: 2 },
                        { x: 0.578, y: 0.213, width: 0.111, id: 2 },
                    ];
                    _this._bottomChips = [];
                    _this._bottomChipsKoefs = [
                        { x: -0.03, y: 0.94, width: 0.101, id: 2 },
                        { x: 0.057, y: 0.85, width: 0.083, id: 2 },
                        { x: 0.159, y: 0.87, width: 0.150, id: 3 },
                        { x: 0.903, y: 0.91, width: 0.102, id: 3 },
                        { x: 0.821, y: 0.92, width: 0.071, id: 1 },
                        { x: 0.904, y: 0.81, width: 0.083, id: 2 },
                        { x: 0.02, y: 0.73, width: 0.111, id: 2 },
                    ];
                    _this.interactive = true;
                    _this._bgSprite = new PIXI.Sprite();
                    _this.addChild(_this._bgSprite);
                    _this._line = new PIXI.Sprite();
                    _this.addChild(_this._line);
                    _this._innerBgSprite = new PIXI.Sprite();
                    _this.addChild(_this._innerBgSprite);
                    _this._videoIcon = new PIXI.Sprite();
                    _this._innerBgSprite.addChild(_this._videoIcon);
                    _this._bgMask = new PIXI.Graphics();
                    _this._starsContainer = new PIXI.Container();
                    _this._starsContainer.alpha = 0.55;
                    _this._starsContainer.mask = _this._bgMask;
                    _this.addChild(_this._starsContainer);
                    _this.initStars();
                    _this._innerChipsContainer = new PIXI.Container();
                    _this.addChild(_this._innerChipsContainer);
                    _this.initInnerChips();
                    _this._bottomChipsContainer = new PIXI.Container();
                    _this._bottomChipsContainer.mask = _this._bgMask;
                    _this.addChild(_this._bottomChipsContainer);
                    _this.initBottomChips();
                    _this.addChild(_this._bgMask);
                    return _this;
                }
                RewardVideoPopupBg.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                RewardVideoPopupBg.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                RewardVideoPopupBg.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bgSprite.destroy();
                    this._innerBgSprite.destroy();
                    this._line.destroy();
                    this._videoIcon.destroy();
                    this._bgMask.destroy();
                    this._starsContainer.destroy();
                    this._innerChipsContainer.destroy();
                    this._bottomChipsContainer.destroy();
                };
                RewardVideoPopupBg.prototype.update = function () {
                    this.resizeBg();
                    this.resizeLine();
                    this.resizeInnerBg();
                    this.resizeStars();
                    this.resizeInnerChips();
                    this.resizeBottomChips();
                };
                RewardVideoPopupBg.prototype.initStars = function () {
                    var starsCount = 15;
                    for (var i = 0; i < starsCount; i++) {
                        var star = new PIXI.Sprite();
                        star.rotation = Client.MathHelper.getRandomMinToMax(0, Math.PI * 2 * 100) / 100;
                        this._stars.push(star);
                        this._starsContainer.addChild(star);
                    }
                };
                RewardVideoPopupBg.prototype.initInnerChips = function () {
                    var _this = this;
                    this._innerChipsKoefs.forEach(function (chipKoefs, index) {
                        var chip = new PIXI.Sprite();
                        _this._innerChips[index] = chip;
                        _this._innerChipsContainer.addChild(chip);
                    });
                };
                RewardVideoPopupBg.prototype.initBottomChips = function () {
                    var _this = this;
                    this._bottomChipsKoefs.forEach(function (chipKoefs, index) {
                        var chip = new PIXI.Sprite();
                        chip.tint = 0xcccccc;
                        _this._bottomChips[index] = chip;
                        _this._bottomChipsContainer.addChild(chip);
                    });
                };
                RewardVideoPopupBg.prototype.resizeBg = function () {
                    var origRect = Client.Resources.getOrigSize(Client.Resources
                        .getTexture(RewardVideoPopupBg.BG_TEXTURE_NAME)
                        .baseTexture);
                    this._bgSprite.texture = Client.Resources.getTexture(RewardVideoPopupBg.BG_TEXTURE_NAME, {
                        scale: this._h / origRect.height,
                        drawNewTexture: true,
                    });
                    this._bgSprite.width = this._w;
                    this._bgSprite.height = this._h;
                    var offset = this._h * 0.019;
                    this._bgMask.clear();
                    this._bgMask.beginFill(0xcccccc);
                    this._bgMask.drawRect(offset, offset, this._w - 2 * offset, this._h - 2 * offset);
                    this._bgMask.endFill();
                };
                RewardVideoPopupBg.prototype.resizeLine = function () {
                    var textureName = RewardVideoPopupBg.LINE_TEXTURE_NAME;
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(textureName).baseTexture);
                    var width = this._w * RewardVideoPopupBg.LINE_WIDTH_KOEF, scale = width / origRect.width, height = origRect.height * scale;
                    this._line.texture = Client.Resources.getTexture(textureName, {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._line.width = width;
                    this._line.height = height;
                    this._line.x = this._w / 2 - width / 2;
                    this._line.y = this._h * RewardVideoPopupBg.LINE_TOP_OFFSET;
                };
                RewardVideoPopupBg.prototype.resizeInnerBg = function () {
                    var origRect = Client.Resources.getOrigSize(Client.Resources
                        .getTexture(RewardVideoPopupBg.BG_INNER_TEXTURE_NAME)
                        .baseTexture);
                    var width = this._w * RewardVideoPopupBg.INNER_BG_WIDTH_KOEF, scale = width / origRect.width, height = origRect.height * scale;
                    this._innerBgSprite.texture = Client.Resources.getTexture(RewardVideoPopupBg.BG_INNER_TEXTURE_NAME, {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._innerBgSprite.width = width;
                    this._innerBgSprite.height = height;
                    this._innerBgSprite.y = this._h * RewardVideoPopupBg.INNER_BG_TOP_OFFSET;
                    this._innerBgSprite.x = this._w / 2 - width / 2;
                    this.resizeVideoIcon();
                };
                RewardVideoPopupBg.prototype.resizeVideoIcon = function () {
                    var textureName = RewardVideoPopupBg.VIDEO_ICON_TEXTURE_NAME;
                    var origRect = Client.Resources.getOrigSize(Client.Resources
                        .getTexture(textureName)
                        .baseTexture);
                    var width = this._innerBgSprite.width * RewardVideoPopupBg.VIDEO_ICON_WIDTH_KOEF, scale = width / origRect.width, height = origRect.height * scale;
                    this._videoIcon.texture = Client.Resources.getTexture(textureName, {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._videoIcon.width = width;
                    this._videoIcon.height = height;
                    this._videoIcon.x = this._innerBgSprite.width / 2 - width / 2;
                    this._videoIcon.y = this._innerBgSprite.height / 2 - height / 2;
                };
                RewardVideoPopupBg.prototype.resizeStars = function () {
                    var _this = this;
                    this._stars.forEach(function (star, index) {
                        var textureName = RewardVideoPopupBg.BG_STARS_TEXTURE_NAME.replace('%id%', Client.MathHelper.getRandomMinToMax(1, 5).toString());
                        var origRect = Client.Resources
                            .getOrigSize(Client.Resources
                            .getTexture(textureName)
                            .baseTexture);
                        var starH = _this._h * Client.MathHelper.getRandomMinToMax(10, 15) / 100, scale = starH / origRect.height, starW = scale * origRect.width;
                        star.texture = Client.Resources.getTexture(textureName, {
                            scale: scale,
                            drawNewTexture: true,
                        });
                        star.width = starW;
                        star.height = starH;
                        star.x = Client.MathHelper.getRandomMinToMax(3 * _this._w / 4, _this._w);
                        if (index % 2) {
                            star.x = _this._w - star.x;
                        }
                        star.y = Client.MathHelper.getRandomMinToMax(0, _this._h / 3);
                    });
                };
                RewardVideoPopupBg.prototype.resizeInnerChips = function () {
                    var _this = this;
                    this._innerChips.forEach(function (chip, index) {
                        var chipKoefs = _this._innerChipsKoefs[index];
                        var textureName = RewardVideoPopupBg.BG_CHIPS_TEXTURE_NAME.replace('%id%', chipKoefs.id.toString());
                        var txt = Client.Resources.getTexture(textureName);
                        if (!txt)
                            return;
                        var origRect = Client.Resources.getOrigSize(txt.baseTexture);
                        var w = _this._w * chipKoefs.width, scale = w / origRect.width, h = scale * origRect.height;
                        chip.texture = Client.Resources.getTexture(textureName, {
                            scale: scale,
                            drawNewTexture: true,
                        });
                        chip.width = w;
                        chip.height = h;
                        chip.x = _this._w * chipKoefs.x;
                        chip.y = _this._h * chipKoefs.y;
                    });
                };
                RewardVideoPopupBg.prototype.resizeBottomChips = function () {
                    var _this = this;
                    this._bottomChips.forEach(function (chip, index) {
                        var chipKoefs = _this._bottomChipsKoefs[index];
                        var textureName = RewardVideoPopupBg.BG_CHIPS_TEXTURE_NAME.replace('%id%', chipKoefs.id.toString());
                        var txt = Client.Resources.getTexture(textureName);
                        if (!txt)
                            return;
                        var origRect = Client.Resources.getOrigSize(txt.baseTexture);
                        var w = _this._w * chipKoefs.width, scale = w / origRect.width, h = scale * origRect.height;
                        chip.texture = Client.Resources.getTexture(textureName, {
                            scale: scale,
                            drawNewTexture: true,
                        });
                        chip.width = w;
                        chip.height = h;
                        chip.x = _this._w * chipKoefs.x;
                        chip.y = _this._h * chipKoefs.y;
                    });
                };
                RewardVideoPopupBg.BG_TEXTURE_NAME = 'lobby/reward_video/bg';
                RewardVideoPopupBg.BG_INNER_TEXTURE_NAME = 'lobby/reward_video/bg_inner';
                RewardVideoPopupBg.VIDEO_ICON_TEXTURE_NAME = 'lobby/reward_video/video_icon';
                RewardVideoPopupBg.LINE_TEXTURE_NAME = 'lobby/reward_video/line';
                RewardVideoPopupBg.BG_STARS_TEXTURE_NAME = 'lobby/reward_video/star/%id%';
                RewardVideoPopupBg.BG_CHIPS_TEXTURE_NAME = 'lobby/reward_video/chip/%id%';
                RewardVideoPopupBg.BORDER_OFFSET_X_KOEF = 0.041;
                RewardVideoPopupBg.BORDER_OFFSET_Y_KOEF = 0.027;
                RewardVideoPopupBg.SHADOW_OFFSET_KOEF = 0.02;
                RewardVideoPopupBg.INNER_BG_TOP_OFFSET = 0.295;
                RewardVideoPopupBg.INNER_BG_WIDTH_KOEF = 0.276;
                RewardVideoPopupBg.VIDEO_ICON_WIDTH_KOEF = 0.458;
                RewardVideoPopupBg.LINE_TOP_OFFSET = 0.122;
                RewardVideoPopupBg.LINE_WIDTH_KOEF = 0.9;
                return RewardVideoPopupBg;
            }(PIXI.Container));
            Lobby.RewardVideoPopupBg = RewardVideoPopupBg;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var RewardVideoPopupButton = (function (_super) {
                __extends(RewardVideoPopupButton, _super);
                function RewardVideoPopupButton() {
                    var _this = _super.call(this, 220, 57) || this;
                    _this._text = 'Watch Now';
                    _this._colorUp = 0x930616;
                    _this._colorDown = 0xb10616;
                    _this._bg = new PIXI.Sprite();
                    _this.addChild(_this._bg);
                    _this._label = new PIXI.Text(_this._text, Client.FontsHelper.Text.fontForFreeChipsButton);
                    _this.addChild(_this._label);
                    return _this;
                }
                Object.defineProperty(RewardVideoPopupButton.prototype, "currentState", {
                    get: function () {
                        return this._curState;
                    },
                    enumerable: true,
                    configurable: true
                });
                RewardVideoPopupButton.prototype.onResize = function () {
                    this.resizeBg();
                    this._label.style.fontSize = this._w * RewardVideoPopupButton.CAPTION_FONT_SIZE_KOEF;
                    this._label.x = this._w / 2 - this._label.width / 2;
                    this._label.y = this._h / 2 - this._label.height / 2;
                };
                RewardVideoPopupButton.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    this.onResize();
                };
                RewardVideoPopupButton.prototype.setWidth = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setWidth.call(this, value, saveProportions);
                    this.onResize();
                };
                RewardVideoPopupButton.prototype.setHeight = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setHeight.call(this, value, saveProportions);
                    this.onResize();
                };
                RewardVideoPopupButton.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._label.destroy();
                };
                RewardVideoPopupButton.prototype.resizeBg = function () {
                    var downX = this._w * RewardVideoPopupButton.SCALE_X_KOEF, downY = this._h * RewardVideoPopupButton.SCALE_Y_KOEF, downWidth = this._w * (1 - 2 * RewardVideoPopupButton.SCALE_X_KOEF), downHeight = this._h * (1 - 2 * RewardVideoPopupButton.SCALE_Y_KOEF);
                    var bgX = this._curState === RewardVideoPopupButton.STATE_DOWN ? downX : 0, bgY = this._curState === RewardVideoPopupButton.STATE_DOWN ? downY : 0, bgWidth = this._curState === RewardVideoPopupButton.STATE_DOWN ? downWidth : this._w, bgHeight = this._curState === RewardVideoPopupButton.STATE_DOWN ? downHeight : this._h;
                    var textureName = 'lobby/reward_video/button';
                    var origRect = Client.Resources.getOrigSize(Client.Resources.getTexture(textureName).baseTexture);
                    var scale = bgWidth / origRect.width;
                    this._bg.texture = Client.Resources.getTexture(textureName, {
                        scale: scale,
                        drawNewTexture: true,
                    });
                    this._bg.x = bgX;
                    this._bg.y = bgY;
                    this._bg.width = bgWidth;
                    this._bg.height = bgHeight;
                };
                RewardVideoPopupButton.CAPTION_FONT_SIZE_KOEF = 0.155;
                RewardVideoPopupButton.CAPTION_LEFT_OFFSET = 0.483;
                RewardVideoPopupButton.SCALE_X_KOEF = 0.025;
                RewardVideoPopupButton.SCALE_Y_KOEF = 0.075;
                RewardVideoPopupButton.BG_COLOR = 0x13849f;
                return RewardVideoPopupButton;
            }(Client.ButtonBase));
            Lobby.RewardVideoPopupButton = RewardVideoPopupButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var RewardVideoPopupCloseButton = (function (_super) {
                __extends(RewardVideoPopupCloseButton, _super);
                function RewardVideoPopupCloseButton() {
                    return _super.call(this, 'lobby/reward_video/close_button', 'lobby/reward_video/close_button', 'lobby/reward_video/close_button_down') || this;
                }
                return RewardVideoPopupCloseButton;
            }(Client.ButtonImage));
            Lobby.RewardVideoPopupCloseButton = RewardVideoPopupCloseButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var CloseButton = (function (_super) {
                __extends(CloseButton, _super);
                function CloseButton() {
                    return _super.call(this, 'lobby/close_icon') || this;
                }
                return CloseButton;
            }(Client.RoundButton));
            Lobby.CloseButton = CloseButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var Settings = (function (_super) {
                __extends(Settings, _super);
                function Settings(onCloseCallback) {
                    var _this = _super.call(this) || this;
                    _this.HEADER_WIDTH_KOEF = 1;
                    _this.HEADER_HEIGHT_KOEF = 0.176;
                    _this.SETTINGS_UNIT_WIDTH_KOEF = 1;
                    _this.SETTINGS_UNIT_HEIGHT_KOEF = 0.143;
                    _this._units = new Array();
                    _this._unitsHash = {};
                    _this.init(onCloseCallback);
                    _this.pivot.x = 1;
                    return _this;
                }
                Settings.prototype.addSettings = function (title, initialValue, isOdd, onChangeCallback) {
                    var unit = new Lobby.SettingsUnit();
                    unit.title = title;
                    unit.value = initialValue;
                    unit.isOdd = isOdd;
                    unit.on(Lobby.SettingsUnit.EVENT_SETTINGS_UPDATE, onChangeCallback, unit);
                    this.addChild(unit);
                    this._units.push(unit);
                    this._unitsHash[title] = unit;
                };
                Object.defineProperty(Settings.prototype, "musicEnabled", {
                    set: function (value) {
                        if (this._unitsHash['Music'])
                            this._unitsHash['Music'].value = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Settings.prototype, "soundsEnabled", {
                    set: function (value) {
                        if (this._unitsHash['Sound FX'])
                            this._unitsHash['Sound FX'].value = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Settings.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                Settings.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                Settings.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._header.destroy();
                    this._units.forEach(function (u) { return u.destroy(); });
                };
                Settings.prototype.init = function (onCloseCallback) {
                    this._bg = new Lobby.SettingsBg();
                    this.addChild(this._bg);
                    this._header = new Lobby.SettingsHeader();
                    this._header.on(Lobby.SettingsHeader.EVENT_CLOSE, onCloseCallback, this);
                    this.addChild(this._header);
                };
                Settings.prototype.update = function () {
                    this._bg.setPosition(0, 0);
                    this._bg.setSize(this._w, this._h);
                    var headerWidth = this._w * this.HEADER_WIDTH_KOEF, headerHeight = this._h * this.HEADER_HEIGHT_KOEF;
                    this._header.setPosition(0, 0);
                    this._header.setSize(headerWidth, headerHeight);
                    var settingsUnitWidth = this._w * this.SETTINGS_UNIT_WIDTH_KOEF, settingsUnitHeight = this._h * this.SETTINGS_UNIT_HEIGHT_KOEF;
                    this._units.forEach(function (u, index) {
                        var x = 0, y = headerHeight + settingsUnitHeight * index;
                        u.setPosition(x, y);
                        u.setSize(settingsUnitWidth, settingsUnitHeight);
                    });
                };
                return Settings;
            }(PIXI.Container));
            Lobby.Settings = Settings;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var SettingsBg = (function (_super) {
                __extends(SettingsBg, _super);
                function SettingsBg() {
                    var _this = _super.call(this) || this;
                    _this.BACKGROUND_COLOR = 0x800d20;
                    _this.BORDER_LEFT_COLOR = 0x4b051c;
                    _this.BORDER_LEFT_KOEF = 0.02;
                    _this.interactive = true;
                    _this._bg = new PIXI.Graphics();
                    _this.addChild(_this._bg);
                    _this._border = new PIXI.Graphics();
                    _this.addChild(_this._border);
                    return _this;
                }
                SettingsBg.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                SettingsBg.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                SettingsBg.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                };
                SettingsBg.prototype.drawBg = function () {
                    this._bg.clear();
                    this._bg.beginFill(this.BACKGROUND_COLOR);
                    this._bg.drawRect(0, 0, this._w, this._h);
                    this._bg.endFill();
                };
                SettingsBg.prototype.drawBorder = function () {
                    this._border.clear();
                    this._border
                        .lineStyle(this._w * this.BORDER_LEFT_KOEF, this.BORDER_LEFT_COLOR)
                        .moveTo(0, 0)
                        .lineTo(0, this._h);
                };
                SettingsBg.prototype.update = function () {
                    this.drawBg();
                    this.drawBorder();
                };
                return SettingsBg;
            }(PIXI.Container));
            Lobby.SettingsBg = SettingsBg;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var SettingsHeader = (function (_super) {
                __extends(SettingsHeader, _super);
                function SettingsHeader() {
                    var _this = _super.call(this) || this;
                    _this.TITLE_FONT_SIZE_KOEF = 0.1;
                    _this.TITLE_LEFT_OFFSET = 0.076;
                    _this.TITLE_TOP_OFFSET = 0.3;
                    _this.CLOSE_BUTTON_RIGHT_OFFSET = 0.05;
                    _this.CLOSE_BUTTON_TOP_OFFSET = 0.026;
                    _this.CLOSE_BUTTON_WIDTH_KOEF = 0.193;
                    _this._title = new PIXI.Text('SETTINGS', Client.FontsHelper.Text.fontForSettingsHeader);
                    _this.addChild(_this._title);
                    _this._closeButton = new Lobby.CloseButton();
                    _this._closeButton.on(Lobby.CloseButton.EVENT_CLICK, _this.onCloseButtonClick, _this);
                    _this.addChild(_this._closeButton);
                    return _this;
                }
                SettingsHeader.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                SettingsHeader.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                SettingsHeader.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._title.destroy();
                    this._closeButton.destroy();
                };
                SettingsHeader.prototype.onCloseButtonClick = function () {
                    this.emit(SettingsHeader.EVENT_CLOSE);
                };
                SettingsHeader.prototype.update = function () {
                    this._title.style.fontSize = this._w * this.TITLE_FONT_SIZE_KOEF;
                    var titleX = this._w * this.TITLE_LEFT_OFFSET, titleY = this._h * this.TITLE_TOP_OFFSET;
                    this._title.position.set(titleX, titleY);
                    var buttonWidth = this._w * this.CLOSE_BUTTON_WIDTH_KOEF, buttonX = this._w * (1 - this.CLOSE_BUTTON_RIGHT_OFFSET) - buttonWidth, buttonY = this._w * this.CLOSE_BUTTON_RIGHT_OFFSET;
                    this._closeButton.setPosition(buttonX, buttonY);
                    this._closeButton.setDiameter(buttonWidth);
                };
                SettingsHeader.EVENT_CLOSE = 'settingsclose';
                return SettingsHeader;
            }(PIXI.Container));
            Lobby.SettingsHeader = SettingsHeader;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var SettingsRadioButton = (function (_super) {
            __extends(SettingsRadioButton, _super);
            function SettingsRadioButton() {
                var _this = _super.call(this) || this;
                _this.KNOBE = 'lobby/knobe';
                _this.ENABLED_COLOR = 0x4cd964;
                _this.DISABLED_COLOR = 0xCCCCCC;
                _this.ANIMATE_DURATION = 0.2;
                _this._w = 1;
                _this._h = 1;
                _this._value = false;
                _this._isDown = false;
                _this._isDisabled = false;
                _this.interactive = true;
                _this.buttonMode = true;
                _this.on(Client.MouseEvent.MOUSE_DOWN, _this.onDown, _this);
                _this.on(Client.MouseEvent.MOUSE_UP, _this.onUp, _this);
                _this._knobe = new PIXI.Sprite(Client.Resources.getTexture(_this.KNOBE));
                _this._bg = new PIXI.Sprite(_this.createBack(82, 52));
                _this._bg.tint = _this.DISABLED_COLOR;
                _this.addChild(_this._bg);
                _this.addChild(_this._knobe);
                return _this;
            }
            SettingsRadioButton.prototype.createBack = function (w, h) {
                var g = new PIXI.Graphics();
                g.beginFill(0xffffff);
                g.arc(h * 0.5, h * 0.5, h * 0.5, 0, Math.PI * 2);
                g.arc(w - h * 0.5, h * 0.5, h * 0.5, 0, Math.PI * 2);
                g.drawRect(h * 0.5, 0, w - h, h);
                g.endFill();
                var tex = g.generateCanvasTexture();
                g.destroy();
                return tex;
            };
            Object.defineProperty(SettingsRadioButton.prototype, "value", {
                get: function () {
                    return this._value;
                },
                set: function (value) {
                    this._value = value;
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SettingsRadioButton.prototype, "disabled", {
                get: function () {
                    return this._isDisabled;
                },
                set: function (value) {
                    this._isDisabled = value;
                },
                enumerable: true,
                configurable: true
            });
            SettingsRadioButton.prototype.onDown = function () {
                if (this.disabled)
                    return;
                this._isDown = true;
            };
            SettingsRadioButton.prototype.emitChange = function () {
                this.emit(SettingsRadioButton.EVENT_CHANGE, this.value);
            };
            SettingsRadioButton.prototype.onUp = function () {
                if (this.disabled)
                    return;
                if (this._isDown)
                    this.onChangeValue();
                this._isDown = false;
            };
            SettingsRadioButton.prototype.onChangeValue = function () {
                this._value = !this._value;
                this.emitChange();
                this.update();
            };
            SettingsRadioButton.prototype.update = function () {
                if (this._value) {
                    this._bg.tint = this.ENABLED_COLOR;
                    Client.Tweener.to(this._knobe, this.ANIMATE_DURATION, {
                        pixi: {
                            positionX: this._bg.width - this._knobe.height
                        }
                    });
                }
                else {
                    this._bg.tint = this.DISABLED_COLOR;
                    Client.Tweener.to(this._knobe, this.ANIMATE_DURATION, {
                        pixi: {
                            positionX: 0
                        }
                    });
                }
            };
            SettingsRadioButton.prototype.setSize = function (width, height) {
                this.width = width;
                this.height = height;
                this.update();
            };
            SettingsRadioButton.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            SettingsRadioButton.prototype.destroy = function () {
                this.off(Client.MouseEvent.MOUSE_DOWN, this.onDown, this);
                this.off(Client.MouseEvent.MOUSE_UP, this.onUp, this);
                _super.prototype.destroy.call(this, { children: true });
            };
            SettingsRadioButton.EVENT_CHANGE = 'valuechange';
            return SettingsRadioButton;
        }(PIXI.Container));
        Client.SettingsRadioButton = SettingsRadioButton;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var SettingsUnit = (function (_super) {
                __extends(SettingsUnit, _super);
                function SettingsUnit() {
                    var _this = _super.call(this) || this;
                    _this.TITLE_FONT_SIZE_KOEF = 0.055;
                    _this.TITLE_LEFT_OFFSET = 0.085;
                    _this.TITLE_TOP_OFFSET = 0.4;
                    _this.RADIO_BUTTON_RIGHT_OFFSET = 0.043;
                    _this.RADIO_BUTTON_TOP_OFFSET = 0.28;
                    _this.RADIO_BUTTON_WIDTH_KOEF = 0.213;
                    _this.RADIO_BUTTON_HEIGHT_KOEF = 0.467;
                    _this._isOdd = false;
                    _this._bg = new PIXI.Graphics();
                    _this._bg.alpha = 0;
                    _this.addChild(_this._bg);
                    _this._title = new PIXI.Text('', Client.FontsHelper.Text.fontForSettingsUnit);
                    _this.addChild(_this._title);
                    _this._radioButton = new Client.SettingsRadioButton();
                    _this._radioButton.on(Client.SettingsRadioButton.EVENT_CHANGE, _this.onChangeValue, _this);
                    _this.addChild(_this._radioButton);
                    return _this;
                }
                Object.defineProperty(SettingsUnit.prototype, "title", {
                    set: function (nextTitle) {
                        this._title.text = nextTitle;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(SettingsUnit.prototype, "value", {
                    set: function (nextValue) {
                        this._radioButton.value = nextValue;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(SettingsUnit.prototype, "isOdd", {
                    set: function (value) {
                        this._isOdd = value;
                        this._bg.alpha = value
                            ? 0.2
                            : 0;
                    },
                    enumerable: true,
                    configurable: true
                });
                SettingsUnit.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                SettingsUnit.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                SettingsUnit.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._title.destroy();
                    this._radioButton.destroy();
                };
                SettingsUnit.prototype.onChangeValue = function (nextValue) {
                    this.emit(SettingsUnit.EVENT_SETTINGS_UPDATE, nextValue);
                };
                SettingsUnit.prototype.drawBg = function () {
                    this._bg.clear();
                    this._bg.beginFill(0);
                    this._bg.drawRect(0, 0, this._w, this._h);
                    this._bg.endFill();
                };
                SettingsUnit.prototype.update = function () {
                    this.drawBg();
                    this._title.style.fontSize = this._w * this.TITLE_FONT_SIZE_KOEF;
                    var titleX = this._w * this.TITLE_LEFT_OFFSET, titleY = this._h * this.TITLE_TOP_OFFSET;
                    this._title.position.set(titleX, titleY);
                    var buttonWidth = this._w * this.RADIO_BUTTON_WIDTH_KOEF, buttonHeight = this._h * this.RADIO_BUTTON_HEIGHT_KOEF, buttonX = this._w * (1 - this.RADIO_BUTTON_RIGHT_OFFSET) - buttonWidth, buttonY = this._w * this.RADIO_BUTTON_RIGHT_OFFSET;
                    this._radioButton.setPosition(buttonX, buttonY);
                    this._radioButton.setSize(buttonWidth, buttonHeight);
                };
                SettingsUnit.EVENT_SETTINGS_UPDATE = 'settingsupdate';
                return SettingsUnit;
            }(PIXI.Container));
            Lobby.SettingsUnit = SettingsUnit;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var SelectTableButton = (function (_super) {
                __extends(SelectTableButton, _super);
                function SelectTableButton(text) {
                    var _this = _super.call(this, 220, 57) || this;
                    _this._enabled = true;
                    _this._colorUp = 0x930616;
                    _this._colorDisabled = 0x888888;
                    _this._colorDown = 0xb10616;
                    _this._bg = new PIXI.Graphics();
                    _this._bg.beginFill(0xffffff);
                    _this._bg.drawRoundedRect(0, 0, _this._w, _this._h, 3);
                    _this._bg.endFill();
                    _this._bg.tint = _this._colorUp;
                    _this.addChild(_this._bg);
                    _this._label = new PIXI.Text(text, Client.FontsHelper.Text.fontForSelectTableButton);
                    _this.addChild(_this._label);
                    return _this;
                }
                Object.defineProperty(SelectTableButton.prototype, "currentState", {
                    get: function () {
                        return this._curState;
                    },
                    enumerable: true,
                    configurable: true
                });
                SelectTableButton.prototype.onResize = function () {
                    var downX = this._w * SelectTableButton.SCALE_X_KOEF, downY = this._h * SelectTableButton.SCALE_Y_KOEF, downWidth = this._w * (1 - 2 * SelectTableButton.SCALE_X_KOEF), downHeight = this._h * (1 - 2 * SelectTableButton.SCALE_Y_KOEF);
                    this._bg.x = this._curState === SelectTableButton.STATE_DOWN ? downX : 0;
                    this._bg.y = this._curState === SelectTableButton.STATE_DOWN ? downY : 0;
                    this._bg.width = this._curState === SelectTableButton.STATE_DOWN ? downWidth : this._w;
                    this._bg.height = this._curState === SelectTableButton.STATE_DOWN ? downHeight : this._h;
                    this._label.style.fontSize = this._w * SelectTableButton.CAPTION_FONT_SIZE_KOEF;
                    this._label.x = this._w / 2 - this._label.width / 2;
                    this._label.y = this._h / 2 - this._label.height / 2;
                };
                SelectTableButton.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    if (this._curState === SelectTableButton.STATE_DISABLED) {
                        this.buttonMode = false;
                        this._bg.tint = this._colorDisabled;
                        this._label.alpha = 0.7;
                    }
                    else {
                        this.buttonMode = true;
                        this._bg.tint = this._curState === SelectTableButton.STATE_DOWN
                            ? this._colorDown
                            : this._colorUp;
                        this._label.alpha = 1;
                    }
                    this.onResize();
                };
                SelectTableButton.prototype.setWidth = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setWidth.call(this, value, saveProportions);
                    this.onResize();
                };
                SelectTableButton.prototype.setHeight = function (value, saveProportions) {
                    if (saveProportions === void 0) { saveProportions = false; }
                    _super.prototype.setHeight.call(this, value, saveProportions);
                    this.onResize();
                };
                SelectTableButton.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._label.destroy();
                };
                SelectTableButton.CAPTION_FONT_SIZE_KOEF = 0.15;
                SelectTableButton.ICON_FONT_SIZE_KOEF = 2.6;
                SelectTableButton.ICON_SIZE_KOEF = 4;
                SelectTableButton.ICON_Y_OFFSET_KOEF = 12;
                SelectTableButton.SCALE_X_KOEF = 0.025;
                SelectTableButton.SCALE_Y_KOEF = 0.075;
                return SelectTableButton;
            }(Client.ButtonBase));
            Lobby.SelectTableButton = SelectTableButton;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var TableUnit = (function (_super) {
                __extends(TableUnit, _super);
                function TableUnit() {
                    var _this = _super.call(this) || this;
                    _this.BUTTON_WIDTH_KOEF = 0.82;
                    _this.BUTTON_HEIGHT_KOEF = 0.13;
                    _this.BUTTON_TOP_OFFSET = 0.78;
                    _this.BUTTON_LEFT_OFFSET = 0.09;
                    _this.SCALE_X_KOEF = 0.016;
                    _this.SCALE_Y_KOEF = 0.01;
                    _this._w = 270;
                    _this._h = 440;
                    _this._buttonClicked = false;
                    _this.init();
                    return _this;
                }
                Object.defineProperty(TableUnit.prototype, "available", {
                    set: function (value) {
                        this._bg.disabled = !value;
                        this._button.disabled = !value;
                        this._body.alpha = value ? 1 : 0.9;
                    },
                    enumerable: true,
                    configurable: true
                });
                TableUnit.prototype.setWidth = function (value) {
                    this._h *= value / this._w;
                    this._w = value;
                    this.update();
                };
                TableUnit.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                    this.update();
                };
                TableUnit.prototype.setParams = function (params) {
                    this.name = params.name || "-";
                    this.type = params.type || "-";
                    this.stakesType = params.stakesType ? (_a = {},
                        _a[Client.StakesType.STAKES] = 'STAKES',
                        _a[Client.StakesType.BUY_IN] = 'BUY IN',
                        _a)[params.stakesType] : "-";
                    this.stakesRange = (params.smallBlind == undefined) ? "-" : "$" + Client.StringHelper.shortenNumber(params.smallBlind) +
                        (params.bigBlind && "/" + Client.StringHelper.shortenNumber(params.bigBlind) || '');
                    this.pictureTexture = Client.Resources.getTexture('lobby/table_unit_picture/' + (params.avatarId || 1));
                    var _a;
                };
                TableUnit.prototype.updateBuyIn = function (buyIn) {
                    this.buyIn = buyIn
                        ? "$" + Client.StringHelper.shortenNumber(buyIn)
                        : '?';
                };
                Object.defineProperty(TableUnit.prototype, "name", {
                    set: function (value) {
                        this._body.name = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "type", {
                    set: function (value) {
                        this._body.type = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "stakesType", {
                    set: function (value) {
                        this._body.stakesType = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "stakesRange", {
                    set: function (value) {
                        this._body.stakesRange = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "buyIn", {
                    set: function (value) {
                        this._body.buyIn = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "pictureTexture", {
                    set: function (value) {
                        this._body.pictureTexture = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "isNeedToScale", {
                    get: function () {
                        return this._bg.currentState === Lobby.TableUnitBg.STATE_DOWN;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "actualX", {
                    get: function () {
                        return (this.isNeedToScale && (this._w * this.SCALE_X_KOEF)) || 0;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "actualY", {
                    get: function () {
                        return (this.isNeedToScale && (this._h * this.SCALE_Y_KOEF)) || 0;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "actualWidth", {
                    get: function () {
                        return (this.isNeedToScale && (this._w * (1 - 2 * this.SCALE_X_KOEF))) || this._w;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnit.prototype, "actualHeight", {
                    get: function () {
                        return (this.isNeedToScale && (this._h * (1 - 2 * this.SCALE_Y_KOEF))) || this._h;
                    },
                    enumerable: true,
                    configurable: true
                });
                TableUnit.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._bg.destroy();
                    this._button.destroy();
                    this._body.destroy();
                };
                TableUnit.prototype.init = function () {
                    var _this = this;
                    this._bg = new Lobby.TableUnitBg(function () { return _this.update(); });
                    this._bg.on(Lobby.TableUnitBg.EVENT_CLICK, function () {
                        if (!_this._buttonClicked)
                            _this.emit(TableUnit.EVENT_SELECT_TABLE);
                        _this._buttonClicked = false;
                    }, this);
                    this.addChild(this._bg);
                    this._button = new Lobby.SelectTableButton('PLAY NOW');
                    this._button.on(Lobby.SelectTableButton.EVENT_CLICK, function () {
                        _this.emit(TableUnit.EVENT_SELECT_TABLE_WITH_SETTINGS);
                        _this._buttonClicked = true;
                    }, this);
                    this.addChild(this._button);
                    this._body = new Lobby.TableUnitBody();
                    this.addChild(this._body);
                };
                TableUnit.prototype.update = function () {
                    var x = this.actualX, y = this.actualY, w = this.actualWidth, h = this.actualHeight;
                    this._bg.setPosition(x, y);
                    this._bg.setSize(w, h);
                    this._button.x = w * (this.BUTTON_LEFT_OFFSET + (this.isNeedToScale && this.SCALE_X_KOEF || 0));
                    this._button.y = h * (this.BUTTON_TOP_OFFSET + (this.isNeedToScale && this.SCALE_Y_KOEF || 0));
                    this._button.setWidth(w * this.BUTTON_WIDTH_KOEF);
                    this._button.setHeight(h * this.BUTTON_HEIGHT_KOEF);
                    this._body.setPosition(x, y);
                    this._body.setSize(w, h);
                };
                TableUnit.EVENT_SELECT_TABLE = 'SELECT_TABLE';
                TableUnit.EVENT_SELECT_TABLE_WITH_SETTINGS = 'SELECT_TABLE_WITH_SETTINGS';
                return TableUnit;
            }(PIXI.Container));
            Lobby.TableUnit = TableUnit;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var TableUnitBg = (function (_super) {
                __extends(TableUnitBg, _super);
                function TableUnitBg(onChangeStateCallback) {
                    var _this = _super.call(this, 270, 440) || this;
                    _this.BORDER_OFFSET_X_KOEF = 0.041;
                    _this.BORDER_OFFSET_Y_KOEF = 0.027;
                    _this.SHADOW_OFFSET_KOEF = 0.02;
                    _this._patternSprites = [];
                    _this._onChangeStateCallback = onChangeStateCallback;
                    _this._bgSprite = new PIXI.Sprite();
                    _this.addChild(_this._bgSprite);
                    _this.fillByPattern();
                    _this._border = new PIXI.Graphics();
                    _this.addChild(_this._border);
                    _this.interactiveChildren = false;
                    return _this;
                }
                Object.defineProperty(TableUnitBg.prototype, "currentState", {
                    get: function () {
                        return this._curState;
                    },
                    enumerable: true,
                    configurable: true
                });
                TableUnitBg.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                TableUnitBg.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                TableUnitBg.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                };
                TableUnitBg.prototype.onChangeState = function () {
                    _super.prototype.onChangeState.call(this);
                    if (this._curState === Lobby.SelectTableButton.STATE_DISABLED) {
                        this.buttonMode = false;
                        this._bgSprite.tint = TableUnitBg.DISABLED_TINT_COLOR;
                        this.__mask.tint = TableUnitBg.DISABLED_TINT_COLOR;
                        this._border.tint = TableUnitBg.DISABLED_TINT_COLOR;
                        this._bgSprite.alpha = 0.9;
                        this._border.alpha = 0.9;
                        this._patternsContainer.alpha = 0.45;
                    }
                    else {
                        this.buttonMode = true;
                        this._bgSprite.tint = TableUnitBg.ENABLED_TINT_COLOR;
                        this.__mask.tint = TableUnitBg.ENABLED_TINT_COLOR;
                        this._border.tint = TableUnitBg.ENABLED_TINT_COLOR;
                        this._bgSprite.alpha = 1;
                        this._border.alpha = 1;
                        this._patternsContainer.alpha = 1;
                    }
                    this._onChangeStateCallback();
                };
                TableUnitBg.prototype.drawBorder = function () {
                    this._border.clear();
                    this._border.lineStyle(2, 0xe8b56d);
                    this._border.drawRoundedRect(this._w * this.BORDER_OFFSET_X_KOEF, this._h * this.BORDER_OFFSET_Y_KOEF, this._w * (1 - this.BORDER_OFFSET_X_KOEF * 2), this._h * (1 - this.BORDER_OFFSET_Y_KOEF * 2 - this.SHADOW_OFFSET_KOEF), 10);
                };
                TableUnitBg.prototype.update = function () {
                    this.cacheAsBitmap = false;
                    this._bgSprite.texture = Client.Resources.getTexture(TableUnitBg.BG_TEXTURE_NAME, {
                        width: this._w,
                        drawNewTexture: true,
                    }, 'unit_bg');
                    this._bgSprite.width = this._w;
                    this._bgSprite.height = this._h;
                    this.resizePatternSprites();
                    this.resizeMask();
                    this.drawBorder();
                    this.cacheAsBitmap = true;
                };
                TableUnitBg.prototype.fillByPattern = function () {
                    this._patternsContainer = new PIXI.Container();
                    this.__mask = new PIXI.Sprite();
                    this._patternsContainer.mask = this.__mask;
                    this._patternsContainer.addChild(this.__mask);
                    this.addChild(this._patternsContainer);
                    var texture = Client.Resources.getTexture(TableUnitBg.BG_PATTERN_TEXTURE_NAME);
                    for (var i = 0; i < TableUnitBg.BG_PATTERN_COUNT_BY_Y; i++) {
                        var line = [];
                        this._patternSprites.push(line);
                        for (var j = 0; j < TableUnitBg.BG_PATTERN_COUNT_BY_X; j++) {
                            var sprite = new PIXI.Sprite(texture);
                            sprite.alpha = 1;
                            line.push(sprite);
                            this._patternsContainer.addChild(sprite);
                        }
                    }
                };
                TableUnitBg.prototype.resizePatternSprites = function () {
                    var texture = Client.Resources.getTexture(TableUnitBg.BG_PATTERN_TEXTURE_NAME);
                    var origSize = Client.Resources.getOrigSize(texture.baseTexture);
                    var width = TableUnitBg.BG_PATTERN_WIDTH_KOEF * this._w, height = origSize.height * width / origSize.width;
                    var x = 0, y = 0;
                    for (var i = 0; i < this._patternSprites.length; i++) {
                        var line = this._patternSprites[i];
                        y = (i - 1) * height * 0.4;
                        for (var j = 0; j < line.length; j++) {
                            var sprite = line[j];
                            x = j * width * 1.5 + (i % 2 - 1) * width * 0.75;
                            sprite.x = x;
                            sprite.y = y;
                            sprite.width = width;
                            sprite.height = height;
                        }
                    }
                };
                TableUnitBg.prototype.resizeMask = function () {
                    this.__mask.texture = this._bgSprite.texture;
                    this.__mask.width = this._w;
                    this.__mask.height = this._h * 0.98;
                };
                TableUnitBg.BG_TEXTURE_NAME = 'lobby/table_unit_bg';
                TableUnitBg.BG_PATTERN_TEXTURE_NAME = 'lobby/table_unit_bg_pattern';
                TableUnitBg.BG_PATTERN_WIDTH_KOEF = 0.13;
                TableUnitBg.BG_PATTERN_COUNT_BY_X = 8;
                TableUnitBg.BG_PATTERN_COUNT_BY_Y = 13;
                TableUnitBg.DISABLED_TINT_COLOR = 0xeeeeee;
                TableUnitBg.ENABLED_TINT_COLOR = 0xffffff;
                return TableUnitBg;
            }(Client.ButtonBase));
            Lobby.TableUnitBg = TableUnitBg;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var TableUnitBody = (function (_super) {
                __extends(TableUnitBody, _super);
                function TableUnitBody() {
                    var _this = _super.call(this) || this;
                    _this.NAME_LABEL_TOP_OFFSET = 0.05;
                    _this.TYPE_LABEL_TOP_OFFSET = 0.18;
                    _this.STAKES_TYPE_LABEL_LEFT_OFFSET = 0.09;
                    _this.STAKES_RANGE_LABEL_RIGHT_OFFSET = 0.09;
                    _this.STAKES_LABEL_TOP_OFFSET = 0.62;
                    _this.PICTURE_TOP_OFFSET = 0.26;
                    _this.PICTURE_X_OFFSET = 0.09;
                    _this.PICTURE_HEIGHT_KOEF = 0.329;
                    _this.BUY_IN_LABEL_TOP_OFFSET = 0.7;
                    _this.BUY_IN_LABEL_X_OFFSET = 0.09;
                    _this.NAME_FONT_SIZE_KOEF = 0.232;
                    _this.STAKES_FONT_SIZE_KOEF = 0.118;
                    _this.STAKES_RANGE_FONT_SIZE_KOEF = 0.101;
                    _this.BUY_IN_FONT_SIZE_KOEF = 0.118;
                    _this._name = '';
                    _this._type = '';
                    _this._stakesType = '';
                    _this._stakesRange = '';
                    _this._buyIn = '';
                    _this._stakesLimitType = TableUnitBody.STAKES_MIN;
                    _this.init();
                    return _this;
                }
                TableUnitBody.prototype.setSize = function (width, height) {
                    this._w = width;
                    this._h = height;
                    this.update();
                };
                TableUnitBody.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                    this.update();
                };
                Object.defineProperty(TableUnitBody.prototype, "name", {
                    set: function (nextName) {
                        this._nameLabel.text = this._name = nextName;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnitBody.prototype, "type", {
                    set: function (nextType) {
                        this._typeLabel.text = this._type = nextType;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnitBody.prototype, "stakesType", {
                    set: function (nextStakesType) {
                        this._stakesTypeLabel.text = this._stakesType = nextStakesType;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnitBody.prototype, "stakesRange", {
                    set: function (nextStakesRange) {
                        this._stakesRangeLabel.text = this._stakesRange = nextStakesRange;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnitBody.prototype, "buyIn", {
                    set: function (nextBuyInValue) {
                        this._buyInValueLabel.text = this._buyIn = nextBuyInValue;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TableUnitBody.prototype, "pictureTexture", {
                    set: function (nextPictureTexture) {
                        this._picture.texture = nextPictureTexture;
                    },
                    enumerable: true,
                    configurable: true
                });
                TableUnitBody.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._nameLabel.destroy();
                    this._typeLabel.destroy();
                    this._stakesTypeLabel.destroy();
                    this._stakesRangeLabel.destroy();
                    this._picture.destroy();
                    this._buyInLabel.destroy();
                    this._buyInValueLabel.destroy();
                };
                TableUnitBody.prototype.init = function () {
                    this._stakesTypeLabel = new PIXI.Text(this._stakesType, Client.FontsHelper.Text.fontForTableUnitBodyStakes);
                    this._stakesTypeLabel.style.align = 'left';
                    this.addChild(this._stakesTypeLabel);
                    this._stakesRangeLabel = new PIXI.Text(this._stakesRange, Client.FontsHelper.Text.fontForTableUnitBodyStakesRange);
                    this._stakesRangeLabel.style.align = 'right';
                    this.addChild(this._stakesRangeLabel);
                    this._typeLabel = new PIXI.Text(this._type, Client.FontsHelper.Text.fontForTableUnitBodyStakes);
                    this._typeLabel.style.align = 'center';
                    this.addChild(this._typeLabel);
                    this._nameLabel = new PIXI.Text(this._name, Client.FontsHelper.Text.fontForTableUnitBodyName);
                    this._nameLabel.style.align = 'center';
                    this.addChild(this._nameLabel);
                    this._buyInLabel = new PIXI.Text('BUY-IN', Client.FontsHelper.Text.fontForTableUnitBodyStakes);
                    this._buyInLabel.style.align = 'left';
                    this.addChild(this._buyInLabel);
                    this._buyInValueLabel = new PIXI.Text(this._buyIn, Client.FontsHelper.Text.fontForTableUnitBodyStakesRange);
                    this._buyInValueLabel.style.align = 'right';
                    this.addChild(this._buyInValueLabel);
                    this._picture = new PIXI.Sprite();
                    this.addChild(this._picture);
                };
                TableUnitBody.prototype.toggleStakesLimitType = function (type) {
                    this._stakesLimitType = type;
                };
                TableUnitBody.prototype.update = function () {
                    this._nameLabel.style.fontSize = this._w * this.NAME_FONT_SIZE_KOEF;
                    this._typeLabel.style.fontSize = this._w * this.STAKES_FONT_SIZE_KOEF;
                    this._stakesTypeLabel.style.fontSize = this._w * this.STAKES_FONT_SIZE_KOEF;
                    this._stakesRangeLabel.style.fontSize = this._w * this.STAKES_RANGE_FONT_SIZE_KOEF;
                    this._buyInLabel.style.fontSize = this._w * this.STAKES_FONT_SIZE_KOEF;
                    this._buyInValueLabel.style.fontSize = this._w * this.STAKES_RANGE_FONT_SIZE_KOEF;
                    this._stakesTypeLabel.x = this._w * this.STAKES_TYPE_LABEL_LEFT_OFFSET;
                    this._stakesRangeLabel.x = this._w * (1 - this.STAKES_RANGE_LABEL_RIGHT_OFFSET)
                        - this._stakesRangeLabel.width;
                    this._picture.x = this._w * this.PICTURE_X_OFFSET;
                    this._nameLabel.y = this._h * this.NAME_LABEL_TOP_OFFSET;
                    this._typeLabel.y = this._h * this.TYPE_LABEL_TOP_OFFSET;
                    ;
                    this._stakesRangeLabel.y = this._stakesTypeLabel.y = this._h * this.STAKES_LABEL_TOP_OFFSET;
                    this._picture.y = this._h * this.PICTURE_TOP_OFFSET;
                    this._nameLabel.x = this._w / 2 - this._nameLabel.width / 2;
                    this._typeLabel.x = this._w / 2 - this._typeLabel.width / 2;
                    this._picture.width = this._w * (1 - 2 * this.PICTURE_X_OFFSET);
                    this._picture.height = this._h * this.PICTURE_HEIGHT_KOEF;
                    this._buyInLabel.y = this._buyInValueLabel.y = this._h * this.BUY_IN_LABEL_TOP_OFFSET;
                    this._buyInLabel.x = this._w * this.BUY_IN_LABEL_X_OFFSET;
                    this._buyInValueLabel.x = this._w * (1 - this.BUY_IN_LABEL_X_OFFSET)
                        - this._buyInValueLabel.width;
                };
                TableUnitBody.STAKES_MIN = Symbol();
                TableUnitBody.STAKES_MAX = Symbol();
                return TableUnitBody;
            }(PIXI.Container));
            Lobby.TableUnitBody = TableUnitBody;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var TableUnitRadioButton = (function (_super) {
            __extends(TableUnitRadioButton, _super);
            function TableUnitRadioButton(label) {
                var _this = _super.call(this) || this;
                _this.BORDER_SIZE = 2;
                _this.FOREGROUND_COLOR = 0x791b0a;
                _this.BACKGROUND_COLOR = 0xffffff;
                _this.POINTER_LEFT_OFFSET = 0.15;
                _this.POINTER_SCALE_KOEF = 0.55;
                _this._d = 1;
                _this._value = false;
                _this._isDown = false;
                _this._isDisabled = false;
                _this.interactive = true;
                _this.buttonMode = true;
                _this.on(Client.MouseEvent.MOUSE_DOWN, _this.onDown, _this);
                _this.on(Client.MouseEvent.MOUSE_UP, _this.onUp, _this);
                _this._label = new PIXI.Text(label, Client.FontsHelper.Text.fontForTableUnitBodyStakes);
                _this.addChild(_this._label);
                _this._background = new PIXI.Graphics();
                _this.addChild(_this._background);
                _this._pointer = new PIXI.Graphics();
                _this.addChild(_this._pointer);
                return _this;
            }
            Object.defineProperty(TableUnitRadioButton.prototype, "value", {
                get: function () {
                    return this._value;
                },
                set: function (value) {
                    this._value = value;
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TableUnitRadioButton.prototype, "width", {
                get: function () {
                    return this._label.width + this._d * (1 + this.POINTER_LEFT_OFFSET);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TableUnitRadioButton.prototype, "isDown", {
                get: function () {
                    return this._isDown;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TableUnitRadioButton.prototype, "disabled", {
                get: function () {
                    return this._isDisabled;
                },
                set: function (value) {
                    this._isDisabled = value;
                },
                enumerable: true,
                configurable: true
            });
            TableUnitRadioButton.prototype.onDown = function () {
                if (this.disabled)
                    return;
                this._isDown = true;
            };
            TableUnitRadioButton.prototype.emitChange = function () {
                this.emit(TableUnitRadioButton.EVENT_CHANGE, !this._value);
            };
            TableUnitRadioButton.prototype.onUp = function () {
                if (this.disabled)
                    return;
                if (this._isDown)
                    this.onChangeValue();
                this._isDown = false;
            };
            TableUnitRadioButton.prototype.onChangeValue = function () {
                this.emitChange();
                this.update();
            };
            TableUnitRadioButton.prototype.update = function () {
                this._label.style.fontSize = this._d;
                this.drawBackground();
                this.drawPointer();
            };
            TableUnitRadioButton.prototype.setDiameter = function (value) {
                this._d = value;
                this.update();
            };
            TableUnitRadioButton.prototype.setPosition = function (x, y) {
                this.x = x;
                this.y = y;
            };
            TableUnitRadioButton.prototype.destroy = function () {
                this.off(Client.MouseEvent.MOUSE_DOWN, this.onDown, this);
                this.off(Client.MouseEvent.MOUSE_UP, this.onUp, this);
                _super.prototype.destroy.call(this);
                this._background.destroy();
                this._pointer.destroy();
            };
            TableUnitRadioButton.prototype.drawBackground = function () {
                this._background.clear();
                this._background.lineStyle(this.BORDER_SIZE, this.FOREGROUND_COLOR);
                this._background.beginFill(this.BACKGROUND_COLOR);
                var backgroundRadius = this._d / 2, backgroundX = this._label.width + this._d * this.POINTER_LEFT_OFFSET + this._d / 2, backgroundY = this._d / 2;
                this._background.drawCircle(backgroundX, backgroundY, backgroundRadius);
                this._background.endFill();
            };
            TableUnitRadioButton.prototype.drawPointer = function () {
                this._pointer.clear();
                if (this._value) {
                    this._pointer.beginFill(this.FOREGROUND_COLOR);
                    var pointerRadius = this._d / 2 * this.POINTER_SCALE_KOEF, pointerX = this._label.width + this._d * this.POINTER_LEFT_OFFSET + this._d / 2, pointerY = this._d / 2;
                    this._pointer.drawCircle(pointerX, pointerY, pointerRadius);
                    this._pointer.endFill();
                }
            };
            TableUnitRadioButton.EVENT_CHANGE = 'valuechange';
            return TableUnitRadioButton;
        }(PIXI.Container));
        Client.TableUnitRadioButton = TableUnitRadioButton;
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var Avatar = (function (_super) {
                __extends(Avatar, _super);
                function Avatar() {
                    var _this = _super.call(this) || this;
                    _this._radius = 50;
                    _this._source = '';
                    _this._sprite = new PIXI.Sprite();
                    _this.addChild(_this._sprite);
                    _this._circleMask = new PIXI.Graphics();
                    _this.drawMask();
                    _this._sprite.mask = _this._circleMask;
                    _this.addChild(_this._circleMask);
                    return _this;
                }
                Avatar.prototype.setAvatarSource = function (source) {
                    if (this._source == source)
                        return;
                    this._source = source;
                    this._sprite.texture = PIXI.Texture.from(source);
                    this._sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                };
                Avatar.prototype.setWidth = function (value) {
                    this._radius = value / 2;
                    this._sprite.width = value;
                    this._sprite.height = value;
                    this.drawMask();
                };
                Avatar.prototype.drawMask = function () {
                    this._circleMask.clear();
                    this._circleMask.lineStyle(0);
                    this._circleMask.beginFill(0xffffff, 1);
                    this._circleMask.drawCircle(this._radius, this._radius, this._radius);
                    this._circleMask.endFill();
                };
                Avatar.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._sprite.destroy();
                    this._circleMask.destroy();
                };
                return Avatar;
            }(PIXI.Container));
            Lobby.Avatar = Avatar;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var LevelBar = (function (_super) {
                __extends(LevelBar, _super);
                function LevelBar() {
                    var _this = _super.call(this) || this;
                    _this.STAR_WIDTH_KOEF = 0.4;
                    _this.TEXT_OFFSET_LEFT_KOEF = 0.35;
                    _this.TEXT_OFFSET_TOP_KOEF = 0.05;
                    _this.TEXT_SIZE_KOEF = 0.25;
                    _this._w = 110;
                    _this._h = 30;
                    _this._level = 1;
                    _this.init();
                    return _this;
                }
                Object.defineProperty(LevelBar.prototype, "level", {
                    get: function () {
                        return this._level;
                    },
                    set: function (nextLevel) {
                        this._level = nextLevel;
                        this._text.text = 'Lv. ' + nextLevel;
                    },
                    enumerable: true,
                    configurable: true
                });
                LevelBar.prototype.setWidth = function (value) {
                    this._h *= value / this._w;
                    this._w = value;
                    this._star.height = this._h;
                    this._star.width = this._h;
                    this._text.style.fontSize = value * this.TEXT_SIZE_KOEF;
                    this._text.x = this._w * this.TEXT_OFFSET_LEFT_KOEF;
                    this._text.y = this._h * this.TEXT_OFFSET_TOP_KOEF;
                };
                LevelBar.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                LevelBar.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._star.destroy();
                    this._text.destroy();
                };
                LevelBar.prototype.init = function () {
                    this._star = new PIXI.Sprite(Client.Resources.getTexture('lobby/star'));
                    this.addChild(this._star);
                    this._text = new PIXI.Text('Lv. ' + this._level, Client.FontsHelper.Text.fontForLevelBar);
                    this.addChild(this._text);
                };
                return LevelBar;
            }(PIXI.Container));
            Lobby.LevelBar = LevelBar;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var ProgressBar = (function (_super) {
                __extends(ProgressBar, _super);
                function ProgressBar() {
                    var _this = _super.call(this) || this;
                    _this._w = 180;
                    _this._h = 18;
                    _this._progress = 0;
                    _this.RADIUS_KOEF = 0.06;
                    _this.WHOLE_COLOR = 0;
                    _this.PROGRESS_COLOR = 0x6cd54b;
                    _this.MIN_PROGRESS = 0.09;
                    _this.init();
                    return _this;
                }
                Object.defineProperty(ProgressBar.prototype, "progress", {
                    get: function () {
                        return this._progress;
                    },
                    set: function (nextProgress) {
                        Client.Tweener.to(this, 1, {
                            _progress: nextProgress,
                            onUpdate: this.drawProgressLine,
                            onUpdateScope: this,
                            onComplete: this.drawProgressLine,
                            onCompleteScope: this,
                        });
                    },
                    enumerable: true,
                    configurable: true
                });
                ProgressBar.prototype.setWidth = function (value) {
                    this._h *= value / this._w;
                    this._w = value;
                    this.drawProgressLine();
                    this.drawWholeLine();
                };
                ProgressBar.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                ProgressBar.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._wholeLine.destroy();
                    this._progressLine.destroy();
                };
                ProgressBar.prototype.init = function () {
                    this._wholeLine = new PIXI.Graphics();
                    this._wholeLine.position.set(0, 0);
                    this.drawWholeLine();
                    this.addChild(this._wholeLine);
                    this._progressLine = new PIXI.Graphics();
                    this._progressLine.position.set(0, 0);
                    this.drawProgressLine();
                    this.addChild(this._progressLine);
                };
                ProgressBar.prototype.drawWholeLine = function () {
                    var w = this._w, h = this._h, r = this._w * this.RADIUS_KOEF;
                    this._wholeLine.clear();
                    this._wholeLine.lineStyle(0);
                    this._wholeLine.beginFill(this.WHOLE_COLOR, 1);
                    this._wholeLine.drawRoundedRect(0, 0, w, h, r);
                    this._wholeLine.endFill();
                };
                ProgressBar.prototype.drawProgressLine = function () {
                    var w = this._w * Math.max(this._progress, this.MIN_PROGRESS), h = this._h, r = this._w * this.RADIUS_KOEF;
                    this._progressLine.clear();
                    this._progressLine.lineStyle(0);
                    this._progressLine.beginFill(this.PROGRESS_COLOR, 1);
                    this._progressLine.drawRoundedRect(0, 0, w, h, r);
                    this._progressLine.endFill();
                };
                return ProgressBar;
            }(PIXI.Container));
            Lobby.ProgressBar = ProgressBar;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
var poker;
(function (poker) {
    var Client;
    (function (Client) {
        var Lobby;
        (function (Lobby) {
            var UserPanel = (function (_super) {
                __extends(UserPanel, _super);
                function UserPanel() {
                    var _this = _super.call(this) || this;
                    _this.LEVEL_BAR_LEFT_OFFSET = 0.41;
                    _this.LEVEL_BAR_TOP_OFFSET = 0.18;
                    _this.LEVEL_BAR_WIDTH_KOEF = 0.3;
                    _this.PROGRESS_BAR_BOTTOM_OFFSET = 0.40;
                    _this.PROGRESS_BAR_LEFT_OFFSET = 0.42;
                    _this.PROGRESS_BAR_WIDTH_KOEF = 0.45;
                    _this.AVATAR_WIDTH_KOEF = 0.38;
                    _this._w = 145;
                    _this._h = 50;
                    _this._avatar = new Lobby.Avatar();
                    _this.addChild(_this._avatar);
                    _this._progressBar = new Lobby.ProgressBar();
                    _this.addChild(_this._progressBar);
                    _this._levelBar = new Lobby.LevelBar();
                    _this.addChild(_this._levelBar);
                    return _this;
                }
                UserPanel.prototype.setWidth = function (value) {
                    this._h *= value / this._w;
                    this._w = value;
                    this.update();
                };
                UserPanel.prototype.setPosition = function (x, y) {
                    this.x = x;
                    this.y = y;
                };
                Object.defineProperty(UserPanel.prototype, "avatarSource", {
                    set: function (value) {
                        this._avatar.setAvatarSource(value);
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(UserPanel.prototype, "level", {
                    set: function (value) {
                        this._levelBar.level = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(UserPanel.prototype, "progress", {
                    set: function (value) {
                        this._progressBar.progress = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                UserPanel.prototype.update = function () {
                    this._avatar.setWidth(this._h);
                    this._progressBar.setWidth(this._w * this.PROGRESS_BAR_WIDTH_KOEF);
                    this._levelBar.setWidth(this._w * this.LEVEL_BAR_WIDTH_KOEF);
                    this._progressBar.setPosition(this._w * this.PROGRESS_BAR_LEFT_OFFSET, this._h * (1 - this.PROGRESS_BAR_BOTTOM_OFFSET));
                    this._levelBar.setPosition(this._w * this.LEVEL_BAR_LEFT_OFFSET, this._h * this.LEVEL_BAR_TOP_OFFSET);
                };
                UserPanel.prototype.destroy = function () {
                    _super.prototype.destroy.call(this);
                    this._avatar.destroy();
                    this._progressBar.destroy();
                    this._levelBar.destroy();
                };
                return UserPanel;
            }(PIXI.Container));
            Lobby.UserPanel = UserPanel;
        })(Lobby = Client.Lobby || (Client.Lobby = {}));
    })(Client = poker.Client || (poker.Client = {}));
})(poker || (poker = {}));
//# sourceMappingURL=poker.js.map