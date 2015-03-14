// Randomize slides
var slidesParent = document.querySelector( ".slides" );
var slides       = document.querySelectorAll( ".slides > section" );

Array.prototype.forEach.call( slides, function( slide ){
  slidesParent.removeChild( slide );
} );

var slidesArray = Array.prototype.slice.call( slides, 0 );
var newSlides   = slidesArray.sort( function(){ 
  return 0.5 - Math.random() 
});

Array.prototype.forEach.call( newSlides, function( slide ){
  slidesParent.appendChild( slide );
} );

// Full list of configuration options available at:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
  controls: true,
  progress: true,
  history: true,
  center: true,

  transition: 'slide', // none/fade/slide/convex/concave/zoom

  // Optional reveal.js plugins
  dependencies: [
    { src: 'lib/js/classList.js', condition: function() { return !document.body.classList; } },
    { src: 'plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
    { src: 'plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
    { src: 'plugin/highlight/highlight.js', async: true, condition: function() { return !!document.querySelector( 'pre code' ); }, callback: function() { hljs.initHighlightingOnLoad(); } },
    { src: 'plugin/zoom-js/zoom.js', async: true },
    { src: 'plugin/notes/notes.js', async: true }
  ]
});