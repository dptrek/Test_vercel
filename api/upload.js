import fetch from "node-fetch";

export default async function handler(req, res) {
  // ==== CORS 设置，允许前端跨域调用 ====
  res.setHeader("Access-Control-Allow-Origin", "*"); // 或指定你的前端域名
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 仅允许 POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, content } = req.body;
    if (!fileName || !content) {
      return res.status(400).json({ error: "Missing fileName or content" });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = "dptrek";  // GitHub 用户名
    const REPO = "dptrek";   // 仓库名
    const BRANCH = "main";   // 分支
    const FOLDER = "data";   // 上传目录

    const path = `${FOLDER}/${fileName}`;
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

    // 检查文件是否已存在，获取 SHA
    let sha = null;
    const checkRes = await fetch(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    if (checkRes.ok) {
      const json = await checkRes.json();
      sha = json.sha;
    }

    // 上传文件
    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Upload ${fileName}`,
        content: content,
        branch: BRANCH,
        sha: sha || undefined,
      }),
    });

    if (!uploadRes.ok) {
      throw new Error(await uploadRes.text());
    }

    const result = await uploadRes.json();
    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
