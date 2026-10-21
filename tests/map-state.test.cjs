const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const template = fs.readFileSync(path.join(__dirname, '../source/map.template.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../source/data.json'), 'utf8'));
// Exercise the template's functions directly without loading browser CDNs.
function sourceFunction(name) {
  const start = template.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing function ${name}`);
  const remaining = template.slice(start);
  const end = remaining.slice(1).search(/\n(?:function |years\.forEach)/);
  assert.ok(end >= 0, `Missing boundary after ${name}`);
  return remaining.slice(0, end + 1);
}

function transform(k = 1, x = 0, y = 0) {
  return {
    k, x, y,
    invert: ([px, py]) => [(px - x) / k, (py - y) / k],
    translate: (tx, ty) => transform(k, x + tx * k, y + ty * k),
    scale: factor => transform(k * factor, x, y),
  };
}

const mercator = ([lon, lat]) => [lon * Math.PI / 180, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
const coordinates = data.boundary.features.flatMap(f => f.geometry.coordinates.flat(Infinity));
const points = [];
for (let i = 0; i < coordinates.length; i += 2) points.push(mercator(coordinates.slice(i, i + 2)));
const bounds = [0, 1].map(axis => [Math.min(...points.map(p => p[axis])), Math.max(...points.map(p => p[axis]))]);
function viewport(width) {
  const height = Math.max(430, Math.min(670, width * 1.04));
  const scale = Math.min((width - 28) / (bounds[0][1] - bounds[0][0]), (height - 56) / (bounds[1][1] - bounds[1][0]));
  const offset = [width / 2, (height - 8) / 2].map((v, i) => v - scale * (bounds[i][0] + bounds[i][1]) / 2);
  const projection = point => mercator(point).map((v, i) => v * scale + offset[i]);
  projection.invert = point => {
    const [x, y] = point.map((v, i) => (v - offset[i]) / scale);
    return [x * 180 / Math.PI, (2 * Math.atan(Math.exp(-y)) - Math.PI / 2) * 180 / Math.PI];
  };
  return { width, height, projection };
}

function harness() {
  const handlers = {};
  const context = vm.createContext({
    ...viewport(1000), current: transform(), decade: null, chosen: null,
    inspectedSummary: null, areaOn: true, detailOn: true,
    areaToggle: {}, detailToggle: {}, picker: {}, selection: {},
    years: Array.from({ length: 17 }, (_, i) => 1860 + i * 10),
    data, counts: Array(17).fill(0), colors: [],
    pathCells: null, areaLayer: null, markerLayer: null,
    d3: { zoomIdentity: transform() }, root: { querySelectorAll: () => [] },
    updateFrame() {},
    window: {
      addEventListener: (type, handler) => { handlers[type] = handler; },
      openai: { setWidgetState(state) {
        context.lastSavedState = state;
        // The standalone bridge broadcasts each write synchronously.
        handlers['openai:set_globals']({ detail: { globals: { widgetState: state } } });
        return Promise.resolve();
      } },
    },
  });
  const functions = ['save', 'restoreZoom', 'inspect', 'summary', 'colorMap', 'setBuilding'];
  vm.runInContext(functions.map(sourceFunction).join('\n'), context);
  vm.runInContext(template.split('\n').find(line => line.startsWith("window.addEventListener('openai:set_globals'")), context);
  return context;
}

test('inspected parcel and area summaries survive zoom saves, recoloring, and redraw summaries', () => {
  const c = harness();
  for (const text of ['120 m area: 5 dated residential parcels; most common 1920s.', 'Typical nearby construction: 1950s.']) {
    c.inspect(text);
    c.current = transform(12, -100, -200);
    c.save();
    c.colorMap();
    c.summary();
    assert.equal(c.selection.textContent, text);
  }
});

test('building and decade selections replace inspected area details', () => {
  const c = harness();
  c.inspect('Parcel details');
  const building = data.historic.features[0];
  c.setBuilding(building);
  assert.ok(c.selection.textContent.startsWith(building.properties.name));
  c.inspect('Area details');
  assert.equal(c.chosen, null);
  assert.equal(c.picker.value, '');
  c.window.openai.setWidgetState({ modelContent: { decade: 1920 } });
  assert.ok(c.selection.textContent.startsWith('1920s'));
});

test('saved geographic centers survive narrow and wide viewport changes', () => {
  const center = data.historic.features.find(f => f.properties.id === 14).geometry.coordinates;
  for (const from of [320, 1000, 1400]) {
    const c = harness();
    Object.assign(c, viewport(from));
    const xy = c.projection(center);
    c.current = transform(12, c.width / 2 - 12 * xy[0], c.height / 2 - 12 * xy[1]);
    c.save();
    const zoom = c.lastSavedState.privateContent.zoom;
    assert.equal(zoom.x, undefined);
    for (const to of [320, 1000, 1400]) {
      Object.assign(c, viewport(to));
      const restored = c.restoreZoom(zoom);
      const actual = c.projection.invert(restored.invert([c.width / 2, c.height / 2]));
      assert.equal(restored.k, 12);
      actual.forEach((value, i) => assert.ok(Math.abs(value - center[i]) < 1e-9, `${from}px to ${to}px: center moved`));
    }
  }
});

test('legacy views remain readable and invalid zoom state falls back safely', () => {
  const c = harness();
  const legacy = c.restoreZoom({ k: 4, x: -0.5, y: -0.25 });
  assert.equal(legacy.k, 4);
  assert.equal(legacy.x, -c.width / 2);
  assert.equal(legacy.y, -c.height / 4);
  for (const state of [null, {}, { k: NaN }, { k: 4, center: [Infinity, 0] }, { k: 4, center: [0, 90] }]) {
    assert.equal(c.restoreZoom(state).k, 1);
  }
  assert.equal(c.restoreZoom({ k: 100, center: [-96.7, 40.8] }).k, 80);
});
