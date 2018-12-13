/**
 * File: src/line_breaker.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:08:13 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// this implementation is originall from
// https://github.com/niklasvh/css-line-break/blob/master/src/LineBreak.js
// https://github.com/foliojs/linebreak/blob/master/src/linebreaker.coffee
// I just translate them to Typescript.

const fs = require('fs');

import { UnicodeTrie } from './unicode_trie';
import { UString } from './ustring';
import { getCategory } from './unicode_common_property';

import * as lineBreakMeta from './ucd/line_break.json';

let lineBreakClasses: { [key: string]: number } = lineBreakMeta;

const {
  XX,
  CM,
  BA,
  LF,
  BK,
  CR,
  SP,
  EX,
  QU,
  AL,
  PR,
  PO,
  OP,
  CP,
  IS,
  HY,
  SY,
  NU,
  CL,
  NL,
  GL,
  AI,
  BB,
  HL,
  SA,
  JL,
  JV,
  JT,
  NS,
  ZW,
  ZWJ,
  B2,
  IN,
  WJ,
  ID,
  EB,
  CJ,
  H2,
  H3,
  // tslint:disable-next-line: no-unused-variable
  SG,
  CB,
  RI,
  EM
} = lineBreakClasses;

const ALPHABETICS = [AL, HL];
const HARD_LINE_BREAKS = [BK, CR, LF, NL];
const SPACE = [SP, ZW];
const PREFIX_POSTFIX = [PR, PO];
const LINE_BREAKS = HARD_LINE_BREAKS.concat(SPACE, ZW);
const KOREAN_SYLLABLE_BLOCK = [JL, JV, JT, H2, H3];
const HYPHEN = [HY, BA];

const lineBreakTrie = new UnicodeTrie(
  fs.readFileSync(__dirname + '/ucd/line_break.trie')
);

/**
 * CSS Line Break Option
 * see https://drafts.csswg.org/css-text-3/#line-break-property
 */
export enum LineBreakOption {
  /** Current does the same this as Normal */
  Auto,

  /** Use the most common set of line break rules. */
  Normal,

  /** Use the least restrictive set of line break rules,
   * mostly for short line text, like newspapers.
   */
  Loose,

  /** Use the most stricted set of line break rules, mostly for long text */
  Strict
}

/**
 * CSS Word Break Option
 * https://drafts.csswg.org/css-text-3/#word-break
 */
export enum WordBreakOption {
  /** Words break according to their customary rules,
   *  As of Korean, allows breaks between any two consecutive Hangul/Hanja.
   */
  Normal,

  /** Breaking is allowed within “words” */
  BreakAll,

  /** Currently does the same thing as BreakAll */
  BreakWord,

  /** Breaking is forbidden within “words” */
  KeepAll
}

/**
 * Options to control Line Break and Word Break behaviors
 */
export interface Options {
  lineBreak: LineBreakOption;
  wordBreak: WordBreakOption;
}

/**
 * Represent a Line Break Type
 */
export enum LineBreakType {
  Mandatory,
  Allowed,
  NotAllowed
}

/**
 * Line Break Opportunity
 */
export interface LineBreakOpportunity {
  /** true for mandatory line break, false for regular break opportunity */
  required: boolean;
  /** the char code index at the break point */
  position: number;
}

function _isLetterNumber(category: string) {
  return (
    ['Lu', 'Ll', 'Lt', 'Lm', 'Lo', 'Nd', 'Nl', 'No'].indexOf(category) !== -1
  );
}

/**
 * convert code points to line break classes accordingly
 * @param codePoints the code points
 * @param options default Strict
 * @return [indiciesMap, lineBreakClasses, isLetterNumbers]
 */
