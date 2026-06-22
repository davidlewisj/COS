-- Add the highest-value tables for live collaboration to Supabase's
-- realtime publication so postgres_changes subscriptions fire for them.
-- (Supabase projects come with an empty "supabase_realtime" publication.)
alter publication supabase_realtime add table meetings;
alter publication supabase_realtime add table meeting_attendees;
alter publication supabase_realtime add table todos;
alter publication supabase_realtime add table issues;
alter publication supabase_realtime add table scorecard_values;
