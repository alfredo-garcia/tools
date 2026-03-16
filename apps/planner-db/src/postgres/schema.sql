-- Planner Postgres schema (Neon/compatible). Run once to create tables.
-- Ids are UUIDs; last_modified for conflict detection.

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT,
  status TEXT,
  description TEXT,
  due_date DATE,
  priority TEXT,
  assignee TEXT,
  category TEXT,
  key_results TEXT[], -- array of key result ids
  objectives TEXT[],  -- array of objective ids
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  frequency TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  execution_date_time TIMESTAMPTZ NOT NULL,
  was_successful BOOLEAN DEFAULT true,
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  description TEXT,
  category TEXT,
  priority TEXT,
  start_date DATE,
  target_date DATE,
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_name TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  description TEXT,
  metric TEXT,
  current_value DOUBLE PRECISION,
  target_value DOUBLE PRECISION,
  unit TEXT,
  deadline DATE,
  progress_percent DOUBLE PRECISION,
  objective_link TEXT[], -- array of objective ids
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_type TEXT NOT NULL,
  date DATE NOT NULL,
  meal TEXT, -- recipe id or name
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_es TEXT,
  description TEXT,
  meal_type TEXT[],
  cooking_process TEXT,
  complexity_rating DOUBLE PRECISION,
  nutrient_rating DOUBLE PRECISION,
  time_to_cook_minutes INT,
  servings INT,
  cuisine_type TEXT,
  source_url TEXT,
  tags TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_es TEXT,
  description TEXT,
  category TEXT,
  unit TEXT,
  notes TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  category TEXT,
  description TEXT,
  image_web TEXT,
  name_es TEXT,
  notes TEXT,
  priority TEXT,
  quantity DOUBLE PRECISION,
  status TEXT,
  store TEXT,
  unit TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discovery_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_name TEXT NOT NULL,
  idea_description TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  date_added DATE,
  objectives TEXT[], -- array of objective ids
  last_modified TIMESTAMPTZ DEFAULT NOW()
);
