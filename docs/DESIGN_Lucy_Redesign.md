# Design System – Lucy's Class

## 1. Visual Theme & Atmosphere

Lucy's Class là một trung tâm Anh ngữ hiện đại, chuyên nghiệp, lấy học sinh làm trung tâm và đề cao sự thân thiện, ấm áp. Ngôn ngữ thị giác kết hợp giữa tính chuyên nghiệp đương đại và màu sắc thương hiệu tươi tắn — truyền tải sự tin tưởng và năng lượng tích cực trong học tập. Bảng màu cân bằng giữa xanh ngọc đậm uy tín và các accent cam đất, vàng mù tạt tạo điểm nhấn nổi bật. Thiết kế ưu tiên sự rõ ràng và thân thiện, phản ánh cam kết giảng dạy chất lượng cao theo chuẩn quốc tế.

**Key Characteristics**
- Giao diện sạch, chuyên nghiệp với phân cấp typography rõ ràng
- Màu xanh ngọc đậm (`#1C695C`) là linh hồn thương hiệu — trust, growth, authority
- Rounded corners giữ cảm giác thân thiện, approachable cho học sinh và phụ huynh
- Tương phản cao giữa nền trắng và text tối để đảm bảo readability
- Typography hiện đại, sans-serif nhấn mạnh sự rõ ràng và dễ tiếp cận
- Ngôn ngữ thị giác truyền cảm hứng, phù hợp cho môi trường giáo dục
- Global design sensibility phản ánh tiêu chuẩn học tập quốc tế

---

## 2. Color Palette & Roles

### Primary
- **Primary Action** (`#1C695C`): Main call-to-action buttons, primary interactive elements, high-contrast dark states
- **Primary Text** (`#4A4A4A`): Body text, primary heading color, main content messaging

### Accent Colors
- **Earthy Orange / Cam đất** (`#C96A3D`): Highlighted buttons, promotional elements, "Đăng ký ngay" CTAs — màu bổ sung (Complementary) mạnh nhất
- **Secondary Teal / Xanh lá nhạt** (`#3FA48F`): Secondary emphasis, hover states, dynamic content highlights
- **Teal Cyan / Xanh lam ngọc** (`#1C6970`): Tertiary accent, links, information and learning-related accents
- **Mustard Yellow / Vàng mù tạt** (`#D9A441`): Warning states, star ratings, promotional highlights, success moments
- **Deep Purple / Tím than** (`#693D6A`): Premium or specialized program markers, category labels

### Interactive
- **Button Primary** (`#1C695C`): Standard button background with `#FFFFFF` text
- **Button Hover** (`#3FA48F`): Lightened teal state for interactive feedback
- **Link Default** (`#1C6970`): Underlined text links

### Neutral Scale
- **Dark Neutral** (`#000000`): Strong emphasis, borders in dark contexts
- **Charcoal** (`#4A4A4A`): Primary dark interface color, body text
- **Dark Gray** (`#4A4A4A`): Secondary text, paragraph content
- **Medium Gray** (`#6B6B6B`): Tertiary content, disabled states
- **Light Gray** (`#E6DCCF`): Input borders, dividers — warm beige tone
- **Lighter Gray** (`#F5F5F0`): Subtle backgrounds, section dividers — off-white warm
- **White** (`#FFFFFF`): Primary background, card surfaces
- **Neutral Warm** (`#E6DCCF`): Tertiary support, borders, dividers

### Surface & Borders
- **Default Border** (`#E6DCCF`): Input field borders, form dividers
- **Background Surface** (`#FFFFFF`): Primary content areas
- **Subtle Background** (`#F5F5F0`): Section backgrounds, grouped content areas

### Semantic / Status
- **Error/Danger** (`#C96A3D`): Error messages, validation failures, critical alerts
- **Warning** (`#D9A441`): Warning states, important notices, promotional highlights
- **Success** (`#3FA48F`): Positive states, achievement indicators
- **Info** (`#1C6970`): Information and learning-related states

---

## 3. Typography Rules

### Font Family
- **Primary Font:** Outfit (700, 900 weights) — Headings, H1–H3, high-emphasis text. Fallback: `Outfit, system-ui, -apple-system, sans-serif`
- **Secondary Font:** Quicksand (400, 600, 700 weights) — Body text, labels, inputs, nav links. Fallback: `Quicksand, 'Segoe UI', Tahoma, sans-serif`
- **Accent Font:** Nunito (900 weight) — Decorative emphasis, số liệu nổi bật, callout text. Fallback: `Nunito, 'Segoe UI', sans-serif`

