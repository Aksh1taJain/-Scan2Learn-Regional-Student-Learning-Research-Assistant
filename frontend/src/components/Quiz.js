import React, { useEffect, useState, useRef } from "react";

const STORAGE_KEY = "scan2learn_quiz_state_v1";

// ---- NEW POWERFUL MCQ GENERATOR ----
function generateMCQ(answer, contextText) {
  if (!answer || answer.trim() === "") return [];

  const base = answer.trim().toLowerCase();

  // STEP 1: Break text into words (for category-based distractors)
  const words = contextText
    ?.split(/\s+/)
    ?.map((w) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    ?.filter((w) => w.length > 3) || [];

  // Extract keywords frequently occurring (topic words)
  const freq = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));

  const topKeywords = Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 6); // top topic keywords

  // STEP 2: Semantic variations of the answer
  const semanticWrong = [
    base.replace(/ing$/, ""),           
    base.replace(/ed$/, ""),            
    base + " theory",
    "pseudo " + base,
    base + " model",
    base.split(" ").slice(0,1).join("")  // root form
  ];

  // STEP 3: Same-category/topic distractors using keywords
  const topicWrong = topKeywords
    .filter((k) => !base.includes(k))
    .slice(0,3)
    .map((k) => k + " related");

  // STEP 4: Common misconception distractors
  const misconceptionWrong = [
    "incorrect " + base,
    base + " approximation",
    base + " derivative",
    "reverse of " + base,
  ];

  // Combine all distractor pools
  let candidates = [
    answer,
    ...semanticWrong,
    ...topicWrong,
    ...misconceptionWrong,
  ];

  // Remove duplicates + remove empty
  candidates = Array.from(new Set(candidates)).filter(
    (c) => c && c.length > 2 && c !== answer
  );

  // Shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // FINAL OUTPUT = correct answer + 3 strongest distractors
  return [answer, ...candidates.slice(0, 3)];
}

