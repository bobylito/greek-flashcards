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
