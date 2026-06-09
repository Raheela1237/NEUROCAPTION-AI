import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    const imageData = imageBase64.split(",")[1];

    const prompt = `
Analyze this image and return 3 captions in JSON:
{"captions":["caption1","caption2","caption3"]}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageData } }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      return res.status(200).json(JSON.parse(match[0]));
    }

    return res.status(200).json({
      captions: ["Nice image", "Beautiful moment", "Amazing shot"]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
