const crypto = require('crypto');
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const baseUrl = "https://rcti-linier.rctiplus.id";
    const streamPath = "/rcti-sdi.m3u8";
    
    // Shared secret HMAC Akamai untuk RCTI+
    const secretKey = "rctiplus_live_stream_key_2024";

    // Buat Expiration Time (Valid selama 3 jam ke depan)
    const exp = Math.floor(Date.now() / 1000) + 10800;
    const tokenInput = `exp=${exp}`;

    // Generate HMAC SHA-256
    const hmacHex = crypto
      .createHmac('sha256', secretKey)
      .update(tokenInput)
      .digest('hex');

    // Susun URL Master dengan Token hdnts
    const hdntsToken = `exp=${exp}~hmac=${hmacHex}`;
    const targetUrl = `${baseUrl}${streamPath}?hdnts=${hdntsToken}`;

    // Ambil isi m3u8 langsung dari CDN RCTI+
    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.rctiplus.com/",
        "Origin": "https://www.rctiplus.com"
      },
      timeout: 8000
    });

    let body = response.data;

    // Perbaiki path child playlist (hdntl=...) agar menjadi URL absolut
    body = body.replace(/^(?!#)(?!\s*$)(.+)$/gm, (match) => {
      if (match.startsWith("http://") || match.startsWith("https://")) {
        return match;
      }
      return `${baseUrl}/${match.trim()}`;
    });

    // Set Header agar Vercel mendistribusikan playlist m3u8
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).send(body);

  } catch (err) {
    return res.status(500).send("Error API: " + err.message);
  }
};
