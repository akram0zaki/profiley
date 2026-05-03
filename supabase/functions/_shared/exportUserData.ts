export const USER_DATA_EXPORT_VERSION = "self-service-export-v1";

export const USER_DATA_EXPORT_TABLES = [
  "app_users",
  "profiles",
  "profile_preferences",
  "public_pages",
  "onboarding_answers",
  "uploaded_documents",
  "document_extractions",
  "knowledge_chunks",
  "conversations",
  "messages",
  "job_fit_analyses",
  "recruiter_contacts",
] as const;

export type UserDataExportTableName = typeof USER_DATA_EXPORT_TABLES[number];

export type UserDataExportTables = Record<UserDataExportTableName, Record<string, unknown>[]>;

export type UserDataExportBundle = {
  manifest: {
    exportedAt: string;
    profileyVersion: typeof USER_DATA_EXPORT_VERSION;
    subjectUserId: string;
    deliveryMode: "self_service_download";
    format: "json_bundle";
    tables: UserDataExportTableName[];
    tableCounts: Record<UserDataExportTableName, number>;
    storageArtifacts: Array<{
      kind: "profile_photo" | "uploaded_document";
      bucket: "avatars" | "documents";
      path: string;
      sourceTable: "profiles" | "uploaded_documents";
      sourceId: string | null;
    }>;
  };
  tables: UserDataExportTables;
};

type QueryFilter =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "in"; column: string; values: unknown[] }
  | { kind: "is"; column: string; value: null | boolean };

type QueryOrder = {
  column: string;
  ascending?: boolean;
};

function emptyTables(): UserDataExportTables {
  return {
    app_users: [],
    profiles: [],
    profile_preferences: [],
    public_pages: [],
    onboarding_answers: [],
    uploaded_documents: [],
    document_extractions: [],
    knowledge_chunks: [],
    conversations: [],
    messages: [],
    job_fit_analyses: [],
    recruiter_contacts: [],
  };
}

async function selectRows(
  supabase: any,
  table: string,
  filters: QueryFilter[] = [],
  order?: QueryOrder,
): Promise<Record<string, unknown>[]> {
  let query = supabase.from(table).select("*");

  for (const filter of filters) {
    if (filter.kind === "eq") {
      query = query.eq(filter.column, filter.value);
      continue;
    }
    if (filter.kind === "in") {
      if (!filter.values.length) return [];
      query = query.in(filter.column, filter.values);
      continue;
    }
    query = query.is(filter.column, filter.value);
  }

  if (order) {
    query = query.order(order.column, { ascending: order.ascending ?? true });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Record<string, unknown>[] | null) ?? [];
}

function buildStorageArtifacts(tables: UserDataExportTables) {
  const profilePhotos = tables.profiles
    .filter((row) => typeof row.profile_photo_path === "string" && row.profile_photo_path.length > 0)
    .map((row) => ({
      kind: "profile_photo" as const,
      bucket: "avatars" as const,
      path: row.profile_photo_path as string,
      sourceTable: "profiles" as const,
      sourceId: typeof row.id === "string" ? row.id : null,
    }));

  const uploadedDocuments = tables.uploaded_documents
    .filter((row) => typeof row.storage_path === "string" && row.storage_path.length > 0)
    .map((row) => ({
      kind: "uploaded_document" as const,
      bucket: "documents" as const,
      path: row.storage_path as string,
      sourceTable: "uploaded_documents" as const,
      sourceId: typeof row.id === "string" ? row.id : null,
    }));

  return [...profilePhotos, ...uploadedDocuments];
}

export function buildUserDataExportBundle(
  userId: string,
  tables: Partial<UserDataExportTables>,
  exportedAt = new Date().toISOString(),
): UserDataExportBundle {
  const normalized: UserDataExportTables = {
    ...emptyTables(),
    ...tables,
  };

  const tableCounts = USER_DATA_EXPORT_TABLES.reduce((acc, table) => {
    acc[table] = normalized[table].length;
    return acc;
  }, {} as Record<UserDataExportTableName, number>);

  return {
    manifest: {
      exportedAt,
      profileyVersion: USER_DATA_EXPORT_VERSION,
      subjectUserId: userId,
      deliveryMode: "self_service_download",
      format: "json_bundle",
      tables: [...USER_DATA_EXPORT_TABLES],
      tableCounts,
      storageArtifacts: buildStorageArtifacts(normalized),
    },
    tables: normalized,
  };
}

export async function assembleUserDataExport(
  supabase: any,
  userId: string,
): Promise<UserDataExportBundle> {
  const [appUsers, profiles, profilePreferences, publicPages, onboardingAnswers, uploadedDocuments] = await Promise.all([
    selectRows(supabase, "app_users", [{ kind: "eq", column: "id", value: userId }]),
    selectRows(supabase, "profiles", [{ kind: "eq", column: "user_id", value: userId }]),
    selectRows(supabase, "profile_preferences", [{ kind: "eq", column: "user_id", value: userId }]),
    selectRows(supabase, "public_pages", [{ kind: "eq", column: "user_id", value: userId }]),
    selectRows(supabase, "onboarding_answers", [{ kind: "eq", column: "user_id", value: userId }], { column: "created_at" }),
    selectRows(supabase, "uploaded_documents", [{ kind: "eq", column: "user_id", value: userId }], { column: "created_at" }),
  ]);

  const profileIds = profiles
    .map((row) => row.id)
    .filter((value): value is string => typeof value === "string");
  const uploadedDocumentIds = uploadedDocuments
    .map((row) => row.id)
    .filter((value): value is string => typeof value === "string");

  const [documentExtractions, knowledgeChunks, conversations, jobFitAnalyses, recruiterContacts] = await Promise.all([
    selectRows(supabase, "document_extractions", [{ kind: "in", column: "document_id", values: uploadedDocumentIds }], {
      column: "created_at",
    }),
    selectRows(
      supabase,
      "knowledge_chunks",
      [
        { kind: "eq", column: "user_id", value: userId },
        { kind: "is", column: "deleted_at", value: null },
      ],
      { column: "created_at" },
    ),
    selectRows(supabase, "conversations", [{ kind: "in", column: "profile_id", values: profileIds }], {
      column: "created_at",
    }),
    selectRows(supabase, "job_fit_analyses", [{ kind: "in", column: "profile_id", values: profileIds }], {
      column: "created_at",
    }),
    selectRows(supabase, "recruiter_contacts", [{ kind: "in", column: "profile_id", values: profileIds }], {
      column: "created_at",
    }),
  ]);

  const conversationIds = conversations
    .map((row) => row.id)
    .filter((value): value is string => typeof value === "string");

  const messages = await selectRows(
    supabase,
    "messages",
    [{ kind: "in", column: "conversation_id", values: conversationIds }],
    { column: "created_at" },
  );

  return buildUserDataExportBundle(userId, {
    app_users: appUsers,
    profiles,
    profile_preferences: profilePreferences,
    public_pages: publicPages,
    onboarding_answers: onboardingAnswers,
    uploaded_documents: uploadedDocuments,
    document_extractions: documentExtractions,
    knowledge_chunks: knowledgeChunks,
    conversations,
    messages,
    job_fit_analyses: jobFitAnalyses,
    recruiter_contacts: recruiterContacts,
  });
}