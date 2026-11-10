// One word unit for proactive presentation and explicit registered fact-report views.
const WORD = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
export const presentationWordCount = (sentence: string): number => sentence.normalize("NFKC").match(WORD)?.length ?? 0;
