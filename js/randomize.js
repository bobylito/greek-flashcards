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
