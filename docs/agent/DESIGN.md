# Design System Inspired by Lucy's Class

## 1. Visual Theme & Atmosphere

Lucy's Class embodies a warm, child-centric educational environment that balances playfulness with professional credibility. The design conveys joy, safety, and academic excellence through soft, rounded forms and a carefully curated pastel-to-vibrant color progression. The visual language draws from a nurturing classroom aesthetic—think colorful banners, friendly illustrations, and encouraging typography. The atmosphere is inviting yet organized, creating a space where young learners feel comfortable exploring English language skills. Every element radiates optimism and approachability, reinforced by smooth transitions, generous spacing, and approachable typography that feels both contemporary and child-friendly.

**Key Characteristics**
- Warm, welcoming color palette with pedagogical intent
- Rounded, pill-shaped components that feel gentle and safe
- High contrast between accent colors and neutral backgrounds for clarity
- Large, clear typography prioritizing readability for young audiences
- Generous whitespace reflecting a calm learning environment
- Illustrative, character-driven visual language paired with structured UI
- Emphasis on encouragement through success-oriented color states
- Smooth shadow treatments that suggest depth without harshness

## 2. Color Palette & Roles

### Primary
- **Brand Teal** (`#1C695C`): Primary call-to-action buttons, active navigation states, and key interactive elements that convey trust and learning authority
- **Secondary Teal** (`#3FA48F`): Lighter accent for secondary CTAs and hover states to maintain visual hierarchy while reinforcing brand identity

### Accent Colors
- **Bright Blue** (`#3B82F6`): Links, badges, and accent highlights for data visualization or status indicators
- **Primary Blue** (`#4A90E2`): Alternative accent for secondary interactive states and informational elements
- **Light Blue** (`#8AB4F8`): Soft backgrounds for input fields or cards that require visual distinction without dominance

### Interactive
- **Input Blue** (`#D0EAF9`): Background color for text input fields, creating a soft, approachable input zone
- **Input Warm** (`#FDF0C6`): Alternative input background for emphasis or context-specific form sections
- **Button Primary** (`#1C695C`): Main call-to-action button background with teal foundation
- **Button Secondary** (`#4B5563`): Secondary button text color for less prominent actions

### Neutral Scale
- **Near Black** (`#1F2937`): Primary text, headings, and high-contrast foreground elements; most frequently used for readability
- **Dark Gray** (`#333333`): Alternative dark text for secondary content or reduced emphasis
- **Medium Gray** (`#4B5563`): Subtle text for secondary information or disabled states
- **Light Gray** (`#E5E7EB`): Borders, dividers, and light background accents (most frequently used neutral)
- **Lighter Gray** (`#F3F4F6`): Subtle background tints for card sections or content areas
- **Lightest Gray** (`#F9FAFB`): Minimal background color for reduced visual weight

### Surface & Borders
- **White** (`#FFFFFF`): Primary surface color for cards, modals, and primary content areas
- **Light Gray Border** (`#E5E7EB`): Default border color for cards, inputs, and structural dividers
- **Transparent** (`#0000`): Transparent backgrounds for overlays and ghost components

### Semantic / Status
- **Success Green** (`#22C55E`): Success messages, confirmations, and positive feedback states
- **Alternative Success** (`#4CAF50`): Secondary success color for variation and status badges
- **Warning Yellow** (`#FBBF24`): Warning states, cautionary messages, and attention flags
- **Alternative Warning** (`#EAB308`): Secondary warning for badges or background emphasis

## 3. Typography Rules

