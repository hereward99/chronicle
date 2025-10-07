-- Make buckets public to enable /object/public URLs returned by getPublicUrl
update storage.buckets
set public = true
where id in ('character-files', 'story-files', 'session-files');