export function codePointsToLineBreakClasses(
  codePoints: number[],
  lineBreakOption: LineBreakOption = LineBreakOption.Strict
): [number[], number[], boolean[]] {
  const types: number[] = [];
  const indicies: number[] = [];
  const isLetterNumber: boolean[] = [];

  codePoints.forEach((codePoint, index) => {
    let classType = lineBreakTrie.get(codePoint);
    let category = getCategory(codePoint);
    isLetterNumber.push(_isLetterNumber(category));

    if (
      [
        LineBreakOption.Normal,
        LineBreakOption.Auto,
        LineBreakOption.Loose
      ].indexOf(lineBreakOption) !== -1
    ) {
      // U+2010, – U+2013, 〜 U+301C, ゠ U+30A0
      if ([0x2010, 0x2013, 0x301c, 0x30a0].indexOf(codePoint) !== -1) {
        indicies.push(index);
        return types.push(CB);
      }
    }

    if (classType === CM || classType === ZWJ) {
      // LB10 Treat any remaining combining mark or ZWJ as AL.
      if (index === 0) {
        if (classType === ZWJ) {
          indicies.push(index);
          return types.push(ZWJ);
        } else {
          indicies.push(index);
          return types.push(AL);
        }
      }

      // LB9 Do not break a combining character sequence; treat it as if it has the line breaking class of
      // the base character in all of the following rules. Treat ZWJ as if it were CM.
      const prevNoneCMZWJ = _previousNonCMOrZWJClassType(index - 1, types);
      if (prevNoneCMZWJ === -1) {
        indicies.push(index);
        return types.push(AL);
      } else if (LINE_BREAKS.indexOf(prevNoneCMZWJ) === -1) {
        indicies.push(indicies[index - 1]);
        return types.push(prevNoneCMZWJ);
      }
      indicies.push(index);
      return types.push(AL);
    }

    indicies.push(index);

    if (classType === CJ) {
      if (lineBreakOption === LineBreakOption.Strict) {
        return types.push(NS);
      } else {
        return types.push(ID);
      }
    }

    if (classType === SA) {
      return types.push(AL);
    }

    if (classType === AI) {
      return types.push(AL);
    }

    // For supplementary characters, a useful default is to treat characters in the range 10000..1FFFD as AL
    // and characters in the ranges 20000..2FFFD and 30000..3FFFD as ID, until the implementation can be revised
    // to take into account the actual line breaking properties for these characters.
    if (classType === XX) {
      if (
        (codePoint >= 0x20000 && codePoint <= 0x2fffd) ||
        (codePoint >= 0x30000 && codePoint <= 0x3fffd)
      ) {
        return types.push(ID);
      } else {
        return types.push(AL);
      }
    }

    types.push(classType);
  });

  return [indicies, types, isLetterNumber];
}

function _isAdjacentWithSpaceIgnored(
  a: number[] | number,
  b: number,
  currentIndex: number,
  classTypes: number[]
): boolean {
  const current = classTypes[currentIndex];
  if (Array.isArray(a) ? a.indexOf(current) !== -1 : a === current) {
    let i = currentIndex;
    while (i <= classTypes.length) {
      i++;
      let next = classTypes[i];

      if (next === b) {
        return true;
      }

      if (next !== SP) {
        break;
      }
    }
  }

  if (current === SP) {
    let i = currentIndex;

    while (i > 0) {
      i--;
      const prev = classTypes[i];

      if (Array.isArray(a) ? a.indexOf(prev) !== -1 : a === prev) {
        let n = currentIndex;
        while (n <= classTypes.length) {
          n++;
          let next = classTypes[n];

          if (next === b) {
            return true;
          }

          if (next !== SP) {
            break;
          }
        }
      }

      if (prev !== SP) {
        break;
      }
    }
  }
  return false;
}

function _previousNonSpaceClassType(
  currentIndex: number,
  classTypes: Array<number>
): number {
  let i = currentIndex;
  while (i >= 0) {
    let type = classTypes[i];
    if (type === SP) {
      i--;
    } else {
      return type;
    }
  }
  return -1;
}

function _previousNonCMOrZWJClassType(
  currentIndex: number,
  classTypes: Array<number>
): number {
  let i = currentIndex;
  while (i >= 0) {
    let type = classTypes[i];
    if (type === ZWJ || type === CM) {
      i--;
    } else {
      return type;
    }
  }
  return -1;
}

