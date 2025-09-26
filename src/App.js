import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://discogs-to-spotify-production.up.railway.app";

function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!csvFile) return alert("Select a CSV file first.");

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setMessage(res.data.message || "Playlist created!");
    } catch (err) {
      console.error(err);
      setMessage("Error creating playlist.");
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE}/login`;
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Discogs Collection → Spotify Playlist</h1>
      <button onClick={handleLogin}>Login with Spotify</button>
      <div style={{ margin: "20px" }}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </div>
      <button onClick={handleUpload}>Upload CSV & Create Playlist</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
