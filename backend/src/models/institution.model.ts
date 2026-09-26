import mongoose, { Schema, Document } from "mongoose";

export type InstitutionStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "active"
  | "suspended"
  | "rejected";

export type InstitutionType =
  | "Autonomous Institute"
  | "State University"
  | "Affiliated College"
  | "Deemed University"
  | "Private University"
  | "Institute of National Importance"
  | "Polytechnic / Diploma"
  | "Other";

export interface ICampusImage {
  url: string;
  publicId?: string;
  order?: number;
}

export interface IInstitutionSettings {
  systemName: string;
  domainRestriction: string;
  googleLoginEnabled: boolean;
  sessionTimeout: number;
  anonymousFeedback: boolean;
  themeMode: "light" | "dark";
  accentColor?: string;
  logoUrl?: string;
  campusImageUrl?: string;
  campusImages?: ICampusImage[];
  allowPublicStats?: boolean;
}

export interface IInstitution extends Document {
  institutionId: string; // e.g. "INS-2026-0001"
  name: string; // Kamla Nehru Institute of Technology
  slug: string; // "knit" -> {slug}.acadexa-fb.vercel.app
  type: InstitutionType;
  website: string;
  officialEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  affiliationDetails?: string;
  approxStudents?: number;
  approxFaculty?: number;
  logoUrl?: string;
  status: InstitutionStatus;
  statusReason?: string; // Reason when suspended or rejected
  settings: IInstitutionSettings;
  adminUserId?: mongoose.Types.ObjectId; // References User (the root institution admin)
  applicationId?: mongoose.Types.ObjectId; // References InstitutionApplication
  approvedAt?: Date;
  suspendedAt?: Date;
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

const InstitutionSettingsSchema = new Schema<IInstitutionSettings>(
  {
    systemName: { type: String, default: "Acadexa" },
    domainRestriction: { type: String, default: "" },
    googleLoginEnabled: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 30 },
    anonymousFeedback: { type: Boolean, default: true },
    themeMode: { type: String, enum: ["light", "dark"], default: "dark" },
    accentColor: { type: String, default: "#3b82f6" },
    logoUrl: { type: String, default: "" },
    campusImageUrl: { type: String, default: "" },
    campusImages: { type: [CampusImageSchema], default: [] },
    allowPublicStats: { type: Boolean, default: true },
  },
  { _id: false }
);

InstitutionSettingsSchema.pre("validate", function (next) {
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

const InstitutionSchema = new Schema<IInstitution>(
  {
    institutionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      default: "Autonomous Institute",
    },
    website: {
      type: String,
      required: true,
      trim: true,
    },
    officialEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    affiliationDetails: { type: String, trim: true },
    approxStudents: { type: Number, default: 0 },
    approxFaculty: { type: Number, default: 0 },
    logoUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "active", "suspended", "rejected"],
      default: "active",
      index: true,
    },
    statusReason: { type: String, default: "" },
    settings: {
      type: InstitutionSettingsSchema,
      default: () => ({}),
    },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "InstitutionApplication",
    },
    approvedAt: { type: Date },
    suspendedAt: { type: Date },
  },
  { timestamps: true }
);

export const Institution = mongoose.model<IInstitution>(
  "Institution",
  InstitutionSchema
);
export default Institution;
