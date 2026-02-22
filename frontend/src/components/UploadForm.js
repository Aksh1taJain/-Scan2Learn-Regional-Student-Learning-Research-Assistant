// src/components/UploadForm.js
import React, { useState } from "react";

export default function UploadForm({ setResult, setLoading, result }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleSummarise = async () => {
  if (!result?.text) {
    setError("No extracted text to summarise.");
    return;
  }

  const form = new FormData();
  form.append("file", file);
  form.append("summarise", "true");

  try {
    setLoading(true);
    setError("");

    const resp = await fetch("http://127.0.0.1:5000/api/scan", {
      method: "POST",
      body: form,
    });

    const data = await resp.json();
    setResult(data);

  } catch (err) {
    setError("Summarisation failed.");
  } finally {
    setLoading(false);
  }
};


  const onSubmit = async (e) => {
  e.preventDefault();

  if (!file) {
    setError("Please upload an image or PDF.");
    return;
  }

  // allowed types
  const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (!allowed.includes(file.type)) {
    setError("Only JPG, PNG and PDF files are allowed.");
    return;
  }

  const form = new FormData();
  form.append("file", file); 

  try {
    setLoading(true);
    setResult(null);
    setError(null);

    const resp = await fetch("http://127.0.0.1:5000/api/scan", {
      method: "POST",
      body: form,
    });

    const data = await resp.json();
    if (!resp.ok) {
      setError(data.error || "Something went wrong.");
    } else {
      setResult(data);
    }

  } catch (err) {
    setError("Network error.");
  } finally {
    setLoading(false);
  }
};

  

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: "25px", textAlign: "center" }}>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={onFileChange}
        style={{
          padding: "15px",
          width: "90%",
          border: "2px dashed #3a639dff",
          borderRadius: "10px",
          background: "#f8fafc",
          cursor: "pointer"
        }}
      />


      <button
        type="submit"
        style={{
          marginTop: "18px",
          background: "#1e40af",
          color: "white",
          padding: "12px 35px",
          fontSize: "17px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Scan Document
      </button>
      &nbsp;&nbsp;&nbsp;
      <button
      type="button"
      onClick={handleSummarise}
      style={{
        marginTop: "18px",
        background: "#059669",
        color: "white",
        padding: "12px 35px",
        fontSize: "17px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer"
      }}
    >
      Summarise Text
    </button>


      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
    </form>
  );
}
