// File: public/js/ui.js

export function initUI() {
  console.log('Initializing UI...');
  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('closeBtn').style.display = 'none';
  document.getElementById('nextBtn').style.display = 'none';
  updateStatus('Click "Start Chat" to begin');
}

export function bindUIEvents(handlers) {
  console.log('Binding UI events...');
  
  document.getElementById('startBtn').onclick = () => {
    console.log('Start button clicked');
    handlers.onStart();

    // Show/hide buttons on start
    console.log('Hiding Start button, showing Close and Next buttons');
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('closeBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'inline-block';
  };

  document.getElementById('closeBtn').onclick = () => {
    console.log('Close button clicked');
    handlers.onClose();

    // Show/hide buttons on close
    console.log('Showing Start button, hiding Close and Next buttons');
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('closeBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
  };

  document.getElementById('nextBtn').onclick = () => {
    console.log('Next button clicked');
    handlers.onNext();

    // On "Next", keep Close and Next visible, hide Start (since still connected)
    console.log('Keeping Close and Next buttons visible, Start button hidden');
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('closeBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'inline-block';

    // Also clear chat input and messages
    document.getElementById('chatInput').value = '';
    document.getElementById('chatMessages').innerHTML = '';
  };

  document.getElementById('chatForm').onsubmit = e => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) {
      console.log('Empty chat message, ignoring submit.');
      return;
    }
    console.log('Sending chat message:', msg);
    handlers.onSendMessage(msg);
    input.value = '';
  };
}

export function updateStatus(text) {
  console.log('Status update:', text);
  document.getElementById('status').textContent = text;
}

export function appendMessage(text, fromSelf) {
  console.log(`Appending message (${fromSelf ? 'self' : 'partner'}):`, text);
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = fromSelf ? 'chat-message self' : 'chat-message partner';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