### Hierarchy

| Role | Font | Desktop Size | Mobile Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|-------------|-------------|--------|-------------|----------------|-------|
| Display / H1 | Outfit | 50px | 36px | 900 | 60px / 44px | 0px | Hero headlines, page titles |
| Heading 2 | Outfit | 48px | 28px | 900 | 56px / 36px | 0px | Major section headings |
| Heading 3 | Outfit | 28px | 22px | 700 | 36px / 30px | 0px | Subsection titles, card headers |
| Heading 4 | Quicksand | 20px | 18px | 700 | 28px / 26px | 0px | Block headings, secondary titles |
| Body / Paragraph | Quicksand | 18px | 16px | 400 | 28.8px / 25.6px | 0px | Main content, body copy |
| Button / Label | Outfit | 16px | 14px | 700 | 24px / 20px | 0px | Button text, form labels |
| Input / Form Field | Quicksand | 14px | 14px | 600 | 20px | 0px | Input placeholder, form values |
| Link / Small Text | Quicksand | 14px | 12px | 400 | 20px / 18px | 0px | Navigation links, footer text, helper text |
| Small Label | Quicksand | 14px | 13px | 700 | 20px | 0px | Form labels, tags, badges |
| Span / Emphasis | Outfit | 16px | 14px | 700 | 24px / 20px | 0px | Highlighted inline text, strong emphasis |
| Accent / Stat | Nunito | 18px | 16px | 900 | 18px | 0px | Stats, callouts, decorative numbers |
| Nav Link | Quicksand | 16px | 14px | 400 | 24px | 0px | Navigation links |

### Principles
- Outfit 900 cho H1/H2 tạo visual impact rõ ràng — không dùng weight thấp hơn cho headings
- Quicksand cho body — rounded, approachable, dễ đọc cho cả phụ huynh lẫn học sinh
- Maintain minimum 1.5x line-height ratio cho body text để đảm bảo readability
- Letter-spacing giữ nguyên 0px cho tất cả styles — tight, modern look
- Bold weights (700/900) dùng có chọn lọc cho CTAs, labels, headings
- Scale đảm bảo nhất quán giữa desktop (18px body) và mobile (16px body)
- Không tạo thêm font-size không có trong bảng hierarchy

---

## 4. Component Stylings

### Buttons

**Button Primary (Xanh ngọc)**
- Background: `#1C695C`
- Text Color: `#FFFFFF`
- Font: Outfit, 16px (desktop) / 14px (mobile), weight 700
- Padding: `16px 32px`
- Border Radius: `9999px`
- Border: `0px none`
- Box Shadow: `rgba(28, 105, 92, 0.35) 0px 4px 14px 0px`
- Line Height: `24px`
- Height: `56px` desktop / `48px` mobile (full-width on forms)
- Hover State: Background `#3FA48F`, shadow `rgba(28, 105, 92, 0.45) 0px 6px 16px 0px`, transition `0.2s ease`
- Active State: Background `#1C695C`, shadow `rgba(28, 105, 92, 0.5) 0px 2px 8px 0px`
- Disabled State: Background `#E6DCCF`, color `#4A4A4A`, shadow none, cursor not-allowed

**Button Secondary / Promotional (Cam đất)**
- Background: `#C96A3D`
- Text Color: `#FFFFFF`
- Font: Outfit, 16px (desktop) / 14px (mobile), weight 700
- Padding: `16px 32px`
- Border Radius: `9999px`
- Border: `0px none`
- Box Shadow: `rgba(201, 106, 61, 0.35) 0px 4px 14px 0px`
- Line Height: `24px`
- Height: `56px` desktop / `48px` mobile
- Hover State: Background `#B85D33`, transition `0.2s ease`
- Active State: Background `#A05129`
- Use Case: "Đăng ký ngay", "Học thử miễn phí", promotional CTAs

**Button Ghost**
- Background: `transparent`
- Text Color: `#1C695C`
- Font: Outfit, 16px (desktop) / 14px (mobile), weight 700
- Padding: `16px 32px`
- Border Radius: `9999px`
- Border: `2px solid #1C695C`
- Box Shadow: `none`
- Line Height: `24px`
- Hover State: Background `#F5F5F0`, border-color `#3FA48F`, color `#3FA48F`
- Active State: Background `#E6DCCF`

