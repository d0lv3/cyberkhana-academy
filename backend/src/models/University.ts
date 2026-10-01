import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A university an admin added to the list members pick from, beside the
 * built-in ones in shared/universities.ts.
 *
 * A profile stores the university's NAME, not this document's id, exactly as
 * it does for a built-in one. So renaming one here has to carry the members
 * who chose it (routes/universities.ts does), and removing one leaves their
 * profiles as they were: it only stops being offered.
 */
export interface IUniversity extends Document {
  /** Canonical English name: what a profile stores. */
  name: string;
  /** The name lowercased and tidied (shared/universities universityKey), so
   *  "Al-Noor" and "al-noor" cannot both be added. */
  key: string;
  ar?: string;
  type: 'public' | 'private';
  addedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversity>(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true },
    ar: { type: String, trim: true },
    type: { type: String, enum: ['public', 'private'], required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IUniversity>('University', UniversitySchema);
