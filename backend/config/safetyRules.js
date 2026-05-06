const DEFAULT_SENSITIVE_REFUSAL =
  'Mình không thể cung cấp thông tin nhạy cảm như thông tin tài khoản, dữ liệu cá nhân, học phí, lương, lịch nội bộ hoặc cấu hình hệ thống. Bạn vui lòng liên hệ trực tiếp trung tâm qua các kênh chính thức nhé.';
const DEFAULT_UNSUPPORTED_LANGUAGE_MESSAGE =
  'Lucy AI hiện chỉ hỗ trợ 3 ngôn ngữ: tiếng Việt, English và 中文. Vui lòng đặt câu hỏi bằng một trong 3 ngôn ngữ này nhé.';

const DEFAULT_SAFETY_RULES = {
  version: 1,
  priorityMode: 'prompt-first',
  allowPromptOverrides: true,
  promptOverrideSyntax: '[allow:<group>]',
  refusalMessage: DEFAULT_SENSITIVE_REFUSAL,
  supportedLanguages: ['vi', 'en', 'zh'],
  unsupportedLanguageMessage: DEFAULT_UNSUPPORTED_LANGUAGE_MESSAGE,
  publicTopics: [
    'cach dang ky',
    'khoa hoc',
    'hoat dong ngoai khoa',
    'kenh lien he chinh thuc',
    'huong dan chung tren website',
  ],
  groups: {
    auth: {
      enabled: true,
      label: 'Auth & Access',
      description:
        'Tai khoan, dang nhap, mat khau, token, cookie, phan quyen, admin, role va cach nang quyen.',
      keywords: [
        'admin',
        'administrator',
        'teacher account',
        'staff account',
        'marketing account',
        'tai khoan',
        'dang nhap',
        'login',
        'username',
        'email dang nhap',
        'so dien thoai dang nhap',
        'mat khau',
        'password',
        'pass',
        'otp',
        'ma xac minh',
        'access token',
        'refresh token',
        'token',
        'jwt',
        'session',
        'cookie',
        'api key',
        'secret key',
        'private key',
        'reset password',
        'link reset',
        'ma reset',
        'one time login',
        'role',
        'vai tro',
        'phan quyen',
        'permission',
        'len quyen',
        'ai la admin',
        'bao nhieu tai khoan staff',
      ],
      phrases: [
        'cach len quyen admin',
        'mat khau chac la gi',
        'token o dau',
        'liet ke email giao vien',
        'so dien thoai phu huynh',
      ],
    },
    personal: {
      enabled: true,
      label: 'Personal & CRM',
      description:
        'Du lieu hoc vien, phu huynh, giao vien, staff, attendance, crm, lich su lien he va thong tin danh tinh.',
      keywords: [
        'ho ten day du',
        'ngay sinh',
        'tuoi chi tiet',
        'so dien thoai',
        'email',
        'dia chi',
        'ho so',
        'giay to',
        'file dinh kem',
        'anh ho so',
        'hoc sinh lop',
        'danh sach hoc sinh',
        'lich hoc ca nhan',
        'diem danh',
        'lich su hoc',
        'ghi chu giao vien',
        'danh gia noi bo',
        'ten phu huynh',
        'trang thai lien he',
        'lich su dang ky',
        'lich su trao doi',
        'ghi chu sales',
        'ghi chu marketing',
        'ghi chu admin',
        'lead',
        'crm',
        'check in',
        'check out',
        'attendance',
        'nghi lam',
        'di muon',
        'ai dang nghi lam hom nay',
      ],
      subjectKeywords: [
        'hoc vien',
        'hoc sinh',
        'phu huynh',
        'giao vien',
        'teacher',
        'staff',
        'nhan vien',
        'marketing',
        'lop',
        'class',
      ],
      sensitiveKeywords: [
        'ten',
        'so dien thoai',
        'email',
        'dia chi',
        'ngay sinh',
        'tuoi',
        'lich hoc',
        'lich day',
        'lich su',
        'ho so',
        'anh',
        'ghi chu',
        'danh sach',
        'thong tin',
        'chi tiet',
        'attendance',
        'check in',
        'check out',
        'trang thai',
      ],
      phrases: [
        'phu huynh nao chua dong hoc phi',
        'cho minh danh sach hoc sinh lop',
        'giao vien nao day lop',
        'lien he phu huynh',
      ],
    },
    finance: {
      enabled: true,
      label: 'Finance',
      description:
        'Hoc phi, luong, thuong, hoa hong, cong no, thanh toan, giam gia, hoan tien va bao cao tai chinh.',
      keywords: [
        'hoc phi',
        'tuition',
        'luong',
        'salary',
        'thuong',
        'bonus',
        'hoa hong',
        'commission',
        'doanh so',
        'kpi',
        'test dau vao',
        'bang luong',
        'bao cao luong',
        'cau hinh luong',
        'cong no',
        'thanh toan',
        'refund',
        'hoan tien',
        'giam gia',
        'discount',
        'hoc phi cu the',
        'luong teacher',
        'luong staff',
      ],
      phrases: ['luong teacher a bao nhieu', 'phu huynh nao chua dong hoc phi'],
    },
    internal_ops: {
      enabled: true,
      label: 'Internal Ops & Infrastructure',
      description:
        'Env, database, backend, log, audit, timetable noi bo, danh sach lop, drafts, exports, private storage va tich hop ben thu ba.',
      keywords: [
        '.env',
        ' env ',
        'bien moi truong',
        'config noi bo',
        'database',
        'db',
        'mongodb',
        'redis',
        'cloudinary',
        'google api',
        'sendgrid',
        'recaptcha secret',
        'oauth',
        'client secret',
        'redirect noi bo',
        'server',
        'backend',
        'source code',
        'endpoint noi bo',
        'backup',
        'restore',
        'cron',
        'script van hanh',
        'log he thong',
        'stack trace',
        'audit',
        'deploy',
        'domain noi bo',
        'ip',
        'port',
        'machine path',
        'thoi khoa bieu noi bo',
        'phong hoc',
        'slot hoc',
        'si so thuc te',
        'phan cong giao vien',
        'note dieu hanh',
        'announcement cho duyet',
        'draft marketing',
        'lich dang',
        'ke hoach truyen thong',
        'admin history',
        'audit trail',
        'session conflict',
        'export csv',
        'google drive',
        'google sheets',
        'private url',
        'storage',
        'file backup',
        'excel noi bo',
        'csv noi bo',
        'danh sach lop',
      ],
      subjectKeywords: ['lop', 'class', 'phong', 'slot', 'giao vien', 'staff', 'admin'],
      sensitiveKeywords: [
        'lich',
        'gio',
        'thoi khoa bieu',
        'phong hoc',
        'danh sach',
        'si so',
        'phan cong',
        'ghi chu',
        'noi bo',
        'audit',
        'export',
        'endpoint',
        'config',
        'backup',
      ],
      phrases: [
        'env dat cho nao',
        'teacher nao day lop x luc 7h',
        'ai sua gi',
        'export csv noi bo',
      ],
    },
  },
};

function cloneDefaultSafetyRules() {
  return JSON.parse(JSON.stringify(DEFAULT_SAFETY_RULES));
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s\[\]\-:]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeStringArray(value, fallback = []) {
  if (!Array.isArray(value)) return [...fallback];

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeGroupRules(baseGroup, rawGroup) {
  if (!rawGroup || typeof rawGroup !== 'object') {
    return { ...baseGroup };
  }

  return {
    ...baseGroup,
    enabled: typeof rawGroup.enabled === 'boolean' ? rawGroup.enabled : baseGroup.enabled,
    label: typeof rawGroup.label === 'string' ? rawGroup.label.trim() || baseGroup.label : baseGroup.label,
    description:
      typeof rawGroup.description === 'string'
        ? rawGroup.description.trim() || baseGroup.description
        : baseGroup.description,
    keywords: sanitizeStringArray(rawGroup.keywords, baseGroup.keywords),
    subjectKeywords: sanitizeStringArray(rawGroup.subjectKeywords, baseGroup.subjectKeywords || []),
    sensitiveKeywords: sanitizeStringArray(
      rawGroup.sensitiveKeywords,
      baseGroup.sensitiveKeywords || []
    ),
    phrases: sanitizeStringArray(rawGroup.phrases, baseGroup.phrases || []),
  };
}

function mergeSafetyRules(rawRules) {
  const merged = cloneDefaultSafetyRules();

  if (!rawRules || typeof rawRules !== 'object') {
    return merged;
  }

  if (typeof rawRules.version === 'number') merged.version = rawRules.version;
  if (rawRules.priorityMode === 'rules-first' || rawRules.priorityMode === 'prompt-first') {
    merged.priorityMode = rawRules.priorityMode;
  }
  if (typeof rawRules.allowPromptOverrides === 'boolean') {
    merged.allowPromptOverrides = rawRules.allowPromptOverrides;
  }
  if (typeof rawRules.promptOverrideSyntax === 'string' && rawRules.promptOverrideSyntax.trim()) {
    merged.promptOverrideSyntax = rawRules.promptOverrideSyntax.trim();
  }
  if (typeof rawRules.refusalMessage === 'string' && rawRules.refusalMessage.trim()) {
    merged.refusalMessage = rawRules.refusalMessage.trim();
  }
  if (Array.isArray(rawRules.supportedLanguages)) {
    merged.supportedLanguages = sanitizeStringArray(
      rawRules.supportedLanguages,
      merged.supportedLanguages
    )
      .map((item) => item.toLowerCase())
      .filter(Boolean);
  }
  if (
    typeof rawRules.unsupportedLanguageMessage === 'string' &&
    rawRules.unsupportedLanguageMessage.trim()
  ) {
    merged.unsupportedLanguageMessage = rawRules.unsupportedLanguageMessage.trim();
  }
  if (Array.isArray(rawRules.publicTopics)) {
    merged.publicTopics = sanitizeStringArray(rawRules.publicTopics, merged.publicTopics);
  }

  const rawGroups = rawRules.groups && typeof rawRules.groups === 'object' ? rawRules.groups : {};
  Object.keys(merged.groups).forEach((groupId) => {
    merged.groups[groupId] = mergeGroupRules(merged.groups[groupId], rawGroups[groupId]);
  });

  return merged;
}

function getPromptOverrideSet(systemPrompt, safetyRules) {
  const overrides = new Set();
  if (!systemPrompt || safetyRules.priorityMode !== 'prompt-first' || !safetyRules.allowPromptOverrides) {
    return overrides;
  }

  const promptText = String(systemPrompt);
  const pattern = /\[allow:([a-z_, -]+)\]/gi;
  let match;

  while ((match = pattern.exec(promptText))) {
    const rawIds = match[1]
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (rawIds.includes('all')) {
      Object.keys(safetyRules.groups).forEach((groupId) => overrides.add(groupId));
      continue;
    }

    rawIds.forEach((groupId) => {
      if (safetyRules.groups[groupId]) {
        overrides.add(groupId);
      }
    });
  }

  return overrides;
}

function stripPromptOverrideTokens(systemPrompt) {
  return String(systemPrompt || '')
    .replace(/\[allow:[a-z_, -]+\]/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function includesAny(normalizedText, terms = []) {
  return terms.some((term) => normalizedText.includes(normalizeText(term)));
}

function matchesGroup(normalizedText, group) {
  if (!group?.enabled || !normalizedText) return false;

  if (includesAny(normalizedText, group.keywords)) return true;
  if (includesAny(normalizedText, group.phrases)) return true;

  const hasSubjectKeywords = Array.isArray(group.subjectKeywords) && group.subjectKeywords.length > 0;
  const hasSensitiveKeywords =
    Array.isArray(group.sensitiveKeywords) && group.sensitiveKeywords.length > 0;

  if (!hasSubjectKeywords || !hasSensitiveKeywords) {
    return false;
  }

  return (
    includesAny(normalizedText, group.subjectKeywords) &&
    includesAny(normalizedText, group.sensitiveKeywords)
  );
}

function findTriggeredSafetyGroup(text, safetyRules, promptOverrides = new Set()) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return null;

  for (const [groupId, group] of Object.entries(safetyRules.groups || {})) {
    if (promptOverrides.has(groupId)) continue;
    if (matchesGroup(normalizedText, group)) {
      return { groupId, label: group.label };
    }
  }

  return null;
}

function buildSafetySystemPrompt(safetyRules, promptOverrides = new Set()) {
  const activeGroups = Object.entries(safetyRules.groups || {}).filter(
    ([groupId, group]) => group.enabled && !promptOverrides.has(groupId)
  );

  if (!activeGroups.length) {
    return '';
  }

  const blockedLines = activeGroups
    .map(([, group]) => `- ${group.label}: ${group.description}`)
    .join('\n');
  const publicTopics = sanitizeStringArray(safetyRules.publicTopics).join(', ');

  return [
    'Runtime safety layer for this chat:',
    `- Only answer in supported languages: ${(safetyRules.supportedLanguages || []).join(', ')}.`,
    '- Refuse requests for private, internal, financial, auth or infrastructure data listed below.',
    blockedLines,
    `- If the user asks outside public topics (${publicTopics}) and you are not sure whether the data is public, refuse and redirect to official channels.`,
    `- Refusal message to preserve meaning: "${safetyRules.refusalMessage}".`,
  ].join('\n');
}

function getPublicSafetyRuleSummary(safetyRules) {
  const merged = mergeSafetyRules(safetyRules);
  return {
    version: merged.version,
    priorityMode: merged.priorityMode,
    allowPromptOverrides: merged.allowPromptOverrides,
    promptOverrideSyntax: merged.promptOverrideSyntax,
    refusalMessage: merged.refusalMessage,
    supportedLanguages: merged.supportedLanguages,
    unsupportedLanguageMessage: merged.unsupportedLanguageMessage,
    publicTopics: merged.publicTopics,
    groups: Object.fromEntries(
      Object.entries(merged.groups).map(([groupId, group]) => [
        groupId,
        {
          enabled: group.enabled,
          label: group.label,
          description: group.description,
        },
      ])
    ),
  };
}

const UNSUPPORTED_SCRIPT_REGEX =
  /[\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Thai}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Greek}]/u;
const HAN_REGEX = /\p{Script=Han}/u;
const VIETNAMESE_CHAR_REGEX = /[ăâêôơưđáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const LATIN_LETTER_REGEX = /\p{Script=Latin}/u;

const ENGLISH_HINTS = new Set([
  'a',
  'about',
  'activities',
  'after',
  'and',
  'are',
  'available',
  'can',
  'class',
  'classes',
  'contact',
  'course',
  'courses',
  'details',
  'do',
  'english',
  'enroll',
  'fee',
  'fees',
  'hello',
  'help',
  'how',
  'i',
  'information',
  'is',
  'learn',
  'me',
  'my',
  'need',
  'of',
  'parent',
  'please',
  'price',
  'pricing',
  'register',
  'registration',
  'schedule',
  'student',
  'students',
  'student',
  'teacher',
  'teachers',
  'the',
  'this',
  'trial',
  'to',
  'tuition',
  'want',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'you',
  'your',
]);

const VIETNAMESE_HINTS = new Set([
  'ban',
  'bao',
  'be',
  'biet',
  'cach',
  'cho',
  'co',
  'dang',
  'dang ky',
  'duoc',
  'giao',
  'giao vien',
  'gi',
  'hoc',
  'hoc thu',
  'hoc phi',
  'hoc sinh',
  'kh',
  'khoa',
  'khoa hoc',
  'khong',
  'lien he',
  'lop',
  'minh',
  'nao',
  'nhan',
  'nhu',
  'o',
  'phu huynh',
  'sdt',
  'so',
  'the',
  'thong tin',
  'toi',
  'trung',
  'trung tam',
  'tu van',
  'website',
]);

const ENGLISH_SHORTCUTS = new Set([
  'hi',
  'hello',
  'help',
  'course',
  'courses',
  'contact',
  'register',
  'registration',
  'trial',
  'tuition',
  'schedule',
  'price',
  'pricing',
  'thanks',
  'thank',
]);

const VIETNAMESE_SHORTCUTS = new Set([
  'chao',
  'xin',
  'hoc',
  'lop',
  'khoa',
  'dang',
  'ky',
  'hocphi',
  'hocphi?',
  'lienhe',
  'thuvien',
  'streak',
]);

function getHintScore(tokens, hints) {
  return tokens.reduce((score, token) => score + (hints.has(token) ? 1 : 0), 0);
}

function getRequiredHintScore(tokens) {
  if (tokens.length <= 2) return 1;
  if (tokens.length <= 6) return 2;
  return 3;
}

function hasSupportedShortcut(tokens, shortcuts) {
  return tokens.some((token) => shortcuts.has(token));
}

function detectSupportedLanguage(text, safetyRules) {
  const rawText = String(text || '').trim();
  if (!rawText) {
    return { supported: true, code: null };
  }

  if (UNSUPPORTED_SCRIPT_REGEX.test(rawText)) {
    return { supported: false, code: null, reason: 'unsupported-script' };
  }

  if (HAN_REGEX.test(rawText)) {
    return { supported: true, code: 'zh' };
  }

  if (!LATIN_LETTER_REGEX.test(rawText)) {
    return { supported: true, code: null };
  }

  if (VIETNAMESE_CHAR_REGEX.test(rawText)) {
    return { supported: true, code: 'vi' };
  }

  const tokens = normalizeText(rawText)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return { supported: true, code: null };
  }

  const englishScore = getHintScore(tokens, ENGLISH_HINTS);
  const vietnameseScore = getHintScore(tokens, VIETNAMESE_HINTS);
  const requiredHintScore = getRequiredHintScore(tokens);

  if (
    vietnameseScore >= requiredHintScore ||
    (tokens.length <= 2 && hasSupportedShortcut(tokens, VIETNAMESE_SHORTCUTS))
  ) {
    return { supported: true, code: 'vi' };
  }

  if (
    englishScore >= requiredHintScore ||
    (tokens.length <= 2 && hasSupportedShortcut(tokens, ENGLISH_SHORTCUTS))
  ) {
    return { supported: true, code: 'en' };
  }

  return { supported: false, code: null, reason: 'unsupported-language' };
}

module.exports = {
  DEFAULT_SAFETY_RULES,
  DEFAULT_SENSITIVE_REFUSAL,
  DEFAULT_UNSUPPORTED_LANGUAGE_MESSAGE,
  buildSafetySystemPrompt,
  cloneDefaultSafetyRules,
  detectSupportedLanguage,
  findTriggeredSafetyGroup,
  getPromptOverrideSet,
  getPublicSafetyRuleSummary,
  mergeSafetyRules,
  stripPromptOverrideTokens,
};
