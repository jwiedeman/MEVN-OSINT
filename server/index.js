const express = require('express');
const app = express();
const cors = require('cors');
const URL = require('url');
const puppeteer = require('puppeteer');
const GOOGLEANALYTICS = 'googleAnalytics';
const FACEBOOK = 'facebook';
const BING = 'bing'
const GOOGLEADS = 'googleAds';
const sitePage = [];
const site = [];
const PORT = 3000; // Set a constant port
let fs = require("fs");
let sitemaps = require('sitemap-stream-parser');
let reportJson = {};
let promiseArr = [];
let currentTarget = '';
let urls = ['http://whostracking.me/sitemap.xml'];
process.setMaxListeners(Infinity); // y e e t
// this prevents puppeteer from self lobotomizing during scraping


// Configure CORS
app.use(cors({
    origin: 'http://localhost:8080'
}));

// Set our route
app.get('/message', (req, res) => {
    // Pull message from query string in request
    let message = req.query.message;


    // validate input
    if (validURL(message) == true) {

        // Reverse it
        let reversedMessage = message
        // if func true, gen sitemap from input
        console.log(message+'/sitemap.xml')
        generateSitemaps(message+'/sitemap.xml')

            // Send it back
            res.send(reportJson);
            Promise.all(promiseArr).then(() => {
                console.log('### Test Complete');
              
            });
    } else {
        // Reverse it
        let reversedMessage = 'Invalid URL, needs to be in http://www.yoursite.com format'
            // Send it back
            res.send(reversedMessage);
    }
    

});

// Spin up our server
app.listen(PORT, () => console.log(`Listening on port ${PORT}.`));



function generateSitemaps(inputURL){
    urls.push(inputURL)
    sitemaps.parseSitemaps(urls, function (url) {
        sitePage.push(url);
    }, function (err, sitemaps) {
        sitePage.forEach(element => {
            console.log('       # Sitemapper found - ', element)
        });
        console.log('Sitemapper process complete ---------')
        onSitemapComplete() // calling the crawl after this to be sure the sitemap is generated before we  c r a w l 
        sitePage.forEach(page => { // ! Probably slow this down so there is only 10 pages being requested / crawled at once
            reportJson[page] = {}; // make anon instance of object for parent site
            promiseArr.push(checkPage(page)); // get site && push to arr
            console.log('       Testing  ', currentTarget);
        });
        Promise.all(promiseArr).then(() => {
            console.log('Testing Complete');
          
        });
    });
}






