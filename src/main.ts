import express from "express";
import TTSServer from "./TTSServer";
import { VOICES, type Voice } from "./config";

const PORT = process.env["PORT"] ?? 8080

const ttsServer = new TTSServer("production", true)
const app = express();

app.use(express.json());

async function start() {
    await ttsServer.launch();

    console.log("Creating clients..")
    await ttsServer.createClients(2, false)
    await appRun();

    console.log("Listening to port:" + PORT);
}

function appRun() {
    return new Promise<void>((resolve) => {
        app.listen(PORT, resolve);
    });
}

app.get("/tts/:voice", async (request, response) => {
    const voice = request.params.voice as Voice
    const text = (request.query || {})["text"];

    if (!text) {
        response.writeHead(400, "No text provided");
        response.end();

        return;
    }

    if (typeof text !== "string") {
        response.writeHead(400, "searchParam `text` is not encoded correctly");
        response.end();

        return;
    }

    if (!VOICES.includes(voice)) {
        response.writeHead(400, "The voice is not found in the library");
        response.end();

        return;
    }

    try {
        const payload = await ttsServer.say(text, voice);

        response.setHeader("Content-Type", "audio/mpeg");
        response.setHeader("Content-Disposition", "attachment; filename=result.mp3");
        response.setHeader("X-Marks", JSON.stringify(payload.marks));

        response.end(payload.buffer);
    } catch (e) {
        console.error(e)
        response.send(500).send("Something went wrong");
    }
});

app.get("/create", async (_, response) => {
    try {
        await ttsServer.createClient()
        response.status(200).send("The model is loaded.");
    } catch (e) {
        console.error("ERROR", e)
        response.status(500).send("Something went wrong.");
    }
});

app.get("/ping", (_, response) => {
    response.send("Pong!")
})


start();