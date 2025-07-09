/*
 * Smart Greenhouse IoT Controller - Simplified Version
 * ESP32-based system for monitoring and controlling greenhouse environment
 * No external library dependencies except WiFi, HTTPClient, DHT, and Servo
 * 
 * Sensors: DHT11, Soil Moisture, LDR, Ultrasonic
 * Actuators: Water Pump, Servo Window Control
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ===========================================
// CONFIGURATION
// ===========================================

// Wi-Fi credentials
const char* ssid = "Holdrine";
const char* password = "@Holdrine";

// Backend server configuration
const char* serverURL = "http://10.139.38.63:5000/api/iot";
const char* deviceId = "ESP32_GREENHOUSE_001";

// Sensor pin definitions
#define DHT_PIN           4
#define DHT_TYPE          DHT11
#define SOIL_MOISTURE_PIN 34    // Analog pin
#define LDR_PIN           35    // Analog pin
#define ULTRASONIC_TRIG   12
#define ULTRASONIC_ECHO   14

// Actuator pin definitions
#define WATER_PUMP_RELAY  26
#define SERVO_WINDOW_PIN  27

// Operational thresholds
#define SOIL_MOISTURE_THRESHOLD  500   // Below this = dry soil
#define LIGHT_THRESHOLD         2000   // Below this = low light
#define WATER_LEVEL_MIN           10   // Minimum water level (cm)
#define TEMP_MAX                  35   // Maximum temperature (°C)

// Timing constants
#define SENSOR_READ_INTERVAL     5000  // 5 seconds
#define SERVER_SEND_INTERVAL    15000  // 15 seconds
#define PUMP_MIN_RUN_TIME        5000  // Minimum pump run time

// ===========================================
// GLOBAL VARIABLES
// ===========================================

DHT dht(DHT_PIN, DHT_TYPE);
Servo windowServo;

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastServerSend = 0;
unsigned long pumpStartTime = 0;

// Sensor data
float temperature = 0;
float humidity = 0;
int soilMoisture = 0;
int lightLevel = 0;
int waterLevel = 0;

// Device states
bool pumpRunning = false;
bool windowOpen = false;

// ===========================================
// SETUP
// ===========================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== 🌱 Smart Greenhouse Controller Starting ===");
  
  // Initialize sensors
  dht.begin();
  pinMode(ULTRASONIC_TRIG, OUTPUT);
  pinMode(ULTRASONIC_ECHO, INPUT);
  
  // Initialize actuators
  pinMode(WATER_PUMP_RELAY, OUTPUT);
  digitalWrite(WATER_PUMP_RELAY, HIGH); // Relay OFF (active low)
  
  windowServo.attach(SERVO_WINDOW_PIN);
  windowServo.write(0); // Start with window closed
  delay(500);
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("=== ✅ Setup Complete ===\n");
}

// ===========================================
// MAIN LOOP
// ===========================================

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readAllSensors();
    printSensorData();
    controlActuators();
    lastSensorRead = currentTime;
  }
  
  // Send to server less frequently
  if (currentTime - lastServerSend >= SERVER_SEND_INTERVAL) {
    sendDataToServer();
    lastServerSend = currentTime;
  }
  
  // Handle minimum pump run time
  handlePumpControl(currentTime);
  
  delay(100);
}

// ===========================================
// SENSOR FUNCTIONS
// ===========================================

void readAllSensors() {
  // Read DHT11 sensor
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Read analog sensors
  soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  lightLevel = analogRead(LDR_PIN);
  
  // Read ultrasonic sensor
  waterLevel = readUltrasonicDistance();
  
  // Validate readings
  if (isnan(temperature)) temperature = -999;
  if (isnan(humidity)) humidity = -999;
  if (waterLevel < 0) waterLevel = -999;
}

int readUltrasonicDistance() {
  // Trigger pulse
  digitalWrite(ULTRASONIC_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG, LOW);
  
  // Read echo pulse
  long duration = pulseIn(ULTRASONIC_ECHO, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return -1;
  }
  
  // Convert to distance (cm)
  return duration * 0.034 / 2;
}

// ===========================================
// ACTUATOR CONTROL
// ===========================================

void controlActuators() {
  // Auto water pump control based on soil moisture
  if (soilMoisture < SOIL_MOISTURE_THRESHOLD && !pumpRunning) {
    startWaterPump();
  }
  
  // Auto window control based on temperature and light
  bool shouldOpenWindow = (temperature > TEMP_MAX && temperature != -999) || 
                          (lightLevel < LIGHT_THRESHOLD);
  
  if (shouldOpenWindow && !windowOpen) {
    openWindow();
  } else if (!shouldOpenWindow && windowOpen) {
    closeWindow();
  }
}

void startWaterPump() {
  Serial.println("💧 Starting water pump");
  digitalWrite(WATER_PUMP_RELAY, LOW); // Turn ON (active low)
  pumpRunning = true;
  pumpStartTime = millis();
}

void stopWaterPump() {
  Serial.println("💧 Stopping water pump");
  digitalWrite(WATER_PUMP_RELAY, HIGH); // Turn OFF
  pumpRunning = false;
}

void handlePumpControl(unsigned long currentTime) {
  if (pumpRunning && (currentTime - pumpStartTime >= PUMP_MIN_RUN_TIME)) {
    int currentMoisture = analogRead(SOIL_MOISTURE_PIN);
    if (currentMoisture >= SOIL_MOISTURE_THRESHOLD) {
      stopWaterPump();
    }
  }
}

void openWindow() {
  Serial.println("🪟 Opening window");
  windowServo.write(90);
  windowOpen = true;
  delay(500);
}

void closeWindow() {
  Serial.println("🪟 Closing window");
  windowServo.write(0);
  windowOpen = false;
  delay(500);
}

// ===========================================
// COMMUNICATION FUNCTIONS
// ===========================================

void connectToWiFi() {
  Serial.print("🌐 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("📍 IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected, skipping server update");
    return;
  }
  
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload manually (no ArduinoJson library needed)
  String jsonPayload = "{";
  jsonPayload += "\"deviceId\":\"" + String(deviceId) + "\",";
  jsonPayload += "\"timestamp\":" + String(millis()) + ",";
  jsonPayload += "\"sensors\":{";
  jsonPayload += "\"temperature\":" + String(temperature, 2) + ",";
  jsonPayload += "\"humidity\":" + String(humidity, 2) + ",";
  jsonPayload += "\"soilMoisture\":" + String(soilMoisture) + ",";
  jsonPayload += "\"lightLevel\":" + String(lightLevel) + ",";
  jsonPayload += "\"waterLevel\":" + String(waterLevel);
  jsonPayload += "},";
  jsonPayload += "\"actuators\":{";
  jsonPayload += "\"waterPump\":" + String(pumpRunning ? "true" : "false") + ",";
  jsonPayload += "\"window\":" + String(windowOpen ? "true" : "false");
  jsonPayload += "},";
  jsonPayload += "\"status\":{";
  jsonPayload += "\"wifiSignal\":" + String(WiFi.RSSI()) + ",";
  jsonPayload += "\"uptime\":" + String(millis() / 1000);
  jsonPayload += "}";
  jsonPayload += "}";
  
  Serial.println("📤 Sending data to server...");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✅ Server response: %d\n", httpResponseCode);
    
    if (httpResponseCode == 200) {
      handleServerResponse(response);
    }
  } else {
    Serial.printf("❌ HTTP error: %d\n", httpResponseCode);
  }
  
  http.end();
}

void handleServerResponse(String response) {
  Serial.println("📥 Server response: " + response);
  
  // Simple JSON parsing for commands (basic string search)
  if (response.indexOf("\"waterPump\":true") > 0 && !pumpRunning) {
    startWaterPump();
    Serial.println("🔄 Remote command: Start water pump");
  } else if (response.indexOf("\"waterPump\":false") > 0 && pumpRunning) {
    stopWaterPump();
    Serial.println("🔄 Remote command: Stop water pump");
  }
  
  if (response.indexOf("\"window\":true") > 0 && !windowOpen) {
    openWindow();
    Serial.println("🔄 Remote command: Open window");
  } else if (response.indexOf("\"window\":false") > 0 && windowOpen) {
    closeWindow();
    Serial.println("🔄 Remote command: Close window");
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

void printSensorData() {
  Serial.println("\n==== 📊 Sensor Readings ====");
  if (temperature != -999) {
    Serial.printf("🌡️  Temperature: %.2f°C\n", temperature);
  } else {
    Serial.println("🌡️  Temperature: ERROR");
  }
  
  if (humidity != -999) {
    Serial.printf("💧 Humidity: %.2f%%\n", humidity);
  } else {
    Serial.println("💧 Humidity: ERROR");
  }
  
  Serial.printf("🌱 Soil Moisture: %d\n", soilMoisture);
  Serial.printf("☀️  Light Level: %d\n", lightLevel);
  
  if (waterLevel != -999) {
    Serial.printf("🚰 Water Level: %d cm\n", waterLevel);
  } else {
    Serial.println("🚰 Water Level: ERROR");
  }
  
  Serial.println("\n==== 🔧 Actuator Status ====");
  Serial.printf("💧 Water Pump: %s\n", pumpRunning ? "ON" : "OFF");
  Serial.printf("🪟 Window: %s\n", windowOpen ? "OPEN" : "CLOSED");
  
  Serial.printf("📶 WiFi Signal: %d dBm\n", WiFi.RSSI());
  Serial.printf("⏱️  Uptime: %lu seconds\n", millis() / 1000);
  Serial.println("========================\n");
}
