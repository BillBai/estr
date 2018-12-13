/**
 * File: src/grapheme_breaker.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:08:02 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// This implementation is originall from
// https://github.com/foliojs/grapheme-breaker/blob/master/src/GraphemeBreaker.coffee
// and https://github.com/orling/grapheme-splitter/blob/master/index.js
// I just translate to typescript and add some modifications.

const fs = require('fs');

import { codePointAt } from './util';
import { UnicodeTrie } from './unicode_trie';
import * as EmojiData from './unicode_emoji_data';
import * as graphemeClassMeta from './ucd/grapheme_break.json';

let graphemeClass: { [key: string]: number } = graphemeClassMeta;
const {
  // tslint:disable-next-line no-unused-variable
  Other,
  Control,
  LF,
  CR,
  Extend,
  Prepend,
  SpacingMark,
  L,
  V,
  T,
  ZWJ,
  LV,
  LVT,
  Regional_Indicator
} = graphemeClass;

const graphemeBreakTrie = new UnicodeTrie(
  fs.readFileSync(__dirname + '/ucd/grapheme_break.trie')
);

// prop: [GBC: number, isExtPictographic: boolean]
function shouldBreak(
  headProps: [number, boolean][],
  previousProp: [number, boolean],
  currentProp: [number, boolean]
): boolean {
  let previous = previousProp[0];
  let current = currentProp[0];

  // GB3.CR X LF
  if (previous === CR && current === LF) {
    return false;
  }
  // GB4. (Control | CR | LF) ÷
  else if (previous === Control || previous === CR || previous === LF) {
    return true;
  }
  // GB5. (Control | CR | LF)
  else if (current === Control || current === CR || current === LF) {
    return true;
  }
  // GB6.L X(L | V | LV | LVT)
  else if (
    previous === L &&
    (current === L || current === V || current === LV || current === LVT)
  ) {
    return false;
  }
  // GB7. (LV | V) X(V | T)
  else if (
    (previous === LV || previous === V) &&
    (current === V || current === T)
  ) {
    return false;
  }
  // GB8. (LVT | T) X(T)
  else if ((previous === LVT || previous === T) && current === T) {
    return false;
  }
  // GB 9
  else if (current === Extend || current === ZWJ) {
    return false;
  }
  // GB9a.X SpacingMark
  else if (current === SpacingMark) {
    return false;
  }
  // GB9b.Prepend X(there are currently no characters with th=== class)
  else if (previous === Prepend) {
    return false;
  }
  // GB 11 \p{Extended_Pictographic} Extend* ZWJ	×	\p{Extended_Pictographic}
  else if (previous === ZWJ && currentProp[1]) {
    const headLength = headProps.length;
    let extCount = 0;
    let lastIsExtPicto = false;
    for (let i = headLength - 1; i >= 0; i--) {
      let prop = headProps[i];
      if (prop[0] !== Extend) {
        lastIsExtPicto = prop[1];
        break;
      } else {
        extCount += 1;
      }
    }

    if (extCount >= 0 && lastIsExtPicto) {
      return false;
    } else {
      return true;
    }
  }
  // GB 12 / 13
  else if (current === Regional_Indicator && previous === Regional_Indicator) {
    const headLength = headProps.length;
    let riCount = 0;
    for (let i = headLength - 1; i >= 0; i--) {
      let prop = headProps[i];
      if (prop[0] === Regional_Indicator) {
        riCount += 1;
      } else {
        break;
      }
    }

    if (riCount % 2 === 0) {
      return false;
    } else {
      // don't break is there is an odd number of RI before break point
      return true;
    }
  }
  // GB999.Any ÷ Any
  return true;
}

/**
 * find next grapheme point index (char code index) after idx (idx itself is not included)
 * @param str
 * @param idx
 */
