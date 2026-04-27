import { getServiceClient } from "../db/serviceClient.ts";
import { embedText } from "../ai/capabilities/embeddings.ts";

export type RetrievedChunk = {
  chunkId: string;
  documentId: string | null;
  chunkText: string;
  similarity: number;
  metadata: Record<string, unknown>;
};

export async function retrieveKnowledge(
  userId: string,
  query: string,
  opts: {
    matchCount?: number;
    onlyPublic?: boolean;
    featureKey?: string;
    requestId?: string;
  } = {},
): Promise<RetrievedChunk[]> {
  const { vector } = await embedText(opts.featureKey ?? "rag-retrieve", query, {
    requestId: opts.requestId,
    userId,
  });
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    p_user_id: userId,
    p_query_embedding: vector,
    p_match_count: opts.matchCount ?? 8,
    p_only_public: opts.onlyPublic ?? false,
  });
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    content: string;
    source_kind: string;
    document_id: string | null;
    similarity: number;
    metadata: Record<string, unknown> | null;
  }>).map((r) => ({
    chunkId: r.id,
    documentId: r.document_id,
    chunkText: r.content,
    similarity: r.similarity,
    metadata: r.metadata ?? {},
  }));
}
