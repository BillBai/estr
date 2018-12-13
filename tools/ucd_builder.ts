/**
 * File: tools/ucd_builder.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:12:40 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */



// This ucd parser implementation is originally from https://github.com/foliojs/codepoints
// I just translate it to typescript, and made some small modifications.
import fs from 'fs';


function parseCodes(code: string | null): number[] | null {
  if (!code) {
    return null;
  }

  let codeParts = code.split(' ');
  let r: number[] = [];
  for (let i = 0, len = codeParts.length; i < len; i++) {
    let part = codeParts[i];
    if (part) {
      r.push(parseInt(part, 16));
    }
  }
  return r;
}

function clone(obj: any): any {
  if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
    return obj;
  var temp = new obj.constructor();
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj['isActiveClone'] = null;
      temp[key] = clone(obj[key]);
      delete obj['isActiveClone'];
    }
  }

  return temp;
}

export class CodePoint {
  code: number;
  name: string;
  category: string;
  combiningClass: number;
  bidiClass: string;
  decomposition: number[];
  decimal: string;
  digit: string;
  numeric: string;
  bidiMirrored: boolean;
  unicode1name: string;
  isoComment: string;
  uppercase: number[] | null;
  lowercase: number[] | null;
  titlecase: number[] | null;

  folded: any;
  caseConditions: any;

  bidiPairedBracket?: number;
  bidiPairedBracketType?: string;

  hangulSyllableType?: string;
  jamoShortName?: string;
  isCompat: boolean;
  isExcluded: boolean;

  compositions?: number[];
  combinningClassName?: string;
  block?: any;
  script?: any;
  eastAsianWidth?: any;
  joiningType?: any;
  joiningGroup?: any;
  indicSyllabicCategory?: any;
  indicPositionCategory?: any;

  NFD_QC: number = 0;
  NFKD_QC: number = 0;
  NFC_QC: number = 0;
  NFKC_QC: number = 0;

  verticalOrientationLayout?: string;
  lineBreak?: string;
  graphemeBreak?: string;
  wordBreak?: string;
  sentenceBreak?: string;

  isEmoji: boolean = false;
  isEmojiPresentation: boolean = false;
  isEmojiModifier: boolean = false;
  isEmojiModifierBase: boolean = false;
  isEmojiComponent: boolean = false;
  isExtPictographic: boolean = false;


  constructor(parts: string[]) {
    let [code, name, category, combiningClass, bidiClass,
      decomposition, decimal, digit, numeric, bidiMirrored,
      unicode1Name, isoComment, uppercase, lowercase, titlecase] = parts;

    this.code = parseInt(code, 16);
    this.name = name;
    this.category = category;

    this.combiningClass = parseInt(combiningClass) || 0;
    this.bidiClass = bidiClass;
    this.decomposition = parseCodes(decomposition) || [];

    this.decimal = decimal;
    this.digit = digit;
    this.numeric = numeric;
    this.bidiMirrored = bidiMirrored === 'Y';
    this.unicode1name = unicode1Name;
    this.isoComment = isoComment;

    this.uppercase = uppercase ? [parseInt(uppercase, 16)] : null;
    this.lowercase = lowercase ? [parseInt(lowercase, 16)] : null;
    this.titlecase = titlecase ? [parseInt(titlecase, 16)] : null;

    this.folded = null;
    this.caseConditions = null;

    this.isCompat = false;
    this.isExcluded = false;
    if (this.decomposition.length && isNaN(this.decomposition[0])) {
      this.isCompat = true;
      this.decomposition.shift();
    }

    this.compositions = [];
    this.combinningClassName = null;
    this.block = null;
    this.script = null;
    this.eastAsianWidth = null;
    this.joiningType = null;
    this.joiningGroup = null;
    this.indicSyllabicCategory = null;
    this.indicPositionCategory = null;

    if ((decimal && decimal !== this.numeric) || (digit && digit !== this.numeric)) {
      throw new Error('Decimal or digit does not match numeric value');
    }

  }

  copy(codePoint: number) {
    let r: any = new CodePoint([]);

    for (var key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        r[key] = this[key];
      }
    }
    r.code = codePoint;
    return r;
  }
}

export class UCDParser {
  UCDDirPath: string;
  codePoints: CodePoint[] = [];
  combiningClasses: { [key: number]: string; } = {};
  joiningTypes: { [key: string]: string; } = {};

  constructor(UCDDirPath: string) {
    this.UCDDirPath = UCDDirPath;
    this._parseUCDMainFile();
    this._parse();
  }

