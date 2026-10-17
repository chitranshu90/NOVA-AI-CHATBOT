# Nova AI

Nova AI is a clean, responsive AI chat app for learning, writing, and exploring ideas. The React website talks to a small Flask API, which uses Google's official Gen AI Python SDK and the Gemini API to generate replies. Conversation history and your theme are saved in your browser; the project does not need a database.

> **Free usage:** Google offers free-tier access only for selected models, and account availability and usage limits can change. Nova defaults to `gemini-3.8-flash`, which Google's current API recommends, but your Google AI Studio account must allow that model on its free tier. Choose a currently available free-tier model in Google AI Studio if needed. Free-tier requests may be used to improve Google's products. Review [current pricing and free-tier details](https://ai.google.dev/gemini-api/docs/pricing) before use; this project does not enable billing.

## Features

- Real answers from Gemini through a Python backend.
- Keeps recent conversation context when you send a follow-up.
- Saves and switches between chats with browser `localStorage`.
- Four starter prompts, animated loading state, and copy-response button.
- Clear-chat action and light/dark appearance toggle.
- Responsive navigation and layout for desktop and mobile.
- Helpful validation and API/network error messages.
- API keys stay on the backend and are excluded from Git.

## Screenshots

Add screenshots here after running the app:

| Welcome screen | Conversation |
| --- | --- |
| `![Welcome screen](screenshots/welcome.png)` | `![Conversation](screenshots/conversation.png)` |

## Technology stack

- **Frontend:** React, Vite, JavaScript, CSS, Lucide React
- **Backend:** Python, Flask, Flask-CORS, official Google Gen AI Python SDK
- **AI:** Google Gemini API
- **Storage:** browser `localStorage`

## Project structure

```text
Nova AI/
├── backend/
│   ├── .env.example
│   ├── app.py
│   ├── requirements.txt
│   └── test_app.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInput.jsx
│   │   │   ├── Message.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

Install these on Windows:

- Python 3.10 or newer (the Google Gen AI SDK requires Python 3.9+).
- Node.js 20.19+ or 22.12+ (includes `npm`; required by the current Vite version).
- A Google account and Gemini API key from Google AI Studio for real AI responses.
- Visual Studio Code or another editor.

Confirm Python and Node.js are available in PowerShell:

```powershell
py --version
node --version
npm --version
```

Each command prints the installed version. If a command is not recognized, install that tool and reopen PowerShell.

## Install on Windows (PowerShell)

Run these commands from the project folder:

```powershell
py -m venv backend\.venv
```

This creates a private Python environment for this project.

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

This activates the project's Python environment in the current PowerShell terminal. If PowerShell blocks activation, use the Python executable directly as shown in Troubleshooting.

```powershell
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
```

These commands update pip inside the environment and install the backend libraries.

```powershell
cd frontend
npm install
cd ..
```

These commands install the JavaScript dependencies and return to the project folder.

## Configure the free Gemini API

1. Open [Google AI Studio API keys](https://aistudio.google.com/apikey) and sign in with your Google account.
2. Create or select a project and create an API key. Use the free tier; do not set up billing if you do not want to pay.
3. In PowerShell from the project folder, run the secure setup script:

   ```powershell
   .\backend\setup-gemini-key.ps1
   ```

   Paste the new key when prompted. PowerShell hides it while you type, and the script saves it to the ignored `backend\.env` file without printing it.

The backend reads the key only on the server; it is never sent to the browser. The example file contains a placeholder and is safe to commit. Do not send private or sensitive information to the free tier: Google's current terms say free-tier content may be used to improve its products. Free-tier limits can change, and a free API key does not mean unlimited usage.

## Run the application

Open **two PowerShell terminals** in the project folder.

**Terminal 1 — start the Flask backend:**

```powershell
.\backend\.venv\Scripts\Activate.ps1
python backend\app.py
```

The first command activates the local Python environment, and the second starts the API at `http://127.0.0.1:5000`.

**Terminal 2 — start the Vite frontend:**

```powershell
cd frontend
npm run dev
```

This starts the website. Open the local URL printed by Vite (usually `http://localhost:5173`) in your browser.

## Test the application

With the backend environment activated, run from the project folder:

```powershell
python -m unittest backend.test_app
```

This checks the health endpoint, missing-key behavior, request validation, and Gemini conversation context without making a network call to Gemini.

Check backend health in a browser at `http://127.0.0.1:5000/api/health`. It returns `status: "ok"` when Flask is running; `ai_configured` tells you whether a key is set.

To check a real AI answer, enter a question in the website. With a valid key and free-tier model access, Nova answers; without them, the app displays a clear error instead of making up an answer. The first user question can fail until you replace the sample key with a real Google AI Studio key.

## Troubleshooting

- **`py` or `npm` is not recognized:** Install Python or Node.js LTS, enable the installer option to add it to PATH, and reopen PowerShell.
- **PowerShell will not activate the virtual environment:** Run the backend commands with `.\backend\.venv\Scripts\python.exe` instead. For example: `.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` and `.\backend\.venv\Scripts\python.exe backend\app.py`.
- **`GEMINI_API_KEY` is missing or rejected:** Confirm the file is named `backend\.env` (not `.env.example`), use an active key from Google AI Studio, and restart Terminal 1.
- **Gemini says the model is unavailable:** Check `GEMINI_MODEL` and your account's access to that model.
- **Gemini free-tier limit reached:** Wait for the limit to reset. Do not enable billing unless you choose to pay.
- **Google free-tier privacy:** Do not submit private or sensitive data; free-tier content may be used to improve Google's products.
- **The website cannot reach the backend:** Keep both terminals running, check the backend URL and port, and ensure the frontend uses `http://127.0.0.1:5000`.
- **Port 5173 or 5000 is busy:** Close the other app using that port or use the available Vite port shown in the terminal. For a different frontend origin, add it to `FRONTEND_ORIGINS` in `backend\.env` and restart Flask. Development origins on ports 5173, 5174, and 5175 are allowed by default.

## Security notes

- Never put an API key in frontend code, `VITE_` variables, screenshots, chat messages, or a public repository.
- Keep `backend\.env` private. `.gitignore` excludes it; check `git status` before committing.
- The backend limits request size, validates roles and message content, and returns safe errors without provider details.
- Conversation history is stored in your browser's local storage. Anyone using the same browser profile can see it; clearing browser site data removes it.
- Do not expose the Flask development server directly to the public internet. Use a production WSGI server such as Gunicorn when hosting.

## GitHub and deployment (when you are ready)

First confirm the app runs locally and check `git status` before staging files. The beginner Git steps are: `git init` (only if this folder is not already a repository), `git status`, `git add .`, `git status` again, then `git commit -m "Build Nova AI chatbot"`. Review the staged list and verify `backend\.env` is not included before the commit.

Then create a **private or public** repository on GitHub, connect it with the remote URL GitHub provides (`git remote add origin <your-repository-url>`), and push the initial branch (`git push -u origin main`). Do not paste an API key into GitHub.

For an eventual separate frontend/backend deployment, this project can be hosted as a Vite frontend on Vercel and a Flask web service on Render. Current provider instructions:

- [Vercel: Vite projects](https://vercel.com/docs/frameworks/frontend/vite) — set the project root to `frontend`, use `npm run build`, and set the output directory to `dist`. Set `VITE_API_BASE_URL` to the deployed backend's HTTPS URL before the frontend build.
- [Render: Flask apps](https://render.com/docs/deploy-flask) — create a Python web service with the root directory set to `backend`, build command `pip install -r requirements.txt`, and start command `gunicorn app:app`. Add `GEMINI_API_KEY`, `GEMINI_MODEL`, and `FRONTEND_ORIGINS` as backend environment variables in the provider dashboard; set `FRONTEND_ORIGINS` to your deployed frontend origin.

After deployment, test the backend's `/api/health` endpoint and send a real question from the deployed website. Provider plan availability, prices, sleeping behavior, and Gemini API terms can change; check their current documentation and account terms before choosing a plan. Never commit or expose production secrets.

## Future improvements

- Stream responses as they are generated.
- Add sign-in and securely synced chat history.
- Add conversation search, rename, and export.
- Add automated frontend tests and richer Markdown/code formatting.

## License

This project is released under the [MIT License](LICENSE).
