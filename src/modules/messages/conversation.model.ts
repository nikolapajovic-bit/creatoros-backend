import { Schema, model, type Document, type Types } from "mongoose";

export const CONVERSATION_TYPES = ["brand", "team"] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[]; // korisnici koji učestvuju u razgovoru
  name: string; // naziv brenda/tima (za sada tekstualan, ne relacija)
  type: ConversationType;
  lastMessageAt: Date;
  hiddenFor: Types.ObjectId[]; // korisnici koji su "obrisali" ovaj razgovor kod sebe
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: CONVERSATION_TYPES,
      default: "brand",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    hiddenFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });

export const Conversation = model<IConversation>(
  "Conversation",
  conversationSchema,
);
