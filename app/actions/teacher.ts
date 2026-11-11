'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

export async function createCourse(formData: FormData) {
  const { user } = await requireRole('teacher');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: str(formData, 'title'),
      code: str(formData, 'code').toUpperCase(),
      description: str(formData, 'description') || null,
      class_id: str(formData, 'class_id') || null,
      teacher_id: user.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.code === '23505' ? 'Ce code de cours existe déjà.' : error.message);
  redirect(`/teacher/courses/${data.id}`);
}

export async function deleteCourse(formData: FormData) {
  await requireRole('teacher');
  const supabase = createClient();
  const { error } = await supabase.from('courses').delete().eq('id', str(formData, 'id'));
  if (error) throw new Error(error.message);
  redirect('/teacher');
}

export async function addModule(input: {
  courseId: string; title: string; orderIndex: number; contentPath: string | null; videoValue: string | null;
}) {
  await requireRole('teacher');
  const supabase = createClient();
  const { error } = await supabase.from('modules').insert({
    course_id: input.courseId,
    title: input.title,
    order_index: input.orderIndex,
    content_url: input.contentPath,
    video_url: input.videoValue,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/courses/${input.courseId}`);
}

export async function deleteModule(formData: FormData) {
  await requireRole('teacher');
  const supabase = createClient();
  const courseId = str(formData, 'course_id');
  const { data: m } = await supabase.from('modules').select('content_url, video_url').eq('id', str(formData, 'id')).single();
  const paths = [m?.content_url, m?.video_url].filter((p): p is string => !!p && !/^https?:\/\//i.test(p));
  if (paths.length) await supabase.storage.from('course-materials').remove(paths);
  const { error } = await supabase.from('modules').delete().eq('id', str(formData, 'id'));
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/courses/${courseId}`);
}

export async function createAssignment(formData: FormData) {
  await requireRole('teacher');
  const supabase = createClient();
  const courseId = str(formData, 'course_id');
  const { error } = await supabase.from('assignments').insert({
    course_id: courseId,
    title: str(formData, 'title'),
    instructions: str(formData, 'instructions') || null,
    due_date: new Date(str(formData, 'due_date')).toISOString(),
    max_score: Number(str(formData, 'max_score')) || 20,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/courses/${courseId}`);
}

export async function deleteAssignment(formData: FormData) {
  await requireRole('teacher');
  const supabase = createClient();
  const { error } = await supabase.from('assignments').delete().eq('id', str(formData, 'id'));
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/courses/${str(formData, 'course_id')}`);
}

export async function gradeSubmission(formData: FormData) {
  await requireRole('teacher');
  const supabase = createClient();
  const max = Number(str(formData, 'max_score')) || 20;
  const grade = Number(str(formData, 'grade'));
  if (Number.isNaN(grade) || grade < 0 || grade > max) throw new Error(`La note doit être comprise entre 0 et ${max}.`);
  const { error } = await supabase
    .from('submissions')
    .update({ grade, feedback: str(formData, 'feedback') || null, graded_at: new Date().toISOString() })
    .eq('id', str(formData, 'id'));
  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/courses/${str(formData, 'course_id')}/assignments/${str(formData, 'assignment_id')}`);
}
