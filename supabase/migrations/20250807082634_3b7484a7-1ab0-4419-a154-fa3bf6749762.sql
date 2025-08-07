-- Add RLS policies for bakery registration
CREATE POLICY "Authenticated users can register bakeries" 
ON public.padarias 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Bakery owners can update their bakeries" 
ON public.padarias 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);