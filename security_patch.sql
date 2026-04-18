-- PHASE 5: DATABASE SECURITY (Row Level Security)

-- 1. Enable RLS on all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 2. Helper Function for Role Verification
-- This securely retrieves the user's role without triggering infinite recursion on the users table.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 3. ADMIN "GOD MODE" POLICIES
-- Admins exercise ALL privileges across all tables.
CREATE POLICY "Admin Full Access - users" ON public.users FOR ALL TO authenticated USING (public.get_auth_role() = 'ADMIN');
CREATE POLICY "Admin Full Access - students" ON public.students FOR ALL TO authenticated USING (public.get_auth_role() = 'ADMIN');
CREATE POLICY "Admin Full Access - grades" ON public.grades FOR ALL TO authenticated USING (public.get_auth_role() = 'ADMIN');
CREATE POLICY "Admin Full Access - announcements" ON public.announcements FOR ALL TO authenticated USING (public.get_auth_role() = 'ADMIN');

-- 4. TEACHER POLICIES
-- Teachers can selectively view students, manage grades, and broadcast announcements.
CREATE POLICY "Teachers SELECT students" ON public.students FOR SELECT TO authenticated USING (public.get_auth_role() = 'TEACHER');

CREATE POLICY "Teachers SELECT grades" ON public.grades FOR SELECT TO authenticated USING (public.get_auth_role() = 'TEACHER');
CREATE POLICY "Teachers INSERT grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() = 'TEACHER');
CREATE POLICY "Teachers UPDATE grades" ON public.grades FOR UPDATE TO authenticated USING (public.get_auth_role() = 'TEACHER');

CREATE POLICY "Teachers SELECT announcements" ON public.announcements FOR SELECT TO authenticated USING (public.get_auth_role() = 'TEACHER');
CREATE POLICY "Teachers INSERT announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() = 'TEACHER');

-- 5. PARENT POLICIES (CRUCIAL)
-- Strict isolation ensuring Parents only see their exact children and their grades.

-- Allow Parents to ONLY SELECT from students where parent_id = auth.uid()
CREATE POLICY "Parents SELECT own students" ON public.students FOR SELECT TO authenticated USING (
  parent_id = auth.uid()
);

-- Allow Parents to ONLY SELECT from grades where the student_id belongs to a student linked to their auth.uid()
CREATE POLICY "Parents SELECT grades for own students" ON public.grades FOR SELECT TO authenticated USING (
  student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.uid()
  )
);

-- Allow Parents to SELECT from announcements where target_audience IN ('ALL', 'PARENTS')
CREATE POLICY "Parents SELECT targeted announcements" ON public.announcements FOR SELECT TO authenticated USING (
  target_audience IN ('ALL', 'PARENTS')
);
