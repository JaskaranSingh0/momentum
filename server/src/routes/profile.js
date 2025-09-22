import { Router } from 'express';
import { Task, DiaryEntry } from '../models.js';
import { User } from '../passport.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.patch('/theme', requireAuth, async (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) return res.status(400).json({ error: 'theme must be light or dark' });
  await User.updateOne({ _id: req.user._id }, { $set: { theme } });
  res.json({ ok: true, theme });
});

router.get('/export', requireAuth, async (req, res) => {
  const [tasks, diary] = await Promise.all([
    Task.find({ userId: req.user._id }).lean(),
    DiaryEntry.find({ userId: req.user._id }).lean()
  ]);
  const data = { user: req.user, tasks, diary };
  res.setHeader('Content-Disposition', 'attachment; filename=momentum-export.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

router.delete('/', requireAuth, async (req, res) => {
  await Promise.all([
    Task.deleteMany({ userId: req.user._id }),
    DiaryEntry.deleteMany({ userId: req.user._id }),
    User.deleteOne({ _id: req.user._id })
  ]);
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
});

export default router;
