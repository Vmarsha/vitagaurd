/*
  VitaGuard ESP32 Firmware
  -------------------------
  Reads:
    - MAX30102  -> Heart Rate + SpO2      (I2C, addr 0x57)
    - DS18B20   -> Body Temperature       (1-Wire)
    - MPU6050   -> Fall Detection         (I2C, addr 0x68)
    - AD8232    -> Raw ECG waveform       (Analog)

  Sends a JSON payload over WiFi (HTTP POST) to the VitaGuard
  receiver server every SEND_INTERVAL_MS.

  REQUIRED LIBRARIES (install via Arduino Library Manager):
    - SparkFun MAX3010x Pulse and Proximity Sensor Library
    - Adafruit MPU6050
    - Adafruit Unified Sensor
    - OneWire
    - DallasTemperature
    - ArduinoJson
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

#include "MAX30105.h"
#include "spo2_algorithm.h"

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#include <OneWire.h>
#include <DallasTemperature.h>

// ---------------- CONFIG ----------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Point this at the machine running the FastAPI receiver server.
// Example: "http://192.168.1.50:8000/api/hardware/ingest"
const char* SERVER_URL    = "http://192.168.1.50:8000/api/hardware/ingest";

const char* DEVICE_ID     = "esp32_bed01";
// Optional: pre-link this device to a patient ID from your dataset/app.
const char* PATIENT_ID    = "PT1000";

const unsigned long SEND_INTERVAL_MS = 2000;

// ECG analog pin (AD8232 OUTPUT)
#define ECG_PIN 34
// AD8232 leads-off detect pins (optional, tie to digital pins if wired)
#define LO_PLUS_PIN  32
#define LO_MINUS_PIN 33

// DS18B20 data pin
#define ONE_WIRE_BUS 4

// Fall detection thresholds (in g)
#define FREE_FALL_THRESHOLD 0.4   // near-zero g = free fall
#define IMPACT_THRESHOLD    2.5   // sudden spike = impact
#define FALL_WINDOW_MS      1000  // impact must follow free-fall within this window

// ---------------- OBJECTS ----------------
MAX30105 particleSensor;
Adafruit_MPU6050 mpu;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

// MAX30102 buffers
#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];
int32_t spo2Value;
int8_t spo2Valid;
int32_t heartRateValue;
int8_t hrValid;

// Fall detection state
bool inFreeFall = false;
unsigned long freeFallTime = 0;
bool fallDetected = false;

unsigned long lastSendTime = 0;

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  Wire.begin();

  connectWiFi();

  // MAX30102 init
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring.");
  } else {
    particleSensor.setup(); // default settings: HR + SpO2 mode
  }

  // MPU6050 init
  if (!mpu.begin()) {
    Serial.println("MPU6050 not found. Check wiring.");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // DS18B20 init
  tempSensor.begin();

  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(LO_MINUS_PIN, INPUT);

  Serial.println("VitaGuard ESP32 node ready.");
}

// ---------------- WIFI ----------------
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
}

// ---------------- SENSOR READS ----------------

// Blocking-ish read of HR/SpO2 using the SparkFun algorithm.
// For a hackathon build this is called periodically; for production
// consider running this on a separate FreeRTOS task.
void readHeartRateSpo2() {
  for (int i = 0; i < BUFFER_SIZE; i++) {
    while (!particleSensor.available()) particleSensor.check();
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i]  = particleSensor.getIR();
    particleSensor.nextSample();
  }

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer, BUFFER_SIZE, redBuffer,
    &spo2Value, &spo2Valid, &heartRateValue, &hrValid
  );
}

float readTemperature() {
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);
  if (tempC == DEVICE_DISCONNECTED_C) return -1.0;
  return (tempC * 9.0 / 5.0) + 32.0; // Fahrenheit, matches existing dataset scale
}

int readECG() {
  // If leads are off, AD8232 pulls these HIGH
  if (digitalRead(LO_PLUS_PIN) == 1 || digitalRead(LO_MINUS_PIN) == 1) {
    return -1; // leads off / no signal
  }
  return analogRead(ECG_PIN);
}

void checkFallDetection() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float ax = a.acceleration.x / 9.81;
  float ay = a.acceleration.y / 9.81;
  float az = a.acceleration.z / 9.81;
  float magnitude = sqrt(ax * ax + ay * ay + az * az);

  if (magnitude < FREE_FALL_THRESHOLD) {
    inFreeFall = true;
    freeFallTime = millis();
  }

  if (inFreeFall && magnitude > IMPACT_THRESHOLD) {
    if (millis() - freeFallTime <= FALL_WINDOW_MS) {
      fallDetected = true;
    }
    inFreeFall = false;
  }

  // Reset the free-fall flag if too much time has passed without impact
  if (inFreeFall && (millis() - freeFallTime > FALL_WINDOW_MS)) {
    inFreeFall = false;
  }
}

// ---------------- SEND ----------------
void sendData(float tempF, int ecgRaw) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, skipping send.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["patient_id"]  = PATIENT_ID;
  doc["heart_rate"]  = hrValid ? heartRateValue : -1;
  doc["spo2"]        = spo2Valid ? spo2Value : -1;
  doc["temperature"] = tempF;
  doc["ecg_raw"]      = ecgRaw;
  doc["fall_detected"] = fallDetected;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  Serial.printf("POST -> %d | %s\n", httpCode, payload.c_str());

  http.end();

  // Clear fall flag after reporting once
  fallDetected = false;
}

// ---------------- LOOP ----------------
void loop() {
  checkFallDetection();

  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    readHeartRateSpo2();
    float tempF = readTemperature();
    int ecgRaw = readECG();

    sendData(tempF, ecgRaw);
  }
}
