# backend/utils/ocr.py
import os

def image_to_text(image_path: str) -> str:
    try:
        from PIL import Image
        import pytesseract
    except Exception:
        return ("[OCR modules missing. Install pillow + pytesseract. Also install Tesseract engine.]")

    try:
        img = Image.open(image_path)

        # Use Hindi + English OCR
        text = pytesseract.image_to_string(img, lang="hin+eng")

        text = "\n".join([ln.strip() for ln in text.splitlines() if ln.strip()])
        if not text:
            return "[No Hindi text detected. Install hin.traineddata in tessdata folder.]"
        return text

    except Exception as e:
        return f"[OCR error: {str(e)}]"
