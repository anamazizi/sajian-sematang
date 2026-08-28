# 🚀 PHASE REBUILD-2: AUTHENTICATION - READY TO START

**Status:** Ready to begin  
**Prerequisites:** ✅ Phase R1 complete  
**Estimated Duration:** 2-3 hours

## Objectives

- [ ] Setup Supabase Auth + Google OAuth
- [ ] Implement login/logout flow
- [ ] Create user profile management
- [ ] Handle session (7-day policy)
- [ ] Implement role-based navigation
- [ ] Test authentication end-to-end

## Before We Start

Need to check:

1. **Google OAuth credentials** - Ada ke belum?
2. **Existing auth code** - Apa yang dah ada?
3. **Supabase Auth config** - Setup status?

## Quick Commands to Check

```bash
# Check if auth helpers installed
grep -i "@supabase/auth" package.json

# Check for existing auth files
find app -name "*auth*" -o -name "*login*"
find lib -name "*supabase*"

# Check env vars
grep "SUPABASE" .env.local 2>/dev/null || echo "No .env.local found"
```

## When Ready

Beritahu bila ready untuk start Phase R2, atau run checks di atas dahulu.
