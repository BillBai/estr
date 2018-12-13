/**
 * File: test/line_breaker.test.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:10:52 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// the test case parser code is originally from
// https://github.com/foliojs/linebreak/blob/master/test/index.coffee
// and https://github.com/niklasvh/css-line-break/blob/master/tests/
// i just translate it to typescript.

import * as fs from 'fs';
import * as punycode from 'punycode';

import { lineBreakAtIndex, LineBreaker, LineBreakOption, WordBreakOption } from '../src/line_breaker';

describe('unicode line break tests', () => {
  it('shoud pass unicode line break test cases', () => {

    let data = fs.readFileSync(
      __dirname + '/../ucd/UCD-11.0/auxiliary/'
      + 'LineBreakTest.txt', 'utf8');
    let lines = data.split('\n');

    lines.forEach((line, i) => {
      // skip comment line and empty line
      if (!line || /^#/.test(line)) {
        return;
      }

      let [cols, comment] = line.split('#');
      let codePoints = cols.split(/\s*[×÷]\s*/).slice(1, -1).map((c) => {
        return parseInt(c, 16);
      });
      let str = punycode.ucs2.encode(codePoints);

      let lineBreaker = new LineBreaker(str, {
        lineBreak: LineBreakOption.Strict,
        wordBreak: WordBreakOption.Normal
      });
      let breaks: string[] = [];

      let last = 0;
      let brk = lineBreaker.next();
      while (brk) {
        breaks.push(str.slice(last, brk.position));
        last = brk.position;
        brk = lineBreaker.next();
      }

      let expected = cols.split(/\s*÷\s*/).slice(0, -1).map((c) => {
        let codes = c.split(/\s*×\s*/);
        if ((codes[0]) === '') {
          codes.shift();
        }
        let codesArr = codes.map((c) => parseInt(c, 16));
        return punycode.ucs2.encode(codesArr);
      });

      expect(breaks).toEqual(expected);
    });
  });

});

describe('LineBreaker', () => {
  it('Should iterate breaks', () => {
    const str = 'Lorem ipsum lol.';
    const breaker = new LineBreaker(str);

    const words = [];
    let last = 0;
    let bk;

    while (bk = breaker.next()) {
      words.push(str.slice(last, bk.position));
      last = bk.position;
    }

    expect(words).toEqual(['Lorem ', 'ipsum ', 'lol.']);
  });

  it('Works with options', () => {
    const str = '次の単語グレートブリテンおよび北アイルランド連合王国で本当に大きな言葉';
    const breaker = new LineBreaker(str, {
      lineBreak: LineBreakOption.Strict,
      wordBreak: WordBreakOption.KeepAll
    });

    const words = [];
    let last = 0;
    let bk = breaker.next();

    while (bk) {
      words.push(str.slice(last, bk.position));
      last = bk.position;
      bk = breaker.next();
    }


    expect(words).toEqual([
      '次の', '単語グ', 'レー', 'ト', 'ブ', 'リ', 'テ', 'ン',
      'お', 'よ', 'び', '北ア', 'イ', 'ル', 'ラ', 'ン', 'ド',
      '連合王国で', '本当に', '大き', 'な', '言葉'
    ]);
  })
});
