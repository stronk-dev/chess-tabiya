import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const rfc = read("rfc/native-ratings.md");
const original = rfc.replace(
  /\n## Fresh independent buildability return[\s\S]*?\n## Acceptance criteria/u,
  "\n## Acceptance criteria",
);
const register = read("rfc/README.md");
const social = read("rfc/social-play.md");
const enforced = read("rfc/enforced-clocks.md");
const storage = read("apps/server/src/storage.ts");
const sqlBlocks = [...original.matchAll(/```sql\n([\s\S]*?)```/gu)].map((match) => match[1]);
const gameDdl = sqlBlocks.find((block) => block.includes("CREATE TABLE games")) ?? "";
const contestDdl = sqlBlocks.find((block) => block.includes("CREATE TABLE contests")) ?? "";

function proposedDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(`
    CREATE TABLE learners (id TEXT PRIMARY KEY) STRICT;
    CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;
    CREATE TABLE classrooms (id TEXT PRIMARY KEY) STRICT;
    INSERT INTO learners VALUES ('a'),('b'),('c');
    INSERT INTO drill_runs VALUES ('r1'),('r2'),('r3');
  `);
  database.exec(gameDdl);
  database.exec(contestDdl);
  return database;
}

function insertGame(database, id, runId, rated = 1) {
  database.prepare(`INSERT INTO games
    (id,run_id,origin,rated,calibration_id,start_piece_count,state,result,result_cause,
     declared_by,void_reason,ply_count,started_at,sealed_at)
    VALUES (?,?, 'native_match', ?, 'cal-1', 32, 'open', NULL, NULL, NULL, NULL, NULL,
            '2026-08-30T00:00:00.000Z', NULL)`).run(id, runId, rated);
}

test("D2308: the sole writer equates winner colour with the resigning or flagged side", () => {
  assert.match(original, /`score\(side\) = 1` where `games\.result = side\.colour`/u);
  assert.match(original, /declared colour must equal the event's own \(`resignedBy`, the flagged side\)/u);
});

test("D2309: rating ineligibility is modelled as voiding the game fact", () => {
  assert.match(original, /a row now exists for unrated\s+native matches/u);
  assert.match(original, /`side_unrateable` is the one side-shaped\s+cause and it voids the \*\*game\*\*/u);
  assert.match(original, /rewound','forked','assistance','engine_changed'/u);
});

test("D2310: the proposed game state CHECK admits contradictory lifecycle rows", () => {
  const database = proposedDatabase();
  assert.doesNotThrow(() => database.exec(`
    INSERT INTO games VALUES
      ('open-dirty','r1','native_match',1,'cal-1',32,'open',NULL,NULL,NULL,'assistance',NULL,'2026-08-30T00:00:00.000Z',NULL),
      ('sealed-dirty','r2','native_match',1,'cal-1',32,'sealed','white','checkmate',NULL,'assistance',20,'2026-08-30T00:00:00.000Z','2026-08-30T01:00:00.000Z'),
      ('voided-result','r3','native_match',1,'cal-1',32,'voided','white','checkmate',NULL,'assistance',20,'2026-08-30T00:00:00.000Z','2026-08-30T01:00:00.000Z');
  `));
  database.close();
});

test("D2311: game-rated and side-rated authorities can disagree and a bot may be rated", () => {
  const database = proposedDatabase();
  insertGame(database, "g1", "r1", 0);
  assert.doesNotThrow(() => database.exec(`
    INSERT INTO game_sides VALUES ('g1','white','learner','a',NULL,NULL,1,1500,200,0.06,0);
    INSERT INTO game_sides VALUES ('g1','black','bot',NULL,1800,'sha256:bot',1,1800,50,0.06,0);
  `));
  database.close();
});

test("D2312: open-seat acceptance contradicts eager two-learner contest creation", () => {
  assert.match(storage, /Native match needs one or two distinct players/u);
  assert.match(original, /encounter_seats\s+2 rows seat=1,2\s+participant_kind='learner'/u);
  assert.match(social, /Supplying a handle at creation[\s\S]*may not grant it/iu);
});

test("D2313: neither SQL nor token redemption prevents self-play", () => {
  const database = proposedDatabase();
  insertGame(database, "g1", "r1");
  assert.doesNotThrow(() => database.exec(`
    INSERT INTO game_sides VALUES ('g1','white','learner','a',NULL,NULL,1,1500,200,0.06,0);
    INSERT INTO game_sides VALUES ('g1','black','learner','a',NULL,NULL,1,1500,200,0.06,0);
  `));
  assert.match(storage, /UPDATE match_states SET \$\{column\}=\? WHERE session_id=\? AND \$\{column\} IS NULL/u);
  assert.doesNotMatch(storage, /white_learner_id<>\?|black_learner_id<>\?/u);
  database.close();
});

test("D2314: encounter seats and game sides can disagree and one game can occupy two encounters", () => {
  const database = proposedDatabase();
  insertGame(database, "g1", "r1");
  database.exec(`
    INSERT INTO game_sides VALUES ('g1','white','learner','a',NULL,NULL,0,NULL,NULL,NULL,NULL);
    INSERT INTO game_sides VALUES ('g1','black','learner','b',NULL,NULL,0,NULL,NULL,NULL,NULL);
    INSERT INTO contests VALUES ('c1','match','One','private',NULL,'a','open','2026-08-30T00:00:00.000Z',NULL);
    INSERT INTO contest_rounds VALUES ('c1',1,'open',NULL,NULL);
    INSERT INTO contest_encounters VALUES ('e1','c1',1,1,'live','2026-08-30T00:00:00.000Z');
    INSERT INTO contest_encounters VALUES ('e2','c1',1,2,'live','2026-08-30T00:00:00.000Z');
    INSERT INTO encounter_seats VALUES ('e1',1,'learner','c',NULL,NULL);
    INSERT INTO encounter_seats VALUES ('e1',2,'learner','b',NULL,NULL);
    INSERT INTO encounter_games VALUES ('e1','g1',1);
    INSERT INTO encounter_games VALUES ('e2','g1',1);
  `);
  assert.equal(database.prepare("SELECT count(*) AS n FROM encounter_games WHERE game_id='g1'").get().n, 2);
  database.close();
});

test("D2315: account deletion cascades away shared side and contest history", () => {
  const database = proposedDatabase();
  insertGame(database, "g1", "r1");
  database.exec(`
    INSERT INTO game_sides VALUES ('g1','white','learner','a',NULL,NULL,0,NULL,NULL,NULL,NULL);
    INSERT INTO game_sides VALUES ('g1','black','learner','b',NULL,NULL,0,NULL,NULL,NULL,NULL);
    INSERT INTO contests VALUES ('c1','match','One','private',NULL,'a','open','2026-08-30T00:00:00.000Z',NULL);
  `);
  database.prepare("DELETE FROM learners WHERE id='a'").run();
  assert.equal(database.prepare("SELECT count(*) AS n FROM game_sides WHERE game_id='g1'").get().n, 1);
  assert.equal(database.prepare("SELECT count(*) AS n FROM contests WHERE id='c1'").get().n, 0);
  assert.doesNotMatch(original, /opponent.*redact|rating_before.*private|tombstone participant/iu);
  database.close();
});

test("D2316: widening attempts leaves learner-blind updates and weakens branch integrity", () => {
  assert.match(original, /PRIMARY KEY \(run_id, branch_id, learner_id\)/u);
  assert.match(storage, /UPDATE attempts SET attempt_no = \? WHERE run_id = \? AND branch_id = \?/u);
  assert.match(storage, /JOIN attempts a ON a\.run_id=c\.run_id AND a\.branch_id=c\.branch_id/u);
  assert.match(original, /re-points its foreign key at `drill_runs\(id\) ON DELETE CASCADE`/u);
  assert.doesNotMatch(original, /attempt consumer census|every attempts join|branch authority/iu);
});

test("D2317: the rated game identity omits rules, setup, time control, and side calibration", () => {
  const games = gameDdl.match(/CREATE TABLE games[\s\S]*?\) STRICT;/u)?.[0] ?? "";
  const sides = gameDdl.match(/CREATE TABLE game_sides[\s\S]*?\) STRICT;/u)?.[0] ?? "";
  assert.doesNotMatch(games, /rules|setup_family|time_control/iu);
  assert.doesNotMatch(sides, /calibration_id/u);
  assert.match(social, /consume `rules \+ setupFamily`/u);
  assert.match(enforced, /time control/u);
});

