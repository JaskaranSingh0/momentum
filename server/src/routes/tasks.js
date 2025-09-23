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
  const tasks = await Task.find({ userId: req.user._id, date }).sort({ order: 1, createdAt: 1 }).lean();
  res.json({ tasks });
});

router.post('/', requireAuth, async (req, res) => {
  const { date, text, priority, labels } = req.body;
  if (!date || !text) return res.status(400).json({ error: 'date and text required' });
  // Determine next order index for this date
  const last = await Task.findOne({ userId: req.user._id, date }).sort({ order: -1 }).lean();
  const nextOrder = (last?.order ?? -1) + 1;
  const task = await Task.create({ userId: req.user._id, date, text, order: nextOrder, priority, labels });
  res.status(201).json({ task });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { done, text, priority, labels, order, dueAt, notes } = req.body;
  const update = {};
  if (typeof done === 'boolean') update.done = done;
  if (typeof text === 'string') update.text = text;
  if (typeof priority === 'string') update.priority = priority;
  if (Array.isArray(labels)) update.labels = labels;
  if (typeof order === 'number') update.order = order;
  if (typeof dueAt === 'string' || dueAt instanceof Date) update.dueAt = dueAt;
  if (typeof notes === 'string') update.notes = notes;
  const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: update }, { new: true });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json({ task });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await Task.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Reorder tasks for a given date
router.put('/reorder', requireAuth, async (req, res) => {
  const { date, ids } = req.body || {};
  if (!date || !Array.isArray(ids)) return res.status(400).json({ error: 'date and ids required' });
  const userId = req.user._id;
  const bulk = ids.map((id, idx) => ({
    updateOne: { filter: { _id: id, userId, date }, update: { $set: { order: idx } } }
  }));
  if (bulk.length) await Task.bulkWrite(bulk);
  res.json({ ok: true });
});

export default router;
