import { execSync } from "child_process"
import os from "os"

function loadExecutablePathForLinux() {
    return execSync("whereis chromium").toString().replace("chromium: ", "").trim()
}

export default function executablePath() {
    if (os.platform() === "linux") {
        return process.env["EXECUTABLE_PATH"] || loadExecutablePathForLinux()
    } else {
        return "C:/chrome-win64/chrome.exe"
    }
}