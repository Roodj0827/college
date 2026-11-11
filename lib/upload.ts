'use client';
import { createClient } from '@/lib/supabase/client';

export function safeName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** Televersement direct navigateur -> Supabase Storage (la RLS Storage s'applique). */
export async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  return path;
}
