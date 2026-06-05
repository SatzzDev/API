import { Router } from 'express';
import path from 'path';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fakeUa from "fake-useragent";
import QRCode from 'qrcode';
import yts from 'yt-search';

//━━━━━━━━━━[ ROUTER ]━━━━━━━━━━━━
const router = new Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//━━━━━━━━━━[ IMPORT SCRAPER ]━━━━━━━━━━
import SoundCloud from './scraper/soundcloud.js';
import { spotifySearch, spotifydl } from './scraper/spotify.js';
import { ssweb } from './scraper/ssweb.js';
import { removebg } from './scraper/removebg.js';
import { dayoff } from './scraper/dayoff.js';
import { enhancedImageAPI } from './scraper/enhance.js'
import { ai } from './scraper/ai.js';
import { SpotifyWeeklyChart } from './scraper/trendingsongs.js';
import { soundc } from './scraper/soundcloud.js'
import { ytdl } from './scraper/ytdl.js';
import { xDownloader } from './scraper/x.js';
import { igDownloader } from './scraper/instagram.js';
import { fbDownloader } from './scraper/fb.js';
import { threadsDownloader } from './scraper/threads.js';
import { lyrics, sugest } from './scraper/lyrics.js';
import { dyDownloader } from './scraper/douyin.js';


//━━━━━━━━━━[ UTILITY FUNCTIONS ]━━━━━━━━━━━━//
const cache = {}; // Simple in-memory cache
const requestCounts = {}; // Track requests per IP