### Font Family
**Primary Font: Outfit**
- Fallback stack: `Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Usage: Headings, buttons, high-emphasis text

**Secondary Font: Quicksand**
- Fallback stack: `Quicksand, 'Segoe UI', Tahoma, sans-serif`
- Usage: Body text, inputs, links, labels

**Tertiary Font: Nunito**
- Fallback stack: `Nunito, 'Segoe UI', sans-serif`
- Usage: Special emphasis spans and decorative text

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | Outfit | 50px | 900 | 60px | 0px | Hero headlines and page titles |
| Heading 2 | Outfit | 48px | 900 | 48px | 0px | Major section headings |
| Heading 3 | Quicksand | 18px | 900 | 18px | 0px | Subsection titles and card headers |
| Heading 4 | Outfit | 20px | 700 | 28px | 0px | Block headings and secondary titles |
| Body Text | Quicksand | 18px | 700 | 28.8px | 0px | Primary paragraph content |
| Body Link | Quicksand | 18px | 400 | 28.8px | 0px | Inline links within body text |
| Button Text | Outfit | 14px | 700 | 20px | 0px | Button labels and CTAs |
| Input Text | Quicksand | 14px | 600 | 20px | 0px | Form field content |
| Input Label | Quicksand | 14px | 700 | 20px | 0px | Form field labels and placeholders |
| List Item | Quicksand | 16px | 700 | 25.6px | 0px | Bulleted and numbered lists |
| Emphasis Span | Nunito | 18.4px | 900 | 18.4px | 0px | Decorative emphasis text |
| Caption | Quicksand | 14px | 400 | 20px | 0px | Small supportive text below images or content |

### Principles
- **Hierarchy through weight and size:** Use Outfit's heavy 900 weight for headlines to command attention; shift to Quicksand's lighter weights for body content to aid reading
- **Readability first:** Maintain minimum 18px for body text to ensure comfortable reading for young learners and their parents
- **Line height breathing room:** Generous line heights (1.4x to 1.6x font size) support sustained reading and reduce cognitive load
- **Font pairing philosophy:** Outfit (geometric, friendly) pairs with Quicksand (rounded, approachable) to reinforce the nurturing brand voice
- **Emphasis through type:** Use Nunito's unique geometry sparingly for special moments, callouts, or numeric highlights

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background**: `#1C695C`
- **Text Color**: `#FFFFFF`
- **Font Family**: Outfit
- **Font Size**: `14px`
- **Font Weight**: `700`
- **Line Height**: `20px`
- **Padding**: `10px 24px`
- **Height**: `40px`
- **Border Radius**: `9999px`
- **Border**: `0px solid transparent`
- **Box Shadow**: `rgba(28, 105, 92, 0.35) 0px 4px 14px 0px`
- **Hover State**: Background `#3FA48F`, maintain shadow
- **Active State**: Background `#1C695C`, shadow `rgba(28, 105, 92, 0.5) 0px 2px 8px 0px`
- **Disabled State**: Background `#E5E7EB`, Text `#4B5563`, shadow none

#### Secondary Button
- **Background**: `transparent`
- **Text Color**: `#4B5563`
- **Font Family**: Outfit
- **Font Size**: `14px`
- **Font Weight**: `700`
- **Line Height**: `20px`
- **Padding**: `10px 24px`
- **Height**: `40px`
- **Border Radius**: `9999px`
- **Border**: `2px solid #E5E7EB`
- **Box Shadow**: `none`
- **Hover State**: Background `#F3F4F6`, Text `#1F2937`
- **Active State**: Background `#E5E7EB`, border `#4B5563`
- **Disabled State**: Opacity `0.5`, Text `#4B5563`

#### Ghost Button
- **Background**: `transparent`
- **Text Color**: `#4B5563`
- **Font Family**: Outfit
- **Font Size**: `14px`
- **Font Weight**: `700`
- **Line Height**: `20px`
- **Padding**: `10px 24px`
- **Height**: `40px`
- **Border Radius**: `9999px`
- **Border**: `0px solid transparent`
- **Box Shadow**: `none`
- **Hover State**: Background `#F9FAFB`, Text `#1F2937`
- **Active State**: Background `#E5E7EB`
- **Disabled State**: Opacity `0.5`

### Cards & Containers

#### Standard Card (Rounded)
- **Background**: `#FFFFFF`
- **Text Color**: `#1F2937`
- **Font Family**: Quicksand
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Line Height**: `25.6px`
- **Padding**: `24px`
- **Border Radius**: `32px`
- **Border**: `0px solid transparent`
- **Box Shadow**: `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px`
- **Hover State**: Box Shadow `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px`, transform `translateY(-2px)`

#### Card with Gradient Header
- **Background**: Gradient from `#FBD38D` to `#F9A825` (yellow-to-orange variant shown in design)
- **Text Color**: `#FFFFFF` (header), `#1F2937` (body)
- **Font Family**: Quicksand
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `20px` (header), `24px` (body)
- **Border Radius**: `32px`
- **Border**: `0px`
- **Box Shadow**: `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px`

