# Profiley Design System

A comprehensive design system for the Profiley AI Interactive CV Platform.

---

## Design Principles

### 1. **Modern & Futuristic**
- Clean, minimal interface with subtle futuristic touches
- Soft gradients and restrained neon accents
- Glassy card effects with backdrop blur
- Premium SaaS aesthetic

### 2. **Trust & Professionalism**
- Evidence-based design choices
- Clear information hierarchy
- Professional color palette
- Consistent visual language

### 3. **Clarity & Usability**
- Mobile-first responsive design
- Accessible color contrasts
- Clear CTAs and navigation
- Intuitive user flows

### 4. **Innovation**
- AI-focused visual language
- Subtle animations and transitions
- Progressive disclosure
- Delightful micro-interactions

---

## Color System

### Brand Colors

#### Primary Gradient
```css
background: linear-gradient(to right, #a855f7, #3b82f6);
/* Purple 500 → Blue 500 */
```

Used for:
- Primary CTAs
- Hero headings
- Logo accents
- Feature highlights

#### Secondary Gradient
```css
background: linear-gradient(to right, #3b82f6, #06b6d4);
/* Blue 500 → Cyan 500 */
```

Used for:
- Secondary elements
- Accents
- Supporting visuals

### Semantic Colors

#### Success
- **Green 400**: `#4ade80` - Success states, positive metrics
- **Green 500/10**: `rgba(34, 197, 94, 0.1)` - Success backgrounds

#### Warning
- **Orange 400**: `#fb923c` - Warnings, gaps
- **Yellow 400**: `#facc15` - Caution, risks

#### Error
- **Destructive**: `#d4183d` - Errors, delete actions

#### Info
- **Blue 400**: `#60a5fa` - Information, tips
- **Blue 500/10**: `rgba(59, 130, 246, 0.1)` - Info backgrounds

#### AI/Tech
- **Purple 400**: `#c084fc` - AI features, chat
- **Purple 500/10**: `rgba(168, 85, 247, 0.1)` - AI backgrounds

### Base Colors (from theme.css)

#### Dark Mode (Primary)
```css
--background: oklch(0.145 0 0)  /* Near black */
--foreground: oklch(0.985 0 0)  /* Near white */
--muted-foreground: oklch(0.708 0 0)  /* Gray text */
--border: oklch(0.269 0 0)  /* Subtle borders */
```

#### Light Mode
```css
--background: #ffffff
--foreground: oklch(0.145 0 0)
--muted-foreground: #717182
--border: rgba(0, 0, 0, 0.1)
```

---

## Typography

### Font Family
- **Primary**: System font stack (default)
- Uses native fonts for optimal performance

### Font Sizes (from theme.css)
```css
--font-size: 16px  /* Base size */
```

### Heading Hierarchy

#### H1
- **Usage**: Page titles, hero headings
- **Default**: `text-2xl` (via theme.css)
- **Weight**: `font-medium` (500)
- **Example**: Dashboard title, landing page hero

#### H2
- **Usage**: Section headings
- **Default**: `text-xl`
- **Weight**: `font-medium`
- **Example**: Card titles, feature sections

#### H3
- **Usage**: Subsection headings, card titles
- **Default**: `text-lg`
- **Weight**: `font-medium`
- **Example**: Settings sections, feature cards

#### H4
- **Usage**: Small headings, labels
- **Default**: `text-base`
- **Weight**: `font-medium`

### Body Text
- **Default**: `text-base` (16px)
- **Weight**: `font-normal` (400)
- **Line Height**: 1.5

### Muted Text
- **Color**: `text-muted-foreground`
- **Usage**: Descriptions, secondary information, timestamps
- **Size**: Usually `text-sm`

---

## Spacing System

### Container
- **Max Width**: `max-w-screen-xl` (1280px) for main content
- **Padding**: `px-4` (1rem) on mobile, maintained across breakpoints

### Page Sections
- **Vertical Spacing**: `py-6` (1.5rem) between major sections
- **Card Spacing**: `space-y-6` (1.5rem) between cards

### Component Spacing
- **Card Padding**: `p-6` or `pt-6` for CardContent
- **Form Fields**: `space-y-4` (1rem) between fields
- **Inline Elements**: `gap-2` or `gap-4` (0.5rem / 1rem)

---

## Components

### Cards

#### Default Card
```tsx
<Card className="border-border/50 bg-card/50 backdrop-blur">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### Gradient Accent Card
```tsx
<Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
  {/* Content */}
