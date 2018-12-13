/**
 * File: src/util.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:09:40 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// Gets a code point from a UTF-16 string
// handling surrogate pairs appropriately

export function codePointAt(str: string, idx: number) {
  idx = idx || 0;
  let code = str.charCodeAt(idx);

  // High surrogate
  if (0xD800 <= code && code <= 0xDBFF) {
    let hi = code;
    let low = str.charCodeAt(idx + 1);
    if (0xDC00 <= low && low <= 0xDFFF) {
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    }

    return hi;
  }
  // Low surrogate
  if (0xDC00 <= code && code <= 0xDFFF) {
    let hi = str.charCodeAt(idx - 1);
    let low = code;
    if (0xD800 <= hi && hi <= 0xDBFF) {
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000
    }
    return low;
  }
  return code;
}


export function toCodePoints(str: string): number[] {
  const codePoints = [];
  let i = 0;
  const length = str.length;

  while (i < length) {
    const code = str.charCodeAt(i++);
    if (code >= 0xd800 && code <= 0xdbff && i < length) {
      const next = str.charCodeAt(i++)
      if ((next & 0xfc00) === 0xdc00) {
        codePoints.push(((code & 0x3ff) << 10) + (next & 0x3ff) + 0x10000);
      } else {
        codePoints.push(code);
        i--;
      }
    } else {
      codePoints.push(code);
    }
  }

  return codePoints;
}

export function fromCodePoints(...codePoints: number[]) {
  if (String.fromCodePoint) {
    return String.fromCodePoint(...codePoints);
  }

  const length = codePoints.length;
  if (!length) {
    return '';
  }

  const codeUnits: number[] = [];
  let index = -1;
  let result = '';
  while (++index < length) {
    let codePoint = codePoints[index];
    if (codePoint <= 0xffff) {
      codeUnits.push(codePoint);
    } else {
      codePoint -= 0x10000;
      codeUnits.push((codePoint >> 10) + 0xd800, codePoint % 0x400 + 0xdc00);
    }

    // set a max length
    if (index + 1 === length || codeUnits.length > 0x6742) {
      result += String.fromCharCode(...codeUnits);
      codeUnits.length = 0;
    }
  }
  return result;
}

export function isHighSurrogate(charCode: number) {
  return (0xd800 <= charCode && charCode <= 0xDBFF);
}

export function isLowSurrogate(charCode: number) {
  return (0xDC00 <= charCode && charCode <= 0xDFFF);
}
