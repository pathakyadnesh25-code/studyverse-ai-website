
/* =========================================================
   STUDYVERSE AI — SHARED SUPABASE CONNECTION
   Used by Mock Tests and other independent pages
========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL =
    "https://mtxkvupfczhglaqghcbc.supabase.co";

  const SUPABASE_ANON_KEY =
    "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      "STUDYVERSE AI: Supabase library failed to load."
    );
    return;
  }

  try {
    if (!window.studyverseSupabase) {
      window.studyverseSupabase =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );
    }

    console.log(
      "STUDYVERSE AI: Shared Supabase client initialized."
    );
  } catch (error) {
    console.error(
      "STUDYVERSE AI: Supabase initialization failed:",
      error
    );
  }
})();
