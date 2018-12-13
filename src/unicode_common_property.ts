/**
 * File: src/unicode_common_property.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:08:35 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// this implementation is originally from https://github.com/foliojs/unicode-properties/blob/master/index.js
// I just translate to typescript.

const fs = require('fs');
import { UnicodeTrie } from './unicode_trie';

const commonPropsTrie = new UnicodeTrie(
  fs.readFileSync(__dirname + '/ucd/common_props.trie')
);
const commonPropsMeta = JSON.parse(
  fs.readFileSync(__dirname + '/ucd/common_props.json', 'ascii')
);

const log2 = Math.log2 || ((n: number) => Math.log(n) / Math.LN2);
const bits = (n: number) => (log2(n) + 1) | 0;

// compute the number of bits stored for each field
const CATEGORY_BITS = bits(commonPropsMeta.categories.length - 1);
const COMBINING_BITS = bits(commonPropsMeta.combiningClasses.length - 1);
const SCRIPT_BITS = bits(commonPropsMeta.scripts.length - 1);
const EAW_BITS = bits(commonPropsMeta.eastAsiaWidths.length - 1);
const NUMBER_BITS = 10;

// compute shift and mask values for each field
const CATEGORY_SHIFT = COMBINING_BITS + SCRIPT_BITS + EAW_BITS + NUMBER_BITS;
const COMBINING_SHIFT = SCRIPT_BITS + EAW_BITS + NUMBER_BITS;
const SCRIPT_SHIFT = EAW_BITS + NUMBER_BITS;
const EAW_SHIFT = NUMBER_BITS;

const CATEGORY_MASK = (1 << CATEGORY_BITS) - 1;
const COMBINING_MASK = (1 << COMBINING_BITS) - 1;
const SCRIPT_MASK = (1 << SCRIPT_BITS) - 1;
const EAW_MASK = (1 << EAW_BITS) - 1;
const NUMBER_MASK = (1 << NUMBER_BITS) - 1;

export const getCategory = (codePoint: number) => {
  const val = commonPropsTrie.get(codePoint);
  return commonPropsMeta.categories[(val >> CATEGORY_SHIFT) & CATEGORY_MASK];
};

export const getCombiningClass = (codePoint: number) => {
  const val = commonPropsTrie.get(codePoint);
  return commonPropsMeta.combiningClasses[
    (val >> COMBINING_SHIFT) & COMBINING_MASK
  ];
};

export const getScript = (codePoint: number) => {
  const val = commonPropsTrie.get(codePoint);
  return commonPropsMeta.scripts[(val >> SCRIPT_SHIFT) & SCRIPT_MASK];
};

export const getEastAsianWidth = (codePoint: number) => {
  const val = commonPropsTrie.get(codePoint);
  return commonPropsMeta.eastAsiaWidths[(val >> EAW_SHIFT) & EAW_MASK];
};

export const getNumericValue = (codePoint: number) => {
  let val = commonPropsTrie.get(codePoint);
  let num = val & NUMBER_MASK;

  if (num === 0) {
    return null;
  } else if (num <= 50) {
    return num - 1;
  } else if (num < 0x1e0) {
    let numerator = (num >> 4) - 12;
    let denominator = (num & 0xf) + 1;
    // FIXME: (billbai) cannot encode denominator greater than 16
    return numerator / denominator;
  } else if (num < 0x300) {
    val = (num >> 5) - 14;
    let exp = (num & 0x1f) + 1;

    while (exp > 0) {
      val *= 10;
      exp--;
    }
    return val;
  } else {
    val = (num >> 2) - 0xbf;
    let exp = (num & 3) + 1;
    while (exp > 0) {
      val *= 60;
      exp--;
    }
    return val;
  }
};

export const isAlphabetic = (codePoint: number) => {
  const category = getCategory(codePoint);
  return (
    category === 'Lu' ||
    category === 'Ll' ||
    category === 'Lt' ||
    category === 'Lm' ||
    category === 'Lo' ||
    category === 'Nl'
  );
};

export const isDigit = (codePoint: number) => getCategory(codePoint) === 'Nd';

export const isPunctuation = (codePoint: number) => {
  const category = getCategory(codePoint);
  return (
    category === 'Pc' ||
    category === 'Pd' ||
    category === 'Pe' ||
    category === 'Pf' ||
    category === 'Pi' ||
    category === 'Po' ||
    category === 'Ps'
  );
};

export const isLowerCase = (codePoint: number) => {
  return getCategory(codePoint) === 'Ll';
};

export const isUpperCase = (codePoint: number) =>
  getCategory(codePoint) === 'Lu';

export const isTitleCase = (codePoint: number) =>
  getCategory(codePoint) === 'Lt';

export const isWhiteSpace = (codePoint: number) => {
  const category = getCategory(codePoint);
  return category === 'Zs' || category === 'Zl' || category === 'Zp';
};

export const isBaseForm = (codePoint: number) => {
  const category = getCategory(codePoint);
  return (
    category === 'Nd' ||
    category === 'No' ||
    category === 'Nl' ||
    category === 'Lu' ||
    category === 'Ll' ||
    category === 'Lt' ||
    category === 'Lm' ||
    category === 'Lo' ||
    category === 'Me' ||
    category === 'Mc'
  );
};

export const isMark = (codePoint: number) => {
  const category = getCategory(codePoint);
  return category === 'Mn' || category === 'Me' || category === 'Mc';
};

export default {
  getCategory,
  getCombiningClass,
  getScript,
  getEastAsianWidth,
  getNumericValue,
  isAlphabetic,
  isDigit,
  isPunctuation,
  isLowerCase,
  isUpperCase,
  isTitleCase,
  isWhiteSpace,
  isBaseForm,
  isMark
};
