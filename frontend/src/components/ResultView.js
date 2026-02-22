// src/components/ResultView.js
import React from "react";
import Quiz from "./Quiz";

export default function ResultView({ data }) {
  if (!data) return null;
  
  const { text, summary, quiz } = data;

  return (
    <div style={{ marginTop: 20 }}>

      {/* Extracted Text */}
      <div
        style={{
          padding: 16,
          borderRadius: 10,
          border: "1px solid #e6eef8",
          marginBottom: 18,
          background: "#d1dfeeff",
        }}
      >
        <h2 style={{ color: "#006affff", marginTop: 0 }}>Extracted Text</h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "white",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #2384faff",
          }}
        >
          {text}
        </pre>
      </div>

      {/* Summary Section — Only if summary exists */}
      {summary && summary.trim() !== "" && (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            border: "1px solid #d1fae5",
            marginBottom: 18,
            background: "#ecfdf5",
          }}
        >
          <h2 style={{ color: "#059669", marginTop: 0 }}>Summary</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "white",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #30ff79ff",
            }}
          >
            {summary}
          </pre>
        </div>
      )}

      {/* Quiz */}
      <div id="quiz-container">
        <Quiz items={quiz || []} extractedText={text} />
      </div>
    </div>
  );
}
