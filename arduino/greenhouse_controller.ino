/*
 * Smart Greenhouse IoT Controller
 * ESP32-based system for monitoring and controlling greenhouse environment
 * 
 * Sensors: DHT11, Soil Moisture, LDR, Ultrasonic
 * Actuators: Water Pump, Servo Window Control
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ===========================================
// CONFIGURATION
// ===========================================

// Wi-Fi credentials
const char* ssid = "Holdrine";
const char* password = "@Holdrine";

// Backend server configuration
const char* serverURL = "http://10.139.38.63:5000/api/iot";  // Updated to match your backend
const char* deviceId = "ESP32_GREENHOUSE_001";
const char* authToken = "your_device_auth_token_here";

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
#define HUMIDITY_MIN              40   // Minimum humidity (%)

// Timing constants
#define SENSOR_READ_INTERVAL     5000  // 5 seconds
#define SERVER_SEND_INTERVAL    30000  // 30 seconds
#define PUMP_MIN_RUN_TIME        5000  // Minimum pump run time
#define SERVO_MOVEMENT_DELAY      500  // Servo movement delay

// ===========================================
// GLOBAL VARIABLES
// ===========================================

DHT dht(DHT_PIN, DHT_TYPE);
Servo windowServo;

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastServerSend = 0;
unsigned long pumpStartTime = 0;

// Sensor data structure
struct SensorData {
  float temperature;
  float humidity;
  int soilMoisture;
  int lightLevel;
  int waterLevel;
  bool isValid;
};

// Device states
bool pumpRunning = false;
bool windowOpen = false;
int servoPosition = 0;  // 0 = closed, 90 = open

// ===========================================
// SETUP
// ===========================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Smart Greenhouse Controller Starting ===");
  
  // Initialize sensors
  dht.begin();
  pinMode(ULTRASONIC_TRIG, OUTPUT);
  pinMode(ULTRASONIC_ECHO, INPUT);
  
  // Initialize actuators
  pinMode(WATER_PUMP_RELAY, OUTPUT);
  digitalWrite(WATER_PUMP_RELAY, HIGH); // Relay OFF (active low)
  
  windowServo.attach(SERVO_WINDOW_PIN);
  windowServo.write(0); // Start with window closed
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("=== Setup Complete ===\n");
}

// ===========================================
// MAIN LOOP
// ===========================================

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL) {
    SensorData data = readAllSensors();
    
    if (data.isValid) {
      printSensorData(data);
      controlActuators(data);
      
      // Send to server less frequently
      if (currentTime - lastServerSend >= SERVER_SEND_INTERVAL) {
        sendDataToServer(data);
        lastServerSend = currentTime;
      }
    }
    
    lastSensorRead = currentTime;
  }
  
  // Handle minimum pump run time
  handlePumpControl(currentTime);
  
  // Small delay to prevent watchdog issues
  delay(100);
}

// ===========================================
// SENSOR FUNCTIONS
// ===========================================

SensorData readAllSensors() {
  SensorData data;
  
  // Read DHT11 sensor
  data.temperature = dht.readTemperature();
  data.humidity = dht.readHumidity();
  
  // Read analog sensors
  data.soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  data.lightLevel = analogRead(LDR_PIN);
  
  // Read ultrasonic sensor
  data.waterLevel = readUltrasonicDistance();
  
  // Validate sensor readings
  data.isValid = !isnan(data.temperature) && 
                 !isnan(data.humidity) && 
                 data.waterLevel > 0;
  
  return data;
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
    Serial.println("⚠️  Ultrasonic sensor timeout");
    return -1;
  }
  
  // Convert to distance (cm)
  int distance = duration * 0.034 / 2;
  return distance;
}

// ===========================================
// ACTUATOR CONTROL
// ===========================================

void controlActuators(SensorData data) {
  // Water pump control based on soil moisture
  if (data.soilMoisture < SOIL_MOISTURE_THRESHOLD && !pumpRunning) {
    startWaterPump();
  }
  
  // Window control based on temperature and light
  bool shouldOpenWindow = (data.temperature > TEMP_MAX) || (data.lightLevel < LIGHT_THRESHOLD);
  
  if (shouldOpenWindow && !windowOpen) {
    openWindow();
  } else if (!shouldOpenWindow && windowOpen) {
    closeWindow();
  }
}

void startWaterPump() {
  if (pumpRunning) return;
  
  Serial.println("💧 Starting water pump");
  digitalWrite(WATER_PUMP_RELAY, LOW); // Turn ON (active low)
  pumpRunning = true;
  pumpStartTime = millis();
}

void stopWaterPump() {
  if (!pumpRunning) return;
  
  Serial.println("💧 Stopping water pump");
  digitalWrite(WATER_PUMP_RELAY, HIGH); // Turn OFF
  pumpRunning = false;
}

void handlePumpControl(unsigned long currentTime) {
  // Ensure pump runs for minimum time
  if (pumpRunning && (currentTime - pumpStartTime >= PUMP_MIN_RUN_TIME)) {
    // Re-read soil moisture to decide if pump should continue
    int currentMoisture = analogRead(SOIL_MOISTURE_PIN);
    if (currentMoisture >= SOIL_MOISTURE_THRESHOLD) {
      stopWaterPump();
    }
  }
}

void openWindow() {
  if (windowOpen) return;
  
  Serial.println("🪟 Opening window");
  windowServo.write(90);
  windowOpen = true;
  delay(SERVO_MOVEMENT_DELAY);
}

void closeWindow() {
  if (!windowOpen) return;
  
  Serial.println("🪟 Closing window");
  windowServo.write(0);
  windowOpen = false;
  delay(SERVO_MOVEMENT_DELAY);
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

void sendDataToServer(SensorData data) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected, skipping server update");
    return;
  }
  
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(authToken));
  
  // Create JSON payload matching backend expectations
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  
  // Sensor data
  doc["sensors"]["temperature"] = data.temperature;
  doc["sensors"]["humidity"] = data.humidity;
  doc["sensors"]["soilMoisture"] = data.soilMoisture;
  doc["sensors"]["lightLevel"] = data.lightLevel;
  doc["sensors"]["waterLevel"] = data.waterLevel;
  
  // Device states
  doc["actuators"]["waterPump"] = pumpRunning;
  doc["actuators"]["window"] = windowOpen;
  
  // System status
  doc["status"]["wifiSignal"] = WiFi.RSSI();
  doc["status"]["uptime"] = millis() / 1000;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📤 Sending data to server...");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
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
  // Parse server response for remote commands
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.println("⚠️  Failed to parse server response");
    return;
  }
  
  // Handle remote commands
  if (doc.containsKey("commands")) {
    JsonObject commands = doc["commands"];
    
    if (commands.containsKey("waterPump")) {
      bool command = commands["waterPump"];
      if (command && !pumpRunning) {
        startWaterPump();
        Serial.println("🔄 Remote command: Start water pump");
      } else if (!command && pumpRunning) {
        stopWaterPump();
        Serial.println("🔄 Remote command: Stop water pump");
      }
    }
    
    if (commands.containsKey("window")) {
      bool command = commands["window"];
      if (command && !windowOpen) {
        openWindow();
        Serial.println("🔄 Remote command: Open window");
      } else if (!command && windowOpen) {
        closeWindow();
        Serial.println("🔄 Remote command: Close window");
      }
    }
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

void printSensorData(SensorData data) {
  Serial.println("\n==== 📊 Sensor Readings ====");
  Serial.printf("🌡️  Temperature: %.2f°C\n", data.temperature);
  Serial.printf("💧 Humidity: %.2f%%\n", data.humidity);
  Serial.printf("🌱 Soil Moisture: %d\n", data.soilMoisture);
  Serial.printf("☀️  Light Level: %d\n", data.lightLevel);
  Serial.printf("🚰 Water Level: %d cm\n", data.waterLevel);
  
  Serial.println("\n==== 🔧 Actuator Status ====");
  Serial.printf("💧 Water Pump: %s\n", pumpRunning ? "ON" : "OFF");
  Serial.printf("🪟 Window: %s\n", windowOpen ? "OPEN" : "CLOSED");
  
  Serial.printf("📶 WiFi Signal: %d dBm\n", WiFi.RSSI());
  Serial.printf("⏱️  Uptime: %lu seconds\n", millis() / 1000);
  Serial.println("========================\n");
}
