// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

const [populationPath, outputPath] = process.argv.slice(2);
if (populationPath === undefined || outputPath === undefined) {
  throw new Error("usage: node candidate-ids.mjs POPULATION_JSON OUTPUT_TXT");
}
const population = JSON.parse(readFileSync(populationPath, "utf8"));
const usernames = [...new Set(population.candidates.flatMap((band) =>
  band.accounts.map((account) => account.username)
))];
writeFileSync(outputPath, usernames.join(","));
console.log(JSON.stringify({ candidateAccounts: usernames.length }));
