import dotenv from 'dotenv';
dotenv.config();
const PAGESPEED_API_KEY = process.env.VITE_PAGESPEED_API_KEY;

async function test() {
  const url = "https://example.com";
  const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PAGESPEED_API_KEY}&category=PERFORMANCE&strategy=mobile`;
  const response = await fetch(psUrl);
  const data = await response.json();
  console.log("Performance Score:", data.lighthouseResult.categories.performance.score * 100);
}
test();
