import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: String, index: true, required: true }, // YYYY-MM-DD
    text: { type: String, required: true },
    done: { type: Boolean, default: false }
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
