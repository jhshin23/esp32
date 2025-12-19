from flask import Flask, render_template, request
import paho.mqtt.client as mqtt
import threading

app = Flask(__name__)
latest = {"light": "?"}

def on_message(client, userdata, msg):
    if msg.topic == "desk/sensor/light":
        latest["light"] = msg.payload.decode()

def mqtt_loop():
    c = mqtt.Client()
    c.connect("127.0.0.1", 1883)
    c.subscribe("desk/sensor/light")
    c.on_message = on_message
    c.loop_forever()

threading.Thread(target=mqtt_loop, daemon=True).start()

@app.route("/")
def index():
    return render_template("desk.html", value=latest["light"])

@app.route("/led/<cmd>")
def led(cmd):
    pub = mqtt.Client()
    pub.connect("127.0.0.1", 1883)
    pub.publish("desk/led", cmd)
    pub.disconnect()
    return "ok"

app.run(port=8080, debug=True)
