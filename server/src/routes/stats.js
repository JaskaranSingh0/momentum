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

    // Fetch superset of tasks (include those whose base date precedes period but may recur/carry forward)
    const endStr = dates[dates.length - 1];
    const startStr = dates[0];
    const [allTasks, allDiaryEntries] = await Promise.all([
      Task.find({ userId: req.user._id, date: { $lte: endStr } }).lean(),
      DiaryEntry.find({ userId: req.user._id }).select('date text mood').lean()
    ]);
    // Filter for period-specific diary entries reused later
    const diaryEntries = allDiaryEntries.filter(e => dates.includes(e.date));

    // Helper replicating inclusion logic from tasks route for arbitrary date
    const includeForDate = (t, curDate) => {
      // Skip tasks that start after current date
      if (t.date && curDate < t.date) return false;
      // Respect recurrence endDate if present
      const r = t.recurrence || { type: 'daily' };
      if (r.endDate && r.endDate < curDate) return false;
      // Legacy & carry-forward behavior for single-date tasks
      if (!r || r.type === 'one-time' || !t.recurrence || r.type === 'daily' && t.recurrence?.type === undefined) {
        // Treat tasks without explicit recurrence as base + optional carryForward
        if (t.date === curDate) return true;
        if (t.carryForward && !t.done && t.date < curDate) return true;
      }
      switch (r.type) {
        case 'one-time':
          if (t.dueAt) {
            return new Date(t.dueAt).toISOString().slice(0,10) === curDate;
          }
          return t.date === curDate;
        case 'daily':
          return true; // after start date & before endDate already validated
        case 'weekly': {
          const dow = new Date(curDate + 'T00:00:00Z').getUTCDay();
          return Array.isArray(r.daysOfWeek) ? r.daysOfWeek.includes(dow) : false;
        }
        case 'monthly': {
          if (!r.dayOfMonth) return false;
          const dom = new Date(curDate + 'T00:00:00Z').getUTCDate();
            return r.dayOfMonth === dom;
        }
        case 'yearly': {
          if (!t.dueAt) return false;
          const due = new Date(t.dueAt).toISOString().slice(5,10); // MM-DD
          const cur = curDate.slice(5,10);
          return due === cur;
        }
        default:
          return false;
      }
    };

    const byPriority = { low: 0, medium: 0, high: 0 };
    const labelCounts = new Map();

    const dailyCompleted = [];
    const dailyTotal = [];
    let totalTasks = 0;
    let completedTasks = 0;

    for (const day of dates) {
      let dayCompleted = 0;
      let dayTotal = 0;
      for (const t of allTasks) {
        if (!includeForDate(t, day)) continue;
        dayTotal++;
        // per-date done logic
        const isDone = Array.isArray(t.completedOnDates) ? t.completedOnDates.includes(day) : (t.date === day ? t.done : false);
        if (isDone) dayCompleted++;
        // aggregate priority & labels per occurrence (gives weight to recurring occurrences)
        if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
        (t.labels || []).forEach(l => { if (!l) return; labelCounts.set(l, (labelCounts.get(l)||0) + 1); });
      }
      dailyCompleted.push(dayCompleted);
      dailyTotal.push(dayTotal);
      totalTasks += dayTotal;
      completedTasks += dayCompleted;
    }

    const completionRate = totalTasks ? completedTasks / totalTasks : 0;
    const topLabels = [...labelCounts.entries()]
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([label,count]) => ({ label, count }));

    // Productivity streak (consecutive days with >=1 completed task) using occurrence counts
    let prodStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      if (dailyCompleted[i] > 0) prodStreak++; else break;
    }

    // Diary streak (consecutive days with a non-empty diary)
    let diaryStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const day = dates[i];
      const entry = diaryEntries.find(e => e.date === day);
      if (entry && entry.text && entry.text.trim().length > 0) diaryStreak++; else break;
    }

    // Compute all-time longest productivity streak (based on days with >=1 completed occurrence)
    const completionDateSet = new Set();
    for (const t of allTasks) {
      if (Array.isArray(t.completedOnDates) && t.completedOnDates.length) {
        t.completedOnDates.forEach(d => completionDateSet.add(d));
      } else if (t.done && t.date) {
        completionDateSet.add(t.date);
      }
    }
    const sortedCompletionDates = [...completionDateSet].sort();
    const dayMs = 86400000;
    let longestProdStreak = 0;
    let curRun = 0;
    let prevDate = null;
    for (const d of sortedCompletionDates) {
      if (!prevDate) {
        curRun = 1;
      } else {
        const prev = new Date(prevDate + 'T00:00:00Z').getTime();
        const cur = new Date(d + 'T00:00:00Z').getTime();
        if ((cur - prev) === dayMs) {
          curRun++;
        } else {
          curRun = 1;
        }
      }
      if (curRun > longestProdStreak) longestProdStreak = curRun;
      prevDate = d;
    }

    // Compute all-time longest diary streak
    const diaryDateSet = new Set();
    allDiaryEntries.forEach(e => { if (e.text && e.text.trim()) diaryDateSet.add(e.date); });
    const sortedDiaryDates = [...diaryDateSet].sort();
    let longestDiaryStreak = 0; curRun = 0; prevDate = null;
    for (const d of sortedDiaryDates) {
      if (!prevDate) {
        curRun = 1;
      } else {
        const prev = new Date(prevDate + 'T00:00:00Z').getTime();
        const cur = new Date(d + 'T00:00:00Z').getTime();
        if ((cur - prev) === dayMs) curRun++; else curRun = 1;
      }
      if (curRun > longestDiaryStreak) longestDiaryStreak = curRun;
      prevDate = d;
    }

    // Longest diary streak within selected period
    let longestDiaryStreakPeriod = 0; curRun = 0;
    for (const day of dates) {
      const entry = diaryEntries.find(e => e.date === day && e.text && e.text.trim());
      if (entry) { curRun++; if (curRun > longestDiaryStreakPeriod) longestDiaryStreakPeriod = curRun; }
      else curRun = 0;
    }

    // Longest productivity streak within selected period
    let longestProdStreakPeriod = 0; curRun = 0;
    for (const count of dailyCompleted) {
      if (count > 0) { curRun++; if (curRun > longestProdStreakPeriod) longestProdStreakPeriod = curRun; }
      else curRun = 0;
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

    // dailyCompleted & dailyTotal already built above

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
      daily: { dates, completed: dailyCompleted, total: dailyTotal },
      allTime: {
        prodLongest: longestProdStreak,
        diaryLongest: longestDiaryStreak
      },
      periodLongest: {
        prod: longestProdStreakPeriod,
        diary: longestDiaryStreakPeriod
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats_failed' });
  }
});

export default router;
