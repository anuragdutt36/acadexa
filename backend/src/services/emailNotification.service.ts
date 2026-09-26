import { NotificationLog } from "../models/notificationLog.model.js";
import { env } from "../config/env.js";

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  notificationType: string;
  institutionId?: any;
  applicationId?: any;
}

export class EmailNotificationService {
  private static accessKey: string = env.WEB3FORMS_ACCESS_KEY;

  static async sendNotification(options: EmailOptions): Promise<{ success: boolean; message: string }> {
    const { to, subject, body, notificationType, institutionId, applicationId } = options;

    let deliveryStatus: "sent" | "failed" = "sent";
    let errorMessage: string | undefined = undefined;

    try {
      if (this.accessKey) {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: this.accessKey,
            subject: subject,
            from_name: "Acadexa Platform Administration",
            to_email: to,
            message: body,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as any;
        if (!response.ok || !data.success) {
          deliveryStatus = "failed";
          errorMessage = data.message || `Web3Forms HTTP error ${response.status}`;
        }
      }
    } catch (err: any) {
      deliveryStatus = "failed";
      errorMessage = err.message || "Network error dispatching email via Web3Forms";
    }

    // Always log to NotificationLog collection
    await NotificationLog.create({
      recipientEmail: to,
      subject,
      notificationType,
      institutionId,
      applicationId,
      status: deliveryStatus,
      errorMessage,
      payloadSnippet: body.length > 300 ? body.substring(0, 300) + "..." : body,
      sentAt: new Date(),
    }).catch(() => {});

    return {
      success: deliveryStatus === "sent",
      message: deliveryStatus === "sent" ? "Notification delivered successfully" : (errorMessage || "Notification logged"),
    };
  }

  // Specialized: Send Approval Notice with Activation Link
  static async sendApprovalActivationEmail(params: {
    to: string;
    representativeName: string;
    institutionName: string;
    institutionId: string;
    slug: string;
    activationLink: string;
    referenceId: string;
    instObjId?: any;
    appObjId?: any;
  }) {
    const {
      to,
      representativeName,
      institutionName,
      institutionId,
      slug,
      activationLink,
      referenceId,
      instObjId,
      appObjId,
    } = params;

    const subject = `Congratulations! Application Approved for ${institutionName} [${referenceId}]`;

    const body = `
Dear ${representativeName},

Congratulations! Your application to onboard ${institutionName} to Acadexa has been formally verified and approved.

==================================================
INSTITUTION TENANT DETAILS
==================================================
Institution: ${institutionName}
Tenant Identifier: ${institutionId}
Portal URL Slug: /college/${slug}
Public Portal: https://acadexa-fb.vercel.app/college/${slug}

==================================================
ACCOUNT ACTIVATION & SECURITY
==================================================
An institutional administrator account has been provisioned for this email address (${to}).

To set your permanent password and activate your institutional administrative portal, please click the secure link below:

${activationLink}

* Note: This activation link is unique to your institution and will expire in 7 days.
* For your protection, no permanent passwords are ever transmitted through email.

If you have any questions or require assistance setting up your academic semesters, faculty rosters, or question rubrics, our platform support team is here to assist you.

Sincerely,
Platform Administration Team
Acadexa — Intelligent Academic Feedback & Evaluation Platform
https://acadexa.in
`;

    return this.sendNotification({
      to,
      subject,
      body,
      notificationType: "TENANT_ACTIVATION_LINK",
      institutionId: instObjId,
      applicationId: appObjId,
    });
  }
}
