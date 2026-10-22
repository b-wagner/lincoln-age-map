# Lincoln, Nebraska — Building Ages

An interactive map of Lincoln's residential construction history. This project
uses public City of Lincoln and Lancaster County GIS records to make the city's
building-age patterns easier to explore: where older homes cluster, how
construction decades vary across the city, and where recorded historic buildings
sit within that landscape.

The intent is to turn scattered geographic records into an accessible visual
reference for anyone curious about Lincoln's built environment. You can move
between a citywide view and local detail, highlight a construction decade, and
explore historic sites alongside the surrounding residential patterns.

## What the map shows

Three complementary views help explain the age of the city's buildings:

- **Area age:** broad color regions showing the median residential construction
  decade within approximately 600 meters. These reveal patterns across larger
  areas of the city.
- **Residential age grid:** 120-meter squares showing the most common construction
  decade among the dated residential parcels in each square. These are spatial
  summaries, not individual parcel boundaries.
- **Historic buildings:** markers for recorded historic buildings and sites,
  grouped at lower zoom levels, with their recorded construction dates.

Street names and the city outline provide geographic context. Zoom and pan to
explore, or use **Citywide** and **Downtown** to change views. The residential
grid appears automatically from 4× zoom; choose Always visible or Hidden to
override it. Area age and historic markers can be toggled independently.

Select a decade to highlight matching area medians, most-common grid decades,
and historic construction dates. A square highlights only when the chosen decade
is its most common decade, even if it contains some records from other decades.
Choose **Show all** or select the active decade again to clear the highlight.
A selected building remains visible even outside the active decade.

Use **Find a place** to search historic buildings or streets, or browse the full
historic list. Exact residential addresses are not included. Selecting a place
centers the map and displays its details beside the map. On narrow screens,
**Search & filters** opens the controls in a dialog.

On desktop, drag to pan and hold Control or Command while scrolling to zoom.
On touch screens, use **Move map** to enable dragging and pinching, then **Done
moving** to resume page scrolling. Zoom buttons work in either mode. To use the
keyboard, focus the map and use arrow keys to pan, +/− to zoom, Home for citywide,
and Enter to inspect the crosshair. Escape exits map movement. **Expand map**
provides more space without changing browser fullscreen settings.

## Data and interpretation

The bundled data is a snapshot prepared on October 20, 2026, from public City of
Lincoln / Lancaster County GIS records. It includes 87,356 dated residential
parcels whose approximate centers fall within the city boundary and 170 dated
historic building/site records within city limits.

| Component | Public source | How it is used |
| --- | --- | --- |
| Residential construction dates | [Assessor tax parcels](https://gis.lincoln.ne.gov/public/rest/services/Assessor/TaxParcels/MapServer/0) | Summarized into 120-meter squares by construction decade. |
| Historic buildings and sites | [Historic Preservation](https://gis.lincoln.ne.gov/public/rest/services/Planning/HistoricPreservation/MapServer/0) | Displayed separately as dated markers. Multi-phase records retain their full date label and use the earliest listed year for their color. |
| Streets | [City street centerlines](https://gis.lincoln.ne.gov/public/rest/services/Planning/Streets/MapServer/0) | Street geometry and names, with labels appearing as you zoom in. |
| City outline | [Lincoln City Limits](https://gis.lincoln.ne.gov/public/rest/services/CityCounty/CityLimits/MapServer/4) | Geographic boundary for the map. |

The area-age layer uses the residential decade histograms to estimate the median
decade around grid samples spaced approximately 240 meters apart. Each sample
requires at least 20 records within approximately 600 meters. The samples become
smoothed color regions clipped to the city boundary; samples more than
approximately 300 meters from parcel observations remain uncolored. Historic
markers do not contribute to this statistic.

The historic selection excludes district labels, non-building sites, and a
documented demolished building. A historic record may represent multiple
structures or overlap a residential parcel.

Read the colors as approximate patterns in recorded residential building ages.
They do not establish official neighborhood boundaries, annexation dates, or
when streets were laid out. Assessor dates may be approximate or rounded, and
historic records do not provide complete coverage of current buildings. Blank
areas are not necessarily vacant: commercial, industrial, institutional, and
other properties may lack usable dates in the layers used here.

## Run locally

The repository includes a ready-to-open `index.html`. To preview it over HTTP,
run this command from the repository root:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/> in a modern browser. Press Control-C in the terminal
to stop the server.

The site is static, with its geographic and building-age data embedded in the
page. It needs no API key, account connection, or application server. D3 7.9.0 is
vendored and embedded at build time, so the downloaded page works offline.
The browser must support `DecompressionStream`; unsupported browsers display a
readable recovery message and retain the source/methodology information.

## Repository structure

- `index.html` — generated, standalone map page.
- `source/map.template.html` — editable map layout, styles, and interaction code.
- `source/data.json` — bundled city boundary, streets, residential summaries,
  historic records, and area-age grid. Street coordinates are stored as integers
  divided by 100,000 when rendered.
- `source/vendor/` — pinned D3 library and its ISC license.
- `tools/build.py` — packs the bundled data and regenerates the map page.
- `tools/renderer/` — standalone page renderer, styles, and browser-state bridge.

After editing the template or bundled data, rebuild with Python 3.10 or newer:

```sh
python3 tools/build.py
```

Keep the regenerated `index.html` alongside the source changes. Rebuilding
packages the existing snapshot; it does not fetch updated GIS records.

To run the map-state regression checks with Node.js 18 or newer (no packages
required):

```sh
node --test tests/map-state.test.cjs
```

## Privacy

The bundle contains geographic shapes, street names, aggregated residential
dates, and historic building records. It includes no parcel owner names, mailing
addresses, or credentials, and makes no live requests to city GIS services.
Map preferences are stored locally in the visitor's browser when storage is
available. The map runs in a sandboxed iframe with a restrictive Content Security
Policy.
