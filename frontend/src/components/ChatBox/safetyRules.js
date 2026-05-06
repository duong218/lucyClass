export const DEFAULT_SAFETY_RULES = {
  version: 1,
  priorityMode: "prompt-first",
  allowPromptOverrides: true,
  promptOverrideSyntax: "[allow:<group>]",
  refusalMessage:
    "Mình không thể cung cấp thông tin nhạy cảm như thông tin tài khoản, dữ liệu cá nhân, học phí, lương, lịch nội bộ hoặc cấu hình hệ thống. Bạn vui lòng liên hệ trực tiếp trung tâm qua các kênh chính thức nhé.",
  supportedLanguages: ["vi", "en", "zh"],
  unsupportedLanguageMessage:
    "Lucy AI hiện chỉ hỗ trợ 3 ngôn ngữ: tiếng Việt, English và 中文. Vui lòng đặt câu hỏi bằng một trong 3 ngôn ngữ này nhé.",
  groups: {
    auth: {
      enabled: true,
      label: "Auth & Access",
      description:
        "Tai khoan, dang nhap, mat khau, token, cookie, phan quyen, admin, role va cach nang quyen.",
    },
    personal: {
      enabled: true,
      label: "Personal & CRM",
      description:
        "Du lieu hoc vien, phu huynh, giao vien, staff, attendance, crm, lich su lien he va thong tin danh tinh.",
    },
    finance: {
      enabled: true,
      label: "Finance",
      description:
        "Hoc phi, luong, thuong, hoa hong, cong no, thanh toan, giam gia, hoan tien va bao cao tai chinh.",
    },
    internal_ops: {
      enabled: true,
      label: "Internal Ops & Infrastructure",
      description:
        "Env, database, backend, log, audit, timetable noi bo, danh sach lop, drafts, exports, private storage va tich hop ben thu ba.",
    },
  },
};

export function cloneSafetyRules() {
  return JSON.parse(JSON.stringify(DEFAULT_SAFETY_RULES));
}
