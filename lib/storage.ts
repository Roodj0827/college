import { createClient } from '@/lib/supabase/server';

/** Renvoie une URL lisible : lien externe tel quel, sinon URL signee (1 h) du fichier Storage. */
export async function resolveFileUrl(bucket: string, value: string | null, expiresIn = 3600) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const supabase = createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(value, expiresIn);
  return data?.signedUrl ?? null;
}
