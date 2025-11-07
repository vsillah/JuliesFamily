import { db } from "../server/db";
import { emailTemplates } from "../shared/schema";
import { eq } from "drizzle-orm";

const templates = [
  {
    name: "donation_thank_you",
    subject: "Thank You for Your Generous Donation! 💛",
    variables: ["donorName", "amount", "date", "organizationName"],
    htmlBody: String.raw`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px 20px; background: #fff; }
    .highlight { background: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #D97706; }
    .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 14px; color: #6B7280; }
    .button { display: inline-block; background: #D97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>❤️ Thank You!</h1>
  </div>
  <div class="content">
    <p>Dear {{donorName}},</p>
    
    <p>We are deeply grateful for your generous donation to Julie's Family Learning Program. Your support makes a real difference in the lives of families in our community.</p>
    
    <div class="highlight">
      <p style="margin: 0; font-size: 14px; color: #6B7280;">Your donation:</p>
      <p class="amount">\${{amount}}</p>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">Received on {{date}}</p>
    </div>
    
    <p><strong>Your impact:</strong></p>
    <ul>
      <li>Helps provide educational resources for adult learners</li>
      <li>Supports children's programs and activities</li>
      <li>Enables workforce development training</li>
      <li>Strengthens our community through family literacy</li>
    </ul>
    
    <p>We'll send you an official tax receipt shortly with all the details you need for your records.</p>
    
    <p>Thank you for believing in our mission and investing in the future of our community.</p>
    
    <p>With heartfelt gratitude,<br>
    <strong>The Team at Julie's Family Learning Program</strong></p>
  </div>
  <div class="footer">
    <p>Julie's Family Learning Program<br>
    Empowering families through education</p>
    <p style="font-size: 12px; margin-top: 10px;">This email was sent because you made a donation to our organization.</p>
  </div>
</body>
</html>
    `,
    textBody: String.raw`Dear {{donorName}},

We are deeply grateful for your generous donation to Julie's Family Learning Program. Your support makes a real difference in the lives of families in our community.

Your donation: \${{amount}}
Received on: {{date}}

Your impact:
- Helps provide educational resources for adult learners
- Supports children's programs and activities
- Enables workforce development training
- Strengthens our community through family literacy

We'll send you an official tax receipt shortly with all the details you need for your records.

Thank you for believing in our mission and investing in the future of our community.

With heartfelt gratitude,
The Team at Julie's Family Learning Program

---
Julie's Family Learning Program
Empowering families through education`,
    isActive: true,
  },
  {
    name: "donation_receipt",
    subject: "Your Tax-Deductible Donation Receipt",
    variables: ["donorName", "donorEmail", "amount", "date", "donationId", "taxId"],
    htmlBody: String.raw`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #1F2937; color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; background: #fff; }
    .receipt-box { border: 2px solid #D97706; padding: 20px; margin: 20px 0; background: #FFFBEB; }
    .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
    .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
    .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 14px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 Official Donation Receipt</h1>
  </div>
  <div class="content">
    <p>Dear {{donorName}},</p>
    
    <p>Thank you for your tax-deductible donation to Julie's Family Learning Program. This letter serves as your official receipt for tax purposes.</p>
    
    <div class="receipt-box">
      <h3 style="margin-top: 0; color: #D97706;">Donation Details</h3>
      <div class="receipt-row">
        <span>Donor Name:</span>
        <span><strong>{{donorName}}</strong></span>
      </div>
      <div class="receipt-row">
        <span>Email:</span>
        <span>{{donorEmail}}</span>
      </div>
      <div class="receipt-row">
        <span>Date:</span>
        <span>{{date}}</span>
      </div>
      <div class="receipt-row">
        <span>Donation ID:</span>
        <span>{{donationId}}</span>
      </div>
      <div class="receipt-row">
        <span>Amount Donated:</span>
        <span><strong>\${{amount}}</strong></span>
      </div>
    </div>
    
    <p><strong>Tax Information:</strong></p>
    <p>Julie's Family Learning Program is a registered 501(c)(3) nonprofit organization.<br>
    <strong>Tax ID (EIN):</strong> {{taxId}}</p>
    
    <p style="background: #F3F4F6; padding: 15px; border-radius: 6px; font-size: 14px;">
      <strong>Note:</strong> No goods or services were provided in exchange for this donation. Please retain this receipt for your tax records.
    </p>
    
    <p>If you have any questions about your donation or need additional documentation, please don't hesitate to contact us.</p>
    
    <p>Thank you again for your generous support!</p>
    
    <p>Sincerely,<br>
    <strong>Julie's Family Learning Program</strong></p>
  </div>
  <div class="footer">
    <p>Julie's Family Learning Program<br>
    A 501(c)(3) Nonprofit Organization | Tax ID: {{taxId}}</p>
    <p style="font-size: 12px; margin-top: 10px;">Please save this receipt for your tax records.</p>
  </div>
</body>
</html>
    `,
    textBody: String.raw`OFFICIAL DONATION RECEIPT
Julie's Family Learning Program

Dear {{donorName}},

Thank you for your tax-deductible donation to Julie's Family Learning Program. This letter serves as your official receipt for tax purposes.

DONATION DETAILS
----------------
Donor Name: {{donorName}}
Email: {{donorEmail}}
Date: {{date}}
Donation ID: {{donationId}}
Amount Donated: \${{amount}}

TAX INFORMATION
---------------
Julie's Family Learning Program is a registered 501(c)(3) nonprofit organization.
Tax ID (EIN): {{taxId}}

Note: No goods or services were provided in exchange for this donation. Please retain this receipt for your tax records.

If you have any questions about your donation or need additional documentation, please don't hesitate to contact us.

Thank you again for your generous support!

Sincerely,
Julie's Family Learning Program

---
A 501(c)(3) Nonprofit Organization | Tax ID: {{taxId}}
Please save this receipt for your tax records.`,
    isActive: true,
  },
  {
    name: "lead_confirmation",
    subject: "Welcome to Julie's Family Learning Program! 🌟",
    variables: ["firstName", "persona", "leadMagnet"],
    htmlBody: String.raw`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 30px 20px; background: #fff; }
    .card { background: #F0FDF4; border: 1px solid #86EFAC; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #F9FAFB; padding: 20px; text-align: center; font-size: 14px; color: #6B7280; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌟 Welcome!</h1>
  </div>
  <div class="content">
    <p>Hi {{firstName}},</p>
    
    <p>Thank you for your interest in Julie's Family Learning Program! We're excited to connect with you and help you on your journey.</p>
    
    <div class="card">
      <h3 style="margin-top: 0; color: #059669;">✅ Your request has been received</h3>
      <p style="margin-bottom: 0;">{{leadMagnet}}</p>
    </div>
    
    <p><strong>What's next?</strong></p>
    <ul>
      <li>Check your inbox for your requested resource</li>
      <li>Explore our programs and upcoming events</li>
      <li>Reach out if you have any questions</li>
    </ul>
    
    <p>We'll keep you updated on new programs, upcoming events, and opportunities that might interest you.</p>
    
    <center>
      <a href="https://juliesfamilylearning.org" class="button">Visit Our Website</a>
    </center>
    
    <p>Looking forward to working with you!</p>
    
    <p>Warm regards,<br>
    <strong>The Team at Julie's Family Learning Program</strong></p>
  </div>
  <div class="footer">
    <p>Julie's Family Learning Program<br>
    Empowering families through education</p>
    <p style="font-size: 12px; margin-top: 10px;">You're receiving this email because you signed up on our website.</p>
  </div>
</body>
</html>
    `,
    textBody: String.raw`Hi {{firstName}},

Thank you for your interest in Julie's Family Learning Program! We're excited to connect with you and help you on your journey.

✅ Your request has been received
{{leadMagnet}}

What's next?
- Check your inbox for your requested resource
- Explore our programs and upcoming events
- Reach out if you have any questions

We'll keep you updated on new programs, upcoming events, and opportunities that might interest you.

Visit our website: https://juliesfamilylearning.org

Looking forward to working with you!

Warm regards,
The Team at Julie's Family Learning Program

---
Julie's Family Learning Program
Empowering families through education
You're receiving this email because you signed up on our website.`,
    isActive: true,
  },
];

async function seedEmailTemplates() {
  console.log("🌱 Seeding email templates...");

  for (const template of templates) {
    try {
      // Check if template already exists
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, template.name));

      if (existing) {
        console.log(`✅ Template "${template.name}" already exists, updating...`);
        await db
          .update(emailTemplates)
          .set({
            subject: template.subject,
            htmlBody: template.htmlBody,
            textBody: template.textBody,
            variables: template.variables,
            isActive: template.isActive,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplates.name, template.name));
      } else {
        console.log(`✨ Creating template "${template.name}"...`);
        await db.insert(emailTemplates).values(template);
      }
    } catch (error) {
      console.error(`❌ Error seeding template "${template.name}":`, error);
    }
  }

  console.log("✅ Email templates seeded successfully!");
  process.exit(0);
}

seedEmailTemplates();
