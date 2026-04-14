import json
with open("dump.json", "r") as f:
    data = json.load(f)

# Find any list that looks like events
def find_events(d):
    if isinstance(d, dict):
        if "data" in d and isinstance(d["data"], list) and len(d["data"])>0:
             if isinstance(d["data"][0], dict) and "actual" in d["data"][0]:
                  return d["data"]
        for k, v in d.items():
            res = find_events(v)
            if res: return res
    elif isinstance(d, list):
        for item in d:
            res = find_events(item)
            if res: return res
    return None

events = find_events(data)
if events:
     print(f"Found {len(events)} events!")
     print("First event keys:", list(events[0].keys()))
     print("First event sample:", events[0])
else:
     print("Events not found. Dumping 1st level keys:")
     print(list(data.get('props',{}).get('pageProps',{}).get('state',{}).keys()))
