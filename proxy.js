import express from "express";
import Unblocker from "unblocker";

const app = express();
const PORT = process.env.PORT || 3000;

const unblocker = new Unblocker({
  prefix: "/proxy/",
});

app.use(unblocker);

// Home page with a simple URL bar
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Web Proxy</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f0f0f0;
          }
          h1 { margin-bottom: 1rem; font-size: 2rem; }
          form {
            display: flex;
            gap: 0.5rem;
            width: 100%;
            max-width: 600px;
            padding: 0 1rem;
          }
          input {
            flex: 1;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            border: 2px solid #ccc;
            border-radius: 8px;
            outline: none;
          }
          input:focus { border-color: #4a90e2; }
          button {
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          }
          button:hover { background: #357abd; }
          p { margin-top: 1rem; color: #666; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <h1>🌐 Web Proxy</h1>
        <form onsubmit="navigate(event)">
          <input type="text" id="url" placeholder="https://example.com" autofocus />
          <button type="submit">Go</button>
        </form>
        <p>Enter any URL above to browse through the proxy</p>
        <script>
          function navigate(e) {
            e.preventDefault();
            let url = document.getElementById('url').value.trim();
            if (!url.startsWith('http')) url = 'https://' + url;
            window.location.href = '/proxy/' + url;
          }
        </script>
      </body>
    </html>
  `);
});

// Handle upgrade for websockets (keeps some sites working better)
app.on("upgrade", unblocker.onUpgrade);

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy running at http://localhost:${PORT}`);
  console.log(`   Open that URL in your browser and type any site\n`);
});
