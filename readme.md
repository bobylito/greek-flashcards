Greek flashcards
================

What do you when you are a programmer doing web stuff for a living and you
want to learn a new language. You make flashcards in the most nerdy way possible.

This project is the result of such habit :D

Tools
-----

- [Jekyll](http://jekyllrb.com/): easy input of the words and the translations and translation in html
- [Reveal.js](https://github.com/hakimel/reveal.js) : slides for the web
- [cordova](http://cordova.apache.org/) : transform a web app into an app for smartphone or else

Usage
-----

### Web page

Install jekyll.rb on your computer (in most OS `sudo gem install jekyll` should
be enough).

Run jekyll : `jekyll server` and then check http://localhost:4000

### Android app

You need to have the android sdk properly installed with ant and java too.

Then you need to install the dependencies : `npm install`

To deploy you just need to do `npm run deploy`

Edit the cards
--------------

Edit `_data/flashcards.yml` and follow the already created cards. You can add
more items in sublists also, to add examples or more translations.
