require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const querystring = require("querystring");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;
const HOST = "127.0.0.1";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Login route
app.get("/login", (req, res) => {
  const scopes = "playlist-modify-public playlist-modify-private";
  const url =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: scopes,
      redirect_uri: REDIRECT_URI,
    });
  res.redirect(url);
});

// Callback route
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send("No code returned from Spotify");

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    res.redirect(`http://localhost:3000/?token=${accessToken}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error exchanging code for token");
  }
});

// Helper: clean titles/artists
function cleanString(str) {
  return str.replace(/["\/\\]/g, "").trim();
}

// Helper: match album names
function isMatch(csvTitle, albumName) {
  const cleanCsv = csvTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanAlbum = albumName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleanAlbum.includes(cleanCsv) || cleanCsv.includes(cleanAlbum);
}

// Search Spotify albums for a release
async function searchAlbumSpotify(release, token) {
  const queries = [
    `${cleanString(release.Title)} ${cleanString(release.Artist)}`,
    `${cleanString(release.Title)}`,
    `${cleanString(release.Artist)} ${cleanString(release.Title)}`
  ];

  for (const q of queries) {
    try {
      const res = await axios.get(
        `https://api.spotify.com/v1/search?${querystring.stringify({
          q,
          type: "album",
          limit: 5,
        })}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const albums = res.data.albums.items;
      if (albums.length) {
        // find the best match based on title similarity
        const match = albums.find(a => isMatch(release.Title, a.name));
        if (match) return match;
      }
    } catch (err) {
      console.error("Spotify search error:", err.message);
    }
  }
  return null; // no match found
}

// Create playlist route
app.post("/create-playlist", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { name, releases } = req.body;

  if (!token) return res.status(401).send("Not logged in");

  try {
    // Get user ID
    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userId = userRes.data.id;

    // Create playlist
    const playlistRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      { name, public: false },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const playlistId = playlistRes.data.id;
    let allTrackUris = [];
    let notFound = [];

    for (const release of releases) {
      const album = await searchAlbumSpotify(release, token);

      if (!album) {
        notFound.push(`${release.Title} - ${release.Artist}`);
        continue;
      }

      try {
        const tracksRes = await axios.get(
          `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const trackUris = tracksRes.data.items.map(t => t.uri);
        allTrackUris.push(...trackUris);
      } catch (err) {
        console.error(`Error fetching tracks for ${album.name}:`, err.message);
      }
    }

    if (allTrackUris.length) {
      const batchSize = 100;
      for (let i = 0; i < allTrackUris.length; i += batchSize) {
        const batch = allTrackUris.slice(i, i + batchSize);
        await axios.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { uris: batch },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }

    res.json({
      message: "Playlist created!",
      playlistUrl: playlistRes.data.external_urls.spotify,
      addedTracks: allTrackUris.length,
      notFound
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error creating playlist");
  }
});

app.listen(PORT, HOST, () =>
  console.log(`Server running on http://${HOST}:${PORT}`)
);
