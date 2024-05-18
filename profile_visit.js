const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();


// Function to add a random delay
async function randomDelay(min = 5000, max = 10000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

async function moveAndClick(page, selector) {
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    await element.hover();
    await randomDelay(20000, 50000);
    await element.click();
    await randomDelay(20000, 15000);
}

async function typeLikeHuman(page, selector, text, maxDelay = 3) {
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    for (const char of text) {
        await element.type(char);
        await randomDelay(10000, 30000);
    }
}

async function loginToLinkedin(page) {
    await page.goto('https://www.linkedin.com/login');
    await typeLikeHuman(page, '#username', process.env.LOGIN_USERNAME);
    await typeLikeHuman(page, '#password', process.env.LOGIN_PASSWORD);
    await randomDelay(5000, 9000);
    await moveAndClick(page, 'button[type="submit"]');
    await randomDelay(10000, 90000);
    await page.waitForSelector('input[role="combobox"]');
}

async function visitProfile(page, profileLink) {
    await page.goto(profileLink);
    console.info(`Visited profile: ${profileLink}`);

    // Scroll to the bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(10000, 100000);

    try {
        // Attempt to click on a button
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
            // Choose a random button to click
            const randomIndex = Math.floor(Math.random() * buttons.length);
            const buttonToClick = buttons[randomIndex];
            await buttonToClick.click();
            await randomDelay(10000, 100000);
        }
    } catch (error) {
        // Log the error without breaking the script
        console.error('Error clicking on a button:', error);
    }

    const random = {
        int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        boolean: () => Math.random() >= 0.5
    };

    // Scroll up and down randomly
    const scrollSteps = random.int(3, 5);
    for (let i = 0; i < scrollSteps; i++) {
        const scrollDirection = random.boolean() ? 'up' : 'down';
        if (scrollDirection === 'up') {
            await page.evaluate(() => window.scrollBy(0, -window.innerHeight));
        } else {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        }
        await randomDelay(10000, 100000);
    }

    // Random delay before moving on
    await randomDelay(10000, 50000);
}

async function searchKeywordAndVisitProfiles(page, keyword, pageLimit) {
    let pageCount = 1;
    while (pageCount <= pageLimit) {
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${keyword}&page=${pageCount}`;
        await page.goto(searchUrl);

        const profileLinks = await page.$$eval('a[href*="/in/"][class*="app-aware-link"]', links => links.map(link => link.href));
        console.log("===================>", searchUrl, pageCount, profileLinks)
        for (const profileLink of profileLinks) {
            await visitProfile(page, profileLink);
            await page.goBack();
            await randomDelay(20000, 60000);
        }

        console.info(`Visited all profiles on page ${pageCount} for keyword '${keyword}'`);

        pageCount++;
        await randomDelay(10000, 100000);
    }
}

async function waitForNextRun(delaySeconds) {
    console.info(`On break for ${delaySeconds / 3600} hours till the next run.`);
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    console.info('Resuming execution after the delay.');
}




async function main() {
    const delayHours = parseFloat(process.env.DELAY_HOURS || 5);
    const delaySeconds = delayHours * 3600;
    const pageLimit = parseInt(process.env.PAGE_LIMIT || 5);
    const breakTimeMinutes = parseInt(process.env.BREAK_TIME_MINUTES || 60);

    const browser = await puppeteer.launch({
        headless: false, // Set to false to see the browser in action
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-extensions',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36');

    await loginToLinkedin(page);

    let startTime = new Date(); // Get the current time when the script starts

    while (true) {
        let currentTime = new Date(); // Get the current time
        let timeElapsed = (currentTime - startTime) / 1000 / 60; // Calculate the time elapsed in minutes
        console.log(`Time elapsed: ${timeElapsed.toFixed(2)} minutes`); // Log the time elapsed
        const keywords = (process.env.PROFILE_VISIT_KEYWORDS || '').split(',');
        for (const keyword of keywords) {
            if (breakTimeMinutes < timeElapsed.toFixed(2)) {
                console.info(`Taking a break for ${delaySeconds} minutes.`);
                await waitForNextRun(delaySeconds);
                startTime = new Date();
            }
            await searchKeywordAndVisitProfiles(page, keyword.trim(), pageLimit);
            await randomDelay(30000, 50000);
        }
    }
}

main().catch(console.error);