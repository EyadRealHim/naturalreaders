export default class Logger {
  private xIndex: number = 0;

  constructor(readonly enable: boolean) { }

  public group(name: string) {
    if (!this.enable) return;

    this.xIndex += 1;
    console.group("-", name);
  }

  public groupEnd() {
    if (!this.enable) return;
    if (this.xIndex == 0) return;
    this.xIndex -= 1;
    console.groupEnd();

    if (this.xIndex == 0) {
      console.log("");
    }
  }

  public killGroups() {
    if (!this.enable) return;
    while (this.xIndex > 0) {
      this.groupEnd();
    }
  }

  public log(kind: "Warning" | "Info" | "Debug", ...args: any[]) {
    if (!this.enable) return;
    console.log(`[${kind}(${new Date().toLocaleTimeString()})]`, ...args);
  }
}
