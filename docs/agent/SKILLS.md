# SKILLS.md – Lucy's Class Frontend

> Tài liệu này định nghĩa các kỹ năng (skills) mà AI agent được phép thực hiện trên codebase frontend của Lucy's Class.
> Stack: React 18 + Vite + Tailwind CSS + React Router + Axios

---

## 🔒 BẢO MẬT – ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ

- **NGHIÊM CẤM** đọc, mở, sửa, hoặc tham chiếu bất kỳ file `.env`, `.env.local`, `.env.production`, `.env.staging` nào.
- **CHỈ ĐƯỢC ĐỌC** `frontend/.env.example` và `backend/.env.example` để hiểu tên biến, không được đoán hoặc dùng giá trị thật.
- **NGHIÊM CẤM** sửa bất kỳ file nào liên quan đến auth, token, session, API keys, secret.
- Nếu không chắc file có chứa secret không → **KHÔNG sửa, hỏi trước**.

---

## 1. Cấu trúc project & conventions

### 1.1 Thư mục frontend
```
frontend/src/
├── assets/          # Ảnh import trực tiếp vào React
├── components/      # Shared UI components
│   ├── ChatBox/     # Widget chatbox Lucy
│   ├── Timetable/   # Components thời khóa biểu
│   └── common/      # Button, Modal dùng chung
├── config/          # Cấu hình API URL
├── contexts/        # React Context (Auth...)
├── hooks/           # Custom hooks
├── i18n/            # File dịch vi/en/zh
├── layouts/         # Layout shells (Admin, Staff, Navbar, Footer)
├── pages/           # Pages theo khu vực
│   ├── Admin/
│   ├── Teacher/
│   ├── Marketing/
│   ├── Attendance/
│   └── NotFound/
├── services/        # API service calls (dùng api.js)
├── theme/           # Token màu lucyBrand.js
└── utils/           # Helper functions
```

### 1.2 Quy tắc đặt tên file
- **Component**: PascalCase — `HeroSection.jsx`, `CourseCard.jsx`
- **Hook**: camelCase bắt đầu bằng `use` — `useNotifications.js`
- **Service**: camelCase kết thúc bằng `Service` — `announcementService.js`
- **Utility**: camelCase — `dateUtils.js`, `toastUtils.jsx`
- **Page**: PascalCase, đặt đúng thư mục khu vực — `Admin/SalaryReport.jsx`
- **Context**: PascalCase kết thúc bằng `Context` — `AuthContext.jsx`

### 1.3 Import order convention
```javascript
// 1. React core
import { useState, useEffect } from 'react'
// 2. Third-party libraries
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
// 3. Internal services/utils
import api from '../services/api'
import { formatDate } from '../utils/dateUtils'
// 4. Components
import PrimaryButton from '../components/common/PrimaryButton'
// 5. Styles (nếu có)
import './ComponentName.css'
```

---

## 2. Styling – Tailwind CSS

### 2.1 Nguyên tắc chính
- **LUÔN dùng Tailwind utility classes** — không viết CSS inline trừ trường hợp không thể tránh.
- **Không tạo file `.css` mới** trừ khi thực sự cần animation phức tạp không làm được bằng Tailwind.
- Style global nằm trong `frontend/src/index.css` — chỉ thêm vào đây nếu cần global reset/override.
- Màu sắc custom đã được extend trong `tailwind.config.js` — dùng các class đã có, không hardcode hex.

### 2.2 Color tokens từ `tailwind.config.js` & `theme/lucyBrand.js`
Dùng các class Tailwind sau (đã được define trong config):

| Mục đích | Class Tailwind | Hex |
|---------|---------------|-----|
| Primary CTA | `bg-primary` / `text-primary` | `#1C695C` |
| Secondary/Hover | `bg-secondary` / `text-secondary` | `#3FA48F` |
| Teal Cyan (links) | `text-teal-cyan` | `#1C6970` |
| Accent Orange | `bg-accent-orange` | `#C96A3D` |
| Accent Yellow | `bg-accent-yellow` | `#D9A441` |
| Accent Purple | `bg-accent-purple` | `#693D6A` |
| Body text | `text-body` | `#4A4A4A` |
| Off-white bg | `bg-offwhite` | `#F5F5F0` |
| Beige border | `border-beige` | `#E6DCCF` |

