import express from "express";
import morgan from "morgan";
import cors from "cors";
import si from "systeminformation";
import path from "path";
import { HttpsProxyAgent } from 'https-proxy-agent'
import os from "os";
import pidusage from "pidusage";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import apiRoutes from "./routes/api.js";

const app = express();

//━━━━━━━━━━━━━━━[ App Configuration ]━━━━━━━━━━━━━━━━━//
app.set("port", process.env.PORT || 80);


//━━━━━━━━━━━━━━━[ Middleware ]━━━━━━━━━━━━━━━━━//
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "views/assets")));
app.set("view engine", "ejs");
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Morgan logging cuma untuk '/api'
app.use((req, res, next) => {
if (req.originalUrl.startsWith("/v1")) {
morgan("dev")(req, res, next);
} else {
next();
}
});


//━━━━━━━━━━━━━━━[ Routes ]━━━━━━━━━━━━━━━━━//

function clockString(seconds) {
const h = Math.floor(seconds / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = Math.floor(seconds % 60);
return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

app.use("/v1", apiRoutes);

app.get("/uptime", (req, res) => {
res.json({ uptime: clockString(process.uptime()) });
});



app.get("/system", async (req, res) => {
try {
const cpu = await pidusage(process.pid)
const totalMem = os.totalmem()
const freeMem = os.freemem()
const memPercent = ((1 - freeMem / totalMem) * 100).toFixed(0)

const fs = await si.fsSize()
const diskUsed = ((fs[0].used / fs[0].size) * 100).toFixed(0)

const heap = process.memoryUsage()
const heapUsed = (heap.heapUsed / 1024 / 1024).toFixed(1)
const heapTotal = (heap.heapTotal / 1024 / 1024).toFixed(1)
const heapPercent = ((heap.heapUsed / heap.heapTotal) * 100).toFixed(0)

res.json({
cpu: cpu.cpu.toFixed(0),
memory: memPercent,
disk: diskUsed,
heap: heapPercent
})
} catch (e) {
res.status(500).json({ error: 'fail' })
}
})


app.get("/", async (req, res) => {
res.json("Hello, World!")
});

//━━━━━━━━━━━━━━━[ 404 Route ]━━━━━━━━━━━━━━━━━//
app.use((req, res, next) => {
res.status(404).render("404");
});

//━━━━━━━━━━━━━━━[ Server Initialization ]━━━━━━━━━━━━━━━━━//

app.listen(app.get("port"), () => {
console.log("Server Running On Port " + app.get("port"));
});
