-- 0036_backfill_cv_document_kind.sql
--
-- 0035 added uploaded_documents.document_kind with a 'supporting_document'
-- default, so every document uploaded before that migration looks like a
-- supporting document. Public chat and job-fit analysis require at least one
-- completed document of kind 'cv' (see _shared/readiness/processedCv.ts), so
-- pre-0035 profiles lose those capabilities until their CV is re-classified.
--
-- Backfill by filename for completed documents only. Owners can still change
-- the kind by re-uploading, and this never downgrades an explicit 'cv'.

update public.uploaded_documents
set document_kind = 'cv'
where document_kind = 'supporting_document'
  and processing_status = 'completed'
  and (
    original_filename ilike '%cv%'
    or original_filename ilike '%resume%'
    or original_filename ilike '%curriculum%'
  );
