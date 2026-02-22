# backend/utils/nlp_modules.py
import re

def split_sentences(text):
    # A simple sentence splitter (not perfect but works reasonably)
    # splits on ., ?, ! followed by space and capital letter or linebreak
    if not text:
        return []
    # Normalize newlines to sentence breaks
    text = text.replace("\n", ". ")
    sentences = re.split(r'(?<=[\.\?\!])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip())>10]
    return sentences

def generate_quiz_from_text(text, max_questions=5):
    """
    Very simple generator:
      - Take first N sentences as "question prompts"
      - For each, form a fill-in-the-blank by removing a central noun-like word (approx)
      - If no suitable word found, return sentence as 'read-and-answer' question
    Output format: [{question: "...", answer: "..."}]
    """
    sentences = split_sentences(text)
    quiz = []
    for s in sentences[:max_questions]:
        # Try to remove a longer word to make blank
        words = s.split()
        # choose a medium-length word (skip small words)
        choice_idx = None
        for i,w in enumerate(words):
            w_clean = re.sub(r'[^A-Za-z0-9]', '', w)
            if len(w_clean) >= 6:
                choice_idx = i
                break
        if choice_idx is None and len(words) >= 3:
            choice_idx = len(words)//2
        if choice_idx is not None:
            answer = words[choice_idx].strip()
            words[choice_idx] = "____"
            question_text = " ".join(words)
            quiz.append({"question": question_text, "answer": answer})
        else:
            quiz.append({"question": s, "answer": ""})
    return quiz
