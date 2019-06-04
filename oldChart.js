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

var ref = firebase.database().ref("monitor/" + monitorID);

var storedData = [];
var activeGraph = 0;

firebase
  .database()
  .ref("monitor/" + monitorID)
  .on("value", function(snapshot) {
    storedData = snapshotToArray(snapshot);
    loopData();
  });

function loopData() {
  setData(0);
  for (var i = 0; i < storedData.length; i++) {
    var btnName = storedData[i].key;
    var btn = document.createElement("BUTTON");
    var t = document.createTextNode(btnName);
    btn.appendChild(t);
    btn.name = i;
    btn.style.cssText = "margin: 5px";
    btn.addEventListener("click", function(e) {
      deleteSeries();
      setData(e.target.name);
    });

    var element = document.getElementById("buttons");
    element.appendChild(btn);
  }
}

function setData(index) {
  if (storedData[index].XAxis) {
    storedData[index].XAxis.forEach(function(entry) {
      var thenum = entry["xVal"].replace(/^\D+/g, "");
      plotMovement(parseInt(thenum, 10), 0);
    });
  }
  if (storedData[index].YAxis) {
    storedData[index].YAxis.forEach(function(entry) {
      var thenum = entry["yVal"].replace(/^\D+/g, "");
      plotMovement(parseInt(thenum, 10), 1);
    });
  }
  if (storedData[index].ZAxis) {
    storedData[index].ZAxis.forEach(function(entry) {
      var thenum = entry["zVal"].replace(/^\D+/g, "");
      plotMovement(parseInt(thenum, 10), 2);
    });
  }
  if (storedData[index].BPI) {
    storedData[index].BPI.forEach(function(entry) {
      var thenum = entry["bpmVal"].replace(/^\D+/g, "");
      plotHearth(parseInt(thenum, 10), 0);
    });
  }
  if (storedData[index].pulseRawData) {
    storedData[index].pulseRawData.forEach(function(entry) {
      var thenum = entry["rawPulseVal"].replace(/^\D+/g, "");
      plotHearth(parseInt(thenum, 10), 1);
    });
  }
}

function snapshotToArray(snapshot) {
  var returnArr = [];

  snapshot.forEach(function(childSnapshot) {
    var item = childSnapshot.val();
    item.key = childSnapshot.key;

    returnArr.push(item);
  });

  return returnArr;
}

function deleteSeries() {
  var XYZLength = oldChartXYZ.series.length;
  for (var i = 0; i < XYZLength; i++) {
    oldChartXYZ.series[0].remove();
  }

  var HearthLength = oldChartHearth.series.length;
  for (var i = 0; i < HearthLength; i++) {
    oldChartHearth.series[0].remove();
  }

  var xSeries = {
    id: 0,
    name: "XAxis",
    data: []
  };
  var ySeries = {
    id: 1,
    name: "YAxis",
    data: []
  };
  var zSeries = {
    id: 2,
    name: "ZAxis",
    data: []
  };
  oldChartXYZ.addSeries(xSeries);
  oldChartXYZ.addSeries(ySeries);
  oldChartXYZ.addSeries(zSeries);

  var bpiSeries = {
    id: 0,
    name: "BPI",
    data: []
  };
  var rawPulseDataSeries = {
    id: 1,
    name: "rawPulseData",
    data: []
  };
  oldChartHearth.addSeries(bpiSeries);
  oldChartHearth.addSeries(rawPulseDataSeries);
}

function plotMovement(point, chartno) {
  oldChartXYZ.series[chartno].addPoint(point, true);
}

function plotHearth(point, chartno) {
  oldChartHearth.series[chartno].addPoint(point, true);
}

$(document).ready(function() {
  oldChartXYZ = new Highcharts.Chart({
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
      type: "none",
      tickPixelInterval: 150,
      maxZoom: 20
    },
    yAxis: {
      minPadding: 0.2,
      maxPadding: 0.2,
      title: {
        text: "Accelerometer values",
        margin: 80
      }
    },
    series: [
      { id: 0, name: "XAxis", data: [] },
      { id: 1, name: "YAxis", data: [] },
      { id: 2, name: "ZAxis", data: [] }
    ]
  });
});

$(document).ready(function() {
  oldChartHearth = new Highcharts.Chart({
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
      maxZoom: 20
    },
    yAxis: {
      minPadding: 0.2,
      maxPadding: 0.2,
      title: {
        text: "Hearthbeat sensor values",
        margin: 80
      }
    },
    series: [
      { id: 0, name: "BPI", data: [] },
      { id: 1, name: "rawPulseData", data: [] }
    ]
  });
});
