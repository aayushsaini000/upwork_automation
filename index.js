const puppeteer = require("puppeteer");
require("dotenv").config();

// const loop = parseInt(process.env.LOOP_ITERATION)
// const searchStrings = JSON.parse(process.env.KEYWORDS);

const creds = JSON.parse(process.env.CREDS);

console.log(creds[0].username, creds.length)
for (let k = 0; k < creds.length; k++) {
  const loop = parseInt(creds[k].loop)
  const searchStrings = creds[k].keywords
  searchJobs(searchStrings, k, loop)
}
// searchJobs(searchStrings).catch((error) => console.error(error));


async function searchJobs(searchStrings, k, loop) {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [],
      // args: ["--window-size=1280,720"],
      // args: ['--start-fullscreen']
    });
    const page = await browser.newPage();
    await page.goto("https://www.upwork.com/ab/account-security/login", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForNavigation();
    await page.waitForSelector("#onetrust-accept-btn-handler", {
      visible: true,
    });
    await page.click("#onetrust-accept-btn-handler");
    await page.waitForSelector("#login_username", { visible: true });
    await page.type("#login_username", creds[k].username);
    await page.click("#login_password_continue");
    await page.waitForSelector("#login_password", { visible: true });
    await page.type("#login_password", creds[k].password);
    await page.click("#login_control_continue");
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    await new Promise((resolve) => setTimeout(resolve, 60000));

    //navigating the jobs URL

    for (let i = 0; i < searchStrings.length; i++) {
      const keywords = searchStrings[i]
      console.log("srarted searching for ", searchStrings[i]);
      for (let j = 0; j < loop; j++) {
        console.log("loop executed for " + searchStrings[i] + " ", j + 1 + " times")
        await page.goto(
          `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(
            keywords
          )}`,
          { waitUntil: "domcontentloaded" }
        );
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });

        // opening each job one by one

        await page.waitForSelector(".job-tile-title");
        const jobListings = await page.$$(".job-tile-title a");

        for (let i = 0; i < jobListings.length; i++) {
          const jobListing = jobListings[i];
          await new Promise((resolve) => setTimeout(resolve, 2000));

          await jobListing.click();
          console.log(i + 1, " job executed")
          // await page.waitForNavigation({ waitUntil: "domcontentloaded" });
          await new Promise((resolve) => setTimeout(resolve, 10000));

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
        console.log("end line of J loop")
      }
      console.log("exit from inner loop")
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// const searchStrings = "react";
// searchJobs(searchStrings).catch((error) => console.error(error));