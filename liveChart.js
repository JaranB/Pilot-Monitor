var monitorID = 0;

var config = {
  apiKey: "AIzaSyC3cYr5qKk1nXNAkdPCzMAoXkam7AaDjQg",
  authDomain: "m2meksamen-77037.firebaseapp.com",
  databaseURL: "https://m2meksamen-77037.firebaseio.com/",
  projectId: "m2meksamen-77037",
  storageBucket: "m2meksamen-77037.appspot.com",
  messagingSenderId: "js"
};
firebase.initializeApp(config);

var MQTTbroker = "m21.cloudmqtt.com";
var MQTTport = 38058;
var MQTTsubTopicXAxis = "pilotMonitor/" + monitorID + "/XAxis";
var MQTTsubTopicYAxis = "pilotMonitor/" + monitorID + "/YAxis";
var MQTTsubTopicZAxis = "pilotMonitor/" + monitorID + "/ZAxis";
var MQTTsubTopicBPI = "pilotMonitor/" + monitorID + "/BPI";
var MQTTsubTopicOnOff = "pilotMonitor/" + monitorID + "/onOff";
var MQTTsubTopicPulseRawData = "pilotMonitor/" + monitorID + "/pulseRawData";
var MQTTsubTopicWarnings = "pilotMonitor/" + monitorID + "/warnings";

var today = new Date();
var time =
  today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var date =
  today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
var timeAndDate = date + " " + time;

var chartXYZ;
var chartHearth;
var dataTopicsXYZ = new Array();
var dataTopicsHearth = new Array();

var isRunning = 0;
var runOnce = 1;
var sessionStart = "";

var xInc = 0;
var yInc = 0;
var zInc = 0;
var bpmInc = 0;
var pulseRawDataInc = 0;
var warningInc = 0;

var client = new Paho.MQTT.Client(
  MQTTbroker,
  MQTTport,
  "myclientid_" + parseInt(Math.random() * 100, 10)
);
client.onMessageArrived = onMessageArrived;
client.onConnectionLost = onConnectionLost;

var options = {
  timeout: 3,
  userName: "UserRead",
  password: "Pass123",
  useSSL: true,
  onSuccess: function() {
    console.log("mqtt connected");
    client.subscribe(MQTTsubTopicXAxis, { qos: 1 });
    client.subscribe(MQTTsubTopicYAxis, { qos: 1 });
    client.subscribe(MQTTsubTopicZAxis, { qos: 1 });
    client.subscribe(MQTTsubTopicBPI, { qos: 1 });
    client.subscribe(MQTTsubTopicOnOff, { qos: 1 });
    client.subscribe(MQTTsubTopicPulseRawData, { qos: 1 });
    client.subscribe(MQTTsubTopicWarnings, { qos: 1 });
  },
  onFailure: function(message) {
    console.log("Connection failed, ERROR: " + message.errorMessage);
  }
};

function onConnectionLost(responseObject) {}

function addMessageToDB(value, dbfolder) {
  var rootRef = firebase.database().ref();
  var storesRef = rootRef.child(
    "monitor/" + monitorID + "/" + sessionStart + "/" + dbfolder
  );

  today = new Date();
  time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

  if (dbfolder === "XAxis") {
    var finalRef = storesRef.child(xInc);
    finalRef.set({
      xVal: value,
      timeValue: time
    });
    xInc++;
  } else if (dbfolder === "YAxis") {
    var finalRef = storesRef.child(yInc);
    finalRef.set({
      yVal: value,
      timeValue: time
    });
    yInc++;
  } else if (dbfolder === "ZAxis") {
    var finalRef = storesRef.child(zInc);
    finalRef.set({
      zVal: value,
      timeValue: time
    });
    zInc++;
  } else if (dbfolder === "BPI") {
    var finalRef = storesRef.child(bpmInc);
    finalRef.set({
      bpmVal: value,
      timeValue: time
    });
    bpmInc++;
  } else if (dbfolder === "pulseRawData") {
    var finalRef = storesRef.child(pulseRawDataInc);
    finalRef.set({
      rawPulseVal: value,
      timeValue: time
    });
    pulseRawDataInc++;
  } else if (dbfolder === "warnings") {
    var finalRef = storesRef.child(warningInc);
    finalRef.set({
      BPI: value,
      timeValue: time
    });
    warningInc++;
  }
}

