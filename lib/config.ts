export const APP_NAME = 'EduCampus';

export type Role = 'director' | 'teacher' | 'student';

export const ROLE_LABEL: Record<Role, string> = {
  director: 'Direction',
  teacher: 'Professeur',
  student: 'Étudiant',
};

export const HOME: Record<Role, string> = {
  director: '/director',
  teacher: '/teacher',
  student: '/student',
};
