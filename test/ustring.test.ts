/**
 * File: test/ustring.test.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:11:41 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

import { UString } from '../src/ustring';

describe('UString test', () => {
  it('get the counts right', () => {
    let ustr = new UString(
      'The quick brown fox 🦊 jumps over the lazy dog 🐕.'
    );
    expect(ustr.codePointCount()).toEqual(48);
    expect(ustr.charCodeCount()).toEqual(50);
    expect(ustr.graphemeCount()).toEqual(48);

    //    space
    // 👩 Woman
    //    Zero Width Joiner
    // ❤ Heavy Black Heart
    // ️ Variation Selector 16
    //    Zero Width Joiner
    // 👩 Woman
    //    space
    let cmbSeqStr = new UString(' 👩‍❤️‍👩 ');
    expect(cmbSeqStr.codePointCount()).toEqual(8);
    expect(cmbSeqStr.charCodeCount()).toEqual(10);
    expect(cmbSeqStr.graphemeCount()).toEqual(3);
  });

  it('get the item at index', () => {
    let ustr = new UString(
      'The quick brown fox 🦊 jumps over the lazy dog 🐕.'
    );
    expect(ustr.codePointAt(20)).toBe(129418); // the fox face

    expect(ustr.codePointAtCharCodePoint(21)).toBe(129418);
    expect(ustr.codePointAtCharCodePoint(20)).toBe(129418);
    expect(ustr.codePointAt(21)).toBe(32); // the space
    // &#xD83E;&#xDD8A;
    expect(ustr.charCodeAt(20)).toBe(0xd83e); // high surrogate of fox face
    expect(ustr.charCodeAt(21)).toBe(0xdd8a); // low surrogate of fox face

    expect(ustr.graphemeAt(20).toString()).toEqual('🦊');
    expect(ustr.graphemeAt(46).toString()).toEqual('🐕');

    //    space
    // 👩 Woman
    //    Zero Width Joiner
    // ❤ Heavy Black Heart
    // ️ Variation Selector 16
    //    Zero Width Joiner
    // 👩 Woman
    //    space

    let cmbSeqStr = new UString(' 👩‍❤️‍👩 ');
    expect(cmbSeqStr.codePointAt(3)).toBe(10084);
    expect(cmbSeqStr.codePointAtCharCodePoint(4)).toBe(10084);
    expect(cmbSeqStr.codePointAtCharCodePoint(5)).toBe(0xfe0f);

    expect(cmbSeqStr.charCodeAt(1)).toBe(0xd83d);
    expect(cmbSeqStr.charCodeAt(8)).toBe(0xdc69);

    expect(cmbSeqStr.graphemes().map(g => g.toString())).toEqual([
      ' ',
      '👩‍❤️‍👩',
      ' '
    ]);
  });

  it('convert different index', () => {
    let ustr = new UString(
      'The quick brown fox 🦊 jumps over the lazy dog 🐕.'
    );
    let charCodeIndexRange = ustr.codePointIndex2CharCodeIndexRange(46);
    expect(charCodeIndexRange.start).toBe(47);
    expect(charCodeIndexRange.end).toBe(48);

    expect(ustr.charCodeIndex2GraphemeIndex(47)).toBe(46);
    expect(ustr.charCodeIndex2GraphemeIndex(21)).toBe(20);

    //    space
    // 👩 Woman
    //    Zero Width Joiner
    // ❤ Heavy Black Heart
    // ️ Variation Selector 16
    //    Zero Width Joiner
    // 👩 Woman
    //    space

    let cmbSeqStr = new UString(' 👩‍❤️‍👩 ');
    charCodeIndexRange = cmbSeqStr.graphemeIndex2CharCodeIndexRange(1);
    expect(charCodeIndexRange.start).toBe(1);
    expect(charCodeIndexRange.end).toBe(8);

    expect(cmbSeqStr.charCodeIndex2GraphemeIndex(1)).toBe(1);
    expect(cmbSeqStr.charCodeIndex2GraphemeIndex(2)).toBe(1);
    expect(cmbSeqStr.charCodeIndex2GraphemeIndex(3)).toBe(1);
    expect(cmbSeqStr.charCodeIndex2GraphemeIndex(5)).toBe(1);
    expect(cmbSeqStr.charCodeIndex2GraphemeIndex(8)).toBe(1);
  });

  it('get the slice of the string', () => {
    let ustr = new UString(
      'The quick brown fox 🦊 jumps over the lazy dog 🐕.'
    );
    let ustrSlice = ustr.sliceByCharCode(16, 23);
    expect(ustrSlice.toString()).toEqual('fox 🦊 ');
    expect(ustr.sliceByCodePoint(16, 22).toString()).toEqual('fox 🦊 ');
    expect(ustr.sliceByGrapheme(16, 22).toString()).toEqual('fox 🦊 ');
    //    space
    // 👩 Woman
    //    Zero Width Joiner
    // ❤ Heavy Black Heart
    // ️ Variation Selector 16
    //    Zero Width Joiner
    // 👩 Woman
    //    space

    let cmbSeqStr = new UString(' 👩‍❤️‍👩 ');
    expect(cmbSeqStr.sliceByCharCode(4).toString()).toEqual('❤️‍👩 ');
    expect(cmbSeqStr.sliceByCodePoint(3).toString()).toEqual('❤️‍👩 ');
    expect(cmbSeqStr.sliceByGrapheme(1).toString()).toEqual('👩‍❤️‍👩 ');
  });

  it('return the js string', () => {
    let str = ' 👩‍❤️‍👩 ';
    let cmbSeqStr = new UString(' 👩‍❤️‍👩 ');
    expect(cmbSeqStr.toString()).toEqual(str);
  });
});
