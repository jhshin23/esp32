import time
import paho.mqtt.client as mqtt

def ts():
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

def on_message(client, userdata, msg):
    t = msg.topic
    p = msg.payload.decode(errors="ignore")

    if t == "desk/seat/state":
        with open("seat_use_log.txt", "a", encoding="utf-8") as f:
            f.write(f"{ts()} {p}\n")

    elif t == "desk/reading/shadowOnBook":
        with open("pageflip_log.txt", "a", encoding="utf-8") as f:
            f.write(f"{ts()} {p}\n")

c = mqtt.Client()
c.connect("127.0.0.1", 1883)
c.subscribe("desk/seat/state")
c.subscribe("desk/reading/shadowOnBook")
c.on_message = on_message
c.loop_forever()