const logRequest = (req) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} from ${req.ip}`);
};

const limitRequests = (req, maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const ip = req.ip;
  const now = Date.now();
  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, start: now };
    return true;
  }
  if (now - requestCounts[ip].start > windowMs) {
    requestCounts[ip] = { count: 1, start: now };
    return true;
  }
  if (requestCounts[ip].count >= maxRequests) {
    return false;
  }
  requestCounts[ip].count++;
  return true;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>"'&]/g, '').trim();
};

const cacheResponse = async (url, ttl, fetchFn) => {
  const now = Date.now();
  if (cache[url] && cache[url].expires > now) {
    return cache[url].data;
  }
  const data = await fetchFn(url);
  cache[url] = { data, expires: now + ttl };
  return data;
};

const randomizeArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

//━━━━━━━━━━[ EXISTING FUNCTIONS ]━━━━━━━━━━━━//
const fetchJson = async (url) => {
  if (!validateUrl(url)) throw new Error('Invalid URL');
  return cacheResponse(url, 60000, async (u) => {
    const res = await axios({
      method: "GET",
      url: u,
      headers: { "User-Agent": fakeUa() }
    });
    return res.data;
  });
};

const getBuffer = async (url) => {
  if (!validateUrl(url)) throw new Error('Invalid URL');
  return cacheResponse(url, 60000, async (u) => {
    const res = await axios({
      method: "get",
      url: u,
      headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
      responseType: 'arraybuffer'
    });
    return res.data;
  });
};

//━━━━━━━━━━[ FUN & RANDOM ]━━━━━━━━━━━━//
router.get("/miya", async (req, res) => {
  logRequest(req);
  const img = [
    "https://files.catbox.moe/2h6ldj.jpg",
    "https://files.catbox.moe/yyd7g8.jpg",
    "https://files.catbox.moe/dp93zm.jpg",
    "https://files.catbox.moe/y85ffu.jpg",
    "https://files.catbox.moe/bgbg25.jpg",
    "https://files.catbox.moe/cl2fa8.jpg",
    "https://files.catbox.moe/keqg4y.jpg",
    "https://files.catbox.moe/qqi45m.jpg",
    "https://files.catbox.moe/acrxij.jpg",
    "https://files.catbox.moe/de5jxl.jpg",
    "https://files.catbox.moe/ooyaax.jpg",
    "https://files.catbox.moe/918gue.jpg",
  ];
  const randomImgUrl = randomizeArray(img);
  try {
    const buffer = await getBuffer(randomImgUrl);
    res.set({
      "Content-Type": "image/jpeg",
      "Content-Length": buffer.length
    });
    res.send(buffer);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Failed to load image.");
  }
});

router.get('/funfact', async (req, res) => {
  logRequest(req);
  try {
    let funfacts = await fetchJson('https://raw.githubusercontent.com/SatzzDev/database/refs/heads/master/data/funfact.json');
    res.json({
      status:true,
      developer: 'https://t.me/krniwnstria/',
      data: randomizeArray(funfacts)
    });
  } catch (error) {
    console.error('Error fetching funfact:', error);
    res.status(500).send('Failed to load funfact.');
  }
});

router.get('/rizz', async (req, res) => {
  logRequest(req);
  try {
    let rizz = await fetchJson('https://raw.githubusercontent.com/SatzzDev/database/refs/heads/master/data/rizz.json');
    res.json({
      status:true,
      developer: 'https://t.me/krniwnstria/',
      data: randomizeArray(rizz)
    });
  } catch (error) {
    console.error('Error fetching rizz:', error);
    res.status(500).send('Failed to load rizz.');
  }
});

//━━━━━━━━━━[ QUOTES & JOKES ]━━━━━━━━━━━━//
router.get('/quote', async (req, res) => {
  logRequest(req);
  try {
    const response = await fetchJson('https://api.quotable.io/random');
    res.json({
      status:true,
      developer: 'https://t.me/krniwnstria/',
      data: {
        quote: response.content,
        author: response.author
      }
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).send('Failed to load quote.');
  }
});

router.get('/joke', async (req, res) => {
  logRequest(req);
  try {
    const response = await fetchJson('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
    let jokeData;
    if (response.type === 'single') {
      jokeData = { joke: response.joke };
    } else {
      jokeData = {
        setup: response.setup,
        delivery: response.delivery
      };
    }
    res.json({
      status:true,
      developer: 'https://t.me/krniwnstria/',
      data: jokeData
    });
  } catch (error) {
    console.error('Error fetching joke:', error);
    res.status(500).send('Failed to load joke.');
  }
});

router.get("/animequote", async(req, res) => {
  let r = await fetchJson('https://katanime.vercel.app/api/getrandom')
  let ress = {status:true,developer: 'https://t.me/krniwnstria/'}
  ress.data = r.result
  res.status(200).json(ress)
})

//━━━━━━━━━━[ MEDIA: IMAGE, MEME, ANIME ]━━━━━━━━━━━━//
router.get('/meme', async (req, res) => {
  logRequest(req);
  if (!limitRequests(req)) {
    return res.status(429).send('Too many requests, please try again later.');
  }
  try {
    const response = await fetchJson('https://meme-api.com/gimme');
    const imageUrl = response.url;
    const buffer = await getBuffer(imageUrl);
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching meme:', error);
    res.status(500).send('Failed to load meme.');
  }
});

router.get('/anime', async (req, res) => {
  logRequest(req);
  if (!limitRequests(req)) {
    return res.status(429).send('Too many requests, please try again later.');
  }
  try {
    const buffer = await getBuffer('https://pic.re/image');
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching anime image:', error);
    res.status(500).send('Failed to load anime image.');
  }
});


router.post('/collect', async (req, res) => {
  try {
    const response = await axios.post('http://de25.spaceify.eu:26000/collect', JSON.stringify(req.body), {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    res.status(response.status).json(response.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

//━━━━━━━━━━[ MUSIC: YOUTUBE, SPOTIFY, SOUNDCLOUD, LYRICS ]━━━━━━━━━━━━//
router.get("/douyindl", async(req, res) => {
  var { url } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter url.'})
  let r = await dyDownloader(url)
  res.json(r)
})

router.get("/igdl", async(req, res) => {
  var { url } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter url.'})
  let r = await igDownloader(url)
  res.json(r)
})

router.get("/xdl", async(req, res) => {
  var { url } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter url.'})
  let r = await xDownloader(url)
  res.json(r)
})
router.get("/threadsdl", async(req, res) => {
  var { url } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter url.'})
  let r = await threadsDownloader(url)
  res.json(r)
})

router.get("/fbdl", async(req, res) => {
  var { url } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter url.'})
  let r = await fbDownloader(url)
  res.json(r)
})

router.get("/soundcloud", async(req, res) => {
  var { q } = req.query;
  if (!q) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter q.'})
  let r = await SoundCloud.search(q)
  res.json(r)
})

router.get("/spotify", async(req, res) => {
  var { q } = req.query;
  if (!q) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'missing parameter q.'})
  let r = await spotifySearch(q)
  res.json(r)
})

router.get("/soundclouddl", async (req, res) => {
  let { url } = req.query;
  if (!url)
    return res.status(400).json({status: false, developer: 'https://t.me/krniwnstria/', message: "[ ! ] mising query parameter url!"});
  let result = null
  try {
    result = await soundc(url)
  } catch (e) {
    result = await SoundCloud.download(url);
  }
  res.status(200).json(result)
});

router.get('/ytsearch', async (req, res) => {
  let { q } = req.query;
  if (!q) return res.status(400).json({status: false, developer: 'https://t.me/krniwnstria/', message: "[ ! ] mising query parameter q!"});
  let s = await yts(q)
  let r = s.all
  res.status(200).json({status:200, developer: 'https://t.me/krniwnstria/', result: r.filter(v => v.type === 'video')})
})

router.get('/ytsearch-v2', async (req, res) => {
  let { title, artist } = req.query;
  if (!title) return res.status(400).json({
    status: false,
    developer: 'https://t.me/krniwnstria/',
    message: '[ ! ] Missing query parameter title!'
  });
  if (!artist) return res.status(400).json({
    status: false,
    developer: 'https://t.me/krniwnstria/',
    message: '[ ! ] Missing query parameter artist!'
  });
  try {
    const { all } = await yts(title);
    const videos = all.filter(v => v.type === 'video');
    if (videos.length === 0) {
      return res.status(404).json({
        status: false,
        developer: 'https://t.me/krniwnstria/',
        message: '[ ! ] No videos found for the given title.'
      });
    }
    const prioritized = videos.filter(v => v.author?.name.toLowerCase() === artist.toLowerCase());
    const results = prioritized.length > 0 ? prioritized : videos;
    res.status(200).json({
      status: true,
      developer: 'https://t.me/krniwnstria/',
      results: results.map(v => ({
        title: v.title,
        url: v.url,
        artist: v.author?.name || 'Unknown',
        thumbnail: v.thumbnail || ''
      }))
    });
  } catch (error) {
    console.error('Error in ytsearch-v2:', error);
    res.status(500).json({
      status: false,
      developer: 'https://t.me/krniwnstria/',
      message: 'Failed to search YouTube.'
    });
  }
});

router.get("/ytmp3", async (req, res) => {
  let { url } = req.query;
  if (!url) return res.status(400).json({status: false, developer: 'https://t.me/krniwnstria/', message: "[ ! ] mising query parameter url!"});
  let result = await ytdl(url, 1, 'audio', '320')
  res.status(200).json(result)
});

router.get("/ytmp4", async (req, res) => {
  let { url, resolution } = req.query;
  if (!url) return res.status(400).json({status: false, developer: 'https://t.me/krniwnstria/', message: "[ ! ] mising query parameter url!"});
  let result = await ytdl(url, 1, 'video', resolution ? resolution : '720')
  res.status(200).json(result)
});

router.get("/spotifydl", async(req, res) => {
  try {
    var { url } = req.query;
    if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: '[ ! ] missing parameter url.'})
    let r = await spotifydl(url)
    res.status(200).json(r)
  } catch {
    res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: 'error:('})
  }
})

router.get("/spotplay", async(req, res) => {
  var { query } = req.query;
  if (!query) return res.status(400).json({ status : false, creator : 'https://t.me/krniwnstria/', message: '[ ! ] missing parameter query.'})
  let r = await spotifySearch(query)
  let oi = await spotifydl(r.results[0].url)
  if (oi.url ==='https://api.fabdl.comundefined') return res.status(400).json({ status : false, creator : 'https://t.me/krniwnstria/', message: 'error'})
  let oii = await getBuffer(oi.url)
  res.set({
    "Content-Type": "audio/mp3",
    "Content-Length": oii.length,
    "Cache-Control": "public, max-age=31536000",
    "Accept-Ranges": "bytes", 
  });
  res.end(oii) 
})

router.get("/lyrics", async(req, res) => {
  let {url, q} = req.query
  if (url && !q) {
    let r = await lyrics(url)
    res.status(200).json(r)
  } else if (q && !url) {
    let {songs} = await sugest(q)
    if (!songs || songs.length === 0) return res.status(404).json({ status: false, developer: 'https://t.me/krniwnstria/', message: '[ ! ] No songs found for the given query.' });
    let r = await lyrics(songs[0].url)
    res.status(200).json(r)
  } else return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: '[ ! ] invalid parameters.'})
})

router.get("/SpotifyWeeklyChart", async(req, res) => {
  let {country} = req.query;
  if (!country) return res.status(400).json({
    status: false,
    developer: 'https://t.me/krniwnstria/',
    message: '[ ! ] missing parameter country. example country=id',
    note: 'country=global for global.'
  })
  let r = await SpotifyWeeklyChart(country)
  res.status(200).json(r)
})

//━━━━━━━━━━[ TOOLS: SCREENSHOT, QR, REMOVE BG, ENHANCE ]━━━━━━━━━━━━//
router.get("/ssweb", async(req, res) => {
  var { url, type } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: '[ ! ] missing parameter url.'})
  if (!type) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: '[ ! ] missing parameter type. type list: desktop, tablet, phone.'})
  let {result} = await ssweb(url, type)
  res.set({
    "Content-Type": "image/png",
    "Content-Length": result.length,
  });
  res.end(result) 
})

router.get("/qrcode", async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({
    status: false,
    developer: 'https://t.me/krniwnstria/',
    message: '[ ! ] missing parameter q.'
  })
  try {
    const dataUrl = await QRCode.toDataURL(q)
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
    const imgBuffer = Buffer.from(base64Data, 'base64')
    res.set({
      "Content-Type": "image/png",
      "Content-Length": imgBuffer.length,
    })
    res.end(imgBuffer)
  } catch (e) {
    res.status(500).json({ status: false, message: 'internal error', error: e.message })
  }
})

router.get("/removebg", async(req, res) => {
  var { url } = req.query;
  if (!url) return res.status(400).json({ status : false, developer: 'https://t.me/krniwnstria/', message: '[ ! ] missing parameter url.'})
  let link = await removebg(url)
  res.set({
    "Content-Type": "image/png",
    "Content-Length": link.length,
  });
  res.end(link) 
})

router.get("/enhance", async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({
    status: false,
    developer: 'https://t.me/krniwnstria/',
    message: '[ ! ] missing parameter url.'
  })
  try {
    const imgRes = await axios.get(url, { responseType: "arraybuffer" })
    const buffer = imgRes.data
    let enhancedBuffer = await enhancedImageAPI(buffer)
    res.set({
      "Content-Type": "image/png",
      "Content-Length": enhancedBuffer.length
    })
    res.end(enhancedBuffer)
  } catch (err) {
    res.status(500).json({
      status: false,
      developer: 'https://t.me/krniwnstria/',
      message: err.message
    })
  }
})

//━━━━━━━━━━[ AI ]━━━━━━━━━━━━//
router.get("/ai/:model", async (req, res) => {
  let { q } = req.query
  let { model } = req.params
  if (!q) return res.status(400).json({
    status: false,
    developer: 'https://t.me/krniwnstria/',
    message: '[ ! ] missing parameter q.'
  })
  try {
    let result = await ai(q, model) // asumsi fungsi ai bisa terima model
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({
      status: false,
      message: 'internal server error',
      error: e.message
    })
  }
})

//━━━━━━━━━━[ UTILITY / OTHER ]━━━━━━━━━━━━//
router.get("/dayoff", async(req, res) => {
  let r = await dayoff(new Date().getFullYear())
  res.status(200).json(r)
})

export default router