</Card>
```

#### Info/Alert Cards
```tsx
<Card className="border-blue-500/50 bg-blue-500/5">
  <CardHeader className="flex flex-row items-start gap-4">
    <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
    <div>
      <CardTitle>Title</CardTitle>
      <CardDescription>Description</CardDescription>
    </div>
  </CardHeader>
</Card>
```

### Badges

#### Status Badges
```tsx
{/* Success */}
<Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
  Processed
</Badge>

{/* Info */}
<Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
  Processing
</Badge>

{/* Error */}
<Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
  Failed
</Badge>
```

### Buttons

#### Primary CTA
```tsx
<Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
  Get Started
</Button>
```

#### Standard Button
```tsx
<Button>Default Action</Button>
```

#### Outline Button
```tsx
<Button variant="outline">Secondary Action</Button>
```

#### Icon Button
```tsx
<Button size="icon" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>
```

### Icons

#### Icon Sizing
- **Small**: `h-4 w-4` (1rem) - In buttons, inline
- **Medium**: `h-5 w-5` (1.25rem) - Section headers, alerts
- **Large**: `h-8 w-8` (2rem) - Hero sections, empty states

#### Icon Containers
```tsx
{/* Small circle */}
<div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
  <Icon className="h-5 w-5 text-purple-400" />
</div>

{/* Large circle */}
<div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
  <Icon className="h-8 w-8 text-white" />
</div>
```

### Avatars

```tsx
<Avatar className="h-8 w-8">  {/* or h-32 w-32 for large */}
  <AvatarImage src={url} alt="Name" />
  <AvatarFallback>AB</AvatarFallback>
</Avatar>
```

---

## Layout Patterns

### Page Structure

```tsx
<AppLayout>
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h1 className="text-3xl font-bold">Page Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>

    {/* Content sections */}
    <Card>{/* Section 1 */}</Card>
    <Card>{/* Section 2 */}</Card>
  </div>
</AppLayout>
```

### Grid Layouts

#### Stats Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>{/* Stat 1 */}</Card>
  <Card>{/* Stat 2 */}</Card>
  <Card>{/* Stat 3 */}</Card>
  <Card>{/* Stat 4 */}</Card>
</div>
```

#### Two Column
```tsx
<div className="grid gap-6 lg:grid-cols-2">
  <Card>{/* Left */}</Card>
  <Card>{/* Right */}</Card>
</div>
```

### Responsive Utilities

```tsx
{/* Mobile-first approach */}
<div className="flex flex-col md:flex-row gap-4">
  {/* Stacks on mobile, row on tablet+ */}
</div>

<div className="hidden md:flex">
  {/* Desktop navigation */}
</div>

<div className="md:hidden">
  {/* Mobile menu */}
</div>
```

---

## Backgrounds & Effects

### Gradient Backgrounds

#### Page Background
```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
  {/* Content */}
</div>
```

#### Section Background
```tsx
<section className="bg-gradient-to-b from-purple-500/5 to-transparent">
  {/* Content */}
</section>
```

### Glassmorphism

```tsx
<div className="bg-card/50 backdrop-blur border border-border/50">
  {/* Glass effect */}
</div>
```

### Glow Effects

```tsx
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl" />
  <div className="relative">
    {/* Content with glow */}
  </div>
</div>
```

---

## Animation & Interaction

### Transitions

```tsx
{/* Hover states */}
<Card className="hover:border-purple-500/50 transition-colors">
  {/* Smooth color transition on hover */}
</Card>

{/* Button hover */}
<Button className="hover:from-purple-600 hover:to-blue-600">
  {/* Gradient shift on hover */}
</Button>
```

### Loading States

```tsx
{/* Skeleton */}
<div className="animate-pulse bg-muted h-4 rounded" />

{/* Spinner dots */}
<div className="flex gap-1">
  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
</div>
```

---

## Messaging & Feedback

### Success Messages
```tsx
<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
  Success message
</div>
```

### Info Messages
```tsx
<div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
  <AlertCircle className="h-5 w-5 text-blue-400" />
  Info message
</div>
```

### Error Messages
```tsx
<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
  Error message
</div>
```

---

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Muted text uses `oklch(0.708 0 0)` for sufficient contrast
- Interactive elements have clear focus states

### Focus States
- Default outline: `outline-ring/50`
- Visible keyboard navigation
- Skip to main content support

