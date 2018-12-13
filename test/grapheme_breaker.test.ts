/**
 * File: /test/grapheme_breaker.test.ts
 * Project: estr
 * Created Date: Thursday, December 13th 2018, 3:42:21 pm
 * Author: billbai billbai42@gmail.com
 * -----
 * Copyright (c) 2018 billbai
 */

// NOTE: (billbai)
// this unit test is originally
// from https://github.com/foliojs/grapheme-breaker/blob/master/test/GraphemeBreaker.coffee


const fs = require('fs');
const punycode = require('punycode');

import * as GraphemeBreaker from '../src/grapheme_breaker';


describe('Grapheme Breaker', () => {
    it('basic test', () => {
        let broken = GraphemeBreaker.breakByGrapheme('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞');
        expect(broken).toEqual(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞']);
    });

    it('nextBreak', () => {
        let str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';
        let index = 0;

        let res: string[] = [];
        let brk = GraphemeBreaker.nextBreak(str, index);
        while (brk < str.length) {
            res.push(str.slice(index, brk));
            index = brk;
            brk = GraphemeBreaker.nextBreak(str, index);
        }

        res.push(str.slice(index));
        expect(res).toEqual(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞']);
    });

    it('nextBreak intermediate indexes', () => {
        const str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';

        let breaks: { [key: number]: number } = {};

        for (let i = -1; i < str.length; i++) {
            let brk = GraphemeBreaker.nextBreak(str, i);
            breaks[brk] = brk;
        }

        expect(Object.keys(breaks).map((b) => breaks[b])).toEqual([0, 19, 28, 34, 47, 58, 75]);
    });

    it('previousBreak', () => {
        let str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';
        let index = str.length;

        let res: string[] = [];
        let brk = GraphemeBreaker.previousBreak(str, index);
        while (brk > 0) {
            res.push(str.slice(brk, index));
            index = brk;
            brk = GraphemeBreaker.previousBreak(str, index);
        }

        res.push(str.slice(0, index));
        expect(res).toEqual(['Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍', 'A̴̵̜̰͔ͫ͗͢', 'L̠ͨͧͩ͘', 'G̴̻͈͍͔̹̑͗̎̅͛́', 'Ǫ̵̹̻̝̳͂̌̌͘', '!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞'].reverse());
    });

    it('prevBreak intermediate indexes', () => {
        const str = 'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞';

        let breaks: { [key: number]: number } = {};

        for (let i = str.length + 1; i >= 0; i--) {
            let brk = GraphemeBreaker.previousBreak(str, i);
            breaks[brk] = brk;
        }

        expect(Object.keys(breaks).map((b) => breaks[b])).toEqual([0, 19, 28, 34, 47, 58, 75]);
    });

    it('previousBreak handles astral characters (e.g. emoji)', () => {
        let str = '😜🇺🇸👍';

        let res: string[] = [];
        let index = str.length;
        let brk = GraphemeBreaker.previousBreak(str, index);
        while (brk > 0) {
            res.push(str.slice(brk, index));
            index = brk;
            brk = GraphemeBreaker.previousBreak(str, index);
        }

        res.push(str.slice(0, index));
        expect(res).toEqual(['👍', '🇺🇸', '😜' ]);    });

    it('nextBreak handles astral characters (e.g. emoji)', () => {
        let str = '😜🇺🇸👍';

        let res: string[] = [];
        let index = 0;
        let brk = GraphemeBreaker.nextBreak(str, index);
        while (brk < str.length) {
            res.push(str.slice(index, brk));
            index = brk;
            brk = GraphemeBreaker.nextBreak(str, index);
        }
        res.push(str.slice(index));
        expect(res).toEqual(['😜', '🇺🇸', '👍' ]);    });

    it('should pass all tests in GraphemeBreakTest.txt', () => {
        let data = fs.readFileSync(__dirname + '/../ucd/UCD-11.0/auxiliary/GraphemeBreakTest.txt', 'utf8');
        let lines = data.split('\n');
        const lineCount = lines.length;
        for (let i = 0; i < lineCount; i++) {
            let line = lines[i];
            if (!line || /^#/.test(line)) {
                continue;
            }

            let [cols, comment] = line.split('#');
            // console.log(cols, comment);
            let codePoints = cols.split(/\s*[×÷]\s*/).filter(Boolean).map((c) => parseInt(c, 16));
            let str = punycode.ucs2.encode(codePoints);

            let expected = cols.split(/\s*÷\s*/).filter(Boolean).map((c) => {
                let codes = c.split(/\s*×\s*/);
                codes = codes.map((c) => parseInt(c, 16));
                return punycode.ucs2.encode(codes);
            });

            expect(GraphemeBreaker.breakByGrapheme(str)).toEqual(expected);
            expect(GraphemeBreaker.graphemeCount(str)).toEqual(expected.length);
        }
    });

    it('should pass all tests in GraphemeBreakTest.txt in reverse', () => {
        let data = fs.readFileSync(__dirname + '/../ucd/UCD-11.0/auxiliary/GraphemeBreakTest.txt', 'utf8');
        let lines = data.split('\n');
        const lineCount = lines.length;
        for (let i = 0; i < lineCount; i++) {
            let line = lines[i];
            if (!line || /^#/.test(line)) {
                continue;
            }

            let [cols, comment] = line.split('#');
            let codePoints = cols.split(/\s*[×÷]\s*/).filter(Boolean).map((c) => parseInt(c, 16));
            let str = punycode.ucs2.encode(codePoints);

            let expected = cols.split(/\s*÷\s*/).filter(Boolean).map((c) => {
                let codes = c.split(/\s*×\s*/);
                codes = codes.map((c) => parseInt(c, 16));
                return punycode.ucs2.encode(codes);
            });

            let res: string[] = [];
            let index = str.length;
            let brk = GraphemeBreaker.previousBreak(str, index);
            while (brk > 0) {
                res.push(str.slice(brk, index));
                index = brk;
                brk = GraphemeBreaker.previousBreak(str, index);
            }

            if (str.slice(0, index).length > 0) {
                res.push(str.slice(0, index));
            }
            // console.log(res.map((c) => c.codePointAt(0)));
            // console.log(expected.map((c) => c.codePointAt(0)));

            expect(res).toEqual(expected.reverse());
        }
    });
});
