-- DATABASE RE-INITIALIZATION (CLEAN SLATE)
-- WARNING: Running these will delete all data.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- User Profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'judge')) DEFAULT 'judge',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  description TEXT,
  slot_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Assignments table
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_ids UUID[] NOT NULL,
  team_ids UUID[] NOT NULL,
  revealed BOOLEAN DEFAULT FALSE,
  started BOOLEAN DEFAULT FALSE,
  current_team_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(judge_id, team_id)
);

-- Criteria table
CREATE TABLE criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Helper Functions
-- Use SECURITY DEFINER to avoid infinite recursion in RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email, 'New User'), 
    'judge'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;

-- Policies

-- User Profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON user_profiles TO authenticated USING (is_admin());

-- Teams
CREATE POLICY "Everyone can view teams" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage teams" ON teams TO authenticated USING (is_admin());

-- Assignments
CREATE POLICY "Judges can view their assignments" ON assignments FOR SELECT USING (
  auth.uid() = ANY(judge_ids)
);
CREATE POLICY "Admins can manage assignments" ON assignments TO authenticated USING (is_admin());

-- Reviews
CREATE POLICY "Judges can view own reviews" ON reviews FOR SELECT USING (auth.uid() = judge_id);
CREATE POLICY "Judges can insert reviews" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = judge_id AND
  EXISTS (
    SELECT 1 FROM assignments 
    WHERE id = assignment_id 
    AND auth.uid() = ANY(judge_ids)
    AND revealed = TRUE
  )
);
CREATE POLICY "Admins can view all reviews" ON reviews FOR SELECT USING (is_admin());

-- Criteria
CREATE POLICY "Everyone can view criteria" ON criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage criteria" ON criteria TO authenticated USING (is_admin());

-- Initial Criteria Data
INSERT INTO criteria (name, label) VALUES 
('novelty', 'Novelty'),
('innovation', 'Innovation'),
('creativity', 'Creativity'),
('execution', 'Technical Execution'),
('presentation', 'Presentation'),
('feasibility', 'Feasibility'),
('security', 'Security'),
('scalability', 'Scalability'),
('impact', 'Impact'),
('completeness', 'Completeness');
