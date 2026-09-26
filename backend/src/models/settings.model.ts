import mongoose, { Schema, Document } from "mongoose";

export interface ICampusImage {
  url: string;
  publicId?: string;
  order?: number;
}

export interface ISystemSettings extends Document {
  institutionId?: mongoose.Types.ObjectId; // References Institution

  // General
  systemName: string;
  instituteName: string;
  academicYear: string;

  // Authentication
  googleLoginEnabled: boolean;
  domainRestriction: string;
  sessionTimeout: number; // 30, 60, 120

  // Feedback
  anonymousFeedback: boolean;
  oneSubmissionPerStudent: boolean; // Always enabled
  autoActivateBasedOnDate: boolean;

  // Appearance
  themeMode: "light" | "dark";
  logoUrl?: string;
  campusImageUrl?: string;
  campusImages?: ICampusImage[];

  createdAt: Date;
  updatedAt: Date;
}

const CampusImageSchema = new Schema<ICampusImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    order: { type: Number, default: 1 },
  },
  { _id: false }
);

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", unique: true, sparse: true, index: true },
    systemName: { type: String, required: true, default: "Acadexa" },
    instituteName: { type: String, required: true, default: "Institution" },
    academicYear: { type: String, required: true, default: "2026-27" },

    googleLoginEnabled: { type: Boolean, required: true, default: true },
    domainRestriction: { type: String, default: "" },
    sessionTimeout: { type: Number, required: true, default: 30 },

    anonymousFeedback: { type: Boolean, required: true, default: true },
    oneSubmissionPerStudent: { type: Boolean, required: true, default: true },
    autoActivateBasedOnDate: { type: Boolean, required: true, default: true },

    themeMode: { type: String, enum: ["light", "dark"], default: "dark" },
    logoUrl: { type: String, default: "" },
    campusImageUrl: { type: String, default: "" },
    campusImages: { type: [CampusImageSchema], default: [] },
  },
  { timestamps: true }
);

SystemSettingsSchema.pre("validate", function (next) {
  if (Array.isArray(this.campusImages)) {
    this.campusImages = (this.campusImages as any[]).map((img: any, idx: number) => {
      if (typeof img === "string") {
        return { url: img, publicId: "", order: idx + 1 };
      }
      if (img && typeof img === "object") {
        return {
          url: img.url || "",
          publicId: img.publicId || "",
          order: img.order || idx + 1,
        };
      }
      return { url: "", publicId: "", order: idx + 1 };
    }).filter((img: any) => Boolean(img.url));
  }
  next();
});

export const SystemSettings = mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
export default SystemSettings;
