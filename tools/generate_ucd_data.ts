/**
 * File: tools/generate_ucd_data.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:12:24 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// this implementation is originally from https://github.com/foliojs/unicode-properties
// I just translate the code to typescript and made some modifications.


import fs from 'fs';
import path from 'path';

import { UCDParser } from './ucd_builder';
import { UnicodeTrieBuilder } from '../src/unicode_trie_builder';

let log2 = Math.log2 || ((n: number) => Math.log(n) / Math.LN2);
let bits = (n: number) => (log2(n) + 1) | 0;

function numericValue(numeric: string) {
  if (numeric) {
    // console.log(numeric);
    let exp, m, mant: number;
    if (m = numeric.match(/^(\-?\d+)\/(\d+)$/)) {
      // fraction
      let num = parseInt(m[1]);
      let den = parseInt(m[2]);
      // FIXME: (billbai) cannot encode denominator greater than 16...
      // console.log('fraction ', num, '/', den);
      // if (den > 16 && (den % 10 === 0)) {
      //     den /= 10;
      // }
      let r = ((num + 12) << 4) + (den - 1);
      // console.log(r);
      return r;
    } else if (/^\d0+$/.test(numeric)) {
      // base 10
      mant = parseInt(numeric[0]);
      exp = numeric.length - 1;
      return ((mant + 14) << 5) + (exp - 1);
    } else {
      const val = parseInt(numeric);
      if (val <= 50) {
        return 1 + val;
      } else {
        /// base 60
        mant = val;
        exp = 0;
        while ((mant % 60) === 0) {
          mant /= 60;
          ++exp;
        }

        return ((mant + 0xbf) << 2) + (exp - 1);
      }
    }

  } else {
    return 0;
  }
}

function main() {
  // categories: Object.keys(categories),
  // combiningClasses: Object.keys(combiningClasses),
  // scripts: Object.keys(scripts),
  // eastAsiaWidths: Object.keys(eastAsiaWidths)
  const manifest = {
    version: process.env.npm_package_version,
    prop_data_list: {
      "common_prop": {
        data: "common_prop.trie",
        meta: "common_prop.json",
        props: ["categories", "combiningClasses", "scripts", "eastAsiaWidths"]
      },
      "line_break": {
        data: "line_break.trie",
        meta: "line_break.json",
        props: ["line_break"]
      },
      "grapheme_break": {
        data: "grapheme_break.trie",
        meta: "grapheme_break.json",
        props: ["grapheme_break"]
      },
      "word_break": {
        data: "word_break.trie",
        meta: "word_break.json",
        props: ["word_break"]
      },
      "sentence_break": {
        data: "sentence_break.trie",
        meta: "sentence_break.json",
        props: ["sentence_break"]
      }
    }
  };


  const ucdDirPath = path.join(__dirname, '..', '..', 'data', 'UCD_11_0');
  console.log('begin parsing ', ucdDirPath);
  let parser = new UCDParser(ucdDirPath);
  const codePoints = Array.from(parser.codePoints);

  //  collect property class and counts

  // common props
  const categories: { [key: string]: number } = {};
  const combiningClasses: { [key: string]: number } = {};
  const scripts: { [key: string]: number } = {};
  const eastAsiaWidths: { [key: string]: number } = {};

  let categoryCount = 0;
  let combiningClassCount = 0;
  let scriptCount = 0;
  let eastAsiaWidthCount = 0;

  // bidi props
  const bidiClasses: { [key: string]: number } = {};
  let bidiClassCount = 0;

  const bidiBrackTypes: { [key: string]: number } = {};
  let bidiBrackTypeCount = 0;

  const lineBreakProps: { [key: string]: number } = { 'XX': 0 };
  let lineBreakPropsCount = 1;
  const graphemeBreakProps: { [key: string]: number } = { 'Other': 0 };
  let graphemeBreakPropsCount = 1;
  const wordBreakProps: { [key: string]: number } = {};
  let wordBreakPropsCount = 0;
  const sentenceBreakProps: { [key: string]: number } = {};
  let sentenceBreakPropsCount = 0;

  const codePointCount = codePoints.length;
  console.log('total unicode code points ', codePointCount);
  for (let i = 0; i < codePointCount; i++) {
    let cp = codePoints[i];
    if (cp) {
      if (cp.category !== undefined && categories[cp.category] === undefined) {
        categories[cp.category] = categoryCount++;
      }

      if (cp.combinningClassName !== undefined
        && combiningClasses[cp.combinningClassName] === undefined) {
        combiningClasses[cp.combinningClassName] = combiningClassCount++;
      }

      if (cp.script !== undefined && scripts[cp.script] === undefined) {
        scripts[cp.script] = scriptCount++;
      }

      if (cp.eastAsianWidth !== undefined && eastAsiaWidths[cp.eastAsianWidth] === undefined) {
        eastAsiaWidths[cp.eastAsianWidth] = eastAsiaWidthCount++;
      }

      if (cp.bidiClass !== undefined && bidiClasses[cp.bidiClass] === undefined) {
        bidiClasses[cp.bidiClass] = bidiClassCount++;
      }

      if (cp.bidiPairedBracketType && bidiBrackTypes[cp.bidiPairedBracketType] === undefined) {
        bidiBrackTypes[cp.bidiPairedBracketType] = bidiBrackTypeCount++;
      }

      if (cp.lineBreak && lineBreakProps[cp.lineBreak] === undefined) {
        lineBreakProps[cp.lineBreak] = lineBreakPropsCount++;
      }

      if (cp.graphemeBreak && graphemeBreakProps[cp.graphemeBreak] === undefined) {
        graphemeBreakProps[cp.graphemeBreak] = graphemeBreakPropsCount++;
      }

      if (cp.wordBreak && wordBreakProps[cp.wordBreak] === undefined) {
        wordBreakProps[cp.wordBreak] = wordBreakPropsCount++;
      }

      if (cp.sentenceBreak && sentenceBreakProps[cp.sentenceBreak] === undefined) {
        sentenceBreakProps[cp.sentenceBreak] = sentenceBreakPropsCount++;
      }
    }
  }

  console.log('collected classes');
  console.log('categories', categories);
  console.log('combiningClasses', combiningClasses);
  console.log('scripts', scripts);
  console.log('eastAsiaWidths', eastAsiaWidths);
  console.log('bidiClasses', bidiClasses);
  console.log('bidiBracketTypes', bidiBrackTypes);
  console.log('line breaks', lineBreakProps);
  console.log('word breaks', wordBreakProps);
  console.log('grapheme breaks', graphemeBreakProps);
  console.log('sentence breaks', sentenceBreakProps);

  const numberBits = 10;
  const categoryBits = bits(categoryCount - 1);
  const combiningClassBits = bits(combiningClassCount - 1);
  const scriptBits = bits(scriptCount - 1);
  const eastAsiaBits = bits(eastAsiaWidthCount - 1);

  const categoryShift = combiningClassBits + scriptBits + eastAsiaBits + numberBits;
  const combiningShift = scriptBits + eastAsiaBits + numberBits;
  const scriptShift = eastAsiaBits + numberBits;
  const eastAsiaShift = numberBits;

  console.log(
    'common props bits: ', 'number bits', numberBits,
    'cat bits', categoryBits, 'combining class bits', combiningClassBits,
    'scripts bits', scriptBits, 'east asia bits', eastAsiaBits);
  //

  let commonPropsTrie = new UnicodeTrieBuilder();
  codePoints.forEach((cp) => {
    if (cp) {
      const category = categories[cp.category];
      const combiningClass = combiningClasses[cp.combinningClassName] || 0;
      const script = scripts[cp.script] || 0;
      const eastAsiaWidth = eastAsiaWidths[cp.eastAsianWidth] || 0;
      const num = numericValue(cp.numeric);

      const val =
        (category << categoryShift)
        | (combiningClass << combiningShift)
        | (script << scriptShift)
        | (eastAsiaWidth << eastAsiaShift)
        | (num);

      commonPropsTrie.set(cp.code, val);
    }
  });

  fs.writeFileSync('./common_props.trie', commonPropsTrie.tobuffer());
  fs.writeFileSync('./common_props.json', JSON.stringify({
    categories: Object.keys(categories),
    combiningClasses: Object.keys(combiningClasses),
    scripts: Object.keys(scripts),
    eastAsiaWidths: Object.keys(eastAsiaWidths)
  }));
  console.log('finish common props');

  const bidiClassBits = bits(bidiClassCount - 1);
  const bidiMirroredBits = 1;

  const bidiClassShift = bidiMirroredBits;

  console.log('bidi class bits', bidiClassBits);

  let bidiPropsTrie = new UnicodeTrieBuilder();
  codePoints.forEach((cp) => {
    if (cp) {
      const bidiClass = bidiClasses[cp.bidiClass];
      const bidiMirrored = cp.bidiMirrored ? 1 : 0;
      const val = (bidiClass << bidiClassShift) | (bidiMirrored);
      bidiPropsTrie.set(cp.code, val);
    }
  });

  fs.writeFileSync('./bidi_props.trie', bidiPropsTrie.tobuffer());
  fs.writeFileSync('./bidi_props.json', JSON.stringify({
    bidiClasses: bidiClasses,
    bidiMirrored: [false, true] // 0 for not mirrored, 1 for mirrored
  }));
  console.log('finish bidi props');

  const bidiBracketTypeBits = bits(bidiBrackTypeCount - 1);
  const bidiBracketShift = bidiBracketTypeBits;

  console.log('bidi bracket type bits', bidiBracketTypeBits);
  let bidiBracketTrie = new UnicodeTrieBuilder();

  codePoints.forEach((cp) => {
    if (cp && cp.bidiPairedBracketType !== undefined) {
      const bidiBracketType = bidiBrackTypes[cp.bidiPairedBracketType];
      const bidiBracket = cp.bidiPairedBracket;
      const val = (bidiBracket << bidiBracketShift) | (bidiBracketType);
      bidiBracketTrie.set(cp.code, val);
    }
  });

  fs.writeFileSync('./bidi_paired_bracket.trie', bidiBracketTrie.tobuffer());
  fs.writeFileSync('./bidi_paired_bracket.json', JSON.stringify(
    bidiBrackTypes,
  ));
  console.log('finish bidi paired bracket');


  const graphemeBreakBits = bits(graphemeBreakPropsCount - 1);
  const wordBreakBits = bits(wordBreakPropsCount - 1);
  const sentenceBreakBits = bits(sentenceBreakPropsCount - 1);
  const lineBreakBits = bits(lineBreakPropsCount - 1);

  console.log('grapheme break bits', graphemeBreakBits);
  console.log('word break bits', wordBreakBits);
  console.log('sentence break bits', sentenceBreakBits);
  console.log('line break bits', lineBreakBits);

  let graphemeBreakTrie = new UnicodeTrieBuilder();
  codePoints.forEach((cp) => {
    if (cp && cp.graphemeBreak !== undefined) {
      const val = graphemeBreakProps[cp.graphemeBreak];
      graphemeBreakTrie.set(cp.code, val);
    }
  });

  fs.writeFileSync('./grapheme_break.trie', graphemeBreakTrie.tobuffer());
  fs.writeFileSync('./grapheme_break.json', JSON.stringify(
    graphemeBreakProps,
  ));
  console.log('finish grapheme break bracket');


  let wordBreakTrie = new UnicodeTrieBuilder();
  codePoints.forEach((cp) => {
    if (cp && cp.wordBreak !== undefined) {
      const val = wordBreakProps[cp.wordBreak];
      wordBreakTrie.set(cp.code, val);
    }
  });

  fs.writeFileSync('./word_break.trie', wordBreakTrie.tobuffer());
  fs.writeFileSync('./word_break.json', JSON.stringify(
    wordBreakProps,
  ));
  console.log('finish word break bracket');


  let sentenceBreakTrie = new UnicodeTrieBuilder();
  codePoints.forEach((cp) => {
    if (cp && cp.sentenceBreak !== undefined) {
      const val = sentenceBreakProps[cp.sentenceBreak];
      sentenceBreakTrie.set(cp.code, val);
    }
  });

  fs.writeFileSync('./sentence_break.trie', sentenceBreakTrie.tobuffer());
  fs.writeFileSync('./sentence_break.json', JSON.stringify(
    sentenceBreakProps,
  ));
  console.log('finish sentence break bracket');

  let lineBreakTrie = new UnicodeTrieBuilder(0);
  codePoints.forEach((cp) => {
    if (cp) {
      if (cp.lineBreak !== undefined) {
        const val = lineBreakProps[cp.lineBreak];
        lineBreakTrie.set(cp.code, val);
      } else {
        lineBreakTrie.set(cp.code, lineBreakProps['XX']);
      }
    }
  });

  fs.writeFileSync('./line_break.trie', lineBreakTrie.tobuffer());
  fs.writeFileSync('./line_break.json', JSON.stringify(
    lineBreakProps,
  ));
  console.log('finish line break bracket');


  const isEmojiShift = 0;
  const isEmojiPresentationShift = 1;
  const isEmojiModifierShift = 2;
  const isEmojiModifierBaseShift = 3;
  const isEmojiComponentShift = 4;
  const isExtPictographicShift = 5;
  let emojiDataTrie = new UnicodeTrieBuilder(0);
  codePoints.forEach((cp) => {
    if (cp) {
      if (cp.isEmoji) {
        const emojiBit = cp.isEmoji ? 1 : 0;
        const emojiPresentationBit = cp.isEmojiPresentation ? 1 : 0;
        const emojiModifierBit = cp.isEmojiModifier ? 1 : 0;
        const emojiModifierBaseBit = cp.isEmojiModifierBase ? 1 : 0;
        const emojiComponentBit = cp.isEmojiComponent ? 1 : 0;
        const extPictographicBit = cp.isExtPictographic ? 1 : 0;
        const val = (extPictographicBit << isExtPictographicShift)
          | (emojiComponentBit << isEmojiComponentShift)
          | (emojiModifierBaseBit << isEmojiModifierBaseShift)
          | (emojiModifierBit << isEmojiModifierShift)
          | (emojiPresentationBit << isEmojiPresentationShift)
          | (emojiBit);
        emojiDataTrie.set(cp.code, val);
      } else {
        const extPictographicBit = cp.isExtPictographic ? 1 : 0;
        const emojiComponentBit = cp.isEmojiComponent ? 1 : 0;
        const val =
          (extPictographicBit << isExtPictographicShift)
          | (emojiComponentBit << isEmojiComponentShift);
        emojiDataTrie.set(cp.code, val);
      }
    }
  });

  fs.writeFileSync('./emoji_data.trie', emojiDataTrie.tobuffer());
  fs.writeFileSync('./emoji_data.json', JSON.stringify(
    {
      isEmojiShift,
      isEmojiPresentationShift,
      isEmojiModifierShift,
      isEmojiModifierBaseShift,
      isEmojiComponentShift,
      isExtPictographicShift
    }
  ));
  console.log('finish emoji data');

  fs.writeFileSync('./manifest.json', JSON.stringify(manifest));

  console.log('done');
}

main();