**Button Text / Link Style**
- Background: `transparent`
- Text Color: `#1C695C`
- Font: Quicksand, 16px, weight 700
- Padding: `0px`
- Border: `0px`
- Text Decoration: underline on hover
- Hover State: Color `#3FA48F`, transition `0.2s ease`

### Cards & Containers

**Card Default (Rounded)**
- Background: `#FFFFFF`
- Text Color: `#4A4A4A`
- Font: Quicksand, 16px, weight 400
- Padding: `24px`
- Border Radius: `32px`
- Border: `0px solid transparent`
- Box Shadow: `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px`
- Hover State: Box Shadow `rgba(28, 105, 92, 0.15) 0px 25px 50px -12px`, transform `translateY(-2px)`, transition `0.25s ease`

**Card Highlighted (Teal Header)**
- Header Background: `linear-gradient(135deg, #1C695C, #1C6970)`
- Header Text Color: `#FFFFFF`
- Body Background: `#FFFFFF`
- Body Text Color: `#4A4A4A`
- Padding: `20px` (header), `24px` (body)
- Border Radius: `32px`
- Box Shadow: `rgba(28, 105, 92, 0.2) 0px 10px 15px -3px`

**Card Warm (Beige Accent)**
- Background: `#F5F5F0`
- Border: `1px solid #E6DCCF`
- Padding: `24px`
- Border Radius: `24px`
- Box Shadow: `rgba(0, 0, 0, 0.05) 0px 4px 6px -1px`

**Section Container**
- Background: `#FFFFFF` hoặc `#F5F5F0` (xen kẽ)
- Padding Desktop: `64px 40px`
- Padding Tablet: `48px 24px`
- Padding Mobile: `32px 16px`
- Border Radius: `0px`
- Max Width: `1280px`, centered với `margin: 0 auto`

### Inputs & Forms

**Input Field (Default – Teal Tint)**
- Background: `rgba(28, 105, 92, 0.08)`
- Text Color: `#4A4A4A`
- Font: Quicksand, 14px, weight 600
- Padding: `14px 24px 14px 48px` (có icon trái)
- Border Radius: `9999px`
- Border: `2px solid transparent`
- Box Shadow: `rgba(0, 0, 0, 0.05) 0px 2px 4px 0px inset`
- Height: `52px` tất cả breakpoints
- Line Height: `20px`
- Placeholder Color: `#4A4A4A` opacity `0.6`
- Focus State: Border `2px solid #1C695C`, shadow `rgba(28, 105, 92, 0.15) 0px 0px 0px 3px`
- Error State: Border `2px solid #C96A3D`
- Disabled State: Background `#E6DCCF`, color `#6B6B6B`, cursor not-allowed

**Input Field (Warm Variant)**
- Background: `#FDF5E8` (tint từ `#D9A441`)
- Text Color: `#4A4A4A`
- Font: Quicksand, 14px, weight 600
- Padding: `14px 24px 14px 48px`
- Border Radius: `9999px`
- Border: `2px solid transparent`
- Box Shadow: `rgba(0, 0, 0, 0.05) 0px 2px 4px 0px inset`
- Height: `52px`
- Focus State: Border `2px solid #D9A441`, shadow `rgba(217, 164, 65, 0.15) 0px 0px 0px 3px`

**Input Label**
- Font: Quicksand, 14px, weight 700
- Color: `#4A4A4A`
- Margin Bottom: `8px`
- Display: `block`

**Form Group**
- Margin Bottom: `24px`

### Navigation

**Navigation Container (Desktop)**
- Background: `#FFFFFF`
- Height: `72px`
- Padding: `16px 40px`
- Border Bottom: `1px solid #E6DCCF`
- Box Shadow: `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- Sticky: `position: sticky; top: 0; backdrop-filter: blur(8px)`

**Navigation Container (Mobile)**
- Background: `#FFFFFF`
- Height: `64px`
- Padding: `16px 16px`
- Border Bottom: `1px solid #E6DCCF`

**Navigation Link (Default)**
- Font: Quicksand, 16px (desktop) / 14px (mobile), weight 400
- Color: `#4A4A4A`
- Text Decoration: `none`
- Padding: `8px 16px`
- Line Height: `24px`
- Transition: `0.2s ease`

**Navigation Link (Hover)**
- Color: `#1C695C`
- Text Decoration: `none`

**Navigation Link (Active)**
- Color: `#1C695C`
- Font Weight: `700`
- Border Bottom: `3px solid #1C695C`

