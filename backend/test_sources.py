import requests
import feedparser
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SOURCES = [
    {
        "name": "disease.sh (current)",
        "fn": lambda: requests.get("https://disease.sh/v3/covid-19/all", timeout=10).json(),
        "check": lambda d: f"cases={d['cases']:,} | deaths={d['deaths']:,} | active={d['active']:,}"
    },
    {
        "name": "disease.sh (historical)",
        "fn": lambda: requests.get("https://disease.sh/v3/covid-19/historical/all?lastdays=7", timeout=10).json(),
        "check": lambda d: f"dates={list(d['cases'].keys())}"
    },
    {
        "name": "WHO GHO API",
        "fn": lambda: requests.get("https://ghoapi.azureedge.net/api/WHOSIS_000001?$top=3", timeout=12).json(),
        "check": lambda d: f"records={len(d['value'])} | first country={d['value'][0]['SpatialDim']}"
    },
    {
        "name": "CDC Open Data",
        "fn": lambda: requests.get(
            "https://data.cdc.gov/resource/vbim-akqf.json",
            params={"$limit": 3},
            headers={"Accept": "application/json"},
            timeout=15,
            verify=False  # Windows SSL workaround
        ).json(),
        "check": lambda d: f"rows={len(d)} | state={d[0].get('res_state')} | date={d[0].get('cdc_report_dt', '')[:10]}" if isinstance(d, list) and len(d) > 0 else f"Unexpected response: {d}"
    },
    {
        "name": "CDC FluView",
        "fn": lambda: requests.post(
            "https://gis.cdc.gov/grasp/flu2/GetFlu2Data",
            json={"AppVersion":"Public","DatasourceDT":[{"ID":1,"Name":"ILINet"}],"RegionTypeId":1,"SubRegionsList":[1],"SeasonsList":[65],"DataTypeId":1},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=15,
            verify=False
        ).json(),
        "check": lambda d: f"ILI records={len(d.get('ilinetList', []))} | seasons available={list(d.keys())}"
    },
    {
        "name": "ProMED RSS",
        "fn": lambda: feedparser.parse(
            "https://www.who.int/rss-feeds/disease-outbreak-news.xml",
            agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        ),
        "check": lambda d: f"alerts={len(d.entries)} | latest='{d.entries[0].title[:60]}...'" if d.entries else f"no entries (status={d.get('status', 'unknown')})"
    },
]

print("=" * 60)
print("  MedFusion — Live Source Test")
print("=" * 60)

passed = 0
failed = 0

for src in SOURCES:
    try:
        data = src["fn"]()
        info = src["check"](data)
        print(f"✅ {src['name']}")
        print(f"   {info}")
        passed += 1
    except Exception as e:
        print(f"❌ {src['name']}")
        print(f"   ERROR: {e}")
        failed += 1
    print()

print("=" * 60)
print(f"  {passed}/6 sources live | {failed} failed")
print("=" * 60)