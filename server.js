require('dotenv').config();
const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;

// In-memory vector store
const vectorStore = [];

app.use(express.static('public'));
app.use(express.json());

// Upload and process a document
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = req.file.buffer.toString('utf-8');
    const chunks = chunkText(text, 500, 50);

    console.log(`Processing ${chunks.length} chunks from ${req.file.originalname}`);

    // Get embeddings for all chunks
    const embeddings = await getEmbeddings(chunks);

    // Store chunks with their embeddings
    for (let i = 0; i < chunks.length; i++) {
      vectorStore.push({
        text: chunks[i],
        embedding: embeddings[i],
        source: req.file.originalname,
      });
    }

    res.json({
      message: `Processed ${chunks.length} chunks from ${req.file.originalname}`,
      totalChunks: vectorStore.length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ask a question
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    if (vectorStore.length === 0) {
      return res.json({ answer: 'Please upload a document first.' });
    }

    // Embed the question
    const [questionEmbedding] = await getEmbeddings([question]);

    // Find top 3 most similar chunks
    const scored = vectorStore.map((item) => ({
      ...item,
      score: cosineSimilarity(questionEmbedding, item.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, 3);

    const context = topChunks.map((c) => c.text).join('\n\n---\n\n');

    // Ask GPT with the context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Answer the user's question based on the following document excerpts. If the answer isn't in the provided context, say so honestly. Don't make things up.\n\nContext:\n${context}`,
        },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: topChunks.map((c) => ({
        text: c.text.substring(0, 100) + '...',
        source: c.source,
        score: c.score.toFixed(3),
      })),
    });
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get document count
app.get('/api/status', (req, res) => {
  const sources = [...new Set(vectorStore.map((v) => v.source))];
  res.json({ totalChunks: vectorStore.length, documents: sources });
});

// Helper: chunk text with overlap
function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.length > 20);
}

// Helper: get embeddings from OpenAI
async function getEmbeddings(texts) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

// Helper: cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

app.listen(PORT, () => {
  console.log(`RAG chatbot running on http://localhost:${PORT}`);
});
