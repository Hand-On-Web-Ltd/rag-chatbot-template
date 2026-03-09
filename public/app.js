const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const messages = document.getElementById('messages');
const questionInput = document.getElementById('questionInput');

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) {
    uploadStatus.textContent = 'Pick a file first.';
    return;
  }

  uploadStatus.textContent = 'Processing...';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      uploadStatus.textContent = data.message;
      addMessage('bot', `Document uploaded! ${data.totalChunks} chunks indexed. Ask me anything about it.`);
    } else {
      uploadStatus.textContent = 'Error: ' + data.error;
    }
  } catch (err) {
    uploadStatus.textContent = 'Upload failed: ' + err.message;
  }
}

async function askQuestion() {
  const question = questionInput.value.trim();
  if (!question) return;

  addMessage('user', question);
  questionInput.value = '';

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();

    if (res.ok) {
      let sourceInfo = '';
      if (data.sources && data.sources.length > 0) {
        sourceInfo = data.sources
          .map((s) => `[${s.source} — relevance: ${s.score}]`)
          .join(', ');
      }
      addMessage('bot', data.answer, sourceInfo);
    } else {
      addMessage('bot', 'Error: ' + data.error);
    }
  } catch (err) {
    addMessage('bot', 'Failed to get answer: ' + err.message);
  }
}

function addMessage(role, text, sources) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `<strong>${role === 'user' ? 'You' : 'Bot'}:</strong> ${escapeHtml(text)}`;

  if (sources) {
    const srcDiv = document.createElement('div');
    srcDiv.className = 'sources';
    srcDiv.textContent = 'Sources: ' + sources;
    div.appendChild(srcDiv);
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
