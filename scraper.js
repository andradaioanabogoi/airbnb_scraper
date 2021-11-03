const puppeteer = require("puppeteer");
const { performance } = require("perf_hooks");

// property name
// property type (e.g Apartment)
// number of bedrooms
// bathrooms
// list of the amenities

const pagesToScrape = [
  "https://www.airbnb.co.uk/rooms/33571268",
  "https://www.airbnb.co.uk/rooms/20669368",
  "https://www.airbnb.co.uk/rooms/50633275",
];

async function scrape_page(page, pageUrl) {
  try {
    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });
    let baseProp = await page.evaluate(() => {
      const numberRegexp = /\d+/;

      let propertyName = document.querySelector("span._1n81at5").innerText;
      let propertyType = document.querySelector("div._1qsawv5").innerText;
      let bedroomsNumber = document
        .querySelector("ol._194e2vt2 li:nth-child(2)")
        .innerText.match(numberRegexp)[0];
      let bathroomsNumber = document
        .querySelector("ol._194e2vt2 li:nth-child(4)")
        .innerText.match(numberRegexp)[0];
      return { propertyName, propertyType, bedroomsNumber, bathroomsNumber };
    });
    await page.click("div.b6xigss > a");
    await page.waitForSelector("div._1b2umrx");
    let amenities = await page.evaluate(() => {
      const result = {};
      Array.from(document.querySelectorAll("div._1b2umrx")).forEach((e) => {
        const children = Array.from(e.childNodes);
        const header = children.shift().innerText;
        const rest = children;

        const textNodes = rest.map((item) => item.innerText);
        result[header] = textNodes;
      });
      return result;
    });

    return { [pageUrl]: { ...baseProp, amenities } };
  } catch (err) {
    throw {[pageUrl]: `Page ${pageUrl} failed to load`};
  }
}

const init = async () => {
  let startTime = performance.now();
  let endTime;
  const browser = await puppeteer.launch({ timeout: 50000 });

  const pagePromises = pagesToScrape.map(async (pageToScrape) => {
    const page = await browser.newPage();
    await page.goto(pageToScrape);
    return scrape_page(page, pageToScrape);
  });

  const result = await Promise.allSettled(pagePromises);
  const toLog = result.map((res) => {
    if (res.status === "fulfilled") return res.value;
    if (res.status === "rejected") return res.reason;
  });

  await browser.close();
  console.log(JSON.stringify(toLog));
  endTime = performance.now();
  console.log(`Scrape the given AirBnb pages took ${endTime - startTime} milliseconds`);
};

init();
