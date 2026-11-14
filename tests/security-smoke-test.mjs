#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const apiKey = source.match(/apiKey:'([^']+)'/)?.[1];
const databaseURL = source.match(/databaseURL:'([^']+)'/)?.[1];

if (!apiKey || !databaseURL) {
  throw new Error('Could not read the Firebase configuration from app.js.');
}

// The API key only accepts browser requests from allowed websites (see SECURITY.md),
// so this script identifies itself as the deployed browser origin.
const REFERER = process.env.AVALON_REFERER || 'https://lorrainewong.github.io/';

const room = `SEC${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const users = [];
const results = [];

async function createAnonymousUser() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: REFERER },
      body: JSON.stringify({ returnSecureToken: true })
    }
  );
  if (!response.ok) throw new Error(`Anonymous sign-in failed (${response.status}).`);
  const user = await response.json();
  users.push(user);
  return user;
}

async function databaseRequest(path, method = 'GET', body, token) {
  const auth = token ? `?auth=${encodeURIComponent(token)}` : '';
  const response = await fetch(`${databaseURL}/${path}.json${auth}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, text: await response.text() };
}

async function expectStatus(name, path, method, body, token, expected) {
  const response = await databaseRequest(path, method, body, token);
  const passed = expected.includes(response.status);
  results.push({ name, status: response.status, passed });
  if (!passed) {
    throw new Error(`${name}: expected ${expected.join('/')} but received ${response.status}.`);
  }
}

async function deleteAnonymousUser(user) {
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: REFERER },
      body: JSON.stringify({ idToken: user.idToken })
    }
  );
}

let host;
let guest;

try {
  host = await createAnonymousUser();
  guest = await createAnonymousUser();

  await expectStatus('Unauthenticated room read is denied', `rooms/${room}`, 'GET', undefined, null, [401]);
  await expectStatus('Cannot write a seat into a missing room', `rooms/${room}/seats/${guest.localId}`, 'PUT', {j:'{}'}, guest.idToken, [401]);
  await expectStatus('Cannot write presence into a missing room', `rooms/${room}/online/${guest.localId}`, 'PUT', Date.now(), guest.idToken, [401]);
  await expectStatus('Cannot write secrets into a missing room', `rooms/${room}/sec/probe`, 'PUT', {j:'{}'}, guest.idToken, [401]);
  await expectStatus('Host can create game state', `rooms/${room}/game`, 'PUT', { host: host.localId, j: '{}' }, host.idToken, [200]);
  await expectStatus('Host can create own seat', `rooms/${room}/seats/${host.localId}`, 'PUT', { j: '{}' }, host.idToken, [200]);
  await expectStatus('Authenticated guest can read a known room', `rooms/${room}`, 'GET', undefined, guest.idToken, [200]);
  await expectStatus('Guest cannot overwrite game state', `rooms/${room}/game`, 'PUT', { host: host.localId, j: '{}' }, guest.idToken, [401]);
  await expectStatus('Guest cannot write host secrets', `rooms/${room}/sec/probe`, 'PUT', { j: '{}' }, guest.idToken, [401]);
  await expectStatus('Guest cannot overwrite another seat', `rooms/${room}/seats/${host.localId}`, 'PUT', { j: '{}' }, guest.idToken, [401]);
  await expectStatus('Guest can write own seat', `rooms/${room}/seats/${guest.localId}`, 'PUT', { j: '{}' }, guest.idToken, [200]);
  await expectStatus('Guest cannot spoof another presence record', `rooms/${room}/online/${host.localId}`, 'PUT', Date.now(), guest.idToken, [401]);
  await expectStatus('Guest can write own presence record', `rooms/${room}/online/${guest.localId}`, 'PUT', Date.now(), guest.idToken, [200]);
} finally {
  if (host && guest) {
    await databaseRequest(`rooms/${room}/online/${guest.localId}`, 'DELETE', undefined, guest.idToken);
    await databaseRequest(`rooms/${room}/seats/${guest.localId}`, 'DELETE', undefined, host.idToken);
  }
  if (host) {
    await databaseRequest(`rooms/${room}/online/${host.localId}`, 'DELETE', undefined, host.idToken);
    await databaseRequest(`rooms/${room}/seats/${host.localId}`, 'DELETE', undefined, host.idToken);
    await databaseRequest(`rooms/${room}/sec`, 'DELETE', undefined, host.idToken);
    await databaseRequest(`rooms/${room}/game`, 'DELETE', undefined, host.idToken);
  }
  await Promise.allSettled(users.map(deleteAnonymousUser));
}

console.table(results);
console.log(`Security smoke test: ${results.filter(({ passed }) => passed).length}/${results.length} checks passed.`);