#### Flat Card (Minimal Shadow)
- **Background**: `#FFFFFF`
- **Text Color**: `#1F2937`
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Border**: `0px solid #E5E7EB`
- **Box Shadow**: `none`

### Inputs & Forms

#### Text Input (Blue Variant)
- **Background**: `#D0EAF9`
- **Text Color**: `#1F2937`
- **Font Family**: Quicksand
- **Font Size**: `14px`
- **Font Weight**: `600`
- **Line Height**: `20px`
- **Padding**: `14px 24px 14px 48px` (with left icon space)
- **Height**: `52px`
- **Border Radius**: `9999px`
- **Border**: `2px solid transparent`
- **Box Shadow**: `rgba(0, 0, 0, 0.05) 0px 2px 4px 0px inset`
- **Focus State**: Border `2px solid #3B82F6`, shadow `rgba(59, 130, 246, 0.1) 0px 0px 0px 3px`
- **Placeholder Color**: `#4B5563` at `0.6` opacity

#### Text Input (Warm Variant)
- **Background**: `#FDF0C6`
- **Text Color**: `#1F2937`
- **Font Family**: Quicksand
- **Font Size**: `14px`
- **Font Weight**: `600`
- **Padding**: `14px 24px 14px 48px`
- **Height**: `52px`
- **Border Radius**: `9999px`
- **Border**: `2px solid transparent`
- **Box Shadow**: `rgba(0, 0, 0, 0.05) 0px 2px 4px 0px inset`
- **Focus State**: Border `2px solid #FBBF24`, shadow `rgba(251, 191, 36, 0.1) 0px 0px 0px 3px`

#### Form Label
- **Text Color**: `#1F2937`
- **Font Family**: Quicksand
- **Font Size**: `14px`
- **Font Weight**: `700`
- **Line Height**: `20px`
- **Margin Bottom**: `8px`

### Navigation

#### Top Navigation Bar
- **Background**: `#FFFFFF`
- **Text Color**: `#1F2937`
- **Font Family**: Quicksand
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Height**: `72px`
- **Padding**: `16px 40px`
- **Border Radius**: `0px`
- **Border**: `0px solid #E5E7EB` (bottom border `1px`)
- **Box Shadow**: `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Active Link State**: Text Color `#1C695C`, font-weight `700`, bottom border `3px solid #1C695C`
- **Hover Link State**: Text Color `#3FA48F`, transition `0.2s ease`

#### Navigation Item (Default)
- **Text Color**: `#4B5563`
- **Font Weight**: `400`
- **Padding**: `8px 16px`
- **Border Radius**: `0px`

#### Navigation Item (Active)
- **Text Color**: `#1C695C`
- **Font Weight**: `700`
- **Border Bottom**: `3px solid #1C695C`

### Links

#### Inline Link (Blue)
- **Background**: `transparent`
- **Text Color**: `#1877F2`
- **Font Family**: Quicksand
- **Font Size**: `18px`
- **Font Weight**: `400`
- **Line Height**: `28.8px`
- **Padding**: `0px`
- **Border Radius**: `50%` (when presented as icon button)
- **Border**: `0px`
- **Text Decoration**: `underline` (on default), `none` (on hover)
- **Hover State**: Color `#0A66C2`, text-decoration underline

#### Inline Link (Pink)
- **Text Color**: `#E1306C`
- **Font Size**: `18px`
- **Font Weight**: `400`
- **Hover State**: Color `#C13584`, text-decoration underline

#### Inline Link (Black)
- **Text Color**: `#000000`
- **Font Size**: `18px`
- **Font Weight**: `400`
- **Hover State**: Color `#333333`, text-decoration underline

### Badges & Status Indicators

