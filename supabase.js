/* Connects the website to your Supabase project.
   1) Supabase dashboard -> Project Settings -> API: copy the Project URL
   2) API Keys: copy the PUBLISHABLE key (starts with sb_publishable_)
   NEVER paste a secret / service_role key here - this file is public. */
const SUPABASE_URL = 'https://oufgthwbygtagezgpuoz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_79AdXXbrNqkeAchAyEkcHQ_6Y1sBFzU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);