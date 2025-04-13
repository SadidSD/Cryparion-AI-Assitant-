
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const USER_INFO = {
  name: "Sadid Bin Hasan",
  role: "Web Developer",
  expertise: ["AI Applications", "Web Development", "Blockchain"],
  experience: "Full-stack development",
  location: "Dhaka, Bangladesh",
  contact: "cryparion@gmail.com",
  education: "BSc in Computer Science and Engineering",
  institution: "North South University",
  technologies: ["React", "Node.js", "Express", "MongoDB", "javaScript","git", "github"],
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = "moonshotai/kimi-vl-a3b-thinking:free";

const SYSTEM_PROMPT = `You are an AI assistant created by ${USER_INFO.name} and you are the personal assistant of  ${USER_INFO.name}. Follow these rules:
1. Only mention being ${USER_INFO.name}'s assistant when asked about your identity
2. Use this information when relevant:
   - Name: ${USER_INFO.name}
   - Role: ${USER_INFO.role}
   - Expertise: ${USER_INFO.expertise.join(', ')}
   - Experience: ${USER_INFO.experience}
   - Location: ${USER_INFO.location}
   - Contact: ${USER_INFO.contact}
3. Keep responses concise (2-3 sentences) unless asked for details
4. For technical/non-personal queries, respond normally
5. When asked about your creator/owner, respond that you are created and trained by ${USER_INFO.name} and that you are an AI assistant.
   - Do not mention any other names or entities.
6. Never volunteer personal information unprompted.
8. Most importantly, Your name is Cryparion and you are an AI assistant created by ${USER_INFO.name}.`;

app.post('/api/chat', async (req, res) => {
  try {
    let messages = req.body.messages || [{
      role: "user",
      content: req.body.message || ""
    }];

    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ];

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid message format" });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL_NAME,
        messages: messages.map(msg => ({
          role: msg.role,
          content: Array.isArray(msg.content) ? 
            msg.content.map(contentItem => ({
              type: contentItem.type,
              ...(contentItem.type === 'text' ? { text: contentItem.text } : {}),
              ...(contentItem.type === 'image_url' ? {
                image_url: {
                  url: contentItem.image_url.url,
                  detail: contentItem.image_url.detail || 'auto'
                }
              } : {})
            })) : [{ type: 'text', text: msg.content }]
        })),
        temperature: 0.6,
        max_tokens: 1000,
        stop: ["\n###"]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Technical Assistant',
          'Content-Type': 'application/json',
          'X-API-Version': '1.0.0'
        },
        timeout: 15000
      }
    );

    const result = response.data.choices[0].message;
    const rawContent = Array.isArray(result.content) ? 
      result.content.map(c => c.text).join('\n') : 
      result.content;

    const finalReply = rawContent
      .replace(/◁think▷[\s\S]*?◁\/think▷/g, '')
      .trim();

    res.json({ reply: finalReply });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || 
                        error.message || 
                        'Service unavailable. Please try again later.';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});