#### Success Badge
- **Background**: `#22C55E`
- **Text Color**: `#FFFFFF`
- **Font Family**: Quicksand
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 12px`
- **Border Radius**: `2px`
- **Line Height**: `16px`

#### Warning Badge
- **Background**: `#FBBF24`
- **Text Color**: `#1F2937`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 12px`
- **Border Radius**: `2px`

#### Information Badge
- **Background**: `#8AB4F8`
- **Text Color**: `#FFFFFF`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 12px`
- **Border Radius**: `2px`

## 5. Layout Principles

### Spacing System

Lucy's Class uses an `8px` base unit multiplied across all layout dimensions. This creates a harmonious, predictable spacing scale that feels generous without being excessive.

**Spacing Scale:**
- **Micro** (`4px`): Gaps between inline elements, tight component spacing
- **XS** (`8px`): Padding within small components, tight margins
- **SM** (`12px`): Padding for input icons, button text breathing room
- **MD** (`16px`): Standard padding for most components, small margins
- **LG** (`20px`): Padding for cards and medium containers
- **XL** (`24px`): Padding for large cards and generous margins
- **2XL** (`32px`): Major content block spacing
- **3XL** (`40px`): Section-level margins
- **4XL** (`48px`): Large section margins
- **5XL** (`56px`): Extra-large section gaps
- **6XL** (`64px`): Full-screen section breaks

**Usage Context:**
- Button padding: `8px` vertical, `24px` horizontal
- Card padding: `24px` minimum for standard cards
- Section margins: `48px` to `64px` between major content blocks
- Input padding: `14px` vertical, `24px` horizontal with icon accommodation
- Navigation padding: `16px` vertical, `40px` horizontal

### Grid & Container

**Max Width:** `1280px` for primary content containers, ensuring optimal readability and layout control

**Column Strategy:** 
- Desktop: 12-column grid at `1280px` max-width
- Tablet: 8-column grid at `768px` width
- Mobile: 4-column grid at `375px` width

**Section Patterns:**
- Full-width hero sections with centered max-width content overlay
- Two-column layouts for feature comparisons, side-by-side card grids
- Three-column card grids for service offerings or feature highlights
- Asymmetric layouts combining full-width images with text cards

**Margins and Gutters:**
- Column gutter: `24px` between columns
- Container horizontal padding: `40px` on desktop, `24px` on tablet, `16px` on mobile
- Container vertical padding: `64px` between major sections on desktop, `48px` on tablet, `32px` on mobile

### Whitespace Philosophy

Lucy's Class embraces generous whitespace to create a calm, inviting learning environment. Negative space is not merely absence—it's an active design element that guides attention, improves readability, and reduces cognitive overload for young learners and parents. The design breathes; no section feels cramped or overwhelming.

**Key whitespace principles:**
- Minimum `32px` breathing room around focal content
- Vertical spacing between text blocks: `28.8px` (line-height multiplier)
- Horizontal whitespace around navigation elements: `16px` minimum
- Card-to-card spacing: `24px` minimum gap
- Bottom margins on typography elements scale with hierarchy

### Border Radius Scale

- **9999px** (button): Fully rounded pill-shaped buttons and primary CTAs
- **32px** (card, container): Standard rounded containers, elevated cards, and major UI blocks
- **24px** (input, secondary container): Form inputs, secondary cards, and modal windows
- **16px** (tertiary container): Badges, small alerts, and smaller component containers
- **2px** (badge): Minimal rounding for status badges and micro-components

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, `box-shadow: none` | Ghost buttons, text links, disabled states, background decorative elements |
| Raised (1) | `rgba(0, 0, 0, 0.05) 0px 2px 4px 0px inset` | Input fields, subtle inset shadows, light form elements |
| Lifted (2) | `rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px` | Secondary buttons, minor cards, navigation items |
| Elevated (3) | `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px` | Primary cards, standard containers, moderate-emphasis UI blocks |
| Modal (4) | `rgba(28, 105, 92, 0.35) 0px 4px 14px 0px` | Primary buttons, floating action buttons, prominent CTAs |
| Deep (5) | `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px` | Modal overlays, cards on hover, maximum depth for interactive elements |

**Shadow Philosophy:** Lucy's Class uses soft, directional shadows that suggest gentle elevation without harsh contrast. Shadows are color-tinted with brand teal (`#1C695C`) on primary CTAs to reinforce identity, while neutral blacks are used for secondary shadows. This approach maintains visual hierarchy while feeling warm and approachable. Inset shadows on inputs create a subtle sense of depth that invites interaction.

## 7. Do's and Don'ts

