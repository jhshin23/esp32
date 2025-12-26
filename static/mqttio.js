let connectionFlag = false;
let client = null;
const CLIENT_ID = "client-" + Math.floor((1 + Math.random()) * 0x10000000000).toString(16);

let readingLog = [];
const WS_PORT = 9001;
const WS_PATH = "/mqtt"; // mosquitto 대부분 OK. (만약 계속 실패하면 "/"로 바꾸면 됨)

function connect() {
  if (connectionFlag) return;

  const broker = document.getElementById("broker").textContent.trim();
  if (!broker) {
    setTimeout(connect, 300);
    return;
  }

  // ✅ 4-arg: host, port, path, clientId
  client = new Paho.MQTT.Client(broker, Number(WS_PORT), WS_PATH, CLIENT_ID);

  client.onMessageArrived = onMessageArrived;
  client.onConnectionLost = () => {
    connectionFlag = false;
    setTimeout(connect, 1500);
  };

  client.connect({
    timeout: 5,
    keepAliveInterval: 30,
    onSuccess: onConnect,
    onFailure: () => setTimeout(connect, 1500),
  });
}

function onConnect() {
  connectionFlag = true;

  // 항상 구독 (핵심)
  client.subscribe("desk/authResult");
  client.subscribe("desk/sensor/ultrasonic");
  client.subscribe("desk/seat/state");

  // light/shadow는 버튼으로 구독 유지(원본 감성)
}

function subscribe(topic) {
  if (!connectionFlag) return alert("연결되지 않았음");
  client.subscribe(topic);
}

function unsubscribe(topic) {
  if (!connectionFlag) return;
  client.unsubscribe(topic);
}

function publish(topic, msg) {
  if (!connectionFlag) return alert("연결되지 않았음");
  client.send(topic, msg, 0, false);
  return true;
}

function onMessageArrived(msg) {
  try {
    const t = msg.destinationName;
    const p = msg.payloadString;

    if (t === "desk/authResult") {
      if (p === "success") showResult("success");
      else if (p === "fail") showResult("fail");
      else if (p.startsWith("Book title:")) changeBookTitle(p.substring("Book title:".length));
      else if (p === "reject") {}
      else if (p === "sitting_Authed") showResult("sitting_Authed");
      else if (p === "sitting_notAuthed") showResult("sitting_not");
      else if (p === "away_Authed") showResult("away_Authed");
      else if (p === "away_notAuthed") showResult("away_not");
    }
    else if (t === "desk/sensor/ultrasonic") addChartData0(parseFloat(p));
    else if (t === "desk/sensor/light") addChartData1(parseFloat(p));
    else if (t === "desk/reading/shadowOnBook") pageFlipCount(p);
    else if (t === "desk/seat/state") changeSittingState(p);

  } catch (e) {
    console.error("onMessageArrived Error:", e);
  }
}

function showResult(authState) {
  if (authState === "success") document.getElementById("viewerAuthSpan").innerHTML = "인증성공";
  else if (authState === "fail") document.getElementById("viewerAuthSpan").innerHTML = "인증실패";
  else if (authState === "sitting_Authed") {
    document.getElementById("masterAuthSpan").innerHTML = "인증성공";
    document.getElementById("useState").innerHTML = "사용중";
  }
  else if (authState === "sitting_not") document.getElementById("masterAuthSpan").innerHTML = "인증실패";
  else if (authState === "away_Authed") {
    document.getElementById("masterAuthSpan").innerHTML = "인증성공";
    document.getElementById("useState").innerHTML = "사용안함";
    document.getElementById("sittingState").innerHTML = "";
  }
  else if (authState === "away_not") document.getElementById("masterAuthSpan").innerHTML = "인증실패";
}

function changeBookTitle(title) {
  document.getElementById("titleHead").innerHTML = title;
}

function pageFlipCount(cnt) {
  const reading = document.getElementById("shadowCount");
  const parts = cnt.split(",");
  const time = parts[0] ?? "";
  const page = parts[1] ?? cnt;

  readingLog.push(`${page} (${time})`);
  if (readingLog.length > 10) readingLog.shift();
  reading.innerHTML = readingLog.join("<br>");
}

function changeSittingState(state) {
  document.getElementById("sittingState").innerHTML = state;
}
