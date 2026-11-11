# EduCampus : LMS universitaire (Next.js 14 + Supabase)

Portail public + 3 espaces securises : **Etudiant**, **Professeur**, **Direction**.

## Installation (10 minutes)

### 1. Supabase
1. Creez un projet sur https://supabase.com
2. **SQL Editor** : collez et executez tout le fichier `supabase/schema.sql`
   (tables, RLS, buckets Storage prives, politiques).
3. **Authentication > Providers > Email** : desactivez *"Allow new users to sign up"*
   (les comptes sont crees par la Direction) et, si vous voulez, *"Confirm email"*.
4. **Project Settings > API** : copiez l'URL, la cle `anon` et la cle `service_role`.

### 2. Application
```bash
npm install
cp .env.example .env.local     # puis remplissez les 3 variables
npm run dev                    # http://localhost:3000
```

### 3. Premier compte Direction
1. Supabase > **Authentication > Users > Add user** (cochez *Auto Confirm*).
2. Dans le SQL Editor :
```sql
update public.profiles set role = 'director' where email = 'direction@votre-ecole.ht';
```
3. Connectez-vous sur `/login`. Depuis **Utilisateurs**, creez ensuite professeurs et etudiants,
   et **Classes** pour les filieres.

### 4. Deploiement (Vercel)
Importez le depot, ajoutez les 3 variables d'environnement, deployez.
`SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** commencer par `NEXT_PUBLIC_`.

## Fonctionnement
| Espace | Fonctions |
|---|---|
| Etudiant | Cours de sa classe, lecteur video (MP4, YouTube, Vimeo), PDF integre, progression, depot de devoirs, notes et commentaires |
| Professeur | Creation de cours, lecons (PDF/video/lien), devoirs, correction avec note + commentaire, progression par etudiant |
| Direction | Comptes et roles, classes, vue des cours, statistiques de trafic 14 jours, journal d'activite, export CSV |

- Un etudiant voit un cours si le cours est lie a **sa classe** ou s'il est **inscrit** (table `enrollments`).
- Fichiers : buckets **prives**, acces par URL signee (1 h). Limite 50 Mo par fichier (plan gratuit Supabase).
- Televersements directs navigateur -> Storage (pas de limite de taille cote serveur Vercel).

## Structure
```
app/                 pages (login, student/, teacher/, director/) + actions/ (Server Actions)
components/          AppShell, VideoPlayer, LessonViewer, ModuleForm, SubmitForm...
lib/                 clients Supabase (client/server/admin), auth, storage, upload
supabase/schema.sql  base de donnees + RLS + Storage
middleware.ts        rafraichissement de session + protection des routes
```

## Securite : points importants
- Le role n'est **jamais** lu depuis les metadonnees d'inscription : tout nouveau compte est `student`.
- Les fonctions `SECURITY DEFINER` (`is_director()`, `has_course_access()`...) evitent la recursion RLS.
- Un etudiant ne peut pas s'auto-noter (politique `sub_student_update`).
- Toutes les actions sensibles revalident le role cote serveur (`requireRole`).

## Pistes d'evolution
Inscription individuelle (UI `enrollments`), notifications e-mail, forum, quiz, bulletin PDF, detection de fin de video YouTube (IFrame API).
