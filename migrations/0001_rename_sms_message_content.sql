-- Rename message_content to message_template in sms_templates table
ALTER TABLE "sms_templates" RENAME COLUMN "message_content" TO "message_template";
