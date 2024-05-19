const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();


// Function to add a random delay
async function randomDelay(min = 5000, max = 10000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}



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


async function waitForNextRun(delaySeconds) {
    console.info(`On break for ${delaySeconds} seconds till the next run.`);
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    console.info('Resuming execution after the delay.');
}



async function followPostsWhileScrolling(page, keyword, followCountLimit, breakTimeMinutes, delaySeconds, startTime) {
    console.log("2155555555555555555", keyword)
    const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${keyword}&origin=CLUSTER_EXPANSION`;
    await page.goto(searchUrl);
    let followCount = 0;
    let lastHeight = await page.evaluate('document.body.scrollHeight');
    console.log("2200000000000", followCount, followCountLimit)
    while (followCount < followCountLimit) {
        console.log("188888888888888")
        try {
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await randomDelay(2000, 5000);
            const followButtons = await page.$$('.follow');
            console.log("22777777777")
            for (const button of followButtons) {
                console.log("229999999999999")
                if (followCount > followCountLimit) {
                    console.log("23111111111")
                    break;
                }
                let currentTime = new Date();
                let timeElapsed = (currentTime - startTime) / 1000 / 60;
                if (breakTimeMinutes < timeElapsed.toFixed(2)) {
                    console.info(`Taking a break for ${delaySeconds} seconds.`);
                    await waitForNextRun(delaySeconds);
                    startTime = new Date();
                }
                try {
                    await button.click();
                    console.log("2355555555555", followCount, followCountLimit)
                    followCount += 1;
                    if (followCount >= followCountLimit) {
                        console.info(`Taking a break for ${delaySeconds} seconds.`);
                        await waitForNextRun(delaySeconds);
                        startTime = new Date();
                        break;
                    }
                    await randomDelay(2000, 6000);
                } catch (e) {
                    console.warn("Stale element reference. Skipping this button.");
                    continue;
                }
            }
            const newHeight = await page.evaluate('document.body.scrollHeight');
            console.log("257777777777777")
            if (newHeight === lastHeight) {
                console.log("25999999999999")
                break;
            }
            lastHeight = newHeight;
        } catch (e) {
            console.warn("Window closed unexpectedly. Terminating script.");
            break;
        }
    }
}



async function main() {
    let startTime = new Date(); // Get the current time when the script starts
    const delaySeconds = parseFloat(process.env.POST_DELAY_SECONDS || 5);
    const breakTimeMinutes = parseInt(process.env.POST_BREAK_TIME_MINUTES || 60);
    const followCountLimit = parseInt(process.env.POST_FOLLOW_COUNT || 10);
    // const pageLimit = parseInt(process.env.PAGE_LIMIT || 5);


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
        const keywords = (process.env.POSTS_FOLLOW_KEYWORDS || '').split(',');
        for (const keyword of keywords) {
            console.log("298888888888888888", keyword)
            if (breakTimeMinutes < timeElapsed.toFixed(2)) {
                console.info(`Taking a break for ${delaySeconds} seconds.`);
                await waitForNextRun(delaySeconds);
                startTime = new Date();
            }
            await followPostsWhileScrolling(page, keyword.trim(), followCountLimit, breakTimeMinutes, delaySeconds, startTime)
            console.log("3188888888888888888")
            await randomDelay(30000, 50000);
        }
    }
}

main().catch(console.error);