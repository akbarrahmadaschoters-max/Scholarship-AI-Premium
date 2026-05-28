const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('diagnostic_progress', JSON.stringify({
      currentStep: 'results',
      satResult: {
        scoreRange: '1200-1300',
        overallScore: '1250',
        classification: 'Mid',
        mathScore: '600',
        readingWritingScore: '650',
        weaknesses: [],
        recommendations: []
      },
      ieltsResult: {
        overallBand: 7.0,
        listeningBand: 7.0,
        readingBand: 7.0,
        writingBand: 7.0,
        speakingBand: 7.0,
        cefrLevel: 'C1',
        weaknesses: [],
        recommendations: []
      }
    }));
  });
  
  await page.goto('http://localhost:5174/diagnostic', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
