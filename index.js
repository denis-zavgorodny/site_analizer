#!/usr/bin/env node
const puppeteer = require('puppeteer');
const homedir = require('os').homedir();

var log4js = require('log4js');
log4js.configure(
    {
        appenders: {
            dateFile: {
                type: 'dateFile',
                layout: {
                    type: 'pattern',
                    pattern: '%d [%p] [PID %z]: %m ',
                },
                filename: `${homedir}/site_metrics.log`,
                compress: true
            },
            out: {
                type: 'stdout'
            }
        },
        categories: {
            default: { appenders: ['dateFile'], level: 'all' }
        }
    }
);
var logger = log4js.getLogger('dateFile');



logger.info(`start process`);


const argParams = {
    mobile: false,
    debug: false
};
process.argv.forEach(function (val, index) {
    if (index > 1) {
        const param = val.split("=");
        if (param.length > 1) {
            switch (param[0]) {
                case 'mobile':
                case 'debug':
                    param[1] = Boolean(param[1]);
                    break;
                default:
                    param[1] = String(param[1]);
                    break;
            }
            argParams[param[0]] = param[1];
        }
    }
});

(async (argParams, logger) => {
    const { url, mobile, debug } = argParams;
    if (!url) {
        logger.error('URL no specified');
        return;
    }

    const vewport = {
        width: 1280,
        height: 700
    };


    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        timeout: 10000 // timeout to wait the browser instanse start
    });
    logger.info(`puppeteer was starting`);
    const page = await browser.newPage();
    logger.info(`chrome was starting`);
    if (mobile === true) {
        vewport.width = 320;
        vewport.height = 568;
        vewport.isMobile = true;
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3');
    }

    await page.setViewport(vewport);
    var response;
    try {
        page.setDefaultNavigationTimeout(10000);
        logger.info(`chrome trying to get the page`);
        response = await page.goto(url);
        if (debug === true) {
            await page.screenshot({ path: 'example.png' });
        }
        logger.info(`chrome got the page successfully`);

        const responseStatus = response.status();
        // const globalMetrics = await page._client.send('Performance.getMetrics');

        logger.info(`puppeteer trying to evaluate JS code`);
        const timing = await page.evaluate(() => {
            const result = {};
            for (const key of Object.keys(window.performance.timing.__proto__)) {
                result[key] = window.performance.timing[key];
            }
            return result;
        });
        logger.info(`puppeteer evaluated JS code successfully`);

        const prepareTime = Math.abs(timing.fetchStart - timing.domainLookupStart);
        const domainLookup = Math.abs(timing.domainLookupStart - timing.domainLookupEnd);
        const connectionTime = Math.abs(timing.connectStart - timing.connectEnd);
        const connectionTimeBySecure = timing.secureConnectionStart ? Math.abs(timing.secureConnectionStart - timing.connectEnd) : 0;
        const TTFB = Math.abs(timing.requestStart - timing.responseStart);
        const downloadTime = Math.abs(timing.responseStart - timing.responseEnd);
        const prepareDOM = Math.abs(timing.domLoading - timing.domInteractive);
        const evaluateInlineJS = Math.abs(timing.domInteractive - timing.domContentLoadedEventEnd);
        const DOMContentLoaded = Math.abs(timing.domainLookupStart - timing.domContentLoadedEventEnd);
        const pageComplete = timing.domComplete ? Math.abs(timing.domainLookupStart - timing.domComplete) : 0;

        const res = {
            responseStatus,
            prepareTime,
            domainLookup,
            connectionTime,
            connectionTimeBySecure,
            TTFB,
            downloadTime,
            prepareDOM,
            evaluateInlineJS,
            DOMContentLoaded,
            pageComplete
        };

        console.log(JSON.stringify(res));

        await browser.close();
        logger.info(`puppeteer closed browser and stoped`);
    } catch (error) {
        console.log(error.toString());
        await logger.error(error.toString());
        browser.close();
    }


})(argParams, logger);
