# monteur-advertisement Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-03

## Active Technologies
- TypeScript 5+ (strict mode) + Next.js 16.1.6, React 19.2.3, @clerk/nextjs ^6.38.3, Tailwind CSS v4
- shadcn/ui (new-york style), Lucide React
- Clerk Organizations (multi-tenancy) + User publicMetadata (superAdmin)
- Organization publicMetadata (orgType: advertiser | agency)
- localStorage (sidebar state persistence)
- TypeScript 5+ (strict mode), Next.js 16.1.6, React 19.2.3 + @clerk/nextjs ^6.38.3, shadcn/ui (new-york), Zod ^4.3.6, Tailwind CSS v4, Lucide Reac (004-notice-crud)
- Turso (libSQL) + Drizzle ORM (신규 도입) (004-notice-crud)
- TypeScript 5+ (strict mode) + Next.js 16.1.6, React 19.2.3, @clerk/nextjs ^6.38.3, shadcn/ui, Zod ^4.3.6, @dnd-kit/core + @dnd-kit/sortable (신규 설치) (005-faq-page)
- Turso (libSQL) + Drizzle ORM ^0.45.1 (기존 인프라 활용) (005-faq-page)

## Project Structure

```text
app/
  (auth)/                         # Sign-in/up routes
  (protected)/
    admin/                        # Super admin routes
    org/[slug]/                   # Organization-scoped routes
    org-selection/                # Org selection for new users
src/
  actions/                        # Server actions (user.ts, organization.ts)
  components/                     # App components
  lib/                            # Auth utilities, navigation
  schemas/                        # Zod schemas
  types/                          # TypeScript types
```

## Commands

# Add commands for 

## Code Style

: Follow standard conventions

## Recent Changes
- 005-faq-page: Added TypeScript 5+ (strict mode) + Next.js 16.1.6, React 19.2.3, @clerk/nextjs ^6.38.3, shadcn/ui, Zod ^4.3.6, @dnd-kit/core + @dnd-kit/sortable (신규 설치)
- 004-notice-crud: Added TypeScript 5+ (strict mode), Next.js 16.1.6, React 19.2.3 + @clerk/nextjs ^6.38.3, shadcn/ui (new-york), Zod ^4.3.6, Tailwind CSS v4, Lucide Reac
- 003-org-auth: Migrated from role-based (publicMetadata.role) to Clerk Organization model

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