### Do
- **Use pill-shaped buttons consistently** (`border-radius: 9999px`) to maintain the friendly, rounded aesthetic across all interactive primary CTAs
- **Maintain generous whitespace** (`32px` minimum) around key content to support the calm, inviting atmosphere and aid young learner focus
- **Pair Outfit with Quicksand fonts** to preserve the brand's geometric friendliness (Outfit) balanced with approachable body content (Quicksand)
- **Apply brand teal** (`#1C695C`) as the dominant accent in primary buttons and navigation active states to reinforce trust and learning authority
- **Use `9999px` border radius** on input fields to match button styling and create visual consistency across form elements
- **Employ soft shadow treatments** (`rgba(0, 0, 0, 0.1)` for standard cards) rather than harsh drop shadows to keep the interface feeling warm
- **Stack colors by semantic role** in form inputs: blue (`#D0EAF9`) for primary inputs, warm (`#FDF0C6`) for emphasis or alert contexts
- **Honor heading hierarchy** with Outfit's 900 weight for H1/H2 and appropriate scale (50px H1, 48px H2) to guide visual navigation
- **Include hover state transitions** (`0.2s ease` minimum) on all interactive elements for smooth, responsive feedback
- **Test typography on small screens** (mobile readership) to ensure minimum `18px` body text is maintained for accessibility and comfort

### Don't
- **Avoid sharp corners** on major UI components; maintain rounded corners (`32px` minimum) for cards and containers to preserve the nurturing aesthetic
- **Don't use harsh shadows** (`box-shadow: 0px 20px 40px rgba(0,0,0,0.4)` style) that feel clinical or cold; stick to softer `0.1` opacity shadows
- **Don't override typography hierarchy** with size alone; use weight and color in concert to create visual structure that respects the brand voice
- **Avoid light gray text** (`#4B5563`) on light backgrounds without sufficient contrast; ensure WCAG AA compliance (`4.5:1` minimum for body text)
- **Don't use more than two accent colors** (`#1C695C` and `#3B82F6`) in a single section; excessive color creates visual noise and confusion
- **Avoid asymmetric input field styling** that breaks the pill-shaped consistency; all inputs should use `border-radius: 9999px`
- **Don't neglect focus states** on interactive elements; `box-shadow` tinted focus rings with brand color ensure accessibility and provide clear interaction feedback
- **Avoid orphaned text elements** without proper padding or whitespace; minimum `16px` margin around all typography
- **Don't scale buttons below `40px` height** for primary CTAs; smaller buttons feel pinched and reduce touch-target accessibility for young users
- **Avoid using light warning/success colors** without sufficient contrast; ensure badge text meets `7:1` contrast on light backgrounds for visibility

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes | Layout Strategy |
|------|-------|------------|-----------------|
| Mobile | `375px` | Single column, `16px` side padding, `32px` section margins, `14px` body text stays readable, buttons full-width or 2-column | Stacked cards, single-column navigation, hidden secondary nav items, icon-only buttons in tight spaces |
| Tablet | `768px` | Two columns, `24px` side padding, `48px` section margins, 2-3 column card grids, medium input sizes | Flexible grid layouts, tabbed navigation, medium-sized cards (`240px` width), 2-column form layouts |
| Desktop | `1024px`+ | Three columns, `40px` side padding, `64px` section margins, full feature set, large input fields, multi-column layouts | 3-4 column card grids, full horizontal navigation, side-by-side layouts, maximum visual hierarchy expression |
| Large Desktop | `1280px`+ | Max-width container constraint (`1280px`), centered content, full-featured layouts, rich hover states, 4-column layouts possible | Unconstrained layouts within max-width, asymmetric arrangements, floating element placements |

### Touch Targets

- **Minimum touch target:** `44px × 44px` (buttons, links, interactive icons)
- **Standard button height:** `40px` on mobile/tablet, `40px` maintained on desktop
- **Input field height:** `52px` (comfortable touch interaction on all devices)
- **Navigation item padding:** `12px` vertical, `16px` horizontal minimum for mobile nav items
- **Card tap area:** Full card surface (minimum `240px` width on mobile, `264px` on tablet)
- **Link underline thickness:** `2px` (visible and easy to target)
- **Icon button size:** `42px × 42px` (social links, close buttons, action icons)

### Collapsing Strategy

**Mobile (`375px`):**
- Full-width single-column layout; cards stack vertically
- Navigation collapses to hamburger menu; show primary nav items only
- Hero section reduces height by `20%`; text scales to `36px` H1, `28px` H2
- Input fields use full width with `24px` side padding
- Button width: full (100%) or 50% split for secondary actions
- Section padding reduces to `16px` horizontal, `32px` vertical

