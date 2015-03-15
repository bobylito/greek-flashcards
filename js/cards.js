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
  transition: 'slide', // none/fade/slide/convex/concave/zoom
});
