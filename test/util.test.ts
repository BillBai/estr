/**
 * File: test/util.test.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:12:10 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

import * as util from '../src/util';

describe('util tests', () => {
  it('convert to code points', () => {
    let strNormal = 'abcdefg甲乙丙丁';
    expect(util.toCodePoints(strNormal))
      .toEqual([97, 98, 99, 100, 101, 102, 103, 30002, 20057, 19993, 19969]);
    let strSurrogatePair = 'The quick brown 🦊 jumps over 13 lazy 🐶.';
    expect(util.toCodePoints(strSurrogatePair))
      .toEqual([84, 104, 101, 32, 113, 117, 105, 99, 107, 32, 98, 114, 111, 119, 110, 32, 129418, 32, 106, 117, 109, 112, 115, 32, 111, 118, 101, 114, 32, 49, 51, 32, 108, 97, 122, 121, 32, 128054, 46]);

    let strSurrgateHigh = `asdasd\u{d801}\u{d803}asdasd`;
    expect(util.toCodePoints(strSurrgateHigh))
      .toEqual([97, 115, 100, 97, 115, 100, 0xd801, 0xd803, 97, 115, 100, 97, 115, 100]);

    let strSurrgateLow = `asdasd\u{dc00}\u{dfff}asdasd`;
    expect(util.toCodePoints(strSurrgateLow))
      .toEqual([97, 115, 100, 97, 115, 100, 0xdc00, 0xdfff, 97, 115, 100, 97, 115, 100]);

    let strSurrgateWrongOrder = `asdasd\u{dc00}\u{d800}asdasd`;
    expect(util.toCodePoints(strSurrgateWrongOrder))
      .toEqual([97, 115, 100, 97, 115, 100, 0xdc00, 0xd800, 97, 115, 100, 97, 115, 100]);
  });

  it('get code point from char code', () => {
    let strNormal = 'abcdefg甲乙丙丁';
    expect(util.codePointAt(strNormal, 2))
      .toEqual(99);

    let strSurrogatePair = 'The quick brown 🦊 jumps over 13 lazy 🐶.';
    expect(util.codePointAt(strSurrogatePair, 16))
      .toEqual(129418);
    expect(util.codePointAt(strSurrogatePair, 17))
      .toEqual(129418);

    let strSurrgateHigh = `asdasd\u{d801}\u{d803}asdasd`;
    expect(util.codePointAt(strSurrgateHigh, 6))
      .toEqual(0xd801);
    expect(util.codePointAt(strSurrgateHigh, 7))
      .toEqual(0xd803);

    let strSurrgateLow = `asdasd\u{dc00}\u{dfff}asdasd`;
    expect(util.codePointAt(strSurrgateLow, 6))
      .toEqual(0xdc00);
    expect(util.codePointAt(strSurrgateLow, 7))
      .toEqual(0xdfff);

    let strSurrgateWrongOrder = `asdasd\u{dc00}\u{d800}asdasd`;
    expect(util.codePointAt(strSurrgateWrongOrder, 6))
      .toEqual(0xdc00);
    expect(util.codePointAt(strSurrgateWrongOrder, 7))
      .toEqual(0xd800);

  });

  it('convert code points array to string', () => {
    let strNormal = 'abcdefg甲乙丙丁';
    expect(util.fromCodePoints(...[97, 98, 99, 100, 101, 102, 103, 30002, 20057, 19993, 19969]))
      .toEqual(strNormal);
    let strSurrogatePair = 'The quick brown 🦊 jumps over 13 lazy 🐶.';
    expect(util.fromCodePoints(...[84, 104, 101, 32, 113, 117, 105, 99, 107, 32, 98, 114, 111, 119, 110, 32, 129418, 32, 106, 117, 109, 112, 115, 32, 111, 118, 101, 114, 32, 49, 51, 32, 108, 97, 122, 121, 32, 128054, 46]))
      .toEqual(strSurrogatePair);

    let strSurrgateHigh = `asdasd\u{d801}\u{d803}asdasd`;
    expect(util.fromCodePoints(...[97, 115, 100, 97, 115, 100, 0xd801, 0xd803, 97, 115, 100, 97, 115, 100]))
      .toEqual(strSurrgateHigh);

    let strSurrgateLow = `asdasd\u{dc00}\u{dfff}asdasd`;
    expect(util.fromCodePoints(...[97, 115, 100, 97, 115, 100, 0xdc00, 0xdfff, 97, 115, 100, 97, 115, 100]))
      .toEqual(strSurrgateLow);

    let strSurrgateWrongOrder = `asdasd\u{dc00}\u{d800}asdasd`;
    expect(util.fromCodePoints(...[97, 115, 100, 97, 115, 100, 0xdc00, 0xd800, 97, 115, 100, 97, 115, 100]))
      .toEqual(strSurrgateWrongOrder);

    expect(util.fromCodePoints(...[])).toEqual('');
  });

  it('convert code points array to string with polyfill', () => {
    delete String.fromCodePoint;

    let strNormal = 'abcdefg甲乙丙丁';
    expect(util.fromCodePoints(...[97, 98, 99, 100, 101, 102, 103, 30002, 20057, 19993, 19969]))
      .toEqual(strNormal);
    let strSurrogatePair = 'The quick brown 🦊 jumps over 13 lazy 🐶.';
    expect(util.fromCodePoints(...[84, 104, 101, 32, 113, 117, 105, 99, 107, 32, 98, 114, 111, 119, 110, 32, 129418, 32, 106, 117, 109, 112, 115, 32, 111, 118, 101, 114, 32, 49, 51, 32, 108, 97, 122, 121, 32, 128054, 46]))
      .toEqual(strSurrogatePair);

    let strSurrgateHigh = `asdasd\u{d801}\u{d803}asdasd`;
    expect(util.fromCodePoints(...[97, 115, 100, 97, 115, 100, 0xd801, 0xd803, 97, 115, 100, 97, 115, 100]))
      .toEqual(strSurrgateHigh);

    let strSurrgateLow = `asdasd\u{dc00}\u{dfff}asdasd`;
    expect(util.fromCodePoints(...[97, 115, 100, 97, 115, 100, 0xdc00, 0xdfff, 97, 115, 100, 97, 115, 100]))
      .toEqual(strSurrgateLow);

    let strSurrgateWrongOrder = `asdasd\u{dc00}\u{d800}asdasd`;
    expect(util.fromCodePoints(...[97, 115, 100, 97, 115, 100, 0xdc00, 0xd800, 97, 115, 100, 97, 115, 100]))
      .toEqual(strSurrgateWrongOrder);
  });
});
