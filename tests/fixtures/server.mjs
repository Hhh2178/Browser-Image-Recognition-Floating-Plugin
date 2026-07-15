import http from "node:http";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAIAAAC6s0uzAAAAG0lEQVR42u3BMQEAAADCoPVPbQ0PoAAAAAAAfg0owAABMcuHmwAAAABJRU5ErkJggg==",
  "base64"
);

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <title>视觉分析扩展测试页</title>
    <style>
      body { margin: 0; padding: 32px; font-family: Arial, sans-serif; background: #eef2f6; }
      main { max-width: 920px; margin: auto; }
      img { display: block; width: 640px; height: 480px; object-fit: cover; background: #d8e0e8; }
    </style>
  </head>
  <body>
    <main>
      <h1>视觉分析扩展测试页</h1>
      <a href="/pin/fixture">
        <img id="reference-image" src="/reference.png" alt="测试参考图片">
      </a>
    </main>
  </body>
</html>`;

http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:43118");
  if (url.pathname === "/health") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("ok");
    return;
  }
  if (url.pathname === "/reference.png") {
    response.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
    response.end(png);
    return;
  }
  if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const payload = JSON.parse(body);
      const valid = payload.model && Array.isArray(payload.messages);
      response.writeHead(valid ? 200 : 400, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });
      response.end(JSON.stringify(valid
        ? { choices: [{ message: { content: "测试分析结果：主体居中，冷灰背景，柔和侧光。" } }] }
        : { error: { message: "invalid fixture request" } }
      ));
    });
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}).listen(43118, "127.0.0.1");