export default function Quiz({ items, extractedText }) {
  const norm = items.map((it) => ({
    question: it.question || it,
    answer: it.answer || "",
  }));

  // freeze MCQs
  const mcqOptionsRef = useRef([]);
  useEffect(() => {
    if (mcqOptionsRef.current.length === 0) {
      mcqOptionsRef.current = norm.map((q) => generateMCQ(q.answer, extractedText));
    }
  }, []);

  // state
  const [pageIndex, setPageIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const [checked, setChecked] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(true);
  const [perQuestionTime, setPerQuestionTime] = useState(30);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  const [animateKey, setAnimateKey] = useState(0);
  const timerRef = useRef(null);

  // FIX → treat each question as a page  
  const totalQuestions = norm.length;
  const totalPages = totalQuestions;        // FIX
  const currentQuestionIndex = pageIndex;

  // LocalStorage restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.total === norm.length) {
        setPageIndex(parsed.pageIndex || 0);
        setSelections(parsed.selections || {});
        setChecked(parsed.checked || {});
        setSubmitted(parsed.submitted || false);
        setPerQuestionTime(parsed.perQuestionTime || 30);
        setItemsPerPage(parsed.itemsPerPage || 1);
        setTimeLeft(parsed.timeLeft || parsed.perQuestionTime || 30);
      }
    } catch {}
  }, []);

  // save state
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        total: norm.length,
        pageIndex,
        selections,
        checked,
        submitted,
        perQuestionTime,
        itemsPerPage,
        timeLeft,
      })
    );
  }, [
    pageIndex,
    selections,
    checked,
    submitted,
    perQuestionTime,
    itemsPerPage,
    timeLeft,
  ]);

  // timer logic
  useEffect(() => {
    if (!running) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [pageIndex, running]);

  useEffect(() => setTimeLeft(perQuestionTime), [perQuestionTime]);

  // logic
  function handleSelect(i, option) {
    setSelections((p) => ({ ...p, [i]: option }));
    setChecked((p) => ({ ...p, [i]: option === norm[i].answer }));
  }

  function gotoPage(i) {
    if (i < 0 || i >= totalPages) return;
    setAnimateKey((k) => k + 1);
    setPageIndex(i);
    setTimeLeft(perQuestionTime);
    setRunning(true);
  }

  function handleNext() {
    if (pageIndex + 1 < totalPages) gotoPage(pageIndex + 1);
  }

  function handlePrev() {
    if (pageIndex - 1 >= 0) gotoPage(pageIndex - 1);
  }

  function handleTimeout() {
    if (selections[currentQuestionIndex] === undefined) {
      setChecked((p) => ({ ...p, [currentQuestionIndex]: false }));
    }
    if (pageIndex < totalPages - 1) gotoPage(pageIndex + 1);
    else {
      setRunning(false);
      setSubmitted(true);
    }
  }

  function handleSubmitQuiz() {
    setSubmitted(true);
    setRunning(false);
    timerRef.current && clearInterval(timerRef.current);
  }

  function calcScore() {
    let correct = 0;
    for (let i = 0; i < totalQuestions; i++) {
      if (selections[i] === norm[i].answer) correct++;
    }
    return {
      correct,
      total: totalQuestions,
      percent: Math.round((correct / totalQuestions) * 100),
    };
  }

  function resetQuiz() {
    setSelections({});
    setChecked({});
    setSubmitted(false);
    setPageIndex(0);
    setRunning(true);
    setTimeLeft(perQuestionTime);
    localStorage.removeItem(STORAGE_KEY);
  }

  const score = calcScore();

  // UI
  const cardStyle = {
    background: "white",
    borderRadius: 10,
    padding: 18,
    marginBottom: 12,
    border: "1px solid #e6eef8",
  };
  // ---- WEAK AREA ANALYSIS ENGINE ----
function analyzeWeakAreas() {
  const incorrectQuestions = norm.filter((q, i) => selections[i] !== q.answer);

  if (incorrectQuestions.length === 0) {
    return {
      weakTopics: [],
      summary: "Excellent! No weak topics detected — keep going 👏",
      revisionSchedule: "Revision not required."
    };
  }

  // Extract topic words from the original scanned notes
  const words = extractedText
    ?.split(/\s+/)
    ?.map((w) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    ?.filter((w) => w.length > 5) || [];

  const freq = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));

  // Identify most likely topic areas related to wrong answers
  const weakTopics = incorrectQuestions.map(q =>
    q.answer.split(" ")[0].toLowerCase()
  );

  const uniqueWeakTopics = Array.from(new Set(weakTopics));

  return {
    weakTopics: uniqueWeakTopics,
    summary: `You struggled with topics related to: ${uniqueWeakTopics.join(", ")}`,
    revisionSchedule: `👉 Study these topics again for 15–20 mins daily for the next 3 days: 
${uniqueWeakTopics.map(t => `• ${t}`).join("\n")}`,

    suggestions: incorrectQuestions.map((q, i) => ({
      question: q.question,
      correct: q.answer,
      tip: `Review this concept: "${q.answer}". You may be confusing it with related terms.`
    }))
  };
}

  return (
    <div id="quiz-container">
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>Progress</strong>
          <div
            style={{
              width: 250,
              height: 10,
              background: "#e6eef8",
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: `${Math.round(((pageIndex + 1) / totalPages) * 100)}%`,
                height: "100%",
                background: "#0b61d6",
              }}
            />
          </div>
          <div style={{ marginTop: 4 }}>
            Question {pageIndex + 1} / {totalPages}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div>Time left</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: timeLeft <= 5 ? "crimson" : "#0b61d6",
            }}
          >
            {String(timeLeft).padStart(2, "0")}s
          </div>
        </div>
      </div>

      {/* Questions */}
      <div key={animateKey} style={{ marginTop: 16 }}>
        {(() => {
          const start = pageIndex; // FIXED
          const end = Math.min(start + itemsPerPage, totalQuestions);
          const block = [];

          for (let i = start; i < end; i++) {
            const q = norm[i];
            const opts = mcqOptionsRef.current[i] || [];

            block.push(
              <div key={i} style={cardStyle}>
                <div>
                  <strong>Q{i + 1}:</strong> {q.question}
                </div>

                {opts.map((op, oi) => (
                  <label
                    key={oi}
                    style={{
                      display: "block",
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 8,
                      border:
                        selections[i] === op
                          ? "2px solid #0b61d6"
                          : "1px solid #e6eef8",
                      background:
                        selections[i] === op ? "#eef2ff" : "white",
                    }}
                  >
                    <input
                      type="radio"
                      name={`q_${i}`}
                      value={op}
                      checked={selections[i] === op}
                      onChange={() => handleSelect(i, op)}
                      style={{ marginRight: 10 }}
                    />
                    {op}
                  </label>
                ))}

                {checked[i] !== undefined && (
                  <div
                    style={{
                      marginTop: 10,
                      fontWeight: 700,
                      color: checked[i] ? "green" : "crimson",
                    }}
                  >
                    {checked[i]
                      ? "Correct"
                      : `Wrong — Correct: ${q.answer}`}
                  </div>
                )}
              </div>
            );
          }

          return block;
        })()}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
        <div>
          <button onClick={handlePrev} disabled={pageIndex === 0}>
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={pageIndex === totalPages - 1}
            style={{ marginLeft: 8 }}
          >
            Next
          </button>
        </div>

        <div>
          <button
            onClick={handleSubmitQuiz}
            style={{ marginLeft: 8, background: "#059669", color: "white" }}
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Results */}
      {submitted && (
        <div style={{ marginTop: 20, padding: 14, background: "#f1f5f9", borderRadius: 10 }}>
          <h3>Results</h3>
            {/* Weak area assessment */}
{(() => {
  const analysis = analyzeWeakAreas();

  return (
    <div style={{ marginBottom: 20 }}>
      <h4>📌 Personalized Weak Area Analysis</h4>

      <p><strong>{analysis.summary}</strong></p>

      {analysis.weakTopics.length > 0 && (
        <>
          <p style={{ whiteSpace: "pre-line" }}>{analysis.revisionSchedule}</p>

          <h5 style={{ marginTop: 10 }}>Recommended Extra Learning:</h5>
          {analysis.suggestions.map((s, idx) => (
            <div key={idx} style={{ marginTop: 8, padding: 10, background: "#fff7e6", borderRadius: 8 }}>
              <strong>Weak Question:</strong> {s.question} <br />
              <strong>Correct Concept:</strong> {s.correct} <br />
              <em>{s.tip}</em>
            </div>
          ))}
        </>
      )}
    </div>
  );
})()}

          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
            Score: {score.correct}/{score.total} ({score.percent}%)
          </div>

          {/* full detailed breakdown */}
          {norm.map((q, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                background: "white",
                marginBottom: 10,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              <div>
                <strong>Q{i + 1}:</strong> {q.question}
              </div>
              <div>Your Answer: {selections[i] || "(not answered)"}</div>
              <div>Correct Answer: {q.answer}</div>
              <div
                style={{
                  marginTop: 5,
                  fontWeight: 700,
                  color: selections[i] === q.answer ? "green" : "crimson",
                }}
              >
                {selections[i] === q.answer ? "✓ Correct" : "✗ Wrong"}
              </div>
            </div>
          ))}

          <button onClick={resetQuiz} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
