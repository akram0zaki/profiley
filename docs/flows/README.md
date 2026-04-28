# Profiley Pipeline Diagrams

Visualizations of the two core AI pipelines that power Profiley. Each diagram
ships in two forms:

- **Mermaid source** (`.mmd`) — text-based, version-controlled, editable.
- **SVG / PNG** — rendered images suitable for slides, blog posts, and
  LinkedIn.

To re-render after editing a `.mmd` file:

```bash
pnpm dlx @mermaid-js/mermaid-cli -i docs/flows/<name>.mmd -o docs/flows/<name>.svg -b transparent
pnpm dlx @mermaid-js/mermaid-cli -i docs/flows/<name>.mmd -o docs/flows/<name>.png -b white -w 1600
```

## 1. Document ingestion & embedding

How a candidate's CV becomes searchable knowledge.

- Source: [document-ingestion.mmd](document-ingestion.mmd)
- Image: [document-ingestion.svg](document-ingestion.svg) ·
  [document-ingestion.png](document-ingestion.png)

**Pipeline at a glance**

1. SPA requests a signed upload URL from `create-upload-url`.
2. Browser uploads the file directly to the `user_uploads` Storage bucket.
3. `finalize-upload` records a row in `uploaded_documents` with status
   `pending`.
4. A `pg_cron` job (`process_pending_documents`) picks up the row and invokes
   `process-document`.
5. `process-document` downloads the bytes and extracts text using **unpdf**
   (PDF) or **mammoth** (DOCX).
6. Text is chunked sentence-aware (~3,200 chars with ~400 char overlap).
7. Each batch of 32 chunks is embedded via OpenAI
   `text-embedding-3-small` (1,536 dimensions).
8. Chunks + embeddings are written to `knowledge_chunks`, indexed with
   `ivfflat` (cosine).
9. The document row is marked `completed`; failures retry up to 3 times.

## 2. AI persona chat (RAG)

How a recruiter's question becomes an answer grounded in the candidate's
profile.

- Source: [persona-chat.mmd](persona-chat.mmd)
- Image: [persona-chat.svg](persona-chat.svg) ·
  [persona-chat.png](persona-chat.png)

**Pipeline at a glance**

1. Visitor sends a question to `chat-persona` for a given public slug.
2. The function loads the profile from `public_profile_view` and enforces
   per-session and per-IP rate limits.
3. Input is screened by OpenAI `omni-moderation-latest`; flagged messages
   are blocked and logged to `moderation_events`.
4. The question is embedded with `text-embedding-3-small`.
5. The RPC `match_knowledge_chunks` runs a cosine similarity search and
   returns the top **8** chunks scoped to that candidate.
6. `buildContext` packs the chunks into a citation-friendly block within a
   28,000-char budget.
7. A system prompt + user prompt are sent to `gpt-4o-mini`
   (temperature 0.4, max 700 tokens).
8. The grounded answer is returned to the visitor along with chunk
   citations; both the user and assistant messages are written to
   `messages`, with token usage logged in `ai_call_logs`.