function _lineBreakAtIndex(
  codePoints: number[],
  classTypes: number[],
  indicies: number[],
  index: number,
  forbiddenBreaks: boolean[] | null = null
): LineBreakType {
  if (indicies[index] === 0) {
    return LineBreakType.NotAllowed;
  }

  let currentIndex = index - 1;
  if (
    Array.isArray(forbiddenBreaks) &&
    forbiddenBreaks[currentIndex] === true
  ) {
    return LineBreakType.NotAllowed;
  }

  let beforeIndex = currentIndex - 1;
  let afterIndex = currentIndex + 1;
  let current = classTypes[currentIndex];

  // LB4 Always break after hard line breaks.
  // LB5 Treat CR followed by LF, as well as CR, LF, and NL as hard line breaks.
  let before = beforeIndex >= 0 ? classTypes[beforeIndex] : 0;
  let next = classTypes[afterIndex];

  if (current === CR && next === LF) {
    return LineBreakType.NotAllowed;
  }

  if (HARD_LINE_BREAKS.indexOf(current) !== -1) {
    return LineBreakType.Mandatory;
  }

  // LB6 Do not break before hard line breaks.
  if (HARD_LINE_BREAKS.indexOf(next) !== -1) {
    return LineBreakType.NotAllowed;
  }

  // LB7 Do not break before spaces or zero width space.
  if (SPACE.indexOf(next) !== -1) {
    return LineBreakType.NotAllowed;
  }

  // LB8 Break before any character following a zero-width space, even if one or more spaces intervene.
  if (_previousNonSpaceClassType(currentIndex, classTypes) === ZW) {
    return LineBreakType.Allowed;
  }

  // LB8a Do not break between a zero width joiner.
  if (current === ZWJ) {
    return LineBreakType.NotAllowed;
  }

  // LB11 Do not break before or after Word joiner and related characters.
  if (current === WJ || next === WJ) {
    return LineBreakType.NotAllowed;
  }

  // LB12 Do not break after NBSP and related characters.
  if (current === GL) {
    return LineBreakType.NotAllowed;
  }

  // LB12a Do not break before NBSP and related characters, except after spaces and hyphens.
  if ([SP, BA, HY].indexOf(current) === -1 && next === GL) {
    return LineBreakType.NotAllowed;
  }

  // LB13 Do not break before ‘]’ or ‘!’ or ‘;’ or ‘/’, even after spaces.
  if ([CL, CP, EX, IS, SY].indexOf(next) !== -1) {
    return LineBreakType.NotAllowed;
  }

  // LB14 Do not break after ‘[’, even after spaces.
  if (_previousNonSpaceClassType(currentIndex, classTypes) === OP) {
    return LineBreakType.NotAllowed;
  }

  // LB15 Do not break within ‘”[’, even with intervening spaces.
  if (_isAdjacentWithSpaceIgnored(QU, OP, currentIndex, classTypes)) {
    return LineBreakType.NotAllowed;
  }

  // LB16 Do not break between closing punctuation and a nonstarter (lb=NS), even with intervening spaces.
  if (_isAdjacentWithSpaceIgnored([CL, CP], NS, currentIndex, classTypes)) {
    return LineBreakType.NotAllowed;
  }

  // LB17 Do not break within ‘——’, even with intervening spaces.
  if (_isAdjacentWithSpaceIgnored(B2, B2, currentIndex, classTypes)) {
    return LineBreakType.NotAllowed;
  }

  // LB18 Break after spaces.
  if (current === SP) {
    return LineBreakType.Allowed;
  }

  // LB19 Do not break before or after quotation marks, such as ‘ ” ’.
  if (current === QU || next === QU) {
    return LineBreakType.NotAllowed;
  }

  // LB20 Break before and after unresolved CB.
  if (next === CB || current === CB) {
    return LineBreakType.Allowed;
  }

  // LB21 Do not break before hyphen-minus, other hyphens, fixed-width spaces, small kana, and other non-starters, or after acute accents.
  if ([BA, HY, NS].indexOf(next) !== -1 || current === BB) {
    return LineBreakType.NotAllowed;
  }

  // LB21a Don't break after Hebrew + Hyphen.
  if (before === HL && HYPHEN.indexOf(current) !== -1) {
    return LineBreakType.NotAllowed;
  }

  // LB21b Don’t break between Solidus and Hebrew letters.
  if (current === SY && next === HL) {
    return LineBreakType.NotAllowed;
  }

  // LB22 Do not break between two ellipses, or between letters, numbers or exclamations and ellipsis.
  if (
    next === IN &&
    ALPHABETICS.concat(IN, EX, NU, ID, EB, EM).indexOf(current) !== -1
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB23 Do not break between digits and letters.
  if (
    (ALPHABETICS.indexOf(next) !== -1 && current === NU) ||
    (ALPHABETICS.indexOf(current) !== -1 && next === NU)
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB23a Do not break between numeric prefixes and ideographs, or between ideographs and numeric postfixes.
  if (
    (current === PR && [ID, EB, EM].indexOf(next) !== -1) ||
    ([ID, EB, EM].indexOf(current) !== -1 && next === PO)
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB24 Do not break between numeric prefix/postfix and letters, or between letters and prefix/postfix.
  if (
    (ALPHABETICS.indexOf(current) !== -1 &&
      PREFIX_POSTFIX.indexOf(next) !== -1) ||
    (PREFIX_POSTFIX.indexOf(current) !== -1 && ALPHABETICS.indexOf(next) !== -1)
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB25 Do not break between the following pairs of classes relevant to numbers:
  if (
    // (PR | PO) × ( OP | HY )? NU
    ([PR, PO].indexOf(current) !== -1 &&
      (next === NU ||
        ([OP, HY].indexOf(next) !== -1 &&
          classTypes[afterIndex + 1] === NU))) ||
    // ( OP | HY ) × NU
    ([OP, HY].indexOf(current) !== -1 && next === NU) ||
    // NU ×	(NU | SY | IS)
    (current === NU && [NU, SY, IS].indexOf(next) !== -1)
  ) {
    return LineBreakType.NotAllowed;
  }

  // NU (NU | SY | IS)* × (NU | SY | IS | CL | CP)
  if ([NU, SY, IS, CL, CP].indexOf(next) !== -1) {
    let prevIndex = currentIndex;
    while (prevIndex >= 0) {
      let type = classTypes[prevIndex];
      if (type === NU) {
        return LineBreakType.NotAllowed;
      } else if ([SY, IS].indexOf(type) !== -1) {
        prevIndex--;
      } else {
        break;
      }
    }
  }

  // NU (NU | SY | IS)* (CL | CP)? × (PO | PR))
  if ([PR, PO].indexOf(next) !== -1) {
    let prevIndex =
      [CL, CP].indexOf(current) !== -1 ? beforeIndex : currentIndex;
    while (prevIndex >= 0) {
      let type = classTypes[prevIndex];
      if (type === NU) {
        return LineBreakType.NotAllowed;
      } else if ([SY, IS].indexOf(type) !== -1) {
        prevIndex--;
      } else {
        break;
      }
    }
  }

  // LB26 Do not break a Korean syllable.
  if (
    (JL === current && [JL, JV, H2, H3].indexOf(next) !== -1) ||
    ([JV, H2].indexOf(current) !== -1 && [JV, JT].indexOf(next) !== -1) ||
    ([JT, H3].indexOf(current) !== -1 && next === JT)
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB27 Treat a Korean Syllable Block the same as ID.
  if (
    (KOREAN_SYLLABLE_BLOCK.indexOf(current) !== -1 &&
      [IN, PO].indexOf(next) !== -1) ||
    (KOREAN_SYLLABLE_BLOCK.indexOf(next) !== -1 && current === PR)
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB28 Do not break between alphabetics (“at”).
  if (ALPHABETICS.indexOf(current) !== -1 && ALPHABETICS.indexOf(next) !== -1) {
    return LineBreakType.NotAllowed;
  }

  // LB29 Do not break between numeric punctuation and alphabetics (“e.g.”).
  if (current === IS && ALPHABETICS.indexOf(next) !== -1) {
    return LineBreakType.NotAllowed;
  }

  // LB30 Do not break between letters, numbers, or ordinary symbols and opening or closing parentheses.
  if (
    (ALPHABETICS.concat(NU).indexOf(current) !== -1 && next === OP) ||
    (ALPHABETICS.concat(NU).indexOf(next) !== -1 && current === CP)
  ) {
    return LineBreakType.NotAllowed;
  }

  // LB30a Break between two regional indicator symbols if and only if there are an even number of regional
  // indicators preceding the position of the break.
  if (current === RI && next === RI) {
    let i = indicies[currentIndex];
    let count = 1;
    while (i > 0) {
      i--;
      if (classTypes[i] === RI) {
        count++;
      } else {
        break;
      }
    }
    if (count % 2 !== 0) {
      return LineBreakType.NotAllowed;
    }
  }

  // LB30b Do not break between an emoji base and an emoji modifier.
  if (current === EB && next === EM) {
    return LineBreakType.NotAllowed;
  }

  return LineBreakType.Allowed;
}

// return [indicies, classtypes, forbiddenLineBreak]
function _cssFormattedClasses(
  codePoints: number[],
  options: Options | null
): [number[], number[], boolean[] | null] {
  if (!options) {
    options = {
      lineBreak: LineBreakOption.Normal,
      wordBreak: WordBreakOption.Normal
    };
  }

  let [indicies, classTypes, isLetterNumber] = codePointsToLineBreakClasses(
    codePoints,
    options.lineBreak
  );

  if (
    options.wordBreak === WordBreakOption.BreakAll ||
    options.wordBreak === WordBreakOption.BreakWord
  ) {
    classTypes = classTypes.map(
      type => ([NU, AL, SA].indexOf(type) !== -1 ? ID : type)
    );
  }

  const forbiddenBreakpoints =
    options.wordBreak === WordBreakOption.KeepAll
      ? isLetterNumber.map((isLetterNumber, i) => {
        return (
          isLetterNumber && codePoints[i] >= 0x4e00 && codePoints[i] <= 0x9fff
        );
      })
      : null;

  return [indicies, classTypes, forbiddenBreakpoints];
}

export function lineBreakAtIndex(codePoints: number[], index: number) {
  // LB2 Never break at the start of text.
  if (index === 0) {
    return LineBreakType.NotAllowed;
  }

  // LB3 Always break at the end of text.
  if (index >= codePoints.length) {
    return LineBreakType.Mandatory;
  }

  const [indicies, classTypes] = codePointsToLineBreakClasses(codePoints);

  return _lineBreakAtIndex(codePoints, classTypes, indicies, index);
}

export class LineBreaker {
  private _ustr: UString;

  private _nextIndex: number = 0;
  private _lastEnd: number = 0;
  private _codePointLen: number;
  private _codePoints: number[];
  private _lineBreakClasses: number[];
  private _forbiddenBreakpoints: boolean[] | null;
  private _indicies: number[];

  constructor(
    str: string,
    options: Options = {
      lineBreak: LineBreakOption.Normal,
      wordBreak: WordBreakOption.Normal
    }
  ) {
    this._ustr = new UString(str);
    this._codePoints = this._ustr.codePoints();
    this._codePointLen = this._codePoints.length;
    [
      this._indicies,
      this._lineBreakClasses,
      this._forbiddenBreakpoints
    ] = _cssFormattedClasses(this._codePoints, options);
  }

  /** Get next line break opportunity.
   *  If not, it will just return null
   */
  next(): LineBreakOpportunity | null {
    if (this._nextIndex >= this._codePointLen) {
      return null;
    }

    let lineBreakType = LineBreakType.NotAllowed;
    while (this._nextIndex < this._codePointLen) {
      lineBreakType = _lineBreakAtIndex(
        this._codePoints,
        this._lineBreakClasses,
        this._indicies,
        ++this._nextIndex,
        this._forbiddenBreakpoints
      );

      if (lineBreakType !== LineBreakType.NotAllowed) {
        break;
      }
    }

    if (
      lineBreakType !== LineBreakType.NotAllowed ||
      this._nextIndex === this._codePointLen
    ) {
      const breakOpp = {
        required: lineBreakType === LineBreakType.Mandatory,
        position:
          this._ustr.codePointIndex2CharCodeIndexRange(this._nextIndex - 1)
            .end + 1
      } as LineBreakOpportunity;

      this._lastEnd = this._nextIndex;
      return breakOpp;
    }

    return null;
  }
}
