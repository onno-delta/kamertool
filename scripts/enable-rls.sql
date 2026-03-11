-- Enable Row Level Security on all public tables.
--
-- Strategy: RLS is enabled with NO policies, which means deny-all-by-default
-- for any role that does not have BYPASSRLS. The application connects via
-- DATABASE_URL whose role has the BYPASSRLS privilege, so all Drizzle queries
-- continue to work normally. This effectively blocks access through the
-- Supabase REST/GraphQL API (anon and authenticated roles) while keeping
-- server-side database access unchanged.

ALTER TABLE party ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dossier ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kamerlid ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meeting_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hidden_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE smoelenboek_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE smoelenboek_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE smoelenboek_medewerker ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Verify: all public tables should show rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
