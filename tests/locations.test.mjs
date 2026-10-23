import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The deployed app serves plain ESM without a Node package.json; load it as ESM
// for tests without changing its GitHub Pages module paths.
const mapSource = readFileSync(new URL('../docs/map2d.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const map = await import(`data:text/javascript;base64,${Buffer.from(mapSource).toString('base64')}`);

test('every meaningful location has an independently clickable center', () => {
  assert.equal(map.LOCATIONS.length, 18);
  assert.equal(new Set(map.LOCATIONS.map(location => location.id)).size, map.LOCATIONS.length);
  for (const location of map.LOCATIONS) {
    assert.equal(map.locationAt(location.u, location.v), location.id, location.id);
    assert.ok(map.LOCATION_POINTS[location.id], `${location.id} has a path entrance`);
    assert.ok(appSource.includes(`${location.id}:{name:`), `${location.id} has a location window`);
  }
});

test('empty residential buildings stay non-interactive', () => {
  for (const coordinates of [[.503, .230], [.695, .510], [.570, .721]]) {
    assert.equal(map.locationAt(...coordinates), null, `empty house at ${coordinates}`);
  }
});

test('nearby observatory and Mia house have separate touch targets', () => {
  assert.equal(map.locationAt(.315, .140), 'observatory');
  assert.equal(map.locationAt(.391, .177), 'mia');
  assert.equal(map.locationAt(.724, .579), 'post');
});

test('each location can be reached by the existing path network', () => {
  for (const location of map.LOCATIONS) {
    const walk = map.route(map.NODES.square, map.LOCATION_POINTS[location.id]);
    assert.ok(walk.length >= 1, location.id);
  }
});