test("D2318: migration backfills contests without creating games or defining game ids", () => {
  const nativeBackfill = original.match(/\| 8 \| Backfill \*\*one\*\* contest per existing native match[^\n]*/u)?.[0] ?? "";
  assert.match(nativeBackfill, /link to that run's `games` row if one exists/u);
  assert.doesNotMatch(nativeBackfill, /create|insert into games|game id|games\.id\s*=/iu);
});

test("D2319: no typed game/contest API or complete native-rating learner journey is specified", () => {
  assert.match(original, /`POST \/rated-games`, unchanged as a route/u);
  assert.doesNotMatch(original, /GET \/games|GET \/contests|GameView|ContestView|client parser|browser journey/iu);
});

test("D2320: the tournament fixture has no entrant authority and only proves permissive inserts", () => {
  assert.doesNotMatch(contestDdl, /contest_(?:entrants|participants|registrations)/u);
  assert.match(original, /using \*\*only\*\* `INSERT`s/u);
  assert.doesNotMatch(original, /round-trip standing|pairing invariant|every entrant|semantic validator/iu);
});

test("D2321: the core-loop question is misrouted and rematch remains unresolved", () => {
  assert.match(original, /Routed to \*\*D7\*\*'s owner/u);
  assert.match(original, /\| D7 \| Whether a later event may order a crosstable/u);
  assert.match(original, /rematch \(`social-play\.md` Open question 3\)/u);
});

test("D2322: all terminal/social inputs this draft consumes are returned", () => {
  assert.match(register, /`social-play\.md` \| \*\*draft — RETURNED/u);
  assert.match(register, /`enforced-clocks\.md` \| \*\*draft — RETURNED/u);
  assert.match(register, /`bot-policy\.md` \| \*\*draft — RETURNED/u);
});

test("D2323: the human-pool publication policy has no research or measured falsifier", () => {
  assert.match(original, /drift together indefinitely/u);
  assert.match(original, /point estimate is withheld/u);
  assert.doesNotMatch(original, /measured human pool|Glickman|glicko\.net/iu);
});
