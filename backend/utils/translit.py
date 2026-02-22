# backend/utils/translit.py
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

def transliterate_text(text, target_lang="hin"):
    # target_lang can be 'hin' (Devanagari), 'tam' (Tamil) etc.
    # This example assumes input is in ITRANS/roman form -> Devanagari
    if not text:
        return ""
    if target_lang in ["hin","hi"]:
        return transliterate(text, sanscript.ITRANS, sanscript.DEVANAGARI)
    # extend for other languages if supported
    return text
