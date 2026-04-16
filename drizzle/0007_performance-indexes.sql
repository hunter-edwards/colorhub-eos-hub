-- Performance indexes for P2+ tables
CREATE INDEX IF NOT EXISTS idx_core_values_team ON core_values(team_id);
CREATE INDEX IF NOT EXISTS idx_seats_team ON seats(team_id);
CREATE INDEX IF NOT EXISTS idx_people_ratings_subject_quarter ON people_ratings(subject_id, quarter);
CREATE INDEX IF NOT EXISTS idx_processes_team ON processes(team_id);
CREATE INDEX IF NOT EXISTS idx_rocks_quarter ON rocks(quarter);
CREATE INDEX IF NOT EXISTS idx_rock_activity_rock_created ON rock_activity(rock_id, created_at);
CREATE INDEX IF NOT EXISTS idx_todos_status_owner ON todos(status, owner_id);
CREATE INDEX IF NOT EXISTS idx_vto_team ON vto(team_id);
