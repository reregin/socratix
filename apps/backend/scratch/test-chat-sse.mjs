const prompt =
  process.argv.slice(2).join(' ') || 'I think the answer is 9 for 3x + 5 = 14';
const endpoint = process.env.CHAT_SSE_URL || 'http://localhost:3000/chat';

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  },
  body: JSON.stringify({ message: prompt }),
});

if (!response.ok || !response.body) {
  console.error(`Request failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

console.log(`Streaming from ${endpoint}`);
console.log(`Prompt: ${prompt}`);
console.log('');

const decoder = new TextDecoder();
let buffer = '';

for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });

  while (buffer.includes('\n\n')) {
    const boundary = buffer.indexOf('\n\n');
    const rawEvent = buffer.slice(0, boundary).trim();
    buffer = buffer.slice(boundary + 2);

    if (!rawEvent) {
      continue;
    }

    const dataLine = rawEvent
      .split('\n')
      .find((line) => line.startsWith('data: '));

    if (!dataLine) {
      continue;
    }

    try {
      const payload = JSON.parse(dataLine.slice(6));
      console.log(JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('Failed to parse SSE payload:', dataLine);
      console.error(error);
    }
  }
}
