'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function markProgress(moduleId: string, completed: boolean) {
  const { user } = await requireRole('student');
  const supabase = createClient();
  const { error } = await supabase.from('lesson_progress').upsert(
    { student_id: user.id, module_id: moduleId, completed, updated_at: new Date().toISOString() },
    { onConflict: 'student_id,module_id' }
  );
  if (error) throw new Error(error.message);
  revalidatePath('/student', 'layout');
}

/** Le fichier est deja televerse par le navigateur : on enregistre uniquement son chemin. */
export async function submitAssignment(assignmentId: string, filePath: string) {
  const { user } = await requireRole('student');
  if (!filePath.startsWith(`${assignmentId}/${user.id}/`)) throw new Error('Chemin de fichier invalide.');
  const supabase = createClient();
  const { error } = await supabase.from('submissions').upsert(
    { assignment_id: assignmentId, student_id: user.id, file_url: filePath, submitted_at: new Date().toISOString() },
    { onConflict: 'assignment_id,student_id' }
  );
  if (error) throw new Error(error.message);
  await supabase.from('activity_logs').insert({
    user_id: user.id, action: 'submitted_assignment', details: { assignment_id: assignmentId },
  });
  revalidatePath('/student', 'layout');
  redirect(`/student/assignments/${assignmentId}`);
}
