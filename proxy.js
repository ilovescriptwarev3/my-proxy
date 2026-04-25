import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.get("/{*path}", async (req, res) => {
  // Extract the URL from the path (everything after the first /)
  let targetUrl = req.url.slice(1);

  // If nothing typed, show a help page
  if (!targetUrl) {
    return res.send(`
      <html>
        <body style="font-family:sans-serif;padding:2rem;">
          <h2>Web Proxy</h2>
          <p>Type a URL in the address bar like this:</p>
          <code>localhost:${PORT}/https://example.com</code>
        </body>
      </html>
    `);
  }

  // Add https:// if no protocol given
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
        "Accept": req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";
    res.setHeader("content-type", contentType);
    res.status(response.status);

    // Stream the response body directly to the client
    response.body.pipe(res);

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