### ARIA Labels
- Always include alt text for images
- Use semantic HTML (nav, main, section)
- Label all form inputs

---

## Responsive Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Tablet */
md: 768px   /* Small desktop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Strategy
- Design for mobile first
- Add complexity at larger breakpoints
- Use `md:` and `lg:` prefixes for desktop enhancements

---

## Internationalization & RTL Support

### Supported Languages

Profiley supports three languages with full UI adaptation:

- **English (en)** - Default, left-to-right (LTR)
- **Nederlands (nl)** - Dutch, left-to-right (LTR)
- **العربية (ar)** - Arabic, right-to-left (RTL)

### RTL Layout System

When Arabic is selected, the entire UI automatically flips to RTL layout:

#### Automatic Transformations
```css
/* Direction is set on document root */
document.documentElement.dir = "rtl"
document.documentElement.lang = "ar"

/* CSS in rtl.css handles all flipping */
[dir="rtl"] .ml-2 { margin-left: 0; margin-right: 0.5rem; }
[dir="rtl"] .text-left { text-align: right; }
[dir="rtl"] .bg-gradient-to-r { 
  background-image: linear-gradient(to left, var(--tw-gradient-stops)); 
}
```

#### RTL-Safe Patterns

**Use Logical Properties:**
```tsx
// ✅ Good - Auto-flips in RTL
<div className="ms-2 me-4">        // margin-inline-start/end
<div className="ps-4 pe-2">        // padding-inline-start/end
<div className="start-0 end-0">    // inset-inline-start/end

// ❌ Avoid - Needs manual RTL rules
<div className="ml-2 mr-4">
<div className="pl-4 pr-2">
<div className="left-0 right-0">
```

**Text Alignment:**
```tsx
// ✅ Good - Auto-flips
<div className="text-start">
<div className="text-end">

// ❌ Avoid - Fixed direction
<div className="text-left">
<div className="text-right">
```

**Flexbox:**
```tsx
// ✅ Good - Respects direction
<div className="flex justify-start">
<div className="flex gap-2">

// Note: flex-row-reverse behavior is inverted in RTL
```

### Arabic Typography

#### Font Stack
```css
[dir="rtl"] {
  font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
  letter-spacing: normal;
}
```

Arabic uses system fonts optimized for Arabic script:
- **Segoe UI** - Windows, excellent Arabic support
- **Tahoma** - Fallback with good Arabic rendering
- **Arial** - Universal fallback

#### Number Handling
Numbers remain left-to-right (LTR) even in RTL context:

```tsx
// Numbers always display LTR
<div className="text-2xl font-bold">2,847</div>  
// Renders as: 2,847 (not ٢٬٨٤٧)

// Arabic text flows RTL
<span>{t('dashboard.stats.profileViews')}</span>  
// Renders as: مشاهدات الملف الشخصي
```

CSS handles this automatically:
```css
[dir="rtl"] .text-2xl {
  unicode-bidi: plaintext;  /* Keeps numbers LTR */
}
```

### Component RTL Adaptations

#### Progress Bars
```css
/* Progress fills from right in RTL */
[dir="rtl"] [data-slot="progress-indicator"] {
  transform-origin: right !important;
}
```

#### Dropdowns & Popovers
```tsx
// Use logical positioning
<div style={{
  insetInlineEnd: 0,  // Right in LTR, Left in RTL
}}>
```

#### Icons in Buttons
Icons automatically reposition in RTL:
```tsx
<Button className="gap-2">
  <Icon className="h-4 w-4" />
  {t('button.text')}
</Button>
// Icon appears on the right in RTL
```

#### Gradients
All gradients automatically flip:
```tsx
// LTR: purple → blue (left to right)
// RTL: purple → blue (right to left)
<div className="bg-gradient-to-r from-purple-500 to-blue-500">
```

### Translation System

#### Using Translations
```tsx
import { useLanguage } from '../contexts/language-context';

