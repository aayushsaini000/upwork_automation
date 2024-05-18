const puppeteer = require('puppeteer');
require('dotenv').config();

const creds = JSON.parse(process.env.CREDS);

// Function to add a random delay
async function randomDelay(min = 1000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Function to move the mouse to a random position on the page
async function randomMouseMove(page) {
  const viewport = page.viewport();
  const x = Math.random() * viewport.width;
  const y = Math.random() * viewport.height;
  await page.mouse.move(x, y);
}

// Function to retry navigation with random delays
async function retryNavigation(page, url, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      return page;
    } catch (error) {
      if (error.message.includes('net::ERR_ABORTED')) {
        retries++;
        console.log(`Retrying navigation (attempt ${retries}/${maxRetries})`);
        await randomDelay();
      } else {
        throw error;
      }
    }
  }
  throw new Error('Maximum number of retries reached. Failed to navigate to the page.');
}


async function login_to_linkedin(k, browser) {
  const page = await browser.newPage();
  await page.goto("https://www.upwork.com/ab/account-security/login", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await randomDelay(1000, 5000);
  await randomMouseMove(page);
  await page.waitForSelector("#onetrust-accept-btn-handler", {
    visible: true,
  });
  await randomDelay(3000, 10000);
  await page.click("#onetrust-accept-btn-handler");
  await page.waitForSelector("#login_username", { visible: true });
  await randomDelay();
  await page.type("#login_username", creds[k].username);
  await page.click("#login_password_continue");
  await randomDelay();
  await page.waitForSelector("#login_password", { visible: true });
  await page.type("#login_password", creds[k].password);
  await page.click("#login_control_continue");
  await randomDelay();
  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 100000 });
  await new Promise((resolve) => setTimeout(resolve, 100000));
  return page
}

async function searchJobs(searchStrings, k, loop, browser) {
  page = await login_to_linkedin(k, browser)
  console.log("1933333333")
  for (let i = 0; i < searchStrings.length; i++) {
    const keywords = searchStrings[i];
    console.log("srarted searching for ", searchStrings[i]);
    for (let j = 0; j < loop; j++) {
      console.log(
        "loop executed for " + searchStrings[i] + " ",
        j + 1 + " times"
      );
      page = await retryNavigation(
        page,
        `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(
          keywords
        )}`
      );

      await page.waitForSelector(".job-tile-title");
      await randomMouseMove(page);
      const jobListings = await page.$$(".job-tile-title a");

      for (let i = 0; i < jobListings.length; i++) {
        const jobListing = jobListings[i];
        await new Promise((resolve) => setTimeout(resolve, 20000));

        await jobListing.click();
        console.log(i + 1, " job executed");
        await new Promise((resolve) => setTimeout(resolve, 20000));

        await page.waitForSelector(
          ".air3-slider.air3-slider-job-details-modal",
          {
            timeout: 10000,
          }
        );

        await page.waitForSelector(
          ".air3-slider-prev-btn.air3-slider-close-desktop"
        );

        const backBtn = await page.$(
          ".air3-slider-prev-btn.air3-slider-close-desktop"
        );

        await backBtn.click();
        console.log("job back button clicked");

        await page.waitForSelector(".job-tile-title");
      }
      console.log("end line of J loop");
    }
    console.log("exit from inner loop");
  }


  await page.close();
}

async function main() {
  while (true) {
    for (let k = 0; k < creds.length; k++) {
      const browser = await puppeteer.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--disable-notifications',
          '--disable-extensions',
          '--start-maximized',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
        ],
      });
      const loop = parseInt(creds[k].loop);
      const searchStrings = creds[k].keywords;
      await searchJobs(searchStrings, k, loop, browser);
      await browser.close();
    }
    // Wait for a random delay before starting the next iteration
    await randomDelay(5000, 10000);
  }
}

main().catch((err) => console.error(err));