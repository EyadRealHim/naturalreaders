// English Voices
export const VOICES = [
    "Davis", "Jane", "Tony", "Sara", "Eric", "Nancy", "Steffan", "Jason", "Ana", "Brandon",
    "Elizabeth", "Guy", "Michelle", "Liam", "Salli", "Matthew", "Joanna", "Joey", "Kimberly",
    "Kendra", "Sharon", "Ryan", "Heather", "Will", "Rod", "Karen", "Tracy", "Mike", "Laura",
    "David", "Mark", "Zira"
] as const

export type Voice = typeof VOICES[number]