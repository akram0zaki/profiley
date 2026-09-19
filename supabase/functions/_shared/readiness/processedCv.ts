export async function hasProcessedCv(
  supabase: {
    from: (table: string) => {
      select: (columns: string, options?: { count?: "exact"; head?: boolean }) => unknown;
    };
  },
  userId: string,
): Promise<boolean> {
  const query = supabase
    .from("uploaded_documents")
    .select("id", { count: "exact", head: true }) as {
      eq: (column: string, value: unknown) => unknown;
    };

  const withUser = query.eq("user_id", userId) as {
    eq: (column: string, value: unknown) => unknown;
  };
  const withKind = withUser.eq("document_kind", "cv") as {
    eq: (column: string, value: unknown) => PromiseLike<{ count: number | null; error: unknown | null }>;
  };
  const { count, error } = await withKind.eq("processing_status", "completed");
  if (error) throw error;
  return (count ?? 0) > 0;
}

export function resolvePublicAiCapabilities(opts: {
  allowPublicChat: boolean;
  allowJobFitAnalysis: boolean;
  processedCvReady: boolean;
  publicJobFitEnabled: boolean;
}) {
  return {
    allowPublicChat: opts.allowPublicChat && opts.processedCvReady,
    allowJobFitAnalysis:
      opts.allowJobFitAnalysis && opts.publicJobFitEnabled && opts.processedCvReady,
  };
}