const {createServer, STATUS_CODES} = require("node:http");
const fs= require('fs');
const path = require('path');

const LECTURES = ["intro", 0,1,2,3,4,5,6,7,8,9,10, "cybersecurity"];
const TITLES = [
    "Introduction",
    "Week 0 - Scratch, Incomplete",
    "Week 1 - C",
    "Week 2 - Arrays",
    "Week 3 - Algorithms",
    "Week 4 - Memory",
    "Week 5 - Data Structures",
    "Week 6 - Python",
    "Week 7 - SQL",
    "Week 8 - HTML, CSS, JavaScript",
    "Week 9 - Flask",
    "Week 10 - Emoji",
    "Cybersecurity",
]

const generateUrl =  (x) => "https://cdn.cs50.net/2022/fall/lectures/"+x+"/";
const subtUrl= x => "hls/en/subtitles/en/en.vtt"
const lecture = (lec) => generateUrl(lec) + (typeof lec === 'number' ? 'lecture' : '') + lec + '-1080p.mp4';
const cache = {}
const CSS =` 
    * {
        margin:0;
        padding:0;
        box-sizing:border-box;
    }
    main {
        max-height: 100%;
        padding: 2vw;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    video { 
        max-width: 80%;
    }

    header > div {
        display: flex;
        gap: 10vw;
    }

    body {
        background: #18181b;
    }

    ul {
        display: flex;
        flex-direction: column;
        margin-right: auto;
        justify-content: left;
    }

    li {
        display: flex;
        text-align: left;
        gap: 1rem;
        border: 1px #ffffff;
        margin-left: 0;
        margin-right: 0;
        padding-top: 1.5rem;
        font-size: 1rem;
        color: #fff;
    }

    a {
        display: flex;
        color: inherit;
    }
    a[disabled="true"] {
        opacity: 0.3;
        cursor: not-allowed;
    }

    header {
          z-index: 999;
          width: 100%;
          color: #FFFFFF;
          background-color: #000000;
          border-bottom: 2px solid #FFFFFF;
          transition: flex .2s;
          position: -webkit-sticky;
          flex-wrap: wrap;
          position: sticky;
          justify-content: space-between;
          align-items: center;
          padding: 2vw;
          display: flex;
          top: -1px;
    }

`


const s = createServer(async (req, res) => {
    if(!cache['metadata']) {
        try {
            console.log('making request');
            response = await (await fetch("https://courses.edx.org/api/course_home/course_metadata/course-v1:HarvardX+CS50+X?browser_timezone=America%2FSao_Paulo")).json();
            cache['metadata'] = response;
        } catch(err) {}
    }

    if(req.url.includes("vtt")) {
        const param = isNaN(Number(req.url.slice(1))) ? req.url.slice(1) : Number(req.url.slice(1))
        fs.readFile("./public/lectures/" + param, {encoding: 'utf-8'}, function(err,data){
            if (!err) {
                res.writeHead(200, {'Content-Type': 'text/plain','Cache-Control': 's-max-age=1, stale-while-revalidate'});
                res.end(data);
            } else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                return res.end(STATUS_CODES[404]);
            }
        })
    } else if(req.url.startsWith("/") && req.url !== "/") {
        const param = isNaN(Number(req.url.slice(1))) ? req.url.slice(1) : Number(req.url.slice(1))
        const current = LECTURES.indexOf(param);
        const [next,prev] = [(LECTURES.indexOf(param) < LECTURES.length-1) ? LECTURES.indexOf(param)+1 : LECTURES.length-1, LECTURES.indexOf(param) > 0 ? LECTURES.indexOf(param)-1 : 0];
        const n = LECTURES[next];
        const p = LECTURES[prev];

        if(!LECTURES.includes(param)) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            return res.end(STATUS_CODES[404]);
        }

        res.writeHead(200, {'Content-Type': 'text/html','Cache-Control': 's-max-age=1, stale-while-revalidate'});
        const url = lecture(param);
        return res.end(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">
                    <style>${CSS}</style>
                </head>
            <body>
                <header>
                    <a href="/"><</a>

                    <div>
                        <a disabled="${current <= 0}" href="${current <= 0 ? '#' : p}">Prev (${TITLES[prev]})<a/>
                        <a disabled="${current >= LECTURES.length-1}" href="${current >= LECTURES.length-1 ? '#' :n}">Next (${TITLES[next]})<a/>
                    </div>
                </header>
                <main>
                    <video id="video" controls preload="metadata">
                          <source src="${url}" type="video/mp4">
                          </source>
                          <track
                                label="English"
                                kind="subtitles"
                                srclang="en"
                                src="${param}.vtt"
                                default>
                            </track>
                          <track
                                label="Portuguese"
                                kind="subtitles"
                                srclang="pt-BR"
                                src="pt-${param}.vtt"
                                default>
                            </track>
                    </video>
                </main>
            </body>
            `);
    } else if(req.url === "/") {
        const metadata = cache['metadata'];
        res.writeHead(200, {'Content-Type': 'text/html','Cache-Control': 's-max-age=1, stale-while-revalidate'});
        const htmlLink = (lec) => `<li>${TITLES[LECTURES.indexOf(lec)]} <a href="${lec}">  Assistir</a></li>`
        return res.end(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">
                        <style>${CSS}</style>
                    </head>
                <body>
                    <header>
                        <div>
                            <strong>${metadata?.title ?? "CS50"}</strong>
                        </div>
                    </header>
                    <main>
                        <ul>
                            ${LECTURES.map(htmlLink).join('\n')}
                        </ul>
                    </main>
                </body>
            `);
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end(STATUS_CODES[404]);
    }
});

s.listen(process.env.PORT || 5555, () => {
    console.log("HTTP SERVER running");
});
