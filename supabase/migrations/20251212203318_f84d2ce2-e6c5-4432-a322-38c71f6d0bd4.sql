-- Delete orphaned coterie_members where the character no longer exists
DELETE FROM coterie_members 
WHERE character_id NOT IN (SELECT id FROM characters);