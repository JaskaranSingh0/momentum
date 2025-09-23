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
    notes: { type: String, default: '' },
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
