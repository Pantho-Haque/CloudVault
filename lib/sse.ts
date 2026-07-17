type SSEClient = {
  id: number;
  controller: ReadableStreamDefaultController;
  alive: boolean;
};

let clients: SSEClient[] = [];
let nextClientId = 0;

export function addClient(controller: ReadableStreamDefaultController): SSEClient {
  const client = { id: nextClientId++, controller, alive: true };
  clients.push(client);
  return client;
}

export function removeClient(client: SSEClient): void {
  clients = clients.filter((c) => c.id !== client.id);
}

export function broadcast(event: string, data: string): void {
  const encoder = new TextEncoder();
  const message = `event: ${event}\ndata: ${data}\n\n`;
  const encoded = encoder.encode(message);

  const dead: SSEClient[] = [];
  for (const client of clients) {
    try {
      client.controller.enqueue(encoded);
      client.alive = true;
    } catch {
      dead.push(client);
    }
  }
  if (dead.length > 0) {
    clients = clients.filter((c) => !dead.includes(c));
  }
}

export function broadcastFileChange(type: "created" | "deleted" | "updated" | "moved", filePath: string): void {
  broadcast("file-change", JSON.stringify({ type, path: filePath, timestamp: Date.now() }));
}

export function keepAlive(): void {
  const encoder = new TextEncoder();
  const keepAliveMsg = encoder.encode(": keepalive\n\n");
  for (const client of clients) {
    try {
      client.controller.enqueue(keepAliveMsg);
    } catch {
      // client will be cleaned up on next broadcast
    }
  }
}

// Send keepalive every 30 seconds
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export function startKeepAlive(): void {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(keepAlive, 30000);
}

export function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}
