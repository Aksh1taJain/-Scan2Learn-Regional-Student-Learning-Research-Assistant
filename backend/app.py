# backend/app.py
import os
import fitz  # PyMuPDF
import pytesseract
import google.generativeai as genai
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.ocr import image_to_text
from utils.nlp_modules import generate_quiz_from_text

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)  # allow requests from frontend during development
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB

ALLOWED_EXT = {"png", "jpg", "jpeg", "bmp", "tiff", "tif", "pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXT


# configure

def summarize_text(text):
    """
    Summarize text using Gemini 1.5 Flash.
    Returns summary even if text is short.
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""
        Summarise the following text in a concise, clear and readable format.
        Do NOT change meaning. Avoid adding extra information.

        TEXT:
        {text}
        """

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print("Gemini summarisation failed:", e)
        return "Summary unavailable due to an error."

@app.route("/api/scan", methods=["POST"])
def scan_image():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()

    # ===========================
    # CASE 1: PDF
    # ===========================
    if ext == "pdf":
        pdf_bytes = file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        full_text = ""
        for page in doc:
            full_text += page.get_text()

        text = full_text.strip()

    # ===========================
    # CASE 2: IMAGE
    # ===========================
    else:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)

        # OCR image → text
        text = image_to_text(save_path)

        try:
            os.remove(save_path)
        except:
            pass

    summary = ""
    if request.form.get("summarise") == "true":
        summary = summarize_text(text)


    # Generate quiz
    quiz = generate_quiz_from_text(text)

    return jsonify({
        "text": text,
        "summary": summary,
        "word_count": len(text.split()),
        "quiz": quiz
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status":"ok"})

if __name__ == "__main__":
    # Run with: python backend/app.py
    app.run(host="0.0.0.0", port=5000, debug=True)
