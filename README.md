# RAG Chatbot Template

A simple RAG (Retrieval-Augmented Generation) chatbot. Upload a document, ask questions about it, and get answers grounded in the actual content.

No vector database needed — this uses an in-memory store to keep things simple. Good for prototyping and learning how RAG works.

## What it does

- Upload `.txt` or `.md` files through the web UI
- Text gets split into chunks and turned into OpenAI embeddings
- When you ask a question, it finds the most relevant chunks using cosine similarity
- Those chunks get sent to GPT along with your question for an accurate answer

## Quick start

```bash
git clone https://github.com/Hand-On-Web-Ltd/rag-chatbot-template.git
cd rag-chatbot-template
npm install
cp .env.example .env
# Add your OpenAI API key to .env
npm start
```

Open `http://localhost:3000`, upload a document, and start asking questions.

## Project structure

```
├── server.js          # Express server with upload + RAG logic
├── public/
│   ├── index.html     # Upload + chat UI
│   └── app.js         # Client-side JS
├── package.json
├── .env.example
└── LICENSE
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `PORT` | Server port (default: 3000) |

## How the RAG pipeline works

1. **Upload** — file content gets read as plain text
2. **Chunk** — text is split into ~500 character pieces with some overlap
3. **Embed** — each chunk gets an embedding via `text-embedding-3-small`
4. **Store** — chunks + embeddings go into a simple in-memory array
5. **Query** — your question gets embedded, compared against stored chunks using cosine similarity
6. **Answer** — top 3 matching chunks get sent to GPT-4o as context

It's not production-grade, but it works well for demos and prototypes.

## About Hand On Web
We build AI chatbots, voice agents, and automation tools for businesses.
- 🌐 [handonweb.com](https://www.handonweb.com)
- 📧 outreach@handonweb.com
- 📍 Chester, UK

## Licence
MIT
