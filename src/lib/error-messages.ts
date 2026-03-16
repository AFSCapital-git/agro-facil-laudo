/**
 * Maps technical database/API errors to user-friendly messages in Portuguese.
 * Prevents leaking internal system details to the client.
 */
export function getErrorMessage(error: Error | unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (msg.includes("permission denied") || msg.includes("rls") || msg.includes("row-level security")) {
    return "Você não tem permissão para realizar esta ação.";
  }
  if (msg.includes("unique constraint") || msg.includes("duplicate key")) {
    return "Este registro já existe.";
  }
  if (msg.includes("foreign key") || msg.includes("violates foreign key")) {
    return "Não foi possível completar a operação. Dados relacionados não encontrados.";
  }
  if (msg.includes("check constraint")) {
    return "Os dados fornecidos são inválidos. Verifique os campos e tente novamente.";
  }
  if (msg.includes("not found") || msg.includes("no rows")) {
    return "Registro não encontrado.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "A operação demorou muito. Tente novamente.";
  }
  if (msg.includes("network") || msg.includes("fetch failed") || msg.includes("failed to fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }
  if (msg.includes("jwt") || msg.includes("token") || msg.includes("unauthorized")) {
    return "Sua sessão expirou. Faça login novamente.";
  }
  if (msg.includes("storage") || msg.includes("upload")) {
    return "Erro ao processar arquivo. Tente novamente.";
  }
  if (msg.includes("too large") || msg.includes("payload too large")) {
    return "O arquivo é muito grande. Reduza o tamanho e tente novamente.";
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}
