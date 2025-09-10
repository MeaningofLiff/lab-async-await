(function (global) {
  function displayPosts(posts) {
    const ul = document.getElementById('post-list'); // ← ensure this exists
    if (!ul) return;

    ul.innerHTML = '';

    posts.forEach(({ title, body }) => {
      const li = document.createElement('li');

      const h1 = document.createElement('h1');
      h1.textContent = title;

      const p = document.createElement('p');
      p.textContent = body;

      li.appendChild(h1);
      li.appendChild(p);
      ul.appendChild(li);
    });
  }

  async function loadPosts() {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    displayPosts(posts);
  }

  // Expose for browser/JSDOM
  global.displayPosts = displayPosts;
  global.loadPosts = loadPosts;

  // Export for Node (if tests require it directly)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { displayPosts, loadPosts };
  }
})(typeof window !== 'undefined' ? window : globalThis);