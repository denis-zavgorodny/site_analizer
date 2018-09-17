#!/usr/bin/env node
const sleep = require('./sleep');
const puppeteer = require('puppeteer');

const argParams = {};
process.argv.forEach(function (val, index) {
    if (index > 1) {
        const param = val.split("=");
        if (param.length > 1) {
            argParams[param[0]] = param[1];
        }
    }
});

(async (url) => {
    if (!url) {
        process.exit(1);
    }
    const browser = await puppeteer.launch({
        timeout: 30000
    });
    const page = await browser.newPage();
    page.setViewport({
        width: 1280,
        height: 700
    });
    var response;
    try {
        page.setDefaultNavigationTimeout(20000);
        response = await page.goto(url);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
    const responseStatus = response.status();
    // const globalMetrics = await page._client.send('Performance.getMetrics');

    const timing = await page.evaluate(() => {
        const result = {};
        for (const key of Object.keys(window.performance.timing.__proto__)) {
            result[key] = window.performance.timing[key];
        }
        return result;
    });

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
})(argParams.url);
