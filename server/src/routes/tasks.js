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
  const userId = req.user._id;
  const all = await Task.find({ userId }).sort({ order: 1, createdAt: 1 }).lean();

  const day = new Date(date + 'T00:00:00Z');
  const dow = day.getUTCDay();
  const dom = day.getUTCDate();

  const includeForDate = (t) => {
    // Legacy: original single-date tasks should appear on their date and carry if enabled
    if (t.date) {
      if (t.date === date) return true;
      if (t.carryForward && !t.done && t.date < date) return true;
    }
    // Recurrence-aware tasks
    const r = t.recurrence || { type: 'daily' };
    // Only show tasks for today or future relative to their start (creation) date
    if (t.date && date < t.date) return false;
    if (r.endDate && r.endDate < date) return false;
    switch (r.type) {
      case 'one-time':
        return t.dueAt ? (new Date(t.dueAt).toISOString().slice(0,10) === date) : (t.date === date);
      case 'daily':
        return true;
      case 'weekly':
        return Array.isArray(r.daysOfWeek) ? r.daysOfWeek.includes(dow) : false;
      case 'monthly':
        return r.dayOfMonth ? r.dayOfMonth === dom : false;
      case 'yearly':
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        const yyyyMmDd = (dt) => [dt.getUTCFullYear(), dt.getUTCMonth()+1, dt.getUTCDate()].join('-');
        const due = d.toISOString().slice(5,10); // MM-DD
        const cur = (day.toISOString().slice(5,10));
        return due === cur;
      default:
        return false;
    }
  };

  const tasks = all
    .filter(includeForDate)
    .map(t => ({
      ...t,
      // present per-date done: if completedOnDates contains this date, treat as done
      done: Array.isArray(t.completedOnDates) ? t.completedOnDates.includes(date) : t.done,
    }));

  res.json({ tasks });
});

router.post('/', requireAuth, async (req, res) => {
  const { date, text, priority, labels, carryForward, description, dueAt, recurrence } = req.body;
  if (!date || !text) return res.status(400).json({ error: 'date and text required' });
  // Determine next order index for this date
  const last = await Task.findOne({ userId: req.user._id, date }).sort({ order: -1 }).lean();
  const nextOrder = (last?.order ?? -1) + 1;
  const task = await Task.create({ userId: req.user._id, date, text, order: nextOrder, priority, labels, carryForward, description, dueAt, recurrence: recurrence || { type: 'daily' } });
  res.status(201).json({ task });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { done, text, priority, labels, order, dueAt, description, notes, carryForward, recurrence, forDate } = req.body;
  const update = {};
  if (typeof done === 'boolean') {
    if (forDate) {
      // mark per-date completion by pushing/removing date in completedOnDates
      const set = done ? { $addToSet: { completedOnDates: forDate } } : { $pull: { completedOnDates: forDate } };
      const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, set, { new: true });
      if (!task) return res.status(404).json({ error: 'Not found' });
      return res.json({ task });
    }
    update.done = done;
  }
  if (typeof text === 'string') update.text = text;
  if (typeof priority === 'string') update.priority = priority;
  if (Array.isArray(labels)) update.labels = labels;
  if (typeof order === 'number') update.order = order;
  if (typeof dueAt === 'string' || dueAt instanceof Date) update.dueAt = dueAt;
  if (typeof description === 'string') update.description = description;
  if (typeof notes === 'string') update.notes = notes;
  if (typeof carryForward === 'boolean') update.carryForward = carryForward;
  if (recurrence && typeof recurrence === 'object') update.recurrence = recurrence;
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
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
  const userId = req.user._id;
  const bulk = ids.map((id, idx) => ({
    updateOne: { filter: { _id: id, userId }, update: { $set: { order: idx } } }
  }));
  if (bulk.length) await Task.bulkWrite(bulk);
  res.json({ ok: true });
});

export default router;
