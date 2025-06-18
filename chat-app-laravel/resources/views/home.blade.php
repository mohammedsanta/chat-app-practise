<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Random Video Chat - Home</title>
  <style>
    /* Reset */
    * {
      box-sizing: border-box;
    }
    body, html {
      height: 100%;
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #4e9af1, #85c9f9);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      overflow: hidden;
      padding: 20px;
      text-align: center;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      text-shadow: 0 3px 5px rgba(0,0,0,0.3);
    }
    p.subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      font-weight: 300;
      max-width: 600px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    /* Tag container */
    .tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-bottom: 1.5rem;
      max-width: 600px;
    }
    .tag {
      background: rgba(255, 255, 255, 0.25);
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: default;
      user-select: none;
      transition: background 0.3s ease;
    }
    .tag:hover {
      background: rgba(255, 255, 255, 0.4);
    }
    /* Tag input container */
    .tag-input-container {
      margin-bottom: 3rem;
      display: flex;
      justify-content: center;
      gap: 10px;
      max-width: 600px;
      width: 100%;
    }
    input#newTagInput {
      flex-grow: 1;
      padding: 12px 20px;
      border-radius: 30px;
      border: none;
      font-size: 1rem;
      outline: none;
    }
    input#newTagInput::placeholder {
      color: #999;
    }
    button#addTagBtn {
      background-color: #1967d2;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 1rem;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 5px 15px rgba(25, 103, 210, 0.5);
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
      user-select: none;
    }
    button#addTagBtn:hover {
      background-color: #0f4a8c;
      box-shadow: 0 8px 20px rgba(15, 74, 140, 0.7);
    }
    button#addTagBtn:active {
      background-color: #0a2f5c;
      box-shadow: none;
    }
    /* Start button */
    .start-btn {
      background-color: #1967d2;
      color: white;
      border: none;
      padding: 16px 48px;
      font-size: 1.5rem;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 5px 15px rgba(25, 103, 210, 0.5);
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
      user-select: none;
    }
    .start-btn:hover {
      background-color: #0f4a8c;
      box-shadow: 0 8px 20px rgba(15, 74, 140, 0.7);
    }
    .start-btn:active {
      background-color: #0a2f5c;
      box-shadow: none;
    }
  </style>
</head>
<body>
  <h1>Random Video Chat</h1>
  <p class="subtitle">Connect instantly with strangers, chat with video, and make new friends anonymously.</p>

  <div class="tags" aria-label="Chat tags" id="tagsContainer">
    <div class="tag">Anonymous</div>
    <div class="tag">Video Chat</div>
    <div class="tag">Random</div>
    <div class="tag">Strangers</div>
    <div class="tag">Safe</div>
    <div class="tag">Instant</div>
    <div class="tag">Free</div>
  </div>

  <div class="tag-input-container">
    <input
      id="newTagInput"
      type="text"
      placeholder="Add a tag (e.g. Friendly)"
      maxlength="20"
      aria-label="Add a new chat tag"
    />
    <button id="addTagBtn" aria-label="Add tag button">Add Tag</button>
  </div>

  <button class="start-btn" onclick="location.href='/chat'">Start Chat</button>

  <script>
    const addTagBtn = document.getElementById('addTagBtn');
    const newTagInput = document.getElementById('newTagInput');
    const tagsContainer = document.getElementById('tagsContainer');

    function sanitizeTag(tag) {
      // Remove leading/trailing whitespace, disallow empty tags
      return tag.trim();
    }

    function tagExists(tag) {
      const tags = [...tagsContainer.querySelectorAll('.tag')].map(t => t.textContent.toLowerCase());
      return tags.includes(tag.toLowerCase());
    }

    function addTag(tag) {
      if (!tag) return;
      if (tagExists(tag)) {
        alert('Tag already exists!');
        return;
      }
      const tagDiv = document.createElement('div');
      tagDiv.className = 'tag';
      tagDiv.textContent = tag;
      tagsContainer.appendChild(tagDiv);
    }

    addTagBtn.addEventListener('click', () => {
      const newTag = sanitizeTag(newTagInput.value);
      if (!newTag) return;
      addTag(newTag);
      newTagInput.value = '';
      newTagInput.focus();
    });

    // Optional: Enter key triggers add
    newTagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTagBtn.click();
      }
    });
  </script>
</body>
</html>
