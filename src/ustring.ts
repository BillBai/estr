/**
 * File: src/ustring.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:09:32 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

import {
  toCodePoints,
  fromCodePoints,
  isHighSurrogate,
  isLowSurrogate
} from './util';

import { nextBreak as nextGraphemeBreakIndex } from './grapheme_breaker';

/**
 * The Interface to Represent an Index Range.
 *  The type of index (char code, code point or grapheme)
 *  should be determined by context.
 */
export interface IndexRange {
  /** the start index, inclusive */
  start: number;

  /** the end index, inclusive */
  end: number;
}

export class Grapheme {
  codePoints: number[];

  constructor(codePoints: number[]) {
    this.codePoints = codePoints;
  }

  /**
   * create a grapheme obj from string slice
   * @param str the string to slice
   * @param startIndex start char code index of the str, inclusive.
   * @param endIndex end char code index of the str, inclusive.
   */
  static fromStringSlice(str: string, startIndex: number, endIndex: number) {
    let codePoints = toCodePoints(str.slice(startIndex, endIndex + 1));
    return new Grapheme(codePoints);
  }

  /** return a string representation of the Gtrapheme */
  toString() {
    return fromCodePoints(...this.codePoints);
  }
}

export class UString {
  private _str: string;

  private _codePoints?: number[];
  // codePoint index => code unit (char code) index range
  // TODO: (billbai) use a more compact representation to reduce memory
  private _codePoint2CharCodeIndexMap: IndexRange[] = [];
  private _charCode2CodePointIndexMap: number[] = [];

  // the char code index range of each grapheme.
  // TODO: (billbai) use a more compact representation to reduce memory
  private _graphemeIndecies: IndexRange[] = [];

  constructor(str: string) {
    this._str = str;
    this._generateCodePoints();
    this._generateGraphemes();
  }

  private _generateCodePoints() {
    let codePoint2CharCodeIndexMap: IndexRange[] = [];
    let charCode2CodePointIndexMap: number[] = [];
    let codePoints: number[] = [];

    const charCodeLen = this._str.length;
    for (let i = 0; i < charCodeLen; i++) {
      let charCode = this._str.charCodeAt(i);
      if (isHighSurrogate(charCode) && i <= charCodeLen - 1) {
        let nextCharCode = this._str.charCodeAt(i + 1);
        if (isLowSurrogate(nextCharCode)) {
          i++;
          codePoints.push(
            ((charCode & 0x3ff) << 10) + (nextCharCode & 0x3ff) + 0x10000
          );
          codePoint2CharCodeIndexMap.push({ start: i - 1, end: i });
          let codePointIndex = codePoints.length - 1;
          charCode2CodePointIndexMap[i - 1] = codePointIndex;
          charCode2CodePointIndexMap[i] = codePointIndex;
          continue;
        }
      }
      codePoints.push(charCode);
      codePoint2CharCodeIndexMap.push({ start: i, end: i });
      let codePointIndex = codePoints.length - 1;
      charCode2CodePointIndexMap[i] = codePointIndex;
    }

    this._codePoints = codePoints;
    this._codePoint2CharCodeIndexMap = codePoint2CharCodeIndexMap;
    this._charCode2CodePointIndexMap = charCode2CodePointIndexMap;
  }

  private _generateGraphemes() {
    const charCodeLen = this._str.length;

    let graphemeIndecies: IndexRange[] = [];
    let lastIndex = 0;
    while (lastIndex < charCodeLen) {
      let nextIndex = nextGraphemeBreakIndex(this._str, lastIndex);
      graphemeIndecies.push({ start: lastIndex, end: nextIndex - 1 });
      lastIndex = nextIndex;
    }

    this._graphemeIndecies = graphemeIndecies;
  }

  /** return all code points */
  codePoints(): number[] {
    return this._codePoints || [];
  }

  /** return the javascript string ( UCS-2 Encoding) */
  toString() {
    return this._str;
  }

  /** return all graphemes */
  graphemes() {
    return this._graphemeIndecies.map(indexRange => {
      return Grapheme.fromStringSlice(
        this._str,
        indexRange.start,
        indexRange.end
      );
    });
  }

  /** return the count of char codes (code units of UTF-16) */
  charCodeCount() {
    return this._str.length;
  }

  /** return the count of Unicode code points */
  codePointCount() {
    return this.codePoints().length;
  }

