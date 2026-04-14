import json
with open("dump.json", "r") as f:
    data = json.load(f)

store = data.get('props',{}).get('pageProps',{}).get('state',{}).get('economicCalendarStore', {})
print("Store keys:", list(store.keys()))

if 'data' in store:
     print("Data type:", type(store['data']))
     if isinstance(store['data'], dict):
         print("Keys in data:", store['data'].keys())
         
         if 'events' in store['data']:
              events = store['data']['events']
              print(f"Found {len(events)} events!")
              if len(events) > 0:
                   print("Sample event Keys:", events[0].keys())
                   print("Event 0:", events[0])
                   
