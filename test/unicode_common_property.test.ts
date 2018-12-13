/**
 * File: test/unicode_common_property.test.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:11:01 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// the test are originally from
// https://github.com/foliojs/unicode-properties/blob/master/test/test.js

import * as unicode from '../src/unicode_common_property';

describe('unicode common props', () => {
  it('getCategory', () => {
    expect(unicode.getCategory('2'.codePointAt(0))).toEqual('Nd');
    expect(unicode.getCategory('x'.codePointAt(0))).toEqual('Ll');
  });

  it('getCombiningClass', () => {
    expect(unicode.getCombiningClass('x'.codePointAt(0))).toEqual(
      'Not_Reordered'
    );
    expect(unicode.getCombiningClass('́'.codePointAt(0))).toEqual('Above');
    expect(unicode.getCombiningClass('ٕ'.codePointAt(0))).toEqual('Below');
    expect(unicode.getCombiningClass('ٔ'.codePointAt(0))).toEqual('Above');
  });

  it('getScript', () => {
    expect(unicode.getScript('x'.codePointAt(0))).toEqual('Latin');
    expect(unicode.getScript('غ'.codePointAt(0))).toEqual('Arabic');
  });

  it('getEastAsianWidth', () => {
    expect(unicode.getEastAsianWidth('x'.codePointAt(0))).toEqual('Na');
    expect(unicode.getEastAsianWidth('杜'.codePointAt(0))).toEqual('W');
    expect(unicode.getEastAsianWidth('Æ'.codePointAt(0))).toEqual('A');
  });

  it('getNumericValue', () => {
    expect(unicode.getNumericValue('零'.codePointAt(0))).toEqual(0);
    expect(unicode.getNumericValue('⅓'.codePointAt(0))).toBeCloseTo(
      0.3333333333333333,
      7
    );
    expect(unicode.getNumericValue('༳'.codePointAt(0))).toEqual(-0.5);
    expect(unicode.getNumericValue('୵'.codePointAt(0))).toEqual(0.0625);
    expect(unicode.getNumericValue('৵'.codePointAt(0))).toEqual(0.125);
    // TODO: (billbai) cannot encode denominator greater than 16.
    // need fix to pass these tests.
    // expect(unicode.getNumericValue('൘'.codePointAt(0))).toEqual(0.00625);
    // expect(unicode.getNumericValue('൙'.codePointAt(0))).toEqual(0.025);
    // expect(unicode.getNumericValue('൚'.codePointAt(0))).toEqual(0.0375);
    // expect(unicode.getNumericValue('൛'.codePointAt(0))).toEqual(0.05);
    // expect(unicode.getNumericValue('൚'.codePointAt(0))).toEqual(0.0375);
    expect(unicode.getNumericValue('拾'.codePointAt(0))).toEqual(10);
    expect(unicode.getNumericValue('Ⅺ'.codePointAt(0))).toEqual(11);
    expect(unicode.getNumericValue('㉝'.codePointAt(0))).toEqual(33);
    expect(unicode.getNumericValue('፸'.codePointAt(0))).toEqual(70);
    expect(unicode.getNumericValue('2'.codePointAt(0))).toEqual(2);
    expect(unicode.getNumericValue('㊷'.codePointAt(0))).toEqual(42);
    expect(unicode.getNumericValue('𒐳'.codePointAt(0))).toEqual(432000);
    expect(unicode.getNumericValue('亿'.codePointAt(0))).toEqual(100000000);
    expect(unicode.getNumericValue('x'.codePointAt(0))).toEqual(null);
  });

  it('isAlphabetic', () => {
    expect(unicode.isAlphabetic('x'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isAlphabetic('2'.codePointAt(0))).toBeTruthy();
  });

  it('isDigit', () => {
    expect(!unicode.isDigit('x'.codePointAt(0))).toBeTruthy();
    expect(unicode.isDigit('2'.codePointAt(0))).toBeTruthy();
  });

  it('isPunctuation', () => {
    expect(!unicode.isPunctuation('x'.codePointAt(0))).toBeTruthy();
    expect(unicode.isPunctuation('.'.codePointAt(0))).toBeTruthy();
  });

  it('isLowerCase', () => {
    expect(!unicode.isLowerCase('X'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isLowerCase('2'.codePointAt(0))).toBeTruthy();
    expect(unicode.isLowerCase('x'.codePointAt(0))).toBeTruthy();
  });

  it('isUpperCase', () => {
    expect(unicode.isUpperCase('X'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isUpperCase('2'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isUpperCase('x'.codePointAt(0))).toBeTruthy();
  });

  it('isTitleCase', () => {
    expect(unicode.isTitleCase('ǲ'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isTitleCase('2'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isTitleCase('x'.codePointAt(0))).toBeTruthy();
  });

  it('isWhiteSpace', () => {
    expect(unicode.isWhiteSpace(' '.codePointAt(0))).toBeTruthy();
    expect(!unicode.isWhiteSpace('2'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isWhiteSpace('x'.codePointAt(0))).toBeTruthy();
  });

  it('isBaseForm', () => {
    expect(unicode.isBaseForm('2'.codePointAt(0))).toBeTruthy();
    expect(unicode.isBaseForm('x'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isBaseForm('́'.codePointAt(0))).toBeTruthy();
  });

  it('isMark', () => {
    expect(!unicode.isMark('2'.codePointAt(0))).toBeTruthy();
    expect(!unicode.isMark('x'.codePointAt(0))).toBeTruthy();
    expect(unicode.isMark('́'.codePointAt(0))).toBeTruthy();
  });
});
