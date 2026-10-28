// Cloudflare Worker - DreddyHypno private site

const PASSWORD = "change-me";          // ← change this
const COOKIE_NAME = "dh_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const VIDEOS = [
  {
    id: "1",
    title: "Video 1",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", // replace
  },
  {
    id: "2",
    title: "Video 2",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm", // replace
  },
  {
    id: "3",
    title: "Video 3",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", // replace
  },
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cookie = request.headers.get("Cookie") || "";
    const isAuthed = cookie.includes(`${COOKIE_NAME}=1`);

    // Login form
    if (url.pathname === "/login" && request.method === "POST") {
      const form = await request.formData();
      if (form.get("password") === PASSWORD) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
            "Set-Cookie": `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
          },
        });
      }
      return new Response(loginPage(true), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Require auth for everything except login
    if (!isAuthed && url.pathname !== "/login") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    // Logout
    if (url.pathname === "/logout") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
          "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0`,
        },
      });
    }

    // Home
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(homePage(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Individual video
    const videoMatch = url.pathname.match(/^\/v\/(\d+)$/);
    if (videoMatch) {
      const video = VIDEOS.find(v => v.id === videoMatch[1]);
      if (video) {
        return new Response(videoPage(video), {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }
    }

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
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
           background:#0a0a0a; color:#eee; font-family:system-ui,sans-serif; }
    form { background:#161616; padding:2.5rem; border-radius:12px; width:min(90vw,340px);
           box-shadow:0 0 40px rgba(0,0,0,.6); }
    h1 { margin:0 0 1.5rem; font-size:1.4rem; text-align:center; }
    input { width:100%; padding:.9rem 1rem; margin-bottom:1rem; border:1px solid #333;
            border-radius:8px; background:#222; color:#fff; font-size:1rem; box-sizing:border-box; }
    button { width:100%; padding:.9rem; border:none; border-radius:8px; background:#c44;
             color:#fff; font-size:1rem; cursor:pointer; font-weight:600; }
    button:hover { background:#e55; }
    .error { color:#f66; text-align:center; margin-bottom:1rem; font-size:.9rem; }
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
  const cards = VIDEOS.map(v => `
    <a href="/v/${v.id}" class="card">
      <div class="thumb">▶</div>
      <div class="title">${v.title}</div>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DreddyHypno</title>
  <style>
    body { margin:0; background:#0a0a0a; color:#eee; font-family:system-ui,sans-serif; }
    header { display:flex; justify-content:space-between; align-items:center;
             padding:1.2rem 1.5rem; border-bottom:1px solid #222; }
    h1 { margin:0; font-size:1.3rem; }
    a.logout { color:#888; text-decoration:none; font-size:.9rem; }
    a.logout:hover { color:#ccc; }
    main { max-width:900px; margin:2rem auto; padding:0 1rem;
           display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.5rem; }
    .card { background:#161616; border-radius:12px; overflow:hidden; text-decoration:none;
            color:inherit; transition:transform .15s, box-shadow .15s; }
    .card:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,.5); }
    .thumb { height:140px; background:#222; display:flex; align-items:center; justify-content:center;
             font-size:2.5rem; color:#555; }
    .title { padding:1rem; font-weight:500; }
  </style>
</head>
<body>
  <header>
    <h1>DreddyHypno</h1>
    <a class="logout" href="/logout">Logout</a>
  </header>
  <main>${cards}</main>
</body>
</html>`;
}

function videoPage(video) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${video.title}</title>
  <style>
    body { margin:0; background:#000; color:#eee; font-family:system-ui,sans-serif;
           display:flex; flex-direction:column; height:100vh; }
    header { display:flex; justify-content:space-between; align-items:center;
             padding:.8rem 1.2rem; background:#111; }
    a { color:#aaa; text-decoration:none; }
    a:hover { color:#fff; }
    .player { flex:1; display:flex; align-items:center; justify-content:center; }
    video { max-width:100%; max-height:100%; outline:none; }
  </style>
</head>
<body>
  <header>
    <a href="/">← Home</a>
    <span>${video.title}</span>
    <a href="/logout">Logout</a>
  </header>
  <div class="player">
    <video src="${video.src}" autoplay loop controls playsinline></video>
  </div>
</body>
</html>`;
}
