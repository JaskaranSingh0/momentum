import { Router } from 'express';
import { Task, DiaryEntry } from '../models.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

router.get('/', requireAuth, async (req, res) => {
  const { period = '7' } = req.query;
  const days = Math.max(1, Math.min(90, parseInt(period, 10) || 7));
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }

  // Task completion rate
  const tasks = await Task.find({ userId: req.user._id, date: { $in: dates } }).lean();
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const completionRate = total ? completed / total : 0;

  // Productivity streak (consecutive days with >=1 completed task)
  let prodStreak = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const day = dates[i];
    const hasCompleted = tasks.some(t => t.date === day && t.done);
    if (hasCompleted) prodStreak++; else break;
  }

  // Diary streak (consecutive days with a non-empty diary)
  const diaryEntries = await DiaryEntry.find({ userId: req.user._id, date: { $in: dates } }).lean();
  let diaryStreak = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const day = dates[i];
    const entry = diaryEntries.find(e => e.date === day);
    if (entry && entry.text && entry.text.trim().length > 0) diaryStreak++; else break;
  }

  // Weekly chart (current week Mon-Sun)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDates.push(formatDate(d));
  }
  const weekTasks = tasks.filter(t => weekDates.includes(t.date));
  const weeklyCounts = weekDates.map(d => weekTasks.filter(t => t.date === d && t.done).length);

  res.json({
    completionRate,
    prodStreak,
    diaryStreak,
    weekly: { dates: weekDates, completed: weeklyCounts }
  });
});

export default router;