export function nextBreak(str: string, idx: number = 0) {
  if (idx < 0) {
    return 0;
  }

  if (idx >= str.length - 1) {
    return str.length;
  }

  let headProps: [number, boolean][] = [];
  let cp = codePointAt(str, idx);
  let prevGBC = graphemeBreakTrie.get(cp);
  let prevIsExtPicto = EmojiData.isExtPictographic(cp);
  for (let i = idx + 1; i < str.length; i++) {
    if (
      str.charCodeAt(i - 1) <= 0xdbff &&
      str.charCodeAt(i - 1) >= 0xd800 &&
      (str.charCodeAt(i) <= 0xdfff && str.charCodeAt(i) >= 0xdc00)
    ) {
      continue;
    }

    let cp = codePointAt(str, i);
    let nextGBC = graphemeBreakTrie.get(cp);
    let nextIsExtPicto = EmojiData.isExtPictographic(cp);
    if (
      shouldBreak(
        headProps,
        [prevGBC, prevIsExtPicto],
        [nextGBC, nextIsExtPicto]
      )
    ) {
      return i;
    }
    headProps.push([prevGBC, prevIsExtPicto]);
    prevGBC = nextGBC;
    prevIsExtPicto = nextIsExtPicto;
  }

  return str.length;
}

/**
 * find previous grapheme break point (char code index) before idx (idx itself is not included)
 * @param str
 * @param idx
 */
export function previousBreak(str: string, idx: number = 0) {
  if (idx > str.length) {
    return str.length;
  }

  if (idx <= 1) {
    return 0;
  }

  // TODO: (billbai) clean up this shitty code.

  let lastCodePoint = codePointAt(str, idx - 1);
  let lastGBC = graphemeBreakTrie.get(lastCodePoint);
  let lastIsExtPicto = EmojiData.isExtPictographic(lastCodePoint);

  const maxPreProb = 16;
  let headProps: [number, boolean][] = [];

  let preProbEnd = idx - maxPreProb;
  if (preProbEnd < 0) {
    preProbEnd = 0;
  }
  for (let i = preProbEnd; i < idx; i++) {
    if (
      i > 0 &&
      (str.charCodeAt(i - 1) <= 0xdbff && str.charCodeAt(i - 1) >= 0xd800) &&
      (str.charCodeAt(i) <= 0xdfff && str.charCodeAt(i) >= 0xdc00)
    ) {
      continue;
    }

    let cp = codePointAt(str, i);
    let GBC = graphemeBreakTrie.get(cp);
    let isExtPicto = EmojiData.isExtPictographic(cp);
    headProps.push([GBC, isExtPicto]);
  }
  headProps.pop();
  headProps.pop();

  idx -= 1;
  let cp = lastCodePoint;
  let nextGBC = lastGBC;
  let nextIsExtPicto = lastIsExtPicto;
  for (let i = idx - 1; i >= 0; i--) {
    if (
      str.charCodeAt(i) <= 0xdbff &&
      str.charCodeAt(i) >= 0xd800 &&
      (str.charCodeAt(i + 1) <= 0xdfff && str.charCodeAt(i + 1) >= 0xdc00)
    ) {
      continue;
    }
    cp = codePointAt(str, i);
    let prevGBC = graphemeBreakTrie.get(cp);
    let prevIsExtPicto = EmojiData.isExtPictographic(cp);
    if (
      shouldBreak(
        headProps,
        [prevGBC, prevIsExtPicto],
        [nextGBC, nextIsExtPicto]
      )
    ) {
      return i + 1;
    }
    nextGBC = prevGBC;
    nextIsExtPicto = prevIsExtPicto;
    headProps.pop();
  }

  return 0;
}

/**
 * split the str into grapheme clusters
 * @param str
 * @return an array of string, each string represents a grapheme cluester
 */
export function breakByGrapheme(str: string) {
  let r: string[] = [];
  let index = 0;

  let brk = nextBreak(str, index);

  while (brk < str.length) {
    r.push(str.slice(index, brk));
    index = brk;
    brk = nextBreak(str, index);
  }

  if (index < str.length) {
    r.push(str.slice(index));
  }

  return r;
}

/**
 * count the graphemes
 * @param str
 */
export function graphemeCount(str: string) {
  let count = 0;
  let index = 0;

  let brk = nextBreak(str, index);
  while (brk < str.length) {
    index = brk;
    count++;
    brk = nextBreak(str, index);
  }

  if (index < str.length) {
    count += 1;
  }

  return count;
}