**Tablet (`768px`):**
- Two-column card grid; main content + sidebar layout supported
- Navigation expands to horizontal with all primary items visible
- Hero section maintains better proportions; text at `42px` H1, `36px` H2
- Input fields constrain to `340px` max-width
- Button sizing increases to `48px` height for comfortable touch
- Section padding: `24px` horizontal, `48px` vertical

**Desktop (`1024px`+):**
- Three-column card grid; asymmetric layouts enabled
- Full horizontal navigation with dropdown support
- Hero section at maximum impact; full `50px` H1 and `48px` H2
- Input fields maintain `52px` height with full interactivity
- Buttons allow for inline layouts and size variation
- Section padding: `40px` horizontal, `64px` vertical
- Max-width container (`1280px`) centers content with auto margins

**Responsive Typography Scaling:**
- H1: `36px` (mobile) → `42px` (tablet) → `50px` (desktop)
- H2: `28px` (mobile) → `36px` (tablet) → `48px` (desktop)
- Body: `16px` (mobile minimum) → `17px` (tablet) → `18px` (desktop)
- Button text: `12px` (mobile) → `13px` (tablet) → `14px` (desktop)

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Brand Teal (`#1C695C`)
- **Secondary CTA:** Secondary Teal (`#3FA48F`)
- **Body Text:** Near Black (`#1F2937`)
- **Heading Text:** Near Black (`#1F2937`)
- **Background (default):** White (`#FFFFFF`)
- **Background (alternate):** Light Gray (`#F3F4F6`)
- **Border/Divider:** Light Gray (`#E5E7EB`)
- **Input Background (blue variant):** Input Blue (`#D0EAF9`)
- **Input Background (warm variant):** Input Warm (`#FDF0C6`)
- **Success State:** Success Green (`#22C55E`)
- **Warning State:** Warning Yellow (`#FBBF24`)
- **Link Color:** Bright Blue (`#3B82F6`)
- **Accent Highlight:** Primary Blue (`#4A90E2`)
- **Secondary Text:** Medium Gray (`#4B5563`)
- **Disabled State:** Light Gray (`#E5E7EB`) background with Medium Gray (`#4B5563`) text

### Iteration Guide

1. **Always use `border-radius: 9999px`** on primary buttons and input fields to maintain the signature pill-shaped, welcoming aesthetic; this is non-negotiable for brand consistency

2. **Typography hierarchy drives layout:** Use Outfit 900 weight for H1/H2 (50px/48px), Quicksand 700 for body (18px), and consistent 1.4x+ line heights to ensure readability for young audiences and parents

3. **Spacing scales on 8px base unit:** All padding/margin values must be multiples of 8 (`8px`, `16px`, `24px`, `32px`, `40px`, etc.); minimum card padding is `24px`, section margins are `48px` to `64px`

4. **Shadow depth follows hierarchy:** Flat (`none`) for ghost components, inset `0.1 opacity` for inputs, standard `0.1 opacity` for cards, `0.35 opacity teal tint` for primary buttons, deep `0.25 opacity` for modals

5. **Color semantic roles are strict:** Brand Teal (`#1C695C`) is primary action only; use Secondary Teal (`#3FA48F`) for hover/secondary states; Input Blue/Warm backgrounds signal form context; Green/Yellow for status only

6. **Mobile-first responsive approach:** Design starts at `375px`, tests at `768px` tablet, scales to `1024px`+ desktop; buttons stay minimum `40px` height, inputs stay `52px`, body text never drops below `16px`

7. **Font pairing must remain consistent:** Outfit (headings, buttons) + Quicksand (body, inputs) with Nunito sparingly for decorative emphasis; no single-font designs; all three fonts serve intentional roles

8. **Contrast compliance is mandatory:** Text on background must achieve `4.5:1` for body (WCAG AA); avoid `#4B5563` on `#E5E7EB` backgrounds; always test light text on colored backgrounds

9. **Interactive states are required for all components:** Buttons need default, hover, active, disabled; inputs need default, focus (`border + shadow tint`), disabled; links need hover underline state; no flat, single-state components

10. **Input field styling is distinctive:** Blue variant (`#D0EAF9`) is primary; Warm variant (`#FDF0C6`) is secondary/alert context; both use `9999px` radius, `14px` left padding offset for icons, inset shadow for depth, focus ring with brand tint