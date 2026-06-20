import React, { useState, useEffect } from "react";
import { translate, translateTextWithAI } from "../utils/translate";

interface TranslatedTextProps {
  text: string;
  lang: "KOR" | "ENG";
  className?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ text, lang, className }) => {
  const [translated, setTranslated] = useState<string>(() => {
    // Attempt standard translation first to make it instantaneous if in dictionary
    return translate(text, lang);
  });

  useEffect(() => {
    if (lang === "KOR" || !text) {
      setTranslated(text);
      return;
    }

    let isMounted = true;
    const trimmed = text.trim();

    // Check if it's already in the manual dictionary
    const staticTranslated = translate(trimmed, "ENG");
    if (staticTranslated !== trimmed) {
      setTranslated(staticTranslated);
      return;
    }

    // Try localStorage cache synchronously
    try {
      const cachedStr = localStorage.getItem("puima_ai_translations");
      if (cachedStr) {
        const cache = JSON.parse(cachedStr);
        if (cache[trimmed]) {
          setTranslated(cache[trimmed]);
          return;
        }
      }
    } catch (e) {}

    // Show dynamic translation via Gemini otherwise
    translateTextWithAI(trimmed).then((res) => {
      if (isMounted) {
        setTranslated(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, lang]);

  return <span className={className}>{translated}</span>;
};

export default TranslatedText;
