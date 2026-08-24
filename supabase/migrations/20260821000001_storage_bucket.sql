-- Create a public bucket for document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Allow public read access to any files in the 'documents' bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

-- Allow public upload access to the 'documents' bucket
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