**Mobile Navigation (Hamburger Drawer)**
- Background Overlay: `rgba(28, 105, 92, 0.97)`
- Text Color: `#FFFFFF`
- Item Padding: `16px 24px`
- Active Item: Background `rgba(255,255,255,0.15)`, border-left `4px solid #D9A441`

### Badges & Tags

**Badge Primary (Teal)**
- Background: `#1C695C`
- Color: `#FFFFFF`
- Font: Outfit, 12px, weight 700
- Padding: `4px 12px`
- Border Radius: `9999px`
- Display: `inline-block`

**Badge Accent (Cam đất)**
- Background: `#C96A3D`
- Color: `#FFFFFF`
- Font: Outfit, 12px, weight 700
- Padding: `4px 12px`
- Border Radius: `9999px`
- Use Case: "HOT", "Mới", "Giới hạn", promotional labels

**Badge Warning (Vàng mù tạt)**
- Background: `#D9A441`
- Color: `#FFFFFF`
- Font: Outfit, 12px, weight 700
- Padding: `4px 12px`
- Border Radius: `9999px`

**Badge Success (Secondary Teal)**
- Background: `#3FA48F`
- Color: `#FFFFFF`
- Font: Outfit, 12px, weight 700
- Padding: `4px 12px`
- Border Radius: `9999px`

**Badge Premium (Tím than)**
- Background: `#693D6A`
- Color: `#FFFFFF`
- Font: Outfit, 12px, weight 700
- Padding: `4px 12px`
- Border Radius: `9999px`
- Use Case: Chương trình đặc biệt, premium courses

---

## 5. Layout Principles

### Spacing System
- **Base Unit:** `8px`
- **Scale:** 4px, 8px, 16px, 24px, 32px, 48px, 64px
- **Context Usage:**
  - 4px: Micro-spacing giữa inline elements
  - 8px: Padding trong small components, tight grouping
  - 16px: Standard component padding, small margins
  - 24px: Standard card padding, section spacing, form groups
  - 32px: Button padding, medium section margins; section padding mobile
  - 48px: Section padding tablet, vertical rhythm
  - 64px: Major section breaks desktop

### Grid & Container

| Breakpoint | Columns | Side Padding | Section Padding | Max Width |
|-----------|---------|-------------|----------------|-----------|
| Mobile (375px) | 4 | 16px | 32px vertical | 100% |
| Tablet (768px) | 8 | 24px | 48px vertical | 100% |
| Desktop (1024px+) | 12 | 40px | 64px vertical | 1280px |
| Large Desktop (1280px+) | 12 | auto | 64px vertical | 1280px centered |

- **Column Gutter:** 24px tất cả breakpoints
- **Section Pattern:** Full-width background color sections với centered content container
- **Breakpoint-specific Columns:** 4 columns (mobile), 8 columns (tablet), 12 columns (desktop)

### Whitespace Philosophy
- Generous whitespace quanh key content areas thúc đẩy visual hierarchy và readability
- Section spacing 64px (desktop) / 48px (tablet) / 32px (mobile) giữa major content blocks
- Internal card padding 24px duy trì visual rhythm nhất quán
- Vertical rhythm dựa trên bội số của 8px
- Whitespace dẫn dắt sự chú ý của user đến primary CTAs

### Border Radius Scale
- `9999px`: Primary/Secondary buttons, input fields, badges — pill-shape thân thiện
- `32px`: Standard cards, major containers
- `24px`: Secondary containers, modals, alert banners
- `16px`: Small component containers, tooltips
- `8px`: Tags nhỏ
- `0px`: Section backgrounds, full-width dividers

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | `box-shadow: none` | Ghost buttons, text links, disabled, backgrounds |
| Inset (1) | `rgba(0,0,0,0.05) 0px 2px 4px 0px inset` | Inputs, inset depth for form elements |
| Raised (2) | `rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px` | Navigation items, minor cards |
| Elevated (3) | `rgba(0,0,0,0.1) 0px 10px 15px -3px, rgba(0,0,0,0.1) 0px 4px 6px -4px` | Primary cards, containers |
| Brand Float (4) | `rgba(28,105,92,0.35) 0px 4px 14px 0px` | Primary buttons, floating CTAs |
| Deep (5) | `rgba(28,105,92,0.15) 0px 25px 50px -12px` | Hover cards, modal overlays |

