-- Add user_id column to padarias table
ALTER TABLE padarias ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_padarias_user_id ON padarias(user_id);

-- Update RLS policies for padarias
DROP POLICY IF EXISTS "Bakery owners can update their bakeries" ON padarias;

CREATE POLICY "Bakery owners can update their bakeries"
ON padarias
FOR UPDATE
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Allow bakeries to view their own data
CREATE POLICY "Bakery owners can view their own bakery"
ON padarias
FOR SELECT
USING (user_id = auth.uid() OR status_ativa = true OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Update insert policy to set user_id automatically
DROP POLICY IF EXISTS "Authenticated users can register bakeries" ON padarias;

CREATE POLICY "Authenticated users can register bakeries"
ON padarias
FOR INSERT
WITH CHECK (user_id = auth.uid());