import json
with open("dump.json", "r") as f:
    data = json.load(f)

store = data.get('props',{}).get('pageProps',{}).get('state',{}).get('economicCalendarStore', {})
eventsByDate = store.get('calendarEventsByDate', {})

print("Dates found:", list(eventsByDate.keys()))
for d, ev_list in eventsByDate.items():
     print(f"Date {d} has {len(ev_list)} items")
     if len(ev_list) > 0:
          print("Sample item keys:", ev_list[0].keys())
          print("Sample item:", ev_list[0])
          break
