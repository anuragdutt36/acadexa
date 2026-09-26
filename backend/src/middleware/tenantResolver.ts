import { Request, Response, NextFunction } from "express";
import { Institution, IInstitution } from "../models/institution.model.js";
import { CustomError } from "./errorHandler.js";

import mongoose from "mongoose";

// Extend Express Request interface to include tenant institution context
declare global {
  namespace Express {
    interface Request {
      institution?: IInstitution;
      institutionId?: any;
      user?: any;
    }
  }
}

export class TenantResolver {
  // Extract slug from hostname (subdomain) or headers
  static extractTenantIdentifier(req: Request): { slug?: string; institutionId?: string } {
    // 1. Check custom headers
    const headerSlug = req.headers["x-institution-slug"] as string;
    const headerId = req.headers["x-institution-id"] as string;
    if (headerSlug) return { slug: headerSlug.toLowerCase().trim() };
    if (headerId) return { institutionId: headerId.trim() };

    // 2. Check query params or route params if available
    const querySlug = req.query.institutionSlug as string;
    if (querySlug) return { slug: querySlug.toLowerCase().trim() };

    // 3. Check Subdomain (e.g. knit.acadexa-fb.vercel.app -> "knit")
    const hostname = req.hostname || req.headers.host?.split(":")[0] || "";
    const cleanHost = hostname.toLowerCase().trim();

    // Ignore apex domains, platform domains, and localhost apex
    const platformHosts = [
      "acadexa-fb.vercel.app",
      "acadexa.in",
      "acadexa.com",
      "localhost",
      "127.0.0.1",
    ];

    if (!platformHosts.includes(cleanHost)) {
      // Check if it ends with one of the platform domains
      for (const pHost of platformHosts) {
        if (cleanHost.endsWith(`.${pHost}`)) {
          const subdomain = cleanHost.replace(`.${pHost}`, "");
          if (subdomain && subdomain !== "www" && subdomain !== "app" && subdomain !== "platform") {
            return { slug: subdomain };
          }
        }
      }

      // Check generic multi-part subdomain (subdomain.domain.tld)
      const parts = cleanHost.split(".");
      if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "app") {
        return { slug: parts[0] };
      }
    }

    return {};
  }

  // Middleware: Resolves tenant context and attaches req.institution and req.institutionId
  static async resolveTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, institutionId } = TenantResolver.extractTenantIdentifier(req);

      let institution: IInstitution | null = null;

      if (slug) {
        institution = await Institution.findOne({ slug: new RegExp(`^${slug}$`, "i") });
      } else if (institutionId) {
        if (mongoose.Types.ObjectId.isValid(institutionId)) {
          institution = await Institution.findById(institutionId);
        }
        if (!institution) {
          institution = await Institution.findOne({
            $or: [
              { institutionId: institutionId.toUpperCase() },
              { institutionId: institutionId },
              { slug: institutionId.toLowerCase() },
            ],
          });
        }
      } else if (req.user?.institutionId) {
        // From authenticated JWT user session
        institution = await Institution.findById(req.user.institutionId);
      }

      // Multi-tenant isolation: No fallback to hardcoded default institution
      if (institution) {
        if (institution.status === "suspended") {
          return res.status(403).json({
            success: false,
            message: `Portal access for ${institution.name} is currently suspended. Please contact platform administration.`,
            isSuspended: true,
            statusReason: institution.statusReason || "Tenant Suspended",
          });
        }
        req.institution = institution;
        req.institutionId = institution._id;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  // Middleware: Requires tenant to exist and be active
  static requireActiveTenant(req: Request, res: Response, next: NextFunction) {
    if (!req.institution) {
      return res.status(404).json({
        success: false,
        message: "Institution tenant portal not found.",
      });
    }

    if (req.institution.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: `Portal access for ${req.institution.name} is currently suspended.`,
        isSuspended: true,
      });
    }

    next();
  }
}

export const resolveTenant = TenantResolver.resolveTenant;
export const requireActiveTenant = TenantResolver.requireActiveTenant;
