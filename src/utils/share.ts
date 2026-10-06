export interface SharedDiscussionPayload {
  question: string;
  answer: string;
  timestamp: number;
}

// Encode UTF-8 safe base64
export function generateShareUrl(question: string, answer: string, timestamp: number = Date.now()): string {
  try {
    const payload: SharedDiscussionPayload = {
      question: question || 'Question posée sur JANGO',
      answer: answer,
      timestamp: timestamp,
    };
    const json = JSON.stringify(payload);
    // Safe base64 encoding handling accents and unicode
    const utf8Bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const b64 = btoa(binary);
    const cleanUrl = window.location.origin + window.location.pathname;
    return `${cleanUrl}#share=${encodeURIComponent(b64)}`;
  } catch (err) {
    console.error('Error generating share URL:', err);
    return window.location.href;
  }
}

// Decode UTF-8 safe base64
export function parseShareUrlHash(hash: string): SharedDiscussionPayload | null {
  try {
    if (!hash || !hash.includes('#share=')) return null;
    const rawB64 = decodeURIComponent(hash.split('#share=')[1]);
    const binary = atob(rawB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.answer === 'string') {
      return parsed as SharedDiscussionPayload;
    }
    return null;
  } catch (err) {
    console.error('Error decoding shared discussion:', err);
    return null;
  }
}
