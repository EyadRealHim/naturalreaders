import type { Page } from "playwright-core";
import type Logger from "./utils/logger";
import type { Voice } from "./config";
import sleep from "./utils/sleep";
import decodeSMarks, { type Mark } from "./utils/decodeSMarks";


// Proxy Constants:
const PROVIDER_URL = "https://www.croxyproxy.com/"
const FORM_QUERY = "#url"
const SUBMIT_FORM = "#requestSubmit"
// Natural Readers Constants:
const NEXT_BUTTON = ".btn-flat-blue"
const PERSONAL_USE_BUTTON = "#switch-pw-card .nr-btn"

const TRIGGER_VOICE_LIST = ".nr-ext-voice-trigger"
const VOICE_LIST_CELL = ".pw-voices-cell"

const READ_BUTTON = "button[pw-play]"
const READ_BUTTON_PAUSED = "button[pw-play][pw-play='pause']"
const READ_BUTTON_PLAYING = "button[pw-play][pw-play='play']"
const INPUT_DIV = "#inputDiv"

export type TTSPayload = {
    marks: Mark[],
    buffer: Buffer
}

export default class TTSClient {
    private callback: ((payload: TTSPayload) => void) | null = null
    private currentVoice: Voice = "Heather"

    #queueLength = 0

    constructor(readonly page: Page, readonly logger: Logger) { }

    // Methods:
    public async launch() {
        this.logger.group("Launching The TTSClient")

        await this.useProxy()
        await this.configureEndpoint()
        await this.initListeners()

        this.logger.log("Debug", "Preloading...")
        await this.setVoice(this.currentVoice, true)
        void await this.say("test")

        this.logger.log("Debug", "TTSClient is launched")
        this.logger.groupEnd()
    }

    public get queueLength() {
        return this.#queueLength
    }

    public async say(text: string, voice: Voice = this.currentVoice) {
        this.#queueLength += 1

        while (this.callback) {
            await sleep(Math.random() * 300)
        }

        const loadPayload = new Promise<TTSPayload>(resolve => {
            this.callback = resolve
        })

        const defer = () => {
            this.#queueLength -= 1
            this.callback = null
        }

        let payload: TTSPayload

        try {
            await this.setVoice(voice)
            await this.page.$eval(INPUT_DIV, (input, text) => {
                input.innerHTML = `<p>${text}`
            }, text)

            do {
                try {
                    await this.page.click(READ_BUTTON_PAUSED)
                    await this.page.waitForSelector(READ_BUTTON_PLAYING, {
                        timeout: 8_000
                    })
                    break
                } catch (e) { }
            } while (
                !await this.page.$(READ_BUTTON_PLAYING)
            )
            await this.page.waitForSelector(READ_BUTTON_PAUSED)

            payload = await loadPayload
        } catch (e) {
            defer()
            throw e
        }

        defer()

        return payload
    }

    // Methods:
    private async configureEndpoint() {
        this.logger.group("Configuring the Endpoint")

        this.logger.log("Debug", "Configuring the default voice..")
        await this.page.waitForSelector(NEXT_BUTTON)
        await this.page.click(NEXT_BUTTON)
        this.logger.log("Debug", "Configuring the endpoint usage..")
        await this.page.waitForSelector(PERSONAL_USE_BUTTON)
        await this.page.click(PERSONAL_USE_BUTTON)
        this.logger.log("Debug", "Applying the configuration")
        await this.page.waitForSelector(READ_BUTTON)
        this.logger.log("Debug", "Waiting for endpoint to response")
        await sleep(3_000)
        this.logger.log("Debug", "The configuration is applied")

        this.logger.groupEnd()
    }

    private async useProxy() {
        this.logger.group("Connecting to proxy");
        this.logger.log("Debug", "Visiting the proxy luncher");
        await this.page.goto(PROVIDER_URL)

        this.logger.log("Debug", "Configuring the proxy...");
        await this.page.waitForSelector(FORM_QUERY)
        await this.page.$eval(FORM_QUERY, function (input) {
            input.value = "https://www.naturalreaders.com/online/"
        })

        this.logger.log("Debug", "Launching the proxy...")
        await this.page.click(SUBMIT_FORM)
        await this.page.waitForSelector(NEXT_BUTTON)
        this.logger.log("Debug", "The proxy is launched.")
        this.logger.groupEnd();
    }

    private async initListeners() {
        let SMarks = ""

        this.page.on("response", async (response) => {
            const url = response.url()

            if (url.includes("tts") && !SMarks) {
                const headers = await response.allHeaders()
                SMarks = headers["X-SMark".toLowerCase()] || ""

            } else if (url.includes("blob:") && SMarks) {
                try {
                    this.callback?.call(null, {
                        marks: decodeSMarks(SMarks),
                        buffer: await response.body()
                    })
                } catch (e) { }
                SMarks = ""
            }
        })
    }

    private async setVoice(voice: Voice, force: boolean = false) {
        if (voice == this.currentVoice && !force) return;

        await this.page.click(TRIGGER_VOICE_LIST)
        await this.page.waitForSelector(VOICE_LIST_CELL)
        const isSuccess = await this.page.$$eval(VOICE_LIST_CELL, function (cells, voice) {
            for (const cell of cells) {
                if (cell.textContent?.match(/\w+/)?.pop() == voice) {
                    cell.click()
                    // @ts-ignore
                    $(".pw-voices-backdrop").click()
                    return true
                }
            }

            // @ts-ignore
            $(".pw-voices-backdrop").click()
            return false
        }, voice)

        if (!isSuccess) {
            throw new Error("Cannot use the voice " + voice)
        }

        this.currentVoice = voice
    }
}