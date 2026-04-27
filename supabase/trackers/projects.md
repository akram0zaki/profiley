# Supabase Project Reference

Replace placeholders with the actual Supabase project refs after creating the projects.

| Environment | Project Ref | URL |
|-------------|-------------|-----|
| Development | `<dev-project-ref>` | `https://<dev-project-ref>.supabase.co` |
| Production  | `<prod-project-ref>` | `https://<prod-project-ref>.supabase.co` |

## Linking the CLI

```bash
# dev
supabase link --project-ref <dev-project-ref>

# prod
supabase link --project-ref <prod-project-ref>
```

## Pushing migrations

```bash
supabase db push --project-ref <dev-project-ref>
```

## Setting secrets per environment

```bash
supabase secrets set --project-ref <ref> --env-file supabase/functions/.env
```
