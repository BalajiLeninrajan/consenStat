import type { TallyPayload } from "./types";

export class ExamRoom extends DurableObject {
  private sockets = new Set<WebSocket>();
  private lastPayload: TallyPayload | null = null;

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === "POST" && url.pathname.endsWith("/broadcast")) {
      const payload = (await request.json()) as TallyPayload;
      this.lastPayload = payload;
      const message = JSON.stringify(payload);
      for (const socket of this.sockets) {
        socket.send(message);
      }
      return new Response(null, { status: 204 });
    }

    if (request.method === "POST" && url.pathname.endsWith("/snapshot")) {
      const payload = (await request.json()) as TallyPayload;
      this.lastPayload = payload;
      return new Response(null, { status: 204 });
    }

    return new Response("Not found", { status: 404 });
  }

  webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer) {}

  webSocketClose(ws: WebSocket) {
    this.sockets.delete(ws);
  }

  webSocketError(ws: WebSocket) {
    this.sockets.delete(ws);
  }

  webSocketOpen(ws: WebSocket) {
    this.sockets.add(ws);
    if (this.lastPayload) {
      ws.send(JSON.stringify(this.lastPayload));
    }
  }
}
