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
  try {
    const { period = '7' } = req.query;
    const days = Math.max(1, Math.min(90, parseInt(period, 10) || 7));
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);

    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(d));
    }

    // Fetch tasks & diary entries in parallel
    const [tasks, diaryEntries] = await Promise.all([
      Task.find({ userId: req.user._id, date: { $in: dates } }).lean(),
      DiaryEntry.find({ userId: req.user._id, date: { $in: dates } }).lean()
    ]);

    // Task aggregates
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const completionRate = totalTasks ? completedTasks / totalTasks : 0;
    const byPriority = { low: 0, medium: 0, high: 0 };
    tasks.forEach(t => { if (byPriority[t.priority] !== undefined) byPriority[t.priority]++; });

    // Top labels (first 5 by frequency across all labels array)
    const labelCounts = new Map();
    tasks.forEach(t => (t.labels || []).forEach(l => { if(!l) return; labelCounts.set(l, (labelCounts.get(l)||0)+1); }));
    const topLabels = [...labelCounts.entries()]
      .sort((a,b)=> b[1]-a[1])
      .slice(0,5)
      .map(([label,count])=>({ label, count }));

    // Productivity streak (consecutive days with >=1 completed task)
    let prodStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const day = dates[i];
      const hasCompleted = tasks.some(t => t.date === day && t.done);
      if (hasCompleted) prodStreak++; else break;
    }

    // Diary streak (consecutive days with a non-empty diary)
    let diaryStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const day = dates[i];
      const entry = diaryEntries.find(e => e.date === day);
      if (entry && entry.text && entry.text.trim().length > 0) diaryStreak++; else break;
    }

    // Diary metrics
    const diaryEntriesCount = diaryEntries.filter(e => e.text && e.text.trim().length > 0).length;
    let totalWords = 0;
    diaryEntries.forEach(e => {
      if (e.text && e.text.trim()) {
        totalWords += e.text.trim().split(/\s+/).filter(Boolean).length;
      }
    });
    const avgWordsPerEntry = diaryEntriesCount ? Math.round(totalWords / diaryEntriesCount) : 0;
    const moodDistribution = {};
    diaryEntries.forEach(e => { if (e.mood) moodDistribution[e.mood] = (moodDistribution[e.mood]||0)+1; });

    // Daily completed counts for chart
    const dailyCompleted = dates.map(d => tasks.filter(t => t.date === d && t.done).length);

    res.json({
      periodDays: days,
      prodStreak,
      diaryStreak,
      completionRate,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        byPriority,
        topLabels
      },
      diary: {
        entries: diaryEntriesCount,
        avgWordsPerEntry,
        moodDistribution
      },
      daily: { dates, completed: dailyCompleted }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats_failed' });
  }
});

export default router;
