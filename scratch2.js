import https from 'https';
import http from 'http';

function getFinalUrl(url) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https') ? https : http).get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).href;
        }
        resolve(getFinalUrl(redirectUrl));
      } else {
        resolve(url);
      }
    });
    req.on('error', reject);
  });
}

async function test() {
  const url = "http://github.com"; // Redirects to https://github.com
  const finalUrl = await getFinalUrl(url);
  console.log("Final URL:", finalUrl);
}
test();
