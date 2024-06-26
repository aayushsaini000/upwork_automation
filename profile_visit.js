const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();


// Function to add a random delay
async function randomDelay(min = 5000, max = 10000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}


// async function moveAndClick(page, selector) {
//     await page.waitForSelector(selector);
//     const element = await page.$(selector);
//     await element.hover();
//     await randomDelay(20000, 50000);
//     await element.click();
//     await randomDelay(20000, 15000);
// }

async function moveAndClick(page, selector) {
    try {
        await page.waitForSelector(selector);
        const element = await page.$(selector);
        const box = await element.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); // Move to the center of the element
        await randomDelay(1000, 3000); // Random delay before hovering
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); // Move to the center of the element again
        await randomDelay(1000, 3000); // Random delay after hovering
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); // Click in the center of the element
        await randomDelay(1000, 3000); // Random delay after clicking
    } catch (error) {
        console.log("Error in moveAndClick:")
    }
}

async function randomMouseMovement(page) {
    try {
        const viewport = await page.viewport();
        const actions = [];

        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
            const x = Math.floor(Math.random() * 41) - 20; // Random offset between -20 and 20
            const y = Math.floor(Math.random() * 41) - 20; // Random offset between -20 and 20
            actions.push({ type: 'move', x, y });
            await randomDelay();
        }

        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
            const direction = Math.random() < 0.5 ? 'up' : 'down';
            if (direction === 'up') {
                actions.push({ type: 'scroll', y: -viewport.height });
            } else {
                actions.push({ type: 'scroll', y: viewport.height });
            }
            await randomDelay();
        }

        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
            const x = Math.floor(Math.random() * 41) - 20; // Random offset between -20 and 20
            const y = Math.floor(Math.random() * 41) - 20; // Random offset between -20 and 20
            actions.push({ type: 'move', x, y });
            await randomDelay();
        }

        for (const action of actions) {
            switch (action.type) {
                case 'move':
                    await page.mouse.move(action.x, action.y);
                    break;
                case 'scroll':
                    await page.evaluate((_y) => {
                        window.scrollBy(0, _y);
                    }, action.y);
                    break;
            }
        }

    } catch (error) {
        console.log("Error in randomMouseMovement:")
    }
}


// Add randomness to typing
async function typeLikeHuman(page, selector, text) {
    try {
        await page.waitForSelector(selector);
        const element = await page.$(selector);
        for (const char of text) {
            await element.type(char);
            await randomDelay(1000, 3000);
        }
    } catch (error) {
        console.log("Error in typeLikeHuman:")
    }

}



async function loginToLinkedin(page) {
    try {
        await page.goto('https://www.linkedin.com/login');
        await typeLikeHuman(page, '#username', process.env.LOGIN_USERNAME);
        await typeLikeHuman(page, '#password', process.env.LOGIN_PASSWORD);
        await randomDelay(5000, 9000);
        await moveAndClick(page, 'button[type="submit"]');
        await randomDelay(10000, 50000);
        await page.waitForSelector('input[role="combobox"]');
        await randomDelay(5000, 9000);
    } catch (error) {
        console.log("Error in loginToLinkedin:")
    }

}

async function visitProfile(page, profileLink) {
    try {
        await page.goto(profileLink);
        console.info(`Visited profile: ${profileLink}`);
        await randomMouseMovement(page)
        // Scroll to the bottom of the page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await randomDelay(10000, 100000);
        await randomMouseMovement(page)
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
            console.error('Error clicking on a button:');
        }
        await randomMouseMovement(page)

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
        await randomMouseMovement(page)
        // Random delay before moving on
        await randomDelay(10000, 50000);
    } catch (error) {
        console.log("Error in visitProfile:")
    }
}

async function searchKeywordAndVisitProfiles(page, keyword, pageLimit, breakTimeMinutes, delaySeconds, startTime) {
    try {
        let pageCount = 1;
        while (pageCount <= pageLimit) {
            const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${keyword}&page=${pageCount}`;
            await page.goto(searchUrl);
            await randomMouseMovement(page)
            const profileLinks = await page.$$eval('a[href*="/in/"][class*="app-aware-link"]', links => links.map(link => link.href));
            console.log("===================>", searchUrl, pageCount, profileLinks)
            for (const profileLink of profileLinks) {
                let currentTime = new Date();
                let timeElapsed = (currentTime - startTime) / 1000 / 60;
                console.log(`Time elapsed: ${timeElapsed.toFixed(2)} minutes and breaktime is ${breakTimeMinutes}`);
                if (breakTimeMinutes < timeElapsed.toFixed(2)) {
                    console.info(`Taking a break for ${delaySeconds} minutes.`);
                    await waitForNextRun(delaySeconds);
                    startTime = new Date();
                }
                await visitProfile(page, profileLink);
                await randomMouseMovement(page)
                await page.goBack();
                await randomDelay(20000, 60000);
            }
            await randomMouseMovement(page)

            console.info(`Visited all profiles on page ${pageCount} for keyword '${keyword}'`);

            pageCount++;
            await randomDelay(10000, 100000);
        }
    } catch (error) {
        console.log("Error in searchKeywordAndVisitProfiles:")
    }
}



async function waitForNextRun(delaySeconds) {
    console.info(`On break for ${delaySeconds / 3600} hours till the next run.`);
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    console.info('Resuming execution after the delay.');
}




async function main() {
    let startTime = new Date(); // Get the current time when the script starts
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
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox', // Additional flag to disable the setuid sandbox
            '--disable-web-security', // Additional flag to disable web security
            '--disable-features=IsolateOrigins,site-per-process', // Additional flags to disable site isolation
            // '--user-data-dir=/tmp/chrome-profile' // Use a temporary user data directory
        ]
    });

    const page = await browser.newPage();
    // Set a more typical user agent string for a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36');

    await loginToLinkedin(page);
    await randomMouseMovement(page);

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
            await searchKeywordAndVisitProfiles(page, keyword.trim(), pageLimit, breakTimeMinutes, delaySeconds, startTime);
            await randomDelay(30000, 50000);
        }
    }
}

main().catch(console.error);