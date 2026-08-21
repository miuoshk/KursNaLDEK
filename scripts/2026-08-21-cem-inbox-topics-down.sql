DELETE FROM public.topics
WHERE is_inbox = true
  AND id LIKE 'INBOX--%';
