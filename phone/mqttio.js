// ===== MQTT WebSocket 설정 =====
const BROKER_IP = "192.0.0.4"; // 폰 hotspot IP
const WS_PORT   = 8080;           // 지금 쓰는 WebSocket 포트
const WS_PATH   = "/mqtt";        // mosquitto 기본
let client = null;
let connected = false;

const CLIENT_ID =
  "web-" + Math.random().toString(16).substring(2, 10);

function connect() {
  if (connected) return;

  client = new Paho.MQTT.Client(
    BROKER_IP,
    Number(WS_PORT),
    WS_PATH,
    CLIENT_ID
  );

  client.onMessageArrived = onMessageArrived;
  client.onConnectionLost = () => {
    connected = false;
    setTimeout(connect, 1500);
  };

  client.connect({
    timeout: 5,
    keepAliveInterval: 30,
    onSuccess: () => {
      connected = true;
      client.subscribe("desk/authResult");
      client.subscribe("desk/sensor/ultrasonic");
    },
    onFailure: () => setTimeout(connect, 1500),
  });
}

function subscribe(topic) {
  if (connected) client.subscribe(topic);
}

function unsubscribe(topic) {
  if (connected) client.unsubscribe(topic);
}

function publish(topic, msg) {
  if (!connected) return;
  client.send(topic, msg, 0, false);
}

function onMessageArrived(msg) {
  const t = msg.destinationName;
  const p = msg.payloadString;

  if (t === "desk/authResult") showResult(p);
  else if (t === "desk/sensor/ultrasonic") addChartData0(parseFloat(p));
  else if (t === "desk/sensor/light") addChartData1(parseFloat(p));
  else if (t === "desk/reading/shadowOnBook") pageFlipCount(p);
  else if (t === "desk/seat/state") changeSittingState(p);
}

function showResult(p) {
  if (p === "success") viewerAuthSpan.innerText = "인증성공";
  else if (p === "fail") viewerAuthSpan.innerText = "인증실패";
  else if (p === "sitting_Authed") {
    masterAuthSpan.innerText = "인증성공";
    useState.innerText = "사용중";
    client.subscribe("desk/seat/state");
  }
  else if (p === "away_Authed") {
    masterAuthSpan.innerText = "인증성공";
    useState.innerText = "사용안함";
    sittingState.innerText = "";
  }
}

function changeSittingState(state) {
  sittingState.innerText = state;
}

let readingLog = [];
function pageFlipCount(p) {
  const now = new Date().toLocaleString("ko-KR");
  readingLog.push(`${p} (${now})`);
  if (readingLog.length > 10) readingLog.shift();
  shadowCount.innerHTML = readingLog.join("<br>");
}
