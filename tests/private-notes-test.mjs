import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const between = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

assert.match(source, /function notesStorageKey\(g=S\.game\).*?'notes\.'\+S\.code\+'\.'\+\(g\.gid\|\|'lobby'\)/s, 'notes must be scoped to room and game');
assert.match(source, /function currentLineupContent\(\).*?buildRoles\(/s, 'current lineup must come from the actual role builder');
assert.match(source, /function privateNotesPanel\(/, 'private notes panel is missing');
assert.match(source, /slice\(0,240\)/, 'private note length must be capped');
assert.match(source, /step1Title.*step4Body/s, 'four-step rule copy is missing');

const saveNote = between('function savePrivateNote', 'function privateNotesPanel');
assert.match(saveNote, /LS\.set\(key,notes\)/, 'private notes must use local storage');
assert.doesNotMatch(saveNote, /Net\.|Firebase|firebase|Net\.pub/, 'private notes must never use the network layer');

console.log('Private notes and in-game guide checks passed.');
