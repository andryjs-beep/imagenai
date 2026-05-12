import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneratedImage extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  revisedPrompt?: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  model: 'gpt-4o' | 'gpt-4o-mini';
  size: string;
  createdAt: Date;
}

const GeneratedImageSchema = new Schema<IGeneratedImage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    revisedPrompt: {
      type: String,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      enum: ['gpt-4o', 'gpt-4o-mini'],
      default: 'gpt-4o-mini',
    },
    size: {
      type: String,
      default: '1024x1024',
    },
  },
  {
    timestamps: true,
  }
);

const GeneratedImage =
  mongoose.models.GeneratedImage ||
  mongoose.model<IGeneratedImage>('GeneratedImage', GeneratedImageSchema);

export default GeneratedImage;
