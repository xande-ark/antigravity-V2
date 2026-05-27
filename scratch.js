import fs from 'fs';
import https from 'https';

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
let apiKey = '';
for (const line of lines) {
  if (line.startsWith('VITE_PAGESPEED_API_KEY=')) {
    apiKey = line.split('=')[1].trim();
  }
}

async function test() {
  const url = "https://example.com";
  const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=PERFORMANCE&strategy=mobile`;
  
  const response = await fetch(psUrl);
  const data = await response.json();
  console.log("Performance Score:", data.lighthouseResult.categories.performance.score * 100);
}
test();
