# VitaGuard Hardware Integration — Setup Guide

## 1. Bill of Materials

| Component | Purpose | Interface | Approx. Price (India) |
|---|---|---|---|
| ESP32 Dev Board (WROOM-32) | Main microcontroller + WiFi | — | ₹350–500 |
| MAX30102 | Heart rate + SpO2 | I2C | ₹150–250 |
| DS18B20 | Body temperature | 1-Wire | ₹80–150 |
| MPU6050 | Accelerometer for fall detection | I2C | ₹100–150 |
| AD8232 | ECG front-end + electrode pads | Analog | ₹300–450 |
| Breadboard + jumper wires | Prototyping | — | ₹150 |
| 4.7kΩ resistor | DS18B20 pull-up | — | negligible |

## 2. Wiring

**I2C bus (shared by MAX30102 + MPU6050):**
- SDA → GPIO 21
- SCL → GPIO 22
- VCC → 3.3V, GND → GND

**DS18B20 (1-Wire):**
- Data → GPIO 4 (with 4.7kΩ pull-up resistor between Data and 3.3V)
- VCC → 3.3V, GND → GND

**AD8232 (ECG):**
- OUTPUT → GPIO 34 (ADC1 channel, input-only pin, safe for analog read)
- LO+ → GPIO 32
- LO− → GPIO 33
- VCC → 3.3V, GND → GND
- Electrode placement: standard 3-lead (RA, LA, RL) on limbs or chest per AD8232 module instructions

> ⚠️ ESP32 ADC pins are 3.3V max — never feed 5V sensor output directly into an ADC pin.

## 3. Software Setup

### A. Arduino IDE (ESP32 firmware)
1. Install ESP32 board support in Arduino IDE (Boards Manager → search "esp32").
2. Install libraries via Library Manager:
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
   - `Adafruit MPU6050` + `Adafruit Unified Sensor`
   - `OneWire`
   - `DallasTemperature`
   - `ArduinoJson`
3. Open `firmware/vitaguard_esp32.ino`.
4. Edit these lines at the top with your actual values:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* SERVER_URL    = "http://192.168.1.50:8000/ingest"; // your laptop's IP
   ```
5. Flash to the ESP32. Open Serial Monitor (115200 baud) to confirm WiFi connects and POSTs succeed.

### B. Receiver server (runs on your laptop, same WiFi network as the ESP32)
```bash
pip install fastapi uvicorn
cd server
uvicorn hardware_receiver:app --host 0.0.0.0 --port 8000
```
Find your laptop's local IP (`ipconfig` on Windows, `ifconfig`/`ip addr` on Mac/Linux) and use that in the ESP32's `SERVER_URL`.

Test it's working:
```bash
curl http://localhost:8000/
```

### C. Streamlit app
1. Copy `pages/live_monitoring.py` into your existing app's `pages/` folder (Streamlit auto-detects multipage apps from a `pages/` directory).
2. Add to `requirements.txt`: `requests`, `fastapi`, `uvicorn`
3. Run the app as usual: `streamlit run app.py`
4. Open the new **Live Hardware Monitoring** page from the sidebar, enter the receiver server URL (`http://localhost:8000` if same machine), and device ID (`esp32_bed01` by default).

## 4. Data Flow

```
ESP32 (sensors)
   │  HTTP POST /ingest every 2s
   ▼
FastAPI receiver server
   │  stores latest reading in memory
   │  appends every reading to live_vitals_log.csv
   ▼
Streamlit "Live Hardware Monitoring" page
   │  polls GET /latest/{device_id}
   │  "Use This Live Reading" button
   ▼
Existing model.pkl prediction pipeline (Ai_risk_analysis.py)
```

## 5. Known Limitations / Next Steps for Your Report

- The trained model (`train_model.py`) doesn't use ECG or fall data as features — only vitals it was trained on (age, heart rate, SpO2, temp, resp rate, BP). ECG/fall are shown for clinical context but not yet fed into the classifier. A good "future work" section: retrain including fall_detected as a binary feature.
- MAX30102 heart rate/SpO2 algorithm needs a finger placed steadily on the sensor for ~5–10s to stabilize; expect noisy readings otherwise — worth mentioning in your demo/report as a real-world limitation.
- The receiver server is single-process/in-memory; fine for a hackathon demo with 1–2 devices. For anything more, swap the CSV log for SQLite.
- Add HTTPS + an API key/shared secret on `/ingest` before this leaves a lab bench — right now anyone on the network can POST fake vitals.


## Final hardware decision
This version does not require a smartwatch or a BP monitor. The ESP32 prototype collects heart rate/SpO₂, temperature, ECG waveform data, and motion/fall events. Blood pressure and respiratory rate are entered as clinical inputs when running the current ML model because the selected model expects those features. Do not connect an upper-arm BP monitor directly to the ESP32 unless a verified data interface is available.

## Safety
Power down USB before changing wiring. Never apply 5 V directly to an ESP32 GPIO. Verify the exact breakout-board pin labels before wiring. The AD8232 should only be used according to its module documentation and not with unsafe mains-connected setups.
