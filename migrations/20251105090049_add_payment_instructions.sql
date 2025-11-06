-- Add payment instruction fields to profiles table
-- This allows tutors to specify how students should pay them directly

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
ADD COLUMN IF NOT EXISTS venmo_handle TEXT,
ADD COLUMN IF NOT EXISTS paypal_email TEXT,
ADD COLUMN IF NOT EXISTS zelle_phone TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT,
ADD COLUMN IF NOT EXISTS custom_payment_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN profiles.payment_instructions IS 'General payment instructions for students (e.g., "Pay via Venmo after booking")';
COMMENT ON COLUMN profiles.venmo_handle IS 'Tutor''s Venmo username (without @)';
COMMENT ON COLUMN profiles.paypal_email IS 'Tutor''s PayPal email address';
COMMENT ON COLUMN profiles.zelle_phone IS 'Tutor''s Zelle phone number or email';
COMMENT ON COLUMN profiles.stripe_payment_link IS 'Tutor''s Stripe Payment Link URL';
COMMENT ON COLUMN profiles.custom_payment_url IS 'Custom payment page URL (for other payment processors)';
