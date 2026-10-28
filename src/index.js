const PASSWORD = "DreddyOwnsMe";
const COOKIE_NAME = "dh_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ← Put your real GitHub raw video links here
const VIDEOS = [
  {
    id: "1",
    title: "A Pathetic Quickshot",
    src: "https://raw.githubusercontent.com/taidyn/dreddyhypno-nsfw/main/videos/APatheticQuickshot.mp4",
  },
  {
    id: "2",
    title: "Getting Needier",
    src: "https://raw.githubusercontent.com/taidyn/dreddyhypno-nsfw/main/videos/GettingNeedier.mp4",
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
    const cookieHeader = request.headers.get("Cookie") || "";
    const isAuthed = cookieHeader.includes(`${COOKIE_NAME}=1`);

    // ===== LOGIN PAGE =====
    if (path === "/login" || path === "/login/") {
      // If already logged in, go to home
      if (isAuthed) {
        return new Response(null, {
          status: 302,
          headers: { Location: "/" },
        });
      }

      // Handle form submission
      if (request.method === "POST") {
        const form = await request.formData();
        const password = (form.get("password") || "").toString().trim();

        if (password === PASSWORD) {
          // Success → set cookie and show home page immediately
          return new Response(homePage(), {
            status: 200,
            headers: {
              "Content-Type": "text/html;charset=UTF-8",
              "Set-Cookie": `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`,
            },
          });
        }

        // Wrong password
        return new Response(loginPage(true), {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }

      // Normal GET → show login form
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
          "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0`,
        },
      });
    }

    // ===== PROTECTED ROUTES =====
    if (!isAuthed) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
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
    <a href="/logout">Logout</a>
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
