const axios = require('axios');

export default async function handler(req, res) {
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
      "Referer": "https://www.rctiplus.com/"
    };

    // 1. Minta Visitor Token dari RCTI+
    const visitorRes = await axios.post("https://api.rctiplus.com/api/v1/visitor", {
      client_name: "web",
      device_id: "vercel-" + Math.floor(Math.random() * 100000)
    }, { headers, timeout: 8000 });

    const bearerToken = visitorRes.data?.data?.access_token || visitorRes.data?.access_token;

    if (!bearerToken) {
      return res.status(500).send("Gagal mengambil Visitor Token");
    }

    // 2. Minta Stream URL m3u8 ber-token
    const streamRes = await axios.get("https://api.rctiplus.com/api/v2/tv/1/stream", {
      headers: { ...headers, "Authorization": `Bearer ${bearerToken}` },
      timeout: 8000
    });

    const m3u8Url = streamRes.data?.data?.url || streamRes.data?.url;

    if (!m3u8Url) {
      return res.status(500).send("URL Stream tidak ditemukan");
    }

    // Set Header agar Vercel meng-cache hasilnya selama 45 menit 
    // (mengurangi beban request ke API RCTI+ dan mempercepat respon)
    res.setHeader('Cache-Control', 's-maxage=2700, stale-while-revalidate');
    
    // Kembalikan URL stream m3u8 ber-token
    return res.status(200).send(m3u8Url);

  } catch (err) {
    return res.status(500).send("Error API: " + err.message);
  }
}