const checkPage = async PAGE => {
    currentTarget = PAGE // kinda backwards way of making PAGE acessible 
    const _page = { // instance obj
        'googleAnalytics': {},
        'facebook': {},
        'bing': {},
        'googleAds': {}
    };


    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();

    page.on('request', request => { // on request
        const url = request._url; // catch all requests 


        // google analytics
        if (url.indexOf('google-analytics.com') > -1) { // if analytics detected
            const parsedUrl = URL.parse(url, true); // if the url == the url.indexof true
            if (typeof parsedUrl.query.tid != 'undefined' && typeof parsedUrl.query.t != 'undefined') {
                //console.log(`## GOOGLE ANALYTICS: ${parsedUrl.query.tid} - ${parsedUrl.query.t.toUpperCase()}`);
                //storeData(GOOGLEANALYTICS, { id: parsedUrl.query.tid, hitType: parsedUrl.query.t ,payload:parsedUrl});
                storeData(GOOGLEANALYTICS, {
                    'id': parsedUrl.query.tid,
                    'hitType': parsedUrl.query.t,
                    'payload': parsedUrl
                })
            }

            // facebook pixel 
        } else if (url.indexOf('facebook.com/tr/') > -1) {
            const parsedUrl = URL.parse(url, true);
            if (typeof parsedUrl.query.id != 'undefined' && typeof parsedUrl.query.id != 'undefined') {
                //console.log(`## FACEBOOK PIXEL: ${PAGE} - ${parsedUrl.query.ev.toUpperCase()}`);
                //storeData(FACEBOOK, { id: parsedUrl.query.id, hitType: parsedUrl.query.ev ,payload:parsedUrl});
                storeData(FACEBOOK, {
                    'id': parsedUrl.query.id,
                    'hitType': parsedUrl.query.ev,
                    'payload': parsedUrl
                })
            }

            // google ads
        } else if (url.indexOf('googleads.g.doubleclick.net') > -1) {
            let parsedUrl = URL.parse(url, true);
            let conversionId = parsedUrl.pathname.split('/')[3];
            // Check if the URL contained query string values for the conversion ID
            //console.dir(`## GOOGLE ADS : ${PAGE} - ${conversionId}`);
            //storeData(GOOGLEADS, { id: conversionId ,payload:parsedUrl});
            storeData(GOOGLEADS, {
                'id': 'conversionId',
                'hitType': 'Base Code Load',
                'payload': parsedUrl
            })

            // microsoft ads
        } else if (url.indexOf('bat.bing.com/action') > -1) {
            const parsedUrl = URL.parse(url, true);
            if (parsedUrl.protocol == 'https:' && typeof parsedUrl.query.ti != 'undefined' && typeof parsedUrl.query.evt != 'undefined') {
                //console.dir(`## BING UET: ${PAGE} - ${parsedUrl.query.evt}`);
                //storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt,payload:parsedUrl });
                storeData(BING, {
                    'id': parsedUrl.query.ti,
                    'hitType': parsedUrl.query.evt,
                    'payload': parsedUrl
                })
            }
        }

    });


    await page.goto(PAGE); // get the PAGE
    await browser.close();

    reportJson[PAGE] = _page; //assign reportjson for this crawl instance to the info setup on function load
    //i.e reportJson.PAGE now contains the empty platforms from tracking information, which will be filled as the page is crawled
    //EX: storeData(BING, { id: parsedUrl.query.ti, hitType: parsedUrl.query.evt });



    // reportjson > site > page > platforms > id's > payload
    // obj > arr > obj  > obj > obj > obj




    function storeData(platform, dataObj) {
        let {
            id,
            hitType,
            payload
        } = dataObj; // assign references to the data parameter

        if (typeof id != undefined && typeof hitType != undefined) { // check if incoming data exists, proceed if true
            let data = _page[platform]
            data[id] = (typeof id != undefined) ? {
                'id': id,
                'hitType': hitType,
                'payload': payload
            } : {}
            data[id][hitType] = (typeof hitType != undefined) ? hitType : {}
            data[id][hitType][payload] = (payload != undefined) ? payload : {}

        }
    }


    /** Deprecieated code, TODO Delete
	function storeData(platform, dataObj) { //intake as params
		let { id, hitType ,payload} = dataObj; // set structure for incoming 2 param object, now acessible as normal id, hittype
		let info = trackingInformation[platform];
		if (typeof id != 'undefined' && typeof hitType != 'undefined') { // if ID and hittype are not undefined
			info[id] = (typeof info[id] != 'undefined') // if ID = true
				? id //assign info ID 
				: {};
				
			info[id][hitType] = (typeof info[id][hitType] != 'undefined') // if ID and hittype are true
				? info[id][hitType] + 1 
                : 1; 
           
			info[id]['payload'] = (typeof payload != 'undefined') // if ID = true
				? payload //assign info ID 
				: {};
		} 
	}*/
};




// generate the sitemap


// go through arr of sites and run checksites against each
// !! Holy fuck add a load balancer, this will just KO your client if theres more than 50 pages on a site
function onSitemapComplete() {

}



function found() {
    sitePage.forEach(page => {
       
    });
}



// UTILITY FUNCTIONS 

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}





















/**
 * // Set our route
app.get('/message', (req, res) => {
    // Pull message from query string in request
    let message = req.query.message;

    // Reverse it
    let reversedMessage = message.split('').reverse().join('');

    // Send it back
    res.send(reversedMessage);
});
 */