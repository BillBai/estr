/**
 * File: test/unicode_emoji_data.test.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:11:13 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

import * as EmojiData from '../src/unicode_emoji_data';

describe('emoji data', () => {
  it('should be extended pictographic', () => {
    expect(EmojiData.isExtPictographic(0x2701)).toBeTruthy();
    expect(EmojiData.isExtPictographic(0x2721)).toBeTruthy();
    expect(EmojiData.isExtPictographic(0x2744)).toBeTruthy();
    expect(EmojiData.isExtPictographic(0x1F91F)).toBeTruthy();
    expect(EmojiData.isExtPictographic(0x00A9)).toBeTruthy();
    expect(EmojiData.isExtPictographic(0x231A)).toBeTruthy();

    expect(EmojiData.isExtPictographic(0x0001)).toBeFalsy();
    expect(EmojiData.isExtPictographic(0x1234)).toBeFalsy();
    expect(EmojiData.isExtPictographic(0x6677)).toBeFalsy();

  });

  it('should be Emoji_Component', () => {
    expect(EmojiData.isEmojiComponent(0xE0020)).toBeTruthy();
    expect(EmojiData.isEmojiComponent(0xE007F)).toBeTruthy();
    expect(EmojiData.isEmojiComponent(0xFE0F)).toBeTruthy();
    expect(EmojiData.isEmojiComponent(0x0023)).toBeTruthy();
    expect(EmojiData.isEmojiComponent(0x002A)).toBeTruthy();
    expect(EmojiData.isEmojiComponent(0x1F1E6)).toBeTruthy();

    expect(EmojiData.isEmojiComponent(0x203C)).toBeFalsy();
    expect(EmojiData.isEmojiComponent(0x2721)).toBeFalsy();
    expect(EmojiData.isEmojiComponent(0x1F930)).toBeFalsy();

  });

  it('should be Emoji_Modifier_Base', () => {
    expect(EmojiData.isEmojiModifierBase(0x1F3CA)).toBeTruthy();
    expect(EmojiData.isEmojiModifierBase(0x1F46E)).toBeTruthy();
    expect(EmojiData.isEmojiModifierBase(0x1F6CC)).toBeTruthy();
    expect(EmojiData.isEmojiModifierBase(0x1F91E)).toBeTruthy();
    expect(EmojiData.isEmojiModifierBase(0x1F9DD)).toBeTruthy();
    expect(EmojiData.isEmojiModifierBase(0x1F93D)).toBeTruthy();


    expect(EmojiData.isEmojiModifierBase(0x1000)).toBeFalsy();
    expect(EmojiData.isEmojiModifierBase(0x123)).toBeFalsy();
    expect(EmojiData.isEmojiModifierBase(0x667)).toBeFalsy();
    expect(EmojiData.isEmojiModifierBase(0xaaa)).toBeFalsy();
    expect(EmojiData.isEmojiModifierBase(0x233)).toBeFalsy();
    expect(EmojiData.isEmojiModifierBase(0x400)).toBeFalsy();
  });

  it('should be Emoji_Modifier', () => {
    expect(EmojiData.isEmojiModifier(0x1F3FB)).toBeTruthy();
    expect(EmojiData.isEmojiModifier(0x1F3FC)).toBeTruthy();
    expect(EmojiData.isEmojiModifier('🏻'.codePointAt(0))).toBeTruthy();
    expect(EmojiData.isEmojiModifier('🏿'.codePointAt(0))).toBeTruthy();

    expect(EmojiData.isEmojiModifier('x'.charCodeAt(0))).toBeFalsy();
  });

  it('should be Emoji_Presentation', () => {
    expect(EmojiData.isEmojiPresentation(0x1F9FF)).toBeTruthy();
    expect(EmojiData.isEmojiPresentation(0x1F62D)).toBeTruthy();
    expect(EmojiData.isEmojiPresentation(0x1F6D0)).toBeTruthy();
    expect(EmojiData.isEmojiPresentation(0x1F0CF)).toBeTruthy();
    expect(EmojiData.isEmojiPresentation(0x26D4)).toBeTruthy();
    expect(EmojiData.isEmojiPresentation('☔'.codePointAt(0))).toBeTruthy();

    expect(EmojiData.isEmojiPresentation('#'.codePointAt(0))).toBeFalsy();
  });

  it('should be Emoji', () => {
    expect(EmojiData.isEmoji('#'.codePointAt(0))).toBeTruthy();
    expect(EmojiData.isEmoji('*'.codePointAt(0))).toBeTruthy();
    expect(EmojiData.isEmoji('😓'.codePointAt(0))).toBeTruthy();

    expect(EmojiData.isEmoji('a'.codePointAt(0))).toBeFalsy();
  });
});
