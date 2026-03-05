
-- Backfill session_characters from plot_characters for all existing sessions
INSERT INTO session_characters (session_id, character_id, user_id)
SELECT s.id, pc.character_id, s.user_id
FROM sessions s
JOIN plot_characters pc ON pc.plot_id = s.plot_id
WHERE s.plot_id IS NOT NULL
ON CONFLICT DO NOTHING;
