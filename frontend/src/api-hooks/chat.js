import { useMutation } from '@tanstack/react-query';
import api from '../utils/api';

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
      throw new Error(payload.error.message || 'Chat request failed');
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

      const rawData = dataLine.replace(/^data:\s*/, '');

      if (!rawData) {
        continue;
      }

      try {
        const payload = JSON.parse(rawData);
        handlePayload(payload);
      } catch (error) {
        throw new Error('Failed to parse chat stream response');
      }
    }

    if (done) {
      break;
    }
  }

  return { text, sources };
}

export const useChat = () => {
  return useMutation({
    mutationFn: async ({ message, onChunk, onSources }) => {
      const response = await fetch(`${api.defaults.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      return readSseResponse(response, { onChunk, onSources });
    },
  });
};
