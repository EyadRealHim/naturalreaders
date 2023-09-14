import executablePath from "./executablePath";

export type RuntimeType = "production" | "development"

export default function chromiumOptions(
    runtimeType: RuntimeType
) {
    return {
        executablePath: executablePath(),
        headless: runtimeType == "production",
        args: runtimeType == "production" ? [
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--force-color-profile=srgb',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--headless',
            '--no-sandbox',
        ] : []
    }
}