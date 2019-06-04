#include <MQTT.h>

int monitorID = 0; //Set the monitor ID here
int timeToWaitBPI = 10; // The amount of seconds to wait between each time sending BPI the to cloud
int timeToWaitSendData = 1; // The amount of seconds to wait between each time sending data to cloud
int plusMinusBeats = 2; //The amount of beats the BPI can go in pluss or minus before sending a warning

int pulseSensorValue = 0; //The value from the heart beat monitor pads
int valX, valY, valZ; //Raw analog values for x, y, and z axis readings.
int date;
int hour = 0;
int minute = 0;
int second = 0;
int tempHour = 0;
int tempMinute = 0;
int tempSecond = 0;
int targetTimeBPI = 0;
int targetTimeSendData = 0;

int maxBPI = 0; // The top threshold before sending a warning
int minBPI = 0; // The lower threshold before sending a warning
int beats = 0;
int compareBPI = 0;

bool getCurrentTimeBPI = true;
bool getCurrentTimeSendData = true;
bool count = false;
bool newBeat = false;
bool setBPIToCompare = true;
bool gettingBeats = false;

const int startButtonPin = D4;
const int stopButtonPin = D5;

int startButtonState = 0;
int stopButtonState = 0;
bool sendData = false;

const unsigned long PUBLISH_PERIOD_MS = 60000;
const unsigned long FIRST_PUBLISH_MS = 5000;
unsigned long lastPublish = FIRST_PUBLISH_MS - PUBLISH_PERIOD_MS;

MQTT client("m21.cloudmqtt.com", 18058, callback);

void setup() {
  pinMode(startButtonPin, INPUT);
  pinMode(stopButtonPin, INPUT);
  pinMode(D0, INPUT); // Setup for leads off detection LO +
  pinMode(D1, INPUT); // Setup for leads off detection LO -
  Serial.begin(9600);
  Time.zone(+2);

  client.connect("Monitor-Client-" + String(monitorID), "UserWrite", "Pass123"); // Connecting to MQTT server
}

void loop() {

  startButtonState = digitalRead(startButtonPin);
  stopButtonState = digitalRead(stopButtonPin);

  setTimeAndDate();
  checkTimer();

  if (startButtonState == HIGH) {
    client.publish("pilotMonitor/" + String(monitorID) + "/onOff", "On");
    sendData = true;
    delay(1000);
  }

  if (stopButtonState == HIGH) {
    client.publish("pilotMonitor/" + String(monitorID) + "/onOff", "Off");
    sendData = false;
    delay(1000);
  }

  if ((digitalRead(D0) == 1) || (digitalRead(D1) == 1)) {
    gettingBeats = false;
  } else {
    pulseSensorValue = analogRead(A4);
    gettingBeats = true;
  }
  delay(1);

  if (!gettingBeats) {
    if (millis() - lastPublish >= PUBLISH_PERIOD_MS) {
      lastPublish = millis();
      Serial.println("No beats");
    }
  } else {
    countBeats();
  }

  if (client.isConnected())
    client.loop();

}

void callback(char* topic, byte* payload, unsigned int length) {

}

void setTimeAndDate() {
  date = Time.format("%Y%m%d").toInt();
  hour = Time.format("%H").toInt();
  minute = Time.format("%M").toInt();
  second = Time.format("%S").toInt();

  if ((getCurrentTimeBPI) && (gettingBeats)) {
    targetTimeBPI = addTime(timeToWaitBPI);
    getCurrentTimeBPI = false;
    count = true;
  }

  if (getCurrentTimeSendData) {
    targetTimeSendData = addTime(timeToWaitSendData);
    getCurrentTimeSendData = false;
  }
}

void checkTimer() {
  if ((Time.format("%H%M%S").toInt() >= targetTimeBPI) && (!getCurrentTimeBPI)) {
    if (setBPIToCompare) {
      setBPIToCompare = false;
      compareBPI = beats;
      maxBPI = compareBPI + plusMinusBeats;
      minBPI = compareBPI - plusMinusBeats;
    }

    if ((beats >= minBPI) && (beats <= maxBPI)) {
      client.publish("pilotMonitor/" + String(monitorID) + "/BPI", String(beats));
    } else {
      client.publish("pilotMonitor/" + String(monitorID) + "/BPI", String(beats));
      client.publish("pilotMonitor/" + String(monitorID) + "/warnings", String(beats));
    }

    getCurrentTimeBPI = true;
    count = false;
    beats = 0;
  }

  if ((Time.format("%H%M%S").toInt() >= targetTimeSendData) && (!getCurrentTimeSendData)) {
    getCurrentTimeSendData = true;
    if (sendData) {
      valX = analogRead(0);
      valY = analogRead(1);
      valZ = analogRead(2);
      client.publish("pilotMonitor/" + String(monitorID) + "/XAxis", String(valX));
      client.publish("pilotMonitor/" + String(monitorID) + "/YAxis", String(valY));
      client.publish("pilotMonitor/" + String(monitorID) + "/ZAxis", String(valZ));
      if (!pulseSensorValue <= 0) {
        client.publish("pilotMonitor/" + String(monitorID) + "/pulseRawData", String(pulseSensorValue));
      }
    }
  }

}

int addTime(int seconds) {

  tempHour = hour;
  tempMinute = minute;
  tempSecond = second + seconds;

  while (tempSecond > 59) {
    if (tempSecond > 59) {

      int minutesToAdd = 0;
      tempMinute = tempMinute + 1;
      tempSecond = tempSecond - 60;
    }
  }

  while  (tempMinute > 59) {
    if (tempMinute > 59) {
      tempHour = tempHour + 1;
      tempMinute = tempMinute - 60;
    }
  }

  if (tempHour > 23) {
    tempHour = 00;
  }

  char store[5];
  sprintf(store, "%.2d%.2d%.2d", tempHour, tempMinute, tempSecond);
  int combinedTime = atoi(store);

  return combinedTime;

}

void countBeats() {
  if (count) {
    if ((pulseSensorValue > 3250) && (!newBeat)) {
      beats++;
      newBeat = true;
    }
    if (pulseSensorValue < 2600) {
      newBeat = false;
    }
  }
}

