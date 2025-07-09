# IoT Device Integration Guide

This guide explains how to integrate your actual IoT devices (ESP32 with DHT11, LDR, and Soil Moisture sensors) with the Smart Greenhouse system.

## API Endpoints for IoT Devices

### 1. Send Sensor Data

**Endpoint:** `POST /api/iot/sensor-data`

**Headers:**
```
Content-Type: application/json
```

**Body for DHT11 (Temperature & Humidity):**
```json
{
  "deviceId": "esp32-001",
  "sensorType": "DHT11",
  "temperature": 25.3,
  "humidity": 65.2,
  "greenhouseId": "greenhouse-001",
  "location": "Main Greenhouse"
}
```

**Body for LDR (Light Sensor):**
```json
{
  "deviceId": "esp32-002", 
  "sensorType": "LDR",
  "lightIntensity": 450,
  "greenhouseId": "greenhouse-001",
  "location": "Main Greenhouse"
}
```

**Body for Soil Moisture:**
```json
{
  "deviceId": "esp32-003",
  "sensorType": "SOIL_MOISTURE", 
  "soilMoisture": 75.8,
  "greenhouseId": "greenhouse-001",
  "location": "Main Greenhouse"
}
```

### 2. Report Device Status

**Endpoint:** `POST /api/iot/device-status`

**Body:**
```json
{
  "deviceId": "pump-001",
  "status": "ON",
  "intensity": 80,
  "powerConsumption": 45,
  "lastActivated": "2025-07-09T10:30:00Z"
}
```

### 3. Get Device Commands

**Endpoint:** `GET /api/iot/device-commands/{deviceId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ON",
    "intensity": 75,
    "autoMode": true,
    "automationRules": {
      "temperatureHigh": 30,
      "soilMoistureLow": 40
    },
    "lastUpdate": "2025-07-09T10:25:00Z"
  }
}
```

### 4. Send Bulk Data (Multiple Sensors)

**Endpoint:** `POST /api/iot/bulk-data`

**Body:**
```json
{
  "readings": [
    {
      "deviceId": "esp32-001",
      "sensorType": "DHT11", 
      "temperature": 25.3,
      "humidity": 65.2,
      "timestamp": "2025-07-09T10:30:00Z"
    },
    {
      "deviceId": "esp32-002",
      "sensorType": "LDR",
      "lightIntensity": 450,
      "timestamp": "2025-07-09T10:30:00Z"
    }
  ]
}
```

## ESP32 Integration Example

### Arduino Code Structure

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverURL = "http://YOUR_SERVER_IP:5000/api/iot/sensor-data";

// Sensor pins
#define DHT_PIN 4
#define LDR_PIN A0
#define SOIL_MOISTURE_PIN A1
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");
}

void loop() {
  // Read DHT11 sensor
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (!isnan(temperature) && !isnan(humidity)) {
    sendDHTData(temperature, humidity);
  }
  
  // Read LDR sensor
  int lightValue = analogRead(LDR_PIN);
  float lightIntensity = map(lightValue, 0, 4095, 0, 1024);
  sendLDRData(lightIntensity);
  
  // Read soil moisture
  int soilValue = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = map(soilValue, 0, 4095, 0, 100);
  sendSoilMoistureData(soilMoisture);
  
  delay(30000); // Send data every 30 seconds
}

void sendDHTData(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["deviceId"] = "esp32-dht11";
    doc["sensorType"] = "DHT11";
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["greenhouseId"] = "greenhouse-001";
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.printf("DHT Data sent: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error sending DHT data: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
  }
}

void sendLDRData(float lightLevel) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["deviceId"] = "esp32-ldr";
    doc["sensorType"] = "LDR";
    doc["lightIntensity"] = lightLevel;
    doc["greenhouseId"] = "greenhouse-001";
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.printf("LDR Data sent: %d\n", httpResponseCode);
    }
    
    http.end();
  }
}

void sendSoilMoistureData(float moisture) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["deviceId"] = "esp32-soil";
    doc["sensorType"] = "SOIL_MOISTURE";
    doc["soilMoisture"] = moisture;
    doc["greenhouseId"] = "greenhouse-001";
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.printf("Soil Data sent: %d\n", httpResponseCode);
    }
    
    http.end();
  }
}
```

## Device Control Integration

Your devices can also check for commands from the system:

```cpp
void checkDeviceCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://YOUR_SERVER_IP:5000/api/iot/device-commands/water-pump-001";
    http.begin(url);
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      
      StaticJsonDocument<300> doc;
      deserializeJson(doc, response);
      
      if (doc["success"]) {
        String status = doc["data"]["status"];
        int intensity = doc["data"]["intensity"];
        
        // Control your devices based on commands
        if (status == "ON") {
          // Turn on water pump
          digitalWrite(PUMP_PIN, HIGH);
        } else {
          // Turn off water pump
          digitalWrite(PUMP_PIN, LOW);
        }
      }
    }
    
    http.end();
  }
}
```

## Required Libraries for ESP32

Install these libraries in Arduino IDE:
- WiFi (built-in)
- HTTPClient (built-in)
- ArduinoJson by Benoit Blanchon
- DHT sensor library by Adafruit
- Adafruit Unified Sensor

## Network Configuration

1. Ensure your ESP32 and server are on the same network
2. Replace `YOUR_SERVER_IP` with your actual server IP address
3. If running locally, use `192.168.x.x` (your computer's local IP)
4. For production, use your domain name or public IP

## Data Validation

The system automatically validates:
- Temperature: -40°C to 80°C
- Humidity: 0% to 100%
- Light Intensity: 0 to 1024 lux
- Soil Moisture: 0% to 100%

## Error Handling

- The system will return appropriate HTTP status codes
- Check response codes in your ESP32 code
- Implement retry logic for failed requests
- Monitor serial output for debugging

## Testing Your Integration

1. Start the backend server (`npm run dev` in backend folder)
2. Start the frontend (`npm start` in frontend folder)
3. Upload your ESP32 code
4. Monitor the dashboard for incoming sensor data
5. Check browser console and ESP32 serial monitor for any errors

## Automation Features

Once your devices are sending data, the system will:
- Automatically create alerts when thresholds are exceeded
- Send real-time updates to the dashboard
- Store historical data for analytics
- Enable automated device control based on sensor readings
