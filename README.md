# KOKORO — Student Wellness Demo

A responsive, presentation-ready wellness dashboard with mood check-ins, Kaizen micro-goals, reflections, campus support guidance, a local SQLite client register, and a voice conversation with the Kaizen reflection assistant.

## Run the interactive demo

Requires Node.js 22.13+ (Node 24 recommended). No packages or API key are required.

1. Extract this folder.
2. Double-click `start-demo.bat`. It starts the local server and opens the site in your browser. Keep the minimized server window open while using KOKORO.
3. Choose **Enable mic & start** in the companion page and allow microphone access when the browser asks.

The first launch creates `data/kokoro-demo.sqlite` and fills it with fictional sample records. The dashboard can view and update sample follow-up status and notes. The local companion gives direct answers for common questions about Kaizen, Ikigai, KOKORO, nature resets, focus, study planning, stress, sleep, habits, and emotional support. It varies the wording and suggests a relevant small next step. It is a local question-matching demo, not a general-purpose generative AI model. The app requests microphone permission, releases its permission-check audio stream, then gives the microphone to browser speech recognition. On the companion screen, choose **Enable mic & start**, allow microphone access in the browser prompt, and speak; KOKORO reads each reply aloud and then listens for your next turn until you stop the conversation. **Speak one message** is available as a one-turn option. Use current Chrome or Edge. If permission was previously blocked, open the site settings from the address bar and allow Microphone; also check Windows **Settings → Privacy & security → Microphone**. Browser speech recognition and text-to-speech support vary.

## Privacy and safety

- All database entries are fabricated presentation examples. Do not enter real client or student information.
- The chat is a local demonstration, not a connected generative AI service. It does not send messages to an external provider.
- Browser speech recognition support and processing vary by browser and operating system.
- KOKORO is a general wellbeing aid, not clinical advice, diagnosis, or crisis care. The safety page points users toward human support.
- Before using real records, add authentication, role-based access, explicit consent, encryption, audit logs, retention controls, rate limits, and a security review. Do not publish a database containing personal information.

## Project files

- `server.mjs` — local HTTP server, SQLite schema and API, and demo reply engine.
- `index.html`, `styles.css`, `app.js` — responsive dashboard and interactions.
- `data/` — generated SQLite database (ignored by Git).

## Publish to GitHub

Create a new repository, then from this directory run:

```bash
git init
git add .
git commit -m "Build KOKORO wellness dashboard demo"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

The SQLite database is excluded from Git. This app uses a local Node server and SQLite; GitHub Pages alone cannot host the API/database. To share a live interactive demo, deploy the server to a Node hosting provider and use a persistent private database volume.