**Shadow Philosophy**
Hệ thống dùng shadow nhẹ nhàng, tinh tế — brand-tinted trên primary buttons tạo cảm giác ấm áp thương hiệu. Shadow dùng low opacity (5%–15%) tránh tạo cảm giác nặng nề. Hầu hết elements flat với `box-shadow: none`, chỉ dùng elevation cho cards, containers cần nhấn mạnh, và overlays tương tác chính. Hover states tăng elevation một bậc.

---

## 7. Do's and Don'ts

### Do
- Dùng `#1C695C` cho primary buttons và tất cả active nav states — màu trust của thương hiệu
- Apply `#C96A3D` (cam đất) cho prominent CTAs như "Đăng ký ngay" để tạo high visibility
- Maintain `border-radius: 9999px` cho buttons và inputs — đặc trưng thân thiện của Lucy's Class
- Maintain consistent `24px` spacing giữa sections và trong card padding
- Dùng Outfit weight 700/900 cho tất cả button và heading text
- Dùng neutral scale (`#4A4A4A`, `#E6DCCF`, `#F5F5F0`) cho secondary content và dividers
- Dùng hover transitions `0.2s ease` trên tất cả interactive elements
- Dùng `#1C6970` cho links và secondary interactive states
- Maintain 60px / 44px line-height cho Display/H1 desktop/mobile để đảm bảo readability
- Reserve accent colors (`#D9A441`, `#693D6A`) cho specific content highlights, không dùng làm primary actions
- Full-width buttons trên mobile forms — touch target thuận tiện
- Test minimum 16px body text trên mobile, 18px trên desktop

### Don't
- Đừng dùng sharp corners (`0px border-radius`) trên cards và containers — mất cảm giác thân thiện
- Đừng dùng color đơn độc để communicate status — pair với icons hoặc text labels
- Đừng apply shadows đậm (`opacity > 0.3`) trên primary navigation hoặc flat content containers
- Đừng mix quá 2 accent colors trong một component hoặc section
- Đừng giảm padding dưới `16px` trong form fields hoặc buttons
- Đừng dùng weight nhẹ hơn 400 cho body content hoặc input text
- Đừng dùng `#E6DCCF` (beige) cho text — không đủ contrast
- Đừng vượt quá `32px` padding trên standard buttons — giữ `16px 32px` standard
- Đừng dùng accent colors cho primary CTAs — reserve cho orange (`#C96A3D`) hoặc teal (`#1C695C`)
- Đừng giảm line-height xuống dưới 1.5x font-size cho body text
- Đừng tạo buttons có transparency trừ khi explicitly ghost-style với border
- Đừng bỏ focus states trên interactive elements — accessibility bắt buộc

---

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|------------|
| Mobile | 375px–767px | 4-column grid, 16px side padding, stacked layout, 36px H1, button full-width on forms |
| Tablet | 768px–1023px | 8-column grid, 24px side padding, 2-column card layouts, navigation consolidates, 42px H1 |
| Desktop | 1024px–1280px | 12-column grid, 40px side padding, full multi-column layouts, 50px H1, max-width 1280px |
| Large Desktop | 1281px+ | Center container với max-width `1280px`, add horizontal margin auto |

### Touch Targets
- **Minimum Touch Size:** 48px × 48px cho tất cả interactive elements
- **Button Height Desktop:** `56px`
- **Button Height Mobile:** `48px`, full-width trên forms
- **Minimum Tap Spacing:** 16px padding giữa adjacent interactive elements
- **Link Padding:** Add 8px vertical padding cho small links để đảm bảo adequate touch area
- **Input Field Height:** `52px` tối thiểu tất cả breakpoints
- **Nav Item Padding Mobile:** `16px` vertical, `16px` horizontal
- **Icon Buttons:** `44px × 44px`

### Responsive Typography Scaling

| Style | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| H1 | 36px | 42px | 50px |
| H2 | 28px | 36px | 48px |
| H3 | 22px | 24px | 28px |
| Body | 16px | 17px | 18px |
| Button | 14px | 14px | 16px |
| Nav Link | 14px | 15px | 16px |

