import playwright from "playwright-core"

import TTSClient from "./TTSClient";
import Logger from "./utils/logger";
import type { RuntimeType } from "./chromiumOptions";
import chromiumOptions from "./chromiumOptions";
import { Voice } from "./config";

export default class TTSServer {
    private context: playwright.BrowserContext | null = null
    private browser: playwright.Browser | null = null

    readonly counter = new Map<TTSClient, number>()
    readonly clients: TTSClient[] = []
    readonly logger: Logger


    constructor(readonly runtimeType: RuntimeType, verbose: boolean = false) {
        this.logger = new Logger(runtimeType == "development" || verbose)
    }

    public async launch() {
        this.logger.group("Launching the TTSServer..")

        this.logger.log("Debug", "Starting the browser")
        this.browser = await playwright.chromium.launch(
            chromiumOptions(this.runtimeType)
        )
        this.logger.log("Debug", "Extracting the context from browser..")
        this.context = await this.browser.newContext()

        this.logger.log("Info", "TTSServer is launched")
        this.logger.groupEnd()
    }

    public async say(text: string, voice: Voice) {
        if (!this.clients.length) {
            await this.createClient()
        }

        this.clients.sort((a, b) => a.queueLength - b.queueLength)

        const [client] = this.clients

        if (!client) {
            throw new Error("Cannot generate audio without providers.")
        }

        return await client.say(text, voice)
    }

    public async createClients(count: number = 1, parallelize: boolean = false) {
        const lazyClients = new Array(count).fill(0).map(() => this.createClient())

        if (parallelize) {
            await Promise.all(lazyClients)
        } else for (const client of lazyClients) {
            await client
        }
    }

    public async createClient() {
        const [_, context] = this.ensureAlive()

        const client = new TTSClient(
            await context.newPage(), this.logger
        )

        await client.launch()

        this.clients.push(client)
        this.counter.set(client, client.queueLength)
    }

    // Methods:

    private ensureAlive() {
        if (!this.browser || !this.context) throw new Error("The Server is down. Please run .launch");

        return [this.browser, this.context] as const;
    }
}