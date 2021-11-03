const puppeteer = require("puppeteer");
// property name
// property type (e.g Apartment)
// number of bedrooms
// bathrooms
// list of the amenities

function run_page(pageToScrape) {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(pageToScrape);

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

      await browser.close();
      return resolve({ ...baseProp, amenities });
    } catch (e) {
      return reject(e);
    }
  });
}
run_page("https://www.airbnb.co.uk/rooms/20669368")
  .then(console.log)
  .catch(console.error);