> Nếu token chưa có trong config, thêm vào `tailwind.config.js` → `theme.extend.colors` trước khi dùng.

### 2.3 Responsive pattern (mobile-first)
```jsx
// Luôn viết mobile trước, desktop sau
<div className="px-4 py-8 md:px-6 md:py-12 lg:px-10 lg:py-16">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

Breakpoints chuẩn:
- `sm`: 375px (không cần prefix — default)
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### 2.4 Component styling patterns
```jsx
// Button Primary (pill shape)
className="bg-primary text-white font-outfit font-bold text-sm px-6 py-2.5 rounded-full shadow-brand hover:bg-secondary transition-colors duration-200"

// Card
className="bg-white rounded-[32px] p-6 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-250"

// Input
className="w-full h-[52px] rounded-full border-2 border-transparent bg-primary/8 px-6 pl-12 text-sm font-quicksand font-semibold focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"

// Section container
className="max-w-[1280px] mx-auto px-4 py-8 md:px-6 md:py-12 lg:px-10 lg:py-16"
```

---

## 3. Component creation

### 3.1 Tạo component mới
Mỗi component mới phải có:
```jsx
// ComponentName.jsx
import { useState } from 'react'

// Props phải được destructure rõ ràng
function ComponentName({ title, description, onAction, className = '' }) {
  return (
    <div className={`... ${className}`}>
      {/* content */}
    </div>
  )
}

export default ComponentName
```

- **Luôn dùng functional components + hooks**, không dùng class components.
- **Export default** ở cuối file.
- **Không dùng `React.FC`** hay TypeScript (project dùng JSX thuần).
- Prop `className` nên được nhận để cho phép override từ ngoài.

### 3.2 Component đặt ở đâu?

| Loại | Thư mục |
|------|---------|
| Dùng ở nhiều nơi | `src/components/common/` |
| Chỉ dùng trong landing page | `src/components/` (root) |
| Liên quan chatbox | `src/components/ChatBox/` |
| Liên quan timetable | `src/components/Timetable/` |
| Chỉ dùng cho 1 page | Cùng thư mục với page đó hoặc `src/components/` |

### 3.3 Khi tạo page mới
1. Tạo file trong thư mục đúng khu vực (`Admin/`, `Teacher/`, `Marketing/`...)
2. Thêm route vào `src/App.jsx` đúng section
3. Nếu cần sidebar item → thêm vào `src/layouts/AdminLayout.jsx` hoặc `StaffLayout.jsx`
4. Nếu cần protected route → bọc bằng `<ProtectedRoute allowedRoles={[...]}>`

---

## 4. API calls & Services

### 4.1 Nguyên tắc gọi API
- **LUÔN dùng `src/services/api.js`** (Axios client trung tâm) — không tạo axios instance mới.
- **Không gọi backend URL trực tiếp** — dùng relative path `/api/...`, baseURL đã được cấu hình.
- Exception duy nhất: `streakService.js` dùng `fetch` riêng với `deviceId` — giữ nguyên pattern này cho streak.

```javascript
// ✅ Đúng
import api from '../services/api'
const res = await api.get('/courses')

// ❌ Sai — không tạo axios mới
import axios from 'axios'
const res = await axios.get('http://localhost:5000/api/courses')
```

### 4.2 Tạo service mới
```javascript
// src/services/exampleService.js
import api from './api'

const exampleService = {
  getAll: () => api.get('/example'),
  getById: (id) => api.get(`/example/${id}`),
  create: (data) => api.post('/example', data),
  update: (id, data) => api.put(`/example/${id}`, data),
  delete: (id) => api.delete(`/example/${id}`),
}