  /** return the count of grapheme,
   * the grapheme boundaries are calculated
   * from UAX #29 grapheme break algorithm.
   */
  graphemeCount() {
    return this._graphemeIndecies.length;
  }

  /**
   * Get the code point at index
   * @param index the code point index. Range [0...codePointCount]
   * @note: the behavior is NOT the same as JS String.codePointAt(index)
   *        which accecpts an index of the char code index.
   */
  codePointAt(index: number): number {
    return this.codePoints()[index];
  }

  /**
   * Get the code point at char code index
   * @param charCodeIndex the char code index. [0...charCodeIndex]
   * @note: the behavior is NOT the same as JS String.codePointAt(index)
   *        Although they all accept a char code index,
   *        but the UString can return the correct 'surrogate paired' code point
   *        when the char code at the index is a low surrogate,
   *        which the JS String one will return the low surrogate's value.
   */
  codePointAtCharCodePoint(charCodeIndex: number) {
    let codePointIndex = this.charCodeIndex2CodePointIndex(charCodeIndex);
    return this.codePointAt(codePointIndex);
  }

  /**
   * get the char code (code uint) at the char code index.
   * Does exactly the same thing as the JS String.charCodeAt(index)
   * @param index the char code index. [0...charCodeCount]
   */
  charCodeAt(index: number): number {
    return this._str.charCodeAt(index);
  }

  /**
   * get the grapheme at grapheme index
   * @param index the grapheme index. [0...graphemeCount]
   */
  graphemeAt(index: number): Grapheme {
    const graphemeIndexRange = this._graphemeIndecies[index];
    return Grapheme.fromStringSlice(
      this._str,
      graphemeIndexRange.start,
      graphemeIndexRange.end
    );
  }

  /**
   * convert code point index to char code index range
   * @param index the code point index
   */
  codePointIndex2CharCodeIndexRange(index: number): IndexRange {
    return this._codePoint2CharCodeIndexMap[index];
  }

  /**
   * convert grapheme index to char code index range
   * @param index the grapheme index
   */
  graphemeIndex2CharCodeIndexRange(index: number): IndexRange {
    return this._graphemeIndecies[index];
  }

  /**
   * convert char code index to code point index
   * @param index the char code index
   */
  charCodeIndex2CodePointIndex(index: number): number {
    return this._charCode2CodePointIndexMap[index];
  }

  /**
   * convert char code index to grapheme index
   * @param index the char code index
   */
  charCodeIndex2GraphemeIndex(index: number): number {
    // search to
    let low = 0;
    let hi = this._graphemeIndecies.length - 1;

    while (low <= hi) {
      let mid = low + Math.floor((hi - low) / 2);
      let graphemeIndexRange = this._graphemeIndecies[mid];
      if (
        graphemeIndexRange.start <= index &&
        graphemeIndexRange.end >= index
      ) {
        return mid;
      } else if (index < graphemeIndexRange.start) {
        hi = mid - 1;
      } else if (index > graphemeIndexRange.end) {
        low = mid + 1;
      } else {
        throw new Error(
          'Error binary search grapheme index from char code index. Must be a bug.'
        );
      }
    }

    return -1;
  }

  // slice

  /**
   * slice the string by char code index
   * @param start start index, inclusive
   * @param to to index, exclusive
   */
  sliceByCharCode(start: number, to?: number) {
    if (to === undefined) {
      to = this.charCodeCount();
    }

    return new UString(this._str.slice(start, to));
  }

  /**
   * slice by grapheme index
   * @param start start grapheme index, inclusive
   * @param to end grapheme index, exclusive
   */
  sliceByGrapheme(start: number, to?: number) {
    if (to === undefined) {
      to = this.graphemeCount();
    }

    const charCodeStart = this.graphemeIndex2CharCodeIndexRange(start).start;
    const charCodeEnd = this.graphemeIndex2CharCodeIndexRange(to - 1).end;
    return new UString(this._str.slice(charCodeStart, charCodeEnd + 1));
  }

  /**
   * slice by code point index
   * @param start start code point index, inclusive
   * @param to to code point, exclusive
   */
  sliceByCodePoint(start: number, to?: number) {
    if (to === undefined) {
      to = this.codePointCount();
    }

    const charCodeStart = this.codePointIndex2CharCodeIndexRange(start).start;
    const charCodeEnd = this.codePointIndex2CharCodeIndexRange(to - 1).end;
    return new UString(this._str.slice(charCodeStart, charCodeEnd + 1));
  }
}
