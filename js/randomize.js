module.exports = function randomizeCards( el ){
  var slides       = el.childNodes;

  Array.prototype.forEach.call( slides, function( slide ){
    el.removeChild( slide );
  } );

  var slidesArray = Array.prototype.slice.call( slides, 0 );
  var newSlides   = slidesArray.sort( function(){ 
    return 0.5 - Math.random() 
  });

  Array.prototype.forEach.call( newSlides, function( slide ){
    el.appendChild( slide );
  } );
}
