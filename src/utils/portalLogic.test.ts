import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssistantReply,
  detectTextDirection,
  extractConversationArtifacts,
  filterConversations,
  normalizeLanguage,
  previewModeForLang,
  validatePrompt,
} from './portalLogic.ts';
import { SAMPLE_CONVERSATIONS } from '../data/zaiCatalog.ts';

describe('portalLogic', () => {
  it('normalizeLanguage maps common aliases cleanly', () => {
    assert.equal(normalizeLanguage('PY'), 'python');
    assert.equal(normalizeLanguage('js'), 'javascript');
    assert.equal(normalizeLanguage('ts'), 'typescript');
    assert.equal(normalizeLanguage(''), 'text');
  });

  it('previewModeForLang routes html, markdown, and code properly', () => {
    assert.equal(previewModeForLang('html'), 'html');
    assert.equal(previewModeForLang('svg'), 'html');
    assert.equal(previewModeForLang('md'), 'md');
    assert.equal(previewModeForLang('python'), 'code');
  });

  it('detectTextDirection separates Persian prose with Latin terms from pure English', () => {
    assert.equal(detectTextDirection('سلام، لطفاً با React و Tailwind بساز'), 'rtl');
    assert.equal(detectTextDirection('API پاسخ را در HTML برگرداند'), 'rtl');
    assert.equal(detectTextDirection('const value = Math.max(1, 2);'), 'ltr');
    assert.equal(detectTextDirection(''), 'rtl');
  });

  it('validatePrompt rejects empty prompt without attachment and accepts valid text', () => {
    assert.ok(validatePrompt('   ', false));
    assert.equal(validatePrompt('', true), null);
    assert.equal(validatePrompt('سلام Z.ai', false), null);
  });

  it('filterConversations searches title, model, and message content', () => {
    const byPython = filterConversations(SAMPLE_CONVERSATIONS, 'پایتون');
    assert.equal(byPython.length, 1);
    assert.equal(byPython[0].id, 'conv-python');

    const byModel = filterConversations(SAMPLE_CONVERSATIONS, 'GLM-5.3-Flash');
    assert.equal(byModel.length, 1);
  });

  it('extractConversationArtifacts flattens code blocks across messages', () => {
    const items = extractConversationArtifacts(SAMPLE_CONVERSATIONS[0]);
    assert.equal(items.length, 1);
    assert.equal(items[0].filename, 'status-card.html');
  });

  it('buildAssistantReply includes structured thinkingSteps and markdown/html artifacts', () => {
    const htmlReply = buildAssistantReply({
      prompt: 'یک صفحه HTML تمیز بساز',
      model: 'GLM-5.3',
      effort: 'حداکثر',
      deepThink: true,
      webSearch: false,
    });
    assert.equal(htmlReply.codeBlocks?.[0].lang, 'html');
    assert.ok(htmlReply.thinkingSteps && htmlReply.thinkingSteps.length >= 2);
    assert.equal(htmlReply.thinkingDuration, '۲.۱ ثانیه');

    const mdReply = buildAssistantReply({
      prompt: 'یک گزارش markdown کامل بنویس',
      model: 'GLM-5.2',
      effort: 'متعادل',
      deepThink: false,
      webSearch: true,
    });
    assert.equal(mdReply.codeBlocks?.[0].lang, 'md');
    assert.equal(mdReply.usedSearch, true);
  });
});
