import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneratedImage extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  revisedPrompt?: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  aiModel: string;
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
    aiModel: {
      type: String,
      default: 'dall-e-3',
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
