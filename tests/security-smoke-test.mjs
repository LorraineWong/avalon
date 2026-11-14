#!/usr/bin/env node
import {readGameSource} from './helpers/site.mjs';

import { readFile } from 'node:fs/promises';

const source = readGameSource();
const apiKey = source.match(/apiKey:'([^']+)'/)?.[1];
const databaseURL = source.match(/databaseURL:'([^']+)'/)?.[1];

if (!apiKey || !databaseURL) {
  throw new Error('Could not read the Firebase configuration from assets/js/app.js.');
}

// The API key only accepts browser requests from allowed websites (see SECURITY.md),
// so this script identifies itself as the deployed browser origin.
const REFERER = process.env.AVALON_REFERER || 'https://avalon.lorrainewong.dev/';

const room = `SEC${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const appCheckHeaders = process.env.AVALON_APPCHECK_TOKEN ? {'X-Firebase-AppCheck':process.env.AVALON_APPCHECK_TOKEN} : {};
const users = [];
const results = [];

async function createAnonymousUser() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: REFERER, ...appCheckHeaders },
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
    headers: { 'content-type': 'application/json', ...appCheckHeaders },
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
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: REFERER, ...appCheckHeaders },
      body: JSON.stringify({ idToken: user.idToken })
    }
  );
  if (!response.ok) throw new Error(`Temporary-user cleanup failed (${response.status}).`);
}

let host;
let guest;
let roomCreated = false;

try {
  host = await createAnonymousUser();
  guest = await createAnonymousUser();

  // Inspect only our random candidate, and never clean up a room we did not create.
  const candidate = await databaseRequest(`rooms/${room}`, 'GET', undefined, host.idToken);
  if (candidate.status !== 200 || candidate.text !== 'null') throw new Error('Test room is not confirmed unused; stopping before any writes.');
  await expectStatus('Room listing is denied', 'rooms', 'GET', undefined, guest.idToken, [401]);
  await expectStatus('Unauthenticated room read is denied', `rooms/${room}`, 'GET', undefined, null, [401]);
  await expectStatus('Cannot write a seat into a missing room', `rooms/${room}/seats/${guest.localId}`, 'PUT', {j:'{}'}, guest.idToken, [401]);
  await expectStatus('Cannot write presence into a missing room', `rooms/${room}/online/${guest.localId}`, 'PUT', Date.now(), guest.idToken, [401]);
  await expectStatus('Cannot write secrets into a missing room', `rooms/${room}/sec/probe`, 'PUT', {j:'{}'}, guest.idToken, [401]);
  await expectStatus('Host can create game state', `rooms/${room}/game`, 'PUT', { host: host.localId, j: '{}' }, host.idToken, [200]);
  roomCreated = true;
  await expectStatus('Host can create own seat', `rooms/${room}/seats/${host.localId}`, 'PUT', { j: '{}' }, host.idToken, [200]);
  await expectStatus('Authenticated guest can read a known room', `rooms/${room}`, 'GET', undefined, guest.idToken, [200]);
  await expectStatus('Guest cannot overwrite game state', `rooms/${room}/game`, 'PUT', { host: host.localId, j: '{}' }, guest.idToken, [401]);
  await expectStatus('Guest cannot write host secrets', `rooms/${room}/sec/probe`, 'PUT', { j: '{}' }, guest.idToken, [401]);
  await expectStatus('Guest cannot overwrite another seat', `rooms/${room}/seats/${host.localId}`, 'PUT', { j: '{}' }, guest.idToken, [401]);
  await expectStatus('Guest can write own seat', `rooms/${room}/seats/${guest.localId}`, 'PUT', { j: '{}' }, guest.idToken, [200]);
  await expectStatus('Guest cannot spoof another presence record', `rooms/${room}/online/${host.localId}`, 'PUT', Date.now(), guest.idToken, [401]);
  await expectStatus('Guest can write own presence record', `rooms/${room}/online/${guest.localId}`, 'PUT', Date.now(), guest.idToken, [200]);
} finally {
  const cleanupErrors = [];
  async function clean(path, token) {
    try {
      const result = await databaseRequest(path, 'DELETE', undefined, token);
      if (result.status !== 200) throw new Error(`Temporary-room cleanup failed (${result.status}).`);
    } catch (error) { cleanupErrors.push(error.message); }
  }
  if (roomCreated) {
    if (guest) {
      await clean(`rooms/${room}/online/${guest.localId}`, guest.idToken);
      await clean(`rooms/${room}/seats/${guest.localId}`, host.idToken);
    }
    await clean(`rooms/${room}/online/${host.localId}`, host.idToken);
    await clean(`rooms/${room}/seats/${host.localId}`, host.idToken);
    // Secret writes are denied in this test; no secret record was created.
    await clean(`rooms/${room}/game`, host.idToken);
    try {
      const removed = await databaseRequest(`rooms/${room}`, 'GET', undefined, host.idToken);
      if (removed.status !== 200 || removed.text !== 'null') cleanupErrors.push('Temporary room removal was not verified.');
    } catch { cleanupErrors.push('Temporary room cleanup verification failed.'); }
  }
  const deleted = await Promise.allSettled(users.map(deleteAnonymousUser));
  for (const result of deleted) if (result.status === 'rejected') cleanupErrors.push(result.reason.message);
  if (cleanupErrors.length) throw new Error(cleanupErrors.join(' '));
  console.log('Temporary users removed; test room ' + (roomCreated ? 'removal verified.' : 'was not created.'));
}

console.table(results);
console.log(`Security smoke test: ${results.filter(({ passed }) => passed).length}/${results.length} checks passed.`);

