var Reveal = require( "reveal.js" );
var MButton = require( "mobile-button" );
var persistence = require( "./persistence" );
var randomizeCards = require( "./randomize" );

// Randomize slides
var slidesParent = randomizeCards( document.querySelector( ".slides" ) );

new MButton.Touchend( {
  el : document.querySelector( ".validate-card" ),
  f : function(){
    Reveal.right();
  }
} );

new MButton.Touchend( {
  el : document.querySelector( ".show-hints" ),
  f : function(){
    Reveal.down();
  }
} );

Reveal.addEventListener( "slidechanged", function( e ){
  var indexV = e.indexv;
  if( indexV === 0 ){
    var card = e.currentSlide.dataset.card;
    persistence.addSeenCard( card );
  }
} );


// Full list of configuration options available at:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
  controls: false,
  progress: true,
  history: true,
  center: true,
  transition: 'slide', // none/fade/slide/convex/concave/zoom
});
