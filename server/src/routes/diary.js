import { Router } from 'express';
import { DiaryEntry } from '../models.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });
  const entry = await DiaryEntry.findOne({ userId: req.user._id, date }).lean();
  res.json({ entry: entry || { date, text: '' } });
});

router.put('/', requireAuth, async (req, res) => {
  const { date, text, mood } = req.body;
  if (!date || typeof text !== 'string') return res.status(400).json({ error: 'date and text required' });
  const allowedMoods = ['sad','meh','calm','happy','tired','stressed','anxious','excited','focused','angry'];
  if (mood && !allowedMoods.includes(mood)) {
    return res.status(400).json({ error: 'invalid mood' });
  }
  const set = { text };
  if (typeof mood !== 'undefined') set.mood = mood || null;
  const entry = await DiaryEntry.findOneAndUpdate(
    { userId: req.user._id, date },
    { $set: set },
    { upsert: true, new: true }
  );
  res.json({ entry });
});

export default router;
