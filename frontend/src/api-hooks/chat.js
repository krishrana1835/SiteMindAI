import { useMutation } from '@tanstack/react-query';

async function readSseResponse(response, { onChunk, onSources } = {}) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Chat request failed');
  }

  if (!response.body) {
    throw new Error('Streaming response is not available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let sources = [];
  let streamError = null;

  const handlePayload = (payload) => {
    if (payload.text) {
      text += payload.text;
      if (onChunk) {
        onChunk(payload.text, text);
      }
    }

    if (Array.isArray(payload.sources)) {
      sources = payload.sources;
      if (onSources) {
        onSources(payload.sources);
      }
    }

    if (payload.error) {
      streamError =
        typeof payload.error === 'string'
          ? payload.error
          : payload.error.message || 'Chat request failed';
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const events = buffer.split(/\n\n/);
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLine = event
        .split(/\r?\n/)
        .find((line) => line.startsWith('data:'));

      if (!dataLine) {
        continue;
      }

      const rawData = dataLine.replace(/^data:\s*/, '').trim();

      if (!rawData || rawData === '[DONE]') {
        continue;
      }

      try {
        const payload = JSON.parse(rawData);
        handlePayload(payload);
      } catch (error) {
        console.warn('Failed to parse SSE payload:', rawData, error);
      }
    }

    if (done) {
      break;
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }

  return { text, sources };
}

export const useChat = () => {
  return useMutation({
    mutationFn: async ({ message, siteIds, onChunk, onSources }) => {
      const sessionId = localStorage.getItem('sessionId');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message, siteIds }),
      });

      return readSseResponse(response, { onChunk, onSources });
    },
  });
};