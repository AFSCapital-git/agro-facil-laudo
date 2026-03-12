import { supabase } from "@/integrations/supabase/client";

// Helper to bypass TypeScript strict table name checking for new tables
// that haven't been added to the auto-generated types yet.
const db = supabase as any;

export const onboardingDb = {
  empresas: () => db.from("onboarding_empresas"),
  responsaveis: () => db.from("onboarding_responsaveis"),
  documentos: () => db.from("onboarding_documentos"),
  compliance: () => db.from("onboarding_compliance"),
  redeMembros: () => db.from("onboarding_rede_membros"),
  redeDocumentos: () => db.from("onboarding_rede_documentos"),
  rm: () => db.from("onboarding_rm"),
  storage: () => supabase.storage.from("onboarding-docs"),
};