### Collapsing Strategy
- **Navigation:** Hamburger drawer từ phải dưới 768px, background `rgba(28,105,92,0.97)`; horizontal full nav trên desktop
- **Cards:** Full-width single column trên mobile → 2-column tablet → 3-column desktop
- **Images:** Scale proportionally với 100% width trên mobile, constrained `max-width` trên desktop
- **Section Padding:** Giảm từ `64px` (desktop) → `48px` (tablet) → `32px` (mobile)
- **Typography:** Maintain hierarchy sizes, giảm margins giữa elements trên mobile
- **Forms:** Stack input groups vertically; full-width inputs; submit button full-width trên mobile
- **Buttons:** Full-width blocks trên mobile forms, inline trên desktop
- **Footer:** Single column stacked trên mobile; 4-column trên desktop

---

## 9. Agent Prompt Guide

### Quick Color Reference

| Vai trò | Tên màu | Hex |
|---------|---------|-----|
| Primary CTA | Xanh ngọc đậm | `#1C695C` |
| Promotional CTA | Cam đất | `#C96A3D` |
| Hover / Secondary | Xanh lá nhạt | `#3FA48F` |
| Links / Info | Xanh lam ngọc | `#1C6970` |
| Warning / Stars | Vàng mù tạt | `#D9A441` |
| Premium Label | Tím than | `#693D6A` |
| Body Text | Xám tro | `#4A4A4A` |
| Heading Text | Xám tro | `#4A4A4A` |
| Background Primary | Trắng | `#FFFFFF` |
| Background Alternate | Trắng ngà | `#F5F5F0` |
| Border / Divider | Be nhạt | `#E6DCCF` |
| Error State | Cam đất | `#C96A3D` |
| Success State | Xanh lá nhạt | `#3FA48F` |
| Information State | Xanh lam ngọc | `#1C6970` |

### Iteration Guide
1. **Primary button background là `#1C695C` với white text, border-radius `9999px`** — signature Lucy's Class, non-negotiable
2. **Promotional button là `#C96A3D`** — chỉ dùng cho "Đăng ký", "Học thử" CTAs nổi bật nhất
3. **Typography: Outfit 900 cho H1/H2, Outfit 700 cho H3/buttons, Quicksand 400–700 cho body** — không thay thế
4. **Spacing bội số 8px** — 16, 24, 32, 48, 64px; không dùng giá trị tùy tiện
5. **Section xen kẽ `#FFFFFF` và `#F5F5F0`** — tạo visual rhythm không cần thêm màu
6. **Cards đều có `border-radius: 32px` + shadow level 3** — consistent warm aesthetic
7. **Hover transitions luôn là `0.2s ease`** trên tất cả interactive elements
8. **Typography hierarchy chặt chẽ: H1=50px/36px weight 900, H2=48px/28px weight 900, H3=28px/22px weight 700, Body=18px/16px weight 400** — không tạo sizes trung gian
9. **Input fields: `height: 52px`, `border-radius: 9999px`, background tint teal `rgba(28,105,92,0.08)`** — form consistency tất cả pages
10. **Tất cả interactive elements cần đủ 4 states:** default, hover, active, disabled

---

## 10. Image & Media Placeholders

> Thay thế các link dưới đây bằng ảnh thực tế khi thiết kế

| Vị trí | Placeholder URL | Kích thước |
|--------|----------------|------------|
| Hero Background | `https://placehold.co/1440x600/1C695C/FFFFFF?text=Hero+Image` | 1440×600 |
| Course Card Image | `https://placehold.co/400x240/1C6970/FFFFFF?text=Course+Image` | 400×240 |
| Teacher Avatar | `https://placehold.co/200x200/3FA48F/FFFFFF?text=Teacher` | 200×200 |
| Blog Post Image | `https://placehold.co/400x220/D9A441/FFFFFF?text=Blog+Image` | 400×220 |
| Testimonial Avatar | `https://placehold.co/64x64/3FA48F/FFFFFF?text=PH` | 64×64 |
| Logo | `https://placehold.co/160x48/1C695C/FFFFFF?text=Lucy%27s+Class` | 160×48 |
| Map / Contact | `https://placehold.co/500x400/1C6970/FFFFFF?text=Map` | 500×400 |
| Video Thumbnail | `https://placehold.co/800x450/1C695C/FFFFFF?text=Video` | 800×450 |
| About Banner | `https://placehold.co/1440x400/3FA48F/FFFFFF?text=About+Banner` | 1440×400 |

---

*File này là design system hoàn chỉnh cho website Lucy's Class — cấu trúc và độ chi tiết tương đương ILA, chỉ khác ở bảng màu thương hiệu độc quyền của Lucy (`#1C695C` teal và accent palette), font stack Outfit + Quicksand, và rounded aesthetic đặc trưng.*