export default exampleService
```

### 4.3 Error handling trong component
```javascript
// Pattern chuẩn
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  try {
    setLoading(true)
    const res = await someService.doSomething(data)
    toast.success('Thành công!')
  } catch (err) {
    const msg = err.response?.data?.message || 'Có lỗi xảy ra'
    toast.error(msg)
  } finally {
    setLoading(false)
  }
}
```

### 4.4 Toast notifications
- **Dùng `src/utils/toastUtils.jsx`** cho toast dùng chung.
- `react-toastify` đã được mount global trong `App.jsx` — không mount thêm.

---

## 5. State management

### 5.1 Local state
- `useState` cho state đơn giản trong component.
- `useReducer` khi state phức tạp (nhiều fields liên quan nhau).

### 5.2 Global state
- **Auth state**: dùng `AuthContext` từ `src/contexts/AuthContext.jsx` — không tạo context auth mới.
- **Không dùng Redux** — project không có Redux, không cài thêm.
- Nếu cần share state giữa siblings → lift state up hoặc tạo Context mới trong `src/contexts/`.

### 5.3 Auth context usage
```javascript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, logout, getDashboardPath } = useAuth()
  // user.role: 'admin' | 'teacher' | 'marketing'
}
```

---

## 6. Fonts

### 6.1 Font families (đã import trong project)
- **Outfit** — headings, buttons: `font-outfit`
- **Quicksand** — body, inputs, nav: `font-quicksand`
- **Nunito** — accent/decorative: `font-nunito`

> Kiểm tra `tailwind.config.js` → `theme.extend.fontFamily` trước khi dùng.
> Nếu chưa có → thêm vào config và import Google Fonts trong `index.html`.

### 6.2 Typography classes
```jsx
// H1 — desktop
className="font-outfit font-black text-5xl leading-[60px]"
// H1 — mobile
className="font-outfit font-black text-4xl leading-tight md:text-5xl md:leading-[60px]"

// H2
className="font-outfit font-black text-3xl md:text-5xl"

// Body
className="font-quicksand font-normal text-base md:text-lg leading-relaxed text-body"

// Button
className="font-outfit font-bold text-sm"
```

---

## 7. Animations & transitions

### 7.1 CSS transitions (Tailwind)
- Dùng `transition-all duration-200` hoặc `duration-250` cho hover states.
- Không dùng `duration` dưới 150ms (cảm giác giật).

### 7.2 Framer Motion
- Project đã cài `framer-motion` — dùng cho page transitions và component animations.
- Dùng cho: fade-in sections, slide-in modals, stagger list items.

```jsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

### 7.3 Lenis smooth scroll
- `LenisProvider` đã bọc toàn app — không cấu hình scroll riêng.
- Khi mở modal, dùng `modalScrollLock` từ `src/utils/modalScrollLock.js`.

---

## 8. Đa ngôn ngữ (i18n)

- File dịch: `src/i18n/vi.json`, `en.json`, `zh.json`.
- Khi thêm text mới vào UI → thêm key vào cả 3 file.
- Dùng hook `useTranslation` từ `react-i18next`.

```javascript
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
// <p>{t('hero.title')}</p>
```

---

## 9. Image & asset handling

- Ảnh public (logo, bg): để trong `public/images/`, dùng đường dẫn `/images/filename.png`.
- Ảnh import vào component: để trong `src/assets/`, dùng `import img from '../assets/img.png'`.
- Ảnh từ backend/Cloudinary: dùng helper `src/utils/getImageUrl.js`.
- Placeholder tạm: dùng `https://placehold.co/WxH/1C695C/FFFFFF?text=Label`.

---

## 10. Những việc KHÔNG được làm

- ❌ Không cài thêm package mà không hỏi — đặc biệt là state management library, UI library mới.
- ❌ Không tạo Axios instance mới ngoài `src/services/api.js`.
- ❌ Không sửa `src/services/api.js` (auth interceptor, token refresh logic) — đây là core bảo mật.
- ❌ Không sửa `src/contexts/AuthContext.jsx` — liên quan đến session/auth flow.
- ❌ Không sửa `src/config/api.js` — cấu hình base URL.
- ❌ Không sửa bất kỳ route nào trong `App.jsx` mà không được yêu cầu rõ ràng.
- ❌ Không hardcode màu hex trong JSX — dùng Tailwind class hoặc CSS variable.
- ❌ Không xóa file hiện có — rename hoặc deprecated thay vì xóa.
- ❌ Không thay đổi logic business trong các page Admin (salary, backup, restore).
- ❌ Không đụng vào `src/components/ChatBox/` trừ khi được yêu cầu rõ ràng.