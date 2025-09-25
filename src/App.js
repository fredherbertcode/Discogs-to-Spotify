import React, { useState } from "react";
import Papa from "papaparse";
import axios from "axios";

function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [releases, setReleases] = useState([]);
  const [notFound, setNotFound] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");

  // Get Spotify token from URL after login
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setReleases([]);
    setNotFound([]);
    setPlaylistUrl("");
  };

  const parseCsv = () => {
    if (!csvFile) return;
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((r) => ({
          Title: r.Title,
          Artist: r.Artist,
          Released: r.Released,
        }));
        setReleases(data);
      },
    });
  };

  const previewReleases = async () => {
    if (!token) return alert("Please login first.");
    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:5001/create-playlist",
        { name: "Preview Playlist", releases },
        { headers: { Authorization: `Bearer ${token}` }, params: { preview: true } }
      );
      setNotFound(res.data.notFound || []);
    } catch (err) {
      console.error(err);
      alert("Error previewing releases");
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!token) return alert("Please login first.");
    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:5001/create-playlist",
        { name: "My Spotify Playlist", releases },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylistUrl(res.data.playlistUrl);
      setNotFound(res.data.notFound || []);
      alert(`Playlist created! Added ${res.data.addedTracks} tracks.`);
    } catch (err) {
      console.error(err);
      alert("Error creating playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif", padding: 40 }}>
      <h1>Discogs CSV to Spotify Playlist Converter</h1>

      {!token && (
        <a href="http://127.0.0.1:5001/login">
          <button style={{ padding: "10px 20px", marginTop: 20 }}>Login with Spotify</button>
        </a>
      )}

      {token && (
        <>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ marginTop: 20 }}
          />
          <div style={{ marginTop: 10 }}>
            <button onClick={parseCsv} disabled={!csvFile} style={{ marginRight: 10 }}>
              Parse CSV
            </button>
          </div>

          {releases.length > 0 && (
            <>
              <h3 style={{ marginTop: 20 }}>{releases.length} releases loaded</h3>
              <div style={{ marginTop: 10 }}>
                <button onClick={previewReleases} disabled={loading} style={{ marginRight: 10 }}>
                  Preview unmatched releases
                </button>
                <button onClick={createPlaylist} disabled={loading}>
                  Create Playlist
                </button>
              </div>
            </>
          )}

          {loading && <p style={{ marginTop: 20 }}>Processing… please wait</p>}

          {notFound.length > 0 && (
            <div style={{ marginTop: 20, color: "red" }}>
              <h4>Releases not found on Spotify:</h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {notFound.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {playlistUrl && (
            <div style={{ marginTop: 20 }}>
              <h4>Playlist created!</h4>
              <a href={playlistUrl} target="_blank" rel="noreferrer">
                Open Spotify Playlist
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
