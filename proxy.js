import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/{*path}", async (req, res) => {
  let targetUrl = req.url.slice(1);

  // Show help page if no URL given
  if (!targetUrl) {
    return res.send(`
      <html>
        <body style="font-family:sans-serif;padding:2rem;">
          <h2>Web Proxy</h2>
          <p>Type a URL in the address bar like this:</p>
          <code>your-domain.com/https://example.com</code>
        </body>
      </html>
    `);
  }

  // Add https:// if no protocol given
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const baseOrigin = parsedTarget.origin; // e.g. https://www.google.com

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
        "Accept": req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";

    // Only rewrite HTML pages, stream everything else (images, css, js, etc.)
    if (!contentType.includes("text/html")) {
      res.setHeader("content-type", contentType);
      res.status(response.status);
      response.body.pipe(res);
      return;
    }

    let html = await response.text();

    // Rewrite absolute URLs (href="https://..." and src="https://...")
    html = html.replace(/(href|src|action)="(https?:\/\/[^"]+)"/gi, (_, attr, url) => {
      return `${attr}="/${url}"`;
    });

    // Rewrite root-relative URLs (href="/something") to go through proxy with base origin
    html = html.replace(/(href|src|action)="(\/[^/"'][^"]*?)"/gi, (_, attr, path) => {
      return `${attr}="/${baseOrigin}${path}"`;
    });

    // Rewrite JS redirects like location.href = "/path"
    html = html.replace(/location\.href\s*=\s*["'](\/?[^"']+)["']/g, (_, path) => {
      if (path.startsWith("http")) return `location.href = "/${path}"`;
      return `location.href = "/${baseOrigin}${path}"`;
    });

    res.setHeader("content-type", "text/html");
    res.status(response.status);
    res.send(html);

    console.log(`[${response.status}] ${targetUrl}`);
  } catch (err) {
    console.error(`[error] ${targetUrl} — ${err.message}`);
    res.status(500).send(`
      <html>
        <body style="font-family:sans-serif;padding:2rem;">
          <h2>Could not load page</h2>
          <p><strong>URL:</strong> ${targetUrl}</p>
          <p><strong>Reason:</strong> ${err.message}</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy running at http://localhost:${PORT}`);
  console.log(`   Usage: http://localhost:${PORT}/https://example.com\n`);
});
