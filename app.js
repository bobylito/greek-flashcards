(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/cards.js":[function(require,module,exports){
var Reveal = require( "reveal.js" );
var MButton = require( "mobile-button" );
var persistence = require( "./persistence" );
var randomizeCards = require( "./randomize" );

// Randomize slides
var slidesParent = randomizeCards( document.querySelector( ".slides" ) );

var state = {
  card : "",
  hintShown : false
};

new MButton.Touchend( {
  el : document.querySelector( ".validate-card" ),
  f : function(){
    if( !state.hintShown ){
      persistence.addOkCard( state.card );
    }
    state.hintShown = false;
    Reveal.right();
  }
} );

new MButton.Touchend( {
  el : document.querySelector( ".show-hints" ),
  f : function(){
    if( !state.hintShown ){
      persistence.addFailedCard( state.card );
    }
    state.hintShown = true;
    Reveal.down();
  }
} );

Reveal.addEventListener( "slidechanged", function( e ){
  var indexV = e.indexv;
  if( indexV === 0 ){
    var card = state.card = e.currentSlide.dataset.card;
    persistence.addSeenCard( card );
  }
} );

Reveal.addEventListener( "ready", function( e ){
  var card = e.currentSlide.dataset.card;
  state.card = card;
  persistence.addSeenCard( card );
} );

// Full list of configuration options available at:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
  controls: false,
  progress: true,
  history: false,
  center: true,
  touch: false,
  keyboard: true,
  transition: 'slide', // none/fade/slide/convex/concave/zoom
});

},{"./persistence":"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/persistence/index.js","./randomize":"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/randomize.js","mobile-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/index.js","reveal.js":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/reveal.js/js/reveal.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/persistence/DeckStats.js":[function(require,module,exports){
var DeckStats = function( params ){
  params = params || {};
  this.seenCards = params.seenCards || [];
  this.failedCards = params.failedCards || {};
  this.okCards = params.okCards || {};
}

DeckStats.prototype = {
  constructor: DeckStats,
  addSeenCard : function( card ){
    if( this.seenCards.indexOf( card ) === -1 ){
      var newState = new DeckStats( this );
      newState.seenCards = this.seenCards.concat( card );
      return newState;
    }
    return this;
  },
  addFailedCard : function( card ){
    var newState = new DeckStats( this );
    if( this.failedCards[ card ] ){
      newState.failedCards[ card ] = this.failedCards[ card ] + 1;
    }
    else {
      newState.failedCards[ card ] = 1;
    }
    return newState;
  },
  addOkCard : function( card ){
    var newState = new DeckStats( this );
    if( this.okCards[ card ] ){
      newState.okCards[ card ] = this.okCards[ card ] + 1;
    }
    else {
      newState.okCards[ card ] = 1;
    }
    return newState;
  },
  getCardInfos: function( card ){
    var infos = {};

    infos.seen = ( this.seenCards.indexOf( card ) !== -1 );
    infos.failedCards = this.failedCards[ card ] || 0;
    infos.okCards = this.okCards[ card ] || 0;

    return infos;
  }
};

module.exports = DeckStats;

},{}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/persistence/index.js":[function(require,module,exports){
var DeckStats = require( "./DeckStats" );

var l = window.localStorage;

var deckStats = l.getItem( "deckstats" ) ?
  new DeckStats( JSON.parse( l.getItem( "deckstats" ) ) ) :
  new DeckStats();

module.exports = {
  addSeenCard : addSeenCard,
  addFailedCard : addFailedCard,
  addOkCard : addOkCard,
  getData : getData
};

function addSeenCard( card ){
  deckStats = deckStats.addSeenCard( card );
  saveState( "deckstats",  deckStats );
}

function addFailedCard( card ){
  deckStats = deckStats.addFailedCard( card );
  saveState( "deckstats", deckStats );
}

function addOkCard( card ){
  deckstats = deckStats.addOkCard( card );
  saveState( "deckstats", deckStats );
}

function saveState( entryName, state ){
  l.setItem( entryName, JSON.stringify( state ) );
}

function getData() {
  return new DeckStats( deckStats );
}

},{"./DeckStats":"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/persistence/DeckStats.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/randomize.js":[function(require,module,exports){
var persistence = require( "./persistence" );

module.exports = function randomizeCards( el ){
  var slides = el.childNodes;
  var deckStats = persistence.getData();

  Array.prototype.forEach.call( slides, function( slide ){
    el.removeChild( slide );
  } );

  var slidesArray = Array.prototype.slice.call( slides, 0 );
  var newSlides   = slidesArray.reverse();

  Array.prototype.forEach.call( newSlides, function( slide ){
    el.appendChild( slide );
  } );

  // Other sort methods
  function smart( slides ){
    return slidesArray.sort( function smartSort( slideA, slideB ){ 
      var infosA = deckStats.getCardInfos( slideA.dataset.card );
      var infosB = deckStats.getCardInfos( slideB.dataset.card );

      if( infosA.seen != infosB.seen ) {
        return infosA.seen ? -1 : 1;
      }

      if( infosA.okCards != infosB.okCards ){
        return infosA.okCards > infosB.okCards ? 1 : -1;
      }

      return 0;
//  if( infosA.failedCards != infosB.failedCards ){
//    return infosA.failedCards > infosB.failedCards ? 1 : -1;
//  }

//  return 0;//0.5 - Math.random();

    } );
  }

}

},{"./persistence":"/Users/bobylito/Copy/source.sync/GreekFlashcards/js/persistence/index.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js":[function(require,module,exports){
/*
 * button.js - the base of all buttons
 *
 * All buttons share two elements: a function, the callback of the button
 * and a DOM element.
 *
 * If the callback function returns a promise, the button will
 * keep is active state until the promise is resolved;
 */

"use strict";

var lock = false;

var Button = function Button (options) {
    options = options || {};

    /* the callback function */
    this.f = null;
    /* the dom element representing the button */
    this.el = null;

    /* the state of the button */
    this.binded = false;
    this.active = false;
    this.monotouchable = false;

    /* whether to set active class or not */
    this.setActiveCls = true;
    /* default active css class*/
    this.activeCls = 'active';

    if(options.setActiveCls) this.setActiveCls = options.setActiveCls;
    if(typeof options.activeCls === 'string') this.activeCls = options.activeCls;
    if(options.el instanceof HTMLElement) this.el = options.el;
    if(typeof options.f === 'function') this.f = options.f;
    if(options.monotouchable) this.monotouchable = options.monotouchable;
    if(options.autobind !== false) this.bind();
};

Button.prototype.setEl = function (el) {
    if(this.active) throw new Error("Can't change dom element, button is active.");
    if(this.binded) this.unbind();
    if(el instanceof HTMLElement) {
        this.el = el;
        return this;
    }
    else {
        throw new Error("Button setEl method needs a dom element as argument.");
    }
};

Button.prototype._addCls = function () {
    if (!this.el.classList.contains(this.activeCls))
        this.el.classList.add(this.activeCls);
};

Button.prototype._removeCls = function () {
    if (this.el.classList.contains(this.activeCls))
        this.el.classList.remove(this.activeCls);
};

Button.prototype.setActive = function (active) {
    if (this.setActiveCls) {
        if (active) this._addCls();
        else this._removeCls();
    }
    this.active = active;
    return this;
};

Button.prototype.lock = function () {
    if(this.monotouchable) lock = true;
    return this;
};

Button.prototype.unlock = function () {
    if(this.monotouchable) lock = false;
    return this;
};

Button.prototype.isLocked = function () {
    return lock;
};

Button.prototype.setF = function (f) {
    if (typeof f !== 'function')
        throw new Error("Button setF method needs a f function as argument.");
    this.f = f;
    return this;
};

/* impl. not completed, a child will redefine the bind method, call this one and set this.binded to true*/
Button.prototype.bind = function () {
    if(!this.el || !this.f) throw new Error("Can't bind an uninitialized button.");
    if(this.binded) throw new Error("Can't bind an already binded button.");
    return this;
};

/* impl. not completed, a child will redefine the bind method, call this one and set this.binded to false*/
Button.prototype.unbind = function () {
    if(!this.el || !this.f) throw new Error("Can't unbind an uninitialized button.");
    if(!this.binded) throw new Error("Can't unbind a unbinded button.");
    return this;
};

module.exports = Button;

},{}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/index.js":[function(require,module,exports){
/*
 * index.js - mobile-button module
 */

"use strict";

var MousedownButton = require('./mouse/default/mousedown-button'),
    MouseupButton = require('./mouse/default/mouseup-button'),
    MouseupOnScrollableYButton = require('./mouse/scrollable-y/mouseup-button'),
    MouseupOnScrollableXButton = require('./mouse/scrollable-x/mouseup-button'),
    MousePushButton = require('./mouse/default/mouse-push-button'),

    TouchstartButton = require('./touch/default/touchstart-button'),
    TouchendButton = require('./touch/default/touchend-button'),
    TouchendOnScrollableYButton = require('./touch/scrollable-y/touchend-button'),
    TouchendOnScrollableXButton = require('./touch/scrollable-x/touchend-button'),
    TouchPushButton = require('./touch/default/touch-push-button'),

    PointerdownButton = require('./pointer/default/pointerdown-button'),
    PointerupButton = require('./pointer/default/pointerup-button'),
    PointerupOnScrollableYButton = require('./pointer/scrollable-y/pointerup-button'),
    PointerupOnScrollableXButton = require('./pointer/scrollable-x/pointerup-button'),
    PointerPushButton = require('./pointer/default/pointer-push-button'),

    touchable = 'ontouchstart' in window,
    pointable = !!window.MSPointerEvent || !!window.PointerEvent;

module.exports = {
    Touchstart : touchable ? TouchstartButton : (pointable ? PointerdownButton : MousedownButton),
    Touchend : touchable ? TouchendButton : (pointable ? PointerupButton : MouseupButton),
    ScrollableY : {
        Touchend : touchable ? TouchendOnScrollableYButton : (pointable ? PointerupOnScrollableYButton : MouseupOnScrollableYButton)
    },
    ScrollableX : {
        Touchend : touchable ? TouchendOnScrollableXButton : (pointable ? PointerupOnScrollableXButton : MouseupOnScrollableXButton)
    },
    Push : touchable ? TouchPushButton : (pointable ? PointerPushButton : MousePushButton)
};

},{"./mouse/default/mouse-push-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mouse-push-button.js","./mouse/default/mousedown-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mousedown-button.js","./mouse/default/mouseup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mouseup-button.js","./mouse/scrollable-x/mouseup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/scrollable-x/mouseup-button.js","./mouse/scrollable-y/mouseup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/scrollable-y/mouseup-button.js","./pointer/default/pointer-push-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointer-push-button.js","./pointer/default/pointerdown-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointerdown-button.js","./pointer/default/pointerup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointerup-button.js","./pointer/scrollable-x/pointerup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/scrollable-x/pointerup-button.js","./pointer/scrollable-y/pointerup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/scrollable-y/pointerup-button.js","./touch/default/touch-push-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touch-push-button.js","./touch/default/touchend-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touchend-button.js","./touch/default/touchstart-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touchstart-button.js","./touch/scrollable-x/touchend-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/scrollable-x/touchend-button.js","./touch/scrollable-y/touchend-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/scrollable-y/touchend-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mouse-push-button.js":[function(require,module,exports){
/*
 * default/mouse-push-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var MousePushButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.delay = options.delay > 0 ? options.delay : 0;
    this.g = null;
    if(typeof options.g === 'function') this.g = options.g;
    this.promisef = null;
    this.boundaries = { minX : 0, maxX : 0, minY : 0, maxY : 0 };
    this.leftOrEnded = false;
};

MousePushButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

MousePushButton.prototype.constructor = MousePushButton;

MousePushButton.prototype.setG = function (g) {
    if (typeof g !== 'function')
        throw new Error("Button setG method needs a g function as argument.");
    this.g = g;
    return this;
};

MousePushButton.prototype._isInActiveZone = function (touch) {
    var x = touch.clientX,
        y = touch.clientY,
        b = this.boundaries;
    return x < b.maxX && x > b.minX && y < b.maxY && y > b.minY;
};

MousePushButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    this.el.addEventListener('mousedown', this, false);
    this.binded = true;
    return this;
};

MousePushButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    this.el.removeEventListener('mousedown', this, false);
    this.binded = false;
    return this;
};

MousePushButton.prototype.handleEvent = function (evt) {
    switch (evt.type) {
        case 'mousedown':
            this.onMousedown(evt);
            break;
        case 'mousemove':
            this.onMousemove(evt);
            break;
        case 'mouseup':
            this.onMouseup(evt);
            break;
    }
};

MousePushButton.prototype.onMousedown = function (evt) {
    if (!this.active) {
        if (evt.button === 0) {
            evt.preventDefault();
            this.setActive(true);
            var boundingRect = this.el.getBoundingClientRect();
            this.boundaries.minX = boundingRect.left;
            this.boundaries.maxX = boundingRect.left + boundingRect.width;
            this.boundaries.minY = boundingRect.top;
            this.boundaries.maxY = boundingRect.bottom;
            this.el.ownerDocument.addEventListener('mousemove', this, false);
            this.el.ownerDocument.addEventListener('mouseup', this, false);
            this.promisef = Q.delay(evt, this.delay).then(this.f);
        }
    }
};

MousePushButton.prototype.onMousemove = function (evt) {
    if(this.active && !this.leftOrEnded) {
        evt.preventDefault();
        if (!this._isInActiveZone(evt))
            this.onMouseup(evt);
    }
};

MousePushButton.prototype.onMouseup = function (evt) {
    if(this.active && !this.leftOrEnded) {
        this._removeCls();
        this.leftOrEnded = true;
        this.promisef
                .then(evt)
                .then(this.g)
                .finally(this._done(evt))
                .done();
    }
};

MousePushButton.prototype._done = function (evt) {
    var btn = this;
    return function () {
        btn.setActive(false);
        btn.leftOrEnded = false;
        btn.el.ownerDocument.removeEventListener('mousemove', btn, false);
        btn.el.ownerDocument.removeEventListener('mouseup', btn, false);
    };
};

module.exports = MousePushButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mousedown-button.js":[function(require,module,exports){
/*
 * default/mousedown-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var MousedownButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.delay = options.delay > 0 ? options.delay : 0;
};

MousedownButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

MousedownButton.prototype.constructor = MousedownButton;

MousedownButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    this.el.addEventListener('mousedown', this, false);
    this.binded = true;
    return this;
};

MousedownButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    this.el.removeEventListener('mousedown', this, false);
    this.binded = false;
    return this;
};

MousedownButton.prototype.handleEvent = function (evt) {
    switch(evt.type) {
        case 'mousedown':
            this.onMousedown(evt);
            break;
    }
};

function _done(btn) {
    return function () { btn.setActive(false); };
};

MousedownButton.prototype.onMousedown = function (evt) {
    if (!this.active) {
        if (evt.button === 0) {
            var btn = this;
            btn.setActive(true);
            Q.delay(evt, btn.delay).then(btn.f).finally(_done(btn)).done();
        }
    }
};

module.exports = MousedownButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mouseup-button.js":[function(require,module,exports){
/*
 * default/mouseup-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var MouseupButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.activeBorder = options.activeBorder || 50;
    this.boundaries = { minX : 0, maxX : 0, minY : 0, maxY : 0 };
    this.clicked = false;
};

MouseupButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

MouseupButton.prototype.constructor = MouseupButton;

MouseupButton.prototype.setActiveBorder = function (len) {
    this.activeBorder = len;
};

MouseupButton.prototype._isInActiveZone = function (evt) {
    var x = evt.clientX,
        y = evt.clientY,
        b = this.boundaries;
    return x < b.maxX && x > b.minX && y < b.maxY && y > b.minY;
};

MouseupButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    this.el.addEventListener('mousedown', this, false);
    this.binded = true;
    return this;
};

MouseupButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    this.el.removeEventListener('mousedown', this, false);
    this.binded = false;
    return this;
};

MouseupButton.prototype.handleEvent = function (evt) {
    switch (evt.type) {
        case 'mousedown':
            this.onMousedown(evt);
            break;
        case 'mousemove':
            this.onMousemove(evt);
            break;
        case 'mouseup':
            this.onMouseup(evt);
            break;
    }
};

MouseupButton.prototype.onMousedown = function (evt) {
    if (!this.active) {
        if (evt.button === 0) {
            evt.preventDefault();
            this.setActive(true);
            this.triggerOnMouseup = true;
            var boundingRect = this.el.getBoundingClientRect();
            this.boundaries.minX = boundingRect.left - this.activeBorder;
            this.boundaries.maxX = boundingRect.left + boundingRect.width + this.activeBorder;
            this.boundaries.minY = boundingRect.top - this.activeBorder;
            this.boundaries.maxY = boundingRect.bottom +  this.activeBorder;
            this.el.ownerDocument.addEventListener('mousemove', this, false);
            this.el.ownerDocument.addEventListener('mouseup', this, false);
        }
    }
};

MouseupButton.prototype.onMousemove = function (evt) {
    if (this.active && !this.clicked) {
        if (this._isInActiveZone(evt)) {
            this.triggerOnMouseup = true;
            this._addCls();
        } else {
            this.triggerOnMouseup = false;
            this._removeCls();
        }
    }
};

MouseupButton.prototype._done = function (evt) {
    var btn = this;
    return function () { btn.onMousecancel(evt); };
};

MouseupButton.prototype.onMouseup = function (evt) {
    if (this.active) {
        if (this.triggerOnMouseup) {
            var btn = this;
            btn._removeCls();
            btn.clicked = true;
            Q(evt).then(btn.f).finally(btn._done(evt)).done();
        } else {
            this.onMousecancel(evt);
        }
    }
};

MouseupButton.prototype.onMousecancel = function (evt) {
    this._removeCls();
    if (this.active) this.active = false;
    if (this.clicked) this.clicked = false;
    this.el.ownerDocument.removeEventListener('mousemove', this, false);
    this.el.ownerDocument.removeEventListener('mouseup', this, false);
};

module.exports = MouseupButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/scrollable-x/mouseup-button.js":[function(require,module,exports){
/*
 * scrollable-x/mouseup-button.js
 */

"use strict";

var MouseupButton = require('./../default/mouseup-button');

var MouseupOnScrollableXButton = function (options) {
    MouseupButton.prototype.constructor.call(this, options);
    this.tolerance = options.tolerance || 10;
};

MouseupOnScrollableXButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(MouseupButton.prototype);

MouseupOnScrollableXButton.prototype.constructor = MouseupOnScrollableXButton;

MouseupOnScrollableXButton.prototype.onMousedown = function (evt) {
    if (!this.active) this.startX = evt.clientX;
    MouseupButton.prototype.onMousedown.call(this, evt);
};

MouseupOnScrollableXButton.prototype._isInActiveZone = function (evt) {
    var y = evt.clientY,
        d = Math.abs(evt.clientX - this.startX),
        b = this.boundaries;
    return y < b.maxY && y > b.minY && d < this.tolerance;
};

MouseupOnScrollableXButton.prototype.onMousemove = function (evt) {
    if (this.active) {
        if (this._isInActiveZone(evt)) this._addCls();
        else this.onMousecancel.call(this, evt);
    }
};

module.exports = MouseupOnScrollableXButton;

},{"./../default/mouseup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mouseup-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/scrollable-y/mouseup-button.js":[function(require,module,exports){
/*
 * scrollable-y/mouseup-button.js
 */

"use strict";

var MouseupButton = require('./../default/mouseup-button');

var MouseupOnScrollableYButton = function (options) {
    MouseupButton.prototype.constructor.call(this, options);
    this.tolerance = options.tolerance || 10;
};

MouseupOnScrollableYButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(MouseupButton.prototype);

MouseupOnScrollableYButton.prototype.constructor = MouseupOnScrollableYButton;

MouseupOnScrollableYButton.prototype.onMousedown = function (evt) {
    if (!this.active) this.startY = evt.clientY;
    MouseupButton.prototype.onMousedown.call(this, evt);
};

MouseupOnScrollableYButton.prototype._isInActiveZone = function (evt) {
    var x = evt.clientX,
        d = Math.abs(evt.clientY - this.startY),
        b = this.boundaries;
    return x < b.maxX && x > b.minX && d < this.tolerance;
};

MouseupOnScrollableYButton.prototype.onMousemove = function (evt) {
    if (this.active) {
        if (this._isInActiveZone(evt)) this._addCls();
        else this.onMousecancel.call(this, evt);
    }
};

module.exports = MouseupOnScrollableYButton;

},{"./../default/mouseup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/mouse/default/mouseup-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointer-push-button.js":[function(require,module,exports){
/*
 * default/pointer-push-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var PointerPushButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.delay = options.delay > 0 ? options.delay : 0;
    this.g = null;
    if(typeof options.g === 'function') this.g = options.g;
    this.promisef = null;
    this.boundaries = { minX : 0, maxX : 0, minY : 0, maxY : 0 };
    this.leftOrEnded = false;
    this.pointerId = null;
};

PointerPushButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

PointerPushButton.prototype.constructor = PointerPushButton;

PointerPushButton.prototype.setG = function (g) {
    if (typeof g !== 'function')
        throw new Error("Button setG method needs a g function as argument.");
    this.g = g;
    return this;
};

PointerPushButton.prototype._isDownPointerId = function (pointerId) {
    return this.pointerId === pointerId;
};

PointerPushButton.prototype._isInActiveZone = function (evt) {
    var x = evt.clientX,
        y = evt.clientY,
        b = this.boundaries;
    return x < b.maxX && x > b.minX && y < b.maxY && y > b.minY;
};

PointerPushButton.prototype._setPointerCapture = function (pointerId) {
    if (window.MSPointerEvent)
        this.el.msSetPointerCapture(pointerId);
    else
        this.el.setPointerCapture(pointerId);
};

PointerPushButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    if (window.MSPointerEvent) {
        this.el.addEventListener('MSPointerDown', this, false);
        this.el.addEventListener('MSPointerMove', this, false);
        this.el.addEventListener('MSPointerUp', this, false);
        this.el.addEventListener('MSPointerCancel', this, false);
    } else {
        this.el.addEventListener('pointerdown', this, false);
        this.el.addEventListener('pointermove', this, false);
        this.el.addEventListener('pointerup', this, false);
        this.el.addEventListener('pointercancel', this, false);
    }
    this.binded = true;
    return this;
};

PointerPushButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    if (window.MSPointerEvent) {
        this.el.removeEventListener('MSPointerDown', this, false);
        this.el.removeEventListener('MSPointerMove', this, false);
        this.el.removeEventListener('MSPointerUp', this, false);
        this.el.removeEventListener('MSPointerCancel', this, false);
    } else {
        this.el.removeEventListener('pointerdown', this, false);
        this.el.removeEventListener('pointermove', this, false);
        this.el.removeEventListener('pointerup', this, false);
        this.el.removeEventListener('pointercancel', this, false);
    }
    this.binded = false;
    return this;
};

PointerPushButton.prototype.handleEvent = function (evt) {
    switch (evt.type) {
        case 'MSPointerDown':
        case 'pointerdown':
            this.onPointerdown(evt);
            break;
        case 'MSPointerMove':
        case 'pointermove':
            this.onPointermove(evt);
            break;
        case 'MSPointerUp':
        case 'pointerup':
            this.onPointerup(evt);
            break;
        case 'MSPointerCancel':
        case 'pointercancel':
            this.onPointercancel(evt);
            break;
    }
};

PointerPushButton.prototype.onPointerdown = function (evt) {
    if(!this.active && (!this.monotouchable || !this.isLocked())) {
        if(this.monotouchable) this.lock();
        this.setActive(true);
        this.pointerId = evt.pointerId;
        this._setPointerCapture(evt.pointerId);
        var boundingRect = this.el.getBoundingClientRect();
        this.boundaries.minX = boundingRect.left;
        this.boundaries.maxX = boundingRect.left + boundingRect.width;
        this.boundaries.minY = boundingRect.top;
        this.boundaries.maxY = boundingRect.bottom;
        this.promisef = Q.delay(evt, this.delay).then(this.f);
    }
};

PointerPushButton.prototype.onPointermove = function (evt) {
    if (this.active && !this.leftOrEnded) {
        if (this._isDownPointerId(evt.pointerId)) {
            evt.preventDefault();
            if (!this._isInActiveZone(evt)) {
                this._removeCls();
                this.leftOrEnded = true;
                this.promisef
                        .then(evt)
                        .then(this.g)
                        .finally(this._done(evt))
                        .done();
            }
        }
    }
};

PointerPushButton.prototype._done = function (evt) {
    var btn = this;
    return function () {
        btn.onPointercancel(evt);
    };
};

PointerPushButton.prototype.onPointerup = function (evt) {
    if (this.active && !this.leftOrEnded) {
        if (this._isDownPointerId(evt.pointerId)) {
            this._removeCls();
            this.leftOrEnded = true;
            this.promisef
                    .then(evt)
                    .then(this.g)
                    .finally(this._done(evt))
                    .done();
        }
    }
};

PointerPushButton.prototype.onPointercancel = function (evt) {
    this.setActive(false);
    if(this.monotouchable) this.unlock();
    this.leftOrEnded = false;
};

module.exports = PointerPushButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointerdown-button.js":[function(require,module,exports){
/*
 * default/pointerdown-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var PointerdownButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.delay = options.delay > 0 ? options.delay : 0;
};

PointerdownButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

PointerdownButton.prototype.constructor = PointerdownButton;

PointerdownButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    if (window.MSPointerEvent)
        this.el.addEventListener('MSPointerDown', this, false);
    else
        this.el.addEventListener('pointerdown', this, false);;
    this.binded = true;
    return this;
};

PointerdownButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    if (window.MSPointerEvent)
        this.el.removeEventListener('MSPointerDown', this, false);
    else
        this.el.removeEventListener('pointerdown', this, false);;
    this.binded = false;
    return this;
};

PointerdownButton.prototype.handleEvent = function (evt) {
    switch(evt.type) {
        case 'MSPointerDown':
        case 'pointerdown':
            this.onPointerdown(evt);
            break;
    }
};

function _done(btn) {
    return function () {
        if(btn.monotouchable) btn.unlock();
        btn.setActive(false);
    };
};

PointerdownButton.prototype.onPointerdown = function (evt) {
    if (!this.active && (!this.monotouchable || !this.isLocked())) {
        var btn = this;
        if(btn.monotouchable) btn.lock();
        btn.setActive(true);
        Q.delay(evt, btn.delay).then(btn.f).finally(_done(btn)).done();
    }
};

module.exports = PointerdownButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointerup-button.js":[function(require,module,exports){
/*
 * default/pointerup-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var PointerupButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.activeBorder = options.activeBorder || 50;
    this.boundaries = { minX : 0, maxX : 0, minY : 0, maxY : 0 };
    this.pointerId = null;
};

PointerupButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

PointerupButton.prototype.constructor = PointerupButton;

PointerupButton.prototype.setActiveBorder = function (len) {
    this.activeBorder = len;
};

PointerupButton.prototype._isDownPointerId = function (pointerId) {
    return this.pointerId === pointerId;
};

PointerupButton.prototype._isInActiveZone = function (evt) {
    var x = evt.clientX,
        y = evt.clientY,
        b = this.boundaries;
    return x < b.maxX && x > b.minX && y < b.maxY && y > b.minY;
};

PointerupButton.prototype._setPointerCapture = function (pointerId) {
    if (window.MSPointerEvent)
        this.el.msSetPointerCapture(pointerId);
    else
        this.el.setPointerCapture(pointerId);
}

PointerupButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    if (window.MSPointerEvent) {
        this.el.addEventListener('MSPointerDown', this, false);
        this.el.addEventListener('MSPointerMove', this, false);
        this.el.addEventListener('MSPointerUp', this, false);
        this.el.addEventListener('MSPointerCancel', this, false);
    } else {
        this.el.addEventListener('pointerdown', this, false);
        this.el.addEventListener('pointermove', this, false);
        this.el.addEventListener('pointerup', this, false);
        this.el.addEventListener('pointercancel', this, false);
    }
    this.binded = true;
    return this;
};

PointerupButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    if (window.MSPointerEvent) {
        this.el.removeEventListener('MSPointerDown', this, false);
        this.el.removeEventListener('MSPointerMove', this, false);
        this.el.removeEventListener('MSPointerUp', this, false);
        this.el.removeEventListener('MSPointerCancel', this, false);
    } else {
        this.el.removeEventListener('pointerdown', this, false);
        this.el.removeEventListener('pointermove', this, false);
        this.el.removeEventListener('pointerup', this, false);
        this.el.removeEventListener('pointercancel', this, false);
    }
    this.binded = false;
    return this;
};

PointerupButton.prototype.handleEvent = function (evt) {
    switch (evt.type) {
        case 'MSPointerDown':
        case 'pointerdown':
            this.onPointerdown(evt);
            break;
        case 'MSPointerMove':
        case 'pointermove':
            this.onPointermove(evt);
            break;
        case 'MSPointerUp':
        case 'pointerup':
            this.onPointerup(evt);
            break;
        case 'MSPointerCancel':
        case 'pointercancel':
            this.onPointercancel(evt);
            break;
    }
};

PointerupButton.prototype.onPointerdown = function (evt) {
    if (!this.active  && (!this.monotouchable || !this.isLocked())) {
        if(this.monotouchable) this.lock();
        this.setActive(true);
        this.pointerId = evt.pointerId;
        this._setPointerCapture(evt.pointerId);
        this.triggerOnPointerup = true;
        var boundingRect = this.el.getBoundingClientRect();
        this.boundaries.minX = boundingRect.left - this.activeBorder;
        this.boundaries.maxX = boundingRect.left + boundingRect.width + this.activeBorder;
        this.boundaries.minY = boundingRect.top - this.activeBorder;
        this.boundaries.maxY = boundingRect.bottom +  this.activeBorder;
    }
};

PointerupButton.prototype.onPointermove = function (evt) {
    if (this.active) {
        if (this._isDownPointerId(evt.pointerId)) {
            evt.preventDefault();
            if (this._isInActiveZone(evt)) {
                this.triggerOnPointerup = true;
                this._addCls();
            } else {
                this.triggerOnPointerup = false;
                this._removeCls();
            }
        }
    }
};

PointerupButton.prototype._done = function (evt) {
    var btn = this;
    return function () {
        btn.onPointercancel(evt);
    };
};

PointerupButton.prototype.onPointerup = function (evt) {
    if (this.active) {
        if (this._isDownPointerId(evt.pointerId)) {
            if (this.triggerOnPointerup) {
                var btn = this;
                btn._removeCls();
                Q(evt).then(btn.f).finally(btn._done(evt)).done();
            } else {
                this._done(evt);
            }
        }
    }
};

PointerupButton.prototype.onPointercancel = function (evt) {
    this._removeCls();
    if(this.monotouchable) this.unlock();
    if (this.active) this.active = false;
};

module.exports = PointerupButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/scrollable-x/pointerup-button.js":[function(require,module,exports){
/*
 * scrollable-x/pointerup-button.js
 */

"use strict";

var PointerupButton = require('./../default/pointerup-button');

var PointerupOnScrollableXButton = function (options) {
    PointerupButton.prototype.constructor.call(this, options);
    this.tolerance = options.tolerance || 10;
};

PointerupOnScrollableXButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(PointerupButton.prototype);

PointerupOnScrollableXButton.prototype.constructor = PointerupOnScrollableXButton;

PointerupOnScrollableXButton.prototype.onPointerdown = function (evt) {
    if (!this.active && (!this.monotouchable || !this.isLocked()))
        this.startX = evt.clientX;
    PointerupButton.prototype.onPointerdown.call(this, evt);
};

PointerupOnScrollableXButton.prototype._isInActiveZone = function (evt) {
    var y = evt.clientY,
        d = Math.abs(evt.clientX - this.startX),
        b = this.boundaries;
    return y < b.maxY && y > b.minY && d < this.tolerance;
};

PointerupOnScrollableXButton.prototype.onPointermove = function (evt) {
    if (this.active) {
        if (this._isDownPointerId(evt.pointerId)) {
            evt.preventDefault();
            if (this._isInActiveZone(evt)) this._addCls();
            else this._done.call(this, evt)();
        }
    }
};

module.exports = PointerupOnScrollableXButton;

},{"./../default/pointerup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointerup-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/scrollable-y/pointerup-button.js":[function(require,module,exports){
/*
 * scrollable-y/pointerup-button.js
 */

"use strict";

var PointerupButton = require('./../default/pointerup-button');

var PointerupOnScrollableYButton = function (options) {
    PointerupButton.prototype.constructor.call(this, options);
    this.tolerance = options.tolerance || 10;
};

PointerupOnScrollableYButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(PointerupButton.prototype);

PointerupOnScrollableYButton.prototype.constructor = PointerupOnScrollableYButton;

PointerupOnScrollableYButton.prototype.onPointerdown = function (evt) {
    if (!this.active && (!this.monotouchable || !this.isLocked()))
        this.startY = evt.clientY;
    PointerupButton.prototype.onPointerdown.call(this, evt);
};

PointerupOnScrollableYButton.prototype._isInActiveZone = function (evt) {
    var x = evt.clientX,
        d = Math.abs(evt.clientY - this.startY),
        b = this.boundaries;
    return x < b.maxX && x > b.minX && d < this.tolerance;
};

PointerupOnScrollableYButton.prototype.onPointermove = function (evt) {
    if (this.active) {
        if (this._isDownPointerId(evt.pointerId)) {
            evt.preventDefault();
            if (this._isInActiveZone(evt)) this._addCls();
            else this._done.call(this, evt)();
        }
    }
};

module.exports = PointerupOnScrollableYButton;

},{"./../default/pointerup-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/pointer/default/pointerup-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touch-push-button.js":[function(require,module,exports){
/*
 * default/touch-push-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var TouchPushButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.delay = options.delay > 0 ? options.delay : 0;
    this.g = null;
    if(typeof options.g === 'function') this.g = options.g;
    this.promisef = null;
    this.boundaries = { minX : 0, maxX : 0, minY : 0, maxY : 0 };
    this.leftOrEnded = false;
    this.identifier = null;
};

TouchPushButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

TouchPushButton.prototype.constructor = TouchPushButton;

TouchPushButton.prototype.setG = function (g) {
    if (typeof g !== 'function')
        throw new Error("Button setG method needs a g function as argument.");
    this.g = g;
    return this;
};

TouchPushButton.prototype._getTouch = function (changedTouches) {
    for (var i = 0; i < changedTouches.length; i++) {
        if (changedTouches[i].identifier === this.identifier) {
            return changedTouches[i];
        }
    }
    return null;
};

TouchPushButton.prototype._isInActiveZone = function (touch) {
    var x = touch.clientX,
        y = touch.clientY,
        b = this.boundaries;
    return x < b.maxX && x > b.minX && y < b.maxY && y > b.minY;
};

TouchPushButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    this.el.addEventListener('touchstart', this, false);
    this.el.addEventListener('touchmove', this, false);
    this.el.addEventListener('touchend', this, false);
    this.el.addEventListener('touchcancel', this, false);
    this.binded = true;
    return this;
};

TouchPushButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    this.el.removeEventListener('touchstart', this, false);
    this.el.removeEventListener('touchmove', this, false);
    this.el.removeEventListener('touchend', this, false);
    this.el.removeEventListener('touchcancel', this, false);
    this.binded = false;
    return this;
};

TouchPushButton.prototype.handleEvent = function (evt) {
    switch(evt.type) {
        case 'touchstart':
            this.onTouchstart(evt);
            break;
        case 'touchmove':
            this.onTouchmove(evt);
            break;
        case 'touchend':
            this.onTouchend(evt);
            break;
        case 'touchcancel':
            this.onTouchcancel(evt);
            break;
    }
};

TouchPushButton.prototype.onTouchstart = function (evt) {
    if(!this.active && (!this.monotouchable || !this.isLocked())) {
        if(this.monotouchable) this.lock();
        this.setActive(true);
        this.identifier = evt.changedTouches[0].identifier;
        var boundingRect = this.el.getBoundingClientRect();
        this.boundaries.minX = boundingRect.left;
        this.boundaries.maxX = boundingRect.left + boundingRect.width;
        this.boundaries.minY = boundingRect.top;
        this.boundaries.maxY = boundingRect.bottom;
        this.promisef = Q.delay(evt, this.delay).then(this.f);
    }
};

TouchPushButton.prototype.onTouchmove = function (evt) {
    if(this.active && !this.leftOrEnded) {
        var touch = this._getTouch(evt.changedTouches);
        if (touch) {
            evt.preventDefault();
            if(!this._isInActiveZone(touch)) {
                this._removeCls();
                this.leftOrEnded = true;
                this.promisef
                        .then(evt)
                        .then(this.g)
                        .finally(this._done(evt))
                        .done();
            }
        }
    }
};

TouchPushButton.prototype._done = function (evt) {
    var btn = this;
    return function () {
        btn.onTouchcancel(evt);
    };
};

TouchPushButton.prototype.onTouchend = function (evt) {
    if(this.active && !this.leftOrEnded) {
        if (this._getTouch(evt.changedTouches)) {
            this._removeCls();
            this.leftOrEnded = true;
            this.promisef
                    .then(evt)
                    .then(this.g)
                    .finally(this._done(evt))
                    .done();
        }
    }
};

TouchPushButton.prototype.onTouchcancel = function (evt) {
    this.setActive(false);
    if(this.monotouchable) this.unlock();
    this.leftOrEnded = false;
};

module.exports = TouchPushButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touchend-button.js":[function(require,module,exports){
/*
 * default/touchend-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var TouchendButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.activeBorder = options.activeBorder || 50;
    this.boundaries = { minX : 0, maxX : 0, minY : 0, maxY : 0 };
    this.identifier = null;
};

TouchendButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

TouchendButton.prototype.constructor = TouchendButton;

TouchendButton.prototype.setActiveBorder = function (len) {
    this.activeBorder = len;
};

TouchendButton.prototype._getTouch = function (changedTouches) {
    for (var i = 0; i < changedTouches.length; i++) {
        if (changedTouches[i].identifier === this.identifier) {
            return changedTouches[i];
        }
    }
    return null;
};

TouchendButton.prototype._isInActiveZone = function (touch) {
    var x = touch.clientX,
        y = touch.clientY,
        b = this.boundaries;
    return x < b.maxX && x > b.minX && y < b.maxY && y > b.minY;
};

TouchendButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    this.el.addEventListener('touchstart', this, false);
    this.el.addEventListener('touchmove', this, false);
    this.el.addEventListener('touchend', this, false);
    this.el.addEventListener('touchcancel', this, false);
    this.binded = true;
    return this;
};

TouchendButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    this.el.removeEventListener('touchstart', this, false);
    this.el.removeEventListener('touchmove', this, false);
    this.el.removeEventListener('touchend', this, false);
    this.el.removeEventListener('touchcancel', this, false);
    this.binded = false;
    return this;
};

TouchendButton.prototype.handleEvent = function (evt) {
    switch(evt.type) {
        case 'touchstart':
            this.onTouchstart(evt);
            break;
        case 'touchmove':
            this.onTouchmove(evt);
            break;
        case 'touchend':
            this.onTouchend(evt);
            break;
        case 'touchcancel':
            this.onTouchcancel(evt);
            break;
    }
};

TouchendButton.prototype.onTouchstart = function (evt) {
    if(!this.active && (!this.monotouchable || !this.isLocked())) {
        if(this.monotouchable) this.lock();
        this.active = true;
        this.triggerOnTouchend = true;
        this.identifier = evt.changedTouches[0].identifier;
        var boundingRect = this.el.getBoundingClientRect();
        this.boundaries.minX = boundingRect.left - this.activeBorder;
        this.boundaries.maxX = boundingRect.left + boundingRect.width + this.activeBorder;
        this.boundaries.minY = boundingRect.top - this.activeBorder;
        this.boundaries.maxY = boundingRect.bottom +  this.activeBorder;
        this._addCls();
    }
};

TouchendButton.prototype.onTouchmove = function (evt) {
    if(this.active) {
        var touch = this._getTouch(evt.changedTouches);
        if (touch) {
            evt.preventDefault();
            if(this._isInActiveZone(touch)) {
                this.triggerOnTouchend = true;
                this._addCls();
            }
            else {
                this.triggerOnTouchend = false;
                this._removeCls();
            }
        }
    }
};

TouchendButton.prototype._done = function (evt) {
    var btn = this;
    return function () {
        btn.onTouchcancel(evt);
    };
};

TouchendButton.prototype.onTouchend = function (evt) {
    if(this.active) {
        if (this._getTouch(evt.changedTouches)) {
            if (this.triggerOnTouchend) {
                var btn = this;
                btn._removeCls();
                Q(evt).then(btn.f).finally(btn._done(evt)).done();
            }
            else {
                this._done(evt)();
            }
        }
    }
};

TouchendButton.prototype.onTouchcancel = function (evt) {
    this._removeCls();
    if(this.monotouchable) this.unlock();
    if(this.active) this.active = false;
};

module.exports = TouchendButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touchstart-button.js":[function(require,module,exports){
/*
 * default/touchstart-button.js
 */

"use strict";

var Q = require('q'),
    Button = require('./../../button');

var TouchstartButton = function (options) {
    Button.prototype.constructor.call(this, options);
    this.delay = options.delay > 0 ? options.delay : 0;
};

TouchstartButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(Button.prototype);

TouchstartButton.prototype.constructor = TouchstartButton;

TouchstartButton.prototype.bind = function () {
    Button.prototype.bind.call(this);
    this.el.addEventListener('touchstart', this, false);
    this.binded = true;
    return this;
};

TouchstartButton.prototype.unbind = function () {
    Button.prototype.unbind.call(this);
    this.el.removeEventListener('touchstart', this, false);
    this.binded = false;
    return this;
};

TouchstartButton.prototype.handleEvent = function (evt) {
    switch(evt.type) {
        case 'touchstart':
            this.onTouchstart(evt);
            break;
    }
};

function _done(btn) {
    return function () {
        if(btn.monotouchable) btn.unlock();
        btn.setActive(false);
    };
};

TouchstartButton.prototype.onTouchstart = function (evt) {
    if (!this.active && (!this.monotouchable || !this.isLocked())) {
        var btn = this;
        if(btn.monotouchable) btn.lock();
        btn.setActive(true);
        Q.delay(evt, btn.delay).then(btn.f).finally(_done(btn)).done();
    }
};

module.exports = TouchstartButton;

},{"./../../button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/button.js","q":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/scrollable-x/touchend-button.js":[function(require,module,exports){
/*
 * scrollable-x/touchend-button.js
 */

"use strict";

var TouchendButton = require('./../default/touchend-button');

var ScrollableXTouchendButton = function (options) {
    TouchendButton.prototype.constructor.call(this, options);
    this.tolerance = options.tolerance || 10;
};

ScrollableXTouchendButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(TouchendButton.prototype);

ScrollableXTouchendButton.prototype.constructor = ScrollableXTouchendButton;

ScrollableXTouchendButton.prototype.onTouchstart = function (evt) {
    if(!this.active && (!this.monotouchable || !this.isLocked()))
        this.startX = evt.changedTouches[0].clientX;
    TouchendButton.prototype.onTouchstart.call(this, evt);
};

ScrollableXTouchendButton.prototype._isInActiveZone = function (touch) {
    var y = touch.clientY,
        d = Math.abs(touch.clientX - this.startX),
        b = this.boundaries;
    return y < b.maxY && y > b.minY && d < this.tolerance;
};

ScrollableXTouchendButton.prototype.onTouchmove = function (evt) {
    if(this.active) {
        var touch = this._getTouch(evt.changedTouches);
        if (touch) {
            evt.preventDefault();
            if(this._isInActiveZone(touch)) this._addCls();
            else this._done.call(this, evt)();
        }
    }
};

module.exports = ScrollableXTouchendButton;

},{"./../default/touchend-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touchend-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/scrollable-y/touchend-button.js":[function(require,module,exports){
/*
 * scrollable-y/touchend-button.js
 */

"use strict";

var TouchendButton = require('./../default/touchend-button');

var ScrollableYTouchendButton = function (options) {
    TouchendButton.prototype.constructor.call(this, options);
    this.tolerance = options.tolerance || 10;
};

ScrollableYTouchendButton.prototype = (function (proto) {
    function F() {};
    F.prototype = proto;
    return new F();
})(TouchendButton.prototype);

ScrollableYTouchendButton.prototype.constructor = ScrollableYTouchendButton;

ScrollableYTouchendButton.prototype.onTouchstart = function (evt) {
    if(!this.active && (!this.monotouchable || !this.isLocked()))
        this.startY = evt.changedTouches[0].clientY;
    TouchendButton.prototype.onTouchstart.call(this, evt);
};

ScrollableYTouchendButton.prototype._isInActiveZone = function (touch) {
    var x = touch.clientX,
        d = Math.abs(touch.clientY - this.startY),
        b = this.boundaries;
    return x < b.maxX && x > b.minX && d < this.tolerance;
};

ScrollableYTouchendButton.prototype.onTouchmove = function (evt) {
    if(this.active) {
        var touch = this._getTouch(evt.changedTouches);
        if (touch) {
            evt.preventDefault();
            if(this._isInActiveZone(touch)) this._addCls();
            else this._done.call(this, evt)();
        }
    }
};

module.exports = ScrollableYTouchendButton;

},{"./../default/touchend-button":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/lib/touch/default/touchend-button.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/mobile-button/node_modules/q/q.js":[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof self !== "undefined") {
        self.Q = definition();

    } else {
        throw new Error("This environment was not anticiapted by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))

},{"_process":"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/browserify/node_modules/process/browser.js"}],"/Users/bobylito/Copy/source.sync/GreekFlashcards/node_modules/reveal.js/js/reveal.js":[function(require,module,exports){
/*!
 * reveal.js
 * http://lab.hakim.se/reveal-js
 * MIT licensed
 *
 * Copyright (C) 2015 Hakim El Hattab, http://hakim.se
 */
(function( root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		// AMD. Register as an anonymous module.
		define( function() {
			root.Reveal = factory();
			return root.Reveal;
		} );
	} else if( typeof exports === 'object' ) {
		// Node. Does not work with strict CommonJS.
		module.exports = factory();
	} else {
		// Browser globals.
		root.Reveal = factory();
	}
}( this, function() {

	'use strict';

	var Reveal;

	var SLIDES_SELECTOR = '.slides section',
		HORIZONTAL_SLIDES_SELECTOR = '.slides>section',
		VERTICAL_SLIDES_SELECTOR = '.slides>section.present>section',
		HOME_SLIDE_SELECTOR = '.slides>section:first-of-type',

		// Configurations defaults, can be overridden at initialization time
		config = {

			// The "normal" size of the presentation, aspect ratio will be preserved
			// when the presentation is scaled to fit different resolutions
			width: 960,
			height: 700,

			// Factor of the display size that should remain empty around the content
			margin: 0.1,

			// Bounds for smallest/largest possible scale to apply to content
			minScale: 0.2,
			maxScale: 1.5,

			// Display controls in the bottom right corner
			controls: true,

			// Display a presentation progress bar
			progress: true,

			// Display the page number of the current slide
			slideNumber: false,

			// Push each slide change to the browser history
			history: false,

			// Enable keyboard shortcuts for navigation
			keyboard: true,

			// Optional function that blocks keyboard events when retuning false
			keyboardCondition: null,

			// Enable the slide overview mode
			overview: true,

			// Vertical centering of slides
			center: true,

			// Enables touch navigation on devices with touch input
			touch: true,

			// Loop the presentation
			loop: false,

			// Change the presentation direction to be RTL
			rtl: false,

			// Turns fragments on and off globally
			fragments: true,

			// Flags if the presentation is running in an embedded mode,
			// i.e. contained within a limited portion of the screen
			embedded: false,

			// Flags if we should show a help overlay when the questionmark
			// key is pressed
			help: true,

			// Flags if it should be possible to pause the presentation (blackout)
			pause: true,

			// Number of milliseconds between automatically proceeding to the
			// next slide, disabled when set to 0, this value can be overwritten
			// by using a data-autoslide attribute on your slides
			autoSlide: 0,

			// Stop auto-sliding after user input
			autoSlideStoppable: true,

			// Enable slide navigation via mouse wheel
			mouseWheel: false,

			// Apply a 3D roll to links on hover
			rollingLinks: false,

			// Hides the address bar on mobile devices
			hideAddressBar: true,

			// Opens links in an iframe preview overlay
			previewLinks: false,

			// Exposes the reveal.js API through window.postMessage
			postMessage: true,

			// Dispatches all reveal.js events to the parent window through postMessage
			postMessageEvents: false,

			// Focuses body when page changes visiblity to ensure keyboard shortcuts work
			focusBodyOnPageVisibilityChange: true,

			// Transition style
			transition: 'slide', // none/fade/slide/convex/concave/zoom

			// Transition speed
			transitionSpeed: 'default', // default/fast/slow

			// Transition style for full page slide backgrounds
			backgroundTransition: 'fade', // none/fade/slide/convex/concave/zoom

			// Parallax background image
			parallaxBackgroundImage: '', // CSS syntax, e.g. "a.jpg"

			// Parallax background size
			parallaxBackgroundSize: '', // CSS syntax, e.g. "3000px 2000px"

			// Number of slides away from the current that are visible
			viewDistance: 3,

			// Script dependencies to load
			dependencies: []

		},

		// Flags if reveal.js is loaded (has dispatched the 'ready' event)
		loaded = false,

		// The horizontal and vertical index of the currently active slide
		indexh,
		indexv,

		// The previous and current slide HTML elements
		previousSlide,
		currentSlide,

		previousBackground,

		// Slides may hold a data-state attribute which we pick up and apply
		// as a class to the body. This list contains the combined state of
		// all current slides.
		state = [],

		// The current scale of the presentation (see width/height config)
		scale = 1,

		// Cached references to DOM elements
		dom = {},

		// Features supported by the browser, see #checkCapabilities()
		features = {},

		// Client is a mobile device, see #checkCapabilities()
		isMobileDevice,

		// Throttles mouse wheel navigation
		lastMouseWheelStep = 0,

		// Delays updates to the URL due to a Chrome thumbnailer bug
		writeURLTimeout = 0,

		// Flags if the interaction event listeners are bound
		eventsAreBound = false,

		// The current auto-slide duration
		autoSlide = 0,

		// Auto slide properties
		autoSlidePlayer,
		autoSlideTimeout = 0,
		autoSlideStartTime = -1,
		autoSlidePaused = false,

		// Holds information about the currently ongoing touch input
		touch = {
			startX: 0,
			startY: 0,
			startSpan: 0,
			startCount: 0,
			captured: false,
			threshold: 40
		},

		// Holds information about the keyboard shortcuts
		keyboardShortcuts = {
			'N  ,  SPACE':			'Next slide',
			'P':					'Previous slide',
			'&#8592;  ,  H':		'Navigate left',
			'&#8594;  ,  L':		'Navigate right',
			'&#8593;  ,  K':		'Navigate up',
			'&#8595;  ,  J':		'Navigate down',
			'Home':					'First slide',
			'End':					'Last slide',
			'B  ,  .':				'Pause',
			'F':					'Fullscreen',
			'ESC, O':				'Slide overview'
		};

	/**
	 * Starts up the presentation if the client is capable.
	 */
	function initialize( options ) {

		checkCapabilities();

		if( !features.transforms2d && !features.transforms3d ) {
			document.body.setAttribute( 'class', 'no-transforms' );

			// Since JS won't be running any further, we need to load all
			// images that were intended to lazy load now
			var images = document.getElementsByTagName( 'img' );
			for( var i = 0, len = images.length; i < len; i++ ) {
				var image = images[i];
				if( image.getAttribute( 'data-src' ) ) {
					image.setAttribute( 'src', image.getAttribute( 'data-src' ) );
					image.removeAttribute( 'data-src' );
				}
			}

			// If the browser doesn't support core features we won't be
			// using JavaScript to control the presentation
			return;
		}

		// Cache references to key DOM elements
		dom.wrapper = document.querySelector( '.reveal' );
		dom.slides = document.querySelector( '.reveal .slides' );

		// Force a layout when the whole page, incl fonts, has loaded
		window.addEventListener( 'load', layout, false );

		var query = Reveal.getQueryHash();

		// Do not accept new dependencies via query config to avoid
		// the potential of malicious script injection
		if( typeof query['dependencies'] !== 'undefined' ) delete query['dependencies'];

		// Copy options over to our config object
		extend( config, options );
		extend( config, query );

		// Hide the address bar in mobile browsers
		hideAddressBar();

		// Loads the dependencies and continues to #start() once done
		load();

	}

	/**
	 * Inspect the client to see what it's capable of, this
	 * should only happens once per runtime.
	 */
	function checkCapabilities() {

		features.transforms3d = 'WebkitPerspective' in document.body.style ||
								'MozPerspective' in document.body.style ||
								'msPerspective' in document.body.style ||
								'OPerspective' in document.body.style ||
								'perspective' in document.body.style;

		features.transforms2d = 'WebkitTransform' in document.body.style ||
								'MozTransform' in document.body.style ||
								'msTransform' in document.body.style ||
								'OTransform' in document.body.style ||
								'transform' in document.body.style;

		features.requestAnimationFrameMethod = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
		features.requestAnimationFrame = typeof features.requestAnimationFrameMethod === 'function';

		features.canvas = !!document.createElement( 'canvas' ).getContext;

		features.touch = !!( 'ontouchstart' in window );

		isMobileDevice = navigator.userAgent.match( /(iphone|ipod|ipad|android)/gi );

	}

    /**
     * Loads the dependencies of reveal.js. Dependencies are
     * defined via the configuration option 'dependencies'
     * and will be loaded prior to starting/binding reveal.js.
     * Some dependencies may have an 'async' flag, if so they
     * will load after reveal.js has been started up.
     */
	function load() {

		var scripts = [],
			scriptsAsync = [],
			scriptsToPreload = 0;

		// Called once synchronous scripts finish loading
		function proceed() {
			if( scriptsAsync.length ) {
				// Load asynchronous scripts
				head.js.apply( null, scriptsAsync );
			}

			start();
		}

		function loadScript( s ) {
			head.ready( s.src.match( /([\w\d_\-]*)\.?js$|[^\\\/]*$/i )[0], function() {
				// Extension may contain callback functions
				if( typeof s.callback === 'function' ) {
					s.callback.apply( this );
				}

				if( --scriptsToPreload === 0 ) {
					proceed();
				}
			});
		}

		for( var i = 0, len = config.dependencies.length; i < len; i++ ) {
			var s = config.dependencies[i];

			// Load if there's no condition or the condition is truthy
			if( !s.condition || s.condition() ) {
				if( s.async ) {
					scriptsAsync.push( s.src );
				}
				else {
					scripts.push( s.src );
				}

				loadScript( s );
			}
		}

		if( scripts.length ) {
			scriptsToPreload = scripts.length;

			// Load synchronous scripts
			head.js.apply( null, scripts );
		}
		else {
			proceed();
		}

	}

	/**
	 * Starts up reveal.js by binding input events and navigating
	 * to the current URL deeplink if there is one.
	 */
	function start() {

		// Make sure we've got all the DOM elements we need
		setupDOM();

		// Listen to messages posted to this window
		setupPostMessage();

		// Resets all vertical slides so that only the first is visible
		resetVerticalSlides();

		// Updates the presentation to match the current configuration values
		configure();

		// Read the initial hash
		readURL();

		// Update all backgrounds
		updateBackground( true );

		// Notify listeners that the presentation is ready but use a 1ms
		// timeout to ensure it's not fired synchronously after #initialize()
		setTimeout( function() {
			// Enable transitions now that we're loaded
			dom.slides.classList.remove( 'no-transition' );

			loaded = true;

			dispatchEvent( 'ready', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );
		}, 1 );

		// Special setup and config is required when printing to PDF
		if( isPrintingPDF() ) {
			removeEventListeners();

			// The document needs to have loaded for the PDF layout
			// measurements to be accurate
			if( document.readyState === 'complete' ) {
				setupPDF();
			}
			else {
				window.addEventListener( 'load', setupPDF );
			}
		}

	}

	/**
	 * Finds and stores references to DOM elements which are
	 * required by the presentation. If a required element is
	 * not found, it is created.
	 */
	function setupDOM() {

		// Prevent transitions while we're loading
		dom.slides.classList.add( 'no-transition' );

		// Background element
		dom.background = createSingletonNode( dom.wrapper, 'div', 'backgrounds', null );

		// Progress bar
		dom.progress = createSingletonNode( dom.wrapper, 'div', 'progress', '<span></span>' );
		dom.progressbar = dom.progress.querySelector( 'span' );

		// Arrow controls
		createSingletonNode( dom.wrapper, 'aside', 'controls',
			'<div class="navigate-left"></div>' +
			'<div class="navigate-right"></div>' +
			'<div class="navigate-up"></div>' +
			'<div class="navigate-down"></div>' );

		// Slide number
		dom.slideNumber = createSingletonNode( dom.wrapper, 'div', 'slide-number', '' );

		// Overlay graphic which is displayed during the paused mode
		createSingletonNode( dom.wrapper, 'div', 'pause-overlay', null );

		// Cache references to elements
		dom.controls = document.querySelector( '.reveal .controls' );
		dom.theme = document.querySelector( '#theme' );

		dom.wrapper.setAttribute( 'role', 'application' );

		// There can be multiple instances of controls throughout the page
		dom.controlsLeft = toArray( document.querySelectorAll( '.navigate-left' ) );
		dom.controlsRight = toArray( document.querySelectorAll( '.navigate-right' ) );
		dom.controlsUp = toArray( document.querySelectorAll( '.navigate-up' ) );
		dom.controlsDown = toArray( document.querySelectorAll( '.navigate-down' ) );
		dom.controlsPrev = toArray( document.querySelectorAll( '.navigate-prev' ) );
		dom.controlsNext = toArray( document.querySelectorAll( '.navigate-next' ) );

		dom.statusDiv = createStatusDiv();
	}

	/**
	 * Creates a hidden div with role aria-live to announce the
	 * current slide content. Hide the div off-screen to make it
	 * available only to Assistive Technologies.
	 */
	function createStatusDiv() {

		var statusDiv = document.getElementById( 'aria-status-div' );
		if( !statusDiv ) {
			statusDiv = document.createElement( 'div' );
			statusDiv.style.position = 'absolute';
			statusDiv.style.height = '1px';
			statusDiv.style.width = '1px';
			statusDiv.style.overflow ='hidden';
			statusDiv.style.clip = 'rect( 1px, 1px, 1px, 1px )';
			statusDiv.setAttribute( 'id', 'aria-status-div' );
			statusDiv.setAttribute( 'aria-live', 'polite' );
			statusDiv.setAttribute( 'aria-atomic','true' );
			dom.wrapper.appendChild( statusDiv );
		}
		return statusDiv;

	}

	/**
	 * Configures the presentation for printing to a static
	 * PDF.
	 */
	function setupPDF() {

		var slideSize = getComputedSlideSize( window.innerWidth, window.innerHeight );

		// Dimensions of the PDF pages
		var pageWidth = Math.floor( slideSize.width * ( 1 + config.margin ) ),
			pageHeight = Math.floor( slideSize.height * ( 1 + config.margin  ) );

		// Dimensions of slides within the pages
		var slideWidth = slideSize.width,
			slideHeight = slideSize.height;

		// Let the browser know what page size we want to print
		injectStyleSheet( '@page{size:'+ pageWidth +'px '+ pageHeight +'px; margin: 0;}' );

		// Limit the size of certain elements to the dimensions of the slide
		injectStyleSheet( '.reveal section>img, .reveal section>video, .reveal section>iframe{max-width: '+ slideWidth +'px; max-height:'+ slideHeight +'px}' );

		document.body.classList.add( 'print-pdf' );
		document.body.style.width = pageWidth + 'px';
		document.body.style.height = pageHeight + 'px';

		// Slide and slide background layout
		toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) ).forEach( function( slide ) {

			// Vertical stacks are not centred since their section
			// children will be
			if( slide.classList.contains( 'stack' ) === false ) {
				// Center the slide inside of the page, giving the slide some margin
				var left = ( pageWidth - slideWidth ) / 2,
					top = ( pageHeight - slideHeight ) / 2;

				var contentHeight = getAbsoluteHeight( slide );
				var numberOfPages = Math.max( Math.ceil( contentHeight / pageHeight ), 1 );

				// Center slides vertically
				if( numberOfPages === 1 && config.center || slide.classList.contains( 'center' ) ) {
					top = Math.max( ( pageHeight - contentHeight ) / 2, 0 );
				}

				// Position the slide inside of the page
				slide.style.left = left + 'px';
				slide.style.top = top + 'px';
				slide.style.width = slideWidth + 'px';

				// TODO Backgrounds need to be multiplied when the slide
				// stretches over multiple pages
				var background = slide.querySelector( '.slide-background' );
				if( background ) {
					background.style.width = pageWidth + 'px';
					background.style.height = ( pageHeight * numberOfPages ) + 'px';
					background.style.top = -top + 'px';
					background.style.left = -left + 'px';
				}
			}

		} );

		// Show all fragments
		toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ' .fragment' ) ).forEach( function( fragment ) {
			fragment.classList.add( 'visible' );
		} );

	}

	/**
	 * Creates an HTML element and returns a reference to it.
	 * If the element already exists the existing instance will
	 * be returned.
	 */
	function createSingletonNode( container, tagname, classname, innerHTML ) {

		// Find all nodes matching the description
		var nodes = container.querySelectorAll( '.' + classname );

		// Check all matches to find one which is a direct child of
		// the specified container
		for( var i = 0; i < nodes.length; i++ ) {
			var testNode = nodes[i];
			if( testNode.parentNode === container ) {
				return testNode;
			}
		}

		// If no node was found, create it now
		var node = document.createElement( tagname );
		node.classList.add( classname );
		if( typeof innerHTML === 'string' ) {
			node.innerHTML = innerHTML;
		}
		container.appendChild( node );

		return node;

	}

	/**
	 * Creates the slide background elements and appends them
	 * to the background container. One element is created per
	 * slide no matter if the given slide has visible background.
	 */
	function createBackgrounds() {

		var printMode = isPrintingPDF();

		// Clear prior backgrounds
		dom.background.innerHTML = '';
		dom.background.classList.add( 'no-transition' );

		// Iterate over all horizontal slides
		toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).forEach( function( slideh ) {

			var backgroundStack;

			if( printMode ) {
				backgroundStack = createBackground( slideh, slideh );
			}
			else {
				backgroundStack = createBackground( slideh, dom.background );
			}

			// Iterate over all vertical slides
			toArray( slideh.querySelectorAll( 'section' ) ).forEach( function( slidev ) {

				if( printMode ) {
					createBackground( slidev, slidev );
				}
				else {
					createBackground( slidev, backgroundStack );
				}

				backgroundStack.classList.add( 'stack' );

			} );

		} );

		// Add parallax background if specified
		if( config.parallaxBackgroundImage ) {

			dom.background.style.backgroundImage = 'url("' + config.parallaxBackgroundImage + '")';
			dom.background.style.backgroundSize = config.parallaxBackgroundSize;

			// Make sure the below properties are set on the element - these properties are
			// needed for proper transitions to be set on the element via CSS. To remove
			// annoying background slide-in effect when the presentation starts, apply
			// these properties after short time delay
			setTimeout( function() {
				dom.wrapper.classList.add( 'has-parallax-background' );
			}, 1 );

		}
		else {

			dom.background.style.backgroundImage = '';
			dom.wrapper.classList.remove( 'has-parallax-background' );

		}

	}

	/**
	 * Creates a background for the given slide.
	 *
	 * @param {HTMLElement} slide
	 * @param {HTMLElement} container The element that the background
	 * should be appended to
	 */
	function createBackground( slide, container ) {

		var data = {
			background: slide.getAttribute( 'data-background' ),
			backgroundSize: slide.getAttribute( 'data-background-size' ),
			backgroundImage: slide.getAttribute( 'data-background-image' ),
			backgroundVideo: slide.getAttribute( 'data-background-video' ),
			backgroundIframe: slide.getAttribute( 'data-background-iframe' ),
			backgroundColor: slide.getAttribute( 'data-background-color' ),
			backgroundRepeat: slide.getAttribute( 'data-background-repeat' ),
			backgroundPosition: slide.getAttribute( 'data-background-position' ),
			backgroundTransition: slide.getAttribute( 'data-background-transition' )
		};

		var element = document.createElement( 'div' );

		// Carry over custom classes from the slide to the background
		element.className = 'slide-background ' + slide.className.replace( /present|past|future/, '' );

		if( data.background ) {
			// Auto-wrap image urls in url(...)
			if( /^(http|file|\/\/)/gi.test( data.background ) || /\.(svg|png|jpg|jpeg|gif|bmp)$/gi.test( data.background ) ) {
				slide.setAttribute( 'data-background-image', data.background );
			}
			else {
				element.style.background = data.background;
			}
		}

		// Create a hash for this combination of background settings.
		// This is used to determine when two slide backgrounds are
		// the same.
		if( data.background || data.backgroundColor || data.backgroundImage || data.backgroundVideo || data.backgroundIframe ) {
			element.setAttribute( 'data-background-hash', data.background +
															data.backgroundSize +
															data.backgroundImage +
															data.backgroundVideo +
															data.backgroundIframe +
															data.backgroundColor +
															data.backgroundRepeat +
															data.backgroundPosition +
															data.backgroundTransition );
		}

		// Additional and optional background properties
		if( data.backgroundSize ) element.style.backgroundSize = data.backgroundSize;
		if( data.backgroundColor ) element.style.backgroundColor = data.backgroundColor;
		if( data.backgroundRepeat ) element.style.backgroundRepeat = data.backgroundRepeat;
		if( data.backgroundPosition ) element.style.backgroundPosition = data.backgroundPosition;
		if( data.backgroundTransition ) element.setAttribute( 'data-background-transition', data.backgroundTransition );

		container.appendChild( element );

		// If backgrounds are being recreated, clear old classes
		slide.classList.remove( 'has-dark-background' );
		slide.classList.remove( 'has-light-background' );

		// If this slide has a background color, add a class that
		// signals if it is light or dark. If the slide has no background
		// color, no class will be set
		var computedBackgroundColor = window.getComputedStyle( element ).backgroundColor;
		if( computedBackgroundColor ) {
			var rgb = colorToRgb( computedBackgroundColor );

			// Ignore fully transparent backgrounds. Some browsers return
			// rgba(0,0,0,0) when reading the computed background color of
			// an element with no background
			if( rgb && rgb.a !== 0 ) {
				if( colorBrightness( computedBackgroundColor ) < 128 ) {
					slide.classList.add( 'has-dark-background' );
				}
				else {
					slide.classList.add( 'has-light-background' );
				}
			}
		}

		return element;

	}

	/**
	 * Registers a listener to postMessage events, this makes it
	 * possible to call all reveal.js API methods from another
	 * window. For example:
	 *
	 * revealWindow.postMessage( JSON.stringify({
	 *   method: 'slide',
	 *   args: [ 2 ]
	 * }), '*' );
	 */
	function setupPostMessage() {

		if( config.postMessage ) {
			window.addEventListener( 'message', function ( event ) {
				var data = event.data;

				// Make sure we're dealing with JSON
				if( data.charAt( 0 ) === '{' && data.charAt( data.length - 1 ) === '}' ) {
					data = JSON.parse( data );

					// Check if the requested method can be found
					if( data.method && typeof Reveal[data.method] === 'function' ) {
						Reveal[data.method].apply( Reveal, data.args );
					}
				}
			}, false );
		}

	}

	/**
	 * Applies the configuration settings from the config
	 * object. May be called multiple times.
	 */
	function configure( options ) {

		var numberOfSlides = dom.wrapper.querySelectorAll( SLIDES_SELECTOR ).length;

		dom.wrapper.classList.remove( config.transition );

		// New config options may be passed when this method
		// is invoked through the API after initialization
		if( typeof options === 'object' ) extend( config, options );

		// Force linear transition based on browser capabilities
		if( features.transforms3d === false ) config.transition = 'linear';

		dom.wrapper.classList.add( config.transition );

		dom.wrapper.setAttribute( 'data-transition-speed', config.transitionSpeed );
		dom.wrapper.setAttribute( 'data-background-transition', config.backgroundTransition );

		dom.controls.style.display = config.controls ? 'block' : 'none';
		dom.progress.style.display = config.progress ? 'block' : 'none';

		if( config.rtl ) {
			dom.wrapper.classList.add( 'rtl' );
		}
		else {
			dom.wrapper.classList.remove( 'rtl' );
		}

		if( config.center ) {
			dom.wrapper.classList.add( 'center' );
		}
		else {
			dom.wrapper.classList.remove( 'center' );
		}

		// Exit the paused mode if it was configured off
		if( config.pause === false ) {
			resume();
		}

		if( config.mouseWheel ) {
			document.addEventListener( 'DOMMouseScroll', onDocumentMouseScroll, false ); // FF
			document.addEventListener( 'mousewheel', onDocumentMouseScroll, false );
		}
		else {
			document.removeEventListener( 'DOMMouseScroll', onDocumentMouseScroll, false ); // FF
			document.removeEventListener( 'mousewheel', onDocumentMouseScroll, false );
		}

		// Rolling 3D links
		if( config.rollingLinks ) {
			enableRollingLinks();
		}
		else {
			disableRollingLinks();
		}

		// Iframe link previews
		if( config.previewLinks ) {
			enablePreviewLinks();
		}
		else {
			disablePreviewLinks();
			enablePreviewLinks( '[data-preview-link]' );
		}

		// Remove existing auto-slide controls
		if( autoSlidePlayer ) {
			autoSlidePlayer.destroy();
			autoSlidePlayer = null;
		}

		// Generate auto-slide controls if needed
		if( numberOfSlides > 1 && config.autoSlide && config.autoSlideStoppable && features.canvas && features.requestAnimationFrame ) {
			autoSlidePlayer = new Playback( dom.wrapper, function() {
				return Math.min( Math.max( ( Date.now() - autoSlideStartTime ) / autoSlide, 0 ), 1 );
			} );

			autoSlidePlayer.on( 'click', onAutoSlidePlayerClick );
			autoSlidePaused = false;
		}

		// When fragments are turned off they should be visible
		if( config.fragments === false ) {
			toArray( dom.slides.querySelectorAll( '.fragment' ) ).forEach( function( element ) {
				element.classList.add( 'visible' );
				element.classList.remove( 'current-fragment' );
			} );
		}

		sync();

	}

	/**
	 * Binds all event listeners.
	 */
	function addEventListeners() {

		eventsAreBound = true;

		window.addEventListener( 'hashchange', onWindowHashChange, false );
		window.addEventListener( 'resize', onWindowResize, false );

		if( config.touch ) {
			dom.wrapper.addEventListener( 'touchstart', onTouchStart, false );
			dom.wrapper.addEventListener( 'touchmove', onTouchMove, false );
			dom.wrapper.addEventListener( 'touchend', onTouchEnd, false );

			// Support pointer-style touch interaction as well
			if( window.navigator.pointerEnabled ) {
				// IE 11 uses un-prefixed version of pointer events
				dom.wrapper.addEventListener( 'pointerdown', onPointerDown, false );
				dom.wrapper.addEventListener( 'pointermove', onPointerMove, false );
				dom.wrapper.addEventListener( 'pointerup', onPointerUp, false );
			}
			else if( window.navigator.msPointerEnabled ) {
				// IE 10 uses prefixed version of pointer events
				dom.wrapper.addEventListener( 'MSPointerDown', onPointerDown, false );
				dom.wrapper.addEventListener( 'MSPointerMove', onPointerMove, false );
				dom.wrapper.addEventListener( 'MSPointerUp', onPointerUp, false );
			}
		}

		if( config.keyboard ) {
			document.addEventListener( 'keydown', onDocumentKeyDown, false );
			document.addEventListener( 'keypress', onDocumentKeyPress, false );
		}

		if( config.progress && dom.progress ) {
			dom.progress.addEventListener( 'click', onProgressClicked, false );
		}

		if( config.focusBodyOnPageVisibilityChange ) {
			var visibilityChange;

			if( 'hidden' in document ) {
				visibilityChange = 'visibilitychange';
			}
			else if( 'msHidden' in document ) {
				visibilityChange = 'msvisibilitychange';
			}
			else if( 'webkitHidden' in document ) {
				visibilityChange = 'webkitvisibilitychange';
			}

			if( visibilityChange ) {
				document.addEventListener( visibilityChange, onPageVisibilityChange, false );
			}
		}

		// Listen to both touch and click events, in case the device
		// supports both
		var pointerEvents = [ 'touchstart', 'click' ];

		// Only support touch for Android, fixes double navigations in
		// stock browser
		if( navigator.userAgent.match( /android/gi ) ) {
			pointerEvents = [ 'touchstart' ];
		}

		pointerEvents.forEach( function( eventName ) {
			dom.controlsLeft.forEach( function( el ) { el.addEventListener( eventName, onNavigateLeftClicked, false ); } );
			dom.controlsRight.forEach( function( el ) { el.addEventListener( eventName, onNavigateRightClicked, false ); } );
			dom.controlsUp.forEach( function( el ) { el.addEventListener( eventName, onNavigateUpClicked, false ); } );
			dom.controlsDown.forEach( function( el ) { el.addEventListener( eventName, onNavigateDownClicked, false ); } );
			dom.controlsPrev.forEach( function( el ) { el.addEventListener( eventName, onNavigatePrevClicked, false ); } );
			dom.controlsNext.forEach( function( el ) { el.addEventListener( eventName, onNavigateNextClicked, false ); } );
		} );

	}

	/**
	 * Unbinds all event listeners.
	 */
	function removeEventListeners() {

		eventsAreBound = false;

		document.removeEventListener( 'keydown', onDocumentKeyDown, false );
		document.removeEventListener( 'keypress', onDocumentKeyPress, false );
		window.removeEventListener( 'hashchange', onWindowHashChange, false );
		window.removeEventListener( 'resize', onWindowResize, false );

		dom.wrapper.removeEventListener( 'touchstart', onTouchStart, false );
		dom.wrapper.removeEventListener( 'touchmove', onTouchMove, false );
		dom.wrapper.removeEventListener( 'touchend', onTouchEnd, false );

		// IE11
		if( window.navigator.pointerEnabled ) {
			dom.wrapper.removeEventListener( 'pointerdown', onPointerDown, false );
			dom.wrapper.removeEventListener( 'pointermove', onPointerMove, false );
			dom.wrapper.removeEventListener( 'pointerup', onPointerUp, false );
		}
		// IE10
		else if( window.navigator.msPointerEnabled ) {
			dom.wrapper.removeEventListener( 'MSPointerDown', onPointerDown, false );
			dom.wrapper.removeEventListener( 'MSPointerMove', onPointerMove, false );
			dom.wrapper.removeEventListener( 'MSPointerUp', onPointerUp, false );
		}

		if ( config.progress && dom.progress ) {
			dom.progress.removeEventListener( 'click', onProgressClicked, false );
		}

		[ 'touchstart', 'click' ].forEach( function( eventName ) {
			dom.controlsLeft.forEach( function( el ) { el.removeEventListener( eventName, onNavigateLeftClicked, false ); } );
			dom.controlsRight.forEach( function( el ) { el.removeEventListener( eventName, onNavigateRightClicked, false ); } );
			dom.controlsUp.forEach( function( el ) { el.removeEventListener( eventName, onNavigateUpClicked, false ); } );
			dom.controlsDown.forEach( function( el ) { el.removeEventListener( eventName, onNavigateDownClicked, false ); } );
			dom.controlsPrev.forEach( function( el ) { el.removeEventListener( eventName, onNavigatePrevClicked, false ); } );
			dom.controlsNext.forEach( function( el ) { el.removeEventListener( eventName, onNavigateNextClicked, false ); } );
		} );

	}

	/**
	 * Extend object a with the properties of object b.
	 * If there's a conflict, object b takes precedence.
	 */
	function extend( a, b ) {

		for( var i in b ) {
			a[ i ] = b[ i ];
		}

	}

	/**
	 * Converts the target object to an array.
	 */
	function toArray( o ) {

		return Array.prototype.slice.call( o );

	}

	/**
	 * Utility for deserializing a value.
	 */
	function deserialize( value ) {

		if( typeof value === 'string' ) {
			if( value === 'null' ) return null;
			else if( value === 'true' ) return true;
			else if( value === 'false' ) return false;
			else if( value.match( /^\d+$/ ) ) return parseFloat( value );
		}

		return value;

	}

	/**
	 * Measures the distance in pixels between point a
	 * and point b.
	 *
	 * @param {Object} a point with x/y properties
	 * @param {Object} b point with x/y properties
	 */
	function distanceBetween( a, b ) {

		var dx = a.x - b.x,
			dy = a.y - b.y;

		return Math.sqrt( dx*dx + dy*dy );

	}

	/**
	 * Applies a CSS transform to the target element.
	 */
	function transformElement( element, transform ) {

		element.style.WebkitTransform = transform;
		element.style.MozTransform = transform;
		element.style.msTransform = transform;
		element.style.OTransform = transform;
		element.style.transform = transform;

	}

	/**
	 * Injects the given CSS styles into the DOM.
	 */
	function injectStyleSheet( value ) {

		var tag = document.createElement( 'style' );
		tag.type = 'text/css';
		if( tag.styleSheet ) {
			tag.styleSheet.cssText = value;
		}
		else {
			tag.appendChild( document.createTextNode( value ) );
		}
		document.getElementsByTagName( 'head' )[0].appendChild( tag );

	}

	/**
	 * Measures the distance in pixels between point a and point b.
	 *
	 * @param {String} color The string representation of a color,
	 * the following formats are supported:
	 * - #000
	 * - #000000
	 * - rgb(0,0,0)
	 */
	function colorToRgb( color ) {

		var hex3 = color.match( /^#([0-9a-f]{3})$/i );
		if( hex3 && hex3[1] ) {
			hex3 = hex3[1];
			return {
				r: parseInt( hex3.charAt( 0 ), 16 ) * 0x11,
				g: parseInt( hex3.charAt( 1 ), 16 ) * 0x11,
				b: parseInt( hex3.charAt( 2 ), 16 ) * 0x11
			};
		}

		var hex6 = color.match( /^#([0-9a-f]{6})$/i );
		if( hex6 && hex6[1] ) {
			hex6 = hex6[1];
			return {
				r: parseInt( hex6.substr( 0, 2 ), 16 ),
				g: parseInt( hex6.substr( 2, 2 ), 16 ),
				b: parseInt( hex6.substr( 4, 2 ), 16 )
			};
		}

		var rgb = color.match( /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i );
		if( rgb ) {
			return {
				r: parseInt( rgb[1], 10 ),
				g: parseInt( rgb[2], 10 ),
				b: parseInt( rgb[3], 10 )
			};
		}

		var rgba = color.match( /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\,\s*([\d]+|[\d]*.[\d]+)\s*\)$/i );
		if( rgba ) {
			return {
				r: parseInt( rgba[1], 10 ),
				g: parseInt( rgba[2], 10 ),
				b: parseInt( rgba[3], 10 ),
				a: parseFloat( rgba[4] )
			};
		}

		return null;

	}

	/**
	 * Calculates brightness on a scale of 0-255.
	 *
	 * @param color See colorStringToRgb for supported formats.
	 */
	function colorBrightness( color ) {

		if( typeof color === 'string' ) color = colorToRgb( color );

		if( color ) {
			return ( color.r * 299 + color.g * 587 + color.b * 114 ) / 1000;
		}

		return null;

	}

	/**
	 * Retrieves the height of the given element by looking
	 * at the position and height of its immediate children.
	 */
	function getAbsoluteHeight( element ) {

		var height = 0;

		if( element ) {
			var absoluteChildren = 0;

			toArray( element.childNodes ).forEach( function( child ) {

				if( typeof child.offsetTop === 'number' && child.style ) {
					// Count # of abs children
					if( window.getComputedStyle( child ).position === 'absolute' ) {
						absoluteChildren += 1;
					}

					height = Math.max( height, child.offsetTop + child.offsetHeight );
				}

			} );

			// If there are no absolute children, use offsetHeight
			if( absoluteChildren === 0 ) {
				height = element.offsetHeight;
			}

		}

		return height;

	}

	/**
	 * Returns the remaining height within the parent of the
	 * target element.
	 *
	 * remaining height = [ configured parent height ] - [ current parent height ]
	 */
	function getRemainingHeight( element, height ) {

		height = height || 0;

		if( element ) {
			var newHeight, oldHeight = element.style.height;

			// Change the .stretch element height to 0 in order find the height of all
			// the other elements
			element.style.height = '0px';
			newHeight = height - element.parentNode.offsetHeight;

			// Restore the old height, just in case
			element.style.height = oldHeight + 'px';

			return newHeight;
		}

		return height;

	}

	/**
	 * Checks if this instance is being used to print a PDF.
	 */
	function isPrintingPDF() {

		return ( /print-pdf/gi ).test( window.location.search );

	}

	/**
	 * Hides the address bar if we're on a mobile device.
	 */
	function hideAddressBar() {

		if( config.hideAddressBar && isMobileDevice ) {
			// Events that should trigger the address bar to hide
			window.addEventListener( 'load', removeAddressBar, false );
			window.addEventListener( 'orientationchange', removeAddressBar, false );
		}

	}

	/**
	 * Causes the address bar to hide on mobile devices,
	 * more vertical space ftw.
	 */
	function removeAddressBar() {

		setTimeout( function() {
			window.scrollTo( 0, 1 );
		}, 10 );

	}

	/**
	 * Dispatches an event of the specified type from the
	 * reveal DOM element.
	 */
	function dispatchEvent( type, args ) {

		var event = document.createEvent( 'HTMLEvents', 1, 2 );
		event.initEvent( type, true, true );
		extend( event, args );
		dom.wrapper.dispatchEvent( event );

		// If we're in an iframe, post each reveal.js event to the
		// parent window. Used by the notes plugin
		if( config.postMessageEvents && window.parent !== window.self ) {
			window.parent.postMessage( JSON.stringify({ namespace: 'reveal', eventName: type, state: getState() }), '*' );
		}

	}

	/**
	 * Wrap all links in 3D goodness.
	 */
	function enableRollingLinks() {

		if( features.transforms3d && !( 'msPerspective' in document.body.style ) ) {
			var anchors = dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ' a' );

			for( var i = 0, len = anchors.length; i < len; i++ ) {
				var anchor = anchors[i];

				if( anchor.textContent && !anchor.querySelector( '*' ) && ( !anchor.className || !anchor.classList.contains( anchor, 'roll' ) ) ) {
					var span = document.createElement('span');
					span.setAttribute('data-title', anchor.text);
					span.innerHTML = anchor.innerHTML;

					anchor.classList.add( 'roll' );
					anchor.innerHTML = '';
					anchor.appendChild(span);
				}
			}
		}

	}

	/**
	 * Unwrap all 3D links.
	 */
	function disableRollingLinks() {

		var anchors = dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ' a.roll' );

		for( var i = 0, len = anchors.length; i < len; i++ ) {
			var anchor = anchors[i];
			var span = anchor.querySelector( 'span' );

			if( span ) {
				anchor.classList.remove( 'roll' );
				anchor.innerHTML = span.innerHTML;
			}
		}

	}

	/**
	 * Bind preview frame links.
	 */
	function enablePreviewLinks( selector ) {

		var anchors = toArray( document.querySelectorAll( selector ? selector : 'a' ) );

		anchors.forEach( function( element ) {
			if( /^(http|www)/gi.test( element.getAttribute( 'href' ) ) ) {
				element.addEventListener( 'click', onPreviewLinkClicked, false );
			}
		} );

	}

	/**
	 * Unbind preview frame links.
	 */
	function disablePreviewLinks() {

		var anchors = toArray( document.querySelectorAll( 'a' ) );

		anchors.forEach( function( element ) {
			if( /^(http|www)/gi.test( element.getAttribute( 'href' ) ) ) {
				element.removeEventListener( 'click', onPreviewLinkClicked, false );
			}
		} );

	}

	/**
	 * Opens a preview window for the target URL.
	 */
	function showPreview( url ) {

		closeOverlay();

		dom.overlay = document.createElement( 'div' );
		dom.overlay.classList.add( 'overlay' );
		dom.overlay.classList.add( 'overlay-preview' );
		dom.wrapper.appendChild( dom.overlay );

		dom.overlay.innerHTML = [
			'<header>',
				'<a class="close" href="#"><span class="icon"></span></a>',
				'<a class="external" href="'+ url +'" target="_blank"><span class="icon"></span></a>',
			'</header>',
			'<div class="spinner"></div>',
			'<div class="viewport">',
				'<iframe src="'+ url +'"></iframe>',
			'</div>'
		].join('');

		dom.overlay.querySelector( 'iframe' ).addEventListener( 'load', function( event ) {
			dom.overlay.classList.add( 'loaded' );
		}, false );

		dom.overlay.querySelector( '.close' ).addEventListener( 'click', function( event ) {
			closeOverlay();
			event.preventDefault();
		}, false );

		dom.overlay.querySelector( '.external' ).addEventListener( 'click', function( event ) {
			closeOverlay();
		}, false );

		setTimeout( function() {
			dom.overlay.classList.add( 'visible' );
		}, 1 );

	}

	/**
	 * Opens a overlay window with help material.
	 */
	function showHelp() {

		if( config.help ) {

			closeOverlay();

			dom.overlay = document.createElement( 'div' );
			dom.overlay.classList.add( 'overlay' );
			dom.overlay.classList.add( 'overlay-help' );
			dom.wrapper.appendChild( dom.overlay );

			var html = '<p class="title">Keyboard Shortcuts</p><br/>';

			html += '<table><th>KEY</th><th>ACTION</th>';
			for( var key in keyboardShortcuts ) {
				html += '<tr><td>' + key + '</td><td>' + keyboardShortcuts[ key ] + '</td></tr>';
			}

			html += '</table>';

			dom.overlay.innerHTML = [
				'<header>',
					'<a class="close" href="#"><span class="icon"></span></a>',
				'</header>',
				'<div class="viewport">',
					'<div class="viewport-inner">'+ html +'</div>',
				'</div>'
			].join('');

			dom.overlay.querySelector( '.close' ).addEventListener( 'click', function( event ) {
				closeOverlay();
				event.preventDefault();
			}, false );

			setTimeout( function() {
				dom.overlay.classList.add( 'visible' );
			}, 1 );

		}

	}

	/**
	 * Closes any currently open overlay.
	 */
	function closeOverlay() {

		if( dom.overlay ) {
			dom.overlay.parentNode.removeChild( dom.overlay );
			dom.overlay = null;
		}

	}

	/**
	 * Applies JavaScript-controlled layout rules to the
	 * presentation.
	 */
	function layout() {

		if( dom.wrapper && !isPrintingPDF() ) {

			var size = getComputedSlideSize();

			var slidePadding = 20; // TODO Dig this out of DOM

			// Layout the contents of the slides
			layoutSlideContents( config.width, config.height, slidePadding );

			dom.slides.style.width = size.width + 'px';
			dom.slides.style.height = size.height + 'px';

			// Determine scale of content to fit within available space
			scale = Math.min( size.presentationWidth / size.width, size.presentationHeight / size.height );

			// Respect max/min scale settings
			scale = Math.max( scale, config.minScale );
			scale = Math.min( scale, config.maxScale );

			// Don't apply any scaling styles if scale is 1
			if( scale === 1 ) {
				dom.slides.style.zoom = '';
				dom.slides.style.left = '';
				dom.slides.style.top = '';
				dom.slides.style.bottom = '';
				dom.slides.style.right = '';
				transformElement( dom.slides, '' );
			}
			else {
				// Prefer zooming in desktop Chrome so that content remains crisp
				if( !isMobileDevice && /chrome/i.test( navigator.userAgent ) && typeof dom.slides.style.zoom !== 'undefined' ) {
					dom.slides.style.zoom = scale;
				}
				// Apply scale transform as a fallback
				else {
					dom.slides.style.left = '50%';
					dom.slides.style.top = '50%';
					dom.slides.style.bottom = 'auto';
					dom.slides.style.right = 'auto';
					transformElement( dom.slides, 'translate(-50%, -50%) scale('+ scale +')' );
				}
			}

			// Select all slides, vertical and horizontal
			var slides = toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) );

			for( var i = 0, len = slides.length; i < len; i++ ) {
				var slide = slides[ i ];

				// Don't bother updating invisible slides
				if( slide.style.display === 'none' ) {
					continue;
				}

				if( config.center || slide.classList.contains( 'center' ) ) {
					// Vertical stacks are not centred since their section
					// children will be
					if( slide.classList.contains( 'stack' ) ) {
						slide.style.top = 0;
					}
					else {
						slide.style.top = Math.max( ( ( size.height - getAbsoluteHeight( slide ) ) / 2 ) - slidePadding, 0 ) + 'px';
					}
				}
				else {
					slide.style.top = '';
				}

			}

			updateProgress();
			updateParallax();

		}

	}

	/**
	 * Applies layout logic to the contents of all slides in
	 * the presentation.
	 */
	function layoutSlideContents( width, height, padding ) {

		// Handle sizing of elements with the 'stretch' class
		toArray( dom.slides.querySelectorAll( 'section > .stretch' ) ).forEach( function( element ) {

			// Determine how much vertical space we can use
			var remainingHeight = getRemainingHeight( element, height );

			// Consider the aspect ratio of media elements
			if( /(img|video)/gi.test( element.nodeName ) ) {
				var nw = element.naturalWidth || element.videoWidth,
					nh = element.naturalHeight || element.videoHeight;

				var es = Math.min( width / nw, remainingHeight / nh );

				element.style.width = ( nw * es ) + 'px';
				element.style.height = ( nh * es ) + 'px';

			}
			else {
				element.style.width = width + 'px';
				element.style.height = remainingHeight + 'px';
			}

		} );

	}

	/**
	 * Calculates the computed pixel size of our slides. These
	 * values are based on the width and height configuration
	 * options.
	 */
	function getComputedSlideSize( presentationWidth, presentationHeight ) {

		var size = {
			// Slide size
			width: config.width,
			height: config.height,

			// Presentation size
			presentationWidth: presentationWidth || dom.wrapper.offsetWidth,
			presentationHeight: presentationHeight || dom.wrapper.offsetHeight
		};

		// Reduce available space by margin
		size.presentationWidth -= ( size.presentationHeight * config.margin );
		size.presentationHeight -= ( size.presentationHeight * config.margin );

		// Slide width may be a percentage of available width
		if( typeof size.width === 'string' && /%$/.test( size.width ) ) {
			size.width = parseInt( size.width, 10 ) / 100 * size.presentationWidth;
		}

		// Slide height may be a percentage of available height
		if( typeof size.height === 'string' && /%$/.test( size.height ) ) {
			size.height = parseInt( size.height, 10 ) / 100 * size.presentationHeight;
		}

		return size;

	}

	/**
	 * Stores the vertical index of a stack so that the same
	 * vertical slide can be selected when navigating to and
	 * from the stack.
	 *
	 * @param {HTMLElement} stack The vertical stack element
	 * @param {int} v Index to memorize
	 */
	function setPreviousVerticalIndex( stack, v ) {

		if( typeof stack === 'object' && typeof stack.setAttribute === 'function' ) {
			stack.setAttribute( 'data-previous-indexv', v || 0 );
		}

	}

	/**
	 * Retrieves the vertical index which was stored using
	 * #setPreviousVerticalIndex() or 0 if no previous index
	 * exists.
	 *
	 * @param {HTMLElement} stack The vertical stack element
	 */
	function getPreviousVerticalIndex( stack ) {

		if( typeof stack === 'object' && typeof stack.setAttribute === 'function' && stack.classList.contains( 'stack' ) ) {
			// Prefer manually defined start-indexv
			var attributeName = stack.hasAttribute( 'data-start-indexv' ) ? 'data-start-indexv' : 'data-previous-indexv';

			return parseInt( stack.getAttribute( attributeName ) || 0, 10 );
		}

		return 0;

	}

	/**
	 * Displays the overview of slides (quick nav) by
	 * scaling down and arranging all slide elements.
	 *
	 * Experimental feature, might be dropped if perf
	 * can't be improved.
	 */
	function activateOverview() {

		// Only proceed if enabled in config
		if( config.overview ) {

			// Don't auto-slide while in overview mode
			cancelAutoSlide();

			var wasActive = dom.wrapper.classList.contains( 'overview' );

			// Vary the depth of the overview based on screen size
			var depth = window.innerWidth < 400 ? 1000 : 2500;

			dom.wrapper.classList.add( 'overview' );
			dom.wrapper.classList.remove( 'overview-deactivating' );

			var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR );

			for( var i = 0, len1 = horizontalSlides.length; i < len1; i++ ) {
				var hslide = horizontalSlides[i],
					hoffset = config.rtl ? -105 : 105;

				hslide.setAttribute( 'data-index-h', i );

				// Apply CSS transform
				transformElement( hslide, 'translateZ(-'+ depth +'px) translate(' + ( ( i - indexh ) * hoffset ) + '%, 0%)' );

				if( hslide.classList.contains( 'stack' ) ) {

					var verticalSlides = hslide.querySelectorAll( 'section' );

					for( var j = 0, len2 = verticalSlides.length; j < len2; j++ ) {
						var verticalIndex = i === indexh ? indexv : getPreviousVerticalIndex( hslide );

						var vslide = verticalSlides[j];

						vslide.setAttribute( 'data-index-h', i );
						vslide.setAttribute( 'data-index-v', j );

						// Apply CSS transform
						transformElement( vslide, 'translate(0%, ' + ( ( j - verticalIndex ) * 105 ) + '%)' );

						// Navigate to this slide on click
						vslide.addEventListener( 'click', onOverviewSlideClicked, true );
					}

				}
				else {

					// Navigate to this slide on click
					hslide.addEventListener( 'click', onOverviewSlideClicked, true );

				}
			}

			updateSlidesVisibility();

			layout();

			if( !wasActive ) {
				// Notify observers of the overview showing
				dispatchEvent( 'overviewshown', {
					'indexh': indexh,
					'indexv': indexv,
					'currentSlide': currentSlide
				} );
			}

		}

	}

	/**
	 * Exits the slide overview and enters the currently
	 * active slide.
	 */
	function deactivateOverview() {

		// Only proceed if enabled in config
		if( config.overview ) {

			dom.wrapper.classList.remove( 'overview' );

			// Temporarily add a class so that transitions can do different things
			// depending on whether they are exiting/entering overview, or just
			// moving from slide to slide
			dom.wrapper.classList.add( 'overview-deactivating' );

			setTimeout( function () {
				dom.wrapper.classList.remove( 'overview-deactivating' );
			}, 1 );

			// Select all slides
			toArray( dom.wrapper.querySelectorAll( SLIDES_SELECTOR ) ).forEach( function( slide ) {
				// Resets all transforms to use the external styles
				transformElement( slide, '' );

				slide.removeEventListener( 'click', onOverviewSlideClicked, true );
			} );

			slide( indexh, indexv );

			cueAutoSlide();

			// Notify observers of the overview hiding
			dispatchEvent( 'overviewhidden', {
				'indexh': indexh,
				'indexv': indexv,
				'currentSlide': currentSlide
			} );

		}
	}

	/**
	 * Toggles the slide overview mode on and off.
	 *
	 * @param {Boolean} override Optional flag which overrides the
	 * toggle logic and forcibly sets the desired state. True means
	 * overview is open, false means it's closed.
	 */
	function toggleOverview( override ) {

		if( typeof override === 'boolean' ) {
			override ? activateOverview() : deactivateOverview();
		}
		else {
			isOverview() ? deactivateOverview() : activateOverview();
		}

	}

	/**
	 * Checks if the overview is currently active.
	 *
	 * @return {Boolean} true if the overview is active,
	 * false otherwise
	 */
	function isOverview() {

		return dom.wrapper.classList.contains( 'overview' );

	}

	/**
	 * Checks if the current or specified slide is vertical
	 * (nested within another slide).
	 *
	 * @param {HTMLElement} slide [optional] The slide to check
	 * orientation of
	 */
	function isVerticalSlide( slide ) {

		// Prefer slide argument, otherwise use current slide
		slide = slide ? slide : currentSlide;

		return slide && slide.parentNode && !!slide.parentNode.nodeName.match( /section/i );

	}

	/**
	 * Handling the fullscreen functionality via the fullscreen API
	 *
	 * @see http://fullscreen.spec.whatwg.org/
	 * @see https://developer.mozilla.org/en-US/docs/DOM/Using_fullscreen_mode
	 */
	function enterFullscreen() {

		var element = document.body;

		// Check which implementation is available
		var requestMethod = element.requestFullScreen ||
							element.webkitRequestFullscreen ||
							element.webkitRequestFullScreen ||
							element.mozRequestFullScreen ||
							element.msRequestFullscreen;

		if( requestMethod ) {
			requestMethod.apply( element );
		}

	}

	/**
	 * Enters the paused mode which fades everything on screen to
	 * black.
	 */
	function pause() {

		if( config.pause ) {
			var wasPaused = dom.wrapper.classList.contains( 'paused' );

			cancelAutoSlide();
			dom.wrapper.classList.add( 'paused' );

			if( wasPaused === false ) {
				dispatchEvent( 'paused' );
			}
		}

	}

	/**
	 * Exits from the paused mode.
	 */
	function resume() {

		var wasPaused = dom.wrapper.classList.contains( 'paused' );
		dom.wrapper.classList.remove( 'paused' );

		cueAutoSlide();

		if( wasPaused ) {
			dispatchEvent( 'resumed' );
		}

	}

	/**
	 * Toggles the paused mode on and off.
	 */
	function togglePause( override ) {

		if( typeof override === 'boolean' ) {
			override ? pause() : resume();
		}
		else {
			isPaused() ? resume() : pause();
		}

	}

	/**
	 * Checks if we are currently in the paused mode.
	 */
	function isPaused() {

		return dom.wrapper.classList.contains( 'paused' );

	}

	/**
	 * Toggles the auto slide mode on and off.
	 *
	 * @param {Boolean} override Optional flag which sets the desired state.
	 * True means autoplay starts, false means it stops.
	 */

	function toggleAutoSlide( override ) {

		if( typeof override === 'boolean' ) {
			override ? resumeAutoSlide() : pauseAutoSlide();
		}

		else {
			autoSlidePaused ? resumeAutoSlide() : pauseAutoSlide();
		}

	}

	/**
	 * Checks if the auto slide mode is currently on.
	 */
	function isAutoSliding() {

		return !!( autoSlide && !autoSlidePaused );

	}

	/**
	 * Steps from the current point in the presentation to the
	 * slide which matches the specified horizontal and vertical
	 * indices.
	 *
	 * @param {int} h Horizontal index of the target slide
	 * @param {int} v Vertical index of the target slide
	 * @param {int} f Optional index of a fragment within the
	 * target slide to activate
	 * @param {int} o Optional origin for use in multimaster environments
	 */
	function slide( h, v, f, o ) {

		// Remember where we were at before
		previousSlide = currentSlide;

		// Query all horizontal slides in the deck
		var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR );

		// If no vertical index is specified and the upcoming slide is a
		// stack, resume at its previous vertical index
		if( v === undefined ) {
			v = getPreviousVerticalIndex( horizontalSlides[ h ] );
		}

		// If we were on a vertical stack, remember what vertical index
		// it was on so we can resume at the same position when returning
		if( previousSlide && previousSlide.parentNode && previousSlide.parentNode.classList.contains( 'stack' ) ) {
			setPreviousVerticalIndex( previousSlide.parentNode, indexv );
		}

		// Remember the state before this slide
		var stateBefore = state.concat();

		// Reset the state array
		state.length = 0;

		var indexhBefore = indexh || 0,
			indexvBefore = indexv || 0;

		// Activate and transition to the new slide
		indexh = updateSlides( HORIZONTAL_SLIDES_SELECTOR, h === undefined ? indexh : h );
		indexv = updateSlides( VERTICAL_SLIDES_SELECTOR, v === undefined ? indexv : v );

		// Update the visibility of slides now that the indices have changed
		updateSlidesVisibility();

		layout();

		// Apply the new state
		stateLoop: for( var i = 0, len = state.length; i < len; i++ ) {
			// Check if this state existed on the previous slide. If it
			// did, we will avoid adding it repeatedly
			for( var j = 0; j < stateBefore.length; j++ ) {
				if( stateBefore[j] === state[i] ) {
					stateBefore.splice( j, 1 );
					continue stateLoop;
				}
			}

			document.documentElement.classList.add( state[i] );

			// Dispatch custom event matching the state's name
			dispatchEvent( state[i] );
		}

		// Clean up the remains of the previous state
		while( stateBefore.length ) {
			document.documentElement.classList.remove( stateBefore.pop() );
		}

		// If the overview is active, re-activate it to update positions
		if( isOverview() ) {
			activateOverview();
		}

		// Find the current horizontal slide and any possible vertical slides
		// within it
		var currentHorizontalSlide = horizontalSlides[ indexh ],
			currentVerticalSlides = currentHorizontalSlide.querySelectorAll( 'section' );

		// Store references to the previous and current slides
		currentSlide = currentVerticalSlides[ indexv ] || currentHorizontalSlide;

		// Show fragment, if specified
		if( typeof f !== 'undefined' ) {
			navigateFragment( f );
		}

		// Dispatch an event if the slide changed
		var slideChanged = ( indexh !== indexhBefore || indexv !== indexvBefore );
		if( slideChanged ) {
			dispatchEvent( 'slidechanged', {
				'indexh': indexh,
				'indexv': indexv,
				'previousSlide': previousSlide,
				'currentSlide': currentSlide,
				'origin': o
			} );
		}
		else {
			// Ensure that the previous slide is never the same as the current
			previousSlide = null;
		}

		// Solves an edge case where the previous slide maintains the
		// 'present' class when navigating between adjacent vertical
		// stacks
		if( previousSlide ) {
			previousSlide.classList.remove( 'present' );
			previousSlide.setAttribute( 'aria-hidden', 'true' );

			// Reset all slides upon navigate to home
			// Issue: #285
			if ( dom.wrapper.querySelector( HOME_SLIDE_SELECTOR ).classList.contains( 'present' ) ) {
				// Launch async task
				setTimeout( function () {
					var slides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.stack') ), i;
					for( i in slides ) {
						if( slides[i] ) {
							// Reset stack
							setPreviousVerticalIndex( slides[i], 0 );
						}
					}
				}, 0 );
			}
		}

		// Handle embedded content
		if( slideChanged || !previousSlide ) {
			stopEmbeddedContent( previousSlide );
			startEmbeddedContent( currentSlide );
		}

		// Announce the current slide contents, for screen readers
		dom.statusDiv.textContent = currentSlide.textContent;

		updateControls();
		updateProgress();
		updateBackground();
		updateParallax();
		updateSlideNumber();

		// Update the URL hash
		writeURL();

		cueAutoSlide();

	}

	/**
	 * Syncs the presentation with the current DOM. Useful
	 * when new slides or control elements are added or when
	 * the configuration has changed.
	 */
	function sync() {

		// Subscribe to input
		removeEventListeners();
		addEventListeners();

		// Force a layout to make sure the current config is accounted for
		layout();

		// Reflect the current autoSlide value
		autoSlide = config.autoSlide;

		// Start auto-sliding if it's enabled
		cueAutoSlide();

		// Re-create the slide backgrounds
		createBackgrounds();

		// Write the current hash to the URL
		writeURL();

		sortAllFragments();

		updateControls();
		updateProgress();
		updateBackground( true );
		updateSlideNumber();
		updateSlidesVisibility();

		formatEmbeddedContent();

	}

	/**
	 * Resets all vertical slides so that only the first
	 * is visible.
	 */
	function resetVerticalSlides() {

		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );
		horizontalSlides.forEach( function( horizontalSlide ) {

			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );
			verticalSlides.forEach( function( verticalSlide, y ) {

				if( y > 0 ) {
					verticalSlide.classList.remove( 'present' );
					verticalSlide.classList.remove( 'past' );
					verticalSlide.classList.add( 'future' );
					verticalSlide.setAttribute( 'aria-hidden', 'true' );
				}

			} );

		} );

	}

	/**
	 * Sorts and formats all of fragments in the
	 * presentation.
	 */
	function sortAllFragments() {

		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );
		horizontalSlides.forEach( function( horizontalSlide ) {

			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );
			verticalSlides.forEach( function( verticalSlide, y ) {

				sortFragments( verticalSlide.querySelectorAll( '.fragment' ) );

			} );

			if( verticalSlides.length === 0 ) sortFragments( horizontalSlide.querySelectorAll( '.fragment' ) );

		} );

	}

	/**
	 * Updates one dimension of slides by showing the slide
	 * with the specified index.
	 *
	 * @param {String} selector A CSS selector that will fetch
	 * the group of slides we are working with
	 * @param {Number} index The index of the slide that should be
	 * shown
	 *
	 * @return {Number} The index of the slide that is now shown,
	 * might differ from the passed in index if it was out of
	 * bounds.
	 */
	function updateSlides( selector, index ) {

		// Select all slides and convert the NodeList result to
		// an array
		var slides = toArray( dom.wrapper.querySelectorAll( selector ) ),
			slidesLength = slides.length;

		var printMode = isPrintingPDF();

		if( slidesLength ) {

			// Should the index loop?
			if( config.loop ) {
				index %= slidesLength;

				if( index < 0 ) {
					index = slidesLength + index;
				}
			}

			// Enforce max and minimum index bounds
			index = Math.max( Math.min( index, slidesLength - 1 ), 0 );

			for( var i = 0; i < slidesLength; i++ ) {
				var element = slides[i];

				var reverse = config.rtl && !isVerticalSlide( element );

				element.classList.remove( 'past' );
				element.classList.remove( 'present' );
				element.classList.remove( 'future' );

				// http://www.w3.org/html/wg/drafts/html/master/editing.html#the-hidden-attribute
				element.setAttribute( 'hidden', '' );
				element.setAttribute( 'aria-hidden', 'true' );

				// If this element contains vertical slides
				if( element.querySelector( 'section' ) ) {
					element.classList.add( 'stack' );
				}

				// If we're printing static slides, all slides are "present"
				if( printMode ) {
					element.classList.add( 'present' );
					continue;
				}

				if( i < index ) {
					// Any element previous to index is given the 'past' class
					element.classList.add( reverse ? 'future' : 'past' );

					if( config.fragments ) {
						var pastFragments = toArray( element.querySelectorAll( '.fragment' ) );

						// Show all fragments on prior slides
						while( pastFragments.length ) {
							var pastFragment = pastFragments.pop();
							pastFragment.classList.add( 'visible' );
							pastFragment.classList.remove( 'current-fragment' );
						}
					}
				}
				else if( i > index ) {
					// Any element subsequent to index is given the 'future' class
					element.classList.add( reverse ? 'past' : 'future' );

					if( config.fragments ) {
						var futureFragments = toArray( element.querySelectorAll( '.fragment.visible' ) );

						// No fragments in future slides should be visible ahead of time
						while( futureFragments.length ) {
							var futureFragment = futureFragments.pop();
							futureFragment.classList.remove( 'visible' );
							futureFragment.classList.remove( 'current-fragment' );
						}
					}
				}
			}

			// Mark the current slide as present
			slides[index].classList.add( 'present' );
			slides[index].removeAttribute( 'hidden' );
			slides[index].removeAttribute( 'aria-hidden' );

			// If this slide has a state associated with it, add it
			// onto the current state of the deck
			var slideState = slides[index].getAttribute( 'data-state' );
			if( slideState ) {
				state = state.concat( slideState.split( ' ' ) );
			}

		}
		else {
			// Since there are no slides we can't be anywhere beyond the
			// zeroth index
			index = 0;
		}

		return index;

	}

	/**
	 * Optimization method; hide all slides that are far away
	 * from the present slide.
	 */
	function updateSlidesVisibility() {

		// Select all slides and convert the NodeList result to
		// an array
		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ),
			horizontalSlidesLength = horizontalSlides.length,
			distanceX,
			distanceY;

		if( horizontalSlidesLength && typeof indexh !== 'undefined' ) {

			// The number of steps away from the present slide that will
			// be visible
			var viewDistance = isOverview() ? 10 : config.viewDistance;

			// Limit view distance on weaker devices
			if( isMobileDevice ) {
				viewDistance = isOverview() ? 6 : 2;
			}

			// Limit view distance on weaker devices
			if( isPrintingPDF() ) {
				viewDistance = Number.MAX_VALUE;
			}

			for( var x = 0; x < horizontalSlidesLength; x++ ) {
				var horizontalSlide = horizontalSlides[x];

				var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) ),
					verticalSlidesLength = verticalSlides.length;

				// Loops so that it measures 1 between the first and last slides
				distanceX = Math.abs( ( ( indexh || 0 ) - x ) % ( horizontalSlidesLength - viewDistance ) ) || 0;

				// Show the horizontal slide if it's within the view distance
				if( distanceX < viewDistance ) {
					showSlide( horizontalSlide );
				}
				else {
					hideSlide( horizontalSlide );
				}

				if( verticalSlidesLength ) {

					var oy = getPreviousVerticalIndex( horizontalSlide );

					for( var y = 0; y < verticalSlidesLength; y++ ) {
						var verticalSlide = verticalSlides[y];

						distanceY = x === ( indexh || 0 ) ? Math.abs( ( indexv || 0 ) - y ) : Math.abs( y - oy );

						if( distanceX + distanceY < viewDistance ) {
							showSlide( verticalSlide );
						}
						else {
							hideSlide( verticalSlide );
						}
					}

				}
			}

		}

	}

	/**
	 * Updates the progress bar to reflect the current slide.
	 */
	function updateProgress() {

		// Update progress if enabled
		if( config.progress && dom.progressbar ) {

			dom.progressbar.style.width = getProgress() * dom.wrapper.offsetWidth + 'px';

		}

	}

	/**
	 * Updates the slide number div to reflect the current slide.
	 */
	function updateSlideNumber() {

		// Update slide number if enabled
		if( config.slideNumber && dom.slideNumber) {

			// Display the number of the page using 'indexh - indexv' format
			var indexString = indexh;
			if( indexv > 0 ) {
				indexString += ' - ' + indexv;
			}

			dom.slideNumber.innerHTML = indexString;
		}

	}

	/**
	 * Updates the state of all control/navigation arrows.
	 */
	function updateControls() {

		var routes = availableRoutes();
		var fragments = availableFragments();

		// Remove the 'enabled' class from all directions
		dom.controlsLeft.concat( dom.controlsRight )
						.concat( dom.controlsUp )
						.concat( dom.controlsDown )
						.concat( dom.controlsPrev )
						.concat( dom.controlsNext ).forEach( function( node ) {
			node.classList.remove( 'enabled' );
			node.classList.remove( 'fragmented' );
		} );

		// Add the 'enabled' class to the available routes
		if( routes.left ) dom.controlsLeft.forEach( function( el ) { el.classList.add( 'enabled' );	} );
		if( routes.right ) dom.controlsRight.forEach( function( el ) { el.classList.add( 'enabled' ); } );
		if( routes.up ) dom.controlsUp.forEach( function( el ) { el.classList.add( 'enabled' );	} );
		if( routes.down ) dom.controlsDown.forEach( function( el ) { el.classList.add( 'enabled' ); } );

		// Prev/next buttons
		if( routes.left || routes.up ) dom.controlsPrev.forEach( function( el ) { el.classList.add( 'enabled' ); } );
		if( routes.right || routes.down ) dom.controlsNext.forEach( function( el ) { el.classList.add( 'enabled' ); } );

		// Highlight fragment directions
		if( currentSlide ) {

			// Always apply fragment decorator to prev/next buttons
			if( fragments.prev ) dom.controlsPrev.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
			if( fragments.next ) dom.controlsNext.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );

			// Apply fragment decorators to directional buttons based on
			// what slide axis they are in
			if( isVerticalSlide( currentSlide ) ) {
				if( fragments.prev ) dom.controlsUp.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
				if( fragments.next ) dom.controlsDown.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
			}
			else {
				if( fragments.prev ) dom.controlsLeft.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
				if( fragments.next ) dom.controlsRight.forEach( function( el ) { el.classList.add( 'fragmented', 'enabled' ); } );
			}

		}

	}

	/**
	 * Updates the background elements to reflect the current
	 * slide.
	 *
	 * @param {Boolean} includeAll If true, the backgrounds of
	 * all vertical slides (not just the present) will be updated.
	 */
	function updateBackground( includeAll ) {

		var currentBackground = null;

		// Reverse past/future classes when in RTL mode
		var horizontalPast = config.rtl ? 'future' : 'past',
			horizontalFuture = config.rtl ? 'past' : 'future';

		// Update the classes of all backgrounds to match the
		// states of their slides (past/present/future)
		toArray( dom.background.childNodes ).forEach( function( backgroundh, h ) {

			backgroundh.classList.remove( 'past' );
			backgroundh.classList.remove( 'present' );
			backgroundh.classList.remove( 'future' );

			if( h < indexh ) {
				backgroundh.classList.add( horizontalPast );
			}
			else if ( h > indexh ) {
				backgroundh.classList.add( horizontalFuture );
			}
			else {
				backgroundh.classList.add( 'present' );

				// Store a reference to the current background element
				currentBackground = backgroundh;
			}

			if( includeAll || h === indexh ) {
				toArray( backgroundh.querySelectorAll( '.slide-background' ) ).forEach( function( backgroundv, v ) {

					backgroundv.classList.remove( 'past' );
					backgroundv.classList.remove( 'present' );
					backgroundv.classList.remove( 'future' );

					if( v < indexv ) {
						backgroundv.classList.add( 'past' );
					}
					else if ( v > indexv ) {
						backgroundv.classList.add( 'future' );
					}
					else {
						backgroundv.classList.add( 'present' );

						// Only if this is the present horizontal and vertical slide
						if( h === indexh ) currentBackground = backgroundv;
					}

				} );
			}

		} );

		// Stop any currently playing video background
		if( previousBackground ) {

			var previousVideo = previousBackground.querySelector( 'video' );
			if( previousVideo ) previousVideo.pause();

		}

		if( currentBackground ) {

			// Start video playback
			var currentVideo = currentBackground.querySelector( 'video' );
			if( currentVideo ) {
				currentVideo.currentTime = 0;
				currentVideo.play();
			}

			// Don't transition between identical backgrounds. This
			// prevents unwanted flicker.
			var previousBackgroundHash = previousBackground ? previousBackground.getAttribute( 'data-background-hash' ) : null;
			var currentBackgroundHash = currentBackground.getAttribute( 'data-background-hash' );
			if( currentBackgroundHash && currentBackgroundHash === previousBackgroundHash && currentBackground !== previousBackground ) {
				dom.background.classList.add( 'no-transition' );
			}

			previousBackground = currentBackground;

		}

		// If there's a background brightness flag for this slide,
		// bubble it to the .reveal container
		if( currentSlide ) {
			[ 'has-light-background', 'has-dark-background' ].forEach( function( classToBubble ) {
				if( currentSlide.classList.contains( classToBubble ) ) {
					dom.wrapper.classList.add( classToBubble );
				}
				else {
					dom.wrapper.classList.remove( classToBubble );
				}
			} );
		}

		// Allow the first background to apply without transition
		setTimeout( function() {
			dom.background.classList.remove( 'no-transition' );
		}, 1 );

	}

	/**
	 * Updates the position of the parallax background based
	 * on the current slide index.
	 */
	function updateParallax() {

		if( config.parallaxBackgroundImage ) {

			var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ),
				verticalSlides = dom.wrapper.querySelectorAll( VERTICAL_SLIDES_SELECTOR );

			var backgroundSize = dom.background.style.backgroundSize.split( ' ' ),
				backgroundWidth, backgroundHeight;

			if( backgroundSize.length === 1 ) {
				backgroundWidth = backgroundHeight = parseInt( backgroundSize[0], 10 );
			}
			else {
				backgroundWidth = parseInt( backgroundSize[0], 10 );
				backgroundHeight = parseInt( backgroundSize[1], 10 );
			}

			var slideWidth = dom.background.offsetWidth;
			var horizontalSlideCount = horizontalSlides.length;
			var horizontalOffset = -( backgroundWidth - slideWidth ) / ( horizontalSlideCount-1 ) * indexh;

			var slideHeight = dom.background.offsetHeight;
			var verticalSlideCount = verticalSlides.length;
			var verticalOffset = verticalSlideCount > 1 ? -( backgroundHeight - slideHeight ) / ( verticalSlideCount-1 ) * indexv : 0;

			dom.background.style.backgroundPosition = horizontalOffset + 'px ' + verticalOffset + 'px';

		}

	}

	/**
	 * Called when the given slide is within the configured view
	 * distance. Shows the slide element and loads any content
	 * that is set to load lazily (data-src).
	 */
	function showSlide( slide ) {

		// Show the slide element
		slide.style.display = 'block';

		// Media elements with data-src attributes
		toArray( slide.querySelectorAll( 'img[data-src], video[data-src], audio[data-src], iframe[data-src]' ) ).forEach( function( element ) {
			element.setAttribute( 'src', element.getAttribute( 'data-src' ) );
			element.removeAttribute( 'data-src' );
		} );

		// Media elements with <source> children
		toArray( slide.querySelectorAll( 'video, audio' ) ).forEach( function( media ) {
			var sources = 0;

			toArray( media.querySelectorAll( 'source[data-src]' ) ).forEach( function( source ) {
				source.setAttribute( 'src', source.getAttribute( 'data-src' ) );
				source.removeAttribute( 'data-src' );
				sources += 1;
			} );

			// If we rewrote sources for this video/audio element, we need
			// to manually tell it to load from its new origin
			if( sources > 0 ) {
				media.load();
			}
		} );


		// Show the corresponding background element
		var indices = getIndices( slide );
		var background = getSlideBackground( indices.h, indices.v );
		if( background ) {
			background.style.display = 'block';

			// If the background contains media, load it
			if( background.hasAttribute( 'data-loaded' ) === false ) {
				background.setAttribute( 'data-loaded', 'true' );

				var backgroundImage = slide.getAttribute( 'data-background-image' ),
					backgroundVideo = slide.getAttribute( 'data-background-video' ),
					backgroundIframe = slide.getAttribute( 'data-background-iframe' );

				// Images
				if( backgroundImage ) {
					background.style.backgroundImage = 'url('+ backgroundImage +')';
				}
				// Videos
				else if ( backgroundVideo && !isSpeakerNotes() ) {
					var video = document.createElement( 'video' );

					// Support comma separated lists of video sources
					backgroundVideo.split( ',' ).forEach( function( source ) {
						video.innerHTML += '<source src="'+ source +'">';
					} );

					background.appendChild( video );
				}
				// Iframes
				else if ( backgroundIframe ) {
					var iframe = document.createElement( 'iframe' );
						iframe.setAttribute( 'src', backgroundIframe );
						iframe.style.width  = '100%';
						iframe.style.height = '100%';
						iframe.style.maxHeight = '100%';
						iframe.style.maxWidth = '100%';

					background.appendChild( iframe );
				}
			}
		}

	}

	/**
	 * Called when the given slide is moved outside of the
	 * configured view distance.
	 */
	function hideSlide( slide ) {

		// Hide the slide element
		slide.style.display = 'none';

		// Hide the corresponding background element
		var indices = getIndices( slide );
		var background = getSlideBackground( indices.h, indices.v );
		if( background ) {
			background.style.display = 'none';
		}

	}

	/**
	 * Determine what available routes there are for navigation.
	 *
	 * @return {Object} containing four booleans: left/right/up/down
	 */
	function availableRoutes() {

		var horizontalSlides = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ),
			verticalSlides = dom.wrapper.querySelectorAll( VERTICAL_SLIDES_SELECTOR );

		var routes = {
			left: indexh > 0 || config.loop,
			right: indexh < horizontalSlides.length - 1 || config.loop,
			up: indexv > 0,
			down: indexv < verticalSlides.length - 1
		};

		// reverse horizontal controls for rtl
		if( config.rtl ) {
			var left = routes.left;
			routes.left = routes.right;
			routes.right = left;
		}

		return routes;

	}

	/**
	 * Returns an object describing the available fragment
	 * directions.
	 *
	 * @return {Object} two boolean properties: prev/next
	 */
	function availableFragments() {

		if( currentSlide && config.fragments ) {
			var fragments = currentSlide.querySelectorAll( '.fragment' );
			var hiddenFragments = currentSlide.querySelectorAll( '.fragment:not(.visible)' );

			return {
				prev: fragments.length - hiddenFragments.length > 0,
				next: !!hiddenFragments.length
			};
		}
		else {
			return { prev: false, next: false };
		}

	}

	/**
	 * Enforces origin-specific format rules for embedded media.
	 */
	function formatEmbeddedContent() {

		// YouTube frames must include "?enablejsapi=1"
		toArray( dom.slides.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
			var src = el.getAttribute( 'src' );
			if( !/enablejsapi\=1/gi.test( src ) ) {
				el.setAttribute( 'src', src + ( !/\?/.test( src ) ? '?' : '&' ) + 'enablejsapi=1' );
			}
		});

		// Vimeo frames must include "?api=1"
		toArray( dom.slides.querySelectorAll( 'iframe[src*="player.vimeo.com/"]' ) ).forEach( function( el ) {
			var src = el.getAttribute( 'src' );
			if( !/api\=1/gi.test( src ) ) {
				el.setAttribute( 'src', src + ( !/\?/.test( src ) ? '?' : '&' ) + 'api=1' );
			}
		});

	}

	/**
	 * Start playback of any embedded content inside of
	 * the targeted slide.
	 */
	function startEmbeddedContent( slide ) {

		if( slide && !isSpeakerNotes() ) {
			// HTML5 media elements
			toArray( slide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					el.play();
				}
			} );

			// iframe embeds
			toArray( slide.querySelectorAll( 'iframe' ) ).forEach( function( el ) {
				el.contentWindow.postMessage( 'slide:start', '*' );
			});

			// YouTube embeds
			toArray( slide.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					el.contentWindow.postMessage( '{"event":"command","func":"playVideo","args":""}', '*' );
				}
			});

			// Vimeo embeds
			toArray( slide.querySelectorAll( 'iframe[src*="player.vimeo.com/"]' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					el.contentWindow.postMessage( '{"method":"play"}', '*' );
				}
			});
		}

	}

	/**
	 * Stop playback of any embedded content inside of
	 * the targeted slide.
	 */
	function stopEmbeddedContent( slide ) {

		if( slide && slide.parentNode ) {
			// HTML5 media elements
			toArray( slide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) ) {
					el.pause();
				}
			} );

			// iframe embeds
			toArray( slide.querySelectorAll( 'iframe' ) ).forEach( function( el ) {
				el.contentWindow.postMessage( 'slide:stop', '*' );
			});

			// YouTube embeds
			toArray( slide.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) && typeof el.contentWindow.postMessage === 'function' ) {
					el.contentWindow.postMessage( '{"event":"command","func":"pauseVideo","args":""}', '*' );
				}
			});

			// Vimeo embeds
			toArray( slide.querySelectorAll( 'iframe[src*="player.vimeo.com/"]' ) ).forEach( function( el ) {
				if( !el.hasAttribute( 'data-ignore' ) && typeof el.contentWindow.postMessage === 'function' ) {
					el.contentWindow.postMessage( '{"method":"pause"}', '*' );
				}
			});
		}

	}

	/**
	 * Returns a value ranging from 0-1 that represents
	 * how far into the presentation we have navigated.
	 */
	function getProgress() {

		var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

		// The number of past and total slides
		var totalCount = getTotalSlides();
		var pastCount = 0;

		// Step through all slides and count the past ones
		mainLoop: for( var i = 0; i < horizontalSlides.length; i++ ) {

			var horizontalSlide = horizontalSlides[i];
			var verticalSlides = toArray( horizontalSlide.querySelectorAll( 'section' ) );

			for( var j = 0; j < verticalSlides.length; j++ ) {

				// Stop as soon as we arrive at the present
				if( verticalSlides[j].classList.contains( 'present' ) ) {
					break mainLoop;
				}

				pastCount++;

			}

			// Stop as soon as we arrive at the present
			if( horizontalSlide.classList.contains( 'present' ) ) {
				break;
			}

			// Don't count the wrapping section for vertical slides
			if( horizontalSlide.classList.contains( 'stack' ) === false ) {
				pastCount++;
			}

		}

		if( currentSlide ) {

			var allFragments = currentSlide.querySelectorAll( '.fragment' );

			// If there are fragments in the current slide those should be
			// accounted for in the progress.
			if( allFragments.length > 0 ) {
				var visibleFragments = currentSlide.querySelectorAll( '.fragment.visible' );

				// This value represents how big a portion of the slide progress
				// that is made up by its fragments (0-1)
				var fragmentWeight = 0.9;

				// Add fragment progress to the past slide count
				pastCount += ( visibleFragments.length / allFragments.length ) * fragmentWeight;
			}

		}

		return pastCount / ( totalCount - 1 );

	}

	/**
	 * Checks if this presentation is running inside of the
	 * speaker notes window.
	 */
	function isSpeakerNotes() {

		return !!window.location.search.match( /receiver/gi );

	}

	/**
	 * Reads the current URL (hash) and navigates accordingly.
	 */
	function readURL() {

		var hash = window.location.hash;

		// Attempt to parse the hash as either an index or name
		var bits = hash.slice( 2 ).split( '/' ),
			name = hash.replace( /#|\//gi, '' );

		// If the first bit is invalid and there is a name we can
		// assume that this is a named link
		if( isNaN( parseInt( bits[0], 10 ) ) && name.length ) {
			var element;

			// Ensure the named link is a valid HTML ID attribute
			if( /^[a-zA-Z][\w:.-]*$/.test( name ) ) {
				// Find the slide with the specified ID
				element = document.querySelector( '#' + name );
			}

			if( element ) {
				// Find the position of the named slide and navigate to it
				var indices = Reveal.getIndices( element );
				slide( indices.h, indices.v );
			}
			// If the slide doesn't exist, navigate to the current slide
			else {
				slide( indexh || 0, indexv || 0 );
			}
		}
		else {
			// Read the index components of the hash
			var h = parseInt( bits[0], 10 ) || 0,
				v = parseInt( bits[1], 10 ) || 0;

			if( h !== indexh || v !== indexv ) {
				slide( h, v );
			}
		}

	}

	/**
	 * Updates the page URL (hash) to reflect the current
	 * state.
	 *
	 * @param {Number} delay The time in ms to wait before
	 * writing the hash
	 */
	function writeURL( delay ) {

		if( config.history ) {

			// Make sure there's never more than one timeout running
			clearTimeout( writeURLTimeout );

			// If a delay is specified, timeout this call
			if( typeof delay === 'number' ) {
				writeURLTimeout = setTimeout( writeURL, delay );
			}
			else if( currentSlide ) {
				var url = '/';

				// Attempt to create a named link based on the slide's ID
				var id = currentSlide.getAttribute( 'id' );
				if( id ) {
					id = id.toLowerCase();
					id = id.replace( /[^a-zA-Z0-9\-\_\:\.]/g, '' );
				}

				// If the current slide has an ID, use that as a named link
				if( typeof id === 'string' && id.length ) {
					url = '/' + id;
				}
				// Otherwise use the /h/v index
				else {
					if( indexh > 0 || indexv > 0 ) url += indexh;
					if( indexv > 0 ) url += '/' + indexv;
				}

				window.location.hash = url;
			}
		}

	}

	/**
	 * Retrieves the h/v location of the current, or specified,
	 * slide.
	 *
	 * @param {HTMLElement} slide If specified, the returned
	 * index will be for this slide rather than the currently
	 * active one
	 *
	 * @return {Object} { h: <int>, v: <int>, f: <int> }
	 */
	function getIndices( slide ) {

		// By default, return the current indices
		var h = indexh,
			v = indexv,
			f;

		// If a slide is specified, return the indices of that slide
		if( slide ) {
			var isVertical = isVerticalSlide( slide );
			var slideh = isVertical ? slide.parentNode : slide;

			// Select all horizontal slides
			var horizontalSlides = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

			// Now that we know which the horizontal slide is, get its index
			h = Math.max( horizontalSlides.indexOf( slideh ), 0 );

			// Assume we're not vertical
			v = undefined;

			// If this is a vertical slide, grab the vertical index
			if( isVertical ) {
				v = Math.max( toArray( slide.parentNode.querySelectorAll( 'section' ) ).indexOf( slide ), 0 );
			}
		}

		if( !slide && currentSlide ) {
			var hasFragments = currentSlide.querySelectorAll( '.fragment' ).length > 0;
			if( hasFragments ) {
				var currentFragment = currentSlide.querySelector( '.current-fragment' );
				if( currentFragment && currentFragment.hasAttribute( 'data-fragment-index' ) ) {
					f = parseInt( currentFragment.getAttribute( 'data-fragment-index' ), 10 );
				}
				else {
					f = currentSlide.querySelectorAll( '.fragment.visible' ).length - 1;
				}
			}
		}

		return { h: h, v: v, f: f };

	}

	/**
	 * Retrieves the total number of slides in this presentation.
	 */
	function getTotalSlides() {

		return dom.wrapper.querySelectorAll( SLIDES_SELECTOR + ':not(.stack)' ).length;

	}

	/**
	 * Returns the slide element matching the specified index.
	 */
	function getSlide( x, y ) {

		var horizontalSlide = dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR )[ x ];
		var verticalSlides = horizontalSlide && horizontalSlide.querySelectorAll( 'section' );

		if( verticalSlides && verticalSlides.length && typeof y === 'number' ) {
			return verticalSlides ? verticalSlides[ y ] : undefined;
		}

		return horizontalSlide;

	}

	/**
	 * Returns the background element for the given slide.
	 * All slides, even the ones with no background properties
	 * defined, have a background element so as long as the
	 * index is valid an element will be returned.
	 */
	function getSlideBackground( x, y ) {

		// When printing to PDF the slide backgrounds are nested
		// inside of the slides
		if( isPrintingPDF() ) {
			var slide = getSlide( x, y );
			if( slide ) {
				var background = slide.querySelector( '.slide-background' );
				if( background && background.parentNode === slide ) {
					return background;
				}
			}

			return undefined;
		}

		var horizontalBackground = dom.wrapper.querySelectorAll( '.backgrounds>.slide-background' )[ x ];
		var verticalBackgrounds = horizontalBackground && horizontalBackground.querySelectorAll( '.slide-background' );

		if( verticalBackgrounds && verticalBackgrounds.length && typeof y === 'number' ) {
			return verticalBackgrounds ? verticalBackgrounds[ y ] : undefined;
		}

		return horizontalBackground;

	}

	/**
	 * Retrieves the current state of the presentation as
	 * an object. This state can then be restored at any
	 * time.
	 */
	function getState() {

		var indices = getIndices();

		return {
			indexh: indices.h,
			indexv: indices.v,
			indexf: indices.f,
			paused: isPaused(),
			overview: isOverview()
		};

	}

	/**
	 * Restores the presentation to the given state.
	 *
	 * @param {Object} state As generated by getState()
	 */
	function setState( state ) {

		if( typeof state === 'object' ) {
			slide( deserialize( state.indexh ), deserialize( state.indexv ), deserialize( state.indexf ) );

			var pausedFlag = deserialize( state.paused ),
				overviewFlag = deserialize( state.overview );

			if( typeof pausedFlag === 'boolean' && pausedFlag !== isPaused() ) {
				togglePause( pausedFlag );
			}

			if( typeof overviewFlag === 'boolean' && overviewFlag !== isOverview() ) {
				toggleOverview( overviewFlag );
			}
		}

	}

	/**
	 * Return a sorted fragments list, ordered by an increasing
	 * "data-fragment-index" attribute.
	 *
	 * Fragments will be revealed in the order that they are returned by
	 * this function, so you can use the index attributes to control the
	 * order of fragment appearance.
	 *
	 * To maintain a sensible default fragment order, fragments are presumed
	 * to be passed in document order. This function adds a "fragment-index"
	 * attribute to each node if such an attribute is not already present,
	 * and sets that attribute to an integer value which is the position of
	 * the fragment within the fragments list.
	 */
	function sortFragments( fragments ) {

		fragments = toArray( fragments );

		var ordered = [],
			unordered = [],
			sorted = [];

		// Group ordered and unordered elements
		fragments.forEach( function( fragment, i ) {
			if( fragment.hasAttribute( 'data-fragment-index' ) ) {
				var index = parseInt( fragment.getAttribute( 'data-fragment-index' ), 10 );

				if( !ordered[index] ) {
					ordered[index] = [];
				}

				ordered[index].push( fragment );
			}
			else {
				unordered.push( [ fragment ] );
			}
		} );

		// Append fragments without explicit indices in their
		// DOM order
		ordered = ordered.concat( unordered );

		// Manually count the index up per group to ensure there
		// are no gaps
		var index = 0;

		// Push all fragments in their sorted order to an array,
		// this flattens the groups
		ordered.forEach( function( group ) {
			group.forEach( function( fragment ) {
				sorted.push( fragment );
				fragment.setAttribute( 'data-fragment-index', index );
			} );

			index ++;
		} );

		return sorted;

	}

	/**
	 * Navigate to the specified slide fragment.
	 *
	 * @param {Number} index The index of the fragment that
	 * should be shown, -1 means all are invisible
	 * @param {Number} offset Integer offset to apply to the
	 * fragment index
	 *
	 * @return {Boolean} true if a change was made in any
	 * fragments visibility as part of this call
	 */
	function navigateFragment( index, offset ) {

		if( currentSlide && config.fragments ) {

			var fragments = sortFragments( currentSlide.querySelectorAll( '.fragment' ) );
			if( fragments.length ) {

				// If no index is specified, find the current
				if( typeof index !== 'number' ) {
					var lastVisibleFragment = sortFragments( currentSlide.querySelectorAll( '.fragment.visible' ) ).pop();

					if( lastVisibleFragment ) {
						index = parseInt( lastVisibleFragment.getAttribute( 'data-fragment-index' ) || 0, 10 );
					}
					else {
						index = -1;
					}
				}

				// If an offset is specified, apply it to the index
				if( typeof offset === 'number' ) {
					index += offset;
				}

				var fragmentsShown = [],
					fragmentsHidden = [];

				toArray( fragments ).forEach( function( element, i ) {

					if( element.hasAttribute( 'data-fragment-index' ) ) {
						i = parseInt( element.getAttribute( 'data-fragment-index' ), 10 );
					}

					// Visible fragments
					if( i <= index ) {
						if( !element.classList.contains( 'visible' ) ) fragmentsShown.push( element );
						element.classList.add( 'visible' );
						element.classList.remove( 'current-fragment' );

						// Announce the fragments one by one to the Screen Reader
						dom.statusDiv.textContent = element.textContent;

						if( i === index ) {
							element.classList.add( 'current-fragment' );
						}
					}
					// Hidden fragments
					else {
						if( element.classList.contains( 'visible' ) ) fragmentsHidden.push( element );
						element.classList.remove( 'visible' );
						element.classList.remove( 'current-fragment' );
					}


				} );

				if( fragmentsHidden.length ) {
					dispatchEvent( 'fragmenthidden', { fragment: fragmentsHidden[0], fragments: fragmentsHidden } );
				}

				if( fragmentsShown.length ) {
					dispatchEvent( 'fragmentshown', { fragment: fragmentsShown[0], fragments: fragmentsShown } );
				}

				updateControls();
				updateProgress();

				return !!( fragmentsShown.length || fragmentsHidden.length );

			}

		}

		return false;

	}

	/**
	 * Navigate to the next slide fragment.
	 *
	 * @return {Boolean} true if there was a next fragment,
	 * false otherwise
	 */
	function nextFragment() {

		return navigateFragment( null, 1 );

	}

	/**
	 * Navigate to the previous slide fragment.
	 *
	 * @return {Boolean} true if there was a previous fragment,
	 * false otherwise
	 */
	function previousFragment() {

		return navigateFragment( null, -1 );

	}

	/**
	 * Cues a new automated slide if enabled in the config.
	 */
	function cueAutoSlide() {

		cancelAutoSlide();

		if( currentSlide ) {

			var currentFragment = currentSlide.querySelector( '.current-fragment' );

			var fragmentAutoSlide = currentFragment ? currentFragment.getAttribute( 'data-autoslide' ) : null;
			var parentAutoSlide = currentSlide.parentNode ? currentSlide.parentNode.getAttribute( 'data-autoslide' ) : null;
			var slideAutoSlide = currentSlide.getAttribute( 'data-autoslide' );

			// Pick value in the following priority order:
			// 1. Current fragment's data-autoslide
			// 2. Current slide's data-autoslide
			// 3. Parent slide's data-autoslide
			// 4. Global autoSlide setting
			if( fragmentAutoSlide ) {
				autoSlide = parseInt( fragmentAutoSlide, 10 );
			}
			else if( slideAutoSlide ) {
				autoSlide = parseInt( slideAutoSlide, 10 );
			}
			else if( parentAutoSlide ) {
				autoSlide = parseInt( parentAutoSlide, 10 );
			}
			else {
				autoSlide = config.autoSlide;
			}

			// If there are media elements with data-autoplay,
			// automatically set the autoSlide duration to the
			// length of that media
			toArray( currentSlide.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
				if( el.hasAttribute( 'data-autoplay' ) ) {
					if( autoSlide && el.duration * 1000 > autoSlide ) {
						autoSlide = ( el.duration * 1000 ) + 1000;
					}
				}
			} );

			// Cue the next auto-slide if:
			// - There is an autoSlide value
			// - Auto-sliding isn't paused by the user
			// - The presentation isn't paused
			// - The overview isn't active
			// - The presentation isn't over
			if( autoSlide && !autoSlidePaused && !isPaused() && !isOverview() && ( !Reveal.isLastSlide() || availableFragments().next || config.loop === true ) ) {
				autoSlideTimeout = setTimeout( navigateNext, autoSlide );
				autoSlideStartTime = Date.now();
			}

			if( autoSlidePlayer ) {
				autoSlidePlayer.setPlaying( autoSlideTimeout !== -1 );
			}

		}

	}

	/**
	 * Cancels any ongoing request to auto-slide.
	 */
	function cancelAutoSlide() {

		clearTimeout( autoSlideTimeout );
		autoSlideTimeout = -1;

	}

	function pauseAutoSlide() {

		if( autoSlide && !autoSlidePaused ) {
			autoSlidePaused = true;
			dispatchEvent( 'autoslidepaused' );
			clearTimeout( autoSlideTimeout );

			if( autoSlidePlayer ) {
				autoSlidePlayer.setPlaying( false );
			}
		}

	}

	function resumeAutoSlide() {

		if( autoSlide && autoSlidePaused ) {
			autoSlidePaused = false;
			dispatchEvent( 'autoslideresumed' );
			cueAutoSlide();
		}

	}

	function navigateLeft() {

		// Reverse for RTL
		if( config.rtl ) {
			if( ( isOverview() || nextFragment() === false ) && availableRoutes().left ) {
				slide( indexh + 1 );
			}
		}
		// Normal navigation
		else if( ( isOverview() || previousFragment() === false ) && availableRoutes().left ) {
			slide( indexh - 1 );
		}

	}

	function navigateRight() {

		// Reverse for RTL
		if( config.rtl ) {
			if( ( isOverview() || previousFragment() === false ) && availableRoutes().right ) {
				slide( indexh - 1 );
			}
		}
		// Normal navigation
		else if( ( isOverview() || nextFragment() === false ) && availableRoutes().right ) {
			slide( indexh + 1 );
		}

	}

	function navigateUp() {

		// Prioritize hiding fragments
		if( ( isOverview() || previousFragment() === false ) && availableRoutes().up ) {
			slide( indexh, indexv - 1 );
		}

	}

	function navigateDown() {

		// Prioritize revealing fragments
		if( ( isOverview() || nextFragment() === false ) && availableRoutes().down ) {
			slide( indexh, indexv + 1 );
		}

	}

	/**
	 * Navigates backwards, prioritized in the following order:
	 * 1) Previous fragment
	 * 2) Previous vertical slide
	 * 3) Previous horizontal slide
	 */
	function navigatePrev() {

		// Prioritize revealing fragments
		if( previousFragment() === false ) {
			if( availableRoutes().up ) {
				navigateUp();
			}
			else {
				// Fetch the previous horizontal slide, if there is one
				var previousSlide;

				if( config.rtl ) {
					previousSlide = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.future' ) ).pop();
				}
				else {
					previousSlide = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR + '.past' ) ).pop();
				}

				if( previousSlide ) {
					var v = ( previousSlide.querySelectorAll( 'section' ).length - 1 ) || undefined;
					var h = indexh - 1;
					slide( h, v );
				}
			}
		}

	}

	/**
	 * The reverse of #navigatePrev().
	 */
	function navigateNext() {

		// Prioritize revealing fragments
		if( nextFragment() === false ) {
			if( availableRoutes().down ) {
				navigateDown();
			}
			else if( config.rtl ) {
				navigateLeft();
			}
			else {
				navigateRight();
			}
		}

		// If auto-sliding is enabled we need to cue up
		// another timeout
		cueAutoSlide();

	}


	// --------------------------------------------------------------------//
	// ----------------------------- EVENTS -------------------------------//
	// --------------------------------------------------------------------//

	/**
	 * Called by all event handlers that are based on user
	 * input.
	 */
	function onUserInput( event ) {

		if( config.autoSlideStoppable ) {
			pauseAutoSlide();
		}

	}

	/**
	 * Handler for the document level 'keypress' event.
	 */
	function onDocumentKeyPress( event ) {

		// Check if the pressed key is question mark
		if( event.shiftKey && event.charCode === 63 ) {
			if( dom.overlay ) {
				closeOverlay();
			}
			else {
				showHelp( true );
			}
		}

	}

	/**
	 * Handler for the document level 'keydown' event.
	 */
	function onDocumentKeyDown( event ) {

		// If there's a condition specified and it returns false,
		// ignore this event
		if( typeof config.keyboardCondition === 'function' && config.keyboardCondition() === false ) {
			return true;
		}

		// Remember if auto-sliding was paused so we can toggle it
		var autoSlideWasPaused = autoSlidePaused;

		onUserInput( event );

		// Check if there's a focused element that could be using
		// the keyboard
		var activeElementIsCE = document.activeElement && document.activeElement.contentEditable !== 'inherit';
		var activeElementIsInput = document.activeElement && document.activeElement.tagName && /input|textarea/i.test( document.activeElement.tagName );

		// Disregard the event if there's a focused element or a
		// keyboard modifier key is present
		if( activeElementIsCE || activeElementIsInput || (event.shiftKey && event.keyCode !== 32) || event.altKey || event.ctrlKey || event.metaKey ) return;

		// While paused only allow "unpausing" keyboard events (b and .)
		if( isPaused() && [66,190,191].indexOf( event.keyCode ) === -1 ) {
			return false;
		}

		var triggered = false;

		// 1. User defined key bindings
		if( typeof config.keyboard === 'object' ) {

			for( var key in config.keyboard ) {

				// Check if this binding matches the pressed key
				if( parseInt( key, 10 ) === event.keyCode ) {

					var value = config.keyboard[ key ];

					// Callback function
					if( typeof value === 'function' ) {
						value.apply( null, [ event ] );
					}
					// String shortcuts to reveal.js API
					else if( typeof value === 'string' && typeof Reveal[ value ] === 'function' ) {
						Reveal[ value ].call();
					}

					triggered = true;

				}

			}

		}

		// 2. System defined key bindings
		if( triggered === false ) {

			// Assume true and try to prove false
			triggered = true;

			switch( event.keyCode ) {
				// p, page up
				case 80: case 33: navigatePrev(); break;
				// n, page down
				case 78: case 34: navigateNext(); break;
				// h, left
				case 72: case 37: navigateLeft(); break;
				// l, right
				case 76: case 39: navigateRight(); break;
				// k, up
				case 75: case 38: navigateUp(); break;
				// j, down
				case 74: case 40: navigateDown(); break;
				// home
				case 36: slide( 0 ); break;
				// end
				case 35: slide( Number.MAX_VALUE ); break;
				// space
				case 32: isOverview() ? deactivateOverview() : event.shiftKey ? navigatePrev() : navigateNext(); break;
				// return
				case 13: isOverview() ? deactivateOverview() : triggered = false; break;
				// two-spot, semicolon, b, period, Logitech presenter tools "black screen" button
				case 58: case 59: case 66: case 190: case 191: togglePause(); break;
				// f
				case 70: enterFullscreen(); break;
				// a
				case 65: if ( config.autoSlideStoppable ) toggleAutoSlide( autoSlideWasPaused ); break;
				default:
					triggered = false;
			}

		}

		// If the input resulted in a triggered action we should prevent
		// the browsers default behavior
		if( triggered ) {
			event.preventDefault && event.preventDefault();
		}
		// ESC or O key
		else if ( ( event.keyCode === 27 || event.keyCode === 79 ) && features.transforms3d ) {
			if( dom.overlay ) {
				closeOverlay();
			}
			else {
				toggleOverview();
			}

			event.preventDefault && event.preventDefault();
		}

		// If auto-sliding is enabled we need to cue up
		// another timeout
		cueAutoSlide();

	}

	/**
	 * Handler for the 'touchstart' event, enables support for
	 * swipe and pinch gestures.
	 */
	function onTouchStart( event ) {

		touch.startX = event.touches[0].clientX;
		touch.startY = event.touches[0].clientY;
		touch.startCount = event.touches.length;

		// If there's two touches we need to memorize the distance
		// between those two points to detect pinching
		if( event.touches.length === 2 && config.overview ) {
			touch.startSpan = distanceBetween( {
				x: event.touches[1].clientX,
				y: event.touches[1].clientY
			}, {
				x: touch.startX,
				y: touch.startY
			} );
		}

	}

	/**
	 * Handler for the 'touchmove' event.
	 */
	function onTouchMove( event ) {

		// Each touch should only trigger one action
		if( !touch.captured ) {
			onUserInput( event );

			var currentX = event.touches[0].clientX;
			var currentY = event.touches[0].clientY;

			// If the touch started with two points and still has
			// two active touches; test for the pinch gesture
			if( event.touches.length === 2 && touch.startCount === 2 && config.overview ) {

				// The current distance in pixels between the two touch points
				var currentSpan = distanceBetween( {
					x: event.touches[1].clientX,
					y: event.touches[1].clientY
				}, {
					x: touch.startX,
					y: touch.startY
				} );

				// If the span is larger than the desire amount we've got
				// ourselves a pinch
				if( Math.abs( touch.startSpan - currentSpan ) > touch.threshold ) {
					touch.captured = true;

					if( currentSpan < touch.startSpan ) {
						activateOverview();
					}
					else {
						deactivateOverview();
					}
				}

				event.preventDefault();

			}
			// There was only one touch point, look for a swipe
			else if( event.touches.length === 1 && touch.startCount !== 2 ) {

				var deltaX = currentX - touch.startX,
					deltaY = currentY - touch.startY;

				if( deltaX > touch.threshold && Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					touch.captured = true;
					navigateLeft();
				}
				else if( deltaX < -touch.threshold && Math.abs( deltaX ) > Math.abs( deltaY ) ) {
					touch.captured = true;
					navigateRight();
				}
				else if( deltaY > touch.threshold ) {
					touch.captured = true;
					navigateUp();
				}
				else if( deltaY < -touch.threshold ) {
					touch.captured = true;
					navigateDown();
				}

				// If we're embedded, only block touch events if they have
				// triggered an action
				if( config.embedded ) {
					if( touch.captured || isVerticalSlide( currentSlide ) ) {
						event.preventDefault();
					}
				}
				// Not embedded? Block them all to avoid needless tossing
				// around of the viewport in iOS
				else {
					event.preventDefault();
				}

			}
		}
		// There's a bug with swiping on some Android devices unless
		// the default action is always prevented
		else if( navigator.userAgent.match( /android/gi ) ) {
			event.preventDefault();
		}

	}

	/**
	 * Handler for the 'touchend' event.
	 */
	function onTouchEnd( event ) {

		touch.captured = false;

	}

	/**
	 * Convert pointer down to touch start.
	 */
	function onPointerDown( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch" ) {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchStart( event );
		}

	}

	/**
	 * Convert pointer move to touch move.
	 */
	function onPointerMove( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch" )  {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchMove( event );
		}

	}

	/**
	 * Convert pointer up to touch end.
	 */
	function onPointerUp( event ) {

		if( event.pointerType === event.MSPOINTER_TYPE_TOUCH || event.pointerType === "touch" )  {
			event.touches = [{ clientX: event.clientX, clientY: event.clientY }];
			onTouchEnd( event );
		}

	}

	/**
	 * Handles mouse wheel scrolling, throttled to avoid skipping
	 * multiple slides.
	 */
	function onDocumentMouseScroll( event ) {

		if( Date.now() - lastMouseWheelStep > 600 ) {

			lastMouseWheelStep = Date.now();

			var delta = event.detail || -event.wheelDelta;
			if( delta > 0 ) {
				navigateNext();
			}
			else {
				navigatePrev();
			}

		}

	}

	/**
	 * Clicking on the progress bar results in a navigation to the
	 * closest approximate horizontal slide using this equation:
	 *
	 * ( clickX / presentationWidth ) * numberOfSlides
	 */
	function onProgressClicked( event ) {

		onUserInput( event );

		event.preventDefault();

		var slidesTotal = toArray( dom.wrapper.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) ).length;
		var slideIndex = Math.floor( ( event.clientX / dom.wrapper.offsetWidth ) * slidesTotal );

		slide( slideIndex );

	}

	/**
	 * Event handler for navigation control buttons.
	 */
	function onNavigateLeftClicked( event ) { event.preventDefault(); onUserInput(); navigateLeft(); }
	function onNavigateRightClicked( event ) { event.preventDefault(); onUserInput(); navigateRight(); }
	function onNavigateUpClicked( event ) { event.preventDefault(); onUserInput(); navigateUp(); }
	function onNavigateDownClicked( event ) { event.preventDefault(); onUserInput(); navigateDown(); }
	function onNavigatePrevClicked( event ) { event.preventDefault(); onUserInput(); navigatePrev(); }
	function onNavigateNextClicked( event ) { event.preventDefault(); onUserInput(); navigateNext(); }

	/**
	 * Handler for the window level 'hashchange' event.
	 */
	function onWindowHashChange( event ) {

		readURL();

	}

	/**
	 * Handler for the window level 'resize' event.
	 */
	function onWindowResize( event ) {

		layout();

	}

	/**
	 * Handle for the window level 'visibilitychange' event.
	 */
	function onPageVisibilityChange( event ) {

		var isHidden =  document.webkitHidden ||
						document.msHidden ||
						document.hidden;

		// If, after clicking a link or similar and we're coming back,
		// focus the document.body to ensure we can use keyboard shortcuts
		if( isHidden === false && document.activeElement !== document.body ) {
			document.activeElement.blur();
			document.body.focus();
		}

	}

	/**
	 * Invoked when a slide is and we're in the overview.
	 */
	function onOverviewSlideClicked( event ) {

		// TODO There's a bug here where the event listeners are not
		// removed after deactivating the overview.
		if( eventsAreBound && isOverview() ) {
			event.preventDefault();

			var element = event.target;

			while( element && !element.nodeName.match( /section/gi ) ) {
				element = element.parentNode;
			}

			if( element && !element.classList.contains( 'disabled' ) ) {

				deactivateOverview();

				if( element.nodeName.match( /section/gi ) ) {
					var h = parseInt( element.getAttribute( 'data-index-h' ), 10 ),
						v = parseInt( element.getAttribute( 'data-index-v' ), 10 );

					slide( h, v );
				}

			}
		}

	}

	/**
	 * Handles clicks on links that are set to preview in the
	 * iframe overlay.
	 */
	function onPreviewLinkClicked( event ) {

		if( event.currentTarget && event.currentTarget.hasAttribute( 'href' ) ) {
			var url = event.currentTarget.getAttribute( 'href' );
			if( url ) {
				showPreview( url );
				event.preventDefault();
			}
		}

	}

	/**
	 * Handles click on the auto-sliding controls element.
	 */
	function onAutoSlidePlayerClick( event ) {

		// Replay
		if( Reveal.isLastSlide() && config.loop === false ) {
			slide( 0, 0 );
			resumeAutoSlide();
		}
		// Resume
		else if( autoSlidePaused ) {
			resumeAutoSlide();
		}
		// Pause
		else {
			pauseAutoSlide();
		}

	}


	// --------------------------------------------------------------------//
	// ------------------------ PLAYBACK COMPONENT ------------------------//
	// --------------------------------------------------------------------//


	/**
	 * Constructor for the playback component, which displays
	 * play/pause/progress controls.
	 *
	 * @param {HTMLElement} container The component will append
	 * itself to this
	 * @param {Function} progressCheck A method which will be
	 * called frequently to get the current progress on a range
	 * of 0-1
	 */
	function Playback( container, progressCheck ) {

		// Cosmetics
		this.diameter = 50;
		this.thickness = 3;

		// Flags if we are currently playing
		this.playing = false;

		// Current progress on a 0-1 range
		this.progress = 0;

		// Used to loop the animation smoothly
		this.progressOffset = 1;

		this.container = container;
		this.progressCheck = progressCheck;

		this.canvas = document.createElement( 'canvas' );
		this.canvas.className = 'playback';
		this.canvas.width = this.diameter;
		this.canvas.height = this.diameter;
		this.context = this.canvas.getContext( '2d' );

		this.container.appendChild( this.canvas );

		this.render();

	}

	Playback.prototype.setPlaying = function( value ) {

		var wasPlaying = this.playing;

		this.playing = value;

		// Start repainting if we weren't already
		if( !wasPlaying && this.playing ) {
			this.animate();
		}
		else {
			this.render();
		}

	};

	Playback.prototype.animate = function() {

		var progressBefore = this.progress;

		this.progress = this.progressCheck();

		// When we loop, offset the progress so that it eases
		// smoothly rather than immediately resetting
		if( progressBefore > 0.8 && this.progress < 0.2 ) {
			this.progressOffset = this.progress;
		}

		this.render();

		if( this.playing ) {
			features.requestAnimationFrameMethod.call( window, this.animate.bind( this ) );
		}

	};

	/**
	 * Renders the current progress and playback state.
	 */
	Playback.prototype.render = function() {

		var progress = this.playing ? this.progress : 0,
			radius = ( this.diameter / 2 ) - this.thickness,
			x = this.diameter / 2,
			y = this.diameter / 2,
			iconSize = 14;

		// Ease towards 1
		this.progressOffset += ( 1 - this.progressOffset ) * 0.1;

		var endAngle = ( - Math.PI / 2 ) + ( progress * ( Math.PI * 2 ) );
		var startAngle = ( - Math.PI / 2 ) + ( this.progressOffset * ( Math.PI * 2 ) );

		this.context.save();
		this.context.clearRect( 0, 0, this.diameter, this.diameter );

		// Solid background color
		this.context.beginPath();
		this.context.arc( x, y, radius + 2, 0, Math.PI * 2, false );
		this.context.fillStyle = 'rgba( 0, 0, 0, 0.4 )';
		this.context.fill();

		// Draw progress track
		this.context.beginPath();
		this.context.arc( x, y, radius, 0, Math.PI * 2, false );
		this.context.lineWidth = this.thickness;
		this.context.strokeStyle = '#666';
		this.context.stroke();

		if( this.playing ) {
			// Draw progress on top of track
			this.context.beginPath();
			this.context.arc( x, y, radius, startAngle, endAngle, false );
			this.context.lineWidth = this.thickness;
			this.context.strokeStyle = '#fff';
			this.context.stroke();
		}

		this.context.translate( x - ( iconSize / 2 ), y - ( iconSize / 2 ) );

		// Draw play/pause icons
		if( this.playing ) {
			this.context.fillStyle = '#fff';
			this.context.fillRect( 0, 0, iconSize / 2 - 2, iconSize );
			this.context.fillRect( iconSize / 2 + 2, 0, iconSize / 2 - 2, iconSize );
		}
		else {
			this.context.beginPath();
			this.context.translate( 2, 0 );
			this.context.moveTo( 0, 0 );
			this.context.lineTo( iconSize - 2, iconSize / 2 );
			this.context.lineTo( 0, iconSize );
			this.context.fillStyle = '#fff';
			this.context.fill();
		}

		this.context.restore();

	};

	Playback.prototype.on = function( type, listener ) {
		this.canvas.addEventListener( type, listener, false );
	};

	Playback.prototype.off = function( type, listener ) {
		this.canvas.removeEventListener( type, listener, false );
	};

	Playback.prototype.destroy = function() {

		this.playing = false;

		if( this.canvas.parentNode ) {
			this.container.removeChild( this.canvas );
		}

	};


	// --------------------------------------------------------------------//
	// ------------------------------- API --------------------------------//
	// --------------------------------------------------------------------//


	Reveal = {
		initialize: initialize,
		configure: configure,
		sync: sync,

		// Navigation methods
		slide: slide,
		left: navigateLeft,
		right: navigateRight,
		up: navigateUp,
		down: navigateDown,
		prev: navigatePrev,
		next: navigateNext,

		// Fragment methods
		navigateFragment: navigateFragment,
		prevFragment: previousFragment,
		nextFragment: nextFragment,

		// Deprecated aliases
		navigateTo: slide,
		navigateLeft: navigateLeft,
		navigateRight: navigateRight,
		navigateUp: navigateUp,
		navigateDown: navigateDown,
		navigatePrev: navigatePrev,
		navigateNext: navigateNext,

		// Forces an update in slide layout
		layout: layout,

		// Returns an object with the available routes as booleans (left/right/top/bottom)
		availableRoutes: availableRoutes,

		// Returns an object with the available fragments as booleans (prev/next)
		availableFragments: availableFragments,

		// Toggles the overview mode on/off
		toggleOverview: toggleOverview,

		// Toggles the "black screen" mode on/off
		togglePause: togglePause,

		// Toggles the auto slide mode on/off
		toggleAutoSlide: toggleAutoSlide,

		// State checks
		isOverview: isOverview,
		isPaused: isPaused,
		isAutoSliding: isAutoSliding,

		// Adds or removes all internal event listeners (such as keyboard)
		addEventListeners: addEventListeners,
		removeEventListeners: removeEventListeners,

		// Facility for persisting and restoring the presentation state
		getState: getState,
		setState: setState,

		// Presentation progress on range of 0-1
		getProgress: getProgress,

		// Returns the indices of the current, or specified, slide
		getIndices: getIndices,

		getTotalSlides: getTotalSlides,

		// Returns the slide element at the specified index
		getSlide: getSlide,

		// Returns the slide background element at the specified index
		getSlideBackground: getSlideBackground,

		// Returns the previous slide element, may be null
		getPreviousSlide: function() {
			return previousSlide;
		},

		// Returns the current slide element
		getCurrentSlide: function() {
			return currentSlide;
		},

		// Returns the current scale of the presentation content
		getScale: function() {
			return scale;
		},

		// Returns the current configuration object
		getConfig: function() {
			return config;
		},

		// Helper method, retrieves query string as a key/value hash
		getQueryHash: function() {
			var query = {};

			location.search.replace( /[A-Z0-9]+?=([\w\.%-]*)/gi, function(a) {
				query[ a.split( '=' ).shift() ] = a.split( '=' ).pop();
			} );

			// Basic deserialization
			for( var i in query ) {
				var value = query[ i ];

				query[ i ] = deserialize( unescape( value ) );
			}

			return query;
		},

		// Returns true if we're currently on the first slide
		isFirstSlide: function() {
			return ( indexh === 0 && indexv === 0 );
		},

		// Returns true if we're currently on the last slide
		isLastSlide: function() {
			if( currentSlide ) {
				// Does this slide has next a sibling?
				if( currentSlide.nextElementSibling ) return false;

				// If it's vertical, does its parent have a next sibling?
				if( isVerticalSlide( currentSlide ) && currentSlide.parentNode.nextElementSibling ) return false;

				return true;
			}

			return false;
		},

		// Checks if reveal.js has been loaded and is ready for use
		isReady: function() {
			return loaded;
		},

		// Forward event binding to the reveal DOM element
		addEventListener: function( type, listener, useCapture ) {
			if( 'addEventListener' in window ) {
				( dom.wrapper || document.querySelector( '.reveal' ) ).addEventListener( type, listener, useCapture );
			}
		},
		removeEventListener: function( type, listener, useCapture ) {
			if( 'addEventListener' in window ) {
				( dom.wrapper || document.querySelector( '.reveal' ) ).removeEventListener( type, listener, useCapture );
			}
		},

		// Programatically triggers a keyboard event
		triggerKey: function( keyCode ) {
			onDocumentKeyDown( { keyCode: keyCode } );
		}
	};

	return Reveal;

}));

},{}]},{},["/Users/bobylito/Copy/source.sync/GreekFlashcards/js/cards.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9jYXJkcy5qcyIsImpzL3BlcnNpc3RlbmNlL0RlY2tTdGF0cy5qcyIsImpzL3BlcnNpc3RlbmNlL2luZGV4LmpzIiwianMvcmFuZG9taXplLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9tb2JpbGUtYnV0dG9uL2xpYi9idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvbW91c2UvZGVmYXVsdC9tb3VzZS1wdXNoLWJ1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy9tb2JpbGUtYnV0dG9uL2xpYi9tb3VzZS9kZWZhdWx0L21vdXNlZG93bi1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvbW91c2UvZGVmYXVsdC9tb3VzZXVwLWJ1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy9tb2JpbGUtYnV0dG9uL2xpYi9tb3VzZS9zY3JvbGxhYmxlLXgvbW91c2V1cC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvbW91c2Uvc2Nyb2xsYWJsZS15L21vdXNldXAtYnV0dG9uLmpzIiwibm9kZV9tb2R1bGVzL21vYmlsZS1idXR0b24vbGliL3BvaW50ZXIvZGVmYXVsdC9wb2ludGVyLXB1c2gtYnV0dG9uLmpzIiwibm9kZV9tb2R1bGVzL21vYmlsZS1idXR0b24vbGliL3BvaW50ZXIvZGVmYXVsdC9wb2ludGVyZG93bi1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvcG9pbnRlci9kZWZhdWx0L3BvaW50ZXJ1cC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvcG9pbnRlci9zY3JvbGxhYmxlLXgvcG9pbnRlcnVwLWJ1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy9tb2JpbGUtYnV0dG9uL2xpYi9wb2ludGVyL3Njcm9sbGFibGUteS9wb2ludGVydXAtYnV0dG9uLmpzIiwibm9kZV9tb2R1bGVzL21vYmlsZS1idXR0b24vbGliL3RvdWNoL2RlZmF1bHQvdG91Y2gtcHVzaC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvdG91Y2gvZGVmYXVsdC90b3VjaGVuZC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9saWIvdG91Y2gvZGVmYXVsdC90b3VjaHN0YXJ0LWJ1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy9tb2JpbGUtYnV0dG9uL2xpYi90b3VjaC9zY3JvbGxhYmxlLXgvdG91Y2hlbmQtYnV0dG9uLmpzIiwibm9kZV9tb2R1bGVzL21vYmlsZS1idXR0b24vbGliL3RvdWNoL3Njcm9sbGFibGUteS90b3VjaGVuZC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvbW9iaWxlLWJ1dHRvbi9ub2RlX21vZHVsZXMvcS9xLmpzIiwibm9kZV9tb2R1bGVzL3JldmVhbC5qcy9qcy9yZXZlYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDajVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBSZXZlYWwgPSByZXF1aXJlKCBcInJldmVhbC5qc1wiICk7XG52YXIgTUJ1dHRvbiA9IHJlcXVpcmUoIFwibW9iaWxlLWJ1dHRvblwiICk7XG52YXIgcGVyc2lzdGVuY2UgPSByZXF1aXJlKCBcIi4vcGVyc2lzdGVuY2VcIiApO1xudmFyIHJhbmRvbWl6ZUNhcmRzID0gcmVxdWlyZSggXCIuL3JhbmRvbWl6ZVwiICk7XG5cbi8vIFJhbmRvbWl6ZSBzbGlkZXNcbnZhciBzbGlkZXNQYXJlbnQgPSByYW5kb21pemVDYXJkcyggZG9jdW1lbnQucXVlcnlTZWxlY3RvciggXCIuc2xpZGVzXCIgKSApO1xuXG52YXIgc3RhdGUgPSB7XG4gIGNhcmQgOiBcIlwiLFxuICBoaW50U2hvd24gOiBmYWxzZVxufTtcblxubmV3IE1CdXR0b24uVG91Y2hlbmQoIHtcbiAgZWwgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBcIi52YWxpZGF0ZS1jYXJkXCIgKSxcbiAgZiA6IGZ1bmN0aW9uKCl7XG4gICAgaWYoICFzdGF0ZS5oaW50U2hvd24gKXtcbiAgICAgIHBlcnNpc3RlbmNlLmFkZE9rQ2FyZCggc3RhdGUuY2FyZCApO1xuICAgIH1cbiAgICBzdGF0ZS5oaW50U2hvd24gPSBmYWxzZTtcbiAgICBSZXZlYWwucmlnaHQoKTtcbiAgfVxufSApO1xuXG5uZXcgTUJ1dHRvbi5Ub3VjaGVuZCgge1xuICBlbCA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIFwiLnNob3ctaGludHNcIiApLFxuICBmIDogZnVuY3Rpb24oKXtcbiAgICBpZiggIXN0YXRlLmhpbnRTaG93biApe1xuICAgICAgcGVyc2lzdGVuY2UuYWRkRmFpbGVkQ2FyZCggc3RhdGUuY2FyZCApO1xuICAgIH1cbiAgICBzdGF0ZS5oaW50U2hvd24gPSB0cnVlO1xuICAgIFJldmVhbC5kb3duKCk7XG4gIH1cbn0gKTtcblxuUmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoIFwic2xpZGVjaGFuZ2VkXCIsIGZ1bmN0aW9uKCBlICl7XG4gIHZhciBpbmRleFYgPSBlLmluZGV4djtcbiAgaWYoIGluZGV4ViA9PT0gMCApe1xuICAgIHZhciBjYXJkID0gc3RhdGUuY2FyZCA9IGUuY3VycmVudFNsaWRlLmRhdGFzZXQuY2FyZDtcbiAgICBwZXJzaXN0ZW5jZS5hZGRTZWVuQ2FyZCggY2FyZCApO1xuICB9XG59ICk7XG5cblJldmVhbC5hZGRFdmVudExpc3RlbmVyKCBcInJlYWR5XCIsIGZ1bmN0aW9uKCBlICl7XG4gIHZhciBjYXJkID0gZS5jdXJyZW50U2xpZGUuZGF0YXNldC5jYXJkO1xuICBzdGF0ZS5jYXJkID0gY2FyZDtcbiAgcGVyc2lzdGVuY2UuYWRkU2VlbkNhcmQoIGNhcmQgKTtcbn0gKTtcblxuLy8gRnVsbCBsaXN0IG9mIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBhdmFpbGFibGUgYXQ6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vaGFraW1lbC9yZXZlYWwuanMjY29uZmlndXJhdGlvblxuUmV2ZWFsLmluaXRpYWxpemUoe1xuICBjb250cm9sczogZmFsc2UsXG4gIHByb2dyZXNzOiB0cnVlLFxuICBoaXN0b3J5OiBmYWxzZSxcbiAgY2VudGVyOiB0cnVlLFxuICB0b3VjaDogZmFsc2UsXG4gIGtleWJvYXJkOiB0cnVlLFxuICB0cmFuc2l0aW9uOiAnc2xpZGUnLCAvLyBub25lL2ZhZGUvc2xpZGUvY29udmV4L2NvbmNhdmUvem9vbVxufSk7XG4iLCJ2YXIgRGVja1N0YXRzID0gZnVuY3Rpb24oIHBhcmFtcyApe1xuICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gIHRoaXMuc2VlbkNhcmRzID0gcGFyYW1zLnNlZW5DYXJkcyB8fCBbXTtcbiAgdGhpcy5mYWlsZWRDYXJkcyA9IHBhcmFtcy5mYWlsZWRDYXJkcyB8fCB7fTtcbiAgdGhpcy5va0NhcmRzID0gcGFyYW1zLm9rQ2FyZHMgfHwge307XG59XG5cbkRlY2tTdGF0cy5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBEZWNrU3RhdHMsXG4gIGFkZFNlZW5DYXJkIDogZnVuY3Rpb24oIGNhcmQgKXtcbiAgICBpZiggdGhpcy5zZWVuQ2FyZHMuaW5kZXhPZiggY2FyZCApID09PSAtMSApe1xuICAgICAgdmFyIG5ld1N0YXRlID0gbmV3IERlY2tTdGF0cyggdGhpcyApO1xuICAgICAgbmV3U3RhdGUuc2VlbkNhcmRzID0gdGhpcy5zZWVuQ2FyZHMuY29uY2F0KCBjYXJkICk7XG4gICAgICByZXR1cm4gbmV3U3RhdGU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBhZGRGYWlsZWRDYXJkIDogZnVuY3Rpb24oIGNhcmQgKXtcbiAgICB2YXIgbmV3U3RhdGUgPSBuZXcgRGVja1N0YXRzKCB0aGlzICk7XG4gICAgaWYoIHRoaXMuZmFpbGVkQ2FyZHNbIGNhcmQgXSApe1xuICAgICAgbmV3U3RhdGUuZmFpbGVkQ2FyZHNbIGNhcmQgXSA9IHRoaXMuZmFpbGVkQ2FyZHNbIGNhcmQgXSArIDE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbmV3U3RhdGUuZmFpbGVkQ2FyZHNbIGNhcmQgXSA9IDE7XG4gICAgfVxuICAgIHJldHVybiBuZXdTdGF0ZTtcbiAgfSxcbiAgYWRkT2tDYXJkIDogZnVuY3Rpb24oIGNhcmQgKXtcbiAgICB2YXIgbmV3U3RhdGUgPSBuZXcgRGVja1N0YXRzKCB0aGlzICk7XG4gICAgaWYoIHRoaXMub2tDYXJkc1sgY2FyZCBdICl7XG4gICAgICBuZXdTdGF0ZS5va0NhcmRzWyBjYXJkIF0gPSB0aGlzLm9rQ2FyZHNbIGNhcmQgXSArIDE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbmV3U3RhdGUub2tDYXJkc1sgY2FyZCBdID0gMTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld1N0YXRlO1xuICB9LFxuICBnZXRDYXJkSW5mb3M6IGZ1bmN0aW9uKCBjYXJkICl7XG4gICAgdmFyIGluZm9zID0ge307XG5cbiAgICBpbmZvcy5zZWVuID0gKCB0aGlzLnNlZW5DYXJkcy5pbmRleE9mKCBjYXJkICkgIT09IC0xICk7XG4gICAgaW5mb3MuZmFpbGVkQ2FyZHMgPSB0aGlzLmZhaWxlZENhcmRzWyBjYXJkIF0gfHwgMDtcbiAgICBpbmZvcy5va0NhcmRzID0gdGhpcy5va0NhcmRzWyBjYXJkIF0gfHwgMDtcblxuICAgIHJldHVybiBpbmZvcztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZWNrU3RhdHM7XG4iLCJ2YXIgRGVja1N0YXRzID0gcmVxdWlyZSggXCIuL0RlY2tTdGF0c1wiICk7XG5cbnZhciBsID0gd2luZG93LmxvY2FsU3RvcmFnZTtcblxudmFyIGRlY2tTdGF0cyA9IGwuZ2V0SXRlbSggXCJkZWNrc3RhdHNcIiApID9cbiAgbmV3IERlY2tTdGF0cyggSlNPTi5wYXJzZSggbC5nZXRJdGVtKCBcImRlY2tzdGF0c1wiICkgKSApIDpcbiAgbmV3IERlY2tTdGF0cygpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkU2VlbkNhcmQgOiBhZGRTZWVuQ2FyZCxcbiAgYWRkRmFpbGVkQ2FyZCA6IGFkZEZhaWxlZENhcmQsXG4gIGFkZE9rQ2FyZCA6IGFkZE9rQ2FyZCxcbiAgZ2V0RGF0YSA6IGdldERhdGFcbn07XG5cbmZ1bmN0aW9uIGFkZFNlZW5DYXJkKCBjYXJkICl7XG4gIGRlY2tTdGF0cyA9IGRlY2tTdGF0cy5hZGRTZWVuQ2FyZCggY2FyZCApO1xuICBzYXZlU3RhdGUoIFwiZGVja3N0YXRzXCIsICBkZWNrU3RhdHMgKTtcbn1cblxuZnVuY3Rpb24gYWRkRmFpbGVkQ2FyZCggY2FyZCApe1xuICBkZWNrU3RhdHMgPSBkZWNrU3RhdHMuYWRkRmFpbGVkQ2FyZCggY2FyZCApO1xuICBzYXZlU3RhdGUoIFwiZGVja3N0YXRzXCIsIGRlY2tTdGF0cyApO1xufVxuXG5mdW5jdGlvbiBhZGRPa0NhcmQoIGNhcmQgKXtcbiAgZGVja3N0YXRzID0gZGVja1N0YXRzLmFkZE9rQ2FyZCggY2FyZCApO1xuICBzYXZlU3RhdGUoIFwiZGVja3N0YXRzXCIsIGRlY2tTdGF0cyApO1xufVxuXG5mdW5jdGlvbiBzYXZlU3RhdGUoIGVudHJ5TmFtZSwgc3RhdGUgKXtcbiAgbC5zZXRJdGVtKCBlbnRyeU5hbWUsIEpTT04uc3RyaW5naWZ5KCBzdGF0ZSApICk7XG59XG5cbmZ1bmN0aW9uIGdldERhdGEoKSB7XG4gIHJldHVybiBuZXcgRGVja1N0YXRzKCBkZWNrU3RhdHMgKTtcbn1cbiIsInZhciBwZXJzaXN0ZW5jZSA9IHJlcXVpcmUoIFwiLi9wZXJzaXN0ZW5jZVwiICk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmFuZG9taXplQ2FyZHMoIGVsICl7XG4gIHZhciBzbGlkZXMgPSBlbC5jaGlsZE5vZGVzO1xuICB2YXIgZGVja1N0YXRzID0gcGVyc2lzdGVuY2UuZ2V0RGF0YSgpO1xuXG4gIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoIHNsaWRlcywgZnVuY3Rpb24oIHNsaWRlICl7XG4gICAgZWwucmVtb3ZlQ2hpbGQoIHNsaWRlICk7XG4gIH0gKTtcblxuICB2YXIgc2xpZGVzQXJyYXkgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggc2xpZGVzLCAwICk7XG4gIHZhciBuZXdTbGlkZXMgICA9IHNsaWRlc0FycmF5LnJldmVyc2UoKTtcblxuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKCBuZXdTbGlkZXMsIGZ1bmN0aW9uKCBzbGlkZSApe1xuICAgIGVsLmFwcGVuZENoaWxkKCBzbGlkZSApO1xuICB9ICk7XG5cbiAgLy8gT3RoZXIgc29ydCBtZXRob2RzXG4gIGZ1bmN0aW9uIHNtYXJ0KCBzbGlkZXMgKXtcbiAgICByZXR1cm4gc2xpZGVzQXJyYXkuc29ydCggZnVuY3Rpb24gc21hcnRTb3J0KCBzbGlkZUEsIHNsaWRlQiApeyBcbiAgICAgIHZhciBpbmZvc0EgPSBkZWNrU3RhdHMuZ2V0Q2FyZEluZm9zKCBzbGlkZUEuZGF0YXNldC5jYXJkICk7XG4gICAgICB2YXIgaW5mb3NCID0gZGVja1N0YXRzLmdldENhcmRJbmZvcyggc2xpZGVCLmRhdGFzZXQuY2FyZCApO1xuXG4gICAgICBpZiggaW5mb3NBLnNlZW4gIT0gaW5mb3NCLnNlZW4gKSB7XG4gICAgICAgIHJldHVybiBpbmZvc0Euc2VlbiA/IC0xIDogMTtcbiAgICAgIH1cblxuICAgICAgaWYoIGluZm9zQS5va0NhcmRzICE9IGluZm9zQi5va0NhcmRzICl7XG4gICAgICAgIHJldHVybiBpbmZvc0Eub2tDYXJkcyA+IGluZm9zQi5va0NhcmRzID8gMSA6IC0xO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbi8vICBpZiggaW5mb3NBLmZhaWxlZENhcmRzICE9IGluZm9zQi5mYWlsZWRDYXJkcyApe1xuLy8gICAgcmV0dXJuIGluZm9zQS5mYWlsZWRDYXJkcyA+IGluZm9zQi5mYWlsZWRDYXJkcyA/IDEgOiAtMTtcbi8vICB9XG5cbi8vICByZXR1cm4gMDsvLzAuNSAtIE1hdGgucmFuZG9tKCk7XG5cbiAgICB9ICk7XG4gIH1cblxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuICAgIHZhciBjdXJyZW50UXVldWU7XG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgcXVldWUucHVzaChmdW4pO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qXG4gKiBidXR0b24uanMgLSB0aGUgYmFzZSBvZiBhbGwgYnV0dG9uc1xuICpcbiAqIEFsbCBidXR0b25zIHNoYXJlIHR3byBlbGVtZW50czogYSBmdW5jdGlvbiwgdGhlIGNhbGxiYWNrIG9mIHRoZSBidXR0b25cbiAqIGFuZCBhIERPTSBlbGVtZW50LlxuICpcbiAqIElmIHRoZSBjYWxsYmFjayBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSwgdGhlIGJ1dHRvbiB3aWxsXG4gKiBrZWVwIGlzIGFjdGl2ZSBzdGF0ZSB1bnRpbCB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZDtcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGxvY2sgPSBmYWxzZTtcblxudmFyIEJ1dHRvbiA9IGZ1bmN0aW9uIEJ1dHRvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLyogdGhlIGNhbGxiYWNrIGZ1bmN0aW9uICovXG4gICAgdGhpcy5mID0gbnVsbDtcbiAgICAvKiB0aGUgZG9tIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoZSBidXR0b24gKi9cbiAgICB0aGlzLmVsID0gbnVsbDtcblxuICAgIC8qIHRoZSBzdGF0ZSBvZiB0aGUgYnV0dG9uICovXG4gICAgdGhpcy5iaW5kZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMubW9ub3RvdWNoYWJsZSA9IGZhbHNlO1xuXG4gICAgLyogd2hldGhlciB0byBzZXQgYWN0aXZlIGNsYXNzIG9yIG5vdCAqL1xuICAgIHRoaXMuc2V0QWN0aXZlQ2xzID0gdHJ1ZTtcbiAgICAvKiBkZWZhdWx0IGFjdGl2ZSBjc3MgY2xhc3MqL1xuICAgIHRoaXMuYWN0aXZlQ2xzID0gJ2FjdGl2ZSc7XG5cbiAgICBpZihvcHRpb25zLnNldEFjdGl2ZUNscykgdGhpcy5zZXRBY3RpdmVDbHMgPSBvcHRpb25zLnNldEFjdGl2ZUNscztcbiAgICBpZih0eXBlb2Ygb3B0aW9ucy5hY3RpdmVDbHMgPT09ICdzdHJpbmcnKSB0aGlzLmFjdGl2ZUNscyA9IG9wdGlvbnMuYWN0aXZlQ2xzO1xuICAgIGlmKG9wdGlvbnMuZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgdGhpcy5lbCA9IG9wdGlvbnMuZWw7XG4gICAgaWYodHlwZW9mIG9wdGlvbnMuZiA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5mID0gb3B0aW9ucy5mO1xuICAgIGlmKG9wdGlvbnMubW9ub3RvdWNoYWJsZSkgdGhpcy5tb25vdG91Y2hhYmxlID0gb3B0aW9ucy5tb25vdG91Y2hhYmxlO1xuICAgIGlmKG9wdGlvbnMuYXV0b2JpbmQgIT09IGZhbHNlKSB0aGlzLmJpbmQoKTtcbn07XG5cbkJ1dHRvbi5wcm90b3R5cGUuc2V0RWwgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICBpZih0aGlzLmFjdGl2ZSkgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgY2hhbmdlIGRvbSBlbGVtZW50LCBidXR0b24gaXMgYWN0aXZlLlwiKTtcbiAgICBpZih0aGlzLmJpbmRlZCkgdGhpcy51bmJpbmQoKTtcbiAgICBpZihlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuZWwgPSBlbDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdXR0b24gc2V0RWwgbWV0aG9kIG5lZWRzIGEgZG9tIGVsZW1lbnQgYXMgYXJndW1lbnQuXCIpO1xuICAgIH1cbn07XG5cbkJ1dHRvbi5wcm90b3R5cGUuX2FkZENscyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZWwuY2xhc3NMaXN0LmNvbnRhaW5zKHRoaXMuYWN0aXZlQ2xzKSlcbiAgICAgICAgdGhpcy5lbC5jbGFzc0xpc3QuYWRkKHRoaXMuYWN0aXZlQ2xzKTtcbn07XG5cbkJ1dHRvbi5wcm90b3R5cGUuX3JlbW92ZUNscyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5lbC5jbGFzc0xpc3QuY29udGFpbnModGhpcy5hY3RpdmVDbHMpKVxuICAgICAgICB0aGlzLmVsLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5hY3RpdmVDbHMpO1xufTtcblxuQnV0dG9uLnByb3RvdHlwZS5zZXRBY3RpdmUgPSBmdW5jdGlvbiAoYWN0aXZlKSB7XG4gICAgaWYgKHRoaXMuc2V0QWN0aXZlQ2xzKSB7XG4gICAgICAgIGlmIChhY3RpdmUpIHRoaXMuX2FkZENscygpO1xuICAgICAgICBlbHNlIHRoaXMuX3JlbW92ZUNscygpO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZSA9IGFjdGl2ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkJ1dHRvbi5wcm90b3R5cGUubG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZih0aGlzLm1vbm90b3VjaGFibGUpIGxvY2sgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuQnV0dG9uLnByb3RvdHlwZS51bmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYodGhpcy5tb25vdG91Y2hhYmxlKSBsb2NrID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5CdXR0b24ucHJvdG90eXBlLmlzTG9ja2VkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBsb2NrO1xufTtcblxuQnV0dG9uLnByb3RvdHlwZS5zZXRGID0gZnVuY3Rpb24gKGYpIHtcbiAgICBpZiAodHlwZW9mIGYgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJ1dHRvbiBzZXRGIG1ldGhvZCBuZWVkcyBhIGYgZnVuY3Rpb24gYXMgYXJndW1lbnQuXCIpO1xuICAgIHRoaXMuZiA9IGY7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKiBpbXBsLiBub3QgY29tcGxldGVkLCBhIGNoaWxkIHdpbGwgcmVkZWZpbmUgdGhlIGJpbmQgbWV0aG9kLCBjYWxsIHRoaXMgb25lIGFuZCBzZXQgdGhpcy5iaW5kZWQgdG8gdHJ1ZSovXG5CdXR0b24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIXRoaXMuZWwgfHwgIXRoaXMuZikgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgYmluZCBhbiB1bmluaXRpYWxpemVkIGJ1dHRvbi5cIik7XG4gICAgaWYodGhpcy5iaW5kZWQpIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGJpbmQgYW4gYWxyZWFkeSBiaW5kZWQgYnV0dG9uLlwiKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qIGltcGwuIG5vdCBjb21wbGV0ZWQsIGEgY2hpbGQgd2lsbCByZWRlZmluZSB0aGUgYmluZCBtZXRob2QsIGNhbGwgdGhpcyBvbmUgYW5kIHNldCB0aGlzLmJpbmRlZCB0byBmYWxzZSovXG5CdXR0b24ucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZighdGhpcy5lbCB8fCAhdGhpcy5mKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCB1bmJpbmQgYW4gdW5pbml0aWFsaXplZCBidXR0b24uXCIpO1xuICAgIGlmKCF0aGlzLmJpbmRlZCkgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgdW5iaW5kIGEgdW5iaW5kZWQgYnV0dG9uLlwiKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uO1xuIiwiLypcbiAqIGluZGV4LmpzIC0gbW9iaWxlLWJ1dHRvbiBtb2R1bGVcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIE1vdXNlZG93bkJ1dHRvbiA9IHJlcXVpcmUoJy4vbW91c2UvZGVmYXVsdC9tb3VzZWRvd24tYnV0dG9uJyksXG4gICAgTW91c2V1cEJ1dHRvbiA9IHJlcXVpcmUoJy4vbW91c2UvZGVmYXVsdC9tb3VzZXVwLWJ1dHRvbicpLFxuICAgIE1vdXNldXBPblNjcm9sbGFibGVZQnV0dG9uID0gcmVxdWlyZSgnLi9tb3VzZS9zY3JvbGxhYmxlLXkvbW91c2V1cC1idXR0b24nKSxcbiAgICBNb3VzZXVwT25TY3JvbGxhYmxlWEJ1dHRvbiA9IHJlcXVpcmUoJy4vbW91c2Uvc2Nyb2xsYWJsZS14L21vdXNldXAtYnV0dG9uJyksXG4gICAgTW91c2VQdXNoQnV0dG9uID0gcmVxdWlyZSgnLi9tb3VzZS9kZWZhdWx0L21vdXNlLXB1c2gtYnV0dG9uJyksXG5cbiAgICBUb3VjaHN0YXJ0QnV0dG9uID0gcmVxdWlyZSgnLi90b3VjaC9kZWZhdWx0L3RvdWNoc3RhcnQtYnV0dG9uJyksXG4gICAgVG91Y2hlbmRCdXR0b24gPSByZXF1aXJlKCcuL3RvdWNoL2RlZmF1bHQvdG91Y2hlbmQtYnV0dG9uJyksXG4gICAgVG91Y2hlbmRPblNjcm9sbGFibGVZQnV0dG9uID0gcmVxdWlyZSgnLi90b3VjaC9zY3JvbGxhYmxlLXkvdG91Y2hlbmQtYnV0dG9uJyksXG4gICAgVG91Y2hlbmRPblNjcm9sbGFibGVYQnV0dG9uID0gcmVxdWlyZSgnLi90b3VjaC9zY3JvbGxhYmxlLXgvdG91Y2hlbmQtYnV0dG9uJyksXG4gICAgVG91Y2hQdXNoQnV0dG9uID0gcmVxdWlyZSgnLi90b3VjaC9kZWZhdWx0L3RvdWNoLXB1c2gtYnV0dG9uJyksXG5cbiAgICBQb2ludGVyZG93bkJ1dHRvbiA9IHJlcXVpcmUoJy4vcG9pbnRlci9kZWZhdWx0L3BvaW50ZXJkb3duLWJ1dHRvbicpLFxuICAgIFBvaW50ZXJ1cEJ1dHRvbiA9IHJlcXVpcmUoJy4vcG9pbnRlci9kZWZhdWx0L3BvaW50ZXJ1cC1idXR0b24nKSxcbiAgICBQb2ludGVydXBPblNjcm9sbGFibGVZQnV0dG9uID0gcmVxdWlyZSgnLi9wb2ludGVyL3Njcm9sbGFibGUteS9wb2ludGVydXAtYnV0dG9uJyksXG4gICAgUG9pbnRlcnVwT25TY3JvbGxhYmxlWEJ1dHRvbiA9IHJlcXVpcmUoJy4vcG9pbnRlci9zY3JvbGxhYmxlLXgvcG9pbnRlcnVwLWJ1dHRvbicpLFxuICAgIFBvaW50ZXJQdXNoQnV0dG9uID0gcmVxdWlyZSgnLi9wb2ludGVyL2RlZmF1bHQvcG9pbnRlci1wdXNoLWJ1dHRvbicpLFxuXG4gICAgdG91Y2hhYmxlID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93LFxuICAgIHBvaW50YWJsZSA9ICEhd2luZG93Lk1TUG9pbnRlckV2ZW50IHx8ICEhd2luZG93LlBvaW50ZXJFdmVudDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgVG91Y2hzdGFydCA6IHRvdWNoYWJsZSA/IFRvdWNoc3RhcnRCdXR0b24gOiAocG9pbnRhYmxlID8gUG9pbnRlcmRvd25CdXR0b24gOiBNb3VzZWRvd25CdXR0b24pLFxuICAgIFRvdWNoZW5kIDogdG91Y2hhYmxlID8gVG91Y2hlbmRCdXR0b24gOiAocG9pbnRhYmxlID8gUG9pbnRlcnVwQnV0dG9uIDogTW91c2V1cEJ1dHRvbiksXG4gICAgU2Nyb2xsYWJsZVkgOiB7XG4gICAgICAgIFRvdWNoZW5kIDogdG91Y2hhYmxlID8gVG91Y2hlbmRPblNjcm9sbGFibGVZQnV0dG9uIDogKHBvaW50YWJsZSA/IFBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVlCdXR0b24gOiBNb3VzZXVwT25TY3JvbGxhYmxlWUJ1dHRvbilcbiAgICB9LFxuICAgIFNjcm9sbGFibGVYIDoge1xuICAgICAgICBUb3VjaGVuZCA6IHRvdWNoYWJsZSA/IFRvdWNoZW5kT25TY3JvbGxhYmxlWEJ1dHRvbiA6IChwb2ludGFibGUgPyBQb2ludGVydXBPblNjcm9sbGFibGVYQnV0dG9uIDogTW91c2V1cE9uU2Nyb2xsYWJsZVhCdXR0b24pXG4gICAgfSxcbiAgICBQdXNoIDogdG91Y2hhYmxlID8gVG91Y2hQdXNoQnV0dG9uIDogKHBvaW50YWJsZSA/IFBvaW50ZXJQdXNoQnV0dG9uIDogTW91c2VQdXNoQnV0dG9uKVxufTtcbiIsIi8qXG4gKiBkZWZhdWx0L21vdXNlLXB1c2gtYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICAgIEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vLi4vYnV0dG9uJyk7XG5cbnZhciBNb3VzZVB1c2hCdXR0b24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmRlbGF5ID0gb3B0aW9ucy5kZWxheSA+IDAgPyBvcHRpb25zLmRlbGF5IDogMDtcbiAgICB0aGlzLmcgPSBudWxsO1xuICAgIGlmKHR5cGVvZiBvcHRpb25zLmcgPT09ICdmdW5jdGlvbicpIHRoaXMuZyA9IG9wdGlvbnMuZztcbiAgICB0aGlzLnByb21pc2VmID0gbnVsbDtcbiAgICB0aGlzLmJvdW5kYXJpZXMgPSB7IG1pblggOiAwLCBtYXhYIDogMCwgbWluWSA6IDAsIG1heFkgOiAwIH07XG4gICAgdGhpcy5sZWZ0T3JFbmRlZCA9IGZhbHNlO1xufTtcblxuTW91c2VQdXNoQnV0dG9uLnByb3RvdHlwZSA9IChmdW5jdGlvbiAocHJvdG8pIHtcbiAgICBmdW5jdGlvbiBGKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICByZXR1cm4gbmV3IEYoKTtcbn0pKEJ1dHRvbi5wcm90b3R5cGUpO1xuXG5Nb3VzZVB1c2hCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW91c2VQdXNoQnV0dG9uO1xuXG5Nb3VzZVB1c2hCdXR0b24ucHJvdG90eXBlLnNldEcgPSBmdW5jdGlvbiAoZykge1xuICAgIGlmICh0eXBlb2YgZyAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnV0dG9uIHNldEcgbWV0aG9kIG5lZWRzIGEgZyBmdW5jdGlvbiBhcyBhcmd1bWVudC5cIik7XG4gICAgdGhpcy5nID0gZztcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbk1vdXNlUHVzaEJ1dHRvbi5wcm90b3R5cGUuX2lzSW5BY3RpdmVab25lID0gZnVuY3Rpb24gKHRvdWNoKSB7XG4gICAgdmFyIHggPSB0b3VjaC5jbGllbnRYLFxuICAgICAgICB5ID0gdG91Y2guY2xpZW50WSxcbiAgICAgICAgYiA9IHRoaXMuYm91bmRhcmllcztcbiAgICByZXR1cm4geCA8IGIubWF4WCAmJiB4ID4gYi5taW5YICYmIHkgPCBiLm1heFkgJiYgeSA+IGIubWluWTtcbn07XG5cbk1vdXNlUHVzaEJ1dHRvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmJpbmQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLmJpbmRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Nb3VzZVB1c2hCdXR0b24ucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLnVuYmluZC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuYmluZGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Nb3VzZVB1c2hCdXR0b24ucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHN3aXRjaCAoZXZ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgICAgICAgIHRoaXMub25Nb3VzZWRvd24oZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb3VzZW1vdmUnOlxuICAgICAgICAgICAgdGhpcy5vbk1vdXNlbW92ZShldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vdXNldXAnOlxuICAgICAgICAgICAgdGhpcy5vbk1vdXNldXAoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbk1vdXNlUHVzaEJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZWRvd24gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgICAgICBpZiAoZXZ0LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgIHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1pblggPSBib3VuZGluZ1JlY3QubGVmdDtcbiAgICAgICAgICAgIHRoaXMuYm91bmRhcmllcy5tYXhYID0gYm91bmRpbmdSZWN0LmxlZnQgKyBib3VuZGluZ1JlY3Qud2lkdGg7XG4gICAgICAgICAgICB0aGlzLmJvdW5kYXJpZXMubWluWSA9IGJvdW5kaW5nUmVjdC50b3A7XG4gICAgICAgICAgICB0aGlzLmJvdW5kYXJpZXMubWF4WSA9IGJvdW5kaW5nUmVjdC5ib3R0b207XG4gICAgICAgICAgICB0aGlzLmVsLm93bmVyRG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5lbC5vd25lckRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLnByb21pc2VmID0gUS5kZWxheShldnQsIHRoaXMuZGVsYXkpLnRoZW4odGhpcy5mKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbk1vdXNlUHVzaEJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZW1vdmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYodGhpcy5hY3RpdmUgJiYgIXRoaXMubGVmdE9yRW5kZWQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5faXNJbkFjdGl2ZVpvbmUoZXZ0KSlcbiAgICAgICAgICAgIHRoaXMub25Nb3VzZXVwKGV2dCk7XG4gICAgfVxufTtcblxuTW91c2VQdXNoQnV0dG9uLnByb3RvdHlwZS5vbk1vdXNldXAgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYodGhpcy5hY3RpdmUgJiYgIXRoaXMubGVmdE9yRW5kZWQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlQ2xzKCk7XG4gICAgICAgIHRoaXMubGVmdE9yRW5kZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnByb21pc2VmXG4gICAgICAgICAgICAgICAgLnRoZW4oZXZ0KVxuICAgICAgICAgICAgICAgIC50aGVuKHRoaXMuZylcbiAgICAgICAgICAgICAgICAuZmluYWxseSh0aGlzLl9kb25lKGV2dCkpXG4gICAgICAgICAgICAgICAgLmRvbmUoKTtcbiAgICB9XG59O1xuXG5Nb3VzZVB1c2hCdXR0b24ucHJvdG90eXBlLl9kb25lID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBidG4gPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGJ0bi5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICBidG4ubGVmdE9yRW5kZWQgPSBmYWxzZTtcbiAgICAgICAgYnRuLmVsLm93bmVyRG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgYnRuLCBmYWxzZSk7XG4gICAgICAgIGJ0bi5lbC5vd25lckRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBidG4sIGZhbHNlKTtcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb3VzZVB1c2hCdXR0b247XG4iLCIvKlxuICogZGVmYXVsdC9tb3VzZWRvd24tYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICAgIEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vLi4vYnV0dG9uJyk7XG5cbnZhciBNb3VzZWRvd25CdXR0b24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmRlbGF5ID0gb3B0aW9ucy5kZWxheSA+IDAgPyBvcHRpb25zLmRlbGF5IDogMDtcbn07XG5cbk1vdXNlZG93bkJ1dHRvbi5wcm90b3R5cGUgPSAoZnVuY3Rpb24gKHByb3RvKSB7XG4gICAgZnVuY3Rpb24gRigpIHt9O1xuICAgIEYucHJvdG90eXBlID0gcHJvdG87XG4gICAgcmV0dXJuIG5ldyBGKCk7XG59KShCdXR0b24ucHJvdG90eXBlKTtcblxuTW91c2Vkb3duQnV0dG9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vdXNlZG93bkJ1dHRvbjtcblxuTW91c2Vkb3duQnV0dG9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuYmluZC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuYmluZGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbk1vdXNlZG93bkJ1dHRvbi5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kLmNhbGwodGhpcyk7XG4gICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5iaW5kZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbk1vdXNlZG93bkJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgc3dpdGNoKGV2dC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgICAgICB0aGlzLm9uTW91c2Vkb3duKGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBfZG9uZShidG4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyBidG4uc2V0QWN0aXZlKGZhbHNlKTsgfTtcbn07XG5cbk1vdXNlZG93bkJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZWRvd24gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgICAgICBpZiAoZXZ0LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgICAgICAgdmFyIGJ0biA9IHRoaXM7XG4gICAgICAgICAgICBidG4uc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgUS5kZWxheShldnQsIGJ0bi5kZWxheSkudGhlbihidG4uZikuZmluYWxseShfZG9uZShidG4pKS5kb25lKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlZG93bkJ1dHRvbjtcbiIsIi8qXG4gKiBkZWZhdWx0L21vdXNldXAtYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICAgIEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vLi4vYnV0dG9uJyk7XG5cbnZhciBNb3VzZXVwQnV0dG9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5hY3RpdmVCb3JkZXIgPSBvcHRpb25zLmFjdGl2ZUJvcmRlciB8fCA1MDtcbiAgICB0aGlzLmJvdW5kYXJpZXMgPSB7IG1pblggOiAwLCBtYXhYIDogMCwgbWluWSA6IDAsIG1heFkgOiAwIH07XG4gICAgdGhpcy5jbGlja2VkID0gZmFsc2U7XG59O1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZSA9IChmdW5jdGlvbiAocHJvdG8pIHtcbiAgICBmdW5jdGlvbiBGKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICByZXR1cm4gbmV3IEYoKTtcbn0pKEJ1dHRvbi5wcm90b3R5cGUpO1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vdXNldXBCdXR0b247XG5cbk1vdXNldXBCdXR0b24ucHJvdG90eXBlLnNldEFjdGl2ZUJvcmRlciA9IGZ1bmN0aW9uIChsZW4pIHtcbiAgICB0aGlzLmFjdGl2ZUJvcmRlciA9IGxlbjtcbn07XG5cbk1vdXNldXBCdXR0b24ucHJvdG90eXBlLl9pc0luQWN0aXZlWm9uZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIgeCA9IGV2dC5jbGllbnRYLFxuICAgICAgICB5ID0gZXZ0LmNsaWVudFksXG4gICAgICAgIGIgPSB0aGlzLmJvdW5kYXJpZXM7XG4gICAgcmV0dXJuIHggPCBiLm1heFggJiYgeCA+IGIubWluWCAmJiB5IDwgYi5tYXhZICYmIHkgPiBiLm1pblk7XG59O1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuYmluZC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuYmluZGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbk1vdXNldXBCdXR0b24ucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLnVuYmluZC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuYmluZGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBzd2l0Y2ggKGV2dC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ21vdXNlZG93bic6XG4gICAgICAgICAgICB0aGlzLm9uTW91c2Vkb3duKGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbW91c2Vtb3ZlJzpcbiAgICAgICAgICAgIHRoaXMub25Nb3VzZW1vdmUoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb3VzZXVwJzpcbiAgICAgICAgICAgIHRoaXMub25Nb3VzZXVwKGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZS5vbk1vdXNlZG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgICAgIGlmIChldnQuYnV0dG9uID09PSAwKSB7XG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyT25Nb3VzZXVwID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1pblggPSBib3VuZGluZ1JlY3QubGVmdCAtIHRoaXMuYWN0aXZlQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1heFggPSBib3VuZGluZ1JlY3QubGVmdCArIGJvdW5kaW5nUmVjdC53aWR0aCArIHRoaXMuYWN0aXZlQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1pblkgPSBib3VuZGluZ1JlY3QudG9wIC0gdGhpcy5hY3RpdmVCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmJvdW5kYXJpZXMubWF4WSA9IGJvdW5kaW5nUmVjdC5ib3R0b20gKyAgdGhpcy5hY3RpdmVCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmVsLm93bmVyRG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5lbC5vd25lckRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZS5vbk1vdXNlbW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUgJiYgIXRoaXMuY2xpY2tlZCkge1xuICAgICAgICBpZiAodGhpcy5faXNJbkFjdGl2ZVpvbmUoZXZ0KSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyT25Nb3VzZXVwID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2FkZENscygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyT25Nb3VzZXVwID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbk1vdXNldXBCdXR0b24ucHJvdG90eXBlLl9kb25lID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBidG4gPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7IGJ0bi5vbk1vdXNlY2FuY2VsKGV2dCk7IH07XG59O1xuXG5Nb3VzZXVwQnV0dG9uLnByb3RvdHlwZS5vbk1vdXNldXAgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgICAgIGlmICh0aGlzLnRyaWdnZXJPbk1vdXNldXApIHtcbiAgICAgICAgICAgIHZhciBidG4gPSB0aGlzO1xuICAgICAgICAgICAgYnRuLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgICAgIGJ0bi5jbGlja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIFEoZXZ0KS50aGVuKGJ0bi5mKS5maW5hbGx5KGJ0bi5fZG9uZShldnQpKS5kb25lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uTW91c2VjYW5jZWwoZXZ0KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbk1vdXNldXBCdXR0b24ucHJvdG90eXBlLm9uTW91c2VjYW5jZWwgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdGhpcy5fcmVtb3ZlQ2xzKCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmNsaWNrZWQpIHRoaXMuY2xpY2tlZCA9IGZhbHNlO1xuICAgIHRoaXMuZWwub3duZXJEb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5lbC5vd25lckRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLCBmYWxzZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNldXBCdXR0b247XG4iLCIvKlxuICogc2Nyb2xsYWJsZS14L21vdXNldXAtYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBNb3VzZXVwQnV0dG9uID0gcmVxdWlyZSgnLi8uLi9kZWZhdWx0L21vdXNldXAtYnV0dG9uJyk7XG5cbnZhciBNb3VzZXVwT25TY3JvbGxhYmxlWEJ1dHRvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgTW91c2V1cEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLnRvbGVyYW5jZSA9IG9wdGlvbnMudG9sZXJhbmNlIHx8IDEwO1xufTtcblxuTW91c2V1cE9uU2Nyb2xsYWJsZVhCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoTW91c2V1cEJ1dHRvbi5wcm90b3R5cGUpO1xuXG5Nb3VzZXVwT25TY3JvbGxhYmxlWEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb3VzZXVwT25TY3JvbGxhYmxlWEJ1dHRvbjtcblxuTW91c2V1cE9uU2Nyb2xsYWJsZVhCdXR0b24ucHJvdG90eXBlLm9uTW91c2Vkb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuc3RhcnRYID0gZXZ0LmNsaWVudFg7XG4gICAgTW91c2V1cEJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZWRvd24uY2FsbCh0aGlzLCBldnQpO1xufTtcblxuTW91c2V1cE9uU2Nyb2xsYWJsZVhCdXR0b24ucHJvdG90eXBlLl9pc0luQWN0aXZlWm9uZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIgeSA9IGV2dC5jbGllbnRZLFxuICAgICAgICBkID0gTWF0aC5hYnMoZXZ0LmNsaWVudFggLSB0aGlzLnN0YXJ0WCksXG4gICAgICAgIGIgPSB0aGlzLmJvdW5kYXJpZXM7XG4gICAgcmV0dXJuIHkgPCBiLm1heFkgJiYgeSA+IGIubWluWSAmJiBkIDwgdGhpcy50b2xlcmFuY2U7XG59O1xuXG5Nb3VzZXVwT25TY3JvbGxhYmxlWEJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZW1vdmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0luQWN0aXZlWm9uZShldnQpKSB0aGlzLl9hZGRDbHMoKTtcbiAgICAgICAgZWxzZSB0aGlzLm9uTW91c2VjYW5jZWwuY2FsbCh0aGlzLCBldnQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2V1cE9uU2Nyb2xsYWJsZVhCdXR0b247XG4iLCIvKlxuICogc2Nyb2xsYWJsZS15L21vdXNldXAtYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBNb3VzZXVwQnV0dG9uID0gcmVxdWlyZSgnLi8uLi9kZWZhdWx0L21vdXNldXAtYnV0dG9uJyk7XG5cbnZhciBNb3VzZXVwT25TY3JvbGxhYmxlWUJ1dHRvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgTW91c2V1cEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLnRvbGVyYW5jZSA9IG9wdGlvbnMudG9sZXJhbmNlIHx8IDEwO1xufTtcblxuTW91c2V1cE9uU2Nyb2xsYWJsZVlCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoTW91c2V1cEJ1dHRvbi5wcm90b3R5cGUpO1xuXG5Nb3VzZXVwT25TY3JvbGxhYmxlWUJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb3VzZXVwT25TY3JvbGxhYmxlWUJ1dHRvbjtcblxuTW91c2V1cE9uU2Nyb2xsYWJsZVlCdXR0b24ucHJvdG90eXBlLm9uTW91c2Vkb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuc3RhcnRZID0gZXZ0LmNsaWVudFk7XG4gICAgTW91c2V1cEJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZWRvd24uY2FsbCh0aGlzLCBldnQpO1xufTtcblxuTW91c2V1cE9uU2Nyb2xsYWJsZVlCdXR0b24ucHJvdG90eXBlLl9pc0luQWN0aXZlWm9uZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIgeCA9IGV2dC5jbGllbnRYLFxuICAgICAgICBkID0gTWF0aC5hYnMoZXZ0LmNsaWVudFkgLSB0aGlzLnN0YXJ0WSksXG4gICAgICAgIGIgPSB0aGlzLmJvdW5kYXJpZXM7XG4gICAgcmV0dXJuIHggPCBiLm1heFggJiYgeCA+IGIubWluWCAmJiBkIDwgdGhpcy50b2xlcmFuY2U7XG59O1xuXG5Nb3VzZXVwT25TY3JvbGxhYmxlWUJ1dHRvbi5wcm90b3R5cGUub25Nb3VzZW1vdmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0luQWN0aXZlWm9uZShldnQpKSB0aGlzLl9hZGRDbHMoKTtcbiAgICAgICAgZWxzZSB0aGlzLm9uTW91c2VjYW5jZWwuY2FsbCh0aGlzLCBldnQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2V1cE9uU2Nyb2xsYWJsZVlCdXR0b247XG4iLCIvKlxuICogZGVmYXVsdC9wb2ludGVyLXB1c2gtYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICAgIEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vLi4vYnV0dG9uJyk7XG5cbnZhciBQb2ludGVyUHVzaEJ1dHRvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgQnV0dG9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIHRoaXMuZGVsYXkgPSBvcHRpb25zLmRlbGF5ID4gMCA/IG9wdGlvbnMuZGVsYXkgOiAwO1xuICAgIHRoaXMuZyA9IG51bGw7XG4gICAgaWYodHlwZW9mIG9wdGlvbnMuZyA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5nID0gb3B0aW9ucy5nO1xuICAgIHRoaXMucHJvbWlzZWYgPSBudWxsO1xuICAgIHRoaXMuYm91bmRhcmllcyA9IHsgbWluWCA6IDAsIG1heFggOiAwLCBtaW5ZIDogMCwgbWF4WSA6IDAgfTtcbiAgICB0aGlzLmxlZnRPckVuZGVkID0gZmFsc2U7XG4gICAgdGhpcy5wb2ludGVySWQgPSBudWxsO1xufTtcblxuUG9pbnRlclB1c2hCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoQnV0dG9uLnByb3RvdHlwZSk7XG5cblBvaW50ZXJQdXNoQnV0dG9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50ZXJQdXNoQnV0dG9uO1xuXG5Qb2ludGVyUHVzaEJ1dHRvbi5wcm90b3R5cGUuc2V0RyA9IGZ1bmN0aW9uIChnKSB7XG4gICAgaWYgKHR5cGVvZiBnICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdXR0b24gc2V0RyBtZXRob2QgbmVlZHMgYSBnIGZ1bmN0aW9uIGFzIGFyZ3VtZW50LlwiKTtcbiAgICB0aGlzLmcgPSBnO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuUG9pbnRlclB1c2hCdXR0b24ucHJvdG90eXBlLl9pc0Rvd25Qb2ludGVySWQgPSBmdW5jdGlvbiAocG9pbnRlcklkKSB7XG4gICAgcmV0dXJuIHRoaXMucG9pbnRlcklkID09PSBwb2ludGVySWQ7XG59O1xuXG5Qb2ludGVyUHVzaEJ1dHRvbi5wcm90b3R5cGUuX2lzSW5BY3RpdmVab25lID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciB4ID0gZXZ0LmNsaWVudFgsXG4gICAgICAgIHkgPSBldnQuY2xpZW50WSxcbiAgICAgICAgYiA9IHRoaXMuYm91bmRhcmllcztcbiAgICByZXR1cm4geCA8IGIubWF4WCAmJiB4ID4gYi5taW5YICYmIHkgPCBiLm1heFkgJiYgeSA+IGIubWluWTtcbn07XG5cblBvaW50ZXJQdXNoQnV0dG9uLnByb3RvdHlwZS5fc2V0UG9pbnRlckNhcHR1cmUgPSBmdW5jdGlvbiAocG9pbnRlcklkKSB7XG4gICAgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudClcbiAgICAgICAgdGhpcy5lbC5tc1NldFBvaW50ZXJDYXB0dXJlKHBvaW50ZXJJZCk7XG4gICAgZWxzZVxuICAgICAgICB0aGlzLmVsLnNldFBvaW50ZXJDYXB0dXJlKHBvaW50ZXJJZCk7XG59O1xuXG5Qb2ludGVyUHVzaEJ1dHRvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmJpbmQuY2FsbCh0aGlzKTtcbiAgICBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIHRoaXMsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgdGhpcywgZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLmJpbmRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Qb2ludGVyUHVzaEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kLmNhbGwodGhpcyk7XG4gICAgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCkge1xuICAgICAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJVcCcsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJDYW5jZWwnLCB0aGlzLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIHRoaXMsIGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5iaW5kZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblBvaW50ZXJQdXNoQnV0dG9uLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBzd2l0Y2ggKGV2dC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ01TUG9pbnRlckRvd24nOlxuICAgICAgICBjYXNlICdwb2ludGVyZG93bic6XG4gICAgICAgICAgICB0aGlzLm9uUG9pbnRlcmRvd24oZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdNU1BvaW50ZXJNb3ZlJzpcbiAgICAgICAgY2FzZSAncG9pbnRlcm1vdmUnOlxuICAgICAgICAgICAgdGhpcy5vblBvaW50ZXJtb3ZlKGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTVNQb2ludGVyVXAnOlxuICAgICAgICBjYXNlICdwb2ludGVydXAnOlxuICAgICAgICAgICAgdGhpcy5vblBvaW50ZXJ1cChldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ01TUG9pbnRlckNhbmNlbCc6XG4gICAgICAgIGNhc2UgJ3BvaW50ZXJjYW5jZWwnOlxuICAgICAgICAgICAgdGhpcy5vblBvaW50ZXJjYW5jZWwoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cblBvaW50ZXJQdXNoQnV0dG9uLnByb3RvdHlwZS5vblBvaW50ZXJkb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmKCF0aGlzLmFjdGl2ZSAmJiAoIXRoaXMubW9ub3RvdWNoYWJsZSB8fCAhdGhpcy5pc0xvY2tlZCgpKSkge1xuICAgICAgICBpZih0aGlzLm1vbm90b3VjaGFibGUpIHRoaXMubG9jaygpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgdGhpcy5wb2ludGVySWQgPSBldnQucG9pbnRlcklkO1xuICAgICAgICB0aGlzLl9zZXRQb2ludGVyQ2FwdHVyZShldnQucG9pbnRlcklkKTtcbiAgICAgICAgdmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5taW5YID0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5tYXhYID0gYm91bmRpbmdSZWN0LmxlZnQgKyBib3VuZGluZ1JlY3Qud2lkdGg7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5taW5ZID0gYm91bmRpbmdSZWN0LnRvcDtcbiAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1heFkgPSBib3VuZGluZ1JlY3QuYm90dG9tO1xuICAgICAgICB0aGlzLnByb21pc2VmID0gUS5kZWxheShldnQsIHRoaXMuZGVsYXkpLnRoZW4odGhpcy5mKTtcbiAgICB9XG59O1xuXG5Qb2ludGVyUHVzaEJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVybW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUgJiYgIXRoaXMubGVmdE9yRW5kZWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzRG93blBvaW50ZXJJZChldnQucG9pbnRlcklkKSkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzSW5BY3RpdmVab25lKGV2dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxlZnRPckVuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnByb21pc2VmXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihldnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbih0aGlzLmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluYWxseSh0aGlzLl9kb25lKGV2dCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuUG9pbnRlclB1c2hCdXR0b24ucHJvdG90eXBlLl9kb25lID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBidG4gPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGJ0bi5vblBvaW50ZXJjYW5jZWwoZXZ0KTtcbiAgICB9O1xufTtcblxuUG9pbnRlclB1c2hCdXR0b24ucHJvdG90eXBlLm9uUG9pbnRlcnVwID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZSAmJiAhdGhpcy5sZWZ0T3JFbmRlZCkge1xuICAgICAgICBpZiAodGhpcy5faXNEb3duUG9pbnRlcklkKGV2dC5wb2ludGVySWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgICAgIHRoaXMubGVmdE9yRW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5wcm9taXNlZlxuICAgICAgICAgICAgICAgICAgICAudGhlbihldnQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHRoaXMuZylcbiAgICAgICAgICAgICAgICAgICAgLmZpbmFsbHkodGhpcy5fZG9uZShldnQpKVxuICAgICAgICAgICAgICAgICAgICAuZG9uZSgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuUG9pbnRlclB1c2hCdXR0b24ucHJvdG90eXBlLm9uUG9pbnRlcmNhbmNlbCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB0aGlzLnNldEFjdGl2ZShmYWxzZSk7XG4gICAgaWYodGhpcy5tb25vdG91Y2hhYmxlKSB0aGlzLnVubG9jaygpO1xuICAgIHRoaXMubGVmdE9yRW5kZWQgPSBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnRlclB1c2hCdXR0b247XG4iLCIvKlxuICogZGVmYXVsdC9wb2ludGVyZG93bi1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFEgPSByZXF1aXJlKCdxJyksXG4gICAgQnV0dG9uID0gcmVxdWlyZSgnLi8uLi8uLi9idXR0b24nKTtcblxudmFyIFBvaW50ZXJkb3duQnV0dG9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5kZWxheSA9IG9wdGlvbnMuZGVsYXkgPiAwID8gb3B0aW9ucy5kZWxheSA6IDA7XG59O1xuXG5Qb2ludGVyZG93bkJ1dHRvbi5wcm90b3R5cGUgPSAoZnVuY3Rpb24gKHByb3RvKSB7XG4gICAgZnVuY3Rpb24gRigpIHt9O1xuICAgIEYucHJvdG90eXBlID0gcHJvdG87XG4gICAgcmV0dXJuIG5ldyBGKCk7XG59KShCdXR0b24ucHJvdG90eXBlKTtcblxuUG9pbnRlcmRvd25CdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRlcmRvd25CdXR0b247XG5cblBvaW50ZXJkb3duQnV0dG9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuYmluZC5jYWxsKHRoaXMpO1xuICAgIGlmICh3aW5kb3cuTVNQb2ludGVyRXZlbnQpXG4gICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIHRoaXMsIGZhbHNlKTtcbiAgICBlbHNlXG4gICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCB0aGlzLCBmYWxzZSk7O1xuICAgIHRoaXMuYmluZGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblBvaW50ZXJkb3duQnV0dG9uLnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgQnV0dG9uLnByb3RvdHlwZS51bmJpbmQuY2FsbCh0aGlzKTtcbiAgICBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KVxuICAgICAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCB0aGlzLCBmYWxzZSk7XG4gICAgZWxzZVxuICAgICAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgdGhpcywgZmFsc2UpOztcbiAgICB0aGlzLmJpbmRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuUG9pbnRlcmRvd25CdXR0b24ucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHN3aXRjaChldnQudHlwZSkge1xuICAgICAgICBjYXNlICdNU1BvaW50ZXJEb3duJzpcbiAgICAgICAgY2FzZSAncG9pbnRlcmRvd24nOlxuICAgICAgICAgICAgdGhpcy5vblBvaW50ZXJkb3duKGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBfZG9uZShidG4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZihidG4ubW9ub3RvdWNoYWJsZSkgYnRuLnVubG9jaygpO1xuICAgICAgICBidG4uc2V0QWN0aXZlKGZhbHNlKTtcbiAgICB9O1xufTtcblxuUG9pbnRlcmRvd25CdXR0b24ucHJvdG90eXBlLm9uUG9pbnRlcmRvd24gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSAmJiAoIXRoaXMubW9ub3RvdWNoYWJsZSB8fCAhdGhpcy5pc0xvY2tlZCgpKSkge1xuICAgICAgICB2YXIgYnRuID0gdGhpcztcbiAgICAgICAgaWYoYnRuLm1vbm90b3VjaGFibGUpIGJ0bi5sb2NrKCk7XG4gICAgICAgIGJ0bi5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIFEuZGVsYXkoZXZ0LCBidG4uZGVsYXkpLnRoZW4oYnRuLmYpLmZpbmFsbHkoX2RvbmUoYnRuKSkuZG9uZSgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnRlcmRvd25CdXR0b247XG4iLCIvKlxuICogZGVmYXVsdC9wb2ludGVydXAtYnV0dG9uLmpzXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBRID0gcmVxdWlyZSgncScpLFxuICAgIEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vLi4vYnV0dG9uJyk7XG5cbnZhciBQb2ludGVydXBCdXR0b24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmFjdGl2ZUJvcmRlciA9IG9wdGlvbnMuYWN0aXZlQm9yZGVyIHx8IDUwO1xuICAgIHRoaXMuYm91bmRhcmllcyA9IHsgbWluWCA6IDAsIG1heFggOiAwLCBtaW5ZIDogMCwgbWF4WSA6IDAgfTtcbiAgICB0aGlzLnBvaW50ZXJJZCA9IG51bGw7XG59O1xuXG5Qb2ludGVydXBCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoQnV0dG9uLnByb3RvdHlwZSk7XG5cblBvaW50ZXJ1cEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludGVydXBCdXR0b247XG5cblBvaW50ZXJ1cEJ1dHRvbi5wcm90b3R5cGUuc2V0QWN0aXZlQm9yZGVyID0gZnVuY3Rpb24gKGxlbikge1xuICAgIHRoaXMuYWN0aXZlQm9yZGVyID0gbGVuO1xufTtcblxuUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZS5faXNEb3duUG9pbnRlcklkID0gZnVuY3Rpb24gKHBvaW50ZXJJZCkge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJJZCA9PT0gcG9pbnRlcklkO1xufTtcblxuUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZS5faXNJbkFjdGl2ZVpvbmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIHggPSBldnQuY2xpZW50WCxcbiAgICAgICAgeSA9IGV2dC5jbGllbnRZLFxuICAgICAgICBiID0gdGhpcy5ib3VuZGFyaWVzO1xuICAgIHJldHVybiB4IDwgYi5tYXhYICYmIHggPiBiLm1pblggJiYgeSA8IGIubWF4WSAmJiB5ID4gYi5taW5ZO1xufTtcblxuUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZS5fc2V0UG9pbnRlckNhcHR1cmUgPSBmdW5jdGlvbiAocG9pbnRlcklkKSB7XG4gICAgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudClcbiAgICAgICAgdGhpcy5lbC5tc1NldFBvaW50ZXJDYXB0dXJlKHBvaW50ZXJJZCk7XG4gICAgZWxzZVxuICAgICAgICB0aGlzLmVsLnNldFBvaW50ZXJDYXB0dXJlKHBvaW50ZXJJZCk7XG59XG5cblBvaW50ZXJ1cEJ1dHRvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmJpbmQuY2FsbCh0aGlzKTtcbiAgICBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIHRoaXMsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgdGhpcywgZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLmJpbmRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Qb2ludGVydXBCdXR0b24ucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLnVuYmluZC5jYWxsKHRoaXMpO1xuICAgIGlmICh3aW5kb3cuTVNQb2ludGVyRXZlbnQpIHtcbiAgICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyVXAnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyQ2FuY2VsJywgdGhpcywgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgdGhpcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCB0aGlzLCBmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMuYmluZGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Qb2ludGVydXBCdXR0b24ucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHN3aXRjaCAoZXZ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSAnTVNQb2ludGVyRG93bic6XG4gICAgICAgIGNhc2UgJ3BvaW50ZXJkb3duJzpcbiAgICAgICAgICAgIHRoaXMub25Qb2ludGVyZG93bihldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ01TUG9pbnRlck1vdmUnOlxuICAgICAgICBjYXNlICdwb2ludGVybW92ZSc6XG4gICAgICAgICAgICB0aGlzLm9uUG9pbnRlcm1vdmUoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdNU1BvaW50ZXJVcCc6XG4gICAgICAgIGNhc2UgJ3BvaW50ZXJ1cCc6XG4gICAgICAgICAgICB0aGlzLm9uUG9pbnRlcnVwKGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTVNQb2ludGVyQ2FuY2VsJzpcbiAgICAgICAgY2FzZSAncG9pbnRlcmNhbmNlbCc6XG4gICAgICAgICAgICB0aGlzLm9uUG9pbnRlcmNhbmNlbChldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZS5vblBvaW50ZXJkb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICghdGhpcy5hY3RpdmUgICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKSB7XG4gICAgICAgIGlmKHRoaXMubW9ub3RvdWNoYWJsZSkgdGhpcy5sb2NrKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICB0aGlzLnBvaW50ZXJJZCA9IGV2dC5wb2ludGVySWQ7XG4gICAgICAgIHRoaXMuX3NldFBvaW50ZXJDYXB0dXJlKGV2dC5wb2ludGVySWQpO1xuICAgICAgICB0aGlzLnRyaWdnZXJPblBvaW50ZXJ1cCA9IHRydWU7XG4gICAgICAgIHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB0aGlzLmJvdW5kYXJpZXMubWluWCA9IGJvdW5kaW5nUmVjdC5sZWZ0IC0gdGhpcy5hY3RpdmVCb3JkZXI7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5tYXhYID0gYm91bmRpbmdSZWN0LmxlZnQgKyBib3VuZGluZ1JlY3Qud2lkdGggKyB0aGlzLmFjdGl2ZUJvcmRlcjtcbiAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1pblkgPSBib3VuZGluZ1JlY3QudG9wIC0gdGhpcy5hY3RpdmVCb3JkZXI7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5tYXhZID0gYm91bmRpbmdSZWN0LmJvdHRvbSArICB0aGlzLmFjdGl2ZUJvcmRlcjtcbiAgICB9XG59O1xuXG5Qb2ludGVydXBCdXR0b24ucHJvdG90eXBlLm9uUG9pbnRlcm1vdmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0Rvd25Qb2ludGVySWQoZXZ0LnBvaW50ZXJJZCkpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzSW5BY3RpdmVab25lKGV2dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJPblBvaW50ZXJ1cCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkQ2xzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlck9uUG9pbnRlcnVwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQ2xzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Qb2ludGVydXBCdXR0b24ucHJvdG90eXBlLl9kb25lID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBidG4gPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGJ0bi5vblBvaW50ZXJjYW5jZWwoZXZ0KTtcbiAgICB9O1xufTtcblxuUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZS5vblBvaW50ZXJ1cCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzRG93blBvaW50ZXJJZChldnQucG9pbnRlcklkKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlck9uUG9pbnRlcnVwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0biA9IHRoaXM7XG4gICAgICAgICAgICAgICAgYnRuLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgICAgICAgICBRKGV2dCkudGhlbihidG4uZikuZmluYWxseShidG4uX2RvbmUoZXZ0KSkuZG9uZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kb25lKGV2dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Qb2ludGVydXBCdXR0b24ucHJvdG90eXBlLm9uUG9pbnRlcmNhbmNlbCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB0aGlzLl9yZW1vdmVDbHMoKTtcbiAgICBpZih0aGlzLm1vbm90b3VjaGFibGUpIHRoaXMudW5sb2NrKCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludGVydXBCdXR0b247XG4iLCIvKlxuICogc2Nyb2xsYWJsZS14L3BvaW50ZXJ1cC1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFBvaW50ZXJ1cEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vZGVmYXVsdC9wb2ludGVydXAtYnV0dG9uJyk7XG5cbnZhciBQb2ludGVydXBPblNjcm9sbGFibGVYQnV0dG9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBQb2ludGVydXBCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy50b2xlcmFuY2UgPSBvcHRpb25zLnRvbGVyYW5jZSB8fCAxMDtcbn07XG5cblBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVhCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZSk7XG5cblBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVhCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRlcnVwT25TY3JvbGxhYmxlWEJ1dHRvbjtcblxuUG9pbnRlcnVwT25TY3JvbGxhYmxlWEJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVyZG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKVxuICAgICAgICB0aGlzLnN0YXJ0WCA9IGV2dC5jbGllbnRYO1xuICAgIFBvaW50ZXJ1cEJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVyZG93bi5jYWxsKHRoaXMsIGV2dCk7XG59O1xuXG5Qb2ludGVydXBPblNjcm9sbGFibGVYQnV0dG9uLnByb3RvdHlwZS5faXNJbkFjdGl2ZVpvbmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIHkgPSBldnQuY2xpZW50WSxcbiAgICAgICAgZCA9IE1hdGguYWJzKGV2dC5jbGllbnRYIC0gdGhpcy5zdGFydFgpLFxuICAgICAgICBiID0gdGhpcy5ib3VuZGFyaWVzO1xuICAgIHJldHVybiB5IDwgYi5tYXhZICYmIHkgPiBiLm1pblkgJiYgZCA8IHRoaXMudG9sZXJhbmNlO1xufTtcblxuUG9pbnRlcnVwT25TY3JvbGxhYmxlWEJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVybW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzRG93blBvaW50ZXJJZChldnQucG9pbnRlcklkKSkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNJbkFjdGl2ZVpvbmUoZXZ0KSkgdGhpcy5fYWRkQ2xzKCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuX2RvbmUuY2FsbCh0aGlzLCBldnQpKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVhCdXR0b247XG4iLCIvKlxuICogc2Nyb2xsYWJsZS15L3BvaW50ZXJ1cC1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFBvaW50ZXJ1cEJ1dHRvbiA9IHJlcXVpcmUoJy4vLi4vZGVmYXVsdC9wb2ludGVydXAtYnV0dG9uJyk7XG5cbnZhciBQb2ludGVydXBPblNjcm9sbGFibGVZQnV0dG9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBQb2ludGVydXBCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy50b2xlcmFuY2UgPSBvcHRpb25zLnRvbGVyYW5jZSB8fCAxMDtcbn07XG5cblBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVlCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoUG9pbnRlcnVwQnV0dG9uLnByb3RvdHlwZSk7XG5cblBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVlCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRlcnVwT25TY3JvbGxhYmxlWUJ1dHRvbjtcblxuUG9pbnRlcnVwT25TY3JvbGxhYmxlWUJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVyZG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKVxuICAgICAgICB0aGlzLnN0YXJ0WSA9IGV2dC5jbGllbnRZO1xuICAgIFBvaW50ZXJ1cEJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVyZG93bi5jYWxsKHRoaXMsIGV2dCk7XG59O1xuXG5Qb2ludGVydXBPblNjcm9sbGFibGVZQnV0dG9uLnByb3RvdHlwZS5faXNJbkFjdGl2ZVpvbmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIHggPSBldnQuY2xpZW50WCxcbiAgICAgICAgZCA9IE1hdGguYWJzKGV2dC5jbGllbnRZIC0gdGhpcy5zdGFydFkpLFxuICAgICAgICBiID0gdGhpcy5ib3VuZGFyaWVzO1xuICAgIHJldHVybiB4IDwgYi5tYXhYICYmIHggPiBiLm1pblggJiYgZCA8IHRoaXMudG9sZXJhbmNlO1xufTtcblxuUG9pbnRlcnVwT25TY3JvbGxhYmxlWUJ1dHRvbi5wcm90b3R5cGUub25Qb2ludGVybW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzRG93blBvaW50ZXJJZChldnQucG9pbnRlcklkKSkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNJbkFjdGl2ZVpvbmUoZXZ0KSkgdGhpcy5fYWRkQ2xzKCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuX2RvbmUuY2FsbCh0aGlzLCBldnQpKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50ZXJ1cE9uU2Nyb2xsYWJsZVlCdXR0b247XG4iLCIvKlxuICogZGVmYXVsdC90b3VjaC1wdXNoLWJ1dHRvbi5qc1xuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgUSA9IHJlcXVpcmUoJ3EnKSxcbiAgICBCdXR0b24gPSByZXF1aXJlKCcuLy4uLy4uL2J1dHRvbicpO1xuXG52YXIgVG91Y2hQdXNoQnV0dG9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5kZWxheSA9IG9wdGlvbnMuZGVsYXkgPiAwID8gb3B0aW9ucy5kZWxheSA6IDA7XG4gICAgdGhpcy5nID0gbnVsbDtcbiAgICBpZih0eXBlb2Ygb3B0aW9ucy5nID09PSAnZnVuY3Rpb24nKSB0aGlzLmcgPSBvcHRpb25zLmc7XG4gICAgdGhpcy5wcm9taXNlZiA9IG51bGw7XG4gICAgdGhpcy5ib3VuZGFyaWVzID0geyBtaW5YIDogMCwgbWF4WCA6IDAsIG1pblkgOiAwLCBtYXhZIDogMCB9O1xuICAgIHRoaXMubGVmdE9yRW5kZWQgPSBmYWxzZTtcbiAgICB0aGlzLmlkZW50aWZpZXIgPSBudWxsO1xufTtcblxuVG91Y2hQdXNoQnV0dG9uLnByb3RvdHlwZSA9IChmdW5jdGlvbiAocHJvdG8pIHtcbiAgICBmdW5jdGlvbiBGKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICByZXR1cm4gbmV3IEYoKTtcbn0pKEJ1dHRvbi5wcm90b3R5cGUpO1xuXG5Ub3VjaFB1c2hCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVG91Y2hQdXNoQnV0dG9uO1xuXG5Ub3VjaFB1c2hCdXR0b24ucHJvdG90eXBlLnNldEcgPSBmdW5jdGlvbiAoZykge1xuICAgIGlmICh0eXBlb2YgZyAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnV0dG9uIHNldEcgbWV0aG9kIG5lZWRzIGEgZyBmdW5jdGlvbiBhcyBhcmd1bWVudC5cIik7XG4gICAgdGhpcy5nID0gZztcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRvdWNoUHVzaEJ1dHRvbi5wcm90b3R5cGUuX2dldFRvdWNoID0gZnVuY3Rpb24gKGNoYW5nZWRUb3VjaGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllciA9PT0gdGhpcy5pZGVudGlmaWVyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG5Ub3VjaFB1c2hCdXR0b24ucHJvdG90eXBlLl9pc0luQWN0aXZlWm9uZSA9IGZ1bmN0aW9uICh0b3VjaCkge1xuICAgIHZhciB4ID0gdG91Y2guY2xpZW50WCxcbiAgICAgICAgeSA9IHRvdWNoLmNsaWVudFksXG4gICAgICAgIGIgPSB0aGlzLmJvdW5kYXJpZXM7XG4gICAgcmV0dXJuIHggPCBiLm1heFggJiYgeCA+IGIubWluWCAmJiB5IDwgYi5tYXhZICYmIHkgPiBiLm1pblk7XG59O1xuXG5Ub3VjaFB1c2hCdXR0b24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgQnV0dG9uLnByb3RvdHlwZS5iaW5kLmNhbGwodGhpcyk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLmJpbmRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Ub3VjaFB1c2hCdXR0b24ucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLnVuYmluZC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5iaW5kZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblRvdWNoUHVzaEJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgc3dpdGNoKGV2dC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3RvdWNoc3RhcnQnOlxuICAgICAgICAgICAgdGhpcy5vblRvdWNoc3RhcnQoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd0b3VjaG1vdmUnOlxuICAgICAgICAgICAgdGhpcy5vblRvdWNobW92ZShldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RvdWNoZW5kJzpcbiAgICAgICAgICAgIHRoaXMub25Ub3VjaGVuZChldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RvdWNoY2FuY2VsJzpcbiAgICAgICAgICAgIHRoaXMub25Ub3VjaGNhbmNlbChldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuVG91Y2hQdXNoQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKSB7XG4gICAgICAgIGlmKHRoaXMubW9ub3RvdWNoYWJsZSkgdGhpcy5sb2NrKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICB0aGlzLmlkZW50aWZpZXIgPSBldnQuY2hhbmdlZFRvdWNoZXNbMF0uaWRlbnRpZmllcjtcbiAgICAgICAgdmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5taW5YID0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5tYXhYID0gYm91bmRpbmdSZWN0LmxlZnQgKyBib3VuZGluZ1JlY3Qud2lkdGg7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5taW5ZID0gYm91bmRpbmdSZWN0LnRvcDtcbiAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1heFkgPSBib3VuZGluZ1JlY3QuYm90dG9tO1xuICAgICAgICB0aGlzLnByb21pc2VmID0gUS5kZWxheShldnQsIHRoaXMuZGVsYXkpLnRoZW4odGhpcy5mKTtcbiAgICB9XG59O1xuXG5Ub3VjaFB1c2hCdXR0b24ucHJvdG90eXBlLm9uVG91Y2htb3ZlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmKHRoaXMuYWN0aXZlICYmICF0aGlzLmxlZnRPckVuZGVkKSB7XG4gICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX2dldFRvdWNoKGV2dC5jaGFuZ2VkVG91Y2hlcyk7XG4gICAgICAgIGlmICh0b3VjaCkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZighdGhpcy5faXNJbkFjdGl2ZVpvbmUodG91Y2gpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQ2xzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sZWZ0T3JFbmRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9taXNlZlxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZXZ0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odGhpcy5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmFsbHkodGhpcy5fZG9uZShldnQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmRvbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cblRvdWNoUHVzaEJ1dHRvbi5wcm90b3R5cGUuX2RvbmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIGJ0biA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYnRuLm9uVG91Y2hjYW5jZWwoZXZ0KTtcbiAgICB9O1xufTtcblxuVG91Y2hQdXNoQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoZW5kID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmKHRoaXMuYWN0aXZlICYmICF0aGlzLmxlZnRPckVuZGVkKSB7XG4gICAgICAgIGlmICh0aGlzLl9nZXRUb3VjaChldnQuY2hhbmdlZFRvdWNoZXMpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgICAgIHRoaXMubGVmdE9yRW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5wcm9taXNlZlxuICAgICAgICAgICAgICAgICAgICAudGhlbihldnQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHRoaXMuZylcbiAgICAgICAgICAgICAgICAgICAgLmZpbmFsbHkodGhpcy5fZG9uZShldnQpKVxuICAgICAgICAgICAgICAgICAgICAuZG9uZSgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuVG91Y2hQdXNoQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoY2FuY2VsID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHRoaXMuc2V0QWN0aXZlKGZhbHNlKTtcbiAgICBpZih0aGlzLm1vbm90b3VjaGFibGUpIHRoaXMudW5sb2NrKCk7XG4gICAgdGhpcy5sZWZ0T3JFbmRlZCA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3VjaFB1c2hCdXR0b247XG4iLCIvKlxuICogZGVmYXVsdC90b3VjaGVuZC1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFEgPSByZXF1aXJlKCdxJyksXG4gICAgQnV0dG9uID0gcmVxdWlyZSgnLi8uLi8uLi9idXR0b24nKTtcblxudmFyIFRvdWNoZW5kQnV0dG9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5hY3RpdmVCb3JkZXIgPSBvcHRpb25zLmFjdGl2ZUJvcmRlciB8fCA1MDtcbiAgICB0aGlzLmJvdW5kYXJpZXMgPSB7IG1pblggOiAwLCBtYXhYIDogMCwgbWluWSA6IDAsIG1heFkgOiAwIH07XG4gICAgdGhpcy5pZGVudGlmaWVyID0gbnVsbDtcbn07XG5cblRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZSA9IChmdW5jdGlvbiAocHJvdG8pIHtcbiAgICBmdW5jdGlvbiBGKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICByZXR1cm4gbmV3IEYoKTtcbn0pKEJ1dHRvbi5wcm90b3R5cGUpO1xuXG5Ub3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUb3VjaGVuZEJ1dHRvbjtcblxuVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLnNldEFjdGl2ZUJvcmRlciA9IGZ1bmN0aW9uIChsZW4pIHtcbiAgICB0aGlzLmFjdGl2ZUJvcmRlciA9IGxlbjtcbn07XG5cblRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5fZ2V0VG91Y2ggPSBmdW5jdGlvbiAoY2hhbmdlZFRvdWNoZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjaGFuZ2VkVG91Y2hlc1tpXS5pZGVudGlmaWVyID09PSB0aGlzLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn07XG5cblRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5faXNJbkFjdGl2ZVpvbmUgPSBmdW5jdGlvbiAodG91Y2gpIHtcbiAgICB2YXIgeCA9IHRvdWNoLmNsaWVudFgsXG4gICAgICAgIHkgPSB0b3VjaC5jbGllbnRZLFxuICAgICAgICBiID0gdGhpcy5ib3VuZGFyaWVzO1xuICAgIHJldHVybiB4IDwgYi5tYXhYICYmIHggPiBiLm1pblggJiYgeSA8IGIubWF4WSAmJiB5ID4gYi5taW5ZO1xufTtcblxuVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgQnV0dG9uLnByb3RvdHlwZS5iaW5kLmNhbGwodGhpcyk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLmJpbmRlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Ub3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kLmNhbGwodGhpcyk7XG4gICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLmJpbmRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHN3aXRjaChldnQudHlwZSkge1xuICAgICAgICBjYXNlICd0b3VjaHN0YXJ0JzpcbiAgICAgICAgICAgIHRoaXMub25Ub3VjaHN0YXJ0KGV2dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndG91Y2htb3ZlJzpcbiAgICAgICAgICAgIHRoaXMub25Ub3VjaG1vdmUoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd0b3VjaGVuZCc6XG4gICAgICAgICAgICB0aGlzLm9uVG91Y2hlbmQoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd0b3VjaGNhbmNlbCc6XG4gICAgICAgICAgICB0aGlzLm9uVG91Y2hjYW5jZWwoZXZ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cblRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKSB7XG4gICAgICAgIGlmKHRoaXMubW9ub3RvdWNoYWJsZSkgdGhpcy5sb2NrKCk7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyT25Ub3VjaGVuZCA9IHRydWU7XG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IGV2dC5jaGFuZ2VkVG91Y2hlc1swXS5pZGVudGlmaWVyO1xuICAgICAgICB2YXIgYm91bmRpbmdSZWN0ID0gdGhpcy5lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdGhpcy5ib3VuZGFyaWVzLm1pblggPSBib3VuZGluZ1JlY3QubGVmdCAtIHRoaXMuYWN0aXZlQm9yZGVyO1xuICAgICAgICB0aGlzLmJvdW5kYXJpZXMubWF4WCA9IGJvdW5kaW5nUmVjdC5sZWZ0ICsgYm91bmRpbmdSZWN0LndpZHRoICsgdGhpcy5hY3RpdmVCb3JkZXI7XG4gICAgICAgIHRoaXMuYm91bmRhcmllcy5taW5ZID0gYm91bmRpbmdSZWN0LnRvcCAtIHRoaXMuYWN0aXZlQm9yZGVyO1xuICAgICAgICB0aGlzLmJvdW5kYXJpZXMubWF4WSA9IGJvdW5kaW5nUmVjdC5ib3R0b20gKyAgdGhpcy5hY3RpdmVCb3JkZXI7XG4gICAgICAgIHRoaXMuX2FkZENscygpO1xuICAgIH1cbn07XG5cblRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5vblRvdWNobW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZih0aGlzLmFjdGl2ZSkge1xuICAgICAgICB2YXIgdG91Y2ggPSB0aGlzLl9nZXRUb3VjaChldnQuY2hhbmdlZFRvdWNoZXMpO1xuICAgICAgICBpZiAodG91Y2gpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgaWYodGhpcy5faXNJbkFjdGl2ZVpvbmUodG91Y2gpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyT25Ub3VjaGVuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkQ2xzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJPblRvdWNoZW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQ2xzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Ub3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUuX2RvbmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIGJ0biA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYnRuLm9uVG91Y2hjYW5jZWwoZXZ0KTtcbiAgICB9O1xufTtcblxuVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLm9uVG91Y2hlbmQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYodGhpcy5hY3RpdmUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2dldFRvdWNoKGV2dC5jaGFuZ2VkVG91Y2hlcykpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJPblRvdWNoZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0biA9IHRoaXM7XG4gICAgICAgICAgICAgICAgYnRuLl9yZW1vdmVDbHMoKTtcbiAgICAgICAgICAgICAgICBRKGV2dCkudGhlbihidG4uZikuZmluYWxseShidG4uX2RvbmUoZXZ0KSkuZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZG9uZShldnQpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Ub3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUub25Ub3VjaGNhbmNlbCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB0aGlzLl9yZW1vdmVDbHMoKTtcbiAgICBpZih0aGlzLm1vbm90b3VjaGFibGUpIHRoaXMudW5sb2NrKCk7XG4gICAgaWYodGhpcy5hY3RpdmUpIHRoaXMuYWN0aXZlID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvdWNoZW5kQnV0dG9uO1xuIiwiLypcbiAqIGRlZmF1bHQvdG91Y2hzdGFydC1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFEgPSByZXF1aXJlKCdxJyksXG4gICAgQnV0dG9uID0gcmVxdWlyZSgnLi8uLi8uLi9idXR0b24nKTtcblxudmFyIFRvdWNoc3RhcnRCdXR0b24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLmRlbGF5ID0gb3B0aW9ucy5kZWxheSA+IDAgPyBvcHRpb25zLmRlbGF5IDogMDtcbn07XG5cblRvdWNoc3RhcnRCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoQnV0dG9uLnByb3RvdHlwZSk7XG5cblRvdWNoc3RhcnRCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVG91Y2hzdGFydEJ1dHRvbjtcblxuVG91Y2hzdGFydEJ1dHRvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBCdXR0b24ucHJvdG90eXBlLmJpbmQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5iaW5kZWQgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuVG91Y2hzdGFydEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKCkge1xuICAgIEJ1dHRvbi5wcm90b3R5cGUudW5iaW5kLmNhbGwodGhpcyk7XG4gICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcywgZmFsc2UpO1xuICAgIHRoaXMuYmluZGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5Ub3VjaHN0YXJ0QnV0dG9uLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBzd2l0Y2goZXZ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSAndG91Y2hzdGFydCc6XG4gICAgICAgICAgICB0aGlzLm9uVG91Y2hzdGFydChldnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gX2RvbmUoYnRuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoYnRuLm1vbm90b3VjaGFibGUpIGJ0bi51bmxvY2soKTtcbiAgICAgICAgYnRuLnNldEFjdGl2ZShmYWxzZSk7XG4gICAgfTtcbn07XG5cblRvdWNoc3RhcnRCdXR0b24ucHJvdG90eXBlLm9uVG91Y2hzdGFydCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKSB7XG4gICAgICAgIHZhciBidG4gPSB0aGlzO1xuICAgICAgICBpZihidG4ubW9ub3RvdWNoYWJsZSkgYnRuLmxvY2soKTtcbiAgICAgICAgYnRuLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgUS5kZWxheShldnQsIGJ0bi5kZWxheSkudGhlbihidG4uZikuZmluYWxseShfZG9uZShidG4pKS5kb25lKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3VjaHN0YXJ0QnV0dG9uO1xuIiwiLypcbiAqIHNjcm9sbGFibGUteC90b3VjaGVuZC1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFRvdWNoZW5kQnV0dG9uID0gcmVxdWlyZSgnLi8uLi9kZWZhdWx0L3RvdWNoZW5kLWJ1dHRvbicpO1xuXG52YXIgU2Nyb2xsYWJsZVhUb3VjaGVuZEJ1dHRvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy50b2xlcmFuY2UgPSBvcHRpb25zLnRvbGVyYW5jZSB8fCAxMDtcbn07XG5cblNjcm9sbGFibGVYVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlKTtcblxuU2Nyb2xsYWJsZVhUb3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY3JvbGxhYmxlWFRvdWNoZW5kQnV0dG9uO1xuXG5TY3JvbGxhYmxlWFRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKVxuICAgICAgICB0aGlzLnN0YXJ0WCA9IGV2dC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYO1xuICAgIFRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoc3RhcnQuY2FsbCh0aGlzLCBldnQpO1xufTtcblxuU2Nyb2xsYWJsZVhUb3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUuX2lzSW5BY3RpdmVab25lID0gZnVuY3Rpb24gKHRvdWNoKSB7XG4gICAgdmFyIHkgPSB0b3VjaC5jbGllbnRZLFxuICAgICAgICBkID0gTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHRoaXMuc3RhcnRYKSxcbiAgICAgICAgYiA9IHRoaXMuYm91bmRhcmllcztcbiAgICByZXR1cm4geSA8IGIubWF4WSAmJiB5ID4gYi5taW5ZICYmIGQgPCB0aGlzLnRvbGVyYW5jZTtcbn07XG5cblNjcm9sbGFibGVYVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLm9uVG91Y2htb3ZlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmKHRoaXMuYWN0aXZlKSB7XG4gICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX2dldFRvdWNoKGV2dC5jaGFuZ2VkVG91Y2hlcyk7XG4gICAgICAgIGlmICh0b3VjaCkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZih0aGlzLl9pc0luQWN0aXZlWm9uZSh0b3VjaCkpIHRoaXMuX2FkZENscygpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLl9kb25lLmNhbGwodGhpcywgZXZ0KSgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxhYmxlWFRvdWNoZW5kQnV0dG9uO1xuIiwiLypcbiAqIHNjcm9sbGFibGUteS90b3VjaGVuZC1idXR0b24uanNcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFRvdWNoZW5kQnV0dG9uID0gcmVxdWlyZSgnLi8uLi9kZWZhdWx0L3RvdWNoZW5kLWJ1dHRvbicpO1xuXG52YXIgU2Nyb2xsYWJsZVlUb3VjaGVuZEJ1dHRvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy50b2xlcmFuY2UgPSBvcHRpb25zLnRvbGVyYW5jZSB8fCAxMDtcbn07XG5cblNjcm9sbGFibGVZVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlID0gKGZ1bmN0aW9uIChwcm90bykge1xuICAgIGZ1bmN0aW9uIEYoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICAgIHJldHVybiBuZXcgRigpO1xufSkoVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlKTtcblxuU2Nyb2xsYWJsZVlUb3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY3JvbGxhYmxlWVRvdWNoZW5kQnV0dG9uO1xuXG5TY3JvbGxhYmxlWVRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYoIXRoaXMuYWN0aXZlICYmICghdGhpcy5tb25vdG91Y2hhYmxlIHx8ICF0aGlzLmlzTG9ja2VkKCkpKVxuICAgICAgICB0aGlzLnN0YXJ0WSA9IGV2dC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuICAgIFRvdWNoZW5kQnV0dG9uLnByb3RvdHlwZS5vblRvdWNoc3RhcnQuY2FsbCh0aGlzLCBldnQpO1xufTtcblxuU2Nyb2xsYWJsZVlUb3VjaGVuZEJ1dHRvbi5wcm90b3R5cGUuX2lzSW5BY3RpdmVab25lID0gZnVuY3Rpb24gKHRvdWNoKSB7XG4gICAgdmFyIHggPSB0b3VjaC5jbGllbnRYLFxuICAgICAgICBkID0gTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHRoaXMuc3RhcnRZKSxcbiAgICAgICAgYiA9IHRoaXMuYm91bmRhcmllcztcbiAgICByZXR1cm4geCA8IGIubWF4WCAmJiB4ID4gYi5taW5YICYmIGQgPCB0aGlzLnRvbGVyYW5jZTtcbn07XG5cblNjcm9sbGFibGVZVG91Y2hlbmRCdXR0b24ucHJvdG90eXBlLm9uVG91Y2htb3ZlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmKHRoaXMuYWN0aXZlKSB7XG4gICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX2dldFRvdWNoKGV2dC5jaGFuZ2VkVG91Y2hlcyk7XG4gICAgICAgIGlmICh0b3VjaCkge1xuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZih0aGlzLl9pc0luQWN0aXZlWm9uZSh0b3VjaCkpIHRoaXMuX2FkZENscygpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLl9kb25lLmNhbGwodGhpcywgZXZ0KSgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxhYmxlWVRvdWNoZW5kQnV0dG9uO1xuIiwiLy8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIFRoaXMgZmlsZSB3aWxsIGZ1bmN0aW9uIHByb3Blcmx5IGFzIGEgPHNjcmlwdD4gdGFnLCBvciBhIG1vZHVsZVxuICAgIC8vIHVzaW5nIENvbW1vbkpTIGFuZCBOb2RlSlMgb3IgUmVxdWlyZUpTIG1vZHVsZSBmb3JtYXRzLiAgSW5cbiAgICAvLyBDb21tb24vTm9kZS9SZXF1aXJlSlMsIHRoZSBtb2R1bGUgZXhwb3J0cyB0aGUgUSBBUEkgYW5kIHdoZW5cbiAgICAvLyBleGVjdXRlZCBhcyBhIHNpbXBsZSA8c2NyaXB0PiwgaXQgY3JlYXRlcyBhIFEgZ2xvYmFsIGluc3RlYWQuXG5cbiAgICAvLyBNb250YWdlIFJlcXVpcmVcbiAgICBpZiAodHlwZW9mIGJvb3RzdHJhcCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGJvb3RzdHJhcChcInByb21pc2VcIiwgZGVmaW5pdGlvbik7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcblxuICAgIC8vIFJlcXVpcmVKU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuXG4gICAgLy8gU0VTIChTZWN1cmUgRWNtYVNjcmlwdClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKCFzZXMub2soKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VzLm1ha2VRID0gZGVmaW5pdGlvbjtcbiAgICAgICAgfVxuXG4gICAgLy8gPHNjcmlwdD5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNlbGYuUSA9IGRlZmluaXRpb24oKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lhcHRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgICAgICB2YXIgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgICAgICAvLyBOb2RlLmpzIGJlZm9yZSAwLjkuIE5vdGUgdGhhdCBzb21lIGZha2UtTm9kZSBlbnZpcm9ubWVudHMsIGxpa2UgdGhlXG4gICAgICAgIC8vIE1vY2hhIHRlc3QgcnVubmVyLCBpbnRyb2R1Y2UgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAvLyBBdCBsZWFzdCBTYWZhcmkgVmVyc2lvbiA2LjAuNSAoODUzNi4zMC4xKSBpbnRlcm1pdHRlbnRseSBjYW5ub3QgY3JlYXRlXG4gICAgICAgIC8vIHdvcmtpbmcgbWVzc2FnZSBwb3J0cyB0aGUgZmlyc3QgdGltZSBhIHBhZ2UgbG9hZHMuXG4gICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSByZXF1ZXN0UG9ydFRpY2s7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlcXVlc3RQb3J0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcXVpcmVzIHVzIHRvIHByb3ZpZGUgYSBtZXNzYWdlIHBheWxvYWQsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgd2UgdXNlIGl0LlxuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgIHJlcXVlc3RQb3J0VGljaygpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHRUaWNrO1xufSkoKTtcblxuLy8gQXR0ZW1wdCB0byBtYWtlIGdlbmVyaWNzIHNhZmUgaW4gdGhlIGZhY2Ugb2YgZG93bnN0cmVhbVxuLy8gbW9kaWZpY2F0aW9ucy5cbi8vIFRoZXJlIGlzIG5vIHNpdHVhdGlvbiB3aGVyZSB0aGlzIGlzIG5lY2Vzc2FyeS5cbi8vIElmIHlvdSBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLCB0aGVzZSBwcmltb3JkaWFscyBuZWVkIHRvIGJlXG4vLyBkZWVwbHkgZnJvemVuIGFueXdheSwgYW5kIGlmIHlvdSBkb27igJl0IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsXG4vLyB0aGlzIGlzIGp1c3QgcGxhaW4gcGFyYW5vaWQuXG4vLyBIb3dldmVyLCB0aGlzICoqbWlnaHQqKiBoYXZlIHRoZSBuaWNlIHNpZGUtZWZmZWN0IG9mIHJlZHVjaW5nIHRoZSBzaXplIG9mXG4vLyB0aGUgbWluaWZpZWQgY29kZSBieSByZWR1Y2luZyB4LmNhbGwoKSB0byBtZXJlbHkgeCgpXG4vLyBTZWUgTWFyayBNaWxsZXLigJlzIGV4cGxhbmF0aW9uIG9mIHdoYXQgdGhpcyBkb2VzLlxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG52YXIgY2FsbCA9IEZ1bmN0aW9uLmNhbGw7XG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwuYXBwbHkoZiwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuLy8gVGhpcyBpcyBlcXVpdmFsZW50LCBidXQgc2xvd2VyOlxuLy8gdW5jdXJyeVRoaXMgPSBGdW5jdGlvbl9iaW5kLmJpbmQoRnVuY3Rpb25fYmluZC5jYWxsKTtcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3VuY3Vycnl0aGlzXG5cbnZhciBhcnJheV9zbGljZSA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5zbGljZSk7XG5cbnZhciBhcnJheV9yZWR1Y2UgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgYmFzaXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAvLyBjb25jZXJuaW5nIHRoZSBpbml0aWFsIHZhbHVlLCBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBzZWVrIHRvIHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXksIGFjY291bnRpbmdcbiAgICAgICAgICAgIC8vIGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBpcyBpcyBhIHNwYXJzZSBhcnJheVxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2lzID0gdGhpc1tpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkdWNlXG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgdGhlIGFycmF5IGlzIHNwYXJzZVxuICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICBiYXNpcyA9IGNhbGxiYWNrKGJhc2lzLCB0aGlzW2luZGV4XSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNpcztcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfaW5kZXhPZiA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBub3QgYSB2ZXJ5IGdvb2Qgc2hpbSwgYnV0IGdvb2QgZW5vdWdoIGZvciBvdXIgb25lIHVzZSBvZiBpdFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfbWFwID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNvbGxlY3QgPSBbXTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHNlbGYsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgY29sbGVjdC5wdXNoKGNhbGxiYWNrLmNhbGwodGhpc3AsIHZhbHVlLCBpbmRleCwgc2VsZikpO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICByZXR1cm4gY29sbGVjdDtcbiAgICB9XG4pO1xuXG52YXIgb2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSkge1xuICAgIGZ1bmN0aW9uIFR5cGUoKSB7IH1cbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICByZXR1cm4gbmV3IFR5cGUoKTtcbn07XG5cbnZhciBvYmplY3RfaGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxudmFyIG9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0X2hhc093blByb3BlcnR5KG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG52YXIgb2JqZWN0X3RvU3RyaW5nID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBPYmplY3QodmFsdWUpO1xufVxuXG4vLyBnZW5lcmF0b3IgcmVsYXRlZCBzaGltc1xuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgZnVuY3Rpb24gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuZnVuY3Rpb24gaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikge1xuICAgIHJldHVybiAoXG4gICAgICAgIG9iamVjdF90b1N0cmluZyhleGNlcHRpb24pID09PSBcIltvYmplY3QgU3RvcEl0ZXJhdGlvbl1cIiB8fFxuICAgICAgICBleGNlcHRpb24gaW5zdGFuY2VvZiBRUmV0dXJuVmFsdWVcbiAgICApO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaGVscGVyIGFuZCBRLnJldHVybiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpblxuLy8gU3BpZGVyTW9ua2V5LlxudmFyIFFSZXR1cm5WYWx1ZTtcbmlmICh0eXBlb2YgUmV0dXJuVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBSZXR1cm5WYWx1ZTtcbn0gZWxzZSB7XG4gICAgUVJldHVyblZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9O1xufVxuXG4vLyBsb25nIHN0YWNrIHRyYWNlc1xuXG52YXIgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgPSBcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCI7XG5cbmZ1bmN0aW9uIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSkge1xuICAgIC8vIElmIHBvc3NpYmxlLCB0cmFuc2Zvcm0gdGhlIGVycm9yIHN0YWNrIHRyYWNlIGJ5IHJlbW92aW5nIE5vZGUgYW5kIFFcbiAgICAvLyBjcnVmdCwgdGhlbiBjb25jYXRlbmF0aW5nIHdpdGggdGhlIHN0YWNrIHRyYWNlIG9mIGBwcm9taXNlYC4gU2VlICM1Ny5cbiAgICBpZiAoaGFzU3RhY2tzICYmXG4gICAgICAgIHByb21pc2Uuc3RhY2sgJiZcbiAgICAgICAgdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgICAgIGVycm9yLnN0YWNrICYmXG4gICAgICAgIGVycm9yLnN0YWNrLmluZGV4T2YoU1RBQ0tfSlVNUF9TRVBBUkFUT1IpID09PSAtMVxuICAgICkge1xuICAgICAgICB2YXIgc3RhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIHAgPSBwcm9taXNlOyAhIXA7IHAgPSBwLnNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHAuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBzdGFja3MudW5zaGlmdChwLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFja3MudW5zaGlmdChlcnJvci5zdGFjayk7XG5cbiAgICAgICAgdmFyIGNvbmNhdGVkU3RhY2tzID0gc3RhY2tzLmpvaW4oXCJcXG5cIiArIFNUQUNLX0pVTVBfU0VQQVJBVE9SICsgXCJcXG5cIik7XG4gICAgICAgIGVycm9yLnN0YWNrID0gZmlsdGVyU3RhY2tTdHJpbmcoY29uY2F0ZWRTdGFja3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyU3RhY2tTdHJpbmcoc3RhY2tTdHJpbmcpIHtcbiAgICB2YXIgbGluZXMgPSBzdGFja1N0cmluZy5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZGVzaXJlZExpbmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgIGlmICghaXNJbnRlcm5hbEZyYW1lKGxpbmUpICYmICFpc05vZGVGcmFtZShsaW5lKSAmJiBsaW5lKSB7XG4gICAgICAgICAgICBkZXNpcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzaXJlZExpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUZyYW1lKHN0YWNrTGluZSkge1xuICAgIHJldHVybiBzdGFja0xpbmUuaW5kZXhPZihcIihtb2R1bGUuanM6XCIpICE9PSAtMSB8fFxuICAgICAgICAgICBzdGFja0xpbmUuaW5kZXhPZihcIihub2RlLmpzOlwiKSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpIHtcbiAgICAvLyBOYW1lZCBmdW5jdGlvbnM6IFwiYXQgZnVuY3Rpb25OYW1lIChmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlcilcIlxuICAgIC8vIEluIElFMTAgZnVuY3Rpb24gbmFtZSBjYW4gaGF2ZSBzcGFjZXMgKFwiQW5vbnltb3VzIGZ1bmN0aW9uXCIpIE9fb1xuICAgIHZhciBhdHRlbXB0MSA9IC9hdCAuKyBcXCgoLispOihcXGQrKTooPzpcXGQrKVxcKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDEpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MVsxXSwgTnVtYmVyKGF0dGVtcHQxWzJdKV07XG4gICAgfVxuXG4gICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uczogXCJhdCBmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQyID0gL2F0IChbXiBdKyk6KFxcZCspOig/OlxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mikge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQyWzFdLCBOdW1iZXIoYXR0ZW1wdDJbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBGaXJlZm94IHN0eWxlOiBcImZ1bmN0aW9uQGZpbGVuYW1lOmxpbmVOdW1iZXIgb3IgQGZpbGVuYW1lOmxpbmVOdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MyA9IC8uKkAoLispOihcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDMpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0M1sxXSwgTnVtYmVyKGF0dGVtcHQzWzJdKV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpO1xuXG4gICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICB2YXIgbGluZU51bWJlciA9IGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcblxuICAgIHJldHVybiBmaWxlTmFtZSA9PT0gcUZpbGVOYW1lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPj0gcVN0YXJ0aW5nTGluZSAmJlxuICAgICAgICBsaW5lTnVtYmVyIDw9IHFFbmRpbmdMaW5lO1xufVxuXG4vLyBkaXNjb3ZlciBvd24gZmlsZSBuYW1lIGFuZCBsaW5lIG51bWJlciByYW5nZSBmb3IgZmlsdGVyaW5nIHN0YWNrXG4vLyB0cmFjZXNcbmZ1bmN0aW9uIGNhcHR1cmVMaW5lKCkge1xuICAgIGlmICghaGFzU3RhY2tzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIHZhciBmaXJzdExpbmUgPSBsaW5lc1swXS5pbmRleE9mKFwiQFwiKSA+IDAgPyBsaW5lc1sxXSA6IGxpbmVzWzJdO1xuICAgICAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKGZpcnN0TGluZSk7XG4gICAgICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBxRmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgICAgIHJldHVybiBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUoY2FsbGJhY2ssIG5hbWUsIGFsdGVybmF0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihuYW1lICsgXCIgaXMgZGVwcmVjYXRlZCwgdXNlIFwiICsgYWx0ZXJuYXRpdmUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQuXCIsIG5ldyBFcnJvcihcIlwiKS5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8vIGVuZCBvZiBzaGltc1xuLy8gYmVnaW5uaW5nIG9mIHJlYWwgd29ya1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLCBwYXNzZXMgcHJvbWlzZXMgdGhyb3VnaCwgb3JcbiAqIGNvZXJjZXMgcHJvbWlzZXMgZnJvbSBkaWZmZXJlbnQgc3lzdGVtcy5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlIG9yIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gUSh2YWx1ZSkge1xuICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYWxyZWFkeSBhIFByb21pc2UsIHJldHVybiBpdCBkaXJlY3RseS4gIFRoaXMgZW5hYmxlc1xuICAgIC8vIHRoZSByZXNvbHZlIGZ1bmN0aW9uIHRvIGJvdGggYmUgdXNlZCB0byBjcmVhdGVkIHJlZmVyZW5jZXMgZnJvbSBvYmplY3RzLFxuICAgIC8vIGJ1dCB0byB0b2xlcmFibHkgY29lcmNlIG5vbi1wcm9taXNlcyB0byBwcm9taXNlcy5cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBhc3NpbWlsYXRlIHRoZW5hYmxlc1xuICAgIGlmIChpc1Byb21pc2VBbGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvZXJjZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGwodmFsdWUpO1xuICAgIH1cbn1cblEucmVzb2x2ZSA9IFE7XG5cbi8qKlxuICogUGVyZm9ybXMgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm4gb2YgdGhlIGV2ZW50IGxvb3AuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0YXNrXG4gKi9cblEubmV4dFRpY2sgPSBuZXh0VGljaztcblxuLyoqXG4gKiBDb250cm9scyB3aGV0aGVyIG9yIG5vdCBsb25nIHN0YWNrIHRyYWNlcyB3aWxsIGJlIG9uXG4gKi9cblEubG9uZ1N0YWNrU3VwcG9ydCA9IGZhbHNlO1xuXG4vLyBlbmFibGUgbG9uZyBzdGFja3MgaWYgUV9ERUJVRyBpcyBzZXRcbmlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LlFfREVCVUcpIHtcbiAgICBRLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fSBvYmplY3QuXG4gKlxuICogYHJlc29sdmVgIGlzIGEgY2FsbGJhY2sgdG8gaW52b2tlIHdpdGggYSBtb3JlIHJlc29sdmVkIHZhbHVlIGZvciB0aGVcbiAqIHByb21pc2UuIFRvIGZ1bGZpbGwgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhbnkgdmFsdWUgdGhhdCBpc1xuICogbm90IGEgdGhlbmFibGUuIFRvIHJlamVjdCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGEgcmVqZWN0ZWRcbiAqIHRoZW5hYmxlLCBvciBpbnZva2UgYHJlamVjdGAgd2l0aCB0aGUgcmVhc29uIGRpcmVjdGx5LiBUbyByZXNvbHZlIHRoZVxuICogcHJvbWlzZSB0byBhbm90aGVyIHRoZW5hYmxlLCB0aHVzIHB1dHRpbmcgaXQgaW4gdGhlIHNhbWUgc3RhdGUsIGludm9rZVxuICogYHJlc29sdmVgIHdpdGggdGhhdCBvdGhlciB0aGVuYWJsZS5cbiAqL1xuUS5kZWZlciA9IGRlZmVyO1xuZnVuY3Rpb24gZGVmZXIoKSB7XG4gICAgLy8gaWYgXCJtZXNzYWdlc1wiIGlzIGFuIFwiQXJyYXlcIiwgdGhhdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJvbWlzZSBoYXMgbm90IHlldFxuICAgIC8vIGJlZW4gcmVzb2x2ZWQuICBJZiBpdCBpcyBcInVuZGVmaW5lZFwiLCBpdCBoYXMgYmVlbiByZXNvbHZlZC4gIEVhY2hcbiAgICAvLyBlbGVtZW50IG9mIHRoZSBtZXNzYWdlcyBhcnJheSBpcyBpdHNlbGYgYW4gYXJyYXkgb2YgY29tcGxldGUgYXJndW1lbnRzIHRvXG4gICAgLy8gZm9yd2FyZCB0byB0aGUgcmVzb2x2ZWQgcHJvbWlzZS4gIFdlIGNvZXJjZSB0aGUgcmVzb2x1dGlvbiB2YWx1ZSB0byBhXG4gICAgLy8gcHJvbWlzZSB1c2luZyB0aGUgYHJlc29sdmVgIGZ1bmN0aW9uIGJlY2F1c2UgaXQgaGFuZGxlcyBib3RoIGZ1bGx5XG4gICAgLy8gbm9uLXRoZW5hYmxlIHZhbHVlcyBhbmQgb3RoZXIgdGhlbmFibGVzIGdyYWNlZnVsbHkuXG4gICAgdmFyIG1lc3NhZ2VzID0gW10sIHByb2dyZXNzTGlzdGVuZXJzID0gW10sIHJlc29sdmVkUHJvbWlzZTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG9iamVjdF9jcmVhdGUoZGVmZXIucHJvdG90eXBlKTtcbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIG9wZXJhbmRzKSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKG9wID09PSBcIndoZW5cIiAmJiBvcGVyYW5kc1sxXSkgeyAvLyBwcm9ncmVzcyBvcGVyYW5kXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMucHVzaChvcGVyYW5kc1sxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5ld1Byb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KG5ld1Byb21pc2UsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG5cbiAgICAgICAgbWVzc2FnZXMgPSB2b2lkIDA7XG4gICAgICAgIHByb2dyZXNzTGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIH1cblxuICAgIGRlZmVycmVkLnByb21pc2UgPSBwcm9taXNlO1xuICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKFEodmFsdWUpKTtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoZnVsZmlsbCh2YWx1ZSkpO1xuICAgIH07XG4gICAgZGVmZXJyZWQucmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUocmVqZWN0KHJlYXNvbikpO1xuICAgIH07XG4gICAgZGVmZXJyZWQubm90aWZ5ID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9ncmVzc0xpc3RlbmVycywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvZ3Jlc3NMaXN0ZW5lcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcihwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlLXN0eWxlIGNhbGxiYWNrIHRoYXQgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB0aGUgZGVmZXJyZWRcbiAqIHByb21pc2UuXG4gKiBAcmV0dXJucyBhIG5vZGViYWNrXG4gKi9cbmRlZmVyLnByb3RvdHlwZS5tYWtlTm9kZVJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVycm9yLCB2YWx1ZSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEBwYXJhbSByZXNvbHZlciB7RnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG5vdGhpbmcgYW5kIGFjY2VwdHNcbiAqIHRoZSByZXNvbHZlLCByZWplY3QsIGFuZCBub3RpZnkgZnVuY3Rpb25zIGZvciBhIGRlZmVycmVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgbWF5IGJlIHJlc29sdmVkIHdpdGggdGhlIGdpdmVuIHJlc29sdmUgYW5kIHJlamVjdFxuICogZnVuY3Rpb25zLCBvciByZWplY3RlZCBieSBhIHRocm93biBleGNlcHRpb24gaW4gcmVzb2x2ZXJcbiAqL1xuUS5Qcm9taXNlID0gcHJvbWlzZTsgLy8gRVM2XG5RLnByb21pc2UgPSBwcm9taXNlO1xuZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgfSBjYXRjaCAocmVhc29uKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxucHJvbWlzZS5yYWNlID0gcmFjZTsgLy8gRVM2XG5wcm9taXNlLmFsbCA9IGFsbDsgLy8gRVM2XG5wcm9taXNlLnJlamVjdCA9IHJlamVjdDsgLy8gRVM2XG5wcm9taXNlLnJlc29sdmUgPSBROyAvLyBFUzZcblxuLy8gWFhYIGV4cGVyaW1lbnRhbC4gIFRoaXMgbWV0aG9kIGlzIGEgd2F5IHRvIGRlbm90ZSB0aGF0IGEgbG9jYWwgdmFsdWUgaXNcbi8vIHNlcmlhbGl6YWJsZSBhbmQgc2hvdWxkIGJlIGltbWVkaWF0ZWx5IGRpc3BhdGNoZWQgdG8gYSByZW1vdGUgdXBvbiByZXF1ZXN0LFxuLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGEgcmVmZXJlbmNlLlxuUS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSWYgdHdvIHByb21pc2VzIGV2ZW50dWFsbHkgZnVsZmlsbCB0byB0aGUgc2FtZSB2YWx1ZSwgcHJvbWlzZXMgdGhhdCB2YWx1ZSxcbiAqIGJ1dCBvdGhlcndpc2UgcmVqZWN0cy5cbiAqIEBwYXJhbSB4IHtBbnkqfVxuICogQHBhcmFtIHkge0FueSp9XG4gKiBAcmV0dXJucyB7QW55Kn0gYSBwcm9taXNlIGZvciB4IGFuZCB5IGlmIHRoZXkgYXJlIHRoZSBzYW1lLCBidXQgYSByZWplY3Rpb25cbiAqIG90aGVyd2lzZS5cbiAqXG4gKi9cblEuam9pbiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIFEoeCkuam9pbih5KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAodGhhdCkge1xuICAgIHJldHVybiBRKFt0aGlzLCB0aGF0XSkuc3ByZWFkKGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBcIj09PVwiIHNob3VsZCBiZSBPYmplY3QuaXMgb3IgZXF1aXZcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3Qgam9pbjogbm90IHRoZSBzYW1lOiBcIiArIHggKyBcIiBcIiArIHkpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZmlyc3Qgb2YgYW4gYXJyYXkgb2YgcHJvbWlzZXMgdG8gYmVjb21lIHNldHRsZWQuXG4gKiBAcGFyYW0gYW5zd2VycyB7QXJyYXlbQW55Kl19IHByb21pc2VzIHRvIHJhY2VcbiAqIEByZXR1cm5zIHtBbnkqfSB0aGUgZmlyc3QgcHJvbWlzZSB0byBiZSBzZXR0bGVkXG4gKi9cblEucmFjZSA9IHJhY2U7XG5mdW5jdGlvbiByYWNlKGFuc3dlclBzKSB7XG4gICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbihhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXQsIDEpO1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnNwbGljZShhdCwgMSk7XG4gICAgfVxufVxuXG5RLnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucyA9IHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucztcblxuUS5nZXRVbmhhbmRsZWRSZWFzb25zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIE1ha2UgYSBjb3B5IHNvIHRoYXQgY29uc3VtZXJzIGNhbid0IGludGVyZmVyZSB3aXRoIG91ciBpbnRlcm5hbCBzdGF0ZS5cbiAgICByZXR1cm4gdW5oYW5kbGVkUmVhc29ucy5zbGljZSgpO1xufTtcblxuUS5zdG9wVW5oYW5kbGVkUmVqZWN0aW9uVHJhY2tpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbiBvYmplY3Qgc3VjaCB0aGF0IGl0IHdpbGwgbmV2ZXIgYmVcbiAqIHRyYW5zZmVycmVkIGF3YXkgZnJvbSB0aGlzIHByb2Nlc3Mgb3ZlciBhbnkgcHJvbWlzZVxuICogY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgcHJvbWlzZSBhIHdyYXBwaW5nIG9mIHRoYXQgb2JqZWN0IHRoYXRcbiAqIGFkZGl0aW9uYWxseSByZXNwb25kcyB0byB0aGUgXCJpc0RlZlwiIG1lc3NhZ2VcbiAqIHdpdGhvdXQgYSByZWplY3Rpb24uXG4gKi9cblEubWFzdGVyID0gbWFzdGVyO1xuZnVuY3Rpb24gbWFzdGVyKG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJpc0RlZlwiOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKG9wLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBRKG9iamVjdCkuaW5zcGVjdCgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFNwcmVhZHMgdGhlIHZhbHVlcyBvZiBhIHByb21pc2VkIGFycmF5IG9mIGFyZ3VtZW50cyBpbnRvIHRoZVxuICogZnVsZmlsbG1lbnQgY2FsbGJhY2suXG4gKiBAcGFyYW0gZnVsZmlsbGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdmFyaWFkaWMgYXJndW1lbnRzIGZyb20gdGhlXG4gKiBwcm9taXNlZCBhcnJheVxuICogQHBhcmFtIHJlamVjdGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdGhlIGV4Y2VwdGlvbiBpZiB0aGUgcHJvbWlzZVxuICogaXMgcmVqZWN0ZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb3IgdGhyb3duIGV4Y2VwdGlvbiBvZlxuICogZWl0aGVyIGNhbGxiYWNrLlxuICovXG5RLnNwcmVhZCA9IHNwcmVhZDtcbmZ1bmN0aW9uIHNwcmVhZCh2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS5zcHJlYWQoZnVsZmlsbGVkLCByZWplY3RlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnNwcmVhZCA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxsKCkudGhlbihmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGxlZC5hcHBseSh2b2lkIDAsIGFycmF5KTtcbiAgICB9LCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIFRoZSBhc3luYyBmdW5jdGlvbiBpcyBhIGRlY29yYXRvciBmb3IgZ2VuZXJhdG9yIGZ1bmN0aW9ucywgdHVybmluZ1xuICogdGhlbSBpbnRvIGFzeW5jaHJvbm91cyBnZW5lcmF0b3JzLiAgQWx0aG91Z2ggZ2VuZXJhdG9ycyBhcmUgb25seSBwYXJ0XG4gKiBvZiB0aGUgbmV3ZXN0IEVDTUFTY3JpcHQgNiBkcmFmdHMsIHRoaXMgY29kZSBkb2VzIG5vdCBjYXVzZSBzeW50YXhcbiAqIGVycm9ycyBpbiBvbGRlciBlbmdpbmVzLiAgVGhpcyBjb2RlIHNob3VsZCBjb250aW51ZSB0byB3b3JrIGFuZCB3aWxsXG4gKiBpbiBmYWN0IGltcHJvdmUgb3ZlciB0aW1lIGFzIHRoZSBsYW5ndWFnZSBpbXByb3Zlcy5cbiAqXG4gKiBFUzYgZ2VuZXJhdG9ycyBhcmUgY3VycmVudGx5IHBhcnQgb2YgVjggdmVyc2lvbiAzLjE5IHdpdGggdGhlXG4gKiAtLWhhcm1vbnktZ2VuZXJhdG9ycyBydW50aW1lIGZsYWcgZW5hYmxlZC4gIFNwaWRlck1vbmtleSBoYXMgaGFkIHRoZW1cbiAqIGZvciBsb25nZXIsIGJ1dCB1bmRlciBhbiBvbGRlciBQeXRob24taW5zcGlyZWQgZm9ybS4gIFRoaXMgZnVuY3Rpb25cbiAqIHdvcmtzIG9uIGJvdGgga2luZHMgb2YgZ2VuZXJhdG9ycy5cbiAqXG4gKiBEZWNvcmF0ZXMgYSBnZW5lcmF0b3IgZnVuY3Rpb24gc3VjaCB0aGF0OlxuICogIC0gaXQgbWF5IHlpZWxkIHByb21pc2VzXG4gKiAgLSBleGVjdXRpb24gd2lsbCBjb250aW51ZSB3aGVuIHRoYXQgcHJvbWlzZSBpcyBmdWxmaWxsZWRcbiAqICAtIHRoZSB2YWx1ZSBvZiB0aGUgeWllbGQgZXhwcmVzc2lvbiB3aWxsIGJlIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqICAtIGl0IHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlICh3aGVuIHRoZSBnZW5lcmF0b3JcbiAqICAgIHN0b3BzIGl0ZXJhdGluZylcbiAqICAtIHRoZSBkZWNvcmF0ZWQgZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqICAgIG9mIHRoZSBnZW5lcmF0b3Igb3IgdGhlIGZpcnN0IHJlamVjdGVkIHByb21pc2UgYW1vbmcgdGhvc2VcbiAqICAgIHlpZWxkZWQuXG4gKiAgLSBpZiBhbiBlcnJvciBpcyB0aHJvd24gaW4gdGhlIGdlbmVyYXRvciwgaXQgcHJvcGFnYXRlcyB0aHJvdWdoXG4gKiAgICBldmVyeSBmb2xsb3dpbmcgeWllbGQgdW50aWwgaXQgaXMgY2F1Z2h0LCBvciB1bnRpbCBpdCBlc2NhcGVzXG4gKiAgICB0aGUgZ2VuZXJhdG9yIGZ1bmN0aW9uIGFsdG9nZXRoZXIsIGFuZCBpcyB0cmFuc2xhdGVkIGludG8gYVxuICogICAgcmVqZWN0aW9uIGZvciB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSB0aGUgZGVjb3JhdGVkIGdlbmVyYXRvci5cbiAqL1xuUS5hc3luYyA9IGFzeW5jO1xuZnVuY3Rpb24gYXN5bmMobWFrZUdlbmVyYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInNlbmRcIiwgYXJnIGlzIGEgdmFsdWVcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwidGhyb3dcIiwgYXJnIGlzIGFuIGV4Y2VwdGlvblxuICAgICAgICBmdW5jdGlvbiBjb250aW51ZXIodmVyYiwgYXJnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICAvLyBVbnRpbCBWOCAzLjE5IC8gQ2hyb21pdW0gMjkgaXMgcmVsZWFzZWQsIFNwaWRlck1vbmtleSBpcyB0aGUgb25seVxuICAgICAgICAgICAgLy8gZW5naW5lIHRoYXQgaGFzIGEgZGVwbG95ZWQgYmFzZSBvZiBicm93c2VycyB0aGF0IHN1cHBvcnQgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIFNNJ3MgZ2VuZXJhdG9ycyB1c2UgdGhlIFB5dGhvbi1pbnNwaXJlZCBzZW1hbnRpY3Mgb2ZcbiAgICAgICAgICAgIC8vIG91dGRhdGVkIEVTNiBkcmFmdHMuICBXZSB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgRVM2LCBidXQgd2UnZCBhbHNvXG4gICAgICAgICAgICAvLyBsaWtlIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gdXNlIGdlbmVyYXRvcnMgaW4gZGVwbG95ZWQgYnJvd3NlcnMsIHNvXG4gICAgICAgICAgICAvLyB3ZSBhbHNvIHN1cHBvcnQgUHl0aG9uLXN0eWxlIGdlbmVyYXRvcnMuICBBdCBzb21lIHBvaW50IHdlIGNhbiByZW1vdmVcbiAgICAgICAgICAgIC8vIHRoaXMgYmxvY2suXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgU3RvcEl0ZXJhdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIC8vIEVTNiBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBRKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LnZhbHVlLCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTcGlkZXJNb25rZXkgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBSZW1vdmUgdGhpcyBjYXNlIHdoZW4gU00gZG9lcyBFUzYgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShleGNlcHRpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdCwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSBtYWtlR2VuZXJhdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJuZXh0XCIpO1xuICAgICAgICB2YXIgZXJyYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJ0aHJvd1wiKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBUaGUgc3Bhd24gZnVuY3Rpb24gaXMgYSBzbWFsbCB3cmFwcGVyIGFyb3VuZCBhc3luYyB0aGF0IGltbWVkaWF0ZWx5XG4gKiBjYWxscyB0aGUgZ2VuZXJhdG9yIGFuZCBhbHNvIGVuZHMgdGhlIHByb21pc2UgY2hhaW4sIHNvIHRoYXQgYW55XG4gKiB1bmhhbmRsZWQgZXJyb3JzIGFyZSB0aHJvd24gaW5zdGVhZCBvZiBmb3J3YXJkZWQgdG8gdGhlIGVycm9yXG4gKiBoYW5kbGVyLiBUaGlzIGlzIHVzZWZ1bCBiZWNhdXNlIGl0J3MgZXh0cmVtZWx5IGNvbW1vbiB0byBydW5cbiAqIGdlbmVyYXRvcnMgYXQgdGhlIHRvcC1sZXZlbCB0byB3b3JrIHdpdGggbGlicmFyaWVzLlxuICovXG5RLnNwYXduID0gc3Bhd247XG5mdW5jdGlvbiBzcGF3bihtYWtlR2VuZXJhdG9yKSB7XG4gICAgUS5kb25lKFEuYXN5bmMobWFrZUdlbmVyYXRvcikoKSk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBpbnRlcmZhY2Ugb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuLyoqXG4gKiBUaHJvd3MgYSBSZXR1cm5WYWx1ZSBleGNlcHRpb24gdG8gc3RvcCBhbiBhc3luY2hyb25vdXMgZ2VuZXJhdG9yLlxuICpcbiAqIFRoaXMgaW50ZXJmYWNlIGlzIGEgc3RvcC1nYXAgbWVhc3VyZSB0byBzdXBwb3J0IGdlbmVyYXRvciByZXR1cm5cbiAqIHZhbHVlcyBpbiBvbGRlciBGaXJlZm94L1NwaWRlck1vbmtleS4gIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBFUzZcbiAqIGdlbmVyYXRvcnMgbGlrZSBDaHJvbWl1bSAyOSwganVzdCB1c2UgXCJyZXR1cm5cIiBpbiB5b3VyIGdlbmVyYXRvclxuICogZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgc3Vycm91bmRpbmcgZ2VuZXJhdG9yXG4gKiBAdGhyb3dzIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB3aXRoIHRoZSB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKiAvLyBFUzYgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgcmV0dXJuIGZvbyArIGJhcjtcbiAqIH0pXG4gKiAvLyBPbGRlciBTcGlkZXJNb25rZXkgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24gKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICBRLnJldHVybihmb28gKyBiYXIpO1xuICogfSlcbiAqL1xuUVtcInJldHVyblwiXSA9IF9yZXR1cm47XG5mdW5jdGlvbiBfcmV0dXJuKHZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IFFSZXR1cm5WYWx1ZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVGhlIHByb21pc2VkIGZ1bmN0aW9uIGRlY29yYXRvciBlbnN1cmVzIHRoYXQgYW55IHByb21pc2UgYXJndW1lbnRzXG4gKiBhcmUgc2V0dGxlZCBhbmQgcGFzc2VkIGFzIHZhbHVlcyAoYHRoaXNgIGlzIGFsc28gc2V0dGxlZCBhbmQgcGFzc2VkXG4gKiBhcyBhIHZhbHVlKS4gIEl0IHdpbGwgYWxzbyBlbnN1cmUgdGhhdCB0aGUgcmVzdWx0IG9mIGEgZnVuY3Rpb24gaXNcbiAqIGFsd2F5cyBhIHByb21pc2UuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBhZGQgPSBRLnByb21pc2VkKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgcmV0dXJuIGEgKyBiO1xuICogfSk7XG4gKiBhZGQoUShhKSwgUShCKSk7XG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGRlY29yYXRlXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCBoYXMgYmVlbiBkZWNvcmF0ZWQuXG4gKi9cblEucHJvbWlzZWQgPSBwcm9taXNlZDtcbmZ1bmN0aW9uIHByb21pc2VkKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNwcmVhZChbdGhpcywgYWxsKGFyZ3VtZW50cyldLCBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG4vKipcbiAqIHNlbmRzIGEgbWVzc2FnZSB0byBhIHZhbHVlIGluIGEgZnV0dXJlIHR1cm5cbiAqIEBwYXJhbSBvYmplY3QqIHRoZSByZWNpcGllbnRcbiAqIEBwYXJhbSBvcCB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSBvcGVyYXRpb24sIGUuZy4sIFwid2hlblwiLFxuICogQHBhcmFtIGFyZ3MgZnVydGhlciBhcmd1bWVudHMgdG8gYmUgZm9yd2FyZGVkIHRvIHRoZSBvcGVyYXRpb25cbiAqIEByZXR1cm5zIHJlc3VsdCB7UHJvbWlzZX0gYSBwcm9taXNlIGZvciB0aGUgcmVzdWx0IG9mIHRoZSBvcGVyYXRpb25cbiAqL1xuUS5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuZnVuY3Rpb24gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2gob3AsIGFyZ3MpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIChvcCwgYXJncykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChkZWZlcnJlZC5yZXNvbHZlLCBvcCwgYXJncyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZ2V0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZVxuICovXG5RLmdldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIG9iamVjdCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB2YWx1ZSAgICAgbmV3IHZhbHVlIG9mIHByb3BlcnR5XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZGVsZXRlXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5kZWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIHZhbHVlICAgICBhIHZhbHVlIHRvIHBvc3QsIHR5cGljYWxseSBhbiBhcnJheSBvZlxuICogICAgICAgICAgICAgICAgICBpbnZvY2F0aW9uIGFyZ3VtZW50cyBmb3IgcHJvbWlzZXMgdGhhdFxuICogICAgICAgICAgICAgICAgICBhcmUgdWx0aW1hdGVseSBiYWNrZWQgd2l0aCBgcmVzb2x2ZWAgdmFsdWVzLFxuICogICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRob3NlIGJhY2tlZCB3aXRoIFVSTHNcbiAqICAgICAgICAgICAgICAgICAgd2hlcmVpbiB0aGUgcG9zdGVkIHZhbHVlIGNhbiBiZSBhbnlcbiAqICAgICAgICAgICAgICAgICAgSlNPTiBzZXJpYWxpemFibGUgb2JqZWN0LlxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cbi8vIGJvdW5kIGxvY2FsbHkgYmVjYXVzZSBpdCBpcyB1c2VkIGJ5IG90aGVyIG1ldGhvZHNcblEubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgaW52b2NhdGlvbiBhcmd1bWVudHNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5Qcm9taXNlLnByb3RvdHlwZS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIGFyZ3MgICAgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYXBwbHkgPSBmdW5jdGlvbiAob2JqZWN0LCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUVtcInRyeVwiXSA9XG5RLmZjYWxsID0gZnVuY3Rpb24gKG9iamVjdCAvKiAuLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cyldKTtcbn07XG5cbi8qKlxuICogQmluZHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uLCB0cmFuc2Zvcm1pbmcgcmV0dXJuIHZhbHVlcyBpbnRvIGEgZnVsZmlsbGVkXG4gKiBwcm9taXNlIGFuZCB0aHJvd24gZXJyb3JzIGludG8gYSByZWplY3RlZCBvbmUuXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZiaW5kID0gZnVuY3Rpb24gKG9iamVjdCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gUShvYmplY3QpO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblByb21pc2UucHJvdG90eXBlLmZiaW5kID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBSZXF1ZXN0cyB0aGUgbmFtZXMgb2YgdGhlIG93bmVkIHByb3BlcnRpZXMgb2YgYSBwcm9taXNlZFxuICogb2JqZWN0IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUga2V5cyBvZiB0aGUgZXZlbnR1YWxseSBzZXR0bGVkIG9iamVjdFxuICovXG5RLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkuICBJZiBhbnkgb2ZcbiAqIHRoZSBwcm9taXNlcyBnZXRzIHJlamVjdGVkLCB0aGUgd2hvbGUgYXJyYXkgaXMgcmVqZWN0ZWQgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXNcbiAqL1xuLy8gQnkgTWFyayBNaWxsZXJcbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPXN0cmF3bWFuOmNvbmN1cnJlbmN5JnJldj0xMzA4Nzc2NTIxI2FsbGZ1bGZpbGxlZFxuUS5hbGwgPSBhbGw7XG5mdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHZhciBjb3VudERvd24gPSAwO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc25hcHNob3Q7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaXNQcm9taXNlKHByb21pc2UpICYmXG4gICAgICAgICAgICAgICAgKHNuYXBzaG90ID0gcHJvbWlzZS5pbnNwZWN0KCkpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSBzbmFwc2hvdC52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKytjb3VudERvd247XG4gICAgICAgICAgICAgICAgd2hlbihcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLWNvdW50RG93biA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHsgaW5kZXg6IGluZGV4LCB2YWx1ZTogcHJvZ3Jlc3MgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBpZiAoY291bnREb3duID09PSAwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGwodGhpcyk7XG59O1xuXG4vKipcbiAqIFdhaXRzIGZvciBhbGwgcHJvbWlzZXMgdG8gYmUgc2V0dGxlZCwgZWl0aGVyIGZ1bGZpbGxlZCBvclxuICogcmVqZWN0ZWQuICBUaGlzIGlzIGRpc3RpbmN0IGZyb20gYGFsbGAgc2luY2UgdGhhdCB3b3VsZCBzdG9wXG4gKiB3YWl0aW5nIGF0IHRoZSBmaXJzdCByZWplY3Rpb24uICBUaGUgcHJvbWlzZSByZXR1cm5lZCBieVxuICogYGFsbFJlc29sdmVkYCB3aWxsIG5ldmVyIGJlIHJlamVjdGVkLlxuICogQHBhcmFtIHByb21pc2VzIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgKG9yIGFuIGFycmF5KSBvZiBwcm9taXNlc1xuICogKG9yIHZhbHVlcylcbiAqIEByZXR1cm4gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiBwcm9taXNlc1xuICovXG5RLmFsbFJlc29sdmVkID0gZGVwcmVjYXRlKGFsbFJlc29sdmVkLCBcImFsbFJlc29sdmVkXCIsIFwiYWxsU2V0dGxlZFwiKTtcbmZ1bmN0aW9uIGFsbFJlc29sdmVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICBwcm9taXNlcyA9IGFycmF5X21hcChwcm9taXNlcywgUSk7XG4gICAgICAgIHJldHVybiB3aGVuKGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gd2hlbihwcm9taXNlLCBub29wLCBub29wKTtcbiAgICAgICAgfSkpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZXM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsUmVzb2x2ZWQodGhpcyk7XG59O1xuXG4vKipcbiAqIEBzZWUgUHJvbWlzZSNhbGxTZXR0bGVkXG4gKi9cblEuYWxsU2V0dGxlZCA9IGFsbFNldHRsZWQ7XG5mdW5jdGlvbiBhbGxTZXR0bGVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZXMpLmFsbFNldHRsZWQoKTtcbn1cblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlaXIgc3RhdGVzIChhc1xuICogcmV0dXJuZWQgYnkgYGluc3BlY3RgKSB3aGVuIHRoZXkgaGF2ZSBhbGwgc2V0dGxlZC5cbiAqIEBwYXJhbSB7QXJyYXlbQW55Kl19IHZhbHVlcyBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyB7QXJyYXlbU3RhdGVdfSBhbiBhcnJheSBvZiBzdGF0ZXMgZm9yIHRoZSByZXNwZWN0aXZlIHZhbHVlcy5cbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUuYWxsU2V0dGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICByZXR1cm4gYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBRKHByb21pc2UpO1xuICAgICAgICAgICAgZnVuY3Rpb24gcmVnYXJkbGVzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKHJlZ2FyZGxlc3MsIHJlZ2FyZGxlc3MpO1xuICAgICAgICB9KSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENhcHR1cmVzIHRoZSBmYWlsdXJlIG9mIGEgcHJvbWlzZSwgZ2l2aW5nIGFuIG9wb3J0dW5pdHkgdG8gcmVjb3ZlclxuICogd2l0aCBhIGNhbGxiYWNrLiAgSWYgdGhlIGdpdmVuIHByb21pc2UgaXMgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWRcbiAqIHByb21pc2UgaXMgZnVsZmlsbGVkLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIGZ1bGZpbGwgdGhlIHJldHVybmVkIHByb21pc2UgaWYgdGhlXG4gKiBnaXZlbiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGNhbGxiYWNrXG4gKi9cblEuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBBdHRhY2hlcyBhIGxpc3RlbmVyIHRoYXQgY2FuIHJlc3BvbmQgdG8gcHJvZ3Jlc3Mgbm90aWZpY2F0aW9ucyBmcm9tIGFcbiAqIHByb21pc2UncyBvcmlnaW5hdGluZyBkZWZlcnJlZC4gVGhpcyBsaXN0ZW5lciByZWNlaXZlcyB0aGUgZXhhY3QgYXJndW1lbnRzXG4gKiBwYXNzZWQgdG8gYGBkZWZlcnJlZC5ub3RpZnlgYC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byByZWNlaXZlIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJucyB0aGUgZ2l2ZW4gcHJvbWlzZSwgdW5jaGFuZ2VkXG4gKi9cblEucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbmZ1bmN0aW9uIHByb2dyZXNzKG9iamVjdCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gb2JzZXJ2ZSB0aGUgc2V0dGxpbmcgb2YgYSBwcm9taXNlLFxuICogcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSBwcm9taXNlIGlzIGZ1bGZpbGxlZCBvciByZWplY3RlZC4gIEZvcndhcmRzXG4gKiB0aGUgcmVzb2x1dGlvbiB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aGVuIHRoZSBjYWxsYmFjayBpcyBkb25lLlxuICogVGhlIGNhbGxiYWNrIGNhbiByZXR1cm4gYSBwcm9taXNlIHRvIGRlZmVyIGNvbXBsZXRpb24uXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIG9ic2VydmUgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuXG4gKiBwcm9taXNlLCB0YWtlcyBubyBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIHdoZW5cbiAqIGBgZmluYGAgaXMgZG9uZS5cbiAqL1xuUS5maW4gPSAvLyBYWFggbGVnYWN5XG5RW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KVtcImZpbmFsbHlcIl0oY2FsbGJhY2spO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmluID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUT0RPIGF0dGVtcHQgdG8gcmVjeWNsZSB0aGUgcmVqZWN0aW9uIHdpdGggXCJ0aGlzXCIuXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogVGVybWluYXRlcyBhIGNoYWluIG9mIHByb21pc2VzLCBmb3JjaW5nIHJlamVjdGlvbnMgdG8gYmVcbiAqIHRocm93biBhcyBleGNlcHRpb25zLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGF0IHRoZSBlbmQgb2YgYSBjaGFpbiBvZiBwcm9taXNlc1xuICogQHJldHVybnMgbm90aGluZ1xuICovXG5RLmRvbmUgPSBmdW5jdGlvbiAob2JqZWN0LCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZG9uZShmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgdmFyIG9uVW5oYW5kbGVkRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgLy8gZm9yd2FyZCB0byBhIGZ1dHVyZSB0dXJuIHNvIHRoYXQgYGB3aGVuYGBcbiAgICAgICAgLy8gZG9lcyBub3QgY2F0Y2ggaXQgYW5kIHR1cm4gaXQgaW50byBhIHJlamVjdGlvbi5cbiAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQXZvaWQgdW5uZWNlc3NhcnkgYG5leHRUaWNrYGluZyB2aWEgYW4gdW5uZWNlc3NhcnkgYHdoZW5gLlxuICAgIHZhciBwcm9taXNlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgdGhpcy50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSA6XG4gICAgICAgIHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgICBvblVuaGFuZGxlZEVycm9yID0gcHJvY2Vzcy5kb21haW4uYmluZChvblVuaGFuZGxlZEVycm9yKTtcbiAgICB9XG5cbiAgICBwcm9taXNlLnRoZW4odm9pZCAwLCBvblVuaGFuZGxlZEVycm9yKTtcbn07XG5cbi8qKlxuICogQ2F1c2VzIGEgcHJvbWlzZSB0byBiZSByZWplY3RlZCBpZiBpdCBkb2VzIG5vdCBnZXQgZnVsZmlsbGVkIGJlZm9yZVxuICogc29tZSBtaWxsaXNlY29uZHMgdGltZSBvdXQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHMgdGltZW91dFxuICogQHBhcmFtIHtBbnkqfSBjdXN0b20gZXJyb3IgbWVzc2FnZSBvciBFcnJvciBvYmplY3QgKG9wdGlvbmFsKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpZiBpdCBpc1xuICogZnVsZmlsbGVkIGJlZm9yZSB0aGUgdGltZW91dCwgb3RoZXJ3aXNlIHJlamVjdGVkLlxuICovXG5RLnRpbWVvdXQgPSBmdW5jdGlvbiAob2JqZWN0LCBtcywgZXJyb3IpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRpbWVvdXQobXMsIGVycm9yKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAobXMsIGVycm9yKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgdGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghZXJyb3IgfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGVycm9yKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvciB8fCBcIlRpbWVkIG91dCBhZnRlciBcIiArIG1zICsgXCIgbXNcIik7XG4gICAgICAgICAgICBlcnJvci5jb2RlID0gXCJFVElNRURPVVRcIjtcbiAgICAgICAgfVxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgIH0sIG1zKTtcblxuICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgIH0sIGRlZmVycmVkLm5vdGlmeSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBnaXZlbiB2YWx1ZSAob3IgcHJvbWlzZWQgdmFsdWUpLCBzb21lXG4gKiBtaWxsaXNlY29uZHMgYWZ0ZXIgaXQgcmVzb2x2ZWQuIFBhc3NlcyByZWplY3Rpb25zIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGFmdGVyIG1pbGxpc2Vjb25kc1xuICogdGltZSBoYXMgZWxhcHNlZCBzaW5jZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZS5cbiAqIElmIHRoZSBnaXZlbiBwcm9taXNlIHJlamVjdHMsIHRoYXQgaXMgcGFzc2VkIGltbWVkaWF0ZWx5LlxuICovXG5RLmRlbGF5ID0gZnVuY3Rpb24gKG9iamVjdCwgdGltZW91dCkge1xuICAgIGlmICh0aW1lb3V0ID09PSB2b2lkIDApIHtcbiAgICAgICAgdGltZW91dCA9IG9iamVjdDtcbiAgICAgICAgb2JqZWN0ID0gdm9pZCAwO1xuICAgIH1cbiAgICByZXR1cm4gUShvYmplY3QpLmRlbGF5KHRpbWVvdXQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAodGltZW91dCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgYXMgYW4gYXJyYXksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqXG4gKiAgICAgIFEubmZhcHBseShGUy5yZWFkRmlsZSwgW19fZmlsZW5hbWVdKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogICAgICB9KVxuICpcbiAqL1xuUS5uZmFwcGx5ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBpbmRpdmlkdWFsbHksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mY2FsbChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSlcbiAqIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiB9KVxuICpcbiAqL1xuUS5uZmNhbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFdyYXBzIGEgTm9kZUpTIGNvbnRpbnVhdGlvbiBwYXNzaW5nIGZ1bmN0aW9uIGFuZCByZXR1cm5zIGFuIGVxdWl2YWxlbnRcbiAqIHZlcnNpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mYmluZChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSkoXCJ1dGYtOFwiKVxuICogLnRoZW4oY29uc29sZS5sb2cpXG4gKiAuZG9uZSgpXG4gKi9cblEubmZiaW5kID1cblEuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgUShjYWxsYmFjaykuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmJpbmQgPVxuUHJvbWlzZS5wcm90b3R5cGUuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5kZW5vZGVpZnkuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cblEubmJpbmQgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpc3AsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgUShib3VuZCkuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uYmluZCA9IGZ1bmN0aW9uICgvKnRoaXNwLCAuLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMCk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLm5iaW5kLmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2sgd2l0aCBhIGdpdmVuIGFycmF5IG9mIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIHtBcnJheX0gYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2tcbiAqIHdpbGwgYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEubnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ucG9zdChuYW1lLCBhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUubnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MgfHwgW10pO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjaywgZm9yd2FyZGluZyB0aGUgZ2l2ZW4gdmFyaWFkaWMgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWRcbiAqIGNhbGxiYWNrIGFyZ3VtZW50LlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIC4uLmFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrIHdpbGxcbiAqIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5RLm5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblByb21pc2UucHJvdG90eXBlLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblByb21pc2UucHJvdG90eXBlLm5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBJZiBhIGZ1bmN0aW9uIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBib3RoIE5vZGUgY29udGludWF0aW9uLXBhc3Npbmctc3R5bGUgYW5kXG4gKiBwcm9taXNlLXJldHVybmluZy1zdHlsZSwgaXQgY2FuIGVuZCBpdHMgaW50ZXJuYWwgcHJvbWlzZSBjaGFpbiB3aXRoXG4gKiBgbm9kZWlmeShub2RlYmFjaylgLCBmb3J3YXJkaW5nIHRoZSBvcHRpb25hbCBub2RlYmFjayBhcmd1bWVudC4gIElmIHRoZSB1c2VyXG4gKiBlbGVjdHMgdG8gdXNlIGEgbm9kZWJhY2ssIHRoZSByZXN1bHQgd2lsbCBiZSBzZW50IHRoZXJlLiAgSWYgdGhleSBkbyBub3RcbiAqIHBhc3MgYSBub2RlYmFjaywgdGhleSB3aWxsIHJlY2VpdmUgdGhlIHJlc3VsdCBwcm9taXNlLlxuICogQHBhcmFtIG9iamVjdCBhIHJlc3VsdCAob3IgYSBwcm9taXNlIGZvciBhIHJlc3VsdClcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5vZGViYWNrIGEgTm9kZS5qcy1zdHlsZSBjYWxsYmFja1xuICogQHJldHVybnMgZWl0aGVyIHRoZSBwcm9taXNlIG9yIG5vdGhpbmdcbiAqL1xuUS5ub2RlaWZ5ID0gbm9kZWlmeTtcbmZ1bmN0aW9uIG5vZGVpZnkob2JqZWN0LCBub2RlYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdCkubm9kZWlmeShub2RlYmFjayk7XG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAobm9kZWJhY2spIHtcbiAgICBpZiAobm9kZWJhY2spIHtcbiAgICAgICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbi8vIEFsbCBjb2RlIGJlZm9yZSB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMuXG52YXIgcUVuZGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xuXG5yZXR1cm4gUTtcblxufSk7XG4iLCIvKiFcbiAqIHJldmVhbC5qc1xuICogaHR0cDovL2xhYi5oYWtpbS5zZS9yZXZlYWwtanNcbiAqIE1JVCBsaWNlbnNlZFxuICpcbiAqIENvcHlyaWdodCAoQykgMjAxNSBIYWtpbSBFbCBIYXR0YWIsIGh0dHA6Ly9oYWtpbS5zZVxuICovXG4oZnVuY3Rpb24oIHJvb3QsIGZhY3RvcnkgKSB7XG5cdGlmKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG5cdFx0Ly8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuXHRcdGRlZmluZSggZnVuY3Rpb24oKSB7XG5cdFx0XHRyb290LlJldmVhbCA9IGZhY3RvcnkoKTtcblx0XHRcdHJldHVybiByb290LlJldmVhbDtcblx0XHR9ICk7XG5cdH0gZWxzZSBpZiggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuXHRcdC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMuXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gQnJvd3NlciBnbG9iYWxzLlxuXHRcdHJvb3QuUmV2ZWFsID0gZmFjdG9yeSgpO1xuXHR9XG59KCB0aGlzLCBmdW5jdGlvbigpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIFJldmVhbDtcblxuXHR2YXIgU0xJREVTX1NFTEVDVE9SID0gJy5zbGlkZXMgc2VjdGlvbicsXG5cdFx0SE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgPSAnLnNsaWRlcz5zZWN0aW9uJyxcblx0XHRWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IgPSAnLnNsaWRlcz5zZWN0aW9uLnByZXNlbnQ+c2VjdGlvbicsXG5cdFx0SE9NRV9TTElERV9TRUxFQ1RPUiA9ICcuc2xpZGVzPnNlY3Rpb246Zmlyc3Qtb2YtdHlwZScsXG5cblx0XHQvLyBDb25maWd1cmF0aW9ucyBkZWZhdWx0cywgY2FuIGJlIG92ZXJyaWRkZW4gYXQgaW5pdGlhbGl6YXRpb24gdGltZVxuXHRcdGNvbmZpZyA9IHtcblxuXHRcdFx0Ly8gVGhlIFwibm9ybWFsXCIgc2l6ZSBvZiB0aGUgcHJlc2VudGF0aW9uLCBhc3BlY3QgcmF0aW8gd2lsbCBiZSBwcmVzZXJ2ZWRcblx0XHRcdC8vIHdoZW4gdGhlIHByZXNlbnRhdGlvbiBpcyBzY2FsZWQgdG8gZml0IGRpZmZlcmVudCByZXNvbHV0aW9uc1xuXHRcdFx0d2lkdGg6IDk2MCxcblx0XHRcdGhlaWdodDogNzAwLFxuXG5cdFx0XHQvLyBGYWN0b3Igb2YgdGhlIGRpc3BsYXkgc2l6ZSB0aGF0IHNob3VsZCByZW1haW4gZW1wdHkgYXJvdW5kIHRoZSBjb250ZW50XG5cdFx0XHRtYXJnaW46IDAuMSxcblxuXHRcdFx0Ly8gQm91bmRzIGZvciBzbWFsbGVzdC9sYXJnZXN0IHBvc3NpYmxlIHNjYWxlIHRvIGFwcGx5IHRvIGNvbnRlbnRcblx0XHRcdG1pblNjYWxlOiAwLjIsXG5cdFx0XHRtYXhTY2FsZTogMS41LFxuXG5cdFx0XHQvLyBEaXNwbGF5IGNvbnRyb2xzIGluIHRoZSBib3R0b20gcmlnaHQgY29ybmVyXG5cdFx0XHRjb250cm9sczogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzcGxheSBhIHByZXNlbnRhdGlvbiBwcm9ncmVzcyBiYXJcblx0XHRcdHByb2dyZXNzOiB0cnVlLFxuXG5cdFx0XHQvLyBEaXNwbGF5IHRoZSBwYWdlIG51bWJlciBvZiB0aGUgY3VycmVudCBzbGlkZVxuXHRcdFx0c2xpZGVOdW1iZXI6IGZhbHNlLFxuXG5cdFx0XHQvLyBQdXNoIGVhY2ggc2xpZGUgY2hhbmdlIHRvIHRoZSBicm93c2VyIGhpc3Rvcnlcblx0XHRcdGhpc3Rvcnk6IGZhbHNlLFxuXG5cdFx0XHQvLyBFbmFibGUga2V5Ym9hcmQgc2hvcnRjdXRzIGZvciBuYXZpZ2F0aW9uXG5cdFx0XHRrZXlib2FyZDogdHJ1ZSxcblxuXHRcdFx0Ly8gT3B0aW9uYWwgZnVuY3Rpb24gdGhhdCBibG9ja3Mga2V5Ym9hcmQgZXZlbnRzIHdoZW4gcmV0dW5pbmcgZmFsc2Vcblx0XHRcdGtleWJvYXJkQ29uZGl0aW9uOiBudWxsLFxuXG5cdFx0XHQvLyBFbmFibGUgdGhlIHNsaWRlIG92ZXJ2aWV3IG1vZGVcblx0XHRcdG92ZXJ2aWV3OiB0cnVlLFxuXG5cdFx0XHQvLyBWZXJ0aWNhbCBjZW50ZXJpbmcgb2Ygc2xpZGVzXG5cdFx0XHRjZW50ZXI6IHRydWUsXG5cblx0XHRcdC8vIEVuYWJsZXMgdG91Y2ggbmF2aWdhdGlvbiBvbiBkZXZpY2VzIHdpdGggdG91Y2ggaW5wdXRcblx0XHRcdHRvdWNoOiB0cnVlLFxuXG5cdFx0XHQvLyBMb29wIHRoZSBwcmVzZW50YXRpb25cblx0XHRcdGxvb3A6IGZhbHNlLFxuXG5cdFx0XHQvLyBDaGFuZ2UgdGhlIHByZXNlbnRhdGlvbiBkaXJlY3Rpb24gdG8gYmUgUlRMXG5cdFx0XHRydGw6IGZhbHNlLFxuXG5cdFx0XHQvLyBUdXJucyBmcmFnbWVudHMgb24gYW5kIG9mZiBnbG9iYWxseVxuXHRcdFx0ZnJhZ21lbnRzOiB0cnVlLFxuXG5cdFx0XHQvLyBGbGFncyBpZiB0aGUgcHJlc2VudGF0aW9uIGlzIHJ1bm5pbmcgaW4gYW4gZW1iZWRkZWQgbW9kZSxcblx0XHRcdC8vIGkuZS4gY29udGFpbmVkIHdpdGhpbiBhIGxpbWl0ZWQgcG9ydGlvbiBvZiB0aGUgc2NyZWVuXG5cdFx0XHRlbWJlZGRlZDogZmFsc2UsXG5cblx0XHRcdC8vIEZsYWdzIGlmIHdlIHNob3VsZCBzaG93IGEgaGVscCBvdmVybGF5IHdoZW4gdGhlIHF1ZXN0aW9ubWFya1xuXHRcdFx0Ly8ga2V5IGlzIHByZXNzZWRcblx0XHRcdGhlbHA6IHRydWUsXG5cblx0XHRcdC8vIEZsYWdzIGlmIGl0IHNob3VsZCBiZSBwb3NzaWJsZSB0byBwYXVzZSB0aGUgcHJlc2VudGF0aW9uIChibGFja291dClcblx0XHRcdHBhdXNlOiB0cnVlLFxuXG5cdFx0XHQvLyBOdW1iZXIgb2YgbWlsbGlzZWNvbmRzIGJldHdlZW4gYXV0b21hdGljYWxseSBwcm9jZWVkaW5nIHRvIHRoZVxuXHRcdFx0Ly8gbmV4dCBzbGlkZSwgZGlzYWJsZWQgd2hlbiBzZXQgdG8gMCwgdGhpcyB2YWx1ZSBjYW4gYmUgb3ZlcndyaXR0ZW5cblx0XHRcdC8vIGJ5IHVzaW5nIGEgZGF0YS1hdXRvc2xpZGUgYXR0cmlidXRlIG9uIHlvdXIgc2xpZGVzXG5cdFx0XHRhdXRvU2xpZGU6IDAsXG5cblx0XHRcdC8vIFN0b3AgYXV0by1zbGlkaW5nIGFmdGVyIHVzZXIgaW5wdXRcblx0XHRcdGF1dG9TbGlkZVN0b3BwYWJsZTogdHJ1ZSxcblxuXHRcdFx0Ly8gRW5hYmxlIHNsaWRlIG5hdmlnYXRpb24gdmlhIG1vdXNlIHdoZWVsXG5cdFx0XHRtb3VzZVdoZWVsOiBmYWxzZSxcblxuXHRcdFx0Ly8gQXBwbHkgYSAzRCByb2xsIHRvIGxpbmtzIG9uIGhvdmVyXG5cdFx0XHRyb2xsaW5nTGlua3M6IGZhbHNlLFxuXG5cdFx0XHQvLyBIaWRlcyB0aGUgYWRkcmVzcyBiYXIgb24gbW9iaWxlIGRldmljZXNcblx0XHRcdGhpZGVBZGRyZXNzQmFyOiB0cnVlLFxuXG5cdFx0XHQvLyBPcGVucyBsaW5rcyBpbiBhbiBpZnJhbWUgcHJldmlldyBvdmVybGF5XG5cdFx0XHRwcmV2aWV3TGlua3M6IGZhbHNlLFxuXG5cdFx0XHQvLyBFeHBvc2VzIHRoZSByZXZlYWwuanMgQVBJIHRocm91Z2ggd2luZG93LnBvc3RNZXNzYWdlXG5cdFx0XHRwb3N0TWVzc2FnZTogdHJ1ZSxcblxuXHRcdFx0Ly8gRGlzcGF0Y2hlcyBhbGwgcmV2ZWFsLmpzIGV2ZW50cyB0byB0aGUgcGFyZW50IHdpbmRvdyB0aHJvdWdoIHBvc3RNZXNzYWdlXG5cdFx0XHRwb3N0TWVzc2FnZUV2ZW50czogZmFsc2UsXG5cblx0XHRcdC8vIEZvY3VzZXMgYm9keSB3aGVuIHBhZ2UgY2hhbmdlcyB2aXNpYmxpdHkgdG8gZW5zdXJlIGtleWJvYXJkIHNob3J0Y3V0cyB3b3JrXG5cdFx0XHRmb2N1c0JvZHlPblBhZ2VWaXNpYmlsaXR5Q2hhbmdlOiB0cnVlLFxuXG5cdFx0XHQvLyBUcmFuc2l0aW9uIHN0eWxlXG5cdFx0XHR0cmFuc2l0aW9uOiAnc2xpZGUnLCAvLyBub25lL2ZhZGUvc2xpZGUvY29udmV4L2NvbmNhdmUvem9vbVxuXG5cdFx0XHQvLyBUcmFuc2l0aW9uIHNwZWVkXG5cdFx0XHR0cmFuc2l0aW9uU3BlZWQ6ICdkZWZhdWx0JywgLy8gZGVmYXVsdC9mYXN0L3Nsb3dcblxuXHRcdFx0Ly8gVHJhbnNpdGlvbiBzdHlsZSBmb3IgZnVsbCBwYWdlIHNsaWRlIGJhY2tncm91bmRzXG5cdFx0XHRiYWNrZ3JvdW5kVHJhbnNpdGlvbjogJ2ZhZGUnLCAvLyBub25lL2ZhZGUvc2xpZGUvY29udmV4L2NvbmNhdmUvem9vbVxuXG5cdFx0XHQvLyBQYXJhbGxheCBiYWNrZ3JvdW5kIGltYWdlXG5cdFx0XHRwYXJhbGxheEJhY2tncm91bmRJbWFnZTogJycsIC8vIENTUyBzeW50YXgsIGUuZy4gXCJhLmpwZ1wiXG5cblx0XHRcdC8vIFBhcmFsbGF4IGJhY2tncm91bmQgc2l6ZVxuXHRcdFx0cGFyYWxsYXhCYWNrZ3JvdW5kU2l6ZTogJycsIC8vIENTUyBzeW50YXgsIGUuZy4gXCIzMDAwcHggMjAwMHB4XCJcblxuXHRcdFx0Ly8gTnVtYmVyIG9mIHNsaWRlcyBhd2F5IGZyb20gdGhlIGN1cnJlbnQgdGhhdCBhcmUgdmlzaWJsZVxuXHRcdFx0dmlld0Rpc3RhbmNlOiAzLFxuXG5cdFx0XHQvLyBTY3JpcHQgZGVwZW5kZW5jaWVzIHRvIGxvYWRcblx0XHRcdGRlcGVuZGVuY2llczogW11cblxuXHRcdH0sXG5cblx0XHQvLyBGbGFncyBpZiByZXZlYWwuanMgaXMgbG9hZGVkIChoYXMgZGlzcGF0Y2hlZCB0aGUgJ3JlYWR5JyBldmVudClcblx0XHRsb2FkZWQgPSBmYWxzZSxcblxuXHRcdC8vIFRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBpbmRleCBvZiB0aGUgY3VycmVudGx5IGFjdGl2ZSBzbGlkZVxuXHRcdGluZGV4aCxcblx0XHRpbmRleHYsXG5cblx0XHQvLyBUaGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgc2xpZGUgSFRNTCBlbGVtZW50c1xuXHRcdHByZXZpb3VzU2xpZGUsXG5cdFx0Y3VycmVudFNsaWRlLFxuXG5cdFx0cHJldmlvdXNCYWNrZ3JvdW5kLFxuXG5cdFx0Ly8gU2xpZGVzIG1heSBob2xkIGEgZGF0YS1zdGF0ZSBhdHRyaWJ1dGUgd2hpY2ggd2UgcGljayB1cCBhbmQgYXBwbHlcblx0XHQvLyBhcyBhIGNsYXNzIHRvIHRoZSBib2R5LiBUaGlzIGxpc3QgY29udGFpbnMgdGhlIGNvbWJpbmVkIHN0YXRlIG9mXG5cdFx0Ly8gYWxsIGN1cnJlbnQgc2xpZGVzLlxuXHRcdHN0YXRlID0gW10sXG5cblx0XHQvLyBUaGUgY3VycmVudCBzY2FsZSBvZiB0aGUgcHJlc2VudGF0aW9uIChzZWUgd2lkdGgvaGVpZ2h0IGNvbmZpZylcblx0XHRzY2FsZSA9IDEsXG5cblx0XHQvLyBDYWNoZWQgcmVmZXJlbmNlcyB0byBET00gZWxlbWVudHNcblx0XHRkb20gPSB7fSxcblxuXHRcdC8vIEZlYXR1cmVzIHN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlciwgc2VlICNjaGVja0NhcGFiaWxpdGllcygpXG5cdFx0ZmVhdHVyZXMgPSB7fSxcblxuXHRcdC8vIENsaWVudCBpcyBhIG1vYmlsZSBkZXZpY2UsIHNlZSAjY2hlY2tDYXBhYmlsaXRpZXMoKVxuXHRcdGlzTW9iaWxlRGV2aWNlLFxuXG5cdFx0Ly8gVGhyb3R0bGVzIG1vdXNlIHdoZWVsIG5hdmlnYXRpb25cblx0XHRsYXN0TW91c2VXaGVlbFN0ZXAgPSAwLFxuXG5cdFx0Ly8gRGVsYXlzIHVwZGF0ZXMgdG8gdGhlIFVSTCBkdWUgdG8gYSBDaHJvbWUgdGh1bWJuYWlsZXIgYnVnXG5cdFx0d3JpdGVVUkxUaW1lb3V0ID0gMCxcblxuXHRcdC8vIEZsYWdzIGlmIHRoZSBpbnRlcmFjdGlvbiBldmVudCBsaXN0ZW5lcnMgYXJlIGJvdW5kXG5cdFx0ZXZlbnRzQXJlQm91bmQgPSBmYWxzZSxcblxuXHRcdC8vIFRoZSBjdXJyZW50IGF1dG8tc2xpZGUgZHVyYXRpb25cblx0XHRhdXRvU2xpZGUgPSAwLFxuXG5cdFx0Ly8gQXV0byBzbGlkZSBwcm9wZXJ0aWVzXG5cdFx0YXV0b1NsaWRlUGxheWVyLFxuXHRcdGF1dG9TbGlkZVRpbWVvdXQgPSAwLFxuXHRcdGF1dG9TbGlkZVN0YXJ0VGltZSA9IC0xLFxuXHRcdGF1dG9TbGlkZVBhdXNlZCA9IGZhbHNlLFxuXG5cdFx0Ly8gSG9sZHMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnRseSBvbmdvaW5nIHRvdWNoIGlucHV0XG5cdFx0dG91Y2ggPSB7XG5cdFx0XHRzdGFydFg6IDAsXG5cdFx0XHRzdGFydFk6IDAsXG5cdFx0XHRzdGFydFNwYW46IDAsXG5cdFx0XHRzdGFydENvdW50OiAwLFxuXHRcdFx0Y2FwdHVyZWQ6IGZhbHNlLFxuXHRcdFx0dGhyZXNob2xkOiA0MFxuXHRcdH0sXG5cblx0XHQvLyBIb2xkcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUga2V5Ym9hcmQgc2hvcnRjdXRzXG5cdFx0a2V5Ym9hcmRTaG9ydGN1dHMgPSB7XG5cdFx0XHQnTiAgLCAgU1BBQ0UnOlx0XHRcdCdOZXh0IHNsaWRlJyxcblx0XHRcdCdQJzpcdFx0XHRcdFx0J1ByZXZpb3VzIHNsaWRlJyxcblx0XHRcdCcmIzg1OTI7ICAsICBIJzpcdFx0J05hdmlnYXRlIGxlZnQnLFxuXHRcdFx0JyYjODU5NDsgICwgIEwnOlx0XHQnTmF2aWdhdGUgcmlnaHQnLFxuXHRcdFx0JyYjODU5MzsgICwgIEsnOlx0XHQnTmF2aWdhdGUgdXAnLFxuXHRcdFx0JyYjODU5NTsgICwgIEonOlx0XHQnTmF2aWdhdGUgZG93bicsXG5cdFx0XHQnSG9tZSc6XHRcdFx0XHRcdCdGaXJzdCBzbGlkZScsXG5cdFx0XHQnRW5kJzpcdFx0XHRcdFx0J0xhc3Qgc2xpZGUnLFxuXHRcdFx0J0IgICwgIC4nOlx0XHRcdFx0J1BhdXNlJyxcblx0XHRcdCdGJzpcdFx0XHRcdFx0J0Z1bGxzY3JlZW4nLFxuXHRcdFx0J0VTQywgTyc6XHRcdFx0XHQnU2xpZGUgb3ZlcnZpZXcnXG5cdFx0fTtcblxuXHQvKipcblx0ICogU3RhcnRzIHVwIHRoZSBwcmVzZW50YXRpb24gaWYgdGhlIGNsaWVudCBpcyBjYXBhYmxlLlxuXHQgKi9cblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZSggb3B0aW9ucyApIHtcblxuXHRcdGNoZWNrQ2FwYWJpbGl0aWVzKCk7XG5cblx0XHRpZiggIWZlYXR1cmVzLnRyYW5zZm9ybXMyZCAmJiAhZmVhdHVyZXMudHJhbnNmb3JtczNkICkge1xuXHRcdFx0ZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoICdjbGFzcycsICduby10cmFuc2Zvcm1zJyApO1xuXG5cdFx0XHQvLyBTaW5jZSBKUyB3b24ndCBiZSBydW5uaW5nIGFueSBmdXJ0aGVyLCB3ZSBuZWVkIHRvIGxvYWQgYWxsXG5cdFx0XHQvLyBpbWFnZXMgdGhhdCB3ZXJlIGludGVuZGVkIHRvIGxhenkgbG9hZCBub3dcblx0XHRcdHZhciBpbWFnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSggJ2ltZycgKTtcblx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBpbWFnZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHRcdHZhciBpbWFnZSA9IGltYWdlc1tpXTtcblx0XHRcdFx0aWYoIGltYWdlLmdldEF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApICkge1xuXHRcdFx0XHRcdGltYWdlLnNldEF0dHJpYnV0ZSggJ3NyYycsIGltYWdlLmdldEF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApICk7XG5cdFx0XHRcdFx0aW1hZ2UucmVtb3ZlQXR0cmlidXRlKCAnZGF0YS1zcmMnICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IGNvcmUgZmVhdHVyZXMgd2Ugd29uJ3QgYmVcblx0XHRcdC8vIHVzaW5nIEphdmFTY3JpcHQgdG8gY29udHJvbCB0aGUgcHJlc2VudGF0aW9uXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gQ2FjaGUgcmVmZXJlbmNlcyB0byBrZXkgRE9NIGVsZW1lbnRzXG5cdFx0ZG9tLndyYXBwZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnLnJldmVhbCcgKTtcblx0XHRkb20uc2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwgLnNsaWRlcycgKTtcblxuXHRcdC8vIEZvcmNlIGEgbGF5b3V0IHdoZW4gdGhlIHdob2xlIHBhZ2UsIGluY2wgZm9udHMsIGhhcyBsb2FkZWRcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBsYXlvdXQsIGZhbHNlICk7XG5cblx0XHR2YXIgcXVlcnkgPSBSZXZlYWwuZ2V0UXVlcnlIYXNoKCk7XG5cblx0XHQvLyBEbyBub3QgYWNjZXB0IG5ldyBkZXBlbmRlbmNpZXMgdmlhIHF1ZXJ5IGNvbmZpZyB0byBhdm9pZFxuXHRcdC8vIHRoZSBwb3RlbnRpYWwgb2YgbWFsaWNpb3VzIHNjcmlwdCBpbmplY3Rpb25cblx0XHRpZiggdHlwZW9mIHF1ZXJ5WydkZXBlbmRlbmNpZXMnXSAhPT0gJ3VuZGVmaW5lZCcgKSBkZWxldGUgcXVlcnlbJ2RlcGVuZGVuY2llcyddO1xuXG5cdFx0Ly8gQ29weSBvcHRpb25zIG92ZXIgdG8gb3VyIGNvbmZpZyBvYmplY3Rcblx0XHRleHRlbmQoIGNvbmZpZywgb3B0aW9ucyApO1xuXHRcdGV4dGVuZCggY29uZmlnLCBxdWVyeSApO1xuXG5cdFx0Ly8gSGlkZSB0aGUgYWRkcmVzcyBiYXIgaW4gbW9iaWxlIGJyb3dzZXJzXG5cdFx0aGlkZUFkZHJlc3NCYXIoKTtcblxuXHRcdC8vIExvYWRzIHRoZSBkZXBlbmRlbmNpZXMgYW5kIGNvbnRpbnVlcyB0byAjc3RhcnQoKSBvbmNlIGRvbmVcblx0XHRsb2FkKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBJbnNwZWN0IHRoZSBjbGllbnQgdG8gc2VlIHdoYXQgaXQncyBjYXBhYmxlIG9mLCB0aGlzXG5cdCAqIHNob3VsZCBvbmx5IGhhcHBlbnMgb25jZSBwZXIgcnVudGltZS5cblx0ICovXG5cdGZ1bmN0aW9uIGNoZWNrQ2FwYWJpbGl0aWVzKCkge1xuXG5cdFx0ZmVhdHVyZXMudHJhbnNmb3JtczNkID0gJ1dlYmtpdFBlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J01velBlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J21zUGVyc3BlY3RpdmUnIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnT1BlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlIHx8XG5cdFx0XHRcdFx0XHRcdFx0J3BlcnNwZWN0aXZlJyBpbiBkb2N1bWVudC5ib2R5LnN0eWxlO1xuXG5cdFx0ZmVhdHVyZXMudHJhbnNmb3JtczJkID0gJ1dlYmtpdFRyYW5zZm9ybScgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCdNb3pUcmFuc2Zvcm0nIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnbXNUcmFuc2Zvcm0nIGluIGRvY3VtZW50LmJvZHkuc3R5bGUgfHxcblx0XHRcdFx0XHRcdFx0XHQnT1RyYW5zZm9ybScgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSB8fFxuXHRcdFx0XHRcdFx0XHRcdCd0cmFuc2Zvcm0nIGluIGRvY3VtZW50LmJvZHkuc3R5bGU7XG5cblx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVNZXRob2QgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0XHRmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB0eXBlb2YgZmVhdHVyZXMucmVxdWVzdEFuaW1hdGlvbkZyYW1lTWV0aG9kID09PSAnZnVuY3Rpb24nO1xuXG5cdFx0ZmVhdHVyZXMuY2FudmFzID0gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApLmdldENvbnRleHQ7XG5cblx0XHRmZWF0dXJlcy50b3VjaCA9ICEhKCAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgKTtcblxuXHRcdGlzTW9iaWxlRGV2aWNlID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCggLyhpcGhvbmV8aXBvZHxpcGFkfGFuZHJvaWQpL2dpICk7XG5cblx0fVxuXG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhlIGRlcGVuZGVuY2llcyBvZiByZXZlYWwuanMuIERlcGVuZGVuY2llcyBhcmVcbiAgICAgKiBkZWZpbmVkIHZpYSB0aGUgY29uZmlndXJhdGlvbiBvcHRpb24gJ2RlcGVuZGVuY2llcydcbiAgICAgKiBhbmQgd2lsbCBiZSBsb2FkZWQgcHJpb3IgdG8gc3RhcnRpbmcvYmluZGluZyByZXZlYWwuanMuXG4gICAgICogU29tZSBkZXBlbmRlbmNpZXMgbWF5IGhhdmUgYW4gJ2FzeW5jJyBmbGFnLCBpZiBzbyB0aGV5XG4gICAgICogd2lsbCBsb2FkIGFmdGVyIHJldmVhbC5qcyBoYXMgYmVlbiBzdGFydGVkIHVwLlxuICAgICAqL1xuXHRmdW5jdGlvbiBsb2FkKCkge1xuXG5cdFx0dmFyIHNjcmlwdHMgPSBbXSxcblx0XHRcdHNjcmlwdHNBc3luYyA9IFtdLFxuXHRcdFx0c2NyaXB0c1RvUHJlbG9hZCA9IDA7XG5cblx0XHQvLyBDYWxsZWQgb25jZSBzeW5jaHJvbm91cyBzY3JpcHRzIGZpbmlzaCBsb2FkaW5nXG5cdFx0ZnVuY3Rpb24gcHJvY2VlZCgpIHtcblx0XHRcdGlmKCBzY3JpcHRzQXN5bmMubGVuZ3RoICkge1xuXHRcdFx0XHQvLyBMb2FkIGFzeW5jaHJvbm91cyBzY3JpcHRzXG5cdFx0XHRcdGhlYWQuanMuYXBwbHkoIG51bGwsIHNjcmlwdHNBc3luYyApO1xuXHRcdFx0fVxuXG5cdFx0XHRzdGFydCgpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGxvYWRTY3JpcHQoIHMgKSB7XG5cdFx0XHRoZWFkLnJlYWR5KCBzLnNyYy5tYXRjaCggLyhbXFx3XFxkX1xcLV0qKVxcLj9qcyR8W15cXFxcXFwvXSokL2kgKVswXSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIEV4dGVuc2lvbiBtYXkgY29udGFpbiBjYWxsYmFjayBmdW5jdGlvbnNcblx0XHRcdFx0aWYoIHR5cGVvZiBzLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0XHRcdHMuY2FsbGJhY2suYXBwbHkoIHRoaXMgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCAtLXNjcmlwdHNUb1ByZWxvYWQgPT09IDAgKSB7XG5cdFx0XHRcdFx0cHJvY2VlZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gY29uZmlnLmRlcGVuZGVuY2llcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdHZhciBzID0gY29uZmlnLmRlcGVuZGVuY2llc1tpXTtcblxuXHRcdFx0Ly8gTG9hZCBpZiB0aGVyZSdzIG5vIGNvbmRpdGlvbiBvciB0aGUgY29uZGl0aW9uIGlzIHRydXRoeVxuXHRcdFx0aWYoICFzLmNvbmRpdGlvbiB8fCBzLmNvbmRpdGlvbigpICkge1xuXHRcdFx0XHRpZiggcy5hc3luYyApIHtcblx0XHRcdFx0XHRzY3JpcHRzQXN5bmMucHVzaCggcy5zcmMgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzY3JpcHRzLnB1c2goIHMuc3JjICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsb2FkU2NyaXB0KCBzICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoIHNjcmlwdHMubGVuZ3RoICkge1xuXHRcdFx0c2NyaXB0c1RvUHJlbG9hZCA9IHNjcmlwdHMubGVuZ3RoO1xuXG5cdFx0XHQvLyBMb2FkIHN5bmNocm9ub3VzIHNjcmlwdHNcblx0XHRcdGhlYWQuanMuYXBwbHkoIG51bGwsIHNjcmlwdHMgKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRwcm9jZWVkKCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogU3RhcnRzIHVwIHJldmVhbC5qcyBieSBiaW5kaW5nIGlucHV0IGV2ZW50cyBhbmQgbmF2aWdhdGluZ1xuXHQgKiB0byB0aGUgY3VycmVudCBVUkwgZGVlcGxpbmsgaWYgdGhlcmUgaXMgb25lLlxuXHQgKi9cblx0ZnVuY3Rpb24gc3RhcnQoKSB7XG5cblx0XHQvLyBNYWtlIHN1cmUgd2UndmUgZ290IGFsbCB0aGUgRE9NIGVsZW1lbnRzIHdlIG5lZWRcblx0XHRzZXR1cERPTSgpO1xuXG5cdFx0Ly8gTGlzdGVuIHRvIG1lc3NhZ2VzIHBvc3RlZCB0byB0aGlzIHdpbmRvd1xuXHRcdHNldHVwUG9zdE1lc3NhZ2UoKTtcblxuXHRcdC8vIFJlc2V0cyBhbGwgdmVydGljYWwgc2xpZGVzIHNvIHRoYXQgb25seSB0aGUgZmlyc3QgaXMgdmlzaWJsZVxuXHRcdHJlc2V0VmVydGljYWxTbGlkZXMoKTtcblxuXHRcdC8vIFVwZGF0ZXMgdGhlIHByZXNlbnRhdGlvbiB0byBtYXRjaCB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIHZhbHVlc1xuXHRcdGNvbmZpZ3VyZSgpO1xuXG5cdFx0Ly8gUmVhZCB0aGUgaW5pdGlhbCBoYXNoXG5cdFx0cmVhZFVSTCgpO1xuXG5cdFx0Ly8gVXBkYXRlIGFsbCBiYWNrZ3JvdW5kc1xuXHRcdHVwZGF0ZUJhY2tncm91bmQoIHRydWUgKTtcblxuXHRcdC8vIE5vdGlmeSBsaXN0ZW5lcnMgdGhhdCB0aGUgcHJlc2VudGF0aW9uIGlzIHJlYWR5IGJ1dCB1c2UgYSAxbXNcblx0XHQvLyB0aW1lb3V0IHRvIGVuc3VyZSBpdCdzIG5vdCBmaXJlZCBzeW5jaHJvbm91c2x5IGFmdGVyICNpbml0aWFsaXplKClcblx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIEVuYWJsZSB0cmFuc2l0aW9ucyBub3cgdGhhdCB3ZSdyZSBsb2FkZWRcblx0XHRcdGRvbS5zbGlkZXMuY2xhc3NMaXN0LnJlbW92ZSggJ25vLXRyYW5zaXRpb24nICk7XG5cblx0XHRcdGxvYWRlZCA9IHRydWU7XG5cblx0XHRcdGRpc3BhdGNoRXZlbnQoICdyZWFkeScsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J2N1cnJlbnRTbGlkZSc6IGN1cnJlbnRTbGlkZVxuXHRcdFx0fSApO1xuXHRcdH0sIDEgKTtcblxuXHRcdC8vIFNwZWNpYWwgc2V0dXAgYW5kIGNvbmZpZyBpcyByZXF1aXJlZCB3aGVuIHByaW50aW5nIHRvIFBERlxuXHRcdGlmKCBpc1ByaW50aW5nUERGKCkgKSB7XG5cdFx0XHRyZW1vdmVFdmVudExpc3RlbmVycygpO1xuXG5cdFx0XHQvLyBUaGUgZG9jdW1lbnQgbmVlZHMgdG8gaGF2ZSBsb2FkZWQgZm9yIHRoZSBQREYgbGF5b3V0XG5cdFx0XHQvLyBtZWFzdXJlbWVudHMgdG8gYmUgYWNjdXJhdGVcblx0XHRcdGlmKCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnICkge1xuXHRcdFx0XHRzZXR1cFBERigpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHNldHVwUERGICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRmluZHMgYW5kIHN0b3JlcyByZWZlcmVuY2VzIHRvIERPTSBlbGVtZW50cyB3aGljaCBhcmVcblx0ICogcmVxdWlyZWQgYnkgdGhlIHByZXNlbnRhdGlvbi4gSWYgYSByZXF1aXJlZCBlbGVtZW50IGlzXG5cdCAqIG5vdCBmb3VuZCwgaXQgaXMgY3JlYXRlZC5cblx0ICovXG5cdGZ1bmN0aW9uIHNldHVwRE9NKCkge1xuXG5cdFx0Ly8gUHJldmVudCB0cmFuc2l0aW9ucyB3aGlsZSB3ZSdyZSBsb2FkaW5nXG5cdFx0ZG9tLnNsaWRlcy5jbGFzc0xpc3QuYWRkKCAnbm8tdHJhbnNpdGlvbicgKTtcblxuXHRcdC8vIEJhY2tncm91bmQgZWxlbWVudFxuXHRcdGRvbS5iYWNrZ3JvdW5kID0gY3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdkaXYnLCAnYmFja2dyb3VuZHMnLCBudWxsICk7XG5cblx0XHQvLyBQcm9ncmVzcyBiYXJcblx0XHRkb20ucHJvZ3Jlc3MgPSBjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdwcm9ncmVzcycsICc8c3Bhbj48L3NwYW4+JyApO1xuXHRcdGRvbS5wcm9ncmVzc2JhciA9IGRvbS5wcm9ncmVzcy5xdWVyeVNlbGVjdG9yKCAnc3BhbicgKTtcblxuXHRcdC8vIEFycm93IGNvbnRyb2xzXG5cdFx0Y3JlYXRlU2luZ2xldG9uTm9kZSggZG9tLndyYXBwZXIsICdhc2lkZScsICdjb250cm9scycsXG5cdFx0XHQnPGRpdiBjbGFzcz1cIm5hdmlnYXRlLWxlZnRcIj48L2Rpdj4nICtcblx0XHRcdCc8ZGl2IGNsYXNzPVwibmF2aWdhdGUtcmlnaHRcIj48L2Rpdj4nICtcblx0XHRcdCc8ZGl2IGNsYXNzPVwibmF2aWdhdGUtdXBcIj48L2Rpdj4nICtcblx0XHRcdCc8ZGl2IGNsYXNzPVwibmF2aWdhdGUtZG93blwiPjwvZGl2PicgKTtcblxuXHRcdC8vIFNsaWRlIG51bWJlclxuXHRcdGRvbS5zbGlkZU51bWJlciA9IGNyZWF0ZVNpbmdsZXRvbk5vZGUoIGRvbS53cmFwcGVyLCAnZGl2JywgJ3NsaWRlLW51bWJlcicsICcnICk7XG5cblx0XHQvLyBPdmVybGF5IGdyYXBoaWMgd2hpY2ggaXMgZGlzcGxheWVkIGR1cmluZyB0aGUgcGF1c2VkIG1vZGVcblx0XHRjcmVhdGVTaW5nbGV0b25Ob2RlKCBkb20ud3JhcHBlciwgJ2RpdicsICdwYXVzZS1vdmVybGF5JywgbnVsbCApO1xuXG5cdFx0Ly8gQ2FjaGUgcmVmZXJlbmNlcyB0byBlbGVtZW50c1xuXHRcdGRvbS5jb250cm9scyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoICcucmV2ZWFsIC5jb250cm9scycgKTtcblx0XHRkb20udGhlbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCAnI3RoZW1lJyApO1xuXG5cdFx0ZG9tLndyYXBwZXIuc2V0QXR0cmlidXRlKCAncm9sZScsICdhcHBsaWNhdGlvbicgKTtcblxuXHRcdC8vIFRoZXJlIGNhbiBiZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgY29udHJvbHMgdGhyb3VnaG91dCB0aGUgcGFnZVxuXHRcdGRvbS5jb250cm9sc0xlZnQgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLWxlZnQnICkgKTtcblx0XHRkb20uY29udHJvbHNSaWdodCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtcmlnaHQnICkgKTtcblx0XHRkb20uY29udHJvbHNVcCA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtdXAnICkgKTtcblx0XHRkb20uY29udHJvbHNEb3duID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5uYXZpZ2F0ZS1kb3duJyApICk7XG5cdFx0ZG9tLmNvbnRyb2xzUHJldiA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcubmF2aWdhdGUtcHJldicgKSApO1xuXHRcdGRvbS5jb250cm9sc05leHQgPSB0b0FycmF5KCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLm5hdmlnYXRlLW5leHQnICkgKTtcblxuXHRcdGRvbS5zdGF0dXNEaXYgPSBjcmVhdGVTdGF0dXNEaXYoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgaGlkZGVuIGRpdiB3aXRoIHJvbGUgYXJpYS1saXZlIHRvIGFubm91bmNlIHRoZVxuXHQgKiBjdXJyZW50IHNsaWRlIGNvbnRlbnQuIEhpZGUgdGhlIGRpdiBvZmYtc2NyZWVuIHRvIG1ha2UgaXRcblx0ICogYXZhaWxhYmxlIG9ubHkgdG8gQXNzaXN0aXZlIFRlY2hub2xvZ2llcy5cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVN0YXR1c0RpdigpIHtcblxuXHRcdHZhciBzdGF0dXNEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2FyaWEtc3RhdHVzLWRpdicgKTtcblx0XHRpZiggIXN0YXR1c0RpdiApIHtcblx0XHRcdHN0YXR1c0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRzdGF0dXNEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0c3RhdHVzRGl2LnN0eWxlLmhlaWdodCA9ICcxcHgnO1xuXHRcdFx0c3RhdHVzRGl2LnN0eWxlLndpZHRoID0gJzFweCc7XG5cdFx0XHRzdGF0dXNEaXYuc3R5bGUub3ZlcmZsb3cgPSdoaWRkZW4nO1xuXHRcdFx0c3RhdHVzRGl2LnN0eWxlLmNsaXAgPSAncmVjdCggMXB4LCAxcHgsIDFweCwgMXB4ICknO1xuXHRcdFx0c3RhdHVzRGl2LnNldEF0dHJpYnV0ZSggJ2lkJywgJ2FyaWEtc3RhdHVzLWRpdicgKTtcblx0XHRcdHN0YXR1c0Rpdi5zZXRBdHRyaWJ1dGUoICdhcmlhLWxpdmUnLCAncG9saXRlJyApO1xuXHRcdFx0c3RhdHVzRGl2LnNldEF0dHJpYnV0ZSggJ2FyaWEtYXRvbWljJywndHJ1ZScgKTtcblx0XHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBzdGF0dXNEaXYgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHN0YXR1c0RpdjtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbmZpZ3VyZXMgdGhlIHByZXNlbnRhdGlvbiBmb3IgcHJpbnRpbmcgdG8gYSBzdGF0aWNcblx0ICogUERGLlxuXHQgKi9cblx0ZnVuY3Rpb24gc2V0dXBQREYoKSB7XG5cblx0XHR2YXIgc2xpZGVTaXplID0gZ2V0Q29tcHV0ZWRTbGlkZVNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcblxuXHRcdC8vIERpbWVuc2lvbnMgb2YgdGhlIFBERiBwYWdlc1xuXHRcdHZhciBwYWdlV2lkdGggPSBNYXRoLmZsb29yKCBzbGlkZVNpemUud2lkdGggKiAoIDEgKyBjb25maWcubWFyZ2luICkgKSxcblx0XHRcdHBhZ2VIZWlnaHQgPSBNYXRoLmZsb29yKCBzbGlkZVNpemUuaGVpZ2h0ICogKCAxICsgY29uZmlnLm1hcmdpbiAgKSApO1xuXG5cdFx0Ly8gRGltZW5zaW9ucyBvZiBzbGlkZXMgd2l0aGluIHRoZSBwYWdlc1xuXHRcdHZhciBzbGlkZVdpZHRoID0gc2xpZGVTaXplLndpZHRoLFxuXHRcdFx0c2xpZGVIZWlnaHQgPSBzbGlkZVNpemUuaGVpZ2h0O1xuXG5cdFx0Ly8gTGV0IHRoZSBicm93c2VyIGtub3cgd2hhdCBwYWdlIHNpemUgd2Ugd2FudCB0byBwcmludFxuXHRcdGluamVjdFN0eWxlU2hlZXQoICdAcGFnZXtzaXplOicrIHBhZ2VXaWR0aCArJ3B4ICcrIHBhZ2VIZWlnaHQgKydweDsgbWFyZ2luOiAwO30nICk7XG5cblx0XHQvLyBMaW1pdCB0aGUgc2l6ZSBvZiBjZXJ0YWluIGVsZW1lbnRzIHRvIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBzbGlkZVxuXHRcdGluamVjdFN0eWxlU2hlZXQoICcucmV2ZWFsIHNlY3Rpb24+aW1nLCAucmV2ZWFsIHNlY3Rpb24+dmlkZW8sIC5yZXZlYWwgc2VjdGlvbj5pZnJhbWV7bWF4LXdpZHRoOiAnKyBzbGlkZVdpZHRoICsncHg7IG1heC1oZWlnaHQ6Jysgc2xpZGVIZWlnaHQgKydweH0nICk7XG5cblx0XHRkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoICdwcmludC1wZGYnICk7XG5cdFx0ZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9IHBhZ2VXaWR0aCArICdweCc7XG5cdFx0ZG9jdW1lbnQuYm9keS5zdHlsZS5oZWlnaHQgPSBwYWdlSGVpZ2h0ICsgJ3B4JztcblxuXHRcdC8vIFNsaWRlIGFuZCBzbGlkZSBiYWNrZ3JvdW5kIGxheW91dFxuXHRcdHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiApICkuZm9yRWFjaCggZnVuY3Rpb24oIHNsaWRlICkge1xuXG5cdFx0XHQvLyBWZXJ0aWNhbCBzdGFja3MgYXJlIG5vdCBjZW50cmVkIHNpbmNlIHRoZWlyIHNlY3Rpb25cblx0XHRcdC8vIGNoaWxkcmVuIHdpbGwgYmVcblx0XHRcdGlmKCBzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdC8vIENlbnRlciB0aGUgc2xpZGUgaW5zaWRlIG9mIHRoZSBwYWdlLCBnaXZpbmcgdGhlIHNsaWRlIHNvbWUgbWFyZ2luXG5cdFx0XHRcdHZhciBsZWZ0ID0gKCBwYWdlV2lkdGggLSBzbGlkZVdpZHRoICkgLyAyLFxuXHRcdFx0XHRcdHRvcCA9ICggcGFnZUhlaWdodCAtIHNsaWRlSGVpZ2h0ICkgLyAyO1xuXG5cdFx0XHRcdHZhciBjb250ZW50SGVpZ2h0ID0gZ2V0QWJzb2x1dGVIZWlnaHQoIHNsaWRlICk7XG5cdFx0XHRcdHZhciBudW1iZXJPZlBhZ2VzID0gTWF0aC5tYXgoIE1hdGguY2VpbCggY29udGVudEhlaWdodCAvIHBhZ2VIZWlnaHQgKSwgMSApO1xuXG5cdFx0XHRcdC8vIENlbnRlciBzbGlkZXMgdmVydGljYWxseVxuXHRcdFx0XHRpZiggbnVtYmVyT2ZQYWdlcyA9PT0gMSAmJiBjb25maWcuY2VudGVyIHx8IHNsaWRlLmNsYXNzTGlzdC5jb250YWlucyggJ2NlbnRlcicgKSApIHtcblx0XHRcdFx0XHR0b3AgPSBNYXRoLm1heCggKCBwYWdlSGVpZ2h0IC0gY29udGVudEhlaWdodCApIC8gMiwgMCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUG9zaXRpb24gdGhlIHNsaWRlIGluc2lkZSBvZiB0aGUgcGFnZVxuXHRcdFx0XHRzbGlkZS5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7XG5cdFx0XHRcdHNsaWRlLnN0eWxlLnRvcCA9IHRvcCArICdweCc7XG5cdFx0XHRcdHNsaWRlLnN0eWxlLndpZHRoID0gc2xpZGVXaWR0aCArICdweCc7XG5cblx0XHRcdFx0Ly8gVE9ETyBCYWNrZ3JvdW5kcyBuZWVkIHRvIGJlIG11bHRpcGxpZWQgd2hlbiB0aGUgc2xpZGVcblx0XHRcdFx0Ly8gc3RyZXRjaGVzIG92ZXIgbXVsdGlwbGUgcGFnZXNcblx0XHRcdFx0dmFyIGJhY2tncm91bmQgPSBzbGlkZS5xdWVyeVNlbGVjdG9yKCAnLnNsaWRlLWJhY2tncm91bmQnICk7XG5cdFx0XHRcdGlmKCBiYWNrZ3JvdW5kICkge1xuXHRcdFx0XHRcdGJhY2tncm91bmQuc3R5bGUud2lkdGggPSBwYWdlV2lkdGggKyAncHgnO1xuXHRcdFx0XHRcdGJhY2tncm91bmQuc3R5bGUuaGVpZ2h0ID0gKCBwYWdlSGVpZ2h0ICogbnVtYmVyT2ZQYWdlcyApICsgJ3B4Jztcblx0XHRcdFx0XHRiYWNrZ3JvdW5kLnN0eWxlLnRvcCA9IC10b3AgKyAncHgnO1xuXHRcdFx0XHRcdGJhY2tncm91bmQuc3R5bGUubGVmdCA9IC1sZWZ0ICsgJ3B4Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0fSApO1xuXG5cdFx0Ly8gU2hvdyBhbGwgZnJhZ21lbnRzXG5cdFx0dG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJyAuZnJhZ21lbnQnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZnJhZ21lbnQgKSB7XG5cdFx0XHRmcmFnbWVudC5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuIEhUTUwgZWxlbWVudCBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byBpdC5cblx0ICogSWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBleGlzdHMgdGhlIGV4aXN0aW5nIGluc3RhbmNlIHdpbGxcblx0ICogYmUgcmV0dXJuZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVTaW5nbGV0b25Ob2RlKCBjb250YWluZXIsIHRhZ25hbWUsIGNsYXNzbmFtZSwgaW5uZXJIVE1MICkge1xuXG5cdFx0Ly8gRmluZCBhbGwgbm9kZXMgbWF0Y2hpbmcgdGhlIGRlc2NyaXB0aW9uXG5cdFx0dmFyIG5vZGVzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoICcuJyArIGNsYXNzbmFtZSApO1xuXG5cdFx0Ly8gQ2hlY2sgYWxsIG1hdGNoZXMgdG8gZmluZCBvbmUgd2hpY2ggaXMgYSBkaXJlY3QgY2hpbGQgb2Zcblx0XHQvLyB0aGUgc3BlY2lmaWVkIGNvbnRhaW5lclxuXHRcdGZvciggdmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHR2YXIgdGVzdE5vZGUgPSBub2Rlc1tpXTtcblx0XHRcdGlmKCB0ZXN0Tm9kZS5wYXJlbnROb2RlID09PSBjb250YWluZXIgKSB7XG5cdFx0XHRcdHJldHVybiB0ZXN0Tm9kZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJZiBubyBub2RlIHdhcyBmb3VuZCwgY3JlYXRlIGl0IG5vd1xuXHRcdHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggdGFnbmFtZSApO1xuXHRcdG5vZGUuY2xhc3NMaXN0LmFkZCggY2xhc3NuYW1lICk7XG5cdFx0aWYoIHR5cGVvZiBpbm5lckhUTUwgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0bm9kZS5pbm5lckhUTUwgPSBpbm5lckhUTUw7XG5cdFx0fVxuXHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZCggbm9kZSApO1xuXG5cdFx0cmV0dXJuIG5vZGU7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSBzbGlkZSBiYWNrZ3JvdW5kIGVsZW1lbnRzIGFuZCBhcHBlbmRzIHRoZW1cblx0ICogdG8gdGhlIGJhY2tncm91bmQgY29udGFpbmVyLiBPbmUgZWxlbWVudCBpcyBjcmVhdGVkIHBlclxuXHQgKiBzbGlkZSBubyBtYXR0ZXIgaWYgdGhlIGdpdmVuIHNsaWRlIGhhcyB2aXNpYmxlIGJhY2tncm91bmQuXG5cdCAqL1xuXHRmdW5jdGlvbiBjcmVhdGVCYWNrZ3JvdW5kcygpIHtcblxuXHRcdHZhciBwcmludE1vZGUgPSBpc1ByaW50aW5nUERGKCk7XG5cblx0XHQvLyBDbGVhciBwcmlvciBiYWNrZ3JvdW5kc1xuXHRcdGRvbS5iYWNrZ3JvdW5kLmlubmVySFRNTCA9ICcnO1xuXHRcdGRvbS5iYWNrZ3JvdW5kLmNsYXNzTGlzdC5hZGQoICduby10cmFuc2l0aW9uJyApO1xuXG5cdFx0Ly8gSXRlcmF0ZSBvdmVyIGFsbCBob3Jpem9udGFsIHNsaWRlc1xuXHRcdHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggc2xpZGVoICkge1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZFN0YWNrO1xuXG5cdFx0XHRpZiggcHJpbnRNb2RlICkge1xuXHRcdFx0XHRiYWNrZ3JvdW5kU3RhY2sgPSBjcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZWgsIHNsaWRlaCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGJhY2tncm91bmRTdGFjayA9IGNyZWF0ZUJhY2tncm91bmQoIHNsaWRlaCwgZG9tLmJhY2tncm91bmQgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSXRlcmF0ZSBvdmVyIGFsbCB2ZXJ0aWNhbCBzbGlkZXNcblx0XHRcdHRvQXJyYXkoIHNsaWRlaC5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBzbGlkZXYgKSB7XG5cblx0XHRcdFx0aWYoIHByaW50TW9kZSApIHtcblx0XHRcdFx0XHRjcmVhdGVCYWNrZ3JvdW5kKCBzbGlkZXYsIHNsaWRldiApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGNyZWF0ZUJhY2tncm91bmQoIHNsaWRldiwgYmFja2dyb3VuZFN0YWNrICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYWNrZ3JvdW5kU3RhY2suY2xhc3NMaXN0LmFkZCggJ3N0YWNrJyApO1xuXG5cdFx0XHR9ICk7XG5cblx0XHR9ICk7XG5cblx0XHQvLyBBZGQgcGFyYWxsYXggYmFja2dyb3VuZCBpZiBzcGVjaWZpZWRcblx0XHRpZiggY29uZmlnLnBhcmFsbGF4QmFja2dyb3VuZEltYWdlICkge1xuXG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKFwiJyArIGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRJbWFnZSArICdcIiknO1xuXHRcdFx0ZG9tLmJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSBjb25maWcucGFyYWxsYXhCYWNrZ3JvdW5kU2l6ZTtcblxuXHRcdFx0Ly8gTWFrZSBzdXJlIHRoZSBiZWxvdyBwcm9wZXJ0aWVzIGFyZSBzZXQgb24gdGhlIGVsZW1lbnQgLSB0aGVzZSBwcm9wZXJ0aWVzIGFyZVxuXHRcdFx0Ly8gbmVlZGVkIGZvciBwcm9wZXIgdHJhbnNpdGlvbnMgdG8gYmUgc2V0IG9uIHRoZSBlbGVtZW50IHZpYSBDU1MuIFRvIHJlbW92ZVxuXHRcdFx0Ly8gYW5ub3lpbmcgYmFja2dyb3VuZCBzbGlkZS1pbiBlZmZlY3Qgd2hlbiB0aGUgcHJlc2VudGF0aW9uIHN0YXJ0cywgYXBwbHlcblx0XHRcdC8vIHRoZXNlIHByb3BlcnRpZXMgYWZ0ZXIgc2hvcnQgdGltZSBkZWxheVxuXHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdoYXMtcGFyYWxsYXgtYmFja2dyb3VuZCcgKTtcblx0XHRcdH0sIDEgKTtcblxuXHRcdH1cblx0XHRlbHNlIHtcblxuXHRcdFx0ZG9tLmJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJyc7XG5cdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCAnaGFzLXBhcmFsbGF4LWJhY2tncm91bmQnICk7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgYmFja2dyb3VuZCBmb3IgdGhlIGdpdmVuIHNsaWRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzbGlkZVxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgVGhlIGVsZW1lbnQgdGhhdCB0aGUgYmFja2dyb3VuZFxuXHQgKiBzaG91bGQgYmUgYXBwZW5kZWQgdG9cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZUJhY2tncm91bmQoIHNsaWRlLCBjb250YWluZXIgKSB7XG5cblx0XHR2YXIgZGF0YSA9IHtcblx0XHRcdGJhY2tncm91bmQ6IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZCcgKSxcblx0XHRcdGJhY2tncm91bmRTaXplOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtc2l6ZScgKSxcblx0XHRcdGJhY2tncm91bmRJbWFnZTogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWltYWdlJyApLFxuXHRcdFx0YmFja2dyb3VuZFZpZGVvOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtdmlkZW8nICksXG5cdFx0XHRiYWNrZ3JvdW5kSWZyYW1lOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaWZyYW1lJyApLFxuXHRcdFx0YmFja2dyb3VuZENvbG9yOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtY29sb3InICksXG5cdFx0XHRiYWNrZ3JvdW5kUmVwZWF0OiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtcmVwZWF0JyApLFxuXHRcdFx0YmFja2dyb3VuZFBvc2l0aW9uOiBzbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtcG9zaXRpb24nICksXG5cdFx0XHRiYWNrZ3JvdW5kVHJhbnNpdGlvbjogc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24nIClcblx0XHR9O1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXG5cdFx0Ly8gQ2Fycnkgb3ZlciBjdXN0b20gY2xhc3NlcyBmcm9tIHRoZSBzbGlkZSB0byB0aGUgYmFja2dyb3VuZFxuXHRcdGVsZW1lbnQuY2xhc3NOYW1lID0gJ3NsaWRlLWJhY2tncm91bmQgJyArIHNsaWRlLmNsYXNzTmFtZS5yZXBsYWNlKCAvcHJlc2VudHxwYXN0fGZ1dHVyZS8sICcnICk7XG5cblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kICkge1xuXHRcdFx0Ly8gQXV0by13cmFwIGltYWdlIHVybHMgaW4gdXJsKC4uLilcblx0XHRcdGlmKCAvXihodHRwfGZpbGV8XFwvXFwvKS9naS50ZXN0KCBkYXRhLmJhY2tncm91bmQgKSB8fCAvXFwuKHN2Z3xwbmd8anBnfGpwZWd8Z2lmfGJtcCkkL2dpLnRlc3QoIGRhdGEuYmFja2dyb3VuZCApICkge1xuXHRcdFx0XHRzbGlkZS5zZXRBdHRyaWJ1dGUoICdkYXRhLWJhY2tncm91bmQtaW1hZ2UnLCBkYXRhLmJhY2tncm91bmQgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLmJhY2tncm91bmQgPSBkYXRhLmJhY2tncm91bmQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gQ3JlYXRlIGEgaGFzaCBmb3IgdGhpcyBjb21iaW5hdGlvbiBvZiBiYWNrZ3JvdW5kIHNldHRpbmdzLlxuXHRcdC8vIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hlbiB0d28gc2xpZGUgYmFja2dyb3VuZHMgYXJlXG5cdFx0Ly8gdGhlIHNhbWUuXG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZCB8fCBkYXRhLmJhY2tncm91bmRDb2xvciB8fCBkYXRhLmJhY2tncm91bmRJbWFnZSB8fCBkYXRhLmJhY2tncm91bmRWaWRlbyB8fCBkYXRhLmJhY2tncm91bmRJZnJhbWUgKSB7XG5cdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1oYXNoJywgZGF0YS5iYWNrZ3JvdW5kICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZFNpemUgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kSW1hZ2UgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kVmlkZW8gK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYWNrZ3JvdW5kSWZyYW1lICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZENvbG9yICtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFja2dyb3VuZFJlcGVhdCArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRQb3NpdGlvbiArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhY2tncm91bmRUcmFuc2l0aW9uICk7XG5cdFx0fVxuXG5cdFx0Ly8gQWRkaXRpb25hbCBhbmQgb3B0aW9uYWwgYmFja2dyb3VuZCBwcm9wZXJ0aWVzXG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZFNpemUgKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRTaXplID0gZGF0YS5iYWNrZ3JvdW5kU2l6ZTtcblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kQ29sb3IgKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGRhdGEuYmFja2dyb3VuZENvbG9yO1xuXHRcdGlmKCBkYXRhLmJhY2tncm91bmRSZXBlYXQgKSBlbGVtZW50LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSBkYXRhLmJhY2tncm91bmRSZXBlYXQ7XG5cdFx0aWYoIGRhdGEuYmFja2dyb3VuZFBvc2l0aW9uICkgZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBkYXRhLmJhY2tncm91bmRQb3NpdGlvbjtcblx0XHRpZiggZGF0YS5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApIGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24nLCBkYXRhLmJhY2tncm91bmRUcmFuc2l0aW9uICk7XG5cblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoIGVsZW1lbnQgKTtcblxuXHRcdC8vIElmIGJhY2tncm91bmRzIGFyZSBiZWluZyByZWNyZWF0ZWQsIGNsZWFyIG9sZCBjbGFzc2VzXG5cdFx0c2xpZGUuY2xhc3NMaXN0LnJlbW92ZSggJ2hhcy1kYXJrLWJhY2tncm91bmQnICk7XG5cdFx0c2xpZGUuY2xhc3NMaXN0LnJlbW92ZSggJ2hhcy1saWdodC1iYWNrZ3JvdW5kJyApO1xuXG5cdFx0Ly8gSWYgdGhpcyBzbGlkZSBoYXMgYSBiYWNrZ3JvdW5kIGNvbG9yLCBhZGQgYSBjbGFzcyB0aGF0XG5cdFx0Ly8gc2lnbmFscyBpZiBpdCBpcyBsaWdodCBvciBkYXJrLiBJZiB0aGUgc2xpZGUgaGFzIG5vIGJhY2tncm91bmRcblx0XHQvLyBjb2xvciwgbm8gY2xhc3Mgd2lsbCBiZSBzZXRcblx0XHR2YXIgY29tcHV0ZWRCYWNrZ3JvdW5kQ29sb3IgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSggZWxlbWVudCApLmJhY2tncm91bmRDb2xvcjtcblx0XHRpZiggY29tcHV0ZWRCYWNrZ3JvdW5kQ29sb3IgKSB7XG5cdFx0XHR2YXIgcmdiID0gY29sb3JUb1JnYiggY29tcHV0ZWRCYWNrZ3JvdW5kQ29sb3IgKTtcblxuXHRcdFx0Ly8gSWdub3JlIGZ1bGx5IHRyYW5zcGFyZW50IGJhY2tncm91bmRzLiBTb21lIGJyb3dzZXJzIHJldHVyblxuXHRcdFx0Ly8gcmdiYSgwLDAsMCwwKSB3aGVuIHJlYWRpbmcgdGhlIGNvbXB1dGVkIGJhY2tncm91bmQgY29sb3Igb2Zcblx0XHRcdC8vIGFuIGVsZW1lbnQgd2l0aCBubyBiYWNrZ3JvdW5kXG5cdFx0XHRpZiggcmdiICYmIHJnYi5hICE9PSAwICkge1xuXHRcdFx0XHRpZiggY29sb3JCcmlnaHRuZXNzKCBjb21wdXRlZEJhY2tncm91bmRDb2xvciApIDwgMTI4ICkge1xuXHRcdFx0XHRcdHNsaWRlLmNsYXNzTGlzdC5hZGQoICdoYXMtZGFyay1iYWNrZ3JvdW5kJyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHNsaWRlLmNsYXNzTGlzdC5hZGQoICdoYXMtbGlnaHQtYmFja2dyb3VuZCcgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBlbGVtZW50O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVnaXN0ZXJzIGEgbGlzdGVuZXIgdG8gcG9zdE1lc3NhZ2UgZXZlbnRzLCB0aGlzIG1ha2VzIGl0XG5cdCAqIHBvc3NpYmxlIHRvIGNhbGwgYWxsIHJldmVhbC5qcyBBUEkgbWV0aG9kcyBmcm9tIGFub3RoZXJcblx0ICogd2luZG93LiBGb3IgZXhhbXBsZTpcblx0ICpcblx0ICogcmV2ZWFsV2luZG93LnBvc3RNZXNzYWdlKCBKU09OLnN0cmluZ2lmeSh7XG5cdCAqICAgbWV0aG9kOiAnc2xpZGUnLFxuXHQgKiAgIGFyZ3M6IFsgMiBdXG5cdCAqIH0pLCAnKicgKTtcblx0ICovXG5cdGZ1bmN0aW9uIHNldHVwUG9zdE1lc3NhZ2UoKSB7XG5cblx0XHRpZiggY29uZmlnLnBvc3RNZXNzYWdlICkge1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdtZXNzYWdlJywgZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdFx0dmFyIGRhdGEgPSBldmVudC5kYXRhO1xuXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSB3ZSdyZSBkZWFsaW5nIHdpdGggSlNPTlxuXHRcdFx0XHRpZiggZGF0YS5jaGFyQXQoIDAgKSA9PT0gJ3snICYmIGRhdGEuY2hhckF0KCBkYXRhLmxlbmd0aCAtIDEgKSA9PT0gJ30nICkge1xuXHRcdFx0XHRcdGRhdGEgPSBKU09OLnBhcnNlKCBkYXRhICk7XG5cblx0XHRcdFx0XHQvLyBDaGVjayBpZiB0aGUgcmVxdWVzdGVkIG1ldGhvZCBjYW4gYmUgZm91bmRcblx0XHRcdFx0XHRpZiggZGF0YS5tZXRob2QgJiYgdHlwZW9mIFJldmVhbFtkYXRhLm1ldGhvZF0gPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0XHRSZXZlYWxbZGF0YS5tZXRob2RdLmFwcGx5KCBSZXZlYWwsIGRhdGEuYXJncyApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSwgZmFsc2UgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIHRoZSBjb25maWd1cmF0aW9uIHNldHRpbmdzIGZyb20gdGhlIGNvbmZpZ1xuXHQgKiBvYmplY3QuIE1heSBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMuXG5cdCAqL1xuXHRmdW5jdGlvbiBjb25maWd1cmUoIG9wdGlvbnMgKSB7XG5cblx0XHR2YXIgbnVtYmVyT2ZTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKS5sZW5ndGg7XG5cblx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCBjb25maWcudHJhbnNpdGlvbiApO1xuXG5cdFx0Ly8gTmV3IGNvbmZpZyBvcHRpb25zIG1heSBiZSBwYXNzZWQgd2hlbiB0aGlzIG1ldGhvZFxuXHRcdC8vIGlzIGludm9rZWQgdGhyb3VnaCB0aGUgQVBJIGFmdGVyIGluaXRpYWxpemF0aW9uXG5cdFx0aWYoIHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0JyApIGV4dGVuZCggY29uZmlnLCBvcHRpb25zICk7XG5cblx0XHQvLyBGb3JjZSBsaW5lYXIgdHJhbnNpdGlvbiBiYXNlZCBvbiBicm93c2VyIGNhcGFiaWxpdGllc1xuXHRcdGlmKCBmZWF0dXJlcy50cmFuc2Zvcm1zM2QgPT09IGZhbHNlICkgY29uZmlnLnRyYW5zaXRpb24gPSAnbGluZWFyJztcblxuXHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoIGNvbmZpZy50cmFuc2l0aW9uICk7XG5cblx0XHRkb20ud3JhcHBlci5zZXRBdHRyaWJ1dGUoICdkYXRhLXRyYW5zaXRpb24tc3BlZWQnLCBjb25maWcudHJhbnNpdGlvblNwZWVkICk7XG5cdFx0ZG9tLndyYXBwZXIuc2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24nLCBjb25maWcuYmFja2dyb3VuZFRyYW5zaXRpb24gKTtcblxuXHRcdGRvbS5jb250cm9scy5zdHlsZS5kaXNwbGF5ID0gY29uZmlnLmNvbnRyb2xzID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRkb20ucHJvZ3Jlc3Muc3R5bGUuZGlzcGxheSA9IGNvbmZpZy5wcm9ncmVzcyA/ICdibG9jaycgOiAnbm9uZSc7XG5cblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdydGwnICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ3J0bCcgKTtcblx0XHR9XG5cblx0XHRpZiggY29uZmlnLmNlbnRlciApIHtcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdjZW50ZXInICk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ2NlbnRlcicgKTtcblx0XHR9XG5cblx0XHQvLyBFeGl0IHRoZSBwYXVzZWQgbW9kZSBpZiBpdCB3YXMgY29uZmlndXJlZCBvZmZcblx0XHRpZiggY29uZmlnLnBhdXNlID09PSBmYWxzZSApIHtcblx0XHRcdHJlc3VtZSgpO1xuXHRcdH1cblxuXHRcdGlmKCBjb25maWcubW91c2VXaGVlbCApIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdET01Nb3VzZVNjcm9sbCcsIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCwgZmFsc2UgKTsgLy8gRkZcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdET01Nb3VzZVNjcm9sbCcsIG9uRG9jdW1lbnRNb3VzZVNjcm9sbCwgZmFsc2UgKTsgLy8gRkZcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZXdoZWVsJywgb25Eb2N1bWVudE1vdXNlU2Nyb2xsLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdC8vIFJvbGxpbmcgM0QgbGlua3Ncblx0XHRpZiggY29uZmlnLnJvbGxpbmdMaW5rcyApIHtcblx0XHRcdGVuYWJsZVJvbGxpbmdMaW5rcygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRpc2FibGVSb2xsaW5nTGlua3MoKTtcblx0XHR9XG5cblx0XHQvLyBJZnJhbWUgbGluayBwcmV2aWV3c1xuXHRcdGlmKCBjb25maWcucHJldmlld0xpbmtzICkge1xuXHRcdFx0ZW5hYmxlUHJldmlld0xpbmtzKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZGlzYWJsZVByZXZpZXdMaW5rcygpO1xuXHRcdFx0ZW5hYmxlUHJldmlld0xpbmtzKCAnW2RhdGEtcHJldmlldy1saW5rXScgKTtcblx0XHR9XG5cblx0XHQvLyBSZW1vdmUgZXhpc3RpbmcgYXV0by1zbGlkZSBjb250cm9sc1xuXHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIuZGVzdHJveSgpO1xuXHRcdFx0YXV0b1NsaWRlUGxheWVyID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBHZW5lcmF0ZSBhdXRvLXNsaWRlIGNvbnRyb2xzIGlmIG5lZWRlZFxuXHRcdGlmKCBudW1iZXJPZlNsaWRlcyA+IDEgJiYgY29uZmlnLmF1dG9TbGlkZSAmJiBjb25maWcuYXV0b1NsaWRlU3RvcHBhYmxlICYmIGZlYXR1cmVzLmNhbnZhcyAmJiBmZWF0dXJlcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKSB7XG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIgPSBuZXcgUGxheWJhY2soIGRvbS53cmFwcGVyLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIE1hdGgubWluKCBNYXRoLm1heCggKCBEYXRlLm5vdygpIC0gYXV0b1NsaWRlU3RhcnRUaW1lICkgLyBhdXRvU2xpZGUsIDAgKSwgMSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRhdXRvU2xpZGVQbGF5ZXIub24oICdjbGljaycsIG9uQXV0b1NsaWRlUGxheWVyQ2xpY2sgKTtcblx0XHRcdGF1dG9TbGlkZVBhdXNlZCA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIFdoZW4gZnJhZ21lbnRzIGFyZSB0dXJuZWQgb2ZmIHRoZXkgc2hvdWxkIGJlIHZpc2libGVcblx0XHRpZiggY29uZmlnLmZyYWdtZW50cyA9PT0gZmFsc2UgKSB7XG5cdFx0XHR0b0FycmF5KCBkb20uc2xpZGVzLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCAndmlzaWJsZScgKTtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAnY3VycmVudC1mcmFnbWVudCcgKTtcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRzeW5jKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBCaW5kcyBhbGwgZXZlbnQgbGlzdGVuZXJzLlxuXHQgKi9cblx0ZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG5cblx0XHRldmVudHNBcmVCb3VuZCA9IHRydWU7XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2hhc2hjaGFuZ2UnLCBvbldpbmRvd0hhc2hDaGFuZ2UsIGZhbHNlICk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UgKTtcblxuXHRcdGlmKCBjb25maWcudG91Y2ggKSB7XG5cdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UgKTtcblx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UgKTtcblx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlICk7XG5cblx0XHRcdC8vIFN1cHBvcnQgcG9pbnRlci1zdHlsZSB0b3VjaCBpbnRlcmFjdGlvbiBhcyB3ZWxsXG5cdFx0XHRpZiggd2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCApIHtcblx0XHRcdFx0Ly8gSUUgMTEgdXNlcyB1bi1wcmVmaXhlZCB2ZXJzaW9uIG9mIHBvaW50ZXIgZXZlbnRzXG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdwb2ludGVyZG93bicsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdwb2ludGVybW92ZScsIG9uUG9pbnRlck1vdmUsIGZhbHNlICk7XG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdwb2ludGVydXAnLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoIHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCApIHtcblx0XHRcdFx0Ly8gSUUgMTAgdXNlcyBwcmVmaXhlZCB2ZXJzaW9uIG9mIHBvaW50ZXIgZXZlbnRzXG5cdFx0XHRcdGRvbS53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoICdNU1BvaW50ZXJEb3duJywgb25Qb2ludGVyRG93biwgZmFsc2UgKTtcblx0XHRcdFx0ZG9tLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlck1vdmUnLCBvblBvaW50ZXJNb3ZlLCBmYWxzZSApO1xuXHRcdFx0XHRkb20ud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCAnTVNQb2ludGVyVXAnLCBvblBvaW50ZXJVcCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiggY29uZmlnLmtleWJvYXJkICkge1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBvbkRvY3VtZW50S2V5RG93biwgZmFsc2UgKTtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlwcmVzcycsIG9uRG9jdW1lbnRLZXlQcmVzcywgZmFsc2UgKTtcblx0XHR9XG5cblx0XHRpZiggY29uZmlnLnByb2dyZXNzICYmIGRvbS5wcm9ncmVzcyApIHtcblx0XHRcdGRvbS5wcm9ncmVzcy5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvblByb2dyZXNzQ2xpY2tlZCwgZmFsc2UgKTtcblx0XHR9XG5cblx0XHRpZiggY29uZmlnLmZvY3VzQm9keU9uUGFnZVZpc2liaWxpdHlDaGFuZ2UgKSB7XG5cdFx0XHR2YXIgdmlzaWJpbGl0eUNoYW5nZTtcblxuXHRcdFx0aWYoICdoaWRkZW4nIGluIGRvY3VtZW50ICkge1xuXHRcdFx0XHR2aXNpYmlsaXR5Q2hhbmdlID0gJ3Zpc2liaWxpdHljaGFuZ2UnO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggJ21zSGlkZGVuJyBpbiBkb2N1bWVudCApIHtcblx0XHRcdFx0dmlzaWJpbGl0eUNoYW5nZSA9ICdtc3Zpc2liaWxpdHljaGFuZ2UnO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggJ3dlYmtpdEhpZGRlbicgaW4gZG9jdW1lbnQgKSB7XG5cdFx0XHRcdHZpc2liaWxpdHlDaGFuZ2UgPSAnd2Via2l0dmlzaWJpbGl0eWNoYW5nZSc7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCB2aXNpYmlsaXR5Q2hhbmdlICkge1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCB2aXNpYmlsaXR5Q2hhbmdlLCBvblBhZ2VWaXNpYmlsaXR5Q2hhbmdlLCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIExpc3RlbiB0byBib3RoIHRvdWNoIGFuZCBjbGljayBldmVudHMsIGluIGNhc2UgdGhlIGRldmljZVxuXHRcdC8vIHN1cHBvcnRzIGJvdGhcblx0XHR2YXIgcG9pbnRlckV2ZW50cyA9IFsgJ3RvdWNoc3RhcnQnLCAnY2xpY2snIF07XG5cblx0XHQvLyBPbmx5IHN1cHBvcnQgdG91Y2ggZm9yIEFuZHJvaWQsIGZpeGVzIGRvdWJsZSBuYXZpZ2F0aW9ucyBpblxuXHRcdC8vIHN0b2NrIGJyb3dzZXJcblx0XHRpZiggbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCggL2FuZHJvaWQvZ2kgKSApIHtcblx0XHRcdHBvaW50ZXJFdmVudHMgPSBbICd0b3VjaHN0YXJ0JyBdO1xuXHRcdH1cblxuXHRcdHBvaW50ZXJFdmVudHMuZm9yRWFjaCggZnVuY3Rpb24oIGV2ZW50TmFtZSApIHtcblx0XHRcdGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVMZWZ0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVSaWdodENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlVXBDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlRG93bkNsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1ByZXYuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5hZGRFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVQcmV2Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZU5leHRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogVW5iaW5kcyBhbGwgZXZlbnQgbGlzdGVuZXJzLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG5cblx0XHRldmVudHNBcmVCb3VuZCA9IGZhbHNlO1xuXG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBvbkRvY3VtZW50S2V5RG93biwgZmFsc2UgKTtcblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAna2V5cHJlc3MnLCBvbkRvY3VtZW50S2V5UHJlc3MsIGZhbHNlICk7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdoYXNoY2hhbmdlJywgb25XaW5kb3dIYXNoQ2hhbmdlLCBmYWxzZSApO1xuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlICk7XG5cblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UgKTtcblx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUsIGZhbHNlICk7XG5cdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UgKTtcblxuXHRcdC8vIElFMTFcblx0XHRpZiggd2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCApIHtcblx0XHRcdGRvbS53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdwb2ludGVyZG93bicsIG9uUG9pbnRlckRvd24sIGZhbHNlICk7XG5cdFx0XHRkb20ud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCAncG9pbnRlcm1vdmUnLCBvblBvaW50ZXJNb3ZlLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJ1cCcsIG9uUG9pbnRlclVwLCBmYWxzZSApO1xuXHRcdH1cblx0XHQvLyBJRTEwXG5cdFx0ZWxzZSBpZiggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkge1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlckRvd24nLCBvblBvaW50ZXJEb3duLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlck1vdmUnLCBvblBvaW50ZXJNb3ZlLCBmYWxzZSApO1xuXHRcdFx0ZG9tLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ01TUG9pbnRlclVwJywgb25Qb2ludGVyVXAsIGZhbHNlICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzICkge1xuXHRcdFx0ZG9tLnByb2dyZXNzLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdjbGljaycsIG9uUHJvZ3Jlc3NDbGlja2VkLCBmYWxzZSApO1xuXHRcdH1cblxuXHRcdFsgJ3RvdWNoc3RhcnQnLCAnY2xpY2snIF0uZm9yRWFjaCggZnVuY3Rpb24oIGV2ZW50TmFtZSApIHtcblx0XHRcdGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVMZWZ0Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzUmlnaHQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVSaWdodENsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlVXBDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0XHRkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLCBvbk5hdmlnYXRlRG93bkNsaWNrZWQsIGZhbHNlICk7IH0gKTtcblx0XHRcdGRvbS5jb250cm9sc1ByZXYuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCBldmVudE5hbWUsIG9uTmF2aWdhdGVQcmV2Q2xpY2tlZCwgZmFsc2UgKTsgfSApO1xuXHRcdFx0ZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZSwgb25OYXZpZ2F0ZU5leHRDbGlja2VkLCBmYWxzZSApOyB9ICk7XG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogRXh0ZW5kIG9iamVjdCBhIHdpdGggdGhlIHByb3BlcnRpZXMgb2Ygb2JqZWN0IGIuXG5cdCAqIElmIHRoZXJlJ3MgYSBjb25mbGljdCwgb2JqZWN0IGIgdGFrZXMgcHJlY2VkZW5jZS5cblx0ICovXG5cdGZ1bmN0aW9uIGV4dGVuZCggYSwgYiApIHtcblxuXHRcdGZvciggdmFyIGkgaW4gYiApIHtcblx0XHRcdGFbIGkgXSA9IGJbIGkgXTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyB0aGUgdGFyZ2V0IG9iamVjdCB0byBhbiBhcnJheS5cblx0ICovXG5cdGZ1bmN0aW9uIHRvQXJyYXkoIG8gKSB7XG5cblx0XHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIG8gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFV0aWxpdHkgZm9yIGRlc2VyaWFsaXppbmcgYSB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGRlc2VyaWFsaXplKCB2YWx1ZSApIHtcblxuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0aWYoIHZhbHVlID09PSAnbnVsbCcgKSByZXR1cm4gbnVsbDtcblx0XHRcdGVsc2UgaWYoIHZhbHVlID09PSAndHJ1ZScgKSByZXR1cm4gdHJ1ZTtcblx0XHRcdGVsc2UgaWYoIHZhbHVlID09PSAnZmFsc2UnICkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0ZWxzZSBpZiggdmFsdWUubWF0Y2goIC9eXFxkKyQvICkgKSByZXR1cm4gcGFyc2VGbG9hdCggdmFsdWUgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdmFsdWU7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNZWFzdXJlcyB0aGUgZGlzdGFuY2UgaW4gcGl4ZWxzIGJldHdlZW4gcG9pbnQgYVxuXHQgKiBhbmQgcG9pbnQgYi5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGEgcG9pbnQgd2l0aCB4L3kgcHJvcGVydGllc1xuXHQgKiBAcGFyYW0ge09iamVjdH0gYiBwb2ludCB3aXRoIHgveSBwcm9wZXJ0aWVzXG5cdCAqL1xuXHRmdW5jdGlvbiBkaXN0YW5jZUJldHdlZW4oIGEsIGIgKSB7XG5cblx0XHR2YXIgZHggPSBhLnggLSBiLngsXG5cdFx0XHRkeSA9IGEueSAtIGIueTtcblxuXHRcdHJldHVybiBNYXRoLnNxcnQoIGR4KmR4ICsgZHkqZHkgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEFwcGxpZXMgYSBDU1MgdHJhbnNmb3JtIHRvIHRoZSB0YXJnZXQgZWxlbWVudC5cblx0ICovXG5cdGZ1bmN0aW9uIHRyYW5zZm9ybUVsZW1lbnQoIGVsZW1lbnQsIHRyYW5zZm9ybSApIHtcblxuXHRcdGVsZW1lbnQuc3R5bGUuV2Via2l0VHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXHRcdGVsZW1lbnQuc3R5bGUuTW96VHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXHRcdGVsZW1lbnQuc3R5bGUubXNUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG5cdFx0ZWxlbWVudC5zdHlsZS5PVHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXHRcdGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG5cdH1cblxuXHQvKipcblx0ICogSW5qZWN0cyB0aGUgZ2l2ZW4gQ1NTIHN0eWxlcyBpbnRvIHRoZSBET00uXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmplY3RTdHlsZVNoZWV0KCB2YWx1ZSApIHtcblxuXHRcdHZhciB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3R5bGUnICk7XG5cdFx0dGFnLnR5cGUgPSAndGV4dC9jc3MnO1xuXHRcdGlmKCB0YWcuc3R5bGVTaGVldCApIHtcblx0XHRcdHRhZy5zdHlsZVNoZWV0LmNzc1RleHQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0YWcuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCB2YWx1ZSApICk7XG5cdFx0fVxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnaGVhZCcgKVswXS5hcHBlbmRDaGlsZCggdGFnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBNZWFzdXJlcyB0aGUgZGlzdGFuY2UgaW4gcGl4ZWxzIGJldHdlZW4gcG9pbnQgYSBhbmQgcG9pbnQgYi5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNvbG9yIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBjb2xvcixcblx0ICogdGhlIGZvbGxvd2luZyBmb3JtYXRzIGFyZSBzdXBwb3J0ZWQ6XG5cdCAqIC0gIzAwMFxuXHQgKiAtICMwMDAwMDBcblx0ICogLSByZ2IoMCwwLDApXG5cdCAqL1xuXHRmdW5jdGlvbiBjb2xvclRvUmdiKCBjb2xvciApIHtcblxuXHRcdHZhciBoZXgzID0gY29sb3IubWF0Y2goIC9eIyhbMC05YS1mXXszfSkkL2kgKTtcblx0XHRpZiggaGV4MyAmJiBoZXgzWzFdICkge1xuXHRcdFx0aGV4MyA9IGhleDNbMV07XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyOiBwYXJzZUludCggaGV4My5jaGFyQXQoIDAgKSwgMTYgKSAqIDB4MTEsXG5cdFx0XHRcdGc6IHBhcnNlSW50KCBoZXgzLmNoYXJBdCggMSApLCAxNiApICogMHgxMSxcblx0XHRcdFx0YjogcGFyc2VJbnQoIGhleDMuY2hhckF0KCAyICksIDE2ICkgKiAweDExXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHZhciBoZXg2ID0gY29sb3IubWF0Y2goIC9eIyhbMC05YS1mXXs2fSkkL2kgKTtcblx0XHRpZiggaGV4NiAmJiBoZXg2WzFdICkge1xuXHRcdFx0aGV4NiA9IGhleDZbMV07XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyOiBwYXJzZUludCggaGV4Ni5zdWJzdHIoIDAsIDIgKSwgMTYgKSxcblx0XHRcdFx0ZzogcGFyc2VJbnQoIGhleDYuc3Vic3RyKCAyLCAyICksIDE2ICksXG5cdFx0XHRcdGI6IHBhcnNlSW50KCBoZXg2LnN1YnN0ciggNCwgMiApLCAxNiApXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHZhciByZ2IgPSBjb2xvci5tYXRjaCggL15yZ2JcXHMqXFwoXFxzKihcXGQrKVxccyosXFxzKihcXGQrKVxccyosXFxzKihcXGQrKVxccypcXCkkL2kgKTtcblx0XHRpZiggcmdiICkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cjogcGFyc2VJbnQoIHJnYlsxXSwgMTAgKSxcblx0XHRcdFx0ZzogcGFyc2VJbnQoIHJnYlsyXSwgMTAgKSxcblx0XHRcdFx0YjogcGFyc2VJbnQoIHJnYlszXSwgMTAgKVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR2YXIgcmdiYSA9IGNvbG9yLm1hdGNoKCAvXnJnYmFcXHMqXFwoXFxzKihcXGQrKVxccyosXFxzKihcXGQrKVxccyosXFxzKihcXGQrKVxccypcXCxcXHMqKFtcXGRdK3xbXFxkXSouW1xcZF0rKVxccypcXCkkL2kgKTtcblx0XHRpZiggcmdiYSApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHI6IHBhcnNlSW50KCByZ2JhWzFdLCAxMCApLFxuXHRcdFx0XHRnOiBwYXJzZUludCggcmdiYVsyXSwgMTAgKSxcblx0XHRcdFx0YjogcGFyc2VJbnQoIHJnYmFbM10sIDEwICksXG5cdFx0XHRcdGE6IHBhcnNlRmxvYXQoIHJnYmFbNF0gKVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZXMgYnJpZ2h0bmVzcyBvbiBhIHNjYWxlIG9mIDAtMjU1LlxuXHQgKlxuXHQgKiBAcGFyYW0gY29sb3IgU2VlIGNvbG9yU3RyaW5nVG9SZ2IgZm9yIHN1cHBvcnRlZCBmb3JtYXRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gY29sb3JCcmlnaHRuZXNzKCBjb2xvciApIHtcblxuXHRcdGlmKCB0eXBlb2YgY29sb3IgPT09ICdzdHJpbmcnICkgY29sb3IgPSBjb2xvclRvUmdiKCBjb2xvciApO1xuXG5cdFx0aWYoIGNvbG9yICkge1xuXHRcdFx0cmV0dXJuICggY29sb3IuciAqIDI5OSArIGNvbG9yLmcgKiA1ODcgKyBjb2xvci5iICogMTE0ICkgLyAxMDAwO1xuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBoZWlnaHQgb2YgdGhlIGdpdmVuIGVsZW1lbnQgYnkgbG9va2luZ1xuXHQgKiBhdCB0aGUgcG9zaXRpb24gYW5kIGhlaWdodCBvZiBpdHMgaW1tZWRpYXRlIGNoaWxkcmVuLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0QWJzb2x1dGVIZWlnaHQoIGVsZW1lbnQgKSB7XG5cblx0XHR2YXIgaGVpZ2h0ID0gMDtcblxuXHRcdGlmKCBlbGVtZW50ICkge1xuXHRcdFx0dmFyIGFic29sdXRlQ2hpbGRyZW4gPSAwO1xuXG5cdFx0XHR0b0FycmF5KCBlbGVtZW50LmNoaWxkTm9kZXMgKS5mb3JFYWNoKCBmdW5jdGlvbiggY2hpbGQgKSB7XG5cblx0XHRcdFx0aWYoIHR5cGVvZiBjaGlsZC5vZmZzZXRUb3AgPT09ICdudW1iZXInICYmIGNoaWxkLnN0eWxlICkge1xuXHRcdFx0XHRcdC8vIENvdW50ICMgb2YgYWJzIGNoaWxkcmVuXG5cdFx0XHRcdFx0aWYoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCBjaGlsZCApLnBvc2l0aW9uID09PSAnYWJzb2x1dGUnICkge1xuXHRcdFx0XHRcdFx0YWJzb2x1dGVDaGlsZHJlbiArPSAxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGhlaWdodCA9IE1hdGgubWF4KCBoZWlnaHQsIGNoaWxkLm9mZnNldFRvcCArIGNoaWxkLm9mZnNldEhlaWdodCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIG5vIGFic29sdXRlIGNoaWxkcmVuLCB1c2Ugb2Zmc2V0SGVpZ2h0XG5cdFx0XHRpZiggYWJzb2x1dGVDaGlsZHJlbiA9PT0gMCApIHtcblx0XHRcdFx0aGVpZ2h0ID0gZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gaGVpZ2h0O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgcmVtYWluaW5nIGhlaWdodCB3aXRoaW4gdGhlIHBhcmVudCBvZiB0aGVcblx0ICogdGFyZ2V0IGVsZW1lbnQuXG5cdCAqXG5cdCAqIHJlbWFpbmluZyBoZWlnaHQgPSBbIGNvbmZpZ3VyZWQgcGFyZW50IGhlaWdodCBdIC0gWyBjdXJyZW50IHBhcmVudCBoZWlnaHQgXVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0UmVtYWluaW5nSGVpZ2h0KCBlbGVtZW50LCBoZWlnaHQgKSB7XG5cblx0XHRoZWlnaHQgPSBoZWlnaHQgfHwgMDtcblxuXHRcdGlmKCBlbGVtZW50ICkge1xuXHRcdFx0dmFyIG5ld0hlaWdodCwgb2xkSGVpZ2h0ID0gZWxlbWVudC5zdHlsZS5oZWlnaHQ7XG5cblx0XHRcdC8vIENoYW5nZSB0aGUgLnN0cmV0Y2ggZWxlbWVudCBoZWlnaHQgdG8gMCBpbiBvcmRlciBmaW5kIHRoZSBoZWlnaHQgb2YgYWxsXG5cdFx0XHQvLyB0aGUgb3RoZXIgZWxlbWVudHNcblx0XHRcdGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gJzBweCc7XG5cdFx0XHRuZXdIZWlnaHQgPSBoZWlnaHQgLSBlbGVtZW50LnBhcmVudE5vZGUub2Zmc2V0SGVpZ2h0O1xuXG5cdFx0XHQvLyBSZXN0b3JlIHRoZSBvbGQgaGVpZ2h0LCBqdXN0IGluIGNhc2Vcblx0XHRcdGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gb2xkSGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0cmV0dXJuIG5ld0hlaWdodDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaGVpZ2h0O1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoaXMgaW5zdGFuY2UgaXMgYmVpbmcgdXNlZCB0byBwcmludCBhIFBERi5cblx0ICovXG5cdGZ1bmN0aW9uIGlzUHJpbnRpbmdQREYoKSB7XG5cblx0XHRyZXR1cm4gKCAvcHJpbnQtcGRmL2dpICkudGVzdCggd2luZG93LmxvY2F0aW9uLnNlYXJjaCApO1xuXG5cdH1cblxuXHQvKipcblx0ICogSGlkZXMgdGhlIGFkZHJlc3MgYmFyIGlmIHdlJ3JlIG9uIGEgbW9iaWxlIGRldmljZS5cblx0ICovXG5cdGZ1bmN0aW9uIGhpZGVBZGRyZXNzQmFyKCkge1xuXG5cdFx0aWYoIGNvbmZpZy5oaWRlQWRkcmVzc0JhciAmJiBpc01vYmlsZURldmljZSApIHtcblx0XHRcdC8vIEV2ZW50cyB0aGF0IHNob3VsZCB0cmlnZ2VyIHRoZSBhZGRyZXNzIGJhciB0byBoaWRlXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCByZW1vdmVBZGRyZXNzQmFyLCBmYWxzZSApO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdvcmllbnRhdGlvbmNoYW5nZScsIHJlbW92ZUFkZHJlc3NCYXIsIGZhbHNlICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2F1c2VzIHRoZSBhZGRyZXNzIGJhciB0byBoaWRlIG9uIG1vYmlsZSBkZXZpY2VzLFxuXHQgKiBtb3JlIHZlcnRpY2FsIHNwYWNlIGZ0dy5cblx0ICovXG5cdGZ1bmN0aW9uIHJlbW92ZUFkZHJlc3NCYXIoKSB7XG5cblx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcblx0XHRcdHdpbmRvdy5zY3JvbGxUbyggMCwgMSApO1xuXHRcdH0sIDEwICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNwYXRjaGVzIGFuIGV2ZW50IG9mIHRoZSBzcGVjaWZpZWQgdHlwZSBmcm9tIHRoZVxuXHQgKiByZXZlYWwgRE9NIGVsZW1lbnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBkaXNwYXRjaEV2ZW50KCB0eXBlLCBhcmdzICkge1xuXG5cdFx0dmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoICdIVE1MRXZlbnRzJywgMSwgMiApO1xuXHRcdGV2ZW50LmluaXRFdmVudCggdHlwZSwgdHJ1ZSwgdHJ1ZSApO1xuXHRcdGV4dGVuZCggZXZlbnQsIGFyZ3MgKTtcblx0XHRkb20ud3JhcHBlci5kaXNwYXRjaEV2ZW50KCBldmVudCApO1xuXG5cdFx0Ly8gSWYgd2UncmUgaW4gYW4gaWZyYW1lLCBwb3N0IGVhY2ggcmV2ZWFsLmpzIGV2ZW50IHRvIHRoZVxuXHRcdC8vIHBhcmVudCB3aW5kb3cuIFVzZWQgYnkgdGhlIG5vdGVzIHBsdWdpblxuXHRcdGlmKCBjb25maWcucG9zdE1lc3NhZ2VFdmVudHMgJiYgd2luZG93LnBhcmVudCAhPT0gd2luZG93LnNlbGYgKSB7XG5cdFx0XHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKCBKU09OLnN0cmluZ2lmeSh7IG5hbWVzcGFjZTogJ3JldmVhbCcsIGV2ZW50TmFtZTogdHlwZSwgc3RhdGU6IGdldFN0YXRlKCkgfSksICcqJyApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFdyYXAgYWxsIGxpbmtzIGluIDNEIGdvb2RuZXNzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZW5hYmxlUm9sbGluZ0xpbmtzKCkge1xuXG5cdFx0aWYoIGZlYXR1cmVzLnRyYW5zZm9ybXMzZCAmJiAhKCAnbXNQZXJzcGVjdGl2ZScgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSApICkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKyAnIGEnICk7XG5cblx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBhbmNob3JzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHR2YXIgYW5jaG9yID0gYW5jaG9yc1tpXTtcblxuXHRcdFx0XHRpZiggYW5jaG9yLnRleHRDb250ZW50ICYmICFhbmNob3IucXVlcnlTZWxlY3RvciggJyonICkgJiYgKCAhYW5jaG9yLmNsYXNzTmFtZSB8fCAhYW5jaG9yLmNsYXNzTGlzdC5jb250YWlucyggYW5jaG9yLCAncm9sbCcgKSApICkge1xuXHRcdFx0XHRcdHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRcdFx0XHRcdHNwYW4uc2V0QXR0cmlidXRlKCdkYXRhLXRpdGxlJywgYW5jaG9yLnRleHQpO1xuXHRcdFx0XHRcdHNwYW4uaW5uZXJIVE1MID0gYW5jaG9yLmlubmVySFRNTDtcblxuXHRcdFx0XHRcdGFuY2hvci5jbGFzc0xpc3QuYWRkKCAncm9sbCcgKTtcblx0XHRcdFx0XHRhbmNob3IuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRcdFx0YW5jaG9yLmFwcGVuZENoaWxkKHNwYW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVW53cmFwIGFsbCAzRCBsaW5rcy5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc2FibGVSb2xsaW5nTGlua3MoKSB7XG5cblx0XHR2YXIgYW5jaG9ycyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiArICcgYS5yb2xsJyApO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGFuY2hvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHR2YXIgYW5jaG9yID0gYW5jaG9yc1tpXTtcblx0XHRcdHZhciBzcGFuID0gYW5jaG9yLnF1ZXJ5U2VsZWN0b3IoICdzcGFuJyApO1xuXG5cdFx0XHRpZiggc3BhbiApIHtcblx0XHRcdFx0YW5jaG9yLmNsYXNzTGlzdC5yZW1vdmUoICdyb2xsJyApO1xuXHRcdFx0XHRhbmNob3IuaW5uZXJIVE1MID0gc3Bhbi5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQmluZCBwcmV2aWV3IGZyYW1lIGxpbmtzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZW5hYmxlUHJldmlld0xpbmtzKCBzZWxlY3RvciApIHtcblxuXHRcdHZhciBhbmNob3JzID0gdG9BcnJheSggZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggc2VsZWN0b3IgPyBzZWxlY3RvciA6ICdhJyApICk7XG5cblx0XHRhbmNob3JzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYoIC9eKGh0dHB8d3d3KS9naS50ZXN0KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2hyZWYnICkgKSApIHtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvblByZXZpZXdMaW5rQ2xpY2tlZCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVbmJpbmQgcHJldmlldyBmcmFtZSBsaW5rcy5cblx0ICovXG5cdGZ1bmN0aW9uIGRpc2FibGVQcmV2aWV3TGlua3MoKSB7XG5cblx0XHR2YXIgYW5jaG9ycyA9IHRvQXJyYXkoIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdhJyApICk7XG5cblx0XHRhbmNob3JzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYoIC9eKGh0dHB8d3d3KS9naS50ZXN0KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2hyZWYnICkgKSApIHtcblx0XHRcdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvblByZXZpZXdMaW5rQ2xpY2tlZCwgZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBPcGVucyBhIHByZXZpZXcgd2luZG93IGZvciB0aGUgdGFyZ2V0IFVSTC5cblx0ICovXG5cdGZ1bmN0aW9uIHNob3dQcmV2aWV3KCB1cmwgKSB7XG5cblx0XHRjbG9zZU92ZXJsYXkoKTtcblxuXHRcdGRvbS5vdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAnb3ZlcmxheScgKTtcblx0XHRkb20ub3ZlcmxheS5jbGFzc0xpc3QuYWRkKCAnb3ZlcmxheS1wcmV2aWV3JyApO1xuXHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBkb20ub3ZlcmxheSApO1xuXG5cdFx0ZG9tLm92ZXJsYXkuaW5uZXJIVE1MID0gW1xuXHRcdFx0JzxoZWFkZXI+Jyxcblx0XHRcdFx0JzxhIGNsYXNzPVwiY2xvc2VcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzPVwiaWNvblwiPjwvc3Bhbj48L2E+Jyxcblx0XHRcdFx0JzxhIGNsYXNzPVwiZXh0ZXJuYWxcIiBocmVmPVwiJysgdXJsICsnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PHNwYW4gY2xhc3M9XCJpY29uXCI+PC9zcGFuPjwvYT4nLFxuXHRcdFx0JzwvaGVhZGVyPicsXG5cdFx0XHQnPGRpdiBjbGFzcz1cInNwaW5uZXJcIj48L2Rpdj4nLFxuXHRcdFx0JzxkaXYgY2xhc3M9XCJ2aWV3cG9ydFwiPicsXG5cdFx0XHRcdCc8aWZyYW1lIHNyYz1cIicrIHVybCArJ1wiPjwvaWZyYW1lPicsXG5cdFx0XHQnPC9kaXY+J1xuXHRcdF0uam9pbignJyk7XG5cblx0XHRkb20ub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCAnaWZyYW1lJyApLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0ZG9tLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCggJ2xvYWRlZCcgKTtcblx0XHR9LCBmYWxzZSApO1xuXG5cdFx0ZG9tLm92ZXJsYXkucXVlcnlTZWxlY3RvciggJy5jbG9zZScgKS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fSwgZmFsc2UgKTtcblxuXHRcdGRvbS5vdmVybGF5LnF1ZXJ5U2VsZWN0b3IoICcuZXh0ZXJuYWwnICkuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0Y2xvc2VPdmVybGF5KCk7XG5cdFx0fSwgZmFsc2UgKTtcblxuXHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9tLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCggJ3Zpc2libGUnICk7XG5cdFx0fSwgMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogT3BlbnMgYSBvdmVybGF5IHdpbmRvdyB3aXRoIGhlbHAgbWF0ZXJpYWwuXG5cdCAqL1xuXHRmdW5jdGlvbiBzaG93SGVscCgpIHtcblxuXHRcdGlmKCBjb25maWcuaGVscCApIHtcblxuXHRcdFx0Y2xvc2VPdmVybGF5KCk7XG5cblx0XHRcdGRvbS5vdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICdvdmVybGF5JyApO1xuXHRcdFx0ZG9tLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCggJ292ZXJsYXktaGVscCcgKTtcblx0XHRcdGRvbS53cmFwcGVyLmFwcGVuZENoaWxkKCBkb20ub3ZlcmxheSApO1xuXG5cdFx0XHR2YXIgaHRtbCA9ICc8cCBjbGFzcz1cInRpdGxlXCI+S2V5Ym9hcmQgU2hvcnRjdXRzPC9wPjxici8+JztcblxuXHRcdFx0aHRtbCArPSAnPHRhYmxlPjx0aD5LRVk8L3RoPjx0aD5BQ1RJT048L3RoPic7XG5cdFx0XHRmb3IoIHZhciBrZXkgaW4ga2V5Ym9hcmRTaG9ydGN1dHMgKSB7XG5cdFx0XHRcdGh0bWwgKz0gJzx0cj48dGQ+JyArIGtleSArICc8L3RkPjx0ZD4nICsga2V5Ym9hcmRTaG9ydGN1dHNbIGtleSBdICsgJzwvdGQ+PC90cj4nO1xuXHRcdFx0fVxuXG5cdFx0XHRodG1sICs9ICc8L3RhYmxlPic7XG5cblx0XHRcdGRvbS5vdmVybGF5LmlubmVySFRNTCA9IFtcblx0XHRcdFx0JzxoZWFkZXI+Jyxcblx0XHRcdFx0XHQnPGEgY2xhc3M9XCJjbG9zZVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3M9XCJpY29uXCI+PC9zcGFuPjwvYT4nLFxuXHRcdFx0XHQnPC9oZWFkZXI+Jyxcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ2aWV3cG9ydFwiPicsXG5cdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ2aWV3cG9ydC1pbm5lclwiPicrIGh0bWwgKyc8L2Rpdj4nLFxuXHRcdFx0XHQnPC9kaXY+J1xuXHRcdFx0XS5qb2luKCcnKTtcblxuXHRcdFx0ZG9tLm92ZXJsYXkucXVlcnlTZWxlY3RvciggJy5jbG9zZScgKS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdGNsb3NlT3ZlcmxheSgpO1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fSwgZmFsc2UgKTtcblxuXHRcdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGRvbS5vdmVybGF5LmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0fSwgMSApO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQ2xvc2VzIGFueSBjdXJyZW50bHkgb3BlbiBvdmVybGF5LlxuXHQgKi9cblx0ZnVuY3Rpb24gY2xvc2VPdmVybGF5KCkge1xuXG5cdFx0aWYoIGRvbS5vdmVybGF5ICkge1xuXHRcdFx0ZG9tLm92ZXJsYXkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggZG9tLm92ZXJsYXkgKTtcblx0XHRcdGRvbS5vdmVybGF5ID0gbnVsbDtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIEphdmFTY3JpcHQtY29udHJvbGxlZCBsYXlvdXQgcnVsZXMgdG8gdGhlXG5cdCAqIHByZXNlbnRhdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGxheW91dCgpIHtcblxuXHRcdGlmKCBkb20ud3JhcHBlciAmJiAhaXNQcmludGluZ1BERigpICkge1xuXG5cdFx0XHR2YXIgc2l6ZSA9IGdldENvbXB1dGVkU2xpZGVTaXplKCk7XG5cblx0XHRcdHZhciBzbGlkZVBhZGRpbmcgPSAyMDsgLy8gVE9ETyBEaWcgdGhpcyBvdXQgb2YgRE9NXG5cblx0XHRcdC8vIExheW91dCB0aGUgY29udGVudHMgb2YgdGhlIHNsaWRlc1xuXHRcdFx0bGF5b3V0U2xpZGVDb250ZW50cyggY29uZmlnLndpZHRoLCBjb25maWcuaGVpZ2h0LCBzbGlkZVBhZGRpbmcgKTtcblxuXHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS53aWR0aCA9IHNpemUud2lkdGggKyAncHgnO1xuXHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5oZWlnaHQgPSBzaXplLmhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIERldGVybWluZSBzY2FsZSBvZiBjb250ZW50IHRvIGZpdCB3aXRoaW4gYXZhaWxhYmxlIHNwYWNlXG5cdFx0XHRzY2FsZSA9IE1hdGgubWluKCBzaXplLnByZXNlbnRhdGlvbldpZHRoIC8gc2l6ZS53aWR0aCwgc2l6ZS5wcmVzZW50YXRpb25IZWlnaHQgLyBzaXplLmhlaWdodCApO1xuXG5cdFx0XHQvLyBSZXNwZWN0IG1heC9taW4gc2NhbGUgc2V0dGluZ3Ncblx0XHRcdHNjYWxlID0gTWF0aC5tYXgoIHNjYWxlLCBjb25maWcubWluU2NhbGUgKTtcblx0XHRcdHNjYWxlID0gTWF0aC5taW4oIHNjYWxlLCBjb25maWcubWF4U2NhbGUgKTtcblxuXHRcdFx0Ly8gRG9uJ3QgYXBwbHkgYW55IHNjYWxpbmcgc3R5bGVzIGlmIHNjYWxlIGlzIDFcblx0XHRcdGlmKCBzY2FsZSA9PT0gMSApIHtcblx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS56b29tID0gJyc7XG5cdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUubGVmdCA9ICcnO1xuXHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnRvcCA9ICcnO1xuXHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLmJvdHRvbSA9ICcnO1xuXHRcdFx0XHRkb20uc2xpZGVzLnN0eWxlLnJpZ2h0ID0gJyc7XG5cdFx0XHRcdHRyYW5zZm9ybUVsZW1lbnQoIGRvbS5zbGlkZXMsICcnICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gUHJlZmVyIHpvb21pbmcgaW4gZGVza3RvcCBDaHJvbWUgc28gdGhhdCBjb250ZW50IHJlbWFpbnMgY3Jpc3Bcblx0XHRcdFx0aWYoICFpc01vYmlsZURldmljZSAmJiAvY2hyb21lL2kudGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApICYmIHR5cGVvZiBkb20uc2xpZGVzLnN0eWxlLnpvb20gIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUuem9vbSA9IHNjYWxlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIEFwcGx5IHNjYWxlIHRyYW5zZm9ybSBhcyBhIGZhbGxiYWNrXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUubGVmdCA9ICc1MCUnO1xuXHRcdFx0XHRcdGRvbS5zbGlkZXMuc3R5bGUudG9wID0gJzUwJSc7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5ib3R0b20gPSAnYXV0byc7XG5cdFx0XHRcdFx0ZG9tLnNsaWRlcy5zdHlsZS5yaWdodCA9ICdhdXRvJztcblx0XHRcdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCBkb20uc2xpZGVzLCAndHJhbnNsYXRlKC01MCUsIC01MCUpIHNjYWxlKCcrIHNjYWxlICsnKScgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZWxlY3QgYWxsIHNsaWRlcywgdmVydGljYWwgYW5kIGhvcml6b250YWxcblx0XHRcdHZhciBzbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBTTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gc2xpZGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHR2YXIgc2xpZGUgPSBzbGlkZXNbIGkgXTtcblxuXHRcdFx0XHQvLyBEb24ndCBib3RoZXIgdXBkYXRpbmcgaW52aXNpYmxlIHNsaWRlc1xuXHRcdFx0XHRpZiggc2xpZGUuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGNvbmZpZy5jZW50ZXIgfHwgc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnY2VudGVyJyApICkge1xuXHRcdFx0XHRcdC8vIFZlcnRpY2FsIHN0YWNrcyBhcmUgbm90IGNlbnRyZWQgc2luY2UgdGhlaXIgc2VjdGlvblxuXHRcdFx0XHRcdC8vIGNoaWxkcmVuIHdpbGwgYmVcblx0XHRcdFx0XHRpZiggc2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgKSB7XG5cdFx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdHNsaWRlLnN0eWxlLnRvcCA9IE1hdGgubWF4KCAoICggc2l6ZS5oZWlnaHQgLSBnZXRBYnNvbHV0ZUhlaWdodCggc2xpZGUgKSApIC8gMiApIC0gc2xpZGVQYWRkaW5nLCAwICkgKyAncHgnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzbGlkZS5zdHlsZS50b3AgPSAnJztcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHVwZGF0ZVByb2dyZXNzKCk7XG5cdFx0XHR1cGRhdGVQYXJhbGxheCgpO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyBsYXlvdXQgbG9naWMgdG8gdGhlIGNvbnRlbnRzIG9mIGFsbCBzbGlkZXMgaW5cblx0ICogdGhlIHByZXNlbnRhdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGxheW91dFNsaWRlQ29udGVudHMoIHdpZHRoLCBoZWlnaHQsIHBhZGRpbmcgKSB7XG5cblx0XHQvLyBIYW5kbGUgc2l6aW5nIG9mIGVsZW1lbnRzIHdpdGggdGhlICdzdHJldGNoJyBjbGFzc1xuXHRcdHRvQXJyYXkoIGRvbS5zbGlkZXMucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24gPiAuc3RyZXRjaCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXG5cdFx0XHQvLyBEZXRlcm1pbmUgaG93IG11Y2ggdmVydGljYWwgc3BhY2Ugd2UgY2FuIHVzZVxuXHRcdFx0dmFyIHJlbWFpbmluZ0hlaWdodCA9IGdldFJlbWFpbmluZ0hlaWdodCggZWxlbWVudCwgaGVpZ2h0ICk7XG5cblx0XHRcdC8vIENvbnNpZGVyIHRoZSBhc3BlY3QgcmF0aW8gb2YgbWVkaWEgZWxlbWVudHNcblx0XHRcdGlmKCAvKGltZ3x2aWRlbykvZ2kudGVzdCggZWxlbWVudC5ub2RlTmFtZSApICkge1xuXHRcdFx0XHR2YXIgbncgPSBlbGVtZW50Lm5hdHVyYWxXaWR0aCB8fCBlbGVtZW50LnZpZGVvV2lkdGgsXG5cdFx0XHRcdFx0bmggPSBlbGVtZW50Lm5hdHVyYWxIZWlnaHQgfHwgZWxlbWVudC52aWRlb0hlaWdodDtcblxuXHRcdFx0XHR2YXIgZXMgPSBNYXRoLm1pbiggd2lkdGggLyBudywgcmVtYWluaW5nSGVpZ2h0IC8gbmggKTtcblxuXHRcdFx0XHRlbGVtZW50LnN0eWxlLndpZHRoID0gKCBudyAqIGVzICkgKyAncHgnO1xuXHRcdFx0XHRlbGVtZW50LnN0eWxlLmhlaWdodCA9ICggbmggKiBlcyApICsgJ3B4JztcblxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gcmVtYWluaW5nSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZXMgdGhlIGNvbXB1dGVkIHBpeGVsIHNpemUgb2Ygb3VyIHNsaWRlcy4gVGhlc2Vcblx0ICogdmFsdWVzIGFyZSBiYXNlZCBvbiB0aGUgd2lkdGggYW5kIGhlaWdodCBjb25maWd1cmF0aW9uXG5cdCAqIG9wdGlvbnMuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRDb21wdXRlZFNsaWRlU2l6ZSggcHJlc2VudGF0aW9uV2lkdGgsIHByZXNlbnRhdGlvbkhlaWdodCApIHtcblxuXHRcdHZhciBzaXplID0ge1xuXHRcdFx0Ly8gU2xpZGUgc2l6ZVxuXHRcdFx0d2lkdGg6IGNvbmZpZy53aWR0aCxcblx0XHRcdGhlaWdodDogY29uZmlnLmhlaWdodCxcblxuXHRcdFx0Ly8gUHJlc2VudGF0aW9uIHNpemVcblx0XHRcdHByZXNlbnRhdGlvbldpZHRoOiBwcmVzZW50YXRpb25XaWR0aCB8fCBkb20ud3JhcHBlci5vZmZzZXRXaWR0aCxcblx0XHRcdHByZXNlbnRhdGlvbkhlaWdodDogcHJlc2VudGF0aW9uSGVpZ2h0IHx8IGRvbS53cmFwcGVyLm9mZnNldEhlaWdodFxuXHRcdH07XG5cblx0XHQvLyBSZWR1Y2UgYXZhaWxhYmxlIHNwYWNlIGJ5IG1hcmdpblxuXHRcdHNpemUucHJlc2VudGF0aW9uV2lkdGggLT0gKCBzaXplLnByZXNlbnRhdGlvbkhlaWdodCAqIGNvbmZpZy5tYXJnaW4gKTtcblx0XHRzaXplLnByZXNlbnRhdGlvbkhlaWdodCAtPSAoIHNpemUucHJlc2VudGF0aW9uSGVpZ2h0ICogY29uZmlnLm1hcmdpbiApO1xuXG5cdFx0Ly8gU2xpZGUgd2lkdGggbWF5IGJlIGEgcGVyY2VudGFnZSBvZiBhdmFpbGFibGUgd2lkdGhcblx0XHRpZiggdHlwZW9mIHNpemUud2lkdGggPT09ICdzdHJpbmcnICYmIC8lJC8udGVzdCggc2l6ZS53aWR0aCApICkge1xuXHRcdFx0c2l6ZS53aWR0aCA9IHBhcnNlSW50KCBzaXplLndpZHRoLCAxMCApIC8gMTAwICogc2l6ZS5wcmVzZW50YXRpb25XaWR0aDtcblx0XHR9XG5cblx0XHQvLyBTbGlkZSBoZWlnaHQgbWF5IGJlIGEgcGVyY2VudGFnZSBvZiBhdmFpbGFibGUgaGVpZ2h0XG5cdFx0aWYoIHR5cGVvZiBzaXplLmhlaWdodCA9PT0gJ3N0cmluZycgJiYgLyUkLy50ZXN0KCBzaXplLmhlaWdodCApICkge1xuXHRcdFx0c2l6ZS5oZWlnaHQgPSBwYXJzZUludCggc2l6ZS5oZWlnaHQsIDEwICkgLyAxMDAgKiBzaXplLnByZXNlbnRhdGlvbkhlaWdodDtcblx0XHR9XG5cblx0XHRyZXR1cm4gc2l6ZTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3JlcyB0aGUgdmVydGljYWwgaW5kZXggb2YgYSBzdGFjayBzbyB0aGF0IHRoZSBzYW1lXG5cdCAqIHZlcnRpY2FsIHNsaWRlIGNhbiBiZSBzZWxlY3RlZCB3aGVuIG5hdmlnYXRpbmcgdG8gYW5kXG5cdCAqIGZyb20gdGhlIHN0YWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzdGFjayBUaGUgdmVydGljYWwgc3RhY2sgZWxlbWVudFxuXHQgKiBAcGFyYW0ge2ludH0gdiBJbmRleCB0byBtZW1vcml6ZVxuXHQgKi9cblx0ZnVuY3Rpb24gc2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBzdGFjaywgdiApIHtcblxuXHRcdGlmKCB0eXBlb2Ygc3RhY2sgPT09ICdvYmplY3QnICYmIHR5cGVvZiBzdGFjay5zZXRBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRzdGFjay5zZXRBdHRyaWJ1dGUoICdkYXRhLXByZXZpb3VzLWluZGV4dicsIHYgfHwgMCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgdmVydGljYWwgaW5kZXggd2hpY2ggd2FzIHN0b3JlZCB1c2luZ1xuXHQgKiAjc2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCkgb3IgMCBpZiBubyBwcmV2aW91cyBpbmRleFxuXHQgKiBleGlzdHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHN0YWNrIFRoZSB2ZXJ0aWNhbCBzdGFjayBlbGVtZW50XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIHN0YWNrICkge1xuXG5cdFx0aWYoIHR5cGVvZiBzdGFjayA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHN0YWNrLnNldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzdGFjay5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblx0XHRcdC8vIFByZWZlciBtYW51YWxseSBkZWZpbmVkIHN0YXJ0LWluZGV4dlxuXHRcdFx0dmFyIGF0dHJpYnV0ZU5hbWUgPSBzdGFjay5oYXNBdHRyaWJ1dGUoICdkYXRhLXN0YXJ0LWluZGV4dicgKSA/ICdkYXRhLXN0YXJ0LWluZGV4dicgOiAnZGF0YS1wcmV2aW91cy1pbmRleHYnO1xuXG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQoIHN0YWNrLmdldEF0dHJpYnV0ZSggYXR0cmlidXRlTmFtZSApIHx8IDAsIDEwICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIDA7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNwbGF5cyB0aGUgb3ZlcnZpZXcgb2Ygc2xpZGVzIChxdWljayBuYXYpIGJ5XG5cdCAqIHNjYWxpbmcgZG93biBhbmQgYXJyYW5naW5nIGFsbCBzbGlkZSBlbGVtZW50cy5cblx0ICpcblx0ICogRXhwZXJpbWVudGFsIGZlYXR1cmUsIG1pZ2h0IGJlIGRyb3BwZWQgaWYgcGVyZlxuXHQgKiBjYW4ndCBiZSBpbXByb3ZlZC5cblx0ICovXG5cdGZ1bmN0aW9uIGFjdGl2YXRlT3ZlcnZpZXcoKSB7XG5cblx0XHQvLyBPbmx5IHByb2NlZWQgaWYgZW5hYmxlZCBpbiBjb25maWdcblx0XHRpZiggY29uZmlnLm92ZXJ2aWV3ICkge1xuXG5cdFx0XHQvLyBEb24ndCBhdXRvLXNsaWRlIHdoaWxlIGluIG92ZXJ2aWV3IG1vZGVcblx0XHRcdGNhbmNlbEF1dG9TbGlkZSgpO1xuXG5cdFx0XHR2YXIgd2FzQWN0aXZlID0gZG9tLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCAnb3ZlcnZpZXcnICk7XG5cblx0XHRcdC8vIFZhcnkgdGhlIGRlcHRoIG9mIHRoZSBvdmVydmlldyBiYXNlZCBvbiBzY3JlZW4gc2l6ZVxuXHRcdFx0dmFyIGRlcHRoID0gd2luZG93LmlubmVyV2lkdGggPCA0MDAgPyAxMDAwIDogMjUwMDtcblxuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ292ZXJ2aWV3JyApO1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ292ZXJ2aWV3LWRlYWN0aXZhdGluZycgKTtcblxuXHRcdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApO1xuXG5cdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuMSA9IGhvcml6b250YWxTbGlkZXMubGVuZ3RoOyBpIDwgbGVuMTsgaSsrICkge1xuXHRcdFx0XHR2YXIgaHNsaWRlID0gaG9yaXpvbnRhbFNsaWRlc1tpXSxcblx0XHRcdFx0XHRob2Zmc2V0ID0gY29uZmlnLnJ0bCA/IC0xMDUgOiAxMDU7XG5cblx0XHRcdFx0aHNsaWRlLnNldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtaCcsIGkgKTtcblxuXHRcdFx0XHQvLyBBcHBseSBDU1MgdHJhbnNmb3JtXG5cdFx0XHRcdHRyYW5zZm9ybUVsZW1lbnQoIGhzbGlkZSwgJ3RyYW5zbGF0ZVooLScrIGRlcHRoICsncHgpIHRyYW5zbGF0ZSgnICsgKCAoIGkgLSBpbmRleGggKSAqIGhvZmZzZXQgKSArICclLCAwJSknICk7XG5cblx0XHRcdFx0aWYoIGhzbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoICdzdGFjaycgKSApIHtcblxuXHRcdFx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlcyA9IGhzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKTtcblxuXHRcdFx0XHRcdGZvciggdmFyIGogPSAwLCBsZW4yID0gdmVydGljYWxTbGlkZXMubGVuZ3RoOyBqIDwgbGVuMjsgaisrICkge1xuXHRcdFx0XHRcdFx0dmFyIHZlcnRpY2FsSW5kZXggPSBpID09PSBpbmRleGggPyBpbmRleHYgOiBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIGhzbGlkZSApO1xuXG5cdFx0XHRcdFx0XHR2YXIgdnNsaWRlID0gdmVydGljYWxTbGlkZXNbal07XG5cblx0XHRcdFx0XHRcdHZzbGlkZS5zZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LWgnLCBpICk7XG5cdFx0XHRcdFx0XHR2c2xpZGUuc2V0QXR0cmlidXRlKCAnZGF0YS1pbmRleC12JywgaiApO1xuXG5cdFx0XHRcdFx0XHQvLyBBcHBseSBDU1MgdHJhbnNmb3JtXG5cdFx0XHRcdFx0XHR0cmFuc2Zvcm1FbGVtZW50KCB2c2xpZGUsICd0cmFuc2xhdGUoMCUsICcgKyAoICggaiAtIHZlcnRpY2FsSW5kZXggKSAqIDEwNSApICsgJyUpJyApO1xuXG5cdFx0XHRcdFx0XHQvLyBOYXZpZ2F0ZSB0byB0aGlzIHNsaWRlIG9uIGNsaWNrXG5cdFx0XHRcdFx0XHR2c2xpZGUuYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25PdmVydmlld1NsaWRlQ2xpY2tlZCwgdHJ1ZSApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXG5cdFx0XHRcdFx0Ly8gTmF2aWdhdGUgdG8gdGhpcyBzbGlkZSBvbiBjbGlja1xuXHRcdFx0XHRcdGhzbGlkZS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkLCB0cnVlICk7XG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR1cGRhdGVTbGlkZXNWaXNpYmlsaXR5KCk7XG5cblx0XHRcdGxheW91dCgpO1xuXG5cdFx0XHRpZiggIXdhc0FjdGl2ZSApIHtcblx0XHRcdFx0Ly8gTm90aWZ5IG9ic2VydmVycyBvZiB0aGUgb3ZlcnZpZXcgc2hvd2luZ1xuXHRcdFx0XHRkaXNwYXRjaEV2ZW50KCAnb3ZlcnZpZXdzaG93bicsIHtcblx0XHRcdFx0XHQnaW5kZXhoJzogaW5kZXhoLFxuXHRcdFx0XHRcdCdpbmRleHYnOiBpbmRleHYsXG5cdFx0XHRcdFx0J2N1cnJlbnRTbGlkZSc6IGN1cnJlbnRTbGlkZVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBFeGl0cyB0aGUgc2xpZGUgb3ZlcnZpZXcgYW5kIGVudGVycyB0aGUgY3VycmVudGx5XG5cdCAqIGFjdGl2ZSBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIGRlYWN0aXZhdGVPdmVydmlldygpIHtcblxuXHRcdC8vIE9ubHkgcHJvY2VlZCBpZiBlbmFibGVkIGluIGNvbmZpZ1xuXHRcdGlmKCBjb25maWcub3ZlcnZpZXcgKSB7XG5cblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdvdmVydmlldycgKTtcblxuXHRcdFx0Ly8gVGVtcG9yYXJpbHkgYWRkIGEgY2xhc3Mgc28gdGhhdCB0cmFuc2l0aW9ucyBjYW4gZG8gZGlmZmVyZW50IHRoaW5nc1xuXHRcdFx0Ly8gZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhleSBhcmUgZXhpdGluZy9lbnRlcmluZyBvdmVydmlldywgb3IganVzdFxuXHRcdFx0Ly8gbW92aW5nIGZyb20gc2xpZGUgdG8gc2xpZGVcblx0XHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5hZGQoICdvdmVydmlldy1kZWFjdGl2YXRpbmcnICk7XG5cblx0XHRcdHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggJ292ZXJ2aWV3LWRlYWN0aXZhdGluZycgKTtcblx0XHRcdH0sIDEgKTtcblxuXHRcdFx0Ly8gU2VsZWN0IGFsbCBzbGlkZXNcblx0XHRcdHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFNMSURFU19TRUxFQ1RPUiApICkuZm9yRWFjaCggZnVuY3Rpb24oIHNsaWRlICkge1xuXHRcdFx0XHQvLyBSZXNldHMgYWxsIHRyYW5zZm9ybXMgdG8gdXNlIHRoZSBleHRlcm5hbCBzdHlsZXNcblx0XHRcdFx0dHJhbnNmb3JtRWxlbWVudCggc2xpZGUsICcnICk7XG5cblx0XHRcdFx0c2xpZGUucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb25PdmVydmlld1NsaWRlQ2xpY2tlZCwgdHJ1ZSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRzbGlkZSggaW5kZXhoLCBpbmRleHYgKTtcblxuXHRcdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0XHRcdC8vIE5vdGlmeSBvYnNlcnZlcnMgb2YgdGhlIG92ZXJ2aWV3IGhpZGluZ1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ292ZXJ2aWV3aGlkZGVuJywge1xuXHRcdFx0XHQnaW5kZXhoJzogaW5kZXhoLFxuXHRcdFx0XHQnaW5kZXh2JzogaW5kZXh2LFxuXHRcdFx0XHQnY3VycmVudFNsaWRlJzogY3VycmVudFNsaWRlXG5cdFx0XHR9ICk7XG5cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVG9nZ2xlcyB0aGUgc2xpZGUgb3ZlcnZpZXcgbW9kZSBvbiBhbmQgb2ZmLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IG92ZXJyaWRlIE9wdGlvbmFsIGZsYWcgd2hpY2ggb3ZlcnJpZGVzIHRoZVxuXHQgKiB0b2dnbGUgbG9naWMgYW5kIGZvcmNpYmx5IHNldHMgdGhlIGRlc2lyZWQgc3RhdGUuIFRydWUgbWVhbnNcblx0ICogb3ZlcnZpZXcgaXMgb3BlbiwgZmFsc2UgbWVhbnMgaXQncyBjbG9zZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b2dnbGVPdmVydmlldyggb3ZlcnJpZGUgKSB7XG5cblx0XHRpZiggdHlwZW9mIG92ZXJyaWRlID09PSAnYm9vbGVhbicgKSB7XG5cdFx0XHRvdmVycmlkZSA/IGFjdGl2YXRlT3ZlcnZpZXcoKSA6IGRlYWN0aXZhdGVPdmVydmlldygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlzT3ZlcnZpZXcoKSA/IGRlYWN0aXZhdGVPdmVydmlldygpIDogYWN0aXZhdGVPdmVydmlldygpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgb3ZlcnZpZXcgaXMgY3VycmVudGx5IGFjdGl2ZS5cblx0ICpcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGUgb3ZlcnZpZXcgaXMgYWN0aXZlLFxuXHQgKiBmYWxzZSBvdGhlcndpc2Vcblx0ICovXG5cdGZ1bmN0aW9uIGlzT3ZlcnZpZXcoKSB7XG5cblx0XHRyZXR1cm4gZG9tLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCAnb3ZlcnZpZXcnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhlIGN1cnJlbnQgb3Igc3BlY2lmaWVkIHNsaWRlIGlzIHZlcnRpY2FsXG5cdCAqIChuZXN0ZWQgd2l0aGluIGFub3RoZXIgc2xpZGUpLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzbGlkZSBbb3B0aW9uYWxdIFRoZSBzbGlkZSB0byBjaGVja1xuXHQgKiBvcmllbnRhdGlvbiBvZlxuXHQgKi9cblx0ZnVuY3Rpb24gaXNWZXJ0aWNhbFNsaWRlKCBzbGlkZSApIHtcblxuXHRcdC8vIFByZWZlciBzbGlkZSBhcmd1bWVudCwgb3RoZXJ3aXNlIHVzZSBjdXJyZW50IHNsaWRlXG5cdFx0c2xpZGUgPSBzbGlkZSA/IHNsaWRlIDogY3VycmVudFNsaWRlO1xuXG5cdFx0cmV0dXJuIHNsaWRlICYmIHNsaWRlLnBhcmVudE5vZGUgJiYgISFzbGlkZS5wYXJlbnROb2RlLm5vZGVOYW1lLm1hdGNoKCAvc2VjdGlvbi9pICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGluZyB0aGUgZnVsbHNjcmVlbiBmdW5jdGlvbmFsaXR5IHZpYSB0aGUgZnVsbHNjcmVlbiBBUElcblx0ICpcblx0ICogQHNlZSBodHRwOi8vZnVsbHNjcmVlbi5zcGVjLndoYXR3Zy5vcmcvXG5cdCAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9ET00vVXNpbmdfZnVsbHNjcmVlbl9tb2RlXG5cdCAqL1xuXHRmdW5jdGlvbiBlbnRlckZ1bGxzY3JlZW4oKSB7XG5cblx0XHR2YXIgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cblx0XHQvLyBDaGVjayB3aGljaCBpbXBsZW1lbnRhdGlvbiBpcyBhdmFpbGFibGVcblx0XHR2YXIgcmVxdWVzdE1ldGhvZCA9IGVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4gfHxcblx0XHRcdFx0XHRcdFx0ZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbiB8fFxuXHRcdFx0XHRcdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIHx8XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4gfHxcblx0XHRcdFx0XHRcdFx0ZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuO1xuXG5cdFx0aWYoIHJlcXVlc3RNZXRob2QgKSB7XG5cdFx0XHRyZXF1ZXN0TWV0aG9kLmFwcGx5KCBlbGVtZW50ICk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRW50ZXJzIHRoZSBwYXVzZWQgbW9kZSB3aGljaCBmYWRlcyBldmVyeXRoaW5nIG9uIHNjcmVlbiB0b1xuXHQgKiBibGFjay5cblx0ICovXG5cdGZ1bmN0aW9uIHBhdXNlKCkge1xuXG5cdFx0aWYoIGNvbmZpZy5wYXVzZSApIHtcblx0XHRcdHZhciB3YXNQYXVzZWQgPSBkb20ud3JhcHBlci5jbGFzc0xpc3QuY29udGFpbnMoICdwYXVzZWQnICk7XG5cblx0XHRcdGNhbmNlbEF1dG9TbGlkZSgpO1xuXHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LmFkZCggJ3BhdXNlZCcgKTtcblxuXHRcdFx0aWYoIHdhc1BhdXNlZCA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdGRpc3BhdGNoRXZlbnQoICdwYXVzZWQnICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRXhpdHMgZnJvbSB0aGUgcGF1c2VkIG1vZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiByZXN1bWUoKSB7XG5cblx0XHR2YXIgd2FzUGF1c2VkID0gZG9tLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCAncGF1c2VkJyApO1xuXHRcdGRvbS53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoICdwYXVzZWQnICk7XG5cblx0XHRjdWVBdXRvU2xpZGUoKTtcblxuXHRcdGlmKCB3YXNQYXVzZWQgKSB7XG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAncmVzdW1lZCcgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGVzIHRoZSBwYXVzZWQgbW9kZSBvbiBhbmQgb2ZmLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9nZ2xlUGF1c2UoIG92ZXJyaWRlICkge1xuXG5cdFx0aWYoIHR5cGVvZiBvdmVycmlkZSA9PT0gJ2Jvb2xlYW4nICkge1xuXHRcdFx0b3ZlcnJpZGUgPyBwYXVzZSgpIDogcmVzdW1lKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aXNQYXVzZWQoKSA/IHJlc3VtZSgpIDogcGF1c2UoKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgd2UgYXJlIGN1cnJlbnRseSBpbiB0aGUgcGF1c2VkIG1vZGUuXG5cdCAqL1xuXHRmdW5jdGlvbiBpc1BhdXNlZCgpIHtcblxuXHRcdHJldHVybiBkb20ud3JhcHBlci5jbGFzc0xpc3QuY29udGFpbnMoICdwYXVzZWQnICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBUb2dnbGVzIHRoZSBhdXRvIHNsaWRlIG1vZGUgb24gYW5kIG9mZi5cblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSBvdmVycmlkZSBPcHRpb25hbCBmbGFnIHdoaWNoIHNldHMgdGhlIGRlc2lyZWQgc3RhdGUuXG5cdCAqIFRydWUgbWVhbnMgYXV0b3BsYXkgc3RhcnRzLCBmYWxzZSBtZWFucyBpdCBzdG9wcy5cblx0ICovXG5cblx0ZnVuY3Rpb24gdG9nZ2xlQXV0b1NsaWRlKCBvdmVycmlkZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygb3ZlcnJpZGUgPT09ICdib29sZWFuJyApIHtcblx0XHRcdG92ZXJyaWRlID8gcmVzdW1lQXV0b1NsaWRlKCkgOiBwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHRcdGVsc2Uge1xuXHRcdFx0YXV0b1NsaWRlUGF1c2VkID8gcmVzdW1lQXV0b1NsaWRlKCkgOiBwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgYXV0byBzbGlkZSBtb2RlIGlzIGN1cnJlbnRseSBvbi5cblx0ICovXG5cdGZ1bmN0aW9uIGlzQXV0b1NsaWRpbmcoKSB7XG5cblx0XHRyZXR1cm4gISEoIGF1dG9TbGlkZSAmJiAhYXV0b1NsaWRlUGF1c2VkICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGVwcyBmcm9tIHRoZSBjdXJyZW50IHBvaW50IGluIHRoZSBwcmVzZW50YXRpb24gdG8gdGhlXG5cdCAqIHNsaWRlIHdoaWNoIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbFxuXHQgKiBpbmRpY2VzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge2ludH0gaCBIb3Jpem9udGFsIGluZGV4IG9mIHRoZSB0YXJnZXQgc2xpZGVcblx0ICogQHBhcmFtIHtpbnR9IHYgVmVydGljYWwgaW5kZXggb2YgdGhlIHRhcmdldCBzbGlkZVxuXHQgKiBAcGFyYW0ge2ludH0gZiBPcHRpb25hbCBpbmRleCBvZiBhIGZyYWdtZW50IHdpdGhpbiB0aGVcblx0ICogdGFyZ2V0IHNsaWRlIHRvIGFjdGl2YXRlXG5cdCAqIEBwYXJhbSB7aW50fSBvIE9wdGlvbmFsIG9yaWdpbiBmb3IgdXNlIGluIG11bHRpbWFzdGVyIGVudmlyb25tZW50c1xuXHQgKi9cblx0ZnVuY3Rpb24gc2xpZGUoIGgsIHYsIGYsIG8gKSB7XG5cblx0XHQvLyBSZW1lbWJlciB3aGVyZSB3ZSB3ZXJlIGF0IGJlZm9yZVxuXHRcdHByZXZpb3VzU2xpZGUgPSBjdXJyZW50U2xpZGU7XG5cblx0XHQvLyBRdWVyeSBhbGwgaG9yaXpvbnRhbCBzbGlkZXMgaW4gdGhlIGRlY2tcblx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlcyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICk7XG5cblx0XHQvLyBJZiBubyB2ZXJ0aWNhbCBpbmRleCBpcyBzcGVjaWZpZWQgYW5kIHRoZSB1cGNvbWluZyBzbGlkZSBpcyBhXG5cdFx0Ly8gc3RhY2ssIHJlc3VtZSBhdCBpdHMgcHJldmlvdXMgdmVydGljYWwgaW5kZXhcblx0XHRpZiggdiA9PT0gdW5kZWZpbmVkICkge1xuXHRcdFx0diA9IGdldFByZXZpb3VzVmVydGljYWxJbmRleCggaG9yaXpvbnRhbFNsaWRlc1sgaCBdICk7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgd2Ugd2VyZSBvbiBhIHZlcnRpY2FsIHN0YWNrLCByZW1lbWJlciB3aGF0IHZlcnRpY2FsIGluZGV4XG5cdFx0Ly8gaXQgd2FzIG9uIHNvIHdlIGNhbiByZXN1bWUgYXQgdGhlIHNhbWUgcG9zaXRpb24gd2hlbiByZXR1cm5pbmdcblx0XHRpZiggcHJldmlvdXNTbGlkZSAmJiBwcmV2aW91c1NsaWRlLnBhcmVudE5vZGUgJiYgcHJldmlvdXNTbGlkZS5wYXJlbnROb2RlLmNsYXNzTGlzdC5jb250YWlucyggJ3N0YWNrJyApICkge1xuXHRcdFx0c2V0UHJldmlvdXNWZXJ0aWNhbEluZGV4KCBwcmV2aW91c1NsaWRlLnBhcmVudE5vZGUsIGluZGV4diApO1xuXHRcdH1cblxuXHRcdC8vIFJlbWVtYmVyIHRoZSBzdGF0ZSBiZWZvcmUgdGhpcyBzbGlkZVxuXHRcdHZhciBzdGF0ZUJlZm9yZSA9IHN0YXRlLmNvbmNhdCgpO1xuXG5cdFx0Ly8gUmVzZXQgdGhlIHN0YXRlIGFycmF5XG5cdFx0c3RhdGUubGVuZ3RoID0gMDtcblxuXHRcdHZhciBpbmRleGhCZWZvcmUgPSBpbmRleGggfHwgMCxcblx0XHRcdGluZGV4dkJlZm9yZSA9IGluZGV4diB8fCAwO1xuXG5cdFx0Ly8gQWN0aXZhdGUgYW5kIHRyYW5zaXRpb24gdG8gdGhlIG5ldyBzbGlkZVxuXHRcdGluZGV4aCA9IHVwZGF0ZVNsaWRlcyggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IsIGggPT09IHVuZGVmaW5lZCA/IGluZGV4aCA6IGggKTtcblx0XHRpbmRleHYgPSB1cGRhdGVTbGlkZXMoIFZFUlRJQ0FMX1NMSURFU19TRUxFQ1RPUiwgdiA9PT0gdW5kZWZpbmVkID8gaW5kZXh2IDogdiApO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIHNsaWRlcyBub3cgdGhhdCB0aGUgaW5kaWNlcyBoYXZlIGNoYW5nZWRcblx0XHR1cGRhdGVTbGlkZXNWaXNpYmlsaXR5KCk7XG5cblx0XHRsYXlvdXQoKTtcblxuXHRcdC8vIEFwcGx5IHRoZSBuZXcgc3RhdGVcblx0XHRzdGF0ZUxvb3A6IGZvciggdmFyIGkgPSAwLCBsZW4gPSBzdGF0ZS5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdC8vIENoZWNrIGlmIHRoaXMgc3RhdGUgZXhpc3RlZCBvbiB0aGUgcHJldmlvdXMgc2xpZGUuIElmIGl0XG5cdFx0XHQvLyBkaWQsIHdlIHdpbGwgYXZvaWQgYWRkaW5nIGl0IHJlcGVhdGVkbHlcblx0XHRcdGZvciggdmFyIGogPSAwOyBqIDwgc3RhdGVCZWZvcmUubGVuZ3RoOyBqKysgKSB7XG5cdFx0XHRcdGlmKCBzdGF0ZUJlZm9yZVtqXSA9PT0gc3RhdGVbaV0gKSB7XG5cdFx0XHRcdFx0c3RhdGVCZWZvcmUuc3BsaWNlKCBqLCAxICk7XG5cdFx0XHRcdFx0Y29udGludWUgc3RhdGVMb29wO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCBzdGF0ZVtpXSApO1xuXG5cdFx0XHQvLyBEaXNwYXRjaCBjdXN0b20gZXZlbnQgbWF0Y2hpbmcgdGhlIHN0YXRlJ3MgbmFtZVxuXHRcdFx0ZGlzcGF0Y2hFdmVudCggc3RhdGVbaV0gKTtcblx0XHR9XG5cblx0XHQvLyBDbGVhbiB1cCB0aGUgcmVtYWlucyBvZiB0aGUgcHJldmlvdXMgc3RhdGVcblx0XHR3aGlsZSggc3RhdGVCZWZvcmUubGVuZ3RoICkge1xuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoIHN0YXRlQmVmb3JlLnBvcCgpICk7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG92ZXJ2aWV3IGlzIGFjdGl2ZSwgcmUtYWN0aXZhdGUgaXQgdG8gdXBkYXRlIHBvc2l0aW9uc1xuXHRcdGlmKCBpc092ZXJ2aWV3KCkgKSB7XG5cdFx0XHRhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCB0aGUgY3VycmVudCBob3Jpem9udGFsIHNsaWRlIGFuZCBhbnkgcG9zc2libGUgdmVydGljYWwgc2xpZGVzXG5cdFx0Ly8gd2l0aGluIGl0XG5cdFx0dmFyIGN1cnJlbnRIb3Jpem9udGFsU2xpZGUgPSBob3Jpem9udGFsU2xpZGVzWyBpbmRleGggXSxcblx0XHRcdGN1cnJlbnRWZXJ0aWNhbFNsaWRlcyA9IGN1cnJlbnRIb3Jpem9udGFsU2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3NlY3Rpb24nICk7XG5cblx0XHQvLyBTdG9yZSByZWZlcmVuY2VzIHRvIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCBzbGlkZXNcblx0XHRjdXJyZW50U2xpZGUgPSBjdXJyZW50VmVydGljYWxTbGlkZXNbIGluZGV4diBdIHx8IGN1cnJlbnRIb3Jpem9udGFsU2xpZGU7XG5cblx0XHQvLyBTaG93IGZyYWdtZW50LCBpZiBzcGVjaWZpZWRcblx0XHRpZiggdHlwZW9mIGYgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0bmF2aWdhdGVGcmFnbWVudCggZiApO1xuXHRcdH1cblxuXHRcdC8vIERpc3BhdGNoIGFuIGV2ZW50IGlmIHRoZSBzbGlkZSBjaGFuZ2VkXG5cdFx0dmFyIHNsaWRlQ2hhbmdlZCA9ICggaW5kZXhoICE9PSBpbmRleGhCZWZvcmUgfHwgaW5kZXh2ICE9PSBpbmRleHZCZWZvcmUgKTtcblx0XHRpZiggc2xpZGVDaGFuZ2VkICkge1xuXHRcdFx0ZGlzcGF0Y2hFdmVudCggJ3NsaWRlY2hhbmdlZCcsIHtcblx0XHRcdFx0J2luZGV4aCc6IGluZGV4aCxcblx0XHRcdFx0J2luZGV4dic6IGluZGV4dixcblx0XHRcdFx0J3ByZXZpb3VzU2xpZGUnOiBwcmV2aW91c1NsaWRlLFxuXHRcdFx0XHQnY3VycmVudFNsaWRlJzogY3VycmVudFNsaWRlLFxuXHRcdFx0XHQnb3JpZ2luJzogb1xuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIEVuc3VyZSB0aGF0IHRoZSBwcmV2aW91cyBzbGlkZSBpcyBuZXZlciB0aGUgc2FtZSBhcyB0aGUgY3VycmVudFxuXHRcdFx0cHJldmlvdXNTbGlkZSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gU29sdmVzIGFuIGVkZ2UgY2FzZSB3aGVyZSB0aGUgcHJldmlvdXMgc2xpZGUgbWFpbnRhaW5zIHRoZVxuXHRcdC8vICdwcmVzZW50JyBjbGFzcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBhZGphY2VudCB2ZXJ0aWNhbFxuXHRcdC8vIHN0YWNrc1xuXHRcdGlmKCBwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0cHJldmlvdXNTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblx0XHRcdHByZXZpb3VzU2xpZGUuc2V0QXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nLCAndHJ1ZScgKTtcblxuXHRcdFx0Ly8gUmVzZXQgYWxsIHNsaWRlcyB1cG9uIG5hdmlnYXRlIHRvIGhvbWVcblx0XHRcdC8vIElzc3VlOiAjMjg1XG5cdFx0XHRpZiAoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3IoIEhPTUVfU0xJREVfU0VMRUNUT1IgKS5jbGFzc0xpc3QuY29udGFpbnMoICdwcmVzZW50JyApICkge1xuXHRcdFx0XHQvLyBMYXVuY2ggYXN5bmMgdGFza1xuXHRcdFx0XHRzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dmFyIHNsaWRlcyA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICsgJy5zdGFjaycpICksIGk7XG5cdFx0XHRcdFx0Zm9yKCBpIGluIHNsaWRlcyApIHtcblx0XHRcdFx0XHRcdGlmKCBzbGlkZXNbaV0gKSB7XG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHN0YWNrXG5cdFx0XHRcdFx0XHRcdHNldFByZXZpb3VzVmVydGljYWxJbmRleCggc2xpZGVzW2ldLCAwICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAwICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSGFuZGxlIGVtYmVkZGVkIGNvbnRlbnRcblx0XHRpZiggc2xpZGVDaGFuZ2VkIHx8ICFwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0c3RvcEVtYmVkZGVkQ29udGVudCggcHJldmlvdXNTbGlkZSApO1xuXHRcdFx0c3RhcnRFbWJlZGRlZENvbnRlbnQoIGN1cnJlbnRTbGlkZSApO1xuXHRcdH1cblxuXHRcdC8vIEFubm91bmNlIHRoZSBjdXJyZW50IHNsaWRlIGNvbnRlbnRzLCBmb3Igc2NyZWVuIHJlYWRlcnNcblx0XHRkb20uc3RhdHVzRGl2LnRleHRDb250ZW50ID0gY3VycmVudFNsaWRlLnRleHRDb250ZW50O1xuXG5cdFx0dXBkYXRlQ29udHJvbHMoKTtcblx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHRcdHVwZGF0ZUJhY2tncm91bmQoKTtcblx0XHR1cGRhdGVQYXJhbGxheCgpO1xuXHRcdHVwZGF0ZVNsaWRlTnVtYmVyKCk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIFVSTCBoYXNoXG5cdFx0d3JpdGVVUkwoKTtcblxuXHRcdGN1ZUF1dG9TbGlkZSgpO1xuXG5cdH1cblxuXHQvKipcblx0ICogU3luY3MgdGhlIHByZXNlbnRhdGlvbiB3aXRoIHRoZSBjdXJyZW50IERPTS4gVXNlZnVsXG5cdCAqIHdoZW4gbmV3IHNsaWRlcyBvciBjb250cm9sIGVsZW1lbnRzIGFyZSBhZGRlZCBvciB3aGVuXG5cdCAqIHRoZSBjb25maWd1cmF0aW9uIGhhcyBjaGFuZ2VkLlxuXHQgKi9cblx0ZnVuY3Rpb24gc3luYygpIHtcblxuXHRcdC8vIFN1YnNjcmliZSB0byBpbnB1dFxuXHRcdHJlbW92ZUV2ZW50TGlzdGVuZXJzKCk7XG5cdFx0YWRkRXZlbnRMaXN0ZW5lcnMoKTtcblxuXHRcdC8vIEZvcmNlIGEgbGF5b3V0IHRvIG1ha2Ugc3VyZSB0aGUgY3VycmVudCBjb25maWcgaXMgYWNjb3VudGVkIGZvclxuXHRcdGxheW91dCgpO1xuXG5cdFx0Ly8gUmVmbGVjdCB0aGUgY3VycmVudCBhdXRvU2xpZGUgdmFsdWVcblx0XHRhdXRvU2xpZGUgPSBjb25maWcuYXV0b1NsaWRlO1xuXG5cdFx0Ly8gU3RhcnQgYXV0by1zbGlkaW5nIGlmIGl0J3MgZW5hYmxlZFxuXHRcdGN1ZUF1dG9TbGlkZSgpO1xuXG5cdFx0Ly8gUmUtY3JlYXRlIHRoZSBzbGlkZSBiYWNrZ3JvdW5kc1xuXHRcdGNyZWF0ZUJhY2tncm91bmRzKCk7XG5cblx0XHQvLyBXcml0ZSB0aGUgY3VycmVudCBoYXNoIHRvIHRoZSBVUkxcblx0XHR3cml0ZVVSTCgpO1xuXG5cdFx0c29ydEFsbEZyYWdtZW50cygpO1xuXG5cdFx0dXBkYXRlQ29udHJvbHMoKTtcblx0XHR1cGRhdGVQcm9ncmVzcygpO1xuXHRcdHVwZGF0ZUJhY2tncm91bmQoIHRydWUgKTtcblx0XHR1cGRhdGVTbGlkZU51bWJlcigpO1xuXHRcdHVwZGF0ZVNsaWRlc1Zpc2liaWxpdHkoKTtcblxuXHRcdGZvcm1hdEVtYmVkZGVkQ29udGVudCgpO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVzZXRzIGFsbCB2ZXJ0aWNhbCBzbGlkZXMgc28gdGhhdCBvbmx5IHRoZSBmaXJzdFxuXHQgKiBpcyB2aXNpYmxlLlxuXHQgKi9cblx0ZnVuY3Rpb24gcmVzZXRWZXJ0aWNhbFNsaWRlcygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXHRcdGhvcml6b250YWxTbGlkZXMuZm9yRWFjaCggZnVuY3Rpb24oIGhvcml6b250YWxTbGlkZSApIHtcblxuXHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gdG9BcnJheSggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICk7XG5cdFx0XHR2ZXJ0aWNhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljYWxTbGlkZSwgeSApIHtcblxuXHRcdFx0XHRpZiggeSA+IDAgKSB7XG5cdFx0XHRcdFx0dmVydGljYWxTbGlkZS5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlLmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGUuY2xhc3NMaXN0LmFkZCggJ2Z1dHVyZScgKTtcblx0XHRcdFx0XHR2ZXJ0aWNhbFNsaWRlLnNldEF0dHJpYnV0ZSggJ2FyaWEtaGlkZGVuJywgJ3RydWUnICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSApO1xuXG5cdFx0fSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogU29ydHMgYW5kIGZvcm1hdHMgYWxsIG9mIGZyYWdtZW50cyBpbiB0aGVcblx0ICogcHJlc2VudGF0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gc29ydEFsbEZyYWdtZW50cygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXHRcdGhvcml6b250YWxTbGlkZXMuZm9yRWFjaCggZnVuY3Rpb24oIGhvcml6b250YWxTbGlkZSApIHtcblxuXHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gdG9BcnJheSggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICk7XG5cdFx0XHR2ZXJ0aWNhbFNsaWRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljYWxTbGlkZSwgeSApIHtcblxuXHRcdFx0XHRzb3J0RnJhZ21lbnRzKCB2ZXJ0aWNhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblxuXHRcdFx0fSApO1xuXG5cdFx0XHRpZiggdmVydGljYWxTbGlkZXMubGVuZ3RoID09PSAwICkgc29ydEZyYWdtZW50cyggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblxuXHRcdH0gKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgb25lIGRpbWVuc2lvbiBvZiBzbGlkZXMgYnkgc2hvd2luZyB0aGUgc2xpZGVcblx0ICogd2l0aCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3IgdGhhdCB3aWxsIGZldGNoXG5cdCAqIHRoZSBncm91cCBvZiBzbGlkZXMgd2UgYXJlIHdvcmtpbmcgd2l0aFxuXHQgKiBAcGFyYW0ge051bWJlcn0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBzbGlkZSB0aGF0IHNob3VsZCBiZVxuXHQgKiBzaG93blxuXHQgKlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBpbmRleCBvZiB0aGUgc2xpZGUgdGhhdCBpcyBub3cgc2hvd24sXG5cdCAqIG1pZ2h0IGRpZmZlciBmcm9tIHRoZSBwYXNzZWQgaW4gaW5kZXggaWYgaXQgd2FzIG91dCBvZlxuXHQgKiBib3VuZHMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVTbGlkZXMoIHNlbGVjdG9yLCBpbmRleCApIHtcblxuXHRcdC8vIFNlbGVjdCBhbGwgc2xpZGVzIGFuZCBjb252ZXJ0IHRoZSBOb2RlTGlzdCByZXN1bHQgdG9cblx0XHQvLyBhbiBhcnJheVxuXHRcdHZhciBzbGlkZXMgPSB0b0FycmF5KCBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBzZWxlY3RvciApICksXG5cdFx0XHRzbGlkZXNMZW5ndGggPSBzbGlkZXMubGVuZ3RoO1xuXG5cdFx0dmFyIHByaW50TW9kZSA9IGlzUHJpbnRpbmdQREYoKTtcblxuXHRcdGlmKCBzbGlkZXNMZW5ndGggKSB7XG5cblx0XHRcdC8vIFNob3VsZCB0aGUgaW5kZXggbG9vcD9cblx0XHRcdGlmKCBjb25maWcubG9vcCApIHtcblx0XHRcdFx0aW5kZXggJT0gc2xpZGVzTGVuZ3RoO1xuXG5cdFx0XHRcdGlmKCBpbmRleCA8IDAgKSB7XG5cdFx0XHRcdFx0aW5kZXggPSBzbGlkZXNMZW5ndGggKyBpbmRleDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBFbmZvcmNlIG1heCBhbmQgbWluaW11bSBpbmRleCBib3VuZHNcblx0XHRcdGluZGV4ID0gTWF0aC5tYXgoIE1hdGgubWluKCBpbmRleCwgc2xpZGVzTGVuZ3RoIC0gMSApLCAwICk7XG5cblx0XHRcdGZvciggdmFyIGkgPSAwOyBpIDwgc2xpZGVzTGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdHZhciBlbGVtZW50ID0gc2xpZGVzW2ldO1xuXG5cdFx0XHRcdHZhciByZXZlcnNlID0gY29uZmlnLnJ0bCAmJiAhaXNWZXJ0aWNhbFNsaWRlKCBlbGVtZW50ICk7XG5cblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAncGFzdCcgKTtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAncHJlc2VudCcgKTtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAnZnV0dXJlJyApO1xuXG5cdFx0XHRcdC8vIGh0dHA6Ly93d3cudzMub3JnL2h0bWwvd2cvZHJhZnRzL2h0bWwvbWFzdGVyL2VkaXRpbmcuaHRtbCN0aGUtaGlkZGVuLWF0dHJpYnV0ZVxuXHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSggJ2hpZGRlbicsICcnICk7XG5cdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nLCAndHJ1ZScgKTtcblxuXHRcdFx0XHQvLyBJZiB0aGlzIGVsZW1lbnQgY29udGFpbnMgdmVydGljYWwgc2xpZGVzXG5cdFx0XHRcdGlmKCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoICdzZWN0aW9uJyApICkge1xuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3N0YWNrJyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gSWYgd2UncmUgcHJpbnRpbmcgc3RhdGljIHNsaWRlcywgYWxsIHNsaWRlcyBhcmUgXCJwcmVzZW50XCJcblx0XHRcdFx0aWYoIHByaW50TW9kZSApIHtcblx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoICdwcmVzZW50JyApO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGkgPCBpbmRleCApIHtcblx0XHRcdFx0XHQvLyBBbnkgZWxlbWVudCBwcmV2aW91cyB0byBpbmRleCBpcyBnaXZlbiB0aGUgJ3Bhc3QnIGNsYXNzXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKCByZXZlcnNlID8gJ2Z1dHVyZScgOiAncGFzdCcgKTtcblxuXHRcdFx0XHRcdGlmKCBjb25maWcuZnJhZ21lbnRzICkge1xuXHRcdFx0XHRcdFx0dmFyIHBhc3RGcmFnbWVudHMgPSB0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblxuXHRcdFx0XHRcdFx0Ly8gU2hvdyBhbGwgZnJhZ21lbnRzIG9uIHByaW9yIHNsaWRlc1xuXHRcdFx0XHRcdFx0d2hpbGUoIHBhc3RGcmFnbWVudHMubGVuZ3RoICkge1xuXHRcdFx0XHRcdFx0XHR2YXIgcGFzdEZyYWdtZW50ID0gcGFzdEZyYWdtZW50cy5wb3AoKTtcblx0XHRcdFx0XHRcdFx0cGFzdEZyYWdtZW50LmNsYXNzTGlzdC5hZGQoICd2aXNpYmxlJyApO1xuXHRcdFx0XHRcdFx0XHRwYXN0RnJhZ21lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYoIGkgPiBpbmRleCApIHtcblx0XHRcdFx0XHQvLyBBbnkgZWxlbWVudCBzdWJzZXF1ZW50IHRvIGluZGV4IGlzIGdpdmVuIHRoZSAnZnV0dXJlJyBjbGFzc1xuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggcmV2ZXJzZSA/ICdwYXN0JyA6ICdmdXR1cmUnICk7XG5cblx0XHRcdFx0XHRpZiggY29uZmlnLmZyYWdtZW50cyApIHtcblx0XHRcdFx0XHRcdHZhciBmdXR1cmVGcmFnbWVudHMgPSB0b0FycmF5KCBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQudmlzaWJsZScgKSApO1xuXG5cdFx0XHRcdFx0XHQvLyBObyBmcmFnbWVudHMgaW4gZnV0dXJlIHNsaWRlcyBzaG91bGQgYmUgdmlzaWJsZSBhaGVhZCBvZiB0aW1lXG5cdFx0XHRcdFx0XHR3aGlsZSggZnV0dXJlRnJhZ21lbnRzLmxlbmd0aCApIHtcblx0XHRcdFx0XHRcdFx0dmFyIGZ1dHVyZUZyYWdtZW50ID0gZnV0dXJlRnJhZ21lbnRzLnBvcCgpO1xuXHRcdFx0XHRcdFx0XHRmdXR1cmVGcmFnbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdFx0ZnV0dXJlRnJhZ21lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIE1hcmsgdGhlIGN1cnJlbnQgc2xpZGUgYXMgcHJlc2VudFxuXHRcdFx0c2xpZGVzW2luZGV4XS5jbGFzc0xpc3QuYWRkKCAncHJlc2VudCcgKTtcblx0XHRcdHNsaWRlc1tpbmRleF0ucmVtb3ZlQXR0cmlidXRlKCAnaGlkZGVuJyApO1xuXHRcdFx0c2xpZGVzW2luZGV4XS5yZW1vdmVBdHRyaWJ1dGUoICdhcmlhLWhpZGRlbicgKTtcblxuXHRcdFx0Ly8gSWYgdGhpcyBzbGlkZSBoYXMgYSBzdGF0ZSBhc3NvY2lhdGVkIHdpdGggaXQsIGFkZCBpdFxuXHRcdFx0Ly8gb250byB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZGVja1xuXHRcdFx0dmFyIHNsaWRlU3RhdGUgPSBzbGlkZXNbaW5kZXhdLmdldEF0dHJpYnV0ZSggJ2RhdGEtc3RhdGUnICk7XG5cdFx0XHRpZiggc2xpZGVTdGF0ZSApIHtcblx0XHRcdFx0c3RhdGUgPSBzdGF0ZS5jb25jYXQoIHNsaWRlU3RhdGUuc3BsaXQoICcgJyApICk7XG5cdFx0XHR9XG5cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBTaW5jZSB0aGVyZSBhcmUgbm8gc2xpZGVzIHdlIGNhbid0IGJlIGFueXdoZXJlIGJleW9uZCB0aGVcblx0XHRcdC8vIHplcm90aCBpbmRleFxuXHRcdFx0aW5kZXggPSAwO1xuXHRcdH1cblxuXHRcdHJldHVybiBpbmRleDtcblxuXHR9XG5cblx0LyoqXG5cdCAqIE9wdGltaXphdGlvbiBtZXRob2Q7IGhpZGUgYWxsIHNsaWRlcyB0aGF0IGFyZSBmYXIgYXdheVxuXHQgKiBmcm9tIHRoZSBwcmVzZW50IHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlU2xpZGVzVmlzaWJpbGl0eSgpIHtcblxuXHRcdC8vIFNlbGVjdCBhbGwgc2xpZGVzIGFuZCBjb252ZXJ0IHRoZSBOb2RlTGlzdCByZXN1bHQgdG9cblx0XHQvLyBhbiBhcnJheVxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApLFxuXHRcdFx0aG9yaXpvbnRhbFNsaWRlc0xlbmd0aCA9IGhvcml6b250YWxTbGlkZXMubGVuZ3RoLFxuXHRcdFx0ZGlzdGFuY2VYLFxuXHRcdFx0ZGlzdGFuY2VZO1xuXG5cdFx0aWYoIGhvcml6b250YWxTbGlkZXNMZW5ndGggJiYgdHlwZW9mIGluZGV4aCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cblx0XHRcdC8vIFRoZSBudW1iZXIgb2Ygc3RlcHMgYXdheSBmcm9tIHRoZSBwcmVzZW50IHNsaWRlIHRoYXQgd2lsbFxuXHRcdFx0Ly8gYmUgdmlzaWJsZVxuXHRcdFx0dmFyIHZpZXdEaXN0YW5jZSA9IGlzT3ZlcnZpZXcoKSA/IDEwIDogY29uZmlnLnZpZXdEaXN0YW5jZTtcblxuXHRcdFx0Ly8gTGltaXQgdmlldyBkaXN0YW5jZSBvbiB3ZWFrZXIgZGV2aWNlc1xuXHRcdFx0aWYoIGlzTW9iaWxlRGV2aWNlICkge1xuXHRcdFx0XHR2aWV3RGlzdGFuY2UgPSBpc092ZXJ2aWV3KCkgPyA2IDogMjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gTGltaXQgdmlldyBkaXN0YW5jZSBvbiB3ZWFrZXIgZGV2aWNlc1xuXHRcdFx0aWYoIGlzUHJpbnRpbmdQREYoKSApIHtcblx0XHRcdFx0dmlld0Rpc3RhbmNlID0gTnVtYmVyLk1BWF9WQUxVRTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yKCB2YXIgeCA9IDA7IHggPCBob3Jpem9udGFsU2xpZGVzTGVuZ3RoOyB4KysgKSB7XG5cdFx0XHRcdHZhciBob3Jpem9udGFsU2xpZGUgPSBob3Jpem9udGFsU2xpZGVzW3hdO1xuXG5cdFx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlcyA9IHRvQXJyYXkoIGhvcml6b250YWxTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLFxuXHRcdFx0XHRcdHZlcnRpY2FsU2xpZGVzTGVuZ3RoID0gdmVydGljYWxTbGlkZXMubGVuZ3RoO1xuXG5cdFx0XHRcdC8vIExvb3BzIHNvIHRoYXQgaXQgbWVhc3VyZXMgMSBiZXR3ZWVuIHRoZSBmaXJzdCBhbmQgbGFzdCBzbGlkZXNcblx0XHRcdFx0ZGlzdGFuY2VYID0gTWF0aC5hYnMoICggKCBpbmRleGggfHwgMCApIC0geCApICUgKCBob3Jpem9udGFsU2xpZGVzTGVuZ3RoIC0gdmlld0Rpc3RhbmNlICkgKSB8fCAwO1xuXG5cdFx0XHRcdC8vIFNob3cgdGhlIGhvcml6b250YWwgc2xpZGUgaWYgaXQncyB3aXRoaW4gdGhlIHZpZXcgZGlzdGFuY2Vcblx0XHRcdFx0aWYoIGRpc3RhbmNlWCA8IHZpZXdEaXN0YW5jZSApIHtcblx0XHRcdFx0XHRzaG93U2xpZGUoIGhvcml6b250YWxTbGlkZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGhpZGVTbGlkZSggaG9yaXpvbnRhbFNsaWRlICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiggdmVydGljYWxTbGlkZXNMZW5ndGggKSB7XG5cblx0XHRcdFx0XHR2YXIgb3kgPSBnZXRQcmV2aW91c1ZlcnRpY2FsSW5kZXgoIGhvcml6b250YWxTbGlkZSApO1xuXG5cdFx0XHRcdFx0Zm9yKCB2YXIgeSA9IDA7IHkgPCB2ZXJ0aWNhbFNsaWRlc0xlbmd0aDsgeSsrICkge1xuXHRcdFx0XHRcdFx0dmFyIHZlcnRpY2FsU2xpZGUgPSB2ZXJ0aWNhbFNsaWRlc1t5XTtcblxuXHRcdFx0XHRcdFx0ZGlzdGFuY2VZID0geCA9PT0gKCBpbmRleGggfHwgMCApID8gTWF0aC5hYnMoICggaW5kZXh2IHx8IDAgKSAtIHkgKSA6IE1hdGguYWJzKCB5IC0gb3kgKTtcblxuXHRcdFx0XHRcdFx0aWYoIGRpc3RhbmNlWCArIGRpc3RhbmNlWSA8IHZpZXdEaXN0YW5jZSApIHtcblx0XHRcdFx0XHRcdFx0c2hvd1NsaWRlKCB2ZXJ0aWNhbFNsaWRlICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0aGlkZVNsaWRlKCB2ZXJ0aWNhbFNsaWRlICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHByb2dyZXNzIGJhciB0byByZWZsZWN0IHRoZSBjdXJyZW50IHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlUHJvZ3Jlc3MoKSB7XG5cblx0XHQvLyBVcGRhdGUgcHJvZ3Jlc3MgaWYgZW5hYmxlZFxuXHRcdGlmKCBjb25maWcucHJvZ3Jlc3MgJiYgZG9tLnByb2dyZXNzYmFyICkge1xuXG5cdFx0XHRkb20ucHJvZ3Jlc3NiYXIuc3R5bGUud2lkdGggPSBnZXRQcm9ncmVzcygpICogZG9tLndyYXBwZXIub2Zmc2V0V2lkdGggKyAncHgnO1xuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgc2xpZGUgbnVtYmVyIGRpdiB0byByZWZsZWN0IHRoZSBjdXJyZW50IHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gdXBkYXRlU2xpZGVOdW1iZXIoKSB7XG5cblx0XHQvLyBVcGRhdGUgc2xpZGUgbnVtYmVyIGlmIGVuYWJsZWRcblx0XHRpZiggY29uZmlnLnNsaWRlTnVtYmVyICYmIGRvbS5zbGlkZU51bWJlcikge1xuXG5cdFx0XHQvLyBEaXNwbGF5IHRoZSBudW1iZXIgb2YgdGhlIHBhZ2UgdXNpbmcgJ2luZGV4aCAtIGluZGV4dicgZm9ybWF0XG5cdFx0XHR2YXIgaW5kZXhTdHJpbmcgPSBpbmRleGg7XG5cdFx0XHRpZiggaW5kZXh2ID4gMCApIHtcblx0XHRcdFx0aW5kZXhTdHJpbmcgKz0gJyAtICcgKyBpbmRleHY7XG5cdFx0XHR9XG5cblx0XHRcdGRvbS5zbGlkZU51bWJlci5pbm5lckhUTUwgPSBpbmRleFN0cmluZztcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBhbGwgY29udHJvbC9uYXZpZ2F0aW9uIGFycm93cy5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZUNvbnRyb2xzKCkge1xuXG5cdFx0dmFyIHJvdXRlcyA9IGF2YWlsYWJsZVJvdXRlcygpO1xuXHRcdHZhciBmcmFnbWVudHMgPSBhdmFpbGFibGVGcmFnbWVudHMoKTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgJ2VuYWJsZWQnIGNsYXNzIGZyb20gYWxsIGRpcmVjdGlvbnNcblx0XHRkb20uY29udHJvbHNMZWZ0LmNvbmNhdCggZG9tLmNvbnRyb2xzUmlnaHQgKVxuXHRcdFx0XHRcdFx0LmNvbmNhdCggZG9tLmNvbnRyb2xzVXAgKVxuXHRcdFx0XHRcdFx0LmNvbmNhdCggZG9tLmNvbnRyb2xzRG93biApXG5cdFx0XHRcdFx0XHQuY29uY2F0KCBkb20uY29udHJvbHNQcmV2IClcblx0XHRcdFx0XHRcdC5jb25jYXQoIGRvbS5jb250cm9sc05leHQgKS5mb3JFYWNoKCBmdW5jdGlvbiggbm9kZSApIHtcblx0XHRcdG5vZGUuY2xhc3NMaXN0LnJlbW92ZSggJ2VuYWJsZWQnICk7XG5cdFx0XHRub2RlLmNsYXNzTGlzdC5yZW1vdmUoICdmcmFnbWVudGVkJyApO1xuXHRcdH0gKTtcblxuXHRcdC8vIEFkZCB0aGUgJ2VuYWJsZWQnIGNsYXNzIHRvIHRoZSBhdmFpbGFibGUgcm91dGVzXG5cdFx0aWYoIHJvdXRlcy5sZWZ0ICkgZG9tLmNvbnRyb2xzTGVmdC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApO1x0fSApO1xuXHRcdGlmKCByb3V0ZXMucmlnaHQgKSBkb20uY29udHJvbHNSaWdodC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApOyB9ICk7XG5cdFx0aWYoIHJvdXRlcy51cCApIGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7XHR9ICk7XG5cdFx0aWYoIHJvdXRlcy5kb3duICkgZG9tLmNvbnRyb2xzRG93bi5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApOyB9ICk7XG5cblx0XHQvLyBQcmV2L25leHQgYnV0dG9uc1xuXHRcdGlmKCByb3V0ZXMubGVmdCB8fCByb3V0ZXMudXAgKSBkb20uY29udHJvbHNQcmV2LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2VuYWJsZWQnICk7IH0gKTtcblx0XHRpZiggcm91dGVzLnJpZ2h0IHx8IHJvdXRlcy5kb3duICkgZG9tLmNvbnRyb2xzTmV4dC5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7IGVsLmNsYXNzTGlzdC5hZGQoICdlbmFibGVkJyApOyB9ICk7XG5cblx0XHQvLyBIaWdobGlnaHQgZnJhZ21lbnQgZGlyZWN0aW9uc1xuXHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cblx0XHRcdC8vIEFsd2F5cyBhcHBseSBmcmFnbWVudCBkZWNvcmF0b3IgdG8gcHJldi9uZXh0IGJ1dHRvbnNcblx0XHRcdGlmKCBmcmFnbWVudHMucHJldiApIGRvbS5jb250cm9sc1ByZXYuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyB9ICk7XG5cdFx0XHRpZiggZnJhZ21lbnRzLm5leHQgKSBkb20uY29udHJvbHNOZXh0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgfSApO1xuXG5cdFx0XHQvLyBBcHBseSBmcmFnbWVudCBkZWNvcmF0b3JzIHRvIGRpcmVjdGlvbmFsIGJ1dHRvbnMgYmFzZWQgb25cblx0XHRcdC8vIHdoYXQgc2xpZGUgYXhpcyB0aGV5IGFyZSBpblxuXHRcdFx0aWYoIGlzVmVydGljYWxTbGlkZSggY3VycmVudFNsaWRlICkgKSB7XG5cdFx0XHRcdGlmKCBmcmFnbWVudHMucHJldiApIGRvbS5jb250cm9sc1VwLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgfSApO1xuXHRcdFx0XHRpZiggZnJhZ21lbnRzLm5leHQgKSBkb20uY29udHJvbHNEb3duLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgfSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmKCBmcmFnbWVudHMucHJldiApIGRvbS5jb250cm9sc0xlZnQuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkgeyBlbC5jbGFzc0xpc3QuYWRkKCAnZnJhZ21lbnRlZCcsICdlbmFibGVkJyApOyB9ICk7XG5cdFx0XHRcdGlmKCBmcmFnbWVudHMubmV4dCApIGRvbS5jb250cm9sc1JpZ2h0LmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHsgZWwuY2xhc3NMaXN0LmFkZCggJ2ZyYWdtZW50ZWQnLCAnZW5hYmxlZCcgKTsgfSApO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyB0aGUgYmFja2dyb3VuZCBlbGVtZW50cyB0byByZWZsZWN0IHRoZSBjdXJyZW50XG5cdCAqIHNsaWRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IGluY2x1ZGVBbGwgSWYgdHJ1ZSwgdGhlIGJhY2tncm91bmRzIG9mXG5cdCAqIGFsbCB2ZXJ0aWNhbCBzbGlkZXMgKG5vdCBqdXN0IHRoZSBwcmVzZW50KSB3aWxsIGJlIHVwZGF0ZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiB1cGRhdGVCYWNrZ3JvdW5kKCBpbmNsdWRlQWxsICkge1xuXG5cdFx0dmFyIGN1cnJlbnRCYWNrZ3JvdW5kID0gbnVsbDtcblxuXHRcdC8vIFJldmVyc2UgcGFzdC9mdXR1cmUgY2xhc3NlcyB3aGVuIGluIFJUTCBtb2RlXG5cdFx0dmFyIGhvcml6b250YWxQYXN0ID0gY29uZmlnLnJ0bCA/ICdmdXR1cmUnIDogJ3Bhc3QnLFxuXHRcdFx0aG9yaXpvbnRhbEZ1dHVyZSA9IGNvbmZpZy5ydGwgPyAncGFzdCcgOiAnZnV0dXJlJztcblxuXHRcdC8vIFVwZGF0ZSB0aGUgY2xhc3NlcyBvZiBhbGwgYmFja2dyb3VuZHMgdG8gbWF0Y2ggdGhlXG5cdFx0Ly8gc3RhdGVzIG9mIHRoZWlyIHNsaWRlcyAocGFzdC9wcmVzZW50L2Z1dHVyZSlcblx0XHR0b0FycmF5KCBkb20uYmFja2dyb3VuZC5jaGlsZE5vZGVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGJhY2tncm91bmRoLCBoICkge1xuXG5cdFx0XHRiYWNrZ3JvdW5kaC5jbGFzc0xpc3QucmVtb3ZlKCAncGFzdCcgKTtcblx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5yZW1vdmUoICdwcmVzZW50JyApO1xuXHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LnJlbW92ZSggJ2Z1dHVyZScgKTtcblxuXHRcdFx0aWYoIGggPCBpbmRleGggKSB7XG5cdFx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5hZGQoIGhvcml6b250YWxQYXN0ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICggaCA+IGluZGV4aCApIHtcblx0XHRcdFx0YmFja2dyb3VuZGguY2xhc3NMaXN0LmFkZCggaG9yaXpvbnRhbEZ1dHVyZSApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGJhY2tncm91bmRoLmNsYXNzTGlzdC5hZGQoICdwcmVzZW50JyApO1xuXG5cdFx0XHRcdC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGJhY2tncm91bmQgZWxlbWVudFxuXHRcdFx0XHRjdXJyZW50QmFja2dyb3VuZCA9IGJhY2tncm91bmRoO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggaW5jbHVkZUFsbCB8fCBoID09PSBpbmRleGggKSB7XG5cdFx0XHRcdHRvQXJyYXkoIGJhY2tncm91bmRoLnF1ZXJ5U2VsZWN0b3JBbGwoICcuc2xpZGUtYmFja2dyb3VuZCcgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBiYWNrZ3JvdW5kdiwgdiApIHtcblxuXHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5yZW1vdmUoICdwYXN0JyApO1xuXHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5yZW1vdmUoICdwcmVzZW50JyApO1xuXHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5yZW1vdmUoICdmdXR1cmUnICk7XG5cblx0XHRcdFx0XHRpZiggdiA8IGluZGV4diApIHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5hZGQoICdwYXN0JyApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICggdiA+IGluZGV4diApIHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmR2LmNsYXNzTGlzdC5hZGQoICdmdXR1cmUnICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZHYuY2xhc3NMaXN0LmFkZCggJ3ByZXNlbnQnICk7XG5cblx0XHRcdFx0XHRcdC8vIE9ubHkgaWYgdGhpcyBpcyB0aGUgcHJlc2VudCBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBzbGlkZVxuXHRcdFx0XHRcdFx0aWYoIGggPT09IGluZGV4aCApIGN1cnJlbnRCYWNrZ3JvdW5kID0gYmFja2dyb3VuZHY7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblxuXHRcdH0gKTtcblxuXHRcdC8vIFN0b3AgYW55IGN1cnJlbnRseSBwbGF5aW5nIHZpZGVvIGJhY2tncm91bmRcblx0XHRpZiggcHJldmlvdXNCYWNrZ3JvdW5kICkge1xuXG5cdFx0XHR2YXIgcHJldmlvdXNWaWRlbyA9IHByZXZpb3VzQmFja2dyb3VuZC5xdWVyeVNlbGVjdG9yKCAndmlkZW8nICk7XG5cdFx0XHRpZiggcHJldmlvdXNWaWRlbyApIHByZXZpb3VzVmlkZW8ucGF1c2UoKTtcblxuXHRcdH1cblxuXHRcdGlmKCBjdXJyZW50QmFja2dyb3VuZCApIHtcblxuXHRcdFx0Ly8gU3RhcnQgdmlkZW8gcGxheWJhY2tcblx0XHRcdHZhciBjdXJyZW50VmlkZW8gPSBjdXJyZW50QmFja2dyb3VuZC5xdWVyeVNlbGVjdG9yKCAndmlkZW8nICk7XG5cdFx0XHRpZiggY3VycmVudFZpZGVvICkge1xuXHRcdFx0XHRjdXJyZW50VmlkZW8uY3VycmVudFRpbWUgPSAwO1xuXHRcdFx0XHRjdXJyZW50VmlkZW8ucGxheSgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEb24ndCB0cmFuc2l0aW9uIGJldHdlZW4gaWRlbnRpY2FsIGJhY2tncm91bmRzLiBUaGlzXG5cdFx0XHQvLyBwcmV2ZW50cyB1bndhbnRlZCBmbGlja2VyLlxuXHRcdFx0dmFyIHByZXZpb3VzQmFja2dyb3VuZEhhc2ggPSBwcmV2aW91c0JhY2tncm91bmQgPyBwcmV2aW91c0JhY2tncm91bmQuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWhhc2gnICkgOiBudWxsO1xuXHRcdFx0dmFyIGN1cnJlbnRCYWNrZ3JvdW5kSGFzaCA9IGN1cnJlbnRCYWNrZ3JvdW5kLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC1oYXNoJyApO1xuXHRcdFx0aWYoIGN1cnJlbnRCYWNrZ3JvdW5kSGFzaCAmJiBjdXJyZW50QmFja2dyb3VuZEhhc2ggPT09IHByZXZpb3VzQmFja2dyb3VuZEhhc2ggJiYgY3VycmVudEJhY2tncm91bmQgIT09IHByZXZpb3VzQmFja2dyb3VuZCApIHtcblx0XHRcdFx0ZG9tLmJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCggJ25vLXRyYW5zaXRpb24nICk7XG5cdFx0XHR9XG5cblx0XHRcdHByZXZpb3VzQmFja2dyb3VuZCA9IGN1cnJlbnRCYWNrZ3JvdW5kO1xuXG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlcmUncyBhIGJhY2tncm91bmQgYnJpZ2h0bmVzcyBmbGFnIGZvciB0aGlzIHNsaWRlLFxuXHRcdC8vIGJ1YmJsZSBpdCB0byB0aGUgLnJldmVhbCBjb250YWluZXJcblx0XHRpZiggY3VycmVudFNsaWRlICkge1xuXHRcdFx0WyAnaGFzLWxpZ2h0LWJhY2tncm91bmQnLCAnaGFzLWRhcmstYmFja2dyb3VuZCcgXS5mb3JFYWNoKCBmdW5jdGlvbiggY2xhc3NUb0J1YmJsZSApIHtcblx0XHRcdFx0aWYoIGN1cnJlbnRTbGlkZS5jbGFzc0xpc3QuY29udGFpbnMoIGNsYXNzVG9CdWJibGUgKSApIHtcblx0XHRcdFx0XHRkb20ud3JhcHBlci5jbGFzc0xpc3QuYWRkKCBjbGFzc1RvQnViYmxlICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0ZG9tLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSggY2xhc3NUb0J1YmJsZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsb3cgdGhlIGZpcnN0IGJhY2tncm91bmQgdG8gYXBwbHkgd2l0aG91dCB0cmFuc2l0aW9uXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20uYmFja2dyb3VuZC5jbGFzc0xpc3QucmVtb3ZlKCAnbm8tdHJhbnNpdGlvbicgKTtcblx0XHR9LCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgcGFyYWxsYXggYmFja2dyb3VuZCBiYXNlZFxuXHQgKiBvbiB0aGUgY3VycmVudCBzbGlkZSBpbmRleC5cblx0ICovXG5cdGZ1bmN0aW9uIHVwZGF0ZVBhcmFsbGF4KCkge1xuXG5cdFx0aWYoIGNvbmZpZy5wYXJhbGxheEJhY2tncm91bmRJbWFnZSApIHtcblxuXHRcdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApLFxuXHRcdFx0XHR2ZXJ0aWNhbFNsaWRlcyA9IGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIFZFUlRJQ0FMX1NMSURFU19TRUxFQ1RPUiApO1xuXG5cdFx0XHR2YXIgYmFja2dyb3VuZFNpemUgPSBkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZS5zcGxpdCggJyAnICksXG5cdFx0XHRcdGJhY2tncm91bmRXaWR0aCwgYmFja2dyb3VuZEhlaWdodDtcblxuXHRcdFx0aWYoIGJhY2tncm91bmRTaXplLmxlbmd0aCA9PT0gMSApIHtcblx0XHRcdFx0YmFja2dyb3VuZFdpZHRoID0gYmFja2dyb3VuZEhlaWdodCA9IHBhcnNlSW50KCBiYWNrZ3JvdW5kU2l6ZVswXSwgMTAgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRiYWNrZ3JvdW5kV2lkdGggPSBwYXJzZUludCggYmFja2dyb3VuZFNpemVbMF0sIDEwICk7XG5cdFx0XHRcdGJhY2tncm91bmRIZWlnaHQgPSBwYXJzZUludCggYmFja2dyb3VuZFNpemVbMV0sIDEwICk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzbGlkZVdpZHRoID0gZG9tLmJhY2tncm91bmQub2Zmc2V0V2lkdGg7XG5cdFx0XHR2YXIgaG9yaXpvbnRhbFNsaWRlQ291bnQgPSBob3Jpem9udGFsU2xpZGVzLmxlbmd0aDtcblx0XHRcdHZhciBob3Jpem9udGFsT2Zmc2V0ID0gLSggYmFja2dyb3VuZFdpZHRoIC0gc2xpZGVXaWR0aCApIC8gKCBob3Jpem9udGFsU2xpZGVDb3VudC0xICkgKiBpbmRleGg7XG5cblx0XHRcdHZhciBzbGlkZUhlaWdodCA9IGRvbS5iYWNrZ3JvdW5kLm9mZnNldEhlaWdodDtcblx0XHRcdHZhciB2ZXJ0aWNhbFNsaWRlQ291bnQgPSB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGg7XG5cdFx0XHR2YXIgdmVydGljYWxPZmZzZXQgPSB2ZXJ0aWNhbFNsaWRlQ291bnQgPiAxID8gLSggYmFja2dyb3VuZEhlaWdodCAtIHNsaWRlSGVpZ2h0ICkgLyAoIHZlcnRpY2FsU2xpZGVDb3VudC0xICkgKiBpbmRleHYgOiAwO1xuXG5cdFx0XHRkb20uYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBob3Jpem9udGFsT2Zmc2V0ICsgJ3B4ICcgKyB2ZXJ0aWNhbE9mZnNldCArICdweCc7XG5cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsZWQgd2hlbiB0aGUgZ2l2ZW4gc2xpZGUgaXMgd2l0aGluIHRoZSBjb25maWd1cmVkIHZpZXdcblx0ICogZGlzdGFuY2UuIFNob3dzIHRoZSBzbGlkZSBlbGVtZW50IGFuZCBsb2FkcyBhbnkgY29udGVudFxuXHQgKiB0aGF0IGlzIHNldCB0byBsb2FkIGxhemlseSAoZGF0YS1zcmMpLlxuXHQgKi9cblx0ZnVuY3Rpb24gc2hvd1NsaWRlKCBzbGlkZSApIHtcblxuXHRcdC8vIFNob3cgdGhlIHNsaWRlIGVsZW1lbnRcblx0XHRzbGlkZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuXHRcdC8vIE1lZGlhIGVsZW1lbnRzIHdpdGggZGF0YS1zcmMgYXR0cmlidXRlc1xuXHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdpbWdbZGF0YS1zcmNdLCB2aWRlb1tkYXRhLXNyY10sIGF1ZGlvW2RhdGEtc3JjXSwgaWZyYW1lW2RhdGEtc3JjXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoICdzcmMnLCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApICk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApO1xuXHRcdH0gKTtcblxuXHRcdC8vIE1lZGlhIGVsZW1lbnRzIHdpdGggPHNvdXJjZT4gY2hpbGRyZW5cblx0XHR0b0FycmF5KCBzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAndmlkZW8sIGF1ZGlvJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIG1lZGlhICkge1xuXHRcdFx0dmFyIHNvdXJjZXMgPSAwO1xuXG5cdFx0XHR0b0FycmF5KCBtZWRpYS5xdWVyeVNlbGVjdG9yQWxsKCAnc291cmNlW2RhdGEtc3JjXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBzb3VyY2UgKSB7XG5cdFx0XHRcdHNvdXJjZS5zZXRBdHRyaWJ1dGUoICdzcmMnLCBzb3VyY2UuZ2V0QXR0cmlidXRlKCAnZGF0YS1zcmMnICkgKTtcblx0XHRcdFx0c291cmNlLnJlbW92ZUF0dHJpYnV0ZSggJ2RhdGEtc3JjJyApO1xuXHRcdFx0XHRzb3VyY2VzICs9IDE7XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIElmIHdlIHJld3JvdGUgc291cmNlcyBmb3IgdGhpcyB2aWRlby9hdWRpbyBlbGVtZW50LCB3ZSBuZWVkXG5cdFx0XHQvLyB0byBtYW51YWxseSB0ZWxsIGl0IHRvIGxvYWQgZnJvbSBpdHMgbmV3IG9yaWdpblxuXHRcdFx0aWYoIHNvdXJjZXMgPiAwICkge1xuXHRcdFx0XHRtZWRpYS5sb2FkKCk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cblx0XHQvLyBTaG93IHRoZSBjb3JyZXNwb25kaW5nIGJhY2tncm91bmQgZWxlbWVudFxuXHRcdHZhciBpbmRpY2VzID0gZ2V0SW5kaWNlcyggc2xpZGUgKTtcblx0XHR2YXIgYmFja2dyb3VuZCA9IGdldFNsaWRlQmFja2dyb3VuZCggaW5kaWNlcy5oLCBpbmRpY2VzLnYgKTtcblx0XHRpZiggYmFja2dyb3VuZCApIHtcblx0XHRcdGJhY2tncm91bmQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cblx0XHRcdC8vIElmIHRoZSBiYWNrZ3JvdW5kIGNvbnRhaW5zIG1lZGlhLCBsb2FkIGl0XG5cdFx0XHRpZiggYmFja2dyb3VuZC5oYXNBdHRyaWJ1dGUoICdkYXRhLWxvYWRlZCcgKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdGJhY2tncm91bmQuc2V0QXR0cmlidXRlKCAnZGF0YS1sb2FkZWQnLCAndHJ1ZScgKTtcblxuXHRcdFx0XHR2YXIgYmFja2dyb3VuZEltYWdlID0gc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWltYWdlJyApLFxuXHRcdFx0XHRcdGJhY2tncm91bmRWaWRlbyA9IHNsaWRlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYmFja2dyb3VuZC12aWRlbycgKSxcblx0XHRcdFx0XHRiYWNrZ3JvdW5kSWZyYW1lID0gc2xpZGUuZ2V0QXR0cmlidXRlKCAnZGF0YS1iYWNrZ3JvdW5kLWlmcmFtZScgKTtcblxuXHRcdFx0XHQvLyBJbWFnZXNcblx0XHRcdFx0aWYoIGJhY2tncm91bmRJbWFnZSApIHtcblx0XHRcdFx0XHRiYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICd1cmwoJysgYmFja2dyb3VuZEltYWdlICsnKSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gVmlkZW9zXG5cdFx0XHRcdGVsc2UgaWYgKCBiYWNrZ3JvdW5kVmlkZW8gJiYgIWlzU3BlYWtlck5vdGVzKCkgKSB7XG5cdFx0XHRcdFx0dmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3ZpZGVvJyApO1xuXG5cdFx0XHRcdFx0Ly8gU3VwcG9ydCBjb21tYSBzZXBhcmF0ZWQgbGlzdHMgb2YgdmlkZW8gc291cmNlc1xuXHRcdFx0XHRcdGJhY2tncm91bmRWaWRlby5zcGxpdCggJywnICkuZm9yRWFjaCggZnVuY3Rpb24oIHNvdXJjZSApIHtcblx0XHRcdFx0XHRcdHZpZGVvLmlubmVySFRNTCArPSAnPHNvdXJjZSBzcmM9XCInKyBzb3VyY2UgKydcIj4nO1xuXHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoIHZpZGVvICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gSWZyYW1lc1xuXHRcdFx0XHRlbHNlIGlmICggYmFja2dyb3VuZElmcmFtZSApIHtcblx0XHRcdFx0XHR2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lmcmFtZScgKTtcblx0XHRcdFx0XHRcdGlmcmFtZS5zZXRBdHRyaWJ1dGUoICdzcmMnLCBiYWNrZ3JvdW5kSWZyYW1lICk7XG5cdFx0XHRcdFx0XHRpZnJhbWUuc3R5bGUud2lkdGggID0gJzEwMCUnO1xuXHRcdFx0XHRcdFx0aWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdFx0XHRcdGlmcmFtZS5zdHlsZS5tYXhIZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHRcdFx0XHRpZnJhbWUuc3R5bGUubWF4V2lkdGggPSAnMTAwJSc7XG5cblx0XHRcdFx0XHRiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKCBpZnJhbWUgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGxlZCB3aGVuIHRoZSBnaXZlbiBzbGlkZSBpcyBtb3ZlZCBvdXRzaWRlIG9mIHRoZVxuXHQgKiBjb25maWd1cmVkIHZpZXcgZGlzdGFuY2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBoaWRlU2xpZGUoIHNsaWRlICkge1xuXG5cdFx0Ly8gSGlkZSB0aGUgc2xpZGUgZWxlbWVudFxuXHRcdHNsaWRlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cblx0XHQvLyBIaWRlIHRoZSBjb3JyZXNwb25kaW5nIGJhY2tncm91bmQgZWxlbWVudFxuXHRcdHZhciBpbmRpY2VzID0gZ2V0SW5kaWNlcyggc2xpZGUgKTtcblx0XHR2YXIgYmFja2dyb3VuZCA9IGdldFNsaWRlQmFja2dyb3VuZCggaW5kaWNlcy5oLCBpbmRpY2VzLnYgKTtcblx0XHRpZiggYmFja2dyb3VuZCApIHtcblx0XHRcdGJhY2tncm91bmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hhdCBhdmFpbGFibGUgcm91dGVzIHRoZXJlIGFyZSBmb3IgbmF2aWdhdGlvbi5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBjb250YWluaW5nIGZvdXIgYm9vbGVhbnM6IGxlZnQvcmlnaHQvdXAvZG93blxuXHQgKi9cblx0ZnVuY3Rpb24gYXZhaWxhYmxlUm91dGVzKCkge1xuXG5cdFx0dmFyIGhvcml6b250YWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApLFxuXHRcdFx0dmVydGljYWxTbGlkZXMgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBWRVJUSUNBTF9TTElERVNfU0VMRUNUT1IgKTtcblxuXHRcdHZhciByb3V0ZXMgPSB7XG5cdFx0XHRsZWZ0OiBpbmRleGggPiAwIHx8IGNvbmZpZy5sb29wLFxuXHRcdFx0cmlnaHQ6IGluZGV4aCA8IGhvcml6b250YWxTbGlkZXMubGVuZ3RoIC0gMSB8fCBjb25maWcubG9vcCxcblx0XHRcdHVwOiBpbmRleHYgPiAwLFxuXHRcdFx0ZG93bjogaW5kZXh2IDwgdmVydGljYWxTbGlkZXMubGVuZ3RoIC0gMVxuXHRcdH07XG5cblx0XHQvLyByZXZlcnNlIGhvcml6b250YWwgY29udHJvbHMgZm9yIHJ0bFxuXHRcdGlmKCBjb25maWcucnRsICkge1xuXHRcdFx0dmFyIGxlZnQgPSByb3V0ZXMubGVmdDtcblx0XHRcdHJvdXRlcy5sZWZ0ID0gcm91dGVzLnJpZ2h0O1xuXHRcdFx0cm91dGVzLnJpZ2h0ID0gbGVmdDtcblx0XHR9XG5cblx0XHRyZXR1cm4gcm91dGVzO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgYXZhaWxhYmxlIGZyYWdtZW50XG5cdCAqIGRpcmVjdGlvbnMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gdHdvIGJvb2xlYW4gcHJvcGVydGllczogcHJldi9uZXh0XG5cdCAqL1xuXHRmdW5jdGlvbiBhdmFpbGFibGVGcmFnbWVudHMoKSB7XG5cblx0XHRpZiggY3VycmVudFNsaWRlICYmIGNvbmZpZy5mcmFnbWVudHMgKSB7XG5cdFx0XHR2YXIgZnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICk7XG5cdFx0XHR2YXIgaGlkZGVuRnJhZ21lbnRzID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQ6bm90KC52aXNpYmxlKScgKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cHJldjogZnJhZ21lbnRzLmxlbmd0aCAtIGhpZGRlbkZyYWdtZW50cy5sZW5ndGggPiAwLFxuXHRcdFx0XHRuZXh0OiAhIWhpZGRlbkZyYWdtZW50cy5sZW5ndGhcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHsgcHJldjogZmFsc2UsIG5leHQ6IGZhbHNlIH07XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogRW5mb3JjZXMgb3JpZ2luLXNwZWNpZmljIGZvcm1hdCBydWxlcyBmb3IgZW1iZWRkZWQgbWVkaWEuXG5cdCAqL1xuXHRmdW5jdGlvbiBmb3JtYXRFbWJlZGRlZENvbnRlbnQoKSB7XG5cblx0XHQvLyBZb3VUdWJlIGZyYW1lcyBtdXN0IGluY2x1ZGUgXCI/ZW5hYmxlanNhcGk9MVwiXG5cdFx0dG9BcnJheSggZG9tLnNsaWRlcy5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbS9lbWJlZC9cIl0nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHR2YXIgc3JjID0gZWwuZ2V0QXR0cmlidXRlKCAnc3JjJyApO1xuXHRcdFx0aWYoICEvZW5hYmxlanNhcGlcXD0xL2dpLnRlc3QoIHNyYyApICkge1xuXHRcdFx0XHRlbC5zZXRBdHRyaWJ1dGUoICdzcmMnLCBzcmMgKyAoICEvXFw/Ly50ZXN0KCBzcmMgKSA/ICc/JyA6ICcmJyApICsgJ2VuYWJsZWpzYXBpPTEnICk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBWaW1lbyBmcmFtZXMgbXVzdCBpbmNsdWRlIFwiP2FwaT0xXCJcblx0XHR0b0FycmF5KCBkb20uc2xpZGVzLnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbc3JjKj1cInBsYXllci52aW1lby5jb20vXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0dmFyIHNyYyA9IGVsLmdldEF0dHJpYnV0ZSggJ3NyYycgKTtcblx0XHRcdGlmKCAhL2FwaVxcPTEvZ2kudGVzdCggc3JjICkgKSB7XG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZSggJ3NyYycsIHNyYyArICggIS9cXD8vLnRlc3QoIHNyYyApID8gJz8nIDogJyYnICkgKyAnYXBpPTEnICk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCBwbGF5YmFjayBvZiBhbnkgZW1iZWRkZWQgY29udGVudCBpbnNpZGUgb2Zcblx0ICogdGhlIHRhcmdldGVkIHNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gc3RhcnRFbWJlZGRlZENvbnRlbnQoIHNsaWRlICkge1xuXG5cdFx0aWYoIHNsaWRlICYmICFpc1NwZWFrZXJOb3RlcygpICkge1xuXHRcdFx0Ly8gSFRNTDUgbWVkaWEgZWxlbWVudHNcblx0XHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICd2aWRlbywgYXVkaW8nICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGlmKCBlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWF1dG9wbGF5JyApICkge1xuXHRcdFx0XHRcdGVsLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBpZnJhbWUgZW1iZWRzXG5cdFx0XHR0b0FycmF5KCBzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAnc2xpZGU6c3RhcnQnLCAnKicgKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBZb3VUdWJlIGVtYmVkc1xuXHRcdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ2lmcmFtZVtzcmMqPVwieW91dHViZS5jb20vZW1iZWQvXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggZWwuaGFzQXR0cmlidXRlKCAnZGF0YS1hdXRvcGxheScgKSApIHtcblx0XHRcdFx0XHRlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBsYXlWaWRlb1wiLFwiYXJnc1wiOlwiXCJ9JywgJyonICk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBWaW1lbyBlbWJlZHNcblx0XHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbc3JjKj1cInBsYXllci52aW1lby5jb20vXCJdJyApICkuZm9yRWFjaCggZnVuY3Rpb24oIGVsICkge1xuXHRcdFx0XHRpZiggZWwuaGFzQXR0cmlidXRlKCAnZGF0YS1hdXRvcGxheScgKSApIHtcblx0XHRcdFx0XHRlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wibWV0aG9kXCI6XCJwbGF5XCJ9JywgJyonICk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3AgcGxheWJhY2sgb2YgYW55IGVtYmVkZGVkIGNvbnRlbnQgaW5zaWRlIG9mXG5cdCAqIHRoZSB0YXJnZXRlZCBzbGlkZS5cblx0ICovXG5cdGZ1bmN0aW9uIHN0b3BFbWJlZGRlZENvbnRlbnQoIHNsaWRlICkge1xuXG5cdFx0aWYoIHNsaWRlICYmIHNsaWRlLnBhcmVudE5vZGUgKSB7XG5cdFx0XHQvLyBIVE1MNSBtZWRpYSBlbGVtZW50c1xuXHRcdFx0dG9BcnJheSggc2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3ZpZGVvLCBhdWRpbycgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoICFlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWlnbm9yZScgKSApIHtcblx0XHRcdFx0XHRlbC5wYXVzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIGlmcmFtZSBlbWJlZHNcblx0XHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWUnICkgKS5mb3JFYWNoKCBmdW5jdGlvbiggZWwgKSB7XG5cdFx0XHRcdGVsLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoICdzbGlkZTpzdG9wJywgJyonICk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gWW91VHViZSBlbWJlZHNcblx0XHRcdHRvQXJyYXkoIHNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tL2VtYmVkL1wiXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoICFlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWlnbm9yZScgKSAmJiB0eXBlb2YgZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wiZXZlbnRcIjpcImNvbW1hbmRcIixcImZ1bmNcIjpcInBhdXNlVmlkZW9cIixcImFyZ3NcIjpcIlwifScsICcqJyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gVmltZW8gZW1iZWRzXG5cdFx0XHR0b0FycmF5KCBzbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnaWZyYW1lW3NyYyo9XCJwbGF5ZXIudmltZW8uY29tL1wiXScgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoICFlbC5oYXNBdHRyaWJ1dGUoICdkYXRhLWlnbm9yZScgKSAmJiB0eXBlb2YgZWwuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRlbC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCAne1wibWV0aG9kXCI6XCJwYXVzZVwifScsICcqJyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgdmFsdWUgcmFuZ2luZyBmcm9tIDAtMSB0aGF0IHJlcHJlc2VudHNcblx0ICogaG93IGZhciBpbnRvIHRoZSBwcmVzZW50YXRpb24gd2UgaGF2ZSBuYXZpZ2F0ZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRQcm9ncmVzcygpIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0Ly8gVGhlIG51bWJlciBvZiBwYXN0IGFuZCB0b3RhbCBzbGlkZXNcblx0XHR2YXIgdG90YWxDb3VudCA9IGdldFRvdGFsU2xpZGVzKCk7XG5cdFx0dmFyIHBhc3RDb3VudCA9IDA7XG5cblx0XHQvLyBTdGVwIHRocm91Z2ggYWxsIHNsaWRlcyBhbmQgY291bnQgdGhlIHBhc3Qgb25lc1xuXHRcdG1haW5Mb29wOiBmb3IoIHZhciBpID0gMDsgaSA8IGhvcml6b250YWxTbGlkZXMubGVuZ3RoOyBpKysgKSB7XG5cblx0XHRcdHZhciBob3Jpem9udGFsU2xpZGUgPSBob3Jpem9udGFsU2xpZGVzW2ldO1xuXHRcdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gdG9BcnJheSggaG9yaXpvbnRhbFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApICk7XG5cblx0XHRcdGZvciggdmFyIGogPSAwOyBqIDwgdmVydGljYWxTbGlkZXMubGVuZ3RoOyBqKysgKSB7XG5cblx0XHRcdFx0Ly8gU3RvcCBhcyBzb29uIGFzIHdlIGFycml2ZSBhdCB0aGUgcHJlc2VudFxuXHRcdFx0XHRpZiggdmVydGljYWxTbGlkZXNbal0uY2xhc3NMaXN0LmNvbnRhaW5zKCAncHJlc2VudCcgKSApIHtcblx0XHRcdFx0XHRicmVhayBtYWluTG9vcDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBhc3RDb3VudCsrO1xuXG5cdFx0XHR9XG5cblx0XHRcdC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBhcnJpdmUgYXQgdGhlIHByZXNlbnRcblx0XHRcdGlmKCBob3Jpem9udGFsU2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAncHJlc2VudCcgKSApIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdC8vIERvbid0IGNvdW50IHRoZSB3cmFwcGluZyBzZWN0aW9uIGZvciB2ZXJ0aWNhbCBzbGlkZXNcblx0XHRcdGlmKCBob3Jpem9udGFsU2xpZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCAnc3RhY2snICkgPT09IGZhbHNlICkge1xuXHRcdFx0XHRwYXN0Q291bnQrKztcblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cblx0XHRcdHZhciBhbGxGcmFnbWVudHMgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIGZyYWdtZW50cyBpbiB0aGUgY3VycmVudCBzbGlkZSB0aG9zZSBzaG91bGQgYmVcblx0XHRcdC8vIGFjY291bnRlZCBmb3IgaW4gdGhlIHByb2dyZXNzLlxuXHRcdFx0aWYoIGFsbEZyYWdtZW50cy5sZW5ndGggPiAwICkge1xuXHRcdFx0XHR2YXIgdmlzaWJsZUZyYWdtZW50cyA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICk7XG5cblx0XHRcdFx0Ly8gVGhpcyB2YWx1ZSByZXByZXNlbnRzIGhvdyBiaWcgYSBwb3J0aW9uIG9mIHRoZSBzbGlkZSBwcm9ncmVzc1xuXHRcdFx0XHQvLyB0aGF0IGlzIG1hZGUgdXAgYnkgaXRzIGZyYWdtZW50cyAoMC0xKVxuXHRcdFx0XHR2YXIgZnJhZ21lbnRXZWlnaHQgPSAwLjk7XG5cblx0XHRcdFx0Ly8gQWRkIGZyYWdtZW50IHByb2dyZXNzIHRvIHRoZSBwYXN0IHNsaWRlIGNvdW50XG5cdFx0XHRcdHBhc3RDb3VudCArPSAoIHZpc2libGVGcmFnbWVudHMubGVuZ3RoIC8gYWxsRnJhZ21lbnRzLmxlbmd0aCApICogZnJhZ21lbnRXZWlnaHQ7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gcGFzdENvdW50IC8gKCB0b3RhbENvdW50IC0gMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHRoaXMgcHJlc2VudGF0aW9uIGlzIHJ1bm5pbmcgaW5zaWRlIG9mIHRoZVxuXHQgKiBzcGVha2VyIG5vdGVzIHdpbmRvdy5cblx0ICovXG5cdGZ1bmN0aW9uIGlzU3BlYWtlck5vdGVzKCkge1xuXG5cdFx0cmV0dXJuICEhd2luZG93LmxvY2F0aW9uLnNlYXJjaC5tYXRjaCggL3JlY2VpdmVyL2dpICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZWFkcyB0aGUgY3VycmVudCBVUkwgKGhhc2gpIGFuZCBuYXZpZ2F0ZXMgYWNjb3JkaW5nbHkuXG5cdCAqL1xuXHRmdW5jdGlvbiByZWFkVVJMKCkge1xuXG5cdFx0dmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcblxuXHRcdC8vIEF0dGVtcHQgdG8gcGFyc2UgdGhlIGhhc2ggYXMgZWl0aGVyIGFuIGluZGV4IG9yIG5hbWVcblx0XHR2YXIgYml0cyA9IGhhc2guc2xpY2UoIDIgKS5zcGxpdCggJy8nICksXG5cdFx0XHRuYW1lID0gaGFzaC5yZXBsYWNlKCAvI3xcXC8vZ2ksICcnICk7XG5cblx0XHQvLyBJZiB0aGUgZmlyc3QgYml0IGlzIGludmFsaWQgYW5kIHRoZXJlIGlzIGEgbmFtZSB3ZSBjYW5cblx0XHQvLyBhc3N1bWUgdGhhdCB0aGlzIGlzIGEgbmFtZWQgbGlua1xuXHRcdGlmKCBpc05hTiggcGFyc2VJbnQoIGJpdHNbMF0sIDEwICkgKSAmJiBuYW1lLmxlbmd0aCApIHtcblx0XHRcdHZhciBlbGVtZW50O1xuXG5cdFx0XHQvLyBFbnN1cmUgdGhlIG5hbWVkIGxpbmsgaXMgYSB2YWxpZCBIVE1MIElEIGF0dHJpYnV0ZVxuXHRcdFx0aWYoIC9eW2EtekEtWl1bXFx3Oi4tXSokLy50ZXN0KCBuYW1lICkgKSB7XG5cdFx0XHRcdC8vIEZpbmQgdGhlIHNsaWRlIHdpdGggdGhlIHNwZWNpZmllZCBJRFxuXHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJyMnICsgbmFtZSApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggZWxlbWVudCApIHtcblx0XHRcdFx0Ly8gRmluZCB0aGUgcG9zaXRpb24gb2YgdGhlIG5hbWVkIHNsaWRlIGFuZCBuYXZpZ2F0ZSB0byBpdFxuXHRcdFx0XHR2YXIgaW5kaWNlcyA9IFJldmVhbC5nZXRJbmRpY2VzKCBlbGVtZW50ICk7XG5cdFx0XHRcdHNsaWRlKCBpbmRpY2VzLmgsIGluZGljZXMudiApO1xuXHRcdFx0fVxuXHRcdFx0Ly8gSWYgdGhlIHNsaWRlIGRvZXNuJ3QgZXhpc3QsIG5hdmlnYXRlIHRvIHRoZSBjdXJyZW50IHNsaWRlXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0c2xpZGUoIGluZGV4aCB8fCAwLCBpbmRleHYgfHwgMCApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlYWQgdGhlIGluZGV4IGNvbXBvbmVudHMgb2YgdGhlIGhhc2hcblx0XHRcdHZhciBoID0gcGFyc2VJbnQoIGJpdHNbMF0sIDEwICkgfHwgMCxcblx0XHRcdFx0diA9IHBhcnNlSW50KCBiaXRzWzFdLCAxMCApIHx8IDA7XG5cblx0XHRcdGlmKCBoICE9PSBpbmRleGggfHwgdiAhPT0gaW5kZXh2ICkge1xuXHRcdFx0XHRzbGlkZSggaCwgdiApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHBhZ2UgVVJMIChoYXNoKSB0byByZWZsZWN0IHRoZSBjdXJyZW50XG5cdCAqIHN0YXRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge051bWJlcn0gZGVsYXkgVGhlIHRpbWUgaW4gbXMgdG8gd2FpdCBiZWZvcmVcblx0ICogd3JpdGluZyB0aGUgaGFzaFxuXHQgKi9cblx0ZnVuY3Rpb24gd3JpdGVVUkwoIGRlbGF5ICkge1xuXG5cdFx0aWYoIGNvbmZpZy5oaXN0b3J5ICkge1xuXG5cdFx0XHQvLyBNYWtlIHN1cmUgdGhlcmUncyBuZXZlciBtb3JlIHRoYW4gb25lIHRpbWVvdXQgcnVubmluZ1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCB3cml0ZVVSTFRpbWVvdXQgKTtcblxuXHRcdFx0Ly8gSWYgYSBkZWxheSBpcyBzcGVjaWZpZWQsIHRpbWVvdXQgdGhpcyBjYWxsXG5cdFx0XHRpZiggdHlwZW9mIGRlbGF5ID09PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0d3JpdGVVUkxUaW1lb3V0ID0gc2V0VGltZW91dCggd3JpdGVVUkwsIGRlbGF5ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAnLyc7XG5cblx0XHRcdFx0Ly8gQXR0ZW1wdCB0byBjcmVhdGUgYSBuYW1lZCBsaW5rIGJhc2VkIG9uIHRoZSBzbGlkZSdzIElEXG5cdFx0XHRcdHZhciBpZCA9IGN1cnJlbnRTbGlkZS5nZXRBdHRyaWJ1dGUoICdpZCcgKTtcblx0XHRcdFx0aWYoIGlkICkge1xuXHRcdFx0XHRcdGlkID0gaWQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRpZCA9IGlkLnJlcGxhY2UoIC9bXmEtekEtWjAtOVxcLVxcX1xcOlxcLl0vZywgJycgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHRoZSBjdXJyZW50IHNsaWRlIGhhcyBhbiBJRCwgdXNlIHRoYXQgYXMgYSBuYW1lZCBsaW5rXG5cdFx0XHRcdGlmKCB0eXBlb2YgaWQgPT09ICdzdHJpbmcnICYmIGlkLmxlbmd0aCApIHtcblx0XHRcdFx0XHR1cmwgPSAnLycgKyBpZDtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBPdGhlcndpc2UgdXNlIHRoZSAvaC92IGluZGV4XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmKCBpbmRleGggPiAwIHx8IGluZGV4diA+IDAgKSB1cmwgKz0gaW5kZXhoO1xuXHRcdFx0XHRcdGlmKCBpbmRleHYgPiAwICkgdXJsICs9ICcvJyArIGluZGV4djtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gdXJsO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgaC92IGxvY2F0aW9uIG9mIHRoZSBjdXJyZW50LCBvciBzcGVjaWZpZWQsXG5cdCAqIHNsaWRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBzbGlkZSBJZiBzcGVjaWZpZWQsIHRoZSByZXR1cm5lZFxuXHQgKiBpbmRleCB3aWxsIGJlIGZvciB0aGlzIHNsaWRlIHJhdGhlciB0aGFuIHRoZSBjdXJyZW50bHlcblx0ICogYWN0aXZlIG9uZVxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IHsgaDogPGludD4sIHY6IDxpbnQ+LCBmOiA8aW50PiB9XG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRJbmRpY2VzKCBzbGlkZSApIHtcblxuXHRcdC8vIEJ5IGRlZmF1bHQsIHJldHVybiB0aGUgY3VycmVudCBpbmRpY2VzXG5cdFx0dmFyIGggPSBpbmRleGgsXG5cdFx0XHR2ID0gaW5kZXh2LFxuXHRcdFx0ZjtcblxuXHRcdC8vIElmIGEgc2xpZGUgaXMgc3BlY2lmaWVkLCByZXR1cm4gdGhlIGluZGljZXMgb2YgdGhhdCBzbGlkZVxuXHRcdGlmKCBzbGlkZSApIHtcblx0XHRcdHZhciBpc1ZlcnRpY2FsID0gaXNWZXJ0aWNhbFNsaWRlKCBzbGlkZSApO1xuXHRcdFx0dmFyIHNsaWRlaCA9IGlzVmVydGljYWwgPyBzbGlkZS5wYXJlbnROb2RlIDogc2xpZGU7XG5cblx0XHRcdC8vIFNlbGVjdCBhbGwgaG9yaXpvbnRhbCBzbGlkZXNcblx0XHRcdHZhciBob3Jpem9udGFsU2xpZGVzID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApO1xuXG5cdFx0XHQvLyBOb3cgdGhhdCB3ZSBrbm93IHdoaWNoIHRoZSBob3Jpem9udGFsIHNsaWRlIGlzLCBnZXQgaXRzIGluZGV4XG5cdFx0XHRoID0gTWF0aC5tYXgoIGhvcml6b250YWxTbGlkZXMuaW5kZXhPZiggc2xpZGVoICksIDAgKTtcblxuXHRcdFx0Ly8gQXNzdW1lIHdlJ3JlIG5vdCB2ZXJ0aWNhbFxuXHRcdFx0diA9IHVuZGVmaW5lZDtcblxuXHRcdFx0Ly8gSWYgdGhpcyBpcyBhIHZlcnRpY2FsIHNsaWRlLCBncmFiIHRoZSB2ZXJ0aWNhbCBpbmRleFxuXHRcdFx0aWYoIGlzVmVydGljYWwgKSB7XG5cdFx0XHRcdHYgPSBNYXRoLm1heCggdG9BcnJheSggc2xpZGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKSApLmluZGV4T2YoIHNsaWRlICksIDAgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiggIXNsaWRlICYmIGN1cnJlbnRTbGlkZSApIHtcblx0XHRcdHZhciBoYXNGcmFnbWVudHMgPSBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJy5mcmFnbWVudCcgKS5sZW5ndGggPiAwO1xuXHRcdFx0aWYoIGhhc0ZyYWdtZW50cyApIHtcblx0XHRcdFx0dmFyIGN1cnJlbnRGcmFnbWVudCA9IGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yKCAnLmN1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdGlmKCBjdXJyZW50RnJhZ21lbnQgJiYgY3VycmVudEZyYWdtZW50Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgKSB7XG5cdFx0XHRcdFx0ZiA9IHBhcnNlSW50KCBjdXJyZW50RnJhZ21lbnQuZ2V0QXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSwgMTAgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRmID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQudmlzaWJsZScgKS5sZW5ndGggLSAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgaDogaCwgdjogdiwgZjogZiB9O1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSB0b3RhbCBudW1iZXIgb2Ygc2xpZGVzIGluIHRoaXMgcHJlc2VudGF0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0VG90YWxTbGlkZXMoKSB7XG5cblx0XHRyZXR1cm4gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggU0xJREVTX1NFTEVDVE9SICsgJzpub3QoLnN0YWNrKScgKS5sZW5ndGg7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBzbGlkZSBlbGVtZW50IG1hdGNoaW5nIHRoZSBzcGVjaWZpZWQgaW5kZXguXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkZSggeCwgeSApIHtcblxuXHRcdHZhciBob3Jpem9udGFsU2xpZGUgPSBkb20ud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCBIT1JJWk9OVEFMX1NMSURFU19TRUxFQ1RPUiApWyB4IF07XG5cdFx0dmFyIHZlcnRpY2FsU2xpZGVzID0gaG9yaXpvbnRhbFNsaWRlICYmIGhvcml6b250YWxTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnc2VjdGlvbicgKTtcblxuXHRcdGlmKCB2ZXJ0aWNhbFNsaWRlcyAmJiB2ZXJ0aWNhbFNsaWRlcy5sZW5ndGggJiYgdHlwZW9mIHkgPT09ICdudW1iZXInICkge1xuXHRcdFx0cmV0dXJuIHZlcnRpY2FsU2xpZGVzID8gdmVydGljYWxTbGlkZXNbIHkgXSA6IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaG9yaXpvbnRhbFNsaWRlO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYmFja2dyb3VuZCBlbGVtZW50IGZvciB0aGUgZ2l2ZW4gc2xpZGUuXG5cdCAqIEFsbCBzbGlkZXMsIGV2ZW4gdGhlIG9uZXMgd2l0aCBubyBiYWNrZ3JvdW5kIHByb3BlcnRpZXNcblx0ICogZGVmaW5lZCwgaGF2ZSBhIGJhY2tncm91bmQgZWxlbWVudCBzbyBhcyBsb25nIGFzIHRoZVxuXHQgKiBpbmRleCBpcyB2YWxpZCBhbiBlbGVtZW50IHdpbGwgYmUgcmV0dXJuZWQuXG5cdCAqL1xuXHRmdW5jdGlvbiBnZXRTbGlkZUJhY2tncm91bmQoIHgsIHkgKSB7XG5cblx0XHQvLyBXaGVuIHByaW50aW5nIHRvIFBERiB0aGUgc2xpZGUgYmFja2dyb3VuZHMgYXJlIG5lc3RlZFxuXHRcdC8vIGluc2lkZSBvZiB0aGUgc2xpZGVzXG5cdFx0aWYoIGlzUHJpbnRpbmdQREYoKSApIHtcblx0XHRcdHZhciBzbGlkZSA9IGdldFNsaWRlKCB4LCB5ICk7XG5cdFx0XHRpZiggc2xpZGUgKSB7XG5cdFx0XHRcdHZhciBiYWNrZ3JvdW5kID0gc2xpZGUucXVlcnlTZWxlY3RvciggJy5zbGlkZS1iYWNrZ3JvdW5kJyApO1xuXHRcdFx0XHRpZiggYmFja2dyb3VuZCAmJiBiYWNrZ3JvdW5kLnBhcmVudE5vZGUgPT09IHNsaWRlICkge1xuXHRcdFx0XHRcdHJldHVybiBiYWNrZ3JvdW5kO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0dmFyIGhvcml6b250YWxCYWNrZ3JvdW5kID0gZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggJy5iYWNrZ3JvdW5kcz4uc2xpZGUtYmFja2dyb3VuZCcgKVsgeCBdO1xuXHRcdHZhciB2ZXJ0aWNhbEJhY2tncm91bmRzID0gaG9yaXpvbnRhbEJhY2tncm91bmQgJiYgaG9yaXpvbnRhbEJhY2tncm91bmQucXVlcnlTZWxlY3RvckFsbCggJy5zbGlkZS1iYWNrZ3JvdW5kJyApO1xuXG5cdFx0aWYoIHZlcnRpY2FsQmFja2dyb3VuZHMgJiYgdmVydGljYWxCYWNrZ3JvdW5kcy5sZW5ndGggJiYgdHlwZW9mIHkgPT09ICdudW1iZXInICkge1xuXHRcdFx0cmV0dXJuIHZlcnRpY2FsQmFja2dyb3VuZHMgPyB2ZXJ0aWNhbEJhY2tncm91bmRzWyB5IF0gOiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhvcml6b250YWxCYWNrZ3JvdW5kO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBwcmVzZW50YXRpb24gYXNcblx0ICogYW4gb2JqZWN0LiBUaGlzIHN0YXRlIGNhbiB0aGVuIGJlIHJlc3RvcmVkIGF0IGFueVxuXHQgKiB0aW1lLlxuXHQgKi9cblx0ZnVuY3Rpb24gZ2V0U3RhdGUoKSB7XG5cblx0XHR2YXIgaW5kaWNlcyA9IGdldEluZGljZXMoKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRpbmRleGg6IGluZGljZXMuaCxcblx0XHRcdGluZGV4djogaW5kaWNlcy52LFxuXHRcdFx0aW5kZXhmOiBpbmRpY2VzLmYsXG5cdFx0XHRwYXVzZWQ6IGlzUGF1c2VkKCksXG5cdFx0XHRvdmVydmlldzogaXNPdmVydmlldygpXG5cdFx0fTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJlc3RvcmVzIHRoZSBwcmVzZW50YXRpb24gdG8gdGhlIGdpdmVuIHN0YXRlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgQXMgZ2VuZXJhdGVkIGJ5IGdldFN0YXRlKClcblx0ICovXG5cdGZ1bmN0aW9uIHNldFN0YXRlKCBzdGF0ZSApIHtcblxuXHRcdGlmKCB0eXBlb2Ygc3RhdGUgPT09ICdvYmplY3QnICkge1xuXHRcdFx0c2xpZGUoIGRlc2VyaWFsaXplKCBzdGF0ZS5pbmRleGggKSwgZGVzZXJpYWxpemUoIHN0YXRlLmluZGV4diApLCBkZXNlcmlhbGl6ZSggc3RhdGUuaW5kZXhmICkgKTtcblxuXHRcdFx0dmFyIHBhdXNlZEZsYWcgPSBkZXNlcmlhbGl6ZSggc3RhdGUucGF1c2VkICksXG5cdFx0XHRcdG92ZXJ2aWV3RmxhZyA9IGRlc2VyaWFsaXplKCBzdGF0ZS5vdmVydmlldyApO1xuXG5cdFx0XHRpZiggdHlwZW9mIHBhdXNlZEZsYWcgPT09ICdib29sZWFuJyAmJiBwYXVzZWRGbGFnICE9PSBpc1BhdXNlZCgpICkge1xuXHRcdFx0XHR0b2dnbGVQYXVzZSggcGF1c2VkRmxhZyApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggdHlwZW9mIG92ZXJ2aWV3RmxhZyA9PT0gJ2Jvb2xlYW4nICYmIG92ZXJ2aWV3RmxhZyAhPT0gaXNPdmVydmlldygpICkge1xuXHRcdFx0XHR0b2dnbGVPdmVydmlldyggb3ZlcnZpZXdGbGFnICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGEgc29ydGVkIGZyYWdtZW50cyBsaXN0LCBvcmRlcmVkIGJ5IGFuIGluY3JlYXNpbmdcblx0ICogXCJkYXRhLWZyYWdtZW50LWluZGV4XCIgYXR0cmlidXRlLlxuXHQgKlxuXHQgKiBGcmFnbWVudHMgd2lsbCBiZSByZXZlYWxlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSByZXR1cm5lZCBieVxuXHQgKiB0aGlzIGZ1bmN0aW9uLCBzbyB5b3UgY2FuIHVzZSB0aGUgaW5kZXggYXR0cmlidXRlcyB0byBjb250cm9sIHRoZVxuXHQgKiBvcmRlciBvZiBmcmFnbWVudCBhcHBlYXJhbmNlLlxuXHQgKlxuXHQgKiBUbyBtYWludGFpbiBhIHNlbnNpYmxlIGRlZmF1bHQgZnJhZ21lbnQgb3JkZXIsIGZyYWdtZW50cyBhcmUgcHJlc3VtZWRcblx0ICogdG8gYmUgcGFzc2VkIGluIGRvY3VtZW50IG9yZGVyLiBUaGlzIGZ1bmN0aW9uIGFkZHMgYSBcImZyYWdtZW50LWluZGV4XCJcblx0ICogYXR0cmlidXRlIHRvIGVhY2ggbm9kZSBpZiBzdWNoIGFuIGF0dHJpYnV0ZSBpcyBub3QgYWxyZWFkeSBwcmVzZW50LFxuXHQgKiBhbmQgc2V0cyB0aGF0IGF0dHJpYnV0ZSB0byBhbiBpbnRlZ2VyIHZhbHVlIHdoaWNoIGlzIHRoZSBwb3NpdGlvbiBvZlxuXHQgKiB0aGUgZnJhZ21lbnQgd2l0aGluIHRoZSBmcmFnbWVudHMgbGlzdC5cblx0ICovXG5cdGZ1bmN0aW9uIHNvcnRGcmFnbWVudHMoIGZyYWdtZW50cyApIHtcblxuXHRcdGZyYWdtZW50cyA9IHRvQXJyYXkoIGZyYWdtZW50cyApO1xuXG5cdFx0dmFyIG9yZGVyZWQgPSBbXSxcblx0XHRcdHVub3JkZXJlZCA9IFtdLFxuXHRcdFx0c29ydGVkID0gW107XG5cblx0XHQvLyBHcm91cCBvcmRlcmVkIGFuZCB1bm9yZGVyZWQgZWxlbWVudHNcblx0XHRmcmFnbWVudHMuZm9yRWFjaCggZnVuY3Rpb24oIGZyYWdtZW50LCBpICkge1xuXHRcdFx0aWYoIGZyYWdtZW50Lmhhc0F0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnICkgKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IHBhcnNlSW50KCBmcmFnbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApLCAxMCApO1xuXG5cdFx0XHRcdGlmKCAhb3JkZXJlZFtpbmRleF0gKSB7XG5cdFx0XHRcdFx0b3JkZXJlZFtpbmRleF0gPSBbXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG9yZGVyZWRbaW5kZXhdLnB1c2goIGZyYWdtZW50ICk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dW5vcmRlcmVkLnB1c2goIFsgZnJhZ21lbnQgXSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdC8vIEFwcGVuZCBmcmFnbWVudHMgd2l0aG91dCBleHBsaWNpdCBpbmRpY2VzIGluIHRoZWlyXG5cdFx0Ly8gRE9NIG9yZGVyXG5cdFx0b3JkZXJlZCA9IG9yZGVyZWQuY29uY2F0KCB1bm9yZGVyZWQgKTtcblxuXHRcdC8vIE1hbnVhbGx5IGNvdW50IHRoZSBpbmRleCB1cCBwZXIgZ3JvdXAgdG8gZW5zdXJlIHRoZXJlXG5cdFx0Ly8gYXJlIG5vIGdhcHNcblx0XHR2YXIgaW5kZXggPSAwO1xuXG5cdFx0Ly8gUHVzaCBhbGwgZnJhZ21lbnRzIGluIHRoZWlyIHNvcnRlZCBvcmRlciB0byBhbiBhcnJheSxcblx0XHQvLyB0aGlzIGZsYXR0ZW5zIHRoZSBncm91cHNcblx0XHRvcmRlcmVkLmZvckVhY2goIGZ1bmN0aW9uKCBncm91cCApIHtcblx0XHRcdGdyb3VwLmZvckVhY2goIGZ1bmN0aW9uKCBmcmFnbWVudCApIHtcblx0XHRcdFx0c29ydGVkLnB1c2goIGZyYWdtZW50ICk7XG5cdFx0XHRcdGZyYWdtZW50LnNldEF0dHJpYnV0ZSggJ2RhdGEtZnJhZ21lbnQtaW5kZXgnLCBpbmRleCApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRpbmRleCArKztcblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gc29ydGVkO1xuXG5cdH1cblxuXHQvKipcblx0ICogTmF2aWdhdGUgdG8gdGhlIHNwZWNpZmllZCBzbGlkZSBmcmFnbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZnJhZ21lbnQgdGhhdFxuXHQgKiBzaG91bGQgYmUgc2hvd24sIC0xIG1lYW5zIGFsbCBhcmUgaW52aXNpYmxlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgSW50ZWdlciBvZmZzZXQgdG8gYXBwbHkgdG8gdGhlXG5cdCAqIGZyYWdtZW50IGluZGV4XG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYSBjaGFuZ2Ugd2FzIG1hZGUgaW4gYW55XG5cdCAqIGZyYWdtZW50cyB2aXNpYmlsaXR5IGFzIHBhcnQgb2YgdGhpcyBjYWxsXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZUZyYWdtZW50KCBpbmRleCwgb2Zmc2V0ICkge1xuXG5cdFx0aWYoIGN1cnJlbnRTbGlkZSAmJiBjb25maWcuZnJhZ21lbnRzICkge1xuXG5cdFx0XHR2YXIgZnJhZ21lbnRzID0gc29ydEZyYWdtZW50cyggY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICcuZnJhZ21lbnQnICkgKTtcblx0XHRcdGlmKCBmcmFnbWVudHMubGVuZ3RoICkge1xuXG5cdFx0XHRcdC8vIElmIG5vIGluZGV4IGlzIHNwZWNpZmllZCwgZmluZCB0aGUgY3VycmVudFxuXHRcdFx0XHRpZiggdHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJyApIHtcblx0XHRcdFx0XHR2YXIgbGFzdFZpc2libGVGcmFnbWVudCA9IHNvcnRGcmFnbWVudHMoIGN1cnJlbnRTbGlkZS5xdWVyeVNlbGVjdG9yQWxsKCAnLmZyYWdtZW50LnZpc2libGUnICkgKS5wb3AoKTtcblxuXHRcdFx0XHRcdGlmKCBsYXN0VmlzaWJsZUZyYWdtZW50ICkge1xuXHRcdFx0XHRcdFx0aW5kZXggPSBwYXJzZUludCggbGFzdFZpc2libGVGcmFnbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApIHx8IDAsIDEwICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0aW5kZXggPSAtMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBJZiBhbiBvZmZzZXQgaXMgc3BlY2lmaWVkLCBhcHBseSBpdCB0byB0aGUgaW5kZXhcblx0XHRcdFx0aWYoIHR5cGVvZiBvZmZzZXQgPT09ICdudW1iZXInICkge1xuXHRcdFx0XHRcdGluZGV4ICs9IG9mZnNldDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBmcmFnbWVudHNTaG93biA9IFtdLFxuXHRcdFx0XHRcdGZyYWdtZW50c0hpZGRlbiA9IFtdO1xuXG5cdFx0XHRcdHRvQXJyYXkoIGZyYWdtZW50cyApLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50LCBpICkge1xuXG5cdFx0XHRcdFx0aWYoIGVsZW1lbnQuaGFzQXR0cmlidXRlKCAnZGF0YS1mcmFnbWVudC1pbmRleCcgKSApIHtcblx0XHRcdFx0XHRcdGkgPSBwYXJzZUludCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWZyYWdtZW50LWluZGV4JyApLCAxMCApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFZpc2libGUgZnJhZ21lbnRzXG5cdFx0XHRcdFx0aWYoIGkgPD0gaW5kZXggKSB7XG5cdFx0XHRcdFx0XHRpZiggIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCAndmlzaWJsZScgKSApIGZyYWdtZW50c1Nob3duLnB1c2goIGVsZW1lbnQgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3Zpc2libGUnICk7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoICdjdXJyZW50LWZyYWdtZW50JyApO1xuXG5cdFx0XHRcdFx0XHQvLyBBbm5vdW5jZSB0aGUgZnJhZ21lbnRzIG9uZSBieSBvbmUgdG8gdGhlIFNjcmVlbiBSZWFkZXJcblx0XHRcdFx0XHRcdGRvbS5zdGF0dXNEaXYudGV4dENvbnRlbnQgPSBlbGVtZW50LnRleHRDb250ZW50O1xuXG5cdFx0XHRcdFx0XHRpZiggaSA9PT0gaW5kZXggKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIEhpZGRlbiBmcmFnbWVudHNcblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmKCBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyggJ3Zpc2libGUnICkgKSBmcmFnbWVudHNIaWRkZW4ucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCAndmlzaWJsZScgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ2N1cnJlbnQtZnJhZ21lbnQnICk7XG5cdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdGlmKCBmcmFnbWVudHNIaWRkZW4ubGVuZ3RoICkge1xuXHRcdFx0XHRcdGRpc3BhdGNoRXZlbnQoICdmcmFnbWVudGhpZGRlbicsIHsgZnJhZ21lbnQ6IGZyYWdtZW50c0hpZGRlblswXSwgZnJhZ21lbnRzOiBmcmFnbWVudHNIaWRkZW4gfSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGZyYWdtZW50c1Nob3duLmxlbmd0aCApIHtcblx0XHRcdFx0XHRkaXNwYXRjaEV2ZW50KCAnZnJhZ21lbnRzaG93bicsIHsgZnJhZ21lbnQ6IGZyYWdtZW50c1Nob3duWzBdLCBmcmFnbWVudHM6IGZyYWdtZW50c1Nob3duIH0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHVwZGF0ZUNvbnRyb2xzKCk7XG5cdFx0XHRcdHVwZGF0ZVByb2dyZXNzKCk7XG5cblx0XHRcdFx0cmV0dXJuICEhKCBmcmFnbWVudHNTaG93bi5sZW5ndGggfHwgZnJhZ21lbnRzSGlkZGVuLmxlbmd0aCApO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZSB0byB0aGUgbmV4dCBzbGlkZSBmcmFnbWVudC5cblx0ICpcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSB3YXMgYSBuZXh0IGZyYWdtZW50LFxuXHQgKiBmYWxzZSBvdGhlcndpc2Vcblx0ICovXG5cdGZ1bmN0aW9uIG5leHRGcmFnbWVudCgpIHtcblxuXHRcdHJldHVybiBuYXZpZ2F0ZUZyYWdtZW50KCBudWxsLCAxICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZSB0byB0aGUgcHJldmlvdXMgc2xpZGUgZnJhZ21lbnQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhlcmUgd2FzIGEgcHJldmlvdXMgZnJhZ21lbnQsXG5cdCAqIGZhbHNlIG90aGVyd2lzZVxuXHQgKi9cblx0ZnVuY3Rpb24gcHJldmlvdXNGcmFnbWVudCgpIHtcblxuXHRcdHJldHVybiBuYXZpZ2F0ZUZyYWdtZW50KCBudWxsLCAtMSApO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ3VlcyBhIG5ldyBhdXRvbWF0ZWQgc2xpZGUgaWYgZW5hYmxlZCBpbiB0aGUgY29uZmlnLlxuXHQgKi9cblx0ZnVuY3Rpb24gY3VlQXV0b1NsaWRlKCkge1xuXG5cdFx0Y2FuY2VsQXV0b1NsaWRlKCk7XG5cblx0XHRpZiggY3VycmVudFNsaWRlICkge1xuXG5cdFx0XHR2YXIgY3VycmVudEZyYWdtZW50ID0gY3VycmVudFNsaWRlLnF1ZXJ5U2VsZWN0b3IoICcuY3VycmVudC1mcmFnbWVudCcgKTtcblxuXHRcdFx0dmFyIGZyYWdtZW50QXV0b1NsaWRlID0gY3VycmVudEZyYWdtZW50ID8gY3VycmVudEZyYWdtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtYXV0b3NsaWRlJyApIDogbnVsbDtcblx0XHRcdHZhciBwYXJlbnRBdXRvU2xpZGUgPSBjdXJyZW50U2xpZGUucGFyZW50Tm9kZSA/IGN1cnJlbnRTbGlkZS5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSggJ2RhdGEtYXV0b3NsaWRlJyApIDogbnVsbDtcblx0XHRcdHZhciBzbGlkZUF1dG9TbGlkZSA9IGN1cnJlbnRTbGlkZS5nZXRBdHRyaWJ1dGUoICdkYXRhLWF1dG9zbGlkZScgKTtcblxuXHRcdFx0Ly8gUGljayB2YWx1ZSBpbiB0aGUgZm9sbG93aW5nIHByaW9yaXR5IG9yZGVyOlxuXHRcdFx0Ly8gMS4gQ3VycmVudCBmcmFnbWVudCdzIGRhdGEtYXV0b3NsaWRlXG5cdFx0XHQvLyAyLiBDdXJyZW50IHNsaWRlJ3MgZGF0YS1hdXRvc2xpZGVcblx0XHRcdC8vIDMuIFBhcmVudCBzbGlkZSdzIGRhdGEtYXV0b3NsaWRlXG5cdFx0XHQvLyA0LiBHbG9iYWwgYXV0b1NsaWRlIHNldHRpbmdcblx0XHRcdGlmKCBmcmFnbWVudEF1dG9TbGlkZSApIHtcblx0XHRcdFx0YXV0b1NsaWRlID0gcGFyc2VJbnQoIGZyYWdtZW50QXV0b1NsaWRlLCAxMCApO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggc2xpZGVBdXRvU2xpZGUgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZSA9IHBhcnNlSW50KCBzbGlkZUF1dG9TbGlkZSwgMTAgKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYoIHBhcmVudEF1dG9TbGlkZSApIHtcblx0XHRcdFx0YXV0b1NsaWRlID0gcGFyc2VJbnQoIHBhcmVudEF1dG9TbGlkZSwgMTAgKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRhdXRvU2xpZGUgPSBjb25maWcuYXV0b1NsaWRlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB0aGVyZSBhcmUgbWVkaWEgZWxlbWVudHMgd2l0aCBkYXRhLWF1dG9wbGF5LFxuXHRcdFx0Ly8gYXV0b21hdGljYWxseSBzZXQgdGhlIGF1dG9TbGlkZSBkdXJhdGlvbiB0byB0aGVcblx0XHRcdC8vIGxlbmd0aCBvZiB0aGF0IG1lZGlhXG5cdFx0XHR0b0FycmF5KCBjdXJyZW50U2xpZGUucXVlcnlTZWxlY3RvckFsbCggJ3ZpZGVvLCBhdWRpbycgKSApLmZvckVhY2goIGZ1bmN0aW9uKCBlbCApIHtcblx0XHRcdFx0aWYoIGVsLmhhc0F0dHJpYnV0ZSggJ2RhdGEtYXV0b3BsYXknICkgKSB7XG5cdFx0XHRcdFx0aWYoIGF1dG9TbGlkZSAmJiBlbC5kdXJhdGlvbiAqIDEwMDAgPiBhdXRvU2xpZGUgKSB7XG5cdFx0XHRcdFx0XHRhdXRvU2xpZGUgPSAoIGVsLmR1cmF0aW9uICogMTAwMCApICsgMTAwMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gQ3VlIHRoZSBuZXh0IGF1dG8tc2xpZGUgaWY6XG5cdFx0XHQvLyAtIFRoZXJlIGlzIGFuIGF1dG9TbGlkZSB2YWx1ZVxuXHRcdFx0Ly8gLSBBdXRvLXNsaWRpbmcgaXNuJ3QgcGF1c2VkIGJ5IHRoZSB1c2VyXG5cdFx0XHQvLyAtIFRoZSBwcmVzZW50YXRpb24gaXNuJ3QgcGF1c2VkXG5cdFx0XHQvLyAtIFRoZSBvdmVydmlldyBpc24ndCBhY3RpdmVcblx0XHRcdC8vIC0gVGhlIHByZXNlbnRhdGlvbiBpc24ndCBvdmVyXG5cdFx0XHRpZiggYXV0b1NsaWRlICYmICFhdXRvU2xpZGVQYXVzZWQgJiYgIWlzUGF1c2VkKCkgJiYgIWlzT3ZlcnZpZXcoKSAmJiAoICFSZXZlYWwuaXNMYXN0U2xpZGUoKSB8fCBhdmFpbGFibGVGcmFnbWVudHMoKS5uZXh0IHx8IGNvbmZpZy5sb29wID09PSB0cnVlICkgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCBuYXZpZ2F0ZU5leHQsIGF1dG9TbGlkZSApO1xuXHRcdFx0XHRhdXRvU2xpZGVTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggYXV0b1NsaWRlUGxheWVyICkge1xuXHRcdFx0XHRhdXRvU2xpZGVQbGF5ZXIuc2V0UGxheWluZyggYXV0b1NsaWRlVGltZW91dCAhPT0gLTEgKTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENhbmNlbHMgYW55IG9uZ29pbmcgcmVxdWVzdCB0byBhdXRvLXNsaWRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gY2FuY2VsQXV0b1NsaWRlKCkge1xuXG5cdFx0Y2xlYXJUaW1lb3V0KCBhdXRvU2xpZGVUaW1lb3V0ICk7XG5cdFx0YXV0b1NsaWRlVGltZW91dCA9IC0xO1xuXG5cdH1cblxuXHRmdW5jdGlvbiBwYXVzZUF1dG9TbGlkZSgpIHtcblxuXHRcdGlmKCBhdXRvU2xpZGUgJiYgIWF1dG9TbGlkZVBhdXNlZCApIHtcblx0XHRcdGF1dG9TbGlkZVBhdXNlZCA9IHRydWU7XG5cdFx0XHRkaXNwYXRjaEV2ZW50KCAnYXV0b3NsaWRlcGF1c2VkJyApO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KCBhdXRvU2xpZGVUaW1lb3V0ICk7XG5cblx0XHRcdGlmKCBhdXRvU2xpZGVQbGF5ZXIgKSB7XG5cdFx0XHRcdGF1dG9TbGlkZVBsYXllci5zZXRQbGF5aW5nKCBmYWxzZSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gcmVzdW1lQXV0b1NsaWRlKCkge1xuXG5cdFx0aWYoIGF1dG9TbGlkZSAmJiBhdXRvU2xpZGVQYXVzZWQgKSB7XG5cdFx0XHRhdXRvU2xpZGVQYXVzZWQgPSBmYWxzZTtcblx0XHRcdGRpc3BhdGNoRXZlbnQoICdhdXRvc2xpZGVyZXN1bWVkJyApO1xuXHRcdFx0Y3VlQXV0b1NsaWRlKCk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZUxlZnQoKSB7XG5cblx0XHQvLyBSZXZlcnNlIGZvciBSVExcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBuZXh0RnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5sZWZ0ICkge1xuXHRcdFx0XHRzbGlkZSggaW5kZXhoICsgMSApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBOb3JtYWwgbmF2aWdhdGlvblxuXHRcdGVsc2UgaWYoICggaXNPdmVydmlldygpIHx8IHByZXZpb3VzRnJhZ21lbnQoKSA9PT0gZmFsc2UgKSAmJiBhdmFpbGFibGVSb3V0ZXMoKS5sZWZ0ICkge1xuXHRcdFx0c2xpZGUoIGluZGV4aCAtIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdGZ1bmN0aW9uIG5hdmlnYXRlUmlnaHQoKSB7XG5cblx0XHQvLyBSZXZlcnNlIGZvciBSVExcblx0XHRpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkucmlnaHQgKSB7XG5cdFx0XHRcdHNsaWRlKCBpbmRleGggLSAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIE5vcm1hbCBuYXZpZ2F0aW9uXG5cdFx0ZWxzZSBpZiggKCBpc092ZXJ2aWV3KCkgfHwgbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkucmlnaHQgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoICsgMSApO1xuXHRcdH1cblxuXHR9XG5cblx0ZnVuY3Rpb24gbmF2aWdhdGVVcCgpIHtcblxuXHRcdC8vIFByaW9yaXRpemUgaGlkaW5nIGZyYWdtZW50c1xuXHRcdGlmKCAoIGlzT3ZlcnZpZXcoKSB8fCBwcmV2aW91c0ZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkudXAgKSB7XG5cdFx0XHRzbGlkZSggaW5kZXhoLCBpbmRleHYgLSAxICk7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiBuYXZpZ2F0ZURvd24oKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggKCBpc092ZXJ2aWV3KCkgfHwgbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkgJiYgYXZhaWxhYmxlUm91dGVzKCkuZG93biApIHtcblx0XHRcdHNsaWRlKCBpbmRleGgsIGluZGV4diArIDEgKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBOYXZpZ2F0ZXMgYmFja3dhcmRzLCBwcmlvcml0aXplZCBpbiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuXHQgKiAxKSBQcmV2aW91cyBmcmFnbWVudFxuXHQgKiAyKSBQcmV2aW91cyB2ZXJ0aWNhbCBzbGlkZVxuXHQgKiAzKSBQcmV2aW91cyBob3Jpem9udGFsIHNsaWRlXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZVByZXYoKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggcHJldmlvdXNGcmFnbWVudCgpID09PSBmYWxzZSApIHtcblx0XHRcdGlmKCBhdmFpbGFibGVSb3V0ZXMoKS51cCApIHtcblx0XHRcdFx0bmF2aWdhdGVVcCgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIEZldGNoIHRoZSBwcmV2aW91cyBob3Jpem9udGFsIHNsaWRlLCBpZiB0aGVyZSBpcyBvbmVcblx0XHRcdFx0dmFyIHByZXZpb3VzU2xpZGU7XG5cblx0XHRcdFx0aWYoIGNvbmZpZy5ydGwgKSB7XG5cdFx0XHRcdFx0cHJldmlvdXNTbGlkZSA9IHRvQXJyYXkoIGRvbS53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIEhPUklaT05UQUxfU0xJREVTX1NFTEVDVE9SICsgJy5mdXR1cmUnICkgKS5wb3AoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRwcmV2aW91c1NsaWRlID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKyAnLnBhc3QnICkgKS5wb3AoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCBwcmV2aW91c1NsaWRlICkge1xuXHRcdFx0XHRcdHZhciB2ID0gKCBwcmV2aW91c1NsaWRlLnF1ZXJ5U2VsZWN0b3JBbGwoICdzZWN0aW9uJyApLmxlbmd0aCAtIDEgKSB8fCB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0dmFyIGggPSBpbmRleGggLSAxO1xuXHRcdFx0XHRcdHNsaWRlKCBoLCB2ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgcmV2ZXJzZSBvZiAjbmF2aWdhdGVQcmV2KCkuXG5cdCAqL1xuXHRmdW5jdGlvbiBuYXZpZ2F0ZU5leHQoKSB7XG5cblx0XHQvLyBQcmlvcml0aXplIHJldmVhbGluZyBmcmFnbWVudHNcblx0XHRpZiggbmV4dEZyYWdtZW50KCkgPT09IGZhbHNlICkge1xuXHRcdFx0aWYoIGF2YWlsYWJsZVJvdXRlcygpLmRvd24gKSB7XG5cdFx0XHRcdG5hdmlnYXRlRG93bigpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiggY29uZmlnLnJ0bCApIHtcblx0XHRcdFx0bmF2aWdhdGVMZWZ0KCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0bmF2aWdhdGVSaWdodCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElmIGF1dG8tc2xpZGluZyBpcyBlbmFibGVkIHdlIG5lZWQgdG8gY3VlIHVwXG5cdFx0Ly8gYW5vdGhlciB0aW1lb3V0XG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0fVxuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFVkVOVFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblxuXHQvKipcblx0ICogQ2FsbGVkIGJ5IGFsbCBldmVudCBoYW5kbGVycyB0aGF0IGFyZSBiYXNlZCBvbiB1c2VyXG5cdCAqIGlucHV0LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Vc2VySW5wdXQoIGV2ZW50ICkge1xuXG5cdFx0aWYoIGNvbmZpZy5hdXRvU2xpZGVTdG9wcGFibGUgKSB7XG5cdFx0XHRwYXVzZUF1dG9TbGlkZSgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSBkb2N1bWVudCBsZXZlbCAna2V5cHJlc3MnIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Eb2N1bWVudEtleVByZXNzKCBldmVudCApIHtcblxuXHRcdC8vIENoZWNrIGlmIHRoZSBwcmVzc2VkIGtleSBpcyBxdWVzdGlvbiBtYXJrXG5cdFx0aWYoIGV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LmNoYXJDb2RlID09PSA2MyApIHtcblx0XHRcdGlmKCBkb20ub3ZlcmxheSApIHtcblx0XHRcdFx0Y2xvc2VPdmVybGF5KCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0c2hvd0hlbHAoIHRydWUgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgZG9jdW1lbnQgbGV2ZWwgJ2tleWRvd24nIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Eb2N1bWVudEtleURvd24oIGV2ZW50ICkge1xuXG5cdFx0Ly8gSWYgdGhlcmUncyBhIGNvbmRpdGlvbiBzcGVjaWZpZWQgYW5kIGl0IHJldHVybnMgZmFsc2UsXG5cdFx0Ly8gaWdub3JlIHRoaXMgZXZlbnRcblx0XHRpZiggdHlwZW9mIGNvbmZpZy5rZXlib2FyZENvbmRpdGlvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBjb25maWcua2V5Ym9hcmRDb25kaXRpb24oKSA9PT0gZmFsc2UgKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBSZW1lbWJlciBpZiBhdXRvLXNsaWRpbmcgd2FzIHBhdXNlZCBzbyB3ZSBjYW4gdG9nZ2xlIGl0XG5cdFx0dmFyIGF1dG9TbGlkZVdhc1BhdXNlZCA9IGF1dG9TbGlkZVBhdXNlZDtcblxuXHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlcmUncyBhIGZvY3VzZWQgZWxlbWVudCB0aGF0IGNvdWxkIGJlIHVzaW5nXG5cdFx0Ly8gdGhlIGtleWJvYXJkXG5cdFx0dmFyIGFjdGl2ZUVsZW1lbnRJc0NFID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSAhPT0gJ2luaGVyaXQnO1xuXHRcdHZhciBhY3RpdmVFbGVtZW50SXNJbnB1dCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lICYmIC9pbnB1dHx0ZXh0YXJlYS9pLnRlc3QoIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZSApO1xuXG5cdFx0Ly8gRGlzcmVnYXJkIHRoZSBldmVudCBpZiB0aGVyZSdzIGEgZm9jdXNlZCBlbGVtZW50IG9yIGFcblx0XHQvLyBrZXlib2FyZCBtb2RpZmllciBrZXkgaXMgcHJlc2VudFxuXHRcdGlmKCBhY3RpdmVFbGVtZW50SXNDRSB8fCBhY3RpdmVFbGVtZW50SXNJbnB1dCB8fCAoZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQua2V5Q29kZSAhPT0gMzIpIHx8IGV2ZW50LmFsdEtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXkgKSByZXR1cm47XG5cblx0XHQvLyBXaGlsZSBwYXVzZWQgb25seSBhbGxvdyBcInVucGF1c2luZ1wiIGtleWJvYXJkIGV2ZW50cyAoYiBhbmQgLilcblx0XHRpZiggaXNQYXVzZWQoKSAmJiBbNjYsMTkwLDE5MV0uaW5kZXhPZiggZXZlbnQua2V5Q29kZSApID09PSAtMSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR2YXIgdHJpZ2dlcmVkID0gZmFsc2U7XG5cblx0XHQvLyAxLiBVc2VyIGRlZmluZWQga2V5IGJpbmRpbmdzXG5cdFx0aWYoIHR5cGVvZiBjb25maWcua2V5Ym9hcmQgPT09ICdvYmplY3QnICkge1xuXG5cdFx0XHRmb3IoIHZhciBrZXkgaW4gY29uZmlnLmtleWJvYXJkICkge1xuXG5cdFx0XHRcdC8vIENoZWNrIGlmIHRoaXMgYmluZGluZyBtYXRjaGVzIHRoZSBwcmVzc2VkIGtleVxuXHRcdFx0XHRpZiggcGFyc2VJbnQoIGtleSwgMTAgKSA9PT0gZXZlbnQua2V5Q29kZSApIHtcblxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGNvbmZpZy5rZXlib2FyZFsga2V5IF07XG5cblx0XHRcdFx0XHQvLyBDYWxsYmFjayBmdW5jdGlvblxuXHRcdFx0XHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRcdFx0XHR2YWx1ZS5hcHBseSggbnVsbCwgWyBldmVudCBdICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIFN0cmluZyBzaG9ydGN1dHMgdG8gcmV2ZWFsLmpzIEFQSVxuXHRcdFx0XHRcdGVsc2UgaWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIFJldmVhbFsgdmFsdWUgXSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdFx0XHRcdFJldmVhbFsgdmFsdWUgXS5jYWxsKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHJpZ2dlcmVkID0gdHJ1ZTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdC8vIDIuIFN5c3RlbSBkZWZpbmVkIGtleSBiaW5kaW5nc1xuXHRcdGlmKCB0cmlnZ2VyZWQgPT09IGZhbHNlICkge1xuXG5cdFx0XHQvLyBBc3N1bWUgdHJ1ZSBhbmQgdHJ5IHRvIHByb3ZlIGZhbHNlXG5cdFx0XHR0cmlnZ2VyZWQgPSB0cnVlO1xuXG5cdFx0XHRzd2l0Y2goIGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHRcdC8vIHAsIHBhZ2UgdXBcblx0XHRcdFx0Y2FzZSA4MDogY2FzZSAzMzogbmF2aWdhdGVQcmV2KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBuLCBwYWdlIGRvd25cblx0XHRcdFx0Y2FzZSA3ODogY2FzZSAzNDogbmF2aWdhdGVOZXh0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBoLCBsZWZ0XG5cdFx0XHRcdGNhc2UgNzI6IGNhc2UgMzc6IG5hdmlnYXRlTGVmdCgpOyBicmVhaztcblx0XHRcdFx0Ly8gbCwgcmlnaHRcblx0XHRcdFx0Y2FzZSA3NjogY2FzZSAzOTogbmF2aWdhdGVSaWdodCgpOyBicmVhaztcblx0XHRcdFx0Ly8gaywgdXBcblx0XHRcdFx0Y2FzZSA3NTogY2FzZSAzODogbmF2aWdhdGVVcCgpOyBicmVhaztcblx0XHRcdFx0Ly8gaiwgZG93blxuXHRcdFx0XHRjYXNlIDc0OiBjYXNlIDQwOiBuYXZpZ2F0ZURvd24oKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGhvbWVcblx0XHRcdFx0Y2FzZSAzNjogc2xpZGUoIDAgKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGVuZFxuXHRcdFx0XHRjYXNlIDM1OiBzbGlkZSggTnVtYmVyLk1BWF9WQUxVRSApOyBicmVhaztcblx0XHRcdFx0Ly8gc3BhY2Vcblx0XHRcdFx0Y2FzZSAzMjogaXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiBldmVudC5zaGlmdEtleSA/IG5hdmlnYXRlUHJldigpIDogbmF2aWdhdGVOZXh0KCk7IGJyZWFrO1xuXHRcdFx0XHQvLyByZXR1cm5cblx0XHRcdFx0Y2FzZSAxMzogaXNPdmVydmlldygpID8gZGVhY3RpdmF0ZU92ZXJ2aWV3KCkgOiB0cmlnZ2VyZWQgPSBmYWxzZTsgYnJlYWs7XG5cdFx0XHRcdC8vIHR3by1zcG90LCBzZW1pY29sb24sIGIsIHBlcmlvZCwgTG9naXRlY2ggcHJlc2VudGVyIHRvb2xzIFwiYmxhY2sgc2NyZWVuXCIgYnV0dG9uXG5cdFx0XHRcdGNhc2UgNTg6IGNhc2UgNTk6IGNhc2UgNjY6IGNhc2UgMTkwOiBjYXNlIDE5MTogdG9nZ2xlUGF1c2UoKTsgYnJlYWs7XG5cdFx0XHRcdC8vIGZcblx0XHRcdFx0Y2FzZSA3MDogZW50ZXJGdWxsc2NyZWVuKCk7IGJyZWFrO1xuXHRcdFx0XHQvLyBhXG5cdFx0XHRcdGNhc2UgNjU6IGlmICggY29uZmlnLmF1dG9TbGlkZVN0b3BwYWJsZSApIHRvZ2dsZUF1dG9TbGlkZSggYXV0b1NsaWRlV2FzUGF1c2VkICk7IGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHRyaWdnZXJlZCA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIGlucHV0IHJlc3VsdGVkIGluIGEgdHJpZ2dlcmVkIGFjdGlvbiB3ZSBzaG91bGQgcHJldmVudFxuXHRcdC8vIHRoZSBicm93c2VycyBkZWZhdWx0IGJlaGF2aW9yXG5cdFx0aWYoIHRyaWdnZXJlZCApIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHRcdC8vIEVTQyBvciBPIGtleVxuXHRcdGVsc2UgaWYgKCAoIGV2ZW50LmtleUNvZGUgPT09IDI3IHx8IGV2ZW50LmtleUNvZGUgPT09IDc5ICkgJiYgZmVhdHVyZXMudHJhbnNmb3JtczNkICkge1xuXHRcdFx0aWYoIGRvbS5vdmVybGF5ICkge1xuXHRcdFx0XHRjbG9zZU92ZXJsYXkoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0b2dnbGVPdmVydmlldygpO1xuXHRcdFx0fVxuXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCAmJiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdC8vIElmIGF1dG8tc2xpZGluZyBpcyBlbmFibGVkIHdlIG5lZWQgdG8gY3VlIHVwXG5cdFx0Ly8gYW5vdGhlciB0aW1lb3V0XG5cdFx0Y3VlQXV0b1NsaWRlKCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVyIGZvciB0aGUgJ3RvdWNoc3RhcnQnIGV2ZW50LCBlbmFibGVzIHN1cHBvcnQgZm9yXG5cdCAqIHN3aXBlIGFuZCBwaW5jaCBnZXN0dXJlcy5cblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hTdGFydCggZXZlbnQgKSB7XG5cblx0XHR0b3VjaC5zdGFydFggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0dG91Y2guc3RhcnRZID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdHRvdWNoLnN0YXJ0Q291bnQgPSBldmVudC50b3VjaGVzLmxlbmd0aDtcblxuXHRcdC8vIElmIHRoZXJlJ3MgdHdvIHRvdWNoZXMgd2UgbmVlZCB0byBtZW1vcml6ZSB0aGUgZGlzdGFuY2Vcblx0XHQvLyBiZXR3ZWVuIHRob3NlIHR3byBwb2ludHMgdG8gZGV0ZWN0IHBpbmNoaW5nXG5cdFx0aWYoIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09PSAyICYmIGNvbmZpZy5vdmVydmlldyApIHtcblx0XHRcdHRvdWNoLnN0YXJ0U3BhbiA9IGRpc3RhbmNlQmV0d2Vlbigge1xuXHRcdFx0XHR4OiBldmVudC50b3VjaGVzWzFdLmNsaWVudFgsXG5cdFx0XHRcdHk6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WVxuXHRcdFx0fSwge1xuXHRcdFx0XHR4OiB0b3VjaC5zdGFydFgsXG5cdFx0XHRcdHk6IHRvdWNoLnN0YXJ0WVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2htb3ZlJyBldmVudC5cblx0ICovXG5cdGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKCBldmVudCApIHtcblxuXHRcdC8vIEVhY2ggdG91Y2ggc2hvdWxkIG9ubHkgdHJpZ2dlciBvbmUgYWN0aW9uXG5cdFx0aWYoICF0b3VjaC5jYXB0dXJlZCApIHtcblx0XHRcdG9uVXNlcklucHV0KCBldmVudCApO1xuXG5cdFx0XHR2YXIgY3VycmVudFggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHR2YXIgY3VycmVudFkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG5cblx0XHRcdC8vIElmIHRoZSB0b3VjaCBzdGFydGVkIHdpdGggdHdvIHBvaW50cyBhbmQgc3RpbGwgaGFzXG5cdFx0XHQvLyB0d28gYWN0aXZlIHRvdWNoZXM7IHRlc3QgZm9yIHRoZSBwaW5jaCBnZXN0dXJlXG5cdFx0XHRpZiggZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDIgJiYgdG91Y2guc3RhcnRDb3VudCA9PT0gMiAmJiBjb25maWcub3ZlcnZpZXcgKSB7XG5cblx0XHRcdFx0Ly8gVGhlIGN1cnJlbnQgZGlzdGFuY2UgaW4gcGl4ZWxzIGJldHdlZW4gdGhlIHR3byB0b3VjaCBwb2ludHNcblx0XHRcdFx0dmFyIGN1cnJlbnRTcGFuID0gZGlzdGFuY2VCZXR3ZWVuKCB7XG5cdFx0XHRcdFx0eDogZXZlbnQudG91Y2hlc1sxXS5jbGllbnRYLFxuXHRcdFx0XHRcdHk6IGV2ZW50LnRvdWNoZXNbMV0uY2xpZW50WVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0eDogdG91Y2guc3RhcnRYLFxuXHRcdFx0XHRcdHk6IHRvdWNoLnN0YXJ0WVxuXHRcdFx0XHR9ICk7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHNwYW4gaXMgbGFyZ2VyIHRoYW4gdGhlIGRlc2lyZSBhbW91bnQgd2UndmUgZ290XG5cdFx0XHRcdC8vIG91cnNlbHZlcyBhIHBpbmNoXG5cdFx0XHRcdGlmKCBNYXRoLmFicyggdG91Y2guc3RhcnRTcGFuIC0gY3VycmVudFNwYW4gKSA+IHRvdWNoLnRocmVzaG9sZCApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRpZiggY3VycmVudFNwYW4gPCB0b3VjaC5zdGFydFNwYW4gKSB7XG5cdFx0XHRcdFx0XHRhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGVhY3RpdmF0ZU92ZXJ2aWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0fVxuXHRcdFx0Ly8gVGhlcmUgd2FzIG9ubHkgb25lIHRvdWNoIHBvaW50LCBsb29rIGZvciBhIHN3aXBlXG5cdFx0XHRlbHNlIGlmKCBldmVudC50b3VjaGVzLmxlbmd0aCA9PT0gMSAmJiB0b3VjaC5zdGFydENvdW50ICE9PSAyICkge1xuXG5cdFx0XHRcdHZhciBkZWx0YVggPSBjdXJyZW50WCAtIHRvdWNoLnN0YXJ0WCxcblx0XHRcdFx0XHRkZWx0YVkgPSBjdXJyZW50WSAtIHRvdWNoLnN0YXJ0WTtcblxuXHRcdFx0XHRpZiggZGVsdGFYID4gdG91Y2gudGhyZXNob2xkICYmIE1hdGguYWJzKCBkZWx0YVggKSA+IE1hdGguYWJzKCBkZWx0YVkgKSApIHtcblx0XHRcdFx0XHR0b3VjaC5jYXB0dXJlZCA9IHRydWU7XG5cdFx0XHRcdFx0bmF2aWdhdGVMZWZ0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiggZGVsdGFYIDwgLXRvdWNoLnRocmVzaG9sZCAmJiBNYXRoLmFicyggZGVsdGFYICkgPiBNYXRoLmFicyggZGVsdGFZICkgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlUmlnaHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVkgPiB0b3VjaC50aHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0dG91Y2guY2FwdHVyZWQgPSB0cnVlO1xuXHRcdFx0XHRcdG5hdmlnYXRlVXAoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBkZWx0YVkgPCAtdG91Y2gudGhyZXNob2xkICkge1xuXHRcdFx0XHRcdHRvdWNoLmNhcHR1cmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRuYXZpZ2F0ZURvd24oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElmIHdlJ3JlIGVtYmVkZGVkLCBvbmx5IGJsb2NrIHRvdWNoIGV2ZW50cyBpZiB0aGV5IGhhdmVcblx0XHRcdFx0Ly8gdHJpZ2dlcmVkIGFuIGFjdGlvblxuXHRcdFx0XHRpZiggY29uZmlnLmVtYmVkZGVkICkge1xuXHRcdFx0XHRcdGlmKCB0b3VjaC5jYXB0dXJlZCB8fCBpc1ZlcnRpY2FsU2xpZGUoIGN1cnJlbnRTbGlkZSApICkge1xuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gTm90IGVtYmVkZGVkPyBCbG9jayB0aGVtIGFsbCB0byBhdm9pZCBuZWVkbGVzcyB0b3NzaW5nXG5cdFx0XHRcdC8vIGFyb3VuZCBvZiB0aGUgdmlld3BvcnQgaW4gaU9TXG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBUaGVyZSdzIGEgYnVnIHdpdGggc3dpcGluZyBvbiBzb21lIEFuZHJvaWQgZGV2aWNlcyB1bmxlc3Ncblx0XHQvLyB0aGUgZGVmYXVsdCBhY3Rpb24gaXMgYWx3YXlzIHByZXZlbnRlZFxuXHRcdGVsc2UgaWYoIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goIC9hbmRyb2lkL2dpICkgKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSAndG91Y2hlbmQnIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Ub3VjaEVuZCggZXZlbnQgKSB7XG5cblx0XHR0b3VjaC5jYXB0dXJlZCA9IGZhbHNlO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBwb2ludGVyIGRvd24gdG8gdG91Y2ggc3RhcnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBvblBvaW50ZXJEb3duKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5wb2ludGVyVHlwZSA9PT0gZXZlbnQuTVNQT0lOVEVSX1RZUEVfVE9VQ0ggfHwgZXZlbnQucG9pbnRlclR5cGUgPT09IFwidG91Y2hcIiApIHtcblx0XHRcdGV2ZW50LnRvdWNoZXMgPSBbeyBjbGllbnRYOiBldmVudC5jbGllbnRYLCBjbGllbnRZOiBldmVudC5jbGllbnRZIH1dO1xuXHRcdFx0b25Ub3VjaFN0YXJ0KCBldmVudCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnQgcG9pbnRlciBtb3ZlIHRvIHRvdWNoIG1vdmUuXG5cdCAqL1xuXHRmdW5jdGlvbiBvblBvaW50ZXJNb3ZlKCBldmVudCApIHtcblxuXHRcdGlmKCBldmVudC5wb2ludGVyVHlwZSA9PT0gZXZlbnQuTVNQT0lOVEVSX1RZUEVfVE9VQ0ggfHwgZXZlbnQucG9pbnRlclR5cGUgPT09IFwidG91Y2hcIiApICB7XG5cdFx0XHRldmVudC50b3VjaGVzID0gW3sgY2xpZW50WDogZXZlbnQuY2xpZW50WCwgY2xpZW50WTogZXZlbnQuY2xpZW50WSB9XTtcblx0XHRcdG9uVG91Y2hNb3ZlKCBldmVudCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnQgcG9pbnRlciB1cCB0byB0b3VjaCBlbmQuXG5cdCAqL1xuXHRmdW5jdGlvbiBvblBvaW50ZXJVcCggZXZlbnQgKSB7XG5cblx0XHRpZiggZXZlbnQucG9pbnRlclR5cGUgPT09IGV2ZW50Lk1TUE9JTlRFUl9UWVBFX1RPVUNIIHx8IGV2ZW50LnBvaW50ZXJUeXBlID09PSBcInRvdWNoXCIgKSAge1xuXHRcdFx0ZXZlbnQudG91Y2hlcyA9IFt7IGNsaWVudFg6IGV2ZW50LmNsaWVudFgsIGNsaWVudFk6IGV2ZW50LmNsaWVudFkgfV07XG5cdFx0XHRvblRvdWNoRW5kKCBldmVudCApO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgbW91c2Ugd2hlZWwgc2Nyb2xsaW5nLCB0aHJvdHRsZWQgdG8gYXZvaWQgc2tpcHBpbmdcblx0ICogbXVsdGlwbGUgc2xpZGVzLlxuXHQgKi9cblx0ZnVuY3Rpb24gb25Eb2N1bWVudE1vdXNlU2Nyb2xsKCBldmVudCApIHtcblxuXHRcdGlmKCBEYXRlLm5vdygpIC0gbGFzdE1vdXNlV2hlZWxTdGVwID4gNjAwICkge1xuXG5cdFx0XHRsYXN0TW91c2VXaGVlbFN0ZXAgPSBEYXRlLm5vdygpO1xuXG5cdFx0XHR2YXIgZGVsdGEgPSBldmVudC5kZXRhaWwgfHwgLWV2ZW50LndoZWVsRGVsdGE7XG5cdFx0XHRpZiggZGVsdGEgPiAwICkge1xuXHRcdFx0XHRuYXZpZ2F0ZU5leHQoKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuYXZpZ2F0ZVByZXYoKTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIENsaWNraW5nIG9uIHRoZSBwcm9ncmVzcyBiYXIgcmVzdWx0cyBpbiBhIG5hdmlnYXRpb24gdG8gdGhlXG5cdCAqIGNsb3Nlc3QgYXBwcm94aW1hdGUgaG9yaXpvbnRhbCBzbGlkZSB1c2luZyB0aGlzIGVxdWF0aW9uOlxuXHQgKlxuXHQgKiAoIGNsaWNrWCAvIHByZXNlbnRhdGlvbldpZHRoICkgKiBudW1iZXJPZlNsaWRlc1xuXHQgKi9cblx0ZnVuY3Rpb24gb25Qcm9ncmVzc0NsaWNrZWQoIGV2ZW50ICkge1xuXG5cdFx0b25Vc2VySW5wdXQoIGV2ZW50ICk7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dmFyIHNsaWRlc1RvdGFsID0gdG9BcnJheSggZG9tLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCggSE9SSVpPTlRBTF9TTElERVNfU0VMRUNUT1IgKSApLmxlbmd0aDtcblx0XHR2YXIgc2xpZGVJbmRleCA9IE1hdGguZmxvb3IoICggZXZlbnQuY2xpZW50WCAvIGRvbS53cmFwcGVyLm9mZnNldFdpZHRoICkgKiBzbGlkZXNUb3RhbCApO1xuXG5cdFx0c2xpZGUoIHNsaWRlSW5kZXggKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEV2ZW50IGhhbmRsZXIgZm9yIG5hdmlnYXRpb24gY29udHJvbCBidXR0b25zLlxuXHQgKi9cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZUxlZnRDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVMZWZ0KCk7IH1cblx0ZnVuY3Rpb24gb25OYXZpZ2F0ZVJpZ2h0Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlUmlnaHQoKTsgfVxuXHRmdW5jdGlvbiBvbk5hdmlnYXRlVXBDbGlja2VkKCBldmVudCApIHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgb25Vc2VySW5wdXQoKTsgbmF2aWdhdGVVcCgpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVEb3duQ2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlRG93bigpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVQcmV2Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlUHJldigpOyB9XG5cdGZ1bmN0aW9uIG9uTmF2aWdhdGVOZXh0Q2xpY2tlZCggZXZlbnQgKSB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IG9uVXNlcklucHV0KCk7IG5hdmlnYXRlTmV4dCgpOyB9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSB3aW5kb3cgbGV2ZWwgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25XaW5kb3dIYXNoQ2hhbmdlKCBldmVudCApIHtcblxuXHRcdHJlYWRVUkwoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXIgZm9yIHRoZSB3aW5kb3cgbGV2ZWwgJ3Jlc2l6ZScgZXZlbnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZSggZXZlbnQgKSB7XG5cblx0XHRsYXlvdXQoKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZSBmb3IgdGhlIHdpbmRvdyBsZXZlbCAndmlzaWJpbGl0eWNoYW5nZScgZXZlbnQuXG5cdCAqL1xuXHRmdW5jdGlvbiBvblBhZ2VWaXNpYmlsaXR5Q2hhbmdlKCBldmVudCApIHtcblxuXHRcdHZhciBpc0hpZGRlbiA9ICBkb2N1bWVudC53ZWJraXRIaWRkZW4gfHxcblx0XHRcdFx0XHRcdGRvY3VtZW50Lm1zSGlkZGVuIHx8XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5oaWRkZW47XG5cblx0XHQvLyBJZiwgYWZ0ZXIgY2xpY2tpbmcgYSBsaW5rIG9yIHNpbWlsYXIgYW5kIHdlJ3JlIGNvbWluZyBiYWNrLFxuXHRcdC8vIGZvY3VzIHRoZSBkb2N1bWVudC5ib2R5IHRvIGVuc3VyZSB3ZSBjYW4gdXNlIGtleWJvYXJkIHNob3J0Y3V0c1xuXHRcdGlmKCBpc0hpZGRlbiA9PT0gZmFsc2UgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSApIHtcblx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0ZG9jdW1lbnQuYm9keS5mb2N1cygpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEludm9rZWQgd2hlbiBhIHNsaWRlIGlzIGFuZCB3ZSdyZSBpbiB0aGUgb3ZlcnZpZXcuXG5cdCAqL1xuXHRmdW5jdGlvbiBvbk92ZXJ2aWV3U2xpZGVDbGlja2VkKCBldmVudCApIHtcblxuXHRcdC8vIFRPRE8gVGhlcmUncyBhIGJ1ZyBoZXJlIHdoZXJlIHRoZSBldmVudCBsaXN0ZW5lcnMgYXJlIG5vdFxuXHRcdC8vIHJlbW92ZWQgYWZ0ZXIgZGVhY3RpdmF0aW5nIHRoZSBvdmVydmlldy5cblx0XHRpZiggZXZlbnRzQXJlQm91bmQgJiYgaXNPdmVydmlldygpICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0dmFyIGVsZW1lbnQgPSBldmVudC50YXJnZXQ7XG5cblx0XHRcdHdoaWxlKCBlbGVtZW50ICYmICFlbGVtZW50Lm5vZGVOYW1lLm1hdGNoKCAvc2VjdGlvbi9naSApICkge1xuXHRcdFx0XHRlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiggZWxlbWVudCAmJiAhZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoICdkaXNhYmxlZCcgKSApIHtcblxuXHRcdFx0XHRkZWFjdGl2YXRlT3ZlcnZpZXcoKTtcblxuXHRcdFx0XHRpZiggZWxlbWVudC5ub2RlTmFtZS5tYXRjaCggL3NlY3Rpb24vZ2kgKSApIHtcblx0XHRcdFx0XHR2YXIgaCA9IHBhcnNlSW50KCBlbGVtZW50LmdldEF0dHJpYnV0ZSggJ2RhdGEtaW5kZXgtaCcgKSwgMTAgKSxcblx0XHRcdFx0XHRcdHYgPSBwYXJzZUludCggZWxlbWVudC5nZXRBdHRyaWJ1dGUoICdkYXRhLWluZGV4LXYnICksIDEwICk7XG5cblx0XHRcdFx0XHRzbGlkZSggaCwgdiApO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGNsaWNrcyBvbiBsaW5rcyB0aGF0IGFyZSBzZXQgdG8gcHJldmlldyBpbiB0aGVcblx0ICogaWZyYW1lIG92ZXJsYXkuXG5cdCAqL1xuXHRmdW5jdGlvbiBvblByZXZpZXdMaW5rQ2xpY2tlZCggZXZlbnQgKSB7XG5cblx0XHRpZiggZXZlbnQuY3VycmVudFRhcmdldCAmJiBldmVudC5jdXJyZW50VGFyZ2V0Lmhhc0F0dHJpYnV0ZSggJ2hyZWYnICkgKSB7XG5cdFx0XHR2YXIgdXJsID0gZXZlbnQuY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUoICdocmVmJyApO1xuXHRcdFx0aWYoIHVybCApIHtcblx0XHRcdFx0c2hvd1ByZXZpZXcoIHVybCApO1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgY2xpY2sgb24gdGhlIGF1dG8tc2xpZGluZyBjb250cm9scyBlbGVtZW50LlxuXHQgKi9cblx0ZnVuY3Rpb24gb25BdXRvU2xpZGVQbGF5ZXJDbGljayggZXZlbnQgKSB7XG5cblx0XHQvLyBSZXBsYXlcblx0XHRpZiggUmV2ZWFsLmlzTGFzdFNsaWRlKCkgJiYgY29uZmlnLmxvb3AgPT09IGZhbHNlICkge1xuXHRcdFx0c2xpZGUoIDAsIDAgKTtcblx0XHRcdHJlc3VtZUF1dG9TbGlkZSgpO1xuXHRcdH1cblx0XHQvLyBSZXN1bWVcblx0XHRlbHNlIGlmKCBhdXRvU2xpZGVQYXVzZWQgKSB7XG5cdFx0XHRyZXN1bWVBdXRvU2xpZGUoKTtcblx0XHR9XG5cdFx0Ly8gUGF1c2Vcblx0XHRlbHNlIHtcblx0XHRcdHBhdXNlQXV0b1NsaWRlKCk7XG5cdFx0fVxuXG5cdH1cblxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBMQVlCQUNLIENPTVBPTkVOVCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cblxuXHQvKipcblx0ICogQ29uc3RydWN0b3IgZm9yIHRoZSBwbGF5YmFjayBjb21wb25lbnQsIHdoaWNoIGRpc3BsYXlzXG5cdCAqIHBsYXkvcGF1c2UvcHJvZ3Jlc3MgY29udHJvbHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciBUaGUgY29tcG9uZW50IHdpbGwgYXBwZW5kXG5cdCAqIGl0c2VsZiB0byB0aGlzXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2dyZXNzQ2hlY2sgQSBtZXRob2Qgd2hpY2ggd2lsbCBiZVxuXHQgKiBjYWxsZWQgZnJlcXVlbnRseSB0byBnZXQgdGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb24gYSByYW5nZVxuXHQgKiBvZiAwLTFcblx0ICovXG5cdGZ1bmN0aW9uIFBsYXliYWNrKCBjb250YWluZXIsIHByb2dyZXNzQ2hlY2sgKSB7XG5cblx0XHQvLyBDb3NtZXRpY3Ncblx0XHR0aGlzLmRpYW1ldGVyID0gNTA7XG5cdFx0dGhpcy50aGlja25lc3MgPSAzO1xuXG5cdFx0Ly8gRmxhZ3MgaWYgd2UgYXJlIGN1cnJlbnRseSBwbGF5aW5nXG5cdFx0dGhpcy5wbGF5aW5nID0gZmFsc2U7XG5cblx0XHQvLyBDdXJyZW50IHByb2dyZXNzIG9uIGEgMC0xIHJhbmdlXG5cdFx0dGhpcy5wcm9ncmVzcyA9IDA7XG5cblx0XHQvLyBVc2VkIHRvIGxvb3AgdGhlIGFuaW1hdGlvbiBzbW9vdGhseVxuXHRcdHRoaXMucHJvZ3Jlc3NPZmZzZXQgPSAxO1xuXG5cdFx0dGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG5cdFx0dGhpcy5wcm9ncmVzc0NoZWNrID0gcHJvZ3Jlc3NDaGVjaztcblxuXHRcdHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcblx0XHR0aGlzLmNhbnZhcy5jbGFzc05hbWUgPSAncGxheWJhY2snO1xuXHRcdHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5kaWFtZXRlcjtcblx0XHR0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmRpYW1ldGVyO1xuXHRcdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoICcyZCcgKTtcblxuXHRcdHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKCB0aGlzLmNhbnZhcyApO1xuXG5cdFx0dGhpcy5yZW5kZXIoKTtcblxuXHR9XG5cblx0UGxheWJhY2sucHJvdG90eXBlLnNldFBsYXlpbmcgPSBmdW5jdGlvbiggdmFsdWUgKSB7XG5cblx0XHR2YXIgd2FzUGxheWluZyA9IHRoaXMucGxheWluZztcblxuXHRcdHRoaXMucGxheWluZyA9IHZhbHVlO1xuXG5cdFx0Ly8gU3RhcnQgcmVwYWludGluZyBpZiB3ZSB3ZXJlbid0IGFscmVhZHlcblx0XHRpZiggIXdhc1BsYXlpbmcgJiYgdGhpcy5wbGF5aW5nICkge1xuXHRcdFx0dGhpcy5hbmltYXRlKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9XG5cblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHByb2dyZXNzQmVmb3JlID0gdGhpcy5wcm9ncmVzcztcblxuXHRcdHRoaXMucHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzQ2hlY2soKTtcblxuXHRcdC8vIFdoZW4gd2UgbG9vcCwgb2Zmc2V0IHRoZSBwcm9ncmVzcyBzbyB0aGF0IGl0IGVhc2VzXG5cdFx0Ly8gc21vb3RobHkgcmF0aGVyIHRoYW4gaW1tZWRpYXRlbHkgcmVzZXR0aW5nXG5cdFx0aWYoIHByb2dyZXNzQmVmb3JlID4gMC44ICYmIHRoaXMucHJvZ3Jlc3MgPCAwLjIgKSB7XG5cdFx0XHR0aGlzLnByb2dyZXNzT2Zmc2V0ID0gdGhpcy5wcm9ncmVzcztcblx0XHR9XG5cblx0XHR0aGlzLnJlbmRlcigpO1xuXG5cdFx0aWYoIHRoaXMucGxheWluZyApIHtcblx0XHRcdGZlYXR1cmVzLnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZC5jYWxsKCB3aW5kb3csIHRoaXMuYW5pbWF0ZS5iaW5kKCB0aGlzICkgKTtcblx0XHR9XG5cblx0fTtcblxuXHQvKipcblx0ICogUmVuZGVycyB0aGUgY3VycmVudCBwcm9ncmVzcyBhbmQgcGxheWJhY2sgc3RhdGUuXG5cdCAqL1xuXHRQbGF5YmFjay5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgcHJvZ3Jlc3MgPSB0aGlzLnBsYXlpbmcgPyB0aGlzLnByb2dyZXNzIDogMCxcblx0XHRcdHJhZGl1cyA9ICggdGhpcy5kaWFtZXRlciAvIDIgKSAtIHRoaXMudGhpY2tuZXNzLFxuXHRcdFx0eCA9IHRoaXMuZGlhbWV0ZXIgLyAyLFxuXHRcdFx0eSA9IHRoaXMuZGlhbWV0ZXIgLyAyLFxuXHRcdFx0aWNvblNpemUgPSAxNDtcblxuXHRcdC8vIEVhc2UgdG93YXJkcyAxXG5cdFx0dGhpcy5wcm9ncmVzc09mZnNldCArPSAoIDEgLSB0aGlzLnByb2dyZXNzT2Zmc2V0ICkgKiAwLjE7XG5cblx0XHR2YXIgZW5kQW5nbGUgPSAoIC0gTWF0aC5QSSAvIDIgKSArICggcHJvZ3Jlc3MgKiAoIE1hdGguUEkgKiAyICkgKTtcblx0XHR2YXIgc3RhcnRBbmdsZSA9ICggLSBNYXRoLlBJIC8gMiApICsgKCB0aGlzLnByb2dyZXNzT2Zmc2V0ICogKCBNYXRoLlBJICogMiApICk7XG5cblx0XHR0aGlzLmNvbnRleHQuc2F2ZSgpO1xuXHRcdHRoaXMuY29udGV4dC5jbGVhclJlY3QoIDAsIDAsIHRoaXMuZGlhbWV0ZXIsIHRoaXMuZGlhbWV0ZXIgKTtcblxuXHRcdC8vIFNvbGlkIGJhY2tncm91bmQgY29sb3Jcblx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzICsgMiwgMCwgTWF0aC5QSSAqIDIsIGZhbHNlICk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKCAwLCAwLCAwLCAwLjQgKSc7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGwoKTtcblxuXHRcdC8vIERyYXcgcHJvZ3Jlc3MgdHJhY2tcblx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzLCAwLCBNYXRoLlBJICogMiwgZmFsc2UgKTtcblx0XHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy50aGlja25lc3M7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gJyM2NjYnO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblxuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHQvLyBEcmF3IHByb2dyZXNzIG9uIHRvcCBvZiB0cmFja1xuXHRcdFx0dGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdFx0dGhpcy5jb250ZXh0LmFyYyggeCwgeSwgcmFkaXVzLCBzdGFydEFuZ2xlLCBlbmRBbmdsZSwgZmFsc2UgKTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB0aGlzLnRoaWNrbmVzcztcblx0XHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblx0XHR9XG5cblx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKCB4IC0gKCBpY29uU2l6ZSAvIDIgKSwgeSAtICggaWNvblNpemUgLyAyICkgKTtcblxuXHRcdC8vIERyYXcgcGxheS9wYXVzZSBpY29uc1xuXHRcdGlmKCB0aGlzLnBsYXlpbmcgKSB7XG5cdFx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJyNmZmYnO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KCAwLCAwLCBpY29uU2l6ZSAvIDIgLSAyLCBpY29uU2l6ZSApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KCBpY29uU2l6ZSAvIDIgKyAyLCAwLCBpY29uU2l6ZSAvIDIgLSAyLCBpY29uU2l6ZSApO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUoIDIsIDAgKTtcblx0XHRcdHRoaXMuY29udGV4dC5tb3ZlVG8oIDAsIDAgKTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lVG8oIGljb25TaXplIC0gMiwgaWNvblNpemUgLyAyICk7XG5cdFx0XHR0aGlzLmNvbnRleHQubGluZVRvKCAwLCBpY29uU2l6ZSApO1xuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmJztcblx0XHRcdHRoaXMuY29udGV4dC5maWxsKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZXh0LnJlc3RvcmUoKTtcblxuXHR9O1xuXG5cdFBsYXliYWNrLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCB0eXBlLCBsaXN0ZW5lciApIHtcblx0XHR0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UgKTtcblx0fTtcblxuXHRQbGF5YmFjay5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyICkge1xuXHRcdHRoaXMuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSApO1xuXHR9O1xuXG5cdFBsYXliYWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cblx0XHR0aGlzLnBsYXlpbmcgPSBmYWxzZTtcblxuXHRcdGlmKCB0aGlzLmNhbnZhcy5wYXJlbnROb2RlICkge1xuXHRcdFx0dGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQoIHRoaXMuY2FudmFzICk7XG5cdFx0fVxuXG5cdH07XG5cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xuXG5cblx0UmV2ZWFsID0ge1xuXHRcdGluaXRpYWxpemU6IGluaXRpYWxpemUsXG5cdFx0Y29uZmlndXJlOiBjb25maWd1cmUsXG5cdFx0c3luYzogc3luYyxcblxuXHRcdC8vIE5hdmlnYXRpb24gbWV0aG9kc1xuXHRcdHNsaWRlOiBzbGlkZSxcblx0XHRsZWZ0OiBuYXZpZ2F0ZUxlZnQsXG5cdFx0cmlnaHQ6IG5hdmlnYXRlUmlnaHQsXG5cdFx0dXA6IG5hdmlnYXRlVXAsXG5cdFx0ZG93bjogbmF2aWdhdGVEb3duLFxuXHRcdHByZXY6IG5hdmlnYXRlUHJldixcblx0XHRuZXh0OiBuYXZpZ2F0ZU5leHQsXG5cblx0XHQvLyBGcmFnbWVudCBtZXRob2RzXG5cdFx0bmF2aWdhdGVGcmFnbWVudDogbmF2aWdhdGVGcmFnbWVudCxcblx0XHRwcmV2RnJhZ21lbnQ6IHByZXZpb3VzRnJhZ21lbnQsXG5cdFx0bmV4dEZyYWdtZW50OiBuZXh0RnJhZ21lbnQsXG5cblx0XHQvLyBEZXByZWNhdGVkIGFsaWFzZXNcblx0XHRuYXZpZ2F0ZVRvOiBzbGlkZSxcblx0XHRuYXZpZ2F0ZUxlZnQ6IG5hdmlnYXRlTGVmdCxcblx0XHRuYXZpZ2F0ZVJpZ2h0OiBuYXZpZ2F0ZVJpZ2h0LFxuXHRcdG5hdmlnYXRlVXA6IG5hdmlnYXRlVXAsXG5cdFx0bmF2aWdhdGVEb3duOiBuYXZpZ2F0ZURvd24sXG5cdFx0bmF2aWdhdGVQcmV2OiBuYXZpZ2F0ZVByZXYsXG5cdFx0bmF2aWdhdGVOZXh0OiBuYXZpZ2F0ZU5leHQsXG5cblx0XHQvLyBGb3JjZXMgYW4gdXBkYXRlIGluIHNsaWRlIGxheW91dFxuXHRcdGxheW91dDogbGF5b3V0LFxuXG5cdFx0Ly8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgYXZhaWxhYmxlIHJvdXRlcyBhcyBib29sZWFucyAobGVmdC9yaWdodC90b3AvYm90dG9tKVxuXHRcdGF2YWlsYWJsZVJvdXRlczogYXZhaWxhYmxlUm91dGVzLFxuXG5cdFx0Ly8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgYXZhaWxhYmxlIGZyYWdtZW50cyBhcyBib29sZWFucyAocHJldi9uZXh0KVxuXHRcdGF2YWlsYWJsZUZyYWdtZW50czogYXZhaWxhYmxlRnJhZ21lbnRzLFxuXG5cdFx0Ly8gVG9nZ2xlcyB0aGUgb3ZlcnZpZXcgbW9kZSBvbi9vZmZcblx0XHR0b2dnbGVPdmVydmlldzogdG9nZ2xlT3ZlcnZpZXcsXG5cblx0XHQvLyBUb2dnbGVzIHRoZSBcImJsYWNrIHNjcmVlblwiIG1vZGUgb24vb2ZmXG5cdFx0dG9nZ2xlUGF1c2U6IHRvZ2dsZVBhdXNlLFxuXG5cdFx0Ly8gVG9nZ2xlcyB0aGUgYXV0byBzbGlkZSBtb2RlIG9uL29mZlxuXHRcdHRvZ2dsZUF1dG9TbGlkZTogdG9nZ2xlQXV0b1NsaWRlLFxuXG5cdFx0Ly8gU3RhdGUgY2hlY2tzXG5cdFx0aXNPdmVydmlldzogaXNPdmVydmlldyxcblx0XHRpc1BhdXNlZDogaXNQYXVzZWQsXG5cdFx0aXNBdXRvU2xpZGluZzogaXNBdXRvU2xpZGluZyxcblxuXHRcdC8vIEFkZHMgb3IgcmVtb3ZlcyBhbGwgaW50ZXJuYWwgZXZlbnQgbGlzdGVuZXJzIChzdWNoIGFzIGtleWJvYXJkKVxuXHRcdGFkZEV2ZW50TGlzdGVuZXJzOiBhZGRFdmVudExpc3RlbmVycyxcblx0XHRyZW1vdmVFdmVudExpc3RlbmVyczogcmVtb3ZlRXZlbnRMaXN0ZW5lcnMsXG5cblx0XHQvLyBGYWNpbGl0eSBmb3IgcGVyc2lzdGluZyBhbmQgcmVzdG9yaW5nIHRoZSBwcmVzZW50YXRpb24gc3RhdGVcblx0XHRnZXRTdGF0ZTogZ2V0U3RhdGUsXG5cdFx0c2V0U3RhdGU6IHNldFN0YXRlLFxuXG5cdFx0Ly8gUHJlc2VudGF0aW9uIHByb2dyZXNzIG9uIHJhbmdlIG9mIDAtMVxuXHRcdGdldFByb2dyZXNzOiBnZXRQcm9ncmVzcyxcblxuXHRcdC8vIFJldHVybnMgdGhlIGluZGljZXMgb2YgdGhlIGN1cnJlbnQsIG9yIHNwZWNpZmllZCwgc2xpZGVcblx0XHRnZXRJbmRpY2VzOiBnZXRJbmRpY2VzLFxuXG5cdFx0Z2V0VG90YWxTbGlkZXM6IGdldFRvdGFsU2xpZGVzLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgc2xpZGUgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4XG5cdFx0Z2V0U2xpZGU6IGdldFNsaWRlLFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgc2xpZGUgYmFja2dyb3VuZCBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcblx0XHRnZXRTbGlkZUJhY2tncm91bmQ6IGdldFNsaWRlQmFja2dyb3VuZCxcblxuXHRcdC8vIFJldHVybnMgdGhlIHByZXZpb3VzIHNsaWRlIGVsZW1lbnQsIG1heSBiZSBudWxsXG5cdFx0Z2V0UHJldmlvdXNTbGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gcHJldmlvdXNTbGlkZTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0aGUgY3VycmVudCBzbGlkZSBlbGVtZW50XG5cdFx0Z2V0Q3VycmVudFNsaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBjdXJyZW50U2xpZGU7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdGhlIGN1cnJlbnQgc2NhbGUgb2YgdGhlIHByZXNlbnRhdGlvbiBjb250ZW50XG5cdFx0Z2V0U2NhbGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHNjYWxlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG5cdFx0Z2V0Q29uZmlnOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBjb25maWc7XG5cdFx0fSxcblxuXHRcdC8vIEhlbHBlciBtZXRob2QsIHJldHJpZXZlcyBxdWVyeSBzdHJpbmcgYXMgYSBrZXkvdmFsdWUgaGFzaFxuXHRcdGdldFF1ZXJ5SGFzaDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcXVlcnkgPSB7fTtcblxuXHRcdFx0bG9jYXRpb24uc2VhcmNoLnJlcGxhY2UoIC9bQS1aMC05XSs/PShbXFx3XFwuJS1dKikvZ2ksIGZ1bmN0aW9uKGEpIHtcblx0XHRcdFx0cXVlcnlbIGEuc3BsaXQoICc9JyApLnNoaWZ0KCkgXSA9IGEuc3BsaXQoICc9JyApLnBvcCgpO1xuXHRcdFx0fSApO1xuXG5cdFx0XHQvLyBCYXNpYyBkZXNlcmlhbGl6YXRpb25cblx0XHRcdGZvciggdmFyIGkgaW4gcXVlcnkgKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IHF1ZXJ5WyBpIF07XG5cblx0XHRcdFx0cXVlcnlbIGkgXSA9IGRlc2VyaWFsaXplKCB1bmVzY2FwZSggdmFsdWUgKSApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcXVlcnk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSdyZSBjdXJyZW50bHkgb24gdGhlIGZpcnN0IHNsaWRlXG5cdFx0aXNGaXJzdFNsaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiAoIGluZGV4aCA9PT0gMCAmJiBpbmRleHYgPT09IDAgKTtcblx0XHR9LFxuXG5cdFx0Ly8gUmV0dXJucyB0cnVlIGlmIHdlJ3JlIGN1cnJlbnRseSBvbiB0aGUgbGFzdCBzbGlkZVxuXHRcdGlzTGFzdFNsaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmKCBjdXJyZW50U2xpZGUgKSB7XG5cdFx0XHRcdC8vIERvZXMgdGhpcyBzbGlkZSBoYXMgbmV4dCBhIHNpYmxpbmc/XG5cdFx0XHRcdGlmKCBjdXJyZW50U2xpZGUubmV4dEVsZW1lbnRTaWJsaW5nICkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0XHRcdC8vIElmIGl0J3MgdmVydGljYWwsIGRvZXMgaXRzIHBhcmVudCBoYXZlIGEgbmV4dCBzaWJsaW5nP1xuXHRcdFx0XHRpZiggaXNWZXJ0aWNhbFNsaWRlKCBjdXJyZW50U2xpZGUgKSAmJiBjdXJyZW50U2xpZGUucGFyZW50Tm9kZS5uZXh0RWxlbWVudFNpYmxpbmcgKSByZXR1cm4gZmFsc2U7XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LFxuXG5cdFx0Ly8gQ2hlY2tzIGlmIHJldmVhbC5qcyBoYXMgYmVlbiBsb2FkZWQgYW5kIGlzIHJlYWR5IGZvciB1c2Vcblx0XHRpc1JlYWR5OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBsb2FkZWQ7XG5cdFx0fSxcblxuXHRcdC8vIEZvcndhcmQgZXZlbnQgYmluZGluZyB0byB0aGUgcmV2ZWFsIERPTSBlbGVtZW50XG5cdFx0YWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlICkge1xuXHRcdFx0aWYoICdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cgKSB7XG5cdFx0XHRcdCggZG9tLndyYXBwZXIgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwnICkgKS5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24oIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlICkge1xuXHRcdFx0aWYoICdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cgKSB7XG5cdFx0XHRcdCggZG9tLndyYXBwZXIgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJy5yZXZlYWwnICkgKS5yZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBQcm9ncmFtYXRpY2FsbHkgdHJpZ2dlcnMgYSBrZXlib2FyZCBldmVudFxuXHRcdHRyaWdnZXJLZXk6IGZ1bmN0aW9uKCBrZXlDb2RlICkge1xuXHRcdFx0b25Eb2N1bWVudEtleURvd24oIHsga2V5Q29kZToga2V5Q29kZSB9ICk7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBSZXZlYWw7XG5cbn0pKTtcbiJdfQ==
