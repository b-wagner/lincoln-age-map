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
- **Parcel detail:** 120-meter squares showing the most common construction
  decade among the dated residential parcels in each square. These are spatial
  summaries, not individual parcel boundaries.
- **Historic buildings:** separate markers for recorded historic buildings and
  sites, with their recorded construction dates.

Street names and the city outline provide geographic context. Zoom and pan to
explore, use **Citywide** or **Downtown** to change views, and toggle the two age
layers independently. Select a decade in the legend to highlight it; select it
again to restore all decades. Choose a historic building to center the map and
read its dates.

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
page. It needs no API key, account connection, or application server. An internet
connection is required to load the pinned D3 and Floating UI libraries from
jsDelivr and unpkg, and the browser must support `DecompressionStream`.

## Repository structure

- `index.html` — generated, standalone map page.
- `source/map.template.html` — editable map layout, styles, and interaction code.
- `source/data.json` — bundled city boundary, streets, residential summaries,
  historic records, and area-age grid. Street coordinates are stored as integers
  divided by 100,000 when rendered.
- `tools/build.py` — packs the bundled data and regenerates the map page.
- `tools/renderer/` — standalone page renderer, styles, and browser-state bridge.

After editing the template or bundled data, rebuild with Python 3.10 or newer:

```sh
python3 tools/build.py
```

Keep the regenerated `index.html` alongside the source changes. Rebuilding
packages the existing snapshot; it does not fetch updated GIS records.

## Privacy

The bundle contains geographic shapes, street names, aggregated residential
dates, and historic building records. It includes no parcel owner names, mailing
addresses, or credentials, and makes no live requests to city GIS services.
Map preferences are stored locally in the visitor's browser when storage is
available. The map runs in a sandboxed iframe with a restrictive Content Security
Policy.
