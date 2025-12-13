type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export function isTableMissing(
  error: SupabaseErrorLike | null | undefined,
  tableName: string
) {
  if (!error) return false;
  const haystack = [
    error.message || "",
    error.details || "",
    error.hint || "",
  ]
    .join(" ")
    .toLowerCase();

  const needle = tableName.toLowerCase();
  return (
    error.code === "PGRST205" ||
    haystack.includes(`'${needle}'`) ||
    haystack.includes(needle)
  );
}
