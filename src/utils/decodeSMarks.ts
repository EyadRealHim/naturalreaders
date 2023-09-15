
export type Mark = {
    content: string;
    index: number;
    time: number;
}

export default function decodeSMarks(raw: string) {
    const string = Buffer.from(raw, "base64").toString()
    const separator = string[0] || ",";
    const data = string.slice(2).split(separator);

    if (data.length % 4 != 0) return [];

    const marks = new Array<Mark>(data.length / 4);

    for (let i = 0; i < data.length; i += 4) {
        marks[i / 4] = {
            content: String(data[i]),
            index: Number(data[i + 1]),
            time: Number(data[i + 3])
        };
    }

    return marks;
}
