import paho.mqtt.client as mqtt

def on_message(client, userdata, msg):
    print(msg.topic, msg.payload.decode())

c = mqtt.Client()
c.connect("127.0.0.1", 1883)
c.subscribe("desk/#")
c.on_message = on_message
c.loop_forever()
