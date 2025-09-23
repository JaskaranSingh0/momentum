import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: String, index: true, required: true }, // YYYY-MM-DD
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false, index: true },
    // Enhanced fields
    order: { type: Number, default: 0, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    labels: { type: [String], default: [] },
    dueAt: { type: Date, default: null },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    recurrence: {
      type: new mongoose.Schema({
        type: { type: String, enum: ['one-time', 'daily', 'weekly', 'monthly', 'yearly'], default: 'daily' },
        daysOfWeek: { type: [Number], default: [] }, // 0=Sun..6=Sat for weekly
        dayOfMonth: { type: Number, default: null }, // 1..31 for monthly
        endDate: { type: String, default: null }, // YYYY-MM-DD
      }, { _id: false }),
      default: { type: 'daily', daysOfWeek: [], dayOfMonth: null, endDate: null },
    },
    completedOnDates: { type: [String], default: [] }, // YYYY-MM-DD occurrences marked done
    carryForward: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const diarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: String, index: true, required: true }, // YYYY-MM-DD
    text: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export const DiaryEntry = mongoose.models.DiaryEntry || mongoose.model('DiaryEntry', diarySchema);
