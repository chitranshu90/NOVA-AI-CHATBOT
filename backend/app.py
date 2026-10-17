import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai
from google.genai.errors import APIError


load_dotenv(Path(__file__).with_name(".env"))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:5175,http://127.0.0.1:5175",
    ).split(",")
    if origin.strip()
]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

MAX_MESSAGES = 40
MAX_MESSAGE_LENGTH = 8_000
MAX_CONVERSATION_LENGTH = 24_000


def get_api_key():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    return api_key if len(api_key) >= 20 else ""


@app.get("/api/health")
def health():
    return jsonify(
        status="ok",
        ai_configured=bool(get_api_key()),
    )


@app.post("/api/chat")
def chat():
    if not request.is_json:
        return jsonify(error="Send the conversation as JSON."), 400

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="The request body must be a JSON object."), 400

    messages = payload.get("messages")
    if not isinstance(messages, list) or not messages:
        return jsonify(error="Add at least one message before sending."), 400
    if len(messages) > MAX_MESSAGES:
        return jsonify(error=f"A conversation can contain at most {MAX_MESSAGES} messages per request."), 400

    validated_messages = []
    total_characters = 0
    for message in messages:
        if not isinstance(message, dict):
            return jsonify(error="Each message must include a role and text."), 400

        role = message.get("role")
        content = message.get("content")
        if role not in {"user", "assistant"}:
            return jsonify(error="Message roles must be user or assistant."), 400
        if not isinstance(content, str) or not content.strip():
            return jsonify(error="Messages cannot be empty."), 400
        if len(content) > MAX_MESSAGE_LENGTH:
            return jsonify(error=f"Each message must be {MAX_MESSAGE_LENGTH} characters or fewer."), 400

        total_characters += len(content)
        if total_characters > MAX_CONVERSATION_LENGTH:
            return jsonify(error="This conversation is too long to send. Start a new chat and try again."), 400
        validated_messages.append({"role": role, "content": content})

    if validated_messages[-1]["role"] != "user":
        return jsonify(error="The latest message must be from you."), 400

    api_key = get_api_key()
    if not api_key:
        return jsonify(
            error="A complete GEMINI_API_KEY is missing. Run backend/setup-gemini-key.ps1, paste the full key when prompted, then restart the backend."
        ), 503

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
    if not model:
        return jsonify(error="The GEMINI_MODEL setting is empty. Set it in backend/.env and restart the backend."), 503

    prompt = "\n\n".join(
        f"{'Nova' if message['role'] == 'assistant' else 'User'}:\n{message['content']}"
        for message in validated_messages
    )
    try:
        with genai.Client(api_key=api_key) as client:
            completion = client.interactions.create(
                model=model,
                input=prompt,
                store=False,
            )
    except APIError as error:
        provider_status = getattr(error, "code", None) or getattr(error, "status_code", None)
        if provider_status == 401:
            status_code = 502
            message = (
                "Gemini rejected the API key. Check that GEMINI_API_KEY in backend/.env is an active "
                "Google AI Studio key, then restart the backend."
            )
        elif provider_status == 400:
            status_code = 502
            message = (
                "Gemini rejected this request. Check the model name and the Google AI Studio API settings."
            )
        elif provider_status == 403:
            status_code = 502
            message = (
                "Gemini denied access. Check your Google AI Studio account and free-tier model access."
            )
        elif provider_status == 404:
            status_code = 502
            message = (
                "This Gemini model is unavailable to your account. Check GEMINI_MODEL in backend/.env "
                "and choose a current model listed in Google AI Studio."
            )
        elif provider_status == 429:
            status_code = 429
            message = "Gemini free-tier limit reached. Wait for the limit to reset, then try again."
        else:
            status_code = 502
            message = "Gemini could not complete the request. Check your API access and try again."
        app.logger.warning("Gemini API request failed with status %s.", provider_status)
        return jsonify(error=message), status_code
    except httpx.RequestError:
        app.logger.warning("Could not connect to the Gemini API.")
        return jsonify(error="Could not reach Gemini. Check your internet connection and try again."), 502

    answer = completion.output_text
    if not isinstance(answer, str) or not answer.strip():
        app.logger.warning("Gemini returned an empty or unsupported response.")
        return jsonify(error="Gemini returned an empty response. Please try again."), 502

    return jsonify(reply=answer.strip())


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify(error="The request is too large. Shorten the conversation and try again."), 413


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=False)