  private _parseUCDMainFile() {
    let data = fs.readFileSync(this.UCDDirPath + '/UnicodeData.txt', 'ascii');
    let rangeStart = -1;
    let lines = data.split('\n');
    let lineCount = lines.length;
    for (let i = 0; i < lineCount; i++) {
      let line = lines[i];
      if (line.length > 0) {
        let parts = line.split(';');
        let name = parts[1];
        let codePoint = new CodePoint(parts);

        if (rangeStart >= 0) {
          if (!(/<.+, Last>/.test(name))) {
            throw new Error('no range end found')
          }

          for (let cp = rangeStart; cp <= codePoint.code; cp++) {
            this.codePoints[cp] = codePoint.copy(cp);
          }

          rangeStart = -1;
        } else if (/<.+, First>/.test(name)) {
          rangeStart = codePoint.code;
        } else {
          this.codePoints[codePoint.code] = codePoint;
        }
      }
    }
  }

  private _readFile(filename: string, parse: boolean, callback: (parts: string[]) => void) {
    let data = fs.readFileSync(this.UCDDirPath + '/' + filename, 'utf8');
    let lines = data.split('\n');
    let lineCount = lines.length;
    for (let i = 0; i < lineCount; i++) {
      let line = lines[i];
      if (line.length > 0 && line[0] !== '#') {
        let commentIdx = line.indexOf('#');
        if (commentIdx !== -1) {
          line = line.slice(0, commentIdx);
          line = line.trim();
        }
        let parts: string[] = line.replace(/\s+#.*$/, '').split(/\s*;\s*/);

        if (parse) {
          let match = parts[0].match(/([a-z0-9]+)\.\.([a-z0-9]+)/i);
          if (match) {
            let start = parseInt(match[1], 16);
            let end = parseInt(match[2], 16);
            parts[0] = `${start},${end}`;
          } else {
            let cp = parseInt(parts[0], 16);
            if (!isNaN(cp)) {
              parts[0] = `${cp},${cp}`;
            }
          }
        }

        callback(parts);
      }
    }
  }

  private _parse() {
    this._parsePropValueAliases()
    this._parseDerivedNumericValues();
    this._parseBlocks();
    this._parseScripts();
    this._parseEastAsianWidth();
    this._parseSpecialCasing();
    this._parseCaseFolding();
    this._parseCompositionExclusion();
    this._parseDerivedNormalizationProps();
    this._parseArabicShaping();
    this._parseIndicPositionalCategory();
    this._parseIndicSyllabicCategory();
    this._parseBidiBrackets();
    this._parseHangullSyllableType();
    this._parseJamo();
    this._parseVerticalLayout();
    this._parseLineBreak();
    this._parseGraphemeBreak();
    this._parseWordBreak();
    this._parseSentenceBreak();
    this._parseEmojiData();

    let cpCount = this.codePoints.length;
    for (let i = 0; i < cpCount; i++) {
      let codePoint = this.codePoints[i];
      if (codePoint && codePoint.decomposition.length > 1 && !codePoint.isCompat && !codePoint.isExcluded) {
        let cp = this.codePoints[codePoint.decomposition[1]];
        cp.compositions[codePoint.decomposition[0]] = codePoint.code;
      }
    }

    let count = this.codePoints.length;
    for (let i = 0; i < count; i++) {
      let cp = this.codePoints[i];
      if (cp && cp.isExtPictographic /*&& i >= 0x00 && i <= 0x80*/) {
        // console.log(String.fromCodePoint(cp.code));
        // console.log(cp.code);
      }
    }
  }

  private _parsePropValueAliases() {
    this._readFile('PropertyValueAliases.txt', false, (parts) => {
      if (parts[0] === 'ccc') {
        let num = parseInt(parts[1]);
        let name = parts[3];
        this.combiningClasses[num] = name;
      }

      if (parts[0] === 'jt') {
        this.joiningTypes[parts[1]] = parts[2];
      }
    });

    let count = this.codePoints.length;
    for (let i = 0; i < count; i++) {
      let cp = this.codePoints[i];
      if (cp) {
        cp.combinningClassName = this.combiningClasses[cp.combiningClass];
      }
    }
  }


  private _parseDerivedNumericValues() {
    this._readFile('extracted/DerivedNumericValues.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let val = parts[3];
      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp && cp.numeric != undefined) {
          cp.numeric = val;
        }
      }
    });
  }

  private _parseBlocks() {
    this._readFile('Blocks.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.block = parts[1];
        }
      }
    });
  }

  private _parseScripts() {
    this._readFile('Scripts.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.script = parts[1];
        }
      }
    });
  }

  private _parseEastAsianWidth() {
    this._readFile('EastasianWidth.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.eastAsianWidth = parts[1];
        }
      }
    });
  }

  private _parseSpecialCasing() {
    this._readFile('SpecialCasing.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let code = start;
      let lower = parseCodes(parts[1]);
      let title = parseCodes(parts[2]);
      let upper = parseCodes(parts[3]);

      let conditions = null;
      if (parts[4]) {
        conditions = parts[4].split(/\s+/);
      }

      let codePoint = this.codePoints[code];
      if (!conditions) {
        codePoint.uppercase = upper;
        codePoint.lowercase = lower;
        codePoint.titlecase = title;
      }

      if (conditions) {
        codePoint.caseConditions = conditions;
      }
    });
  }

  private _parseCaseFolding() {
    this._readFile('CaseFolding.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let code = start;
      let typ = parts[1];

      let folded = parseCodes(parts[2]);
      let codePoint = null;
      if (typ === 'C' || typ === 'F') {
        codePoint = this.codePoints[code];
        if (!codePoint.lowercase || codePoint.lowercase.join('|') !== folded.join('|')) {
          codePoint.folded = folded;
        }
      }
    });
  }

  private _parseCompositionExclusion() {
    this._readFile('CompositionExclusions.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let code = start;
      this.codePoints[code].isExcluded = true;
    });
  }

  private _parseDerivedNormalizationProps() {
    this._readFile('DerivedNormalizationProps.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let prop = parts[1];
      let val = parts[2];

      if (prop === 'NFD_QC' || prop === 'NFKD_QC' || prop === 'NFC_QC' || prop === 'NFKC_QC') {
        for (let c = start; c <= end; c++) {
          let cp = this.codePoints[c];
          if (prop === 'NFD_QC') {
            cp.NFD_QC = val === 'Y' ? 0 : (val === 'N' ? 1 : 2);
          } else if (prop === 'NFKD_QC') {
            cp.NFKD_QC = val === 'Y' ? 0 : (val === 'N' ? 1 : 2);
          } else if (prop === 'NFC_QC') {
            cp.NFC_QC = val === 'Y' ? 0 : (val === 'N' ? 1 : 2);
          } else if (prop === 'NFKC_QC') {
            cp.NFKC_QC = val === 'Y' ? 0 : (val === 'N' ? 1 : 2);
          }
        }
      }
    });
  }

  private _parseArabicShaping() {
    this._readFile('ArabicShaping.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let name = parts[1];
      let joiningType = parts[2];
      let joiningGroup = parts[3];

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.joiningType = this.joiningTypes[joiningType];
          cp.joiningGroup = joiningGroup;
        }
      }
    });
  }

  private _parseIndicPositionalCategory() {
    this._readFile('IndicPositionalCategory.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let prop = parts[1];

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.indicPositionCategory = prop;
        }
      }
    });
  }

  private _parseIndicSyllabicCategory() {
    this._readFile('IndicSyllabicCategory.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let prop = parts[1];

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.indicSyllabicCategory = prop;
        }
      }
    });
  }

  private _parseBidiBrackets() {
    this._readFile('BidiBrackets.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let code = start;
      let val = parseInt(parts[1], 16);
      let typ = parts[2];

      let cp = this.codePoints[code];
      if (cp) {
        cp.bidiPairedBracket = val;
        cp.bidiPairedBracketType = typ;
      }
    });
  }

  private _parseHangullSyllableType() {
    this._readFile("HangulSyllableType.txt", true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        cp.hangulSyllableType = parts[1];
      }

    });
  }

  private _parseJamo() {
    this._readFile('Jamo.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let code = start;

      let cp = this.codePoints[code];
      if (cp) {
        let name = parts[1];
        cp.jamoShortName = parts[1];
      }
    });
  }

  private _parseVerticalLayout() {
    this._readFile('VerticalOrientation.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.verticalOrientationLayout = parts[1];
        }
      }

    });
  }

  private _parseLineBreak() {
    this._readFile('LineBreak.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.lineBreak = parts[1];
        }
      }

    })
  }

  private _parseGraphemeBreak() {
    this._readFile('auxiliary/GraphemeBreakProperty.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.graphemeBreak = parts[1];
        }
      }

    })
  }

  private _parseWordBreak() {
    this._readFile('auxiliary/WordBreakProperty.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.wordBreak = parts[1];
        }
      }
    })
  }

  private _parseSentenceBreak() {
    this._readFile('auxiliary/SentenceBreakProperty.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          cp.sentenceBreak = parts[1];
        }
      }

    });
  }

  private _parseEmojiData() {
    this._readFile('emoji-data.txt', true, (parts) => {
      let [s, e] = parts[0].split(',');
      let start = parseInt(s);
      let end = parseInt(e);
      let val = parts[1];

      if (!val) {
        console.log("++++++++++++++++++++++++++++++++++++++++++++");
        console.log(parts);
      }

      for (let c = start; c <= end; c++) {
        let cp = this.codePoints[c];
        if (cp) {
          if (val === 'Emoji') {
            cp.isEmoji = true;
          }

          if (val === 'Emoji_Presentation') {
            cp.isEmojiPresentation = true;
          }

          if (val === 'Emoji_Modifier') {
            cp.isEmojiModifier = true;
          }

          if (val === 'Emoji_Modifier_Base') {
            cp.isEmojiModifierBase = true;
          }

          if (val === 'Emoji_Component') {
            cp.isEmojiComponent = true;
          }

          if (val === 'Extended_Pictographic') {
            cp.isExtPictographic = true;
          }

        }
      }

    });
  }
}
