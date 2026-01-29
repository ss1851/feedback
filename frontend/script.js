const toast = document.getElementById("toast");

function showToast(text, timeout = 2500){
  if(!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), timeout);
}

async function postFeedback(payload){
  // Try sending to backend first using a relative API path (no localhost)
  const url = '/api/feedback';
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 4000);

  try{
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: payload.name, message: payload.message }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if(res.ok){
      return { ok: true, from: 'server', json: async ()=> await res.json() };
    }
    // non-OK from server -> treat as error
    const text = await res.text();
    throw new Error(text || 'Server error');
  }catch(err){
    clearTimeout(timeout);
    console.warn('Server unavailable, saving locally:', err && err.message);
    // fallback: save to localStorage
    try{
      const key = 'feedbacks_offline';
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const item = Object.assign({ id: Date.now() }, payload, { savedAt: new Date().toISOString() });
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list));
      console.log('Saved feedback (local):', item);
      return { ok: true, from: 'local', json: async ()=> ({ message: 'Saved locally' }) };
    }catch(err2){
      return { ok: false, from: 'error', text: async ()=> (err2 && err2.message) || 'Local save failed' };
    }
  }
}

// Only wire up the form if it exists on the current page
const form = document.getElementById("feedbackForm");
if(form){
  const nameInput = document.getElementById("name");
  const feedbackInput = document.getElementById("feedback");
  const status = document.getElementById("status");
  const sendBtn = document.getElementById("sendBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const feedback = feedbackInput.value.trim();
    if(!name || !feedback){
      showToast('Please fill in name and feedback');
      return;
    }

    sendBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.style.display = 'inline-block';
    sendBtn.prepend(spinner);
    status.textContent = '';

    try{
      const res = await postFeedback({ name, feedback });
      if(!res.ok){
        const text = await res.text();
        throw new Error(text || 'Server error');
      }
      const data = await res.json();
      // If the post was saved locally (fallback), mark it clearly
      if(res.from === 'local'){
        status.textContent = 'Saved locally';
        showToast('Saved locally (offline)');
      }else{
        status.textContent = data.message || 'Feedback received';
        showToast('Thanks — feedback received');
      }

      nameInput.value = '';
      feedbackInput.value = '';
    }catch(err){
      console.error(err);
      status.textContent = 'Failed to send';
      showToast('Unable to send feedback');
    }finally{
      sendBtn.disabled = false;
      spinner.remove();
    }
  });
}

// Open feedback page from Home when button clicked
const openFeedbackBtn = document.getElementById('openFeedbackBtn');
if(openFeedbackBtn){
  openFeedbackBtn.addEventListener('click', (e)=>{
    // Navigate to the feedback page
    window.location.href = 'cards.html';
  });
}
