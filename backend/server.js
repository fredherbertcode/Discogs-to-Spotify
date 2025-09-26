const express = require("express");
const axios = require("axios");
const cors = require("cors");
const querystring = require("querystring");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
// Health check root endpoint for Railway
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Spotify credentials
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI; // must match Spotify app

// Login → redirect to Spotify
app.get("/login", (req, res) => {
  const scope = [
    "playlist-modify-private",
    "playlist-modify-public",
    "user-library-read",
  ].join(" ");

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
    });

  res.redirect(authUrl);
});

// Spotify callback → exchange code for access_token
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Redirect back to **your Vercel frontend**
    res.redirect(
      `https://discogs-to-spotify-ten.vercel.app?access_token=${access_token}&refresh_token=${refresh_token}`
    );
  } catch (error) {
    console.error("Spotify token error:", error.response?.data || error);
    res.send(
      "Error retrieving access token. Check server logs in Railway for details."
    );
  }
});

// Refresh token endpoint
app.get("/refresh_token", async (req, res) => {
  const refreshToken = req.query.refresh_token;
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(400).json({ error: "Unable to refresh token" });
  }
});

// Start server (Railway uses PORT env)
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
