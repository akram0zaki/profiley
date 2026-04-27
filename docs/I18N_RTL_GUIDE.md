# Internationalization & RTL Support Guide

## Overview

Profiley now has full internationalization (i18n) and Right-to-Left (RTL) support for Arabic, with translations for English, Dutch, and Arabic.

## Supported Languages

- **English (en)** - Default
- **Dutch (nl)** - Nederlands  
- **Arabic (ar)** - العربية (with full RTL support)

## How It Works

### Language Context

The app uses React Context API to manage language state globally:

```tsx
import { useLanguage } from '../contexts/language-context';

function MyComponent() {
  const { language, setLanguage, t, dir } = useLanguage();
  
  return <div>{t('key.name')}</div>;
}
```

### Translation Function

Use the `t()` function to translate any text:

```tsx
// Simple translation
{t('dashboard.title')}

// Translation with placeholders
{t('dashboard.subtitle').replace('{name}', userName)}
```

### RTL Layout

When Arabic is selected:
- `document.documentElement.dir` is set to `"rtl"`
- `document.documentElement.lang` is set to `"ar"`
- All CSS automatically flips using the RTL stylesheet

## Adding New Translations

### 1. Add Translation Keys

Edit `/src/app/contexts/language-context.tsx`:

```tsx
const translations: Record<Language, Record<string, string>> = {
  en: {
    'your.new.key': 'English Text',
  },
  nl: {
    'your.new.key': 'Nederlandse Tekst',
  },
  ar: {
    'your.new.key': 'النص العربي',
  },
};
```

### 2. Use in Components

```tsx
import { useLanguage } from '../contexts/language-context';

function YourComponent() {
  const { t } = useLanguage();
  
  return <h1>{t('your.new.key')}</h1>;
}
```

## Translation Organization

Translations are organized by feature/section:

### Navigation
```
nav.dashboard
nav.profile
nav.uploads
nav.knowledge
nav.chatPreview
nav.jobFit
nav.settings
nav.viewPublicProfile
nav.signOut
nav.language
```

### Dashboard
```
dashboard.title
dashboard.subtitle
dashboard.viewPublicProfile
dashboard.completeProfile
dashboard.profileProgress
dashboard.uploadDocuments
dashboard.stats.profileViews
dashboard.stats.conversations
dashboard.stats.jobFitAnalyses
dashboard.stats.engagementRate
dashboard.stats.fromLastMonth
dashboard.recentActivity
dashboard.activitySubtitle
dashboard.quickActions
dashboard.quickActionsSubtitle
dashboard.action.editProfile
dashboard.action.uploadDocs
dashboard.action.testPersona
dashboard.action.testJobFit
dashboard.action.configureAI
dashboard.knowledgeBase
dashboard.knowledgeBaseSubtitle
dashboard.kb.documents
dashboard.kb.chunks
dashboard.kb.processing
dashboard.kb.complete
dashboard.activity.viewed
dashboard.activity.chatted
dashboard.activity.jobFit
```

### Common
```
common.save
common.cancel
common.delete
common.edit
common.upload
common.loading
common.search
common.filter
common.actions
common.status
common.active
common.inactive
common.english
common.dutch
common.arabic
```

### Landing Page
```
landing.hero.badge
landing.hero.title
landing.hero.titleHighlight
landing.hero.description
landing.hero.cta
landing.hero.viewExample
landing.features.title
landing.features.subtitle
landing.feature.aiChat.title
landing.feature.aiChat.description
landing.feature.jobFit.title
landing.feature.jobFit.description
landing.feature.evidence.title
landing.feature.evidence.description
landing.feature.multilingual.title
landing.feature.multilingual.description
landing.feature.privacy.title
landing.feature.privacy.description
landing.feature.avatar.title
landing.feature.avatar.description
```

## RTL CSS

### Automatic Flipping

The `/src/styles/rtl.css` file automatically handles:

- ✅ Margin/padding direction flipping
- ✅ Text alignment
- ✅ Border positioning
- ✅ Gradient directions
- ✅ Flex layouts
- ✅ Dropdown positioning
- ✅ Icon spacing in buttons

### RTL-Safe Components

When creating new components, use logical properties where possible:

```css
/* Instead of */
margin-left: 1rem;
margin-right: 2rem;

/* Use inline properties (auto-flips) */
margin-inline-start: 1rem;
margin-inline-end: 2rem;
```

Or use Tailwind with RTL-aware classes:

```tsx
// This automatically flips in RTL
<div className="ms-2 me-4">

// These also flip automatically
<div className="text-start text-end">
```

### Fixed Positioning

For dropdowns and popovers, use `insetInlineEnd` and `insetInlineStart`:

```tsx
style={{
  insetInlineEnd: 0,  // Right in LTR, Left in RTL
}}
```

## Language Selector

The language selector appears in two places:

### Desktop
- Standalone button in header (EN/NL/AR)
- Shows current language code
- Dropdown with native language names

### Mobile  
- Integrated into user menu
- Shows all three languages with native names
- Checkmark indicates selected language

## Excluded from Translation

The following items are NOT translated:

- ✅ Person names (e.g., "Akram Fares")
- ✅ Company names (e.g., "TechCorp", "StartupX")
- ✅ Brand names (e.g., "Profiley", "OpenAI")
- ✅ Email addresses
- ✅ URLs and file names
- ✅ Technical IDs and codes

## Best Practices

### 1. Always Use Translation Keys

```tsx
// ❌ Bad
<h1>Dashboard</h1>

// ✅ Good
<h1>{t('dashboard.title')}</h1>
```

### 2. Handle Placeholders Properly

```tsx
// ✅ Replace placeholders after translation
{t('dashboard.subtitle').replace('{name}', userName)}
```

### 3. Don't Translate Names

```tsx
// ✅ Keep names untranslated
<p>{t('welcome.message')}, Akram Fares</p>
```

### 4. Use Semantic Keys

```tsx
// ❌ Bad
t('text1')
t('button2')

// ✅ Good
t('dashboard.uploadDocuments')
t('profile.editButton')
```

### 5. Test in All Languages

Always test your UI in all three languages:
- Check text doesn't overflow
- Verify RTL layout looks correct
- Ensure numbers are readable

## Testing RTL

To test RTL functionality:

1. Click the language selector (EN/NL/AR) in the header
2. Select "العربية" (Arabic)
3. The entire UI should flip to RTL
4. All text should appear in Arabic
5. Layout should mirror correctly

## Numbers in RTL

Numbers remain left-to-right (LTR) even in RTL context:

```tsx
// Numbers stay LTR
<div className="text-2xl font-bold">2,847</div>  // Always LTR

// Arabic text is RTL
<span>{t('dashboard.stats.profileViews')}</span>  // RTL
```

## Adding New Pages

When creating new pages:

1. Import the language hook:
```tsx
import { useLanguage } from '../contexts/language-context';
```

2. Use the translation function:
```tsx
const { t } = useLanguage();
```

3. Wrap all user-facing text:
```tsx
<h1>{t('page.title')}</h1>
```

4. Add translations to `language-context.tsx`

## Future Enhancements

Potential improvements:

- [ ] Add more languages (Spanish, French, German, Chinese, etc.)
- [ ] Pluralization support
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale
- [ ] Currency formatting
- [ ] External translation file management (JSON)
- [ ] Translation management UI for admins
- [ ] Professional translation services integration

## Troubleshooting

### Text Not Translating

1. Check if translation key exists in `language-context.tsx`
2. Verify you're using `t('key')` not hardcoded text
3. Ensure component has `useLanguage()` hook

### Layout Not Flipping

1. Check if `document.documentElement.dir` is "rtl"
2. Verify RTL CSS is imported in `index.css`
3. Check browser console for CSS errors

### Dropdown Positioning Wrong

1. Use logical properties (`insetInlineStart/End`)
2. Avoid absolute `left`/`right` values
3. Use `start-0` or `end-0` Tailwind classes

## Resources

- **Translation File**: `/src/app/contexts/language-context.tsx`
- **RTL CSS**: `/src/styles/rtl.css`
- **Example Implementation**: `/src/app/pages/dashboard.tsx`
- **Layout with Selector**: `/src/app/components/app-layout.tsx`

---

**Version**: 1.0  
**Last Updated**: April 27, 2026  
**Maintainer**: Profiley Development Team