function checkStatus(string) {
  if (string.includes("On")) {
    console.log("On");
    isRunning = 1;
  } else if (string.includes("Off")) {
    console.log("Off");
    isRunning = 0;
  }
}

function onMessageArrived(message) {
  checkStatus(message.payloadString);

  if (isRunning) {
    if (runOnce) {
      xInc = 0;
      yInc = 0;
      zInc = 0;
      bpmInc = 0;
      pulseRawDataInc = 0;
      warningInc = 0;

      today = new Date();
      date =
        today.getDate() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getFullYear();
      time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

      sessionStart = date + " " + time;
      runOnce = 0;
    }

    var displayName = message.destinationName.substr(
      message.destinationName.lastIndexOf("/") + 1
    );

    if (
      message.destinationName.includes("XAxis") ||
      message.destinationName.includes("YAxis") ||
      message.destinationName.includes("ZAxis")
    ) {
      if (dataTopicsXYZ.indexOf(message.destinationName) < 0) {
        dataTopicsXYZ.push(message.destinationName);
        var y = dataTopicsXYZ.indexOf(message.destinationName);
        var newseries = {
          id: y,
          name: displayName,
          data: []
        };
        chartXYZ.addSeries(newseries);
      }
      var y = dataTopicsXYZ.indexOf(message.destinationName);
      var myEpoch = new Date().getTime();
      var thenum = message.payloadString.replace(/^\D+/g, "");
      var plotMqtt = [myEpoch, Number(thenum)];
      if (isNumber(thenum)) {
        plotXYZGraph(plotMqtt, y);
        if (sessionStart != "") {
          addMessageToDB(thenum, displayName);
        }
      }
    } else if (
      message.destinationName.includes("BPI") ||
      message.destinationName.includes("pulseRawData") ||
      message.destinationName.includes("warnings")
    ) {
      if (!message.destinationName.includes("warnings")) {
        if (dataTopicsHearth.indexOf(message.destinationName) < 0) {
          dataTopicsHearth.push(message.destinationName);
          var y = dataTopicsHearth.indexOf(message.destinationName);

          var displayName = message.destinationName.substr(
            message.destinationName.lastIndexOf("/") + 1
          );
          var newseries = {
            id: y,
            name: displayName,
            data: []
          };

          chartHearth.addSeries(newseries);
        }
      }
      var y = dataTopicsHearth.indexOf(message.destinationName);
      var myEpoch = new Date().getTime();
      var thenum = message.payloadString.replace(/^\D+/g, "");
      var plotMqtt = [myEpoch, Number(thenum)];
      if (isNumber(thenum)) {
        if (!message.destinationName.includes("warnings")) {
          plotHearthGraph(plotMqtt, y);
        }
        if (sessionStart != "") {
          addMessageToDB(thenum, displayName);
        }
      }
    }
  } else {
    runOnce = 1;
    sessionStart = "";
  }
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function init() {
  Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });
  client.connect(options);
}

function plotXYZGraph(point, chartno) {
  var series = chartXYZ.series[0],
    shift = series.data.length > 60;
  chartXYZ.series[chartno].addPoint(point, true, shift);
}

function plotHearthGraph(point, chartno) {
  var series = chartHearth.series[0],
    shift = series.data.length > 60;
  chartHearth.series[chartno].addPoint(point, true, shift);
}

$(document).ready(function() {
  chartXYZ = new Highcharts.Chart({
    chart: {
      renderTo: "chartOne"
    },
    title: {
      text: "Accelerometer data"
    },
    plotOptions: {
      line: {
        marker: {
          enabled: false
        }
      }
    },
    xAxis: {
      type: "datetime",
      tickPixelInterval: 150,
      maxZoom: 20 * 1000
    },
    yAxis: {
      minPadding: 0.2,
      maxPadding: 0.2,
      title: {
        text: "Accelerometer values",
        margin: 80
      }
    },
    series: []
  });
});

$(document).ready(function() {
  chartHearth = new Highcharts.Chart({
    chart: {
      renderTo: "chartTwo"
    },
    title: {
      text: "Heartbeat data"
    },
    plotOptions: {
      line: {
        marker: {
          enabled: false
        }
      }
    },
    xAxis: {
      type: "datetime",
      tickPixelInterval: 150,
      maxZoom: 20 * 1000
    },
    yAxis: {
      minPadding: 0.2,
      maxPadding: 0.2,
      title: {
        text: "Hearthbeat sensor values",
        margin: 80
      }
    },
    series: []
  });
});
