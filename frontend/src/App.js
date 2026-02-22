// src/App.js
import React, {useState} from "react";
import UploadForm from "./components/UploadForm";
import ResultView from "./components/ResultView";

export default function App(){
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  return (
    <div style={{
      minHeight:"100vh",
      background:"#f8fafc",
      display:"flex",
      justifyContent:"center",
      alignItems:"flex-start",
      padding:"40px 20px"
    }}>
      <div style={{
        width:"100%",
        maxWidth:950,
        background:"white",
        borderRadius:12,
        padding:30,
        boxShadow:"0 8px 30px rgba(15,23,42,0.06)"
      }}>
        <h1 style={{textAlign:"center", color:"#0f172a", marginBottom:22}}>Scan2Learn </h1>

        <UploadForm  setResult={setResult} setLoading={setLoading} result={result}/>

        {loading && <p style={{textAlign:"center"}}>Processing image…</p>}

        {result && <ResultView data={result} />}
      </div>
    </div>
  );
}
