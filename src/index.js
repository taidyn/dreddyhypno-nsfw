const PASSWORD = "DreddyOwnsMe";
const COOKIE_NAME = "dh_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ← PUT YOUR REAL GITHUB RAW LINKS HERE
const VIDEOS = [
  {
    id: "1",
    title: "A Pathetic Quickshot",
    src: "https://raw.githubusercontent.com/taidyn/dreddyhypno-nsfw/main/videos/APatheticQuickshot2.mp4",
  },
  {
    id: "2",
    title: "Getting Needier",
    src: "https://raw.githubusercontent.com/taidyn/dreddyhypno-nsfw/main/videos/GettingNeedier2.mp4",
  },
  {
    id: "3",
    title: "Helplessly Texting",
    src: "https://raw.githubusercontent.com/taidyn/dreddyhypno-nsfw/main/videos/HelplesslyTexting2.mp4",
  },
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cookie = request.headers.get("Cookie") || "";
    const isAuthed = cookie.includes(`${COOKIE_NAME}=1`);

    // === LOGIN PAGE (GET) ===
    if (path === "/login" || path === "/login/") {
      return new Response(loginPage(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // === LOGIN FORM SUBMIT (POST) ===
    if (path === "/login" && request.method === "POST") {
      const form = await request.formData();
      const password = form.get("password");

      if (password === PASSWORD) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
            "Set-Cookie": `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          },
        });
      }

      // Wrong password
      return new Response(loginPage(true), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // === LOGOUT ===
    if (path === "/logout") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
          "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0`,
        },
      });
    }

    // === FORCE LOGIN IF NOT AUTHENTICATED ===
    if (!isAuthed) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    // === HOME PAGE ===
    if (path === "/" || path === "") {
      return new Response(homePage(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // === VIDEO PAGES ===
    const match = path.match(/^\/v\/(\d+)\/?$/);
    if (match) {
      const video = VIDEOS.find((v) => v.id === match[1]);
      if (video) {
        return new Response(videoPage(video), {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }
    }

    // Fallback
    return new Response("Not found", { status: 404 });
  },
};

function loginPage(wrong = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Access</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #0a0a0a; color: #eee; font-family: system-ui, -apple-system, sans-serif;
    }
    form {
      background: #161616; padding: 2.5rem; border-radius: 16px; width: min(90vw, 360px);
      box-shadow: 0 0 60px rgba(0,0,0,.7);
    }
    h1 { margin-bottom: 1.8rem; font-size: 1.4rem; text-align: center; font-weight: 600; }
    input {
      width: 100%; padding: 1rem 1.1rem; margin-bottom: 1.2rem;
      border: 1px solid #333; border-radius: 10px; background: #222; color: #fff;
      font-size: 1.05rem;
    }
    input:focus { outline: none; border-color: #c44; }
    button {
      width: 100%; padding: 1rem; border: none; border-radius: 10px;
      background: #c44; color: #fff; font-size: 1.05rem; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #e55; }
    .error { color: #f66; text-align: center; margin-bottom: 1.2rem; font-size: .95rem; }
  </style>
</head>
<body>
  <form method="POST" action="/login">
    <h1>Private Access</h1>
    ${wrong ? '<div class="error">Wrong password</div>' : ''}
    <input type="password" name="password" placeholder="Password" autofocus required>
    <button type="submit">Enter</button>
  </form>
</body>
</html>`;
}

function homePage() {
  const cards = VIDEOS.map(
    (v) => 
