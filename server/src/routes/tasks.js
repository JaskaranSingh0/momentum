import { Router } from 'express';
import { Task } from '../models.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });
  const tasks = await Task.find({ userId: req.user._id, date }).sort({ createdAt: 1 }).lean();
  res.json({ tasks });
});

router.post('/', requireAuth, async (req, res) => {
  const { date, text } = req.body;
  if (!date || !text) return res.status(400).json({ error: 'date and text required' });
  const task = await Task.create({ userId: req.user._id, date, text });
  res.status(201).json({ task });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { done, text } = req.body;
  const update = {};
  if (typeof done === 'boolean') update.done = done;
  if (typeof text === 'string') update.text = text;
  const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: update }, { new: true });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json({ task });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await Task.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
