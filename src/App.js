import React, { useState, useEffect } from "react";

const API_BASE = "https://your-backend.up.railway.app"; 
// ⬆️ change to http://127.0.0.1:5001 if running locally

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // Check if token is already available (from backend redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const access_token = urlParams.get("access_token");
    if (access_token) {
      setLoggedIn(true);
      setToken(access_token);
      window.history.replaceState({}, document.title, "/"); // clean URL
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_BASE}/login`;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Upload response:", data);
      setMessage("✅ Upload successful! Check backend logs.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {!loggedIn ? (
        <button onClick={handleLogin}>Login with Spotify</button>
      ) : (
        <>
          <h2>✅ Logged in to Spotify</h2>
          <p>Token: {token?.slice(0, 20)}...</p>

          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload CSV</button>
          <p>{message}</p>
        </>
      )}
    </div>
  );
}

export default App;
