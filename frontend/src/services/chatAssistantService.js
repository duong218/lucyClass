import { BASE_URL } from "./api";

const REQUEST_TIMEOUT_MS = 20000;

/**
 * Lấy reCAPTCHA v3 token.
 * Dùng grecaptcha trực tiếp thay vì hook vì service này được gọi ngoài React tree.
 * RecaptchaProvider đã load script và expose grecaptcha lên window rồi.
 */
async function getRecaptchaToken() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey || !window.grecaptcha?.execute) return null;

  try {
    return await window.grecaptcha.execute(siteKey, { action: "chat" });
  } catch {
    return null;
  }
}

export async function askAssistant(history) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Lấy token reCAPTCHA v3 — chạy song song không cần await trước
    const recaptchaToken = await getRecaptchaToken();

    const headers = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };

    if (recaptchaToken) {
      headers["X-Recaptcha-Token"] = recaptchaToken;
    }

    const response = await fetch(`${BASE_URL}/api/chat-config/ask`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ history }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data?.message || response.statusText);
      error.code = data?.code || "AI_PROVIDER_ERROR";
      throw error;
    }

    const reply = data?.reply;
    if (!reply) {
      const error = new Error("No response text returned from chat proxy");
      error.code = "EMPTY_RESPONSE";
      throw error;
    }

    return reply.trim();
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Assistant request timed out");
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}