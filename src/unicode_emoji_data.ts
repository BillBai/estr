/**
 * File: src/unicode_emoji_data.ts
 * Project: estr
 * Created Date: Thursday, December 13 2018,  2:08:44 PM
 * Author: billbai <billbai42@gmail.com>
 * -----
 * Copyright (c) 2018 billbai
 */

const fs = require('fs');

import { UnicodeTrie } from './unicode_trie';
import * as emojiShiftMeta from './ucd/emoji_data.json';

let emojiShift: { [key: string]: number } = emojiShiftMeta;
const { isEmojiShift, isEmojiPresentationShift, isEmojiModifierShift,
  isEmojiModifierBaseShift, isEmojiComponentShift, isExtPictographicShift } = emojiShift;

const isEmojiMask = 1 << isEmojiShift;
const isEmojiPresentationMask = 1 << isEmojiPresentationShift;
const isEmojiModifierMask = 1 << isEmojiModifierShift;
const isEmojiModifierBaseMask = 1 << isEmojiModifierBaseShift;
const isEmojiComponentMask = 1 << isEmojiComponentShift;
const isExtPictographicMask = 1 << isExtPictographicShift;

const emojiDataTrie = new UnicodeTrie(fs.readFileSync(__dirname + '/ucd/emoji_data.trie'));

export function isEmoji(codePoint: number) {
  const val = emojiDataTrie.get(codePoint);
  return (val & isEmojiMask) !== 0;
}

export function isEmojiPresentation(codePoint: number) {
  const val = emojiDataTrie.get(codePoint);
  return (val & isEmojiPresentationMask) !== 0;
}

export function isEmojiModifier(codePoint: number) {
  const val = emojiDataTrie.get(codePoint);
  return (val & isEmojiModifierMask) !== 0;
}

export function isEmojiModifierBase(codePoint: number) {
  const val = emojiDataTrie.get(codePoint);
  return (val & isEmojiModifierBaseMask) !== 0;
}

export function isEmojiComponent(codePoint: number) {
  const val = emojiDataTrie.get(codePoint);
  return (val & isEmojiComponentMask) !== 0;
}

export function isExtPictographic(codePoint: number) {
  const val = emojiDataTrie.get(codePoint);
  return (val & isExtPictographicMask) !== 0;
}

export default {
  isEmoji: isEmoji,
  isEmojiPresentation: isEmojiPresentation,
  isEmojiModifier: isEmojiModifier,
  isEmojiModifierBase: isEmojiModifierBase,
  isEmojiComponent: isEmojiComponent,
  isExtPictographic: isExtPictographic
};
