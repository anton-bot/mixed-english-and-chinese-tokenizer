/**
 * @fileoverview Tokenizes sentences that contain a mix of Chinese and
 * English word.
 */

'use strict';

const chineseTokenizer = require('chinese-tokenizer').loadFile('./cedict_ts.u8');
const containsChinese = require('contains-chinese');
const contractions = require('expand-contractions');
const Lemmer = require('lemmer');

// Anything which is not a digit or a non-word character, but include diacritics
// because we want to match words like café:
const ENGLISH_MONOGRAM_MATCHING_REGEX = /([^\d\W]|[À-ž])+/gi;
const ENGLISH_OR_CHINESE_REGEX =
  new RegExp(containsChinese.HAN_REGEX.source + '+|' + ENGLISH_MONOGRAM_MATCHING_REGEX.source, 'gi');

class MixedTokenizer {
  /**
   * Creates a new lemmatizer instance.
   * @param {object} [options]
   * @param {object} [options.lemmaCache] - A cache of lemmatized words that
   * can prevent us from running the CPU-consuming lemmatizer. The cache is
   * a simple JS object where each key is the word and each value is its lemma,
   * e.g. { "was": "be", "goes": "go" }. It may make sense to save the lemma
   * cache on disk between your calls. It will be modified with the new words,
   * if any, that are found in `text`.
   * @param {boolean} [simplified] - Normalize output to Simplified Chinese
   * (default is normalize to Traditional Chinese).
   */
  constructor(options) {
    options = options || {};
    this.lemmaCache = options.lemmaCache || null;
    this.useSimplified = options.simplified || false;
  }

  async tokenize(text) {
    if (typeof text !== 'string') {
      return [];
    }

    text = contractions.expand(text);

    let split = await this._splitSentence(text);

    if (containsChinese(text)) {
      let results = [];
      for (let section of split) {
        if (containsChinese(section)) {
          // This is a continuous Chinese character string, may contain
          // multiple words:
          let chineseTokens = await this._extractChineseTokens(section);
          results.push(...chineseTokens);
        } else {
          // This is just an English word:
          results.push(section);
        }
      }
      return results;
    } else {
      return split;
    }
  }

  async lemmatize(text) {
    if (typeof text !== 'string') {
      return [];
    }

    let tokens = await this.tokenize(text);
    let lemmatizedMonograms = [];

    if (containsChinese(text)) {
      for (let token of tokens) {
        if (containsChinese(token)) {
          lemmatizedMonograms.push(token);
        } else {
          lemmatizedMonograms.push(...await this._lemmatizeSingleToken(token));
        }
      }
    } else {
      for (let token of tokens) {
        lemmatizedMonograms.push(...await this._lemmatizeSingleToken(token));
      }
    }

    return lemmatizedMonograms;
  }

  /**
   * Lemmatizes a single token. Returns an array of one item (because Lemmer does).
   * @param {string} token
   * @returns {string[]}
   */
  async _lemmatizeSingleToken(token) {
    if (this.lemmaCache) {
      if (this.lemmaCache[token]) {
        return [this.lemmaCache[token]];
      } else {
        return await Lemmer.lemmatize([token]);
      }
    } else {
      return await Lemmer.lemmatize([token]);
    }
  }

  async _splitSentence(text) {
    return text.match(ENGLISH_OR_CHINESE_REGEX) || [];
  }

  async _extractChineseTokens(section) {
    return chineseTokenizer(section)
      .map(entry => this.useSimplified ? entry.simplified : entry.traditional);
  }
}

module.exports = MixedTokenizer;