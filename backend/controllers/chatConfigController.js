/**
 * controllers/chatConfigController.js
 *
 * GET  /api/chat-config         - public, only widget-facing config
 * GET  /api/chat-config/admin   - admin only, prompt + visible widget config
 * PUT  /api/chat-config         - admin only, update config
 * POST /api/chat-config/ask     - public, backend proxy to Groq with pre-model safety blocking
 */

const axios = require('axios');
const ChatConfig = require('../models/ChatConfig');
const {
  DEFAULT_SENSITIVE_REFUSAL,
  buildSafetySystemPrompt,
  detectSupportedLanguage,
  findTriggeredSafetyGroup,
  getPromptOverrideSet,
  mergeSafetyRules,
  stripPromptOverrideTokens,
} = require('../config/safetyRules');

const GROQ_MODEL = 'openai/gpt-oss-20b';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TIMEOUT_MS = 20000;
const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 2000;

const DEFAULT_SYSTEM_PROMPT = `Bạn là trợ lý ảo thân thiện của trung tâm thiếu nhi Lucy. Hãy trả lời ngắn gọn, rõ ràng, vui vẻ và dùng emoji phù hợp.

## NGUYÊN TẮC BẮT BUỘC
- Không bịa thông tin. Nếu không chắc thì nói rõ và hướng dẫn liên hệ trung tâm.
- Mỗi câu trả lời tối đa 4-5 câu, không dài dòng.
- Trả lời theo đúng ngôn ngữ người dùng đang sử dụng nếu đó là tiếng Việt, English hoặc 中文.
- Không trả lời các chủ đề ngoài phạm vi trung tâm (tin tức, chính trị, code, v.v.)

## KÊNH LIÊN HỆ CHÍNH THỨC
- Website: https://lucyclass.com
- Zalo: https://zalo.me/0973702074
- Facebook: https://www.facebook.com/lucyclass2019
- TikTok: https://www.tiktok.com/@lucyclass`;

const DEFAULT_SUGGESTIONS = [
  'Đăng ký học như thế nào? 📝',
  'Có những khóa học nào? 📚',
  'Hoạt động ngoại khóa có gì? 🎉',
  'Theo dõi trung tâm ở đâu? 📱',
  'Streak là gì? 🔥',
  'Sau đăng ký bao lâu được học? ⏳',
];

const DEFAULT_CHAT_CONFIG = {
  botName: 'Lucy AI',
  welcomeMessage:
    'Xin chào! 👋 Mình là trợ lý ảo của trung tâm Lucy.\nMình có thể giúp bạn tìm hiểu về khóa học, cách đăng ký và các hoạt động của trung tâm. Bạn muốn hỏi gì nào? 😊',
  accentColor: 'from-teal-600 to-teal-800',
  bubbleColor: 'bg-teal-50 text-teal-900',
  accentHex: '#1C695C',
};

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'bot') && typeof msg.text === 'string')
    .map((msg) => ({
      role: msg.role,
      text: msg.text.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((msg) => msg.text.length > 0)
    .slice(-MAX_HISTORY);
}

function buildPublicPayload(config) {
  return {
    suggestions: config?.suggestions?.length ? config.suggestions : DEFAULT_SUGGESTIONS,
    chatConfig: {
      ...DEFAULT_CHAT_CONFIG,
      ...(config?.chatConfig || {}),
    },
  };
}

function buildAdminPayload(config) {
  return {
    systemPrompt: config?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    suggestions: config?.suggestions?.length ? config.suggestions : DEFAULT_SUGGESTIONS,
    chatConfig: {
      ...DEFAULT_CHAT_CONFIG,
      ...(config?.chatConfig || {}),
    },
  };
}

exports.getConfig = async (req, res) => {
  try {
    const config = await ChatConfig.findOne({ _singleton: 'default' }).lean();
    return res.json(buildPublicPayload(config));
  } catch (err) {
    console.error('[ChatConfig] GET public error:', err);
    return res.json(buildPublicPayload(null));
  }
};

exports.getAdminConfig = async (req, res) => {
  try {
    const config = await ChatConfig.findOne({ _singleton: 'default' }).lean();
    return res.json(buildAdminPayload(config));
  } catch (err) {
    console.error('[ChatConfig] GET admin error:', err);
    return res.json(buildAdminPayload(null));
  }
};

exports.askAssistant = async (req, res) => {
  try {
    const history = sanitizeHistory(req.body?.history);

    if (!history.length) {
      return res.status(400).json({ success: false, code: 'INVALID_HISTORY', message: 'history không hợp lệ' });
    }

    const lastUserMessage = [...history].reverse().find((msg) => msg.role === 'user');
    if (!lastUserMessage) {
      return res.status(400).json({ success: false, code: 'INVALID_HISTORY', message: 'Thiếu tin nhắn user' });
    }

    const config = await ChatConfig.findOne({ _singleton: 'default' }).lean();
    const safetyRules = mergeSafetyRules(config?.safetyRules);
    const rawSystemPrompt = config?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const promptOverrides = getPromptOverrideSet(rawSystemPrompt, safetyRules);
    const languageCheck = detectSupportedLanguage(lastUserMessage.text, safetyRules);

    if (!languageCheck.supported) {
      return res.json({
        success: true,
        reply: safetyRules.unsupportedLanguageMessage,
        blockedLanguage: true,
        blockedReason: languageCheck.reason || 'unsupported-language',
      });
    }

    const blockedGroup = findTriggeredSafetyGroup(lastUserMessage.text, safetyRules, promptOverrides);

    if (blockedGroup) {
      return res.json({
        success: true,
        reply: safetyRules.refusalMessage || DEFAULT_SENSITIVE_REFUSAL,
        blockedSensitive: true,
        blockedGroup: blockedGroup.groupId,
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(503).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: 'GROQ API key chưa được cấu hình ở backend',
      });
    }

    const systemPrompt = stripPromptOverrideTokens(rawSystemPrompt) || DEFAULT_SYSTEM_PROMPT;
    const runtimeSafetyPrompt = buildSafetySystemPrompt(safetyRules, promptOverrides);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(runtimeSafetyPrompt ? [{ role: 'system', content: runtimeSafetyPrompt }] : []),
      ...history.map((msg) => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.text,
      })),
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 400,
      },
      {
        timeout: GROQ_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({
        success: false,
        code: 'EMPTY_RESPONSE',
        message: 'Groq không trả về nội dung hợp lệ',
      });
    }

    return res.json({ success: true, reply });
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.response?.data?.message || err.message;

    if (status === 429) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT',
        message: 'Groq rate limit exceeded',
      });
    }

    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        code: 'TIMEOUT',
        message: 'Groq request timed out',
      });
    }

    console.error('[ChatConfig] ASK error:', message);
    return res.status(502).json({
      success: false,
      code: 'GROQ_ERROR',
      message: message || 'Không thể lấy phản hồi từ Groq',
    });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { systemPrompt, suggestions, chatConfig, safetyRules } = req.body;

    if (systemPrompt !== undefined && typeof systemPrompt !== 'string') {
      return res.status(400).json({ success: false, message: 'systemPrompt phải là string' });
    }
    if (suggestions !== undefined && !Array.isArray(suggestions)) {
      return res.status(400).json({ success: false, message: 'suggestions phải là array' });
    }
    if (suggestions && suggestions.some((s) => typeof s !== 'string')) {
      return res.status(400).json({ success: false, message: 'Mỗi suggestion phải là string' });
    }
    if (suggestions && suggestions.length > 10) {
      return res.status(400).json({ success: false, message: 'Tối đa 10 suggestions' });
    }
    if (safetyRules !== undefined && (typeof safetyRules !== 'object' || Array.isArray(safetyRules))) {
      return res.status(400).json({ success: false, message: 'safetyRules phải là object' });
    }

    const updateData = {};
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt.trim();
    if (suggestions !== undefined) {
      updateData.suggestions = suggestions.map((s) => s.trim()).filter(Boolean);
    }
    if (safetyRules !== undefined) {
      updateData.safetyRules = mergeSafetyRules(safetyRules);
    }
    if (chatConfig !== undefined) {
      updateData['chatConfig.botName'] = chatConfig.botName || DEFAULT_CHAT_CONFIG.botName;
      updateData['chatConfig.welcomeMessage'] =
        chatConfig.welcomeMessage || DEFAULT_CHAT_CONFIG.welcomeMessage;
      updateData['chatConfig.accentColor'] =
        chatConfig.accentColor || DEFAULT_CHAT_CONFIG.accentColor;
      updateData['chatConfig.bubbleColor'] =
        chatConfig.bubbleColor || DEFAULT_CHAT_CONFIG.bubbleColor;
      updateData['chatConfig.accentHex'] = chatConfig.accentHex || DEFAULT_CHAT_CONFIG.accentHex;
    }

    const updated = await ChatConfig.findOneAndUpdate(
      { _singleton: 'default' },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Cập nhật cấu hình chatbox thành công',
      data: buildAdminPayload(updated),
    });
  } catch (err) {
    console.error('[ChatConfig] PUT error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lưu cấu hình' });
  }
};