function Component() {
  const { t, language, dir } = useLanguage();
  
  return (
    <div dir={dir}>
      <h1>{t('page.title')}</h1>
      <p>{t('page.description').replace('{name}', userName)}</p>
    </div>
  );
}
```

#### Translation Keys
Organized by feature:
```
nav.*           - Navigation items
dashboard.*     - Dashboard page
landing.*       - Landing page
common.*        - Reusable strings
profile.*       - Profile pages
uploads.*       - Upload pages
```

#### What NOT to Translate
- Person names (Akram Fares)
- Company names (TechCorp, StartupX)
- Brand names (Profiley, OpenAI)
- Email addresses
- URLs and file paths
- Technical IDs

### Testing RTL

**Visual Testing Checklist:**
- [ ] All text aligns correctly
- [ ] Margins and padding are flipped
- [ ] Icons appear on correct side
- [ ] Dropdowns open in correct direction
- [ ] Progress bars fill from right
- [ ] Gradients flow correctly
- [ ] Numbers remain LTR
- [ ] No horizontal overflow
- [ ] Navigation feels natural

**Quick Test:**
1. Click language selector in header
2. Select "العربية" (Arabic)
3. Verify entire UI mirrors
4. Check all pages for layout issues

### RTL Resources

**Key Files:**
- `/src/styles/rtl.css` - All RTL transformation rules
- `/src/app/contexts/language-context.tsx` - Translation system
- `/I18N_RTL_GUIDE.md` - Complete RTL implementation guide

**Further Reading:**
- [RTL Styling 101](https://rtlstyling.com/)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [BiDi Text Best Practices](https://www.w3.org/International/questions/qa-bidi-css-markup)

---

## Best Practices

### Do's
✅ Use semantic color variables from theme.css
✅ Apply backdrop-blur for glassmorphism effects
✅ Use gradient accents sparingly for emphasis
✅ Maintain consistent spacing with Tailwind utilities
✅ Keep mobile-first responsive approach
✅ Use muted text for secondary information
✅ Apply status colors consistently

### Don'ts
❌ Don't use bright saturated colors
❌ Avoid heavy sci-fi effects
❌ Don't clutter the interface
❌ Avoid inconsistent spacing
❌ Don't ignore mobile experience
❌ Avoid custom CSS when Tailwind utilities exist

---

## Component Examples

### Hero Section
```tsx
<section className="container px-4 py-20 md:py-32 max-w-screen-xl">
  <div className="flex flex-col items-center text-center gap-8">
    <Badge variant="secondary" className="gap-2 px-4 py-1">
      <Icon className="h-3 w-3" />
      Feature Badge
    </Badge>
    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold max-w-4xl leading-tight">
      Hero <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Heading
      </span>
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
      Supporting text
    </p>
    <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500">
      Call to Action
    </Button>
  </div>
</section>
```

### Stats Card
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Metric Name</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">2,847</div>
    <p className="text-xs text-muted-foreground">
      <span className="text-green-400">+12%</span> from last month
    </p>
  </CardContent>
</Card>
```

### Activity Item
```tsx
<div className="flex items-start gap-4 pb-4 border-b">
  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
    <Icon className="h-5 w-5 text-blue-400" />
  </div>
  <div className="flex-1 space-y-1">
    <p className="text-sm font-medium">Activity title</p>
    <p className="text-sm text-muted-foreground">Details</p>
    <p className="text-xs text-muted-foreground">2 hours ago</p>
  </div>
  <Badge variant="secondary">Status</Badge>
</div>
```

---

## Future Considerations

### Phase 2 Enhancements
- Enhanced animations with Motion/Framer Motion
- Custom illustrations for empty states
- Advanced data visualizations with Recharts
- Micro-interactions for delight

### Phase 3 (Avatar Feature)
- Live video streaming UI components
- Real-time connection indicators
- Session recording controls
- Avatar preview components

---

## Tools & Dependencies

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS v4**: Utility-first styling
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### Utilities
- **clsx + tailwind-merge**: Conditional classes
- **class-variance-authority**: Component variants
- **next-themes**: Dark mode support

---

## Design References

Inspired by:
- **Linear**: Clean SaaS aesthetic, subtle animations
- **Vercel**: Modern gradient usage, typography
- **Notion AI**: AI feature presentation
- **Raycast**: Command palette, search-focused
- **Arc Browser**: Futuristic touches, premium feel

---

## Maintenance

### Adding New Colors
1. Define in `theme.css` under `:root` and `.dark`
2. Add to `@theme inline` block
3. Document in this guide
4. Test in both light and dark modes

### Adding New Components
1. Follow existing patterns from shadcn/ui
2. Use theme color variables
3. Ensure mobile responsiveness
4. Document in this guide

### Versioning
- Document significant design system changes
- Maintain backwards compatibility when possible
- Communicate changes to development team

---

**Last Updated**: April 27, 2026
**Version**: 1.0
**Maintainer**: Profiley Design Team
