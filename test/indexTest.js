const chai = require('chai');
global.expect = chai.expect;

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const babel = require('@babel/core');

// Load HTML content
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf-8');

// Transform JavaScript using Babel
const { code: transformedScript } = babel.transformFileSync(
  path.resolve(__dirname, '..', 'index.js'),
  { presets: ['@babel/preset-env'] }
);

// Initialize JSDOM with a real base URL so relative scripts resolve
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'file://' + path.resolve(__dirname, '..') + '/', // 👈 key fix
});

// Handle fetch (polyfill into the window + expose to Node if needed)
const fetchPkg = path.resolve(__dirname, '..', 'node_modules/whatwg-fetch/dist/fetch.umd.js');
dom.window.eval(fs.readFileSync(fetchPkg, 'utf-8'));
global.fetch = dom.window.fetch;

// Inject the transformed JavaScript into the virtual DOM
const scriptElement = dom.window.document.createElement('script');
scriptElement.textContent = transformedScript;
dom.window.document.body.appendChild(scriptElement);

// Expose JSDOM globals to the testing environment
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.Text = dom.window.Text;
global.XMLHttpRequest = dom.window.XMLHttpRequest;

// Helper: wait until a condition is true or timeout
function waitFor(predicate, { timeout = 3000, interval = 25 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      try {
        if (predicate()) return resolve();
      } catch (_) {}
      if (Date.now() - start > timeout) return reject(new Error('waitFor timeout'));
      setTimeout(check, interval);
    })();
  });
}

describe('Asynchronous Fetching', () => {
  before(async () => {
    // Explicitly call the global function your app exposes
    await dom.window.loadPosts();
    // Wait until at least one <li> is on the page
    await waitFor(() => document.querySelector('#post-list li'));
  });

  it('should fetch to external api and add information to page', () => {
    const postDisplay = document.querySelector('#post-list');
    expect(postDisplay.innerHTML).to.include('sunt aut'); // first post title substring
  });

  it('should create an h1 and p element to add', () => {
    const h1 = document.querySelector('li h1');
    const p  = document.querySelector('li p');

    expect(h1).to.exist;
    expect(p).to.exist;

    expect(h1.textContent).to.include('sunt aut facere repellat');
    expect(p.textContent).to.include('quia et suscipit');
  });
}); 