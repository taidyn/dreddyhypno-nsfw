// PASSWORD now comes from a Worker secret (env.PASSWORD), not from this file.
const COOKIE_NAME = "dh_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Files live in public/videos/ in your repo. Names are case-sensitive.
const VIDEOS = [
  {
    id: "1",
    title: "A Pathetic Quickshot",
    src: "/videos/APatheticQuickshot2.mp4",
  },
  {
    id: "2",
    title: "Getting Needier",
    src: "/videos/GettingNeedier2.mp4",
  },
  {
    id: "3",
    title: "Helplessly Texting",
    src: "/videos/HelplesslyTexting2.mp4",
  },
];

// ===== AUTH HELPERS =====

// Signed token derived from the password. Can't be forged without knowing it.
async function makeToken(secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("dh_auth_v1"));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
}

export default {
  async fetch(request, env) {
    if (!env.PASSWORD) {
      return new Response("Server not configured: set the PASSWORD secret.", {
        status: 500,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const token = await makeToken(env.PASSWORD);
    const isAuthed = safeEqual(getCookie(request, COOKIE_NAME), token);

    // ===== LOGIN PAGE =====
    if (path === "/login" || path === "/login/") {
      if (isAuthed) {
        return new Response(null, { status: 302, headers: { Location: "/" } });
      }

      if (request.method === "POST") {
        const form = await request.formData();
        const password = (form.get("password") || "").toString().trim();

        if (safeEqual(password, env.PASSWORD)) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/",
              "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
            },
          });
        }

        return new Response(loginPage(true), {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }

      return new Response(loginPage(false), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // ===== LOGOUT =====
    if (path === "/logout") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
          "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }

    // ===== PROTECTED ROUTES =====
    if (!isAuthed) {
      return new Response(null, { status: 302, headers: { Location: "/login" } });
    }

    // Video files: served from static assets, only after the auth check above
    if (path.startsWith("/videos/")) {
      return env.ASSETS.fetch(request);
    }

    // Home
    if (path === "/" || path === "") {
      return new Response(homePage(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Video pages
    const match = path.match(/^\/v\/(\d+)\/?$/);
    if (match) {
      const video = VIDEOS.find((v) => v.id === match[1]);
      if (video) {
        return new Response(videoPage(video), {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }
    }

    // VR pages
    const vrMatch = path.match(/^\/vr\/(\d+)\/?$/);
    if (vrMatch) {
      const video = VIDEOS.find((v) => v.id === vrMatch[1]);
      if (video) {
        return new Response(vrPage(video), {
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
    ${wrong ? '<div class="error">Wrong password</div>' : ""}
    <input type="password" name="password" placeholder="Password" autofocus required>
    <button type="submit">Enter</button>
  </form>
</body>
</html>`;
}

function homePage() {
  const cards = VIDEOS.map(
    (v) => `
    <a href="/v/${v.id}" class="card">
      <div class="thumb">▶</div>
      <div class="title">${v.title}</div>
    </a>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DreddyHypno</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #eee; font-family: system-ui, -apple-system, sans-serif; }
    header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.3rem 1.6rem; border-bottom: 1px solid #222;
    }
    h1 { font-size: 1.35rem; font-weight: 600; }
    a.logout { color: #888; text-decoration: none; font-size: .95rem; }
    a.logout:hover { color: #ccc; }
    main {
      max-width: 960px; margin: 2.5rem auto; padding: 0 1.2rem;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.6rem;
    }
    .card {
      background: #161616; border-radius: 14px; overflow: hidden; text-decoration: none;
      color: inherit; transition: transform .18s, box-shadow .18s;
    }
    .card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,.55); }
    .thumb {
      height: 160px; background: #222; display: flex; align-items: center; justify-content: center;
      font-size: 2.8rem; color: #555;
    }
    .title { padding: 1.15rem 1.3rem; font-weight: 500; font-size: 1.05rem; }
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000; color: #eee; font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column; height: 100vh;
    }
    header {
      display: flex; justify-content: space-between; align-items: center;
      padding: .9rem 1.3rem; background: #111; flex-shrink: 0;
    }
    a { color: #aaa; text-decoration: none; }
    a:hover { color: #fff; }
    .player {
      flex: 1; display: flex; align-items: center; justify-content: center;
      background: #000; overflow: hidden;
    }
    video {
      max-width: 100%; max-height: 100%; width: auto; height: auto;
      outline: none;
    }
  </style>
</head>
<body>
  <header>
    <a href="/">← Home</a>
    <span>${video.title}</span>
    <span><a href="/vr/${video.id}">🥽 VR</a> &nbsp; <a href="/logout">Logout</a></span>
  </header>
  <div class="player">
    <video
      src="${video.src}"
      autoplay
      loop
      controls
      playsinline
      preload="auto">
    </video>
  </div>
</body>
</html>`;
}

function vrPage(video) {
  // Add  vr: "360"  to a video in VIDEOS to play it as a 360 video instead of a flat screen.
  const sphere = video.vr === "360";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${video.title} (VR)</title>
  <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
  <style>
    #start {
      position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 1rem; padding: 1rem;
      background: rgba(0,0,0,.85); color: #eee; font-family: system-ui, sans-serif; text-align: center;
    }
    #start button {
      padding: .9rem 1.6rem; border: 0; border-radius: 10px; background: #c44;
      color: #fff; font-size: 1.05rem; font-weight: 600; cursor: pointer;
    }
    #start a { color: #888; }
  </style>
</head>
<body>
  <div id="start">
    <h2>${video.title}</h2>
    <p>Press the VR button at the bottom right to enter.<br>A = home &nbsp;·&nbsp; B = pause</p>
    <button id="play2d">Preview in browser</button>
    <a href="/v/${video.id}">← Back</a>
  </div>

  <a-scene vr-mode-ui="enabled: true" background="color: #000">
    <a-assets>
      <video id="vid" src="${video.src}" loop playsinline webkit-playsinline preload="auto"></video>
    </a-assets>

    <!-- Everything inside the camera follows the head, so the video is always in view -->
    <a-entity camera look-controls position="0 1.6 0">
      ${sphere ? "" : `<a-video src="#vid" width="4" height="2.25" position="0 0 -2.5"></a-video>`}
      <a-text id="paused" value="Paused" align="center" color="#fff" width="2" position="0 0 -2.4" visible="false"></a-text>
    </a-entity>
    ${sphere ? `<a-videosphere src="#vid"></a-videosphere>` : ""}

    <a-entity id="left" oculus-touch-controls="hand: left; model: false"></a-entity>
    <a-entity id="right" oculus-touch-controls="hand: right; model: false"></a-entity>
  </a-scene>

  <script>
    const v = document.getElementById("vid");
    const label = document.getElementById("paused");
    const scene = document.querySelector("a-scene");
    const start = document.getElementById("start");

    function togglePause() {
      if (v.paused) { v.play(); label.setAttribute("visible", false); }
      else { v.pause(); label.setAttribute("visible", true); }
    }

    function goHome() {
      try { scene.exitVR(); } catch (e) {}
      location.href = "/";
    }

    function begin() {
      start.style.display = "none";
      v.play().catch(function () {});
    }

    scene.addEventListener("enter-vr", begin);
    document.getElementById("play2d").addEventListener("click", begin);

    // Right controller: A = home, B = pause. Left controller: X = home, Y = pause.
    const right = document.getElementById("right");
    const left = document.getElementById("left");
    right.addEventListener("abuttondown", goHome);
    right.addEventListener("bbuttondown", togglePause);
    left.addEventListener("xbuttondown", goHome);
    left.addEventListener("ybuttondown", togglePause);
  </script>
</body>
</html>`;
}
