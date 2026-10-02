// 允允豬助手 · 聊天後端（Vercel serverless）
// 前端 POST /api/chat → 本函數用 DeepSeek 模型產生回覆
// 需在 Vercel 環境變數設定：DEEPSEEK_API_KEY = sk-...

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, msg: 'POST only' });

  const key = process.env.DEEPSEEK_API_KEY || '';
  if (!key) return res.status(500).json({ ok: false, msg: '尚未設定 DEEPSEEK_API_KEY' });

  let hist = (req.body && req.body.messages) || [];
  if (!Array.isArray(hist) || !hist.length) {
    return res.status(400).json({ ok: false, msg: '缺少訊息' });
  }

  const sys = {
    role: 'system',
    content: '你叫「允允豬助手」，是一隻可愛又熱情的小豬 AI 夥伴。請用繁體中文（香港用語）回應，語氣親切活潑、愛用表情符號。你擅長閒聊、陪伴、解答問題、給建議。回覆簡潔清楚，不要太冗長，除非使用者要求詳細。'
  };
  const msgs = [sys].concat(hist.slice(-20));

  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: msgs,
        max_tokens: 800,
        temperature: 0.8
      })
    });
    const d = await r.json();
    const reply = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    if (reply) return res.status(200).json({ ok: true, reply: reply });
    const em = (d && d.error && d.error.message) || '模型無回應';
    return res.status(200).json({ ok: false, msg: em });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: '伺服器錯誤' });
  }
};
