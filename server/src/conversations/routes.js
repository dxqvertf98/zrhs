import { Router } from 'express';
import {
  createConversation,
  deleteConversation,
  findConversation,
  listConversations
} from '../db.js';
import { requireAuth } from '../auth/jwt.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(listConversations(req.user.id));
});

router.post('/', (req, res) => {
  const originalText = String(req.body.originalText || '').trim();
  const translatedText = String(req.body.translatedText || '').trim();
  const targetLanguage = String(req.body.targetLanguage || '').trim();
  const sourceLanguage = String(req.body.sourceLanguage || 'ko').trim();

  if (!originalText || !translatedText || !targetLanguage) {
    return res.status(400).json({ message: '번역 기록 저장에 필요한 정보가 부족합니다.' });
  }

  const row = createConversation(req.user.id, {
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage
  });

  res.status(201).json({
    id: row.id,
    originalText: row.original_text,
    translatedText: row.translated_text,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    createdAt: `${row.created_at}Z`
  });
});

router.get('/:id', (req, res) => {
  const conversation = findConversation(req.user.id, Number(req.params.id));
  if (!conversation) {
    return res.status(404).json({ message: '번역 기록을 찾을 수 없습니다.' });
  }

  res.json({
    id: conversation.id,
    originalText: conversation.original_text,
    translatedText: conversation.translated_text,
    sourceLanguage: conversation.source_language,
    targetLanguage: conversation.target_language,
    createdAt: `${conversation.created_at}Z`
  });
});

router.delete('/:id', (req, res) => {
  const result = deleteConversation(req.user.id, Number(req.params.id));
  if (result.changes === 0) {
    return res.status(404).json({ message: '번역 기록을 찾을 수 없습니다.' });
  }
  res.status(204).send();
});

export default router;
