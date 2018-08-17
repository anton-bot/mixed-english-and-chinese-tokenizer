
# Mixed English and Chinese Tokenizer #

Tokenizes sentences containing a mix of Chinese and English words.

Optionally, lemmatizes English words. English contractions such as "don't" are
always changed to full forms such as "do not".

Supports Cantonese / Taiwanese / Mandarin. Defaults to producing output in
Traditional Chinese (see `options` below).

## Important ##

In order for this to work, you need the CEDICT dictionary. [Search for "cedict_ts.u8"](https://duckduckgo.com/?q="cedict_ts.u8"),
download the file and place it into the root folder of your Node.js application.

## Example ##

```js
const MEACT = require('mixed-english-and-chinese-tokenizer');

let m = new MEACT();

(async() => {
	console.log(
		/* Produces ['hello', 'what', 'is', 'up', '边度', '有', '柜员机', '呀']: */
		await m.tokenize(`hello, what's up, 邊度有櫃員機呀?`),

		/* Produces ['hello', 'what', 'be', 'up', '边度', '有', '柜员机', '呀']: */
		await m.tokenize(`hello, what's up, 邊度有櫃員機呀?`),
	);

	m = null; // free up memory occupied by CEDICT
})();

```

## Methods ##

### async tokenize(text) ### 

Returns an array of tokens from string. Punctuation is excluded.

```js

let m = new MEACT();

let tokens = await m.tokenize('I am here'); // ['I', 'am', 'here'];

```

### async lemmatize(text) ###

The same as `tokenize()`, except that English words are converted into lemmas.

For example, 'doing' will be changed to 'do'.

```js

let m = new MEACT();

let tokens = await m.lemmatize('I am here'); // ['I', 'be', 'here'];

```

## Options ##

The constructor takes an optional `options` object. 

- `options.simplified` - Boolean. Whether to use Simplified Chinese. Default is
`false` and all output is forced to Traditional Chinese, even if it is in
Simplified Chinese.
- `options.lemmaCache` - Object. An object storing the cache of all English lemmas.
Lemmatizing an English word is computationally expensive (50-400 ms). For that
reason, you may want to use an object that will cache the lemmas. You could store
that object globally or save it to disk. The code would look roughly like this:

```js
let lemmaCache = readLemmaCacheFromDisk(); // assume you stored it somewhere

const m = new MEACT({ lemmaCache });
let lemmatized = m.lemmatize(text);

// lemmaCache has been updated with new lemmas, save it to disk. Next time the
// same sentence will be lemmatized much faster.
saveLemmaCacheToDisk(lemmaCache);
```
