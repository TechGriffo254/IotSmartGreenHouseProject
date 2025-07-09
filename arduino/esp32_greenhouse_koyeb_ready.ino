#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ========================================
// CONFIGURATION SETTINGS
// ========================================

// Wi-Fi credentials
const char* ssid = "Holdrine";
const char* password = "@Holdrine";

// Backend server configuration (UPDATE THESE FOR KOYEB DEPLOYMENT)
// For local testing:
// const char* backendHost = "10.139.38.63";
// const int backendPort = 3000;
// const bool useHTTPS = false;

// For Koyeb production (UPDATE WITH YOUR KOYEB URL):
const char* backendHost = "your-app-name.koyeb.app";  // Replace with your actual Koyeb URL
const int backendPort = 443;
const bool useHTTPS = true;

// Device identification
const char* deviceId = "ESP32_GREENHOUSE_001";
const char* greenhouseId = "greenhouse-001";
const char* pincode = "123456";  // Secret auth key

// ========================================
// HARDWARE PIN DEFINITIONS
// ========================================

// Sensor pins
#define DHT_PIN 4
#define DHT_TYPE DHT11
#define MOISTURE_PIN 34   // Analog pin for soil moisture
#define LDR_PIN      35   // Analog pin for light sensor (LDR)
#define TRIG_PIN     12   // Ultrasonic sensor trigger
#define ECHO_PIN     14   // Ultrasonic sensor echo

// Actuator pins
#define RELAY_PUMP_PIN 26  // Water pump relay
#define SERVO_PIN 27       // Window servo motor

// ========================================
// SENSOR THRESHOLDS
// ========================================
int moistureThreshold = 500;    // Below this = pump ON
int lightThreshold = 2000;      // Below this = window OPEN
float tempThreshold = 30.0;     // Above this = window OPEN

// ========================================
// GLOBAL VARIABLES
// ========================================
DHT dht(DHT_PIN, DHT_TYPE);
Servo windowServo;

// Device states
bool pumpState = false;         // false = OFF, true = ON
bool windowState = false;       // false = CLOSED, true = OPEN
bool autoMode = true;           // Automatic control enabled
bool pumpAutoMode = true;       // Pump auto control
bool windowAutoMode = true;     // Window auto control

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastControlCheck = 0;
unsigned long lastCommandCheck = 0;
const unsigned long SENSOR_INTERVAL = 2000;        // Read sensors every 2 seconds
const unsigned long DATA_SEND_INTERVAL = 10000;    // Send data every 10 seconds
const unsigned long CONTROL_CHECK_INTERVAL = 5000; // Check for commands every 5 seconds
const unsigned long COMMAND_CHECK_INTERVAL = 3000; // Check for backend commands every 3 seconds

// Current sensor readings
float temperature = 0.0;
float humidity = 0.0;
int soilMoisture = 0;
int lightLevel = 0;
int waterLevel = 0;

// Connection status
bool wifiConnected = false;
bool backendConnected = false;

// ========================================
// SETUP FUNCTION
// ========================================
void setup() {
  Serial.begin(115200);
  Serial.println("🌱 ESP32 Greenhouse Controller Starting...");
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize ultrasonic sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Initialize relay pin
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  digitalWrite(RELAY_PUMP_PIN, HIGH); // Relay OFF (HIGH = OFF for most relays)
  
  // Initialize servo
  windowServo.attach(SERVO_PIN);
  windowServo.write(0);  // Close window at startup
  
  Serial.println("🔧 Hardware initialized");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Test backend connection
  testBackendConnection();
  
  Serial.println("✅ ESP32 Greenhouse Controller Ready!");
  Serial.println("📊 Starting sensor monitoring...");
  printConfiguration();
}

// ========================================
// MAIN LOOP
// ========================================
void loop() {
  unsigned long currentTime = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectToWiFi();
    return;
  } else {
    wifiConnected = true;
  }
  
  // Read sensors periodically
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readAllSensors();
    lastSensorRead = currentTime;
  }
  
  // Automatic device control (if enabled)
  if (autoMode && (currentTime - lastControlCheck >= CONTROL_CHECK_INTERVAL)) {
    automaticDeviceControl();
    lastControlCheck = currentTime;
  }
  
  // Send data to backend periodically
  if (currentTime - lastDataSend >= DATA_SEND_INTERVAL) {
    sendSensorDataToBackend();
    sendDeviceStatusToBackend();
    lastDataSend = currentTime;
  }
  
  // Check for control commands from backend
  if (currentTime - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
    checkForControlCommands();
    lastCommandCheck = currentTime;
  }
  
  delay(100); // Small delay to prevent overwhelming the system
}

// ========================================
// WIFI CONNECTION
// ========================================
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  WiFi.begin(ssid, password);
  Serial.print("🔗 Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi Connected!");
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("❌ WiFi Connection Failed!");
    wifiConnected = false;
  }
}

// ========================================
// BACKEND CONNECTION TEST
// ========================================
void testBackendConnection() {
  if (!wifiConnected) return;
  
  HTTPClient http;
  WiFiClientSecure *client = NULL;
  
  if (useHTTPS) {
    client = new WiFiClientSecure;
    client->setInsecure(); // For development - use proper certificates in production
    http.begin(*client, String("https://") + backendHost + "/api/health");
  } else {
    http.begin(String("http://") + backendHost + ":" + backendPort + "/api/health");
  }
  
  http.setTimeout(10000); // 10 second timeout
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Backend connection successful!");
    Serial.println("Response: " + response);
    backendConnected = true;
  } else {
    Serial.println("❌ Backend connection failed: " + String(httpResponseCode));
    backendConnected = false;
  }
  
  http.end();
  if (client) delete client;
}

// ========================================
// SENSOR READING FUNCTIONS
// ========================================
void readAllSensors() {
  // Read DHT11 sensor
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Read analog sensors
  soilMoisture = analogRead(MOISTURE_PIN);
  lightLevel = analogRead(LDR_PIN);
  
  // Read ultrasonic sensor (water level)
  waterLevel = readUltrasonic();
  
  // Handle sensor errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("⚠️ DHT sensor error!");
    temperature = 0.0;
    humidity = 0.0;
  }
  
  // Print sensor readings every 10 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint >= 10000) {
    Serial.println("📊 Sensor Readings:");
    Serial.printf("🌡️  Temperature: %.1f°C\n", temperature);
    Serial.printf("💧 Humidity: %.1f%%\n", humidity);
    Serial.printf("🌱 Soil Moisture: %d\n", soilMoisture);
    Serial.printf("☀️  Light Level: %d\n", lightLevel);
    Serial.printf("🚰 Water Level: %d cm\n", waterLevel);
    Serial.printf("🔧 Pump: %s, Window: %s\n", 
                  pumpState ? "ON" : "OFF", 
                  windowState ? "OPEN" : "CLOSED");
    lastPrint = millis();
  }
}

int readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return -1; // Timeout or error
  
  int distance = duration * 0.034 / 2;
  return distance > 0 ? distance : -1;
}

// ========================================
// AUTOMATIC DEVICE CONTROL
// ========================================
void automaticDeviceControl() {
  // Automatic water pump control
  if (pumpAutoMode) {
    if (soilMoisture < moistureThreshold && !pumpState) {
      Serial.println("💧 Auto: Starting water pump (soil moisture low)");
      controlWaterPump(true);
    } else if (soilMoisture >= (moistureThreshold + 100) && pumpState) {
      Serial.println("💧 Auto: Stopping water pump (soil moisture OK)");
      controlWaterPump(false);
    }
  }
  
  // Automatic window control
  if (windowAutoMode) {
    bool shouldOpenWindow = (temperature > tempThreshold) || (lightLevel < lightThreshold);
    
    if (shouldOpenWindow && !windowState) {
      Serial.println("🪟 Auto: Opening window (temp high or light low)");
      controlWindow(true);
    } else if (!shouldOpenWindow && windowState) {
      Serial.println("🪟 Auto: Closing window (conditions normal)");
      controlWindow(false);
    }
  }
}

// ========================================
// DEVICE CONTROL FUNCTIONS
// ========================================
void controlWaterPump(bool turnOn) {
  pumpState = turnOn;
  digitalWrite(RELAY_PUMP_PIN, turnOn ? LOW : HIGH); // LOW = ON, HIGH = OFF
  
  Serial.println("💧 Water Pump: " + String(turnOn ? "ON" : "OFF"));
}

void controlWindow(bool open) {
  windowState = open;
  windowServo.write(open ? 90 : 0); // 90° = open, 0° = closed
  
  Serial.println("🪟 Window: " + String(open ? "OPEN" : "CLOSED"));
  delay(1000); // Give servo time to move
}

// ========================================
// BACKEND COMMUNICATION
// ========================================
void sendSensorDataToBackend() {
  if (!wifiConnected) return;
  
  HTTPClient http;
  WiFiClientSecure *client = NULL;
  
  String url;
  if (useHTTPS) {
    client = new WiFiClientSecure;
    client->setInsecure(); // For development
    url = String("https://") + backendHost + "/api/iot";
    http.begin(*client, url);
  } else {
    url = String("http://") + backendHost + ":" + backendPort + "/api/iot";
    http.begin(url);
  }
  
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  // Create JSON payload matching your backend API
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["greenhouseId"] = greenhouseId;
  doc["pincode"] = pincode;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["soilMoisture"] = soilMoisture;
  doc["lightIntensity"] = lightLevel;
  doc["waterLevel"] = waterLevel;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    backendConnected = true;
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println("✅ Sensor data sent successfully");
    }
  } else {
    backendConnected = false;
    Serial.println("❌ Error sending sensor data: " + String(httpResponseCode));
  }
  
  http.end();
  if (client) delete client;
}

void sendDeviceStatusToBackend() {
  if (!wifiConnected) return;
  
  // Send pump status
  sendDeviceStatus("WATER_PUMP_001", pumpState ? "ON" : "OFF", pumpAutoMode);
  
  // Send window status
  sendDeviceStatus("WINDOW_SERVO_001", windowState ? "OPEN" : "CLOSED", windowAutoMode);
}

void sendDeviceStatus(String deviceId, String status, bool autoModeEnabled) {
  HTTPClient http;
  WiFiClientSecure *client = NULL;
  
  String url;
  if (useHTTPS) {
    client = new WiFiClientSecure;
    client->setInsecure();
    url = String("https://") + backendHost + "/api/iot/device-status";
    http.begin(*client, url);
  } else {
    url = String("http://") + backendHost + ":" + backendPort + "/api/iot/device-status";
    http.begin(url);
  }
  
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["status"] = status;
  doc["autoMode"] = autoModeEnabled;
  doc["greenhouseId"] = greenhouseId;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  http.end();
  if (client) delete client;
}

// ========================================
// CHECK FOR CONTROL COMMANDS
// ========================================
void checkForControlCommands() {
  if (!wifiConnected) return;
  
  // Check for pump commands
  checkDeviceCommands("WATER_PUMP_001");
  
  // Check for window commands
  checkDeviceCommands("WINDOW_SERVO_001");
}

void checkDeviceCommands(String deviceId) {
  HTTPClient http;
  WiFiClientSecure *client = NULL;
  
  String url;
  if (useHTTPS) {
    client = new WiFiClientSecure;
    client->setInsecure();
    url = String("https://") + backendHost + "/api/iot/device-commands/" + deviceId;
    http.begin(*client, url);
  } else {
    url = String("http://") + backendHost + ":" + backendPort + "/api/iot/device-commands/" + deviceId;
    http.begin(url);
  }
  
  http.setTimeout(5000);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    if (doc["success"]) {
      String status = doc["data"]["status"];
      bool autoModeEnabled = doc["data"]["autoMode"];
      
      // Apply commands based on device
      if (deviceId == "WATER_PUMP_001") {
        bool newPumpState = (status == "ON");
        if (newPumpState != pumpState) {
          controlWaterPump(newPumpState);
        }
        pumpAutoMode = autoModeEnabled;
      } else if (deviceId == "WINDOW_SERVO_001") {
        bool newWindowState = (status == "OPEN");
        if (newWindowState != windowState) {
          controlWindow(newWindowState);
        }
        windowAutoMode = autoModeEnabled;
      }
    }
  }
  
  http.end();
  if (client) delete client;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
void printConfiguration() {
  Serial.println("=== CONFIGURATION ===");
  Serial.println("Device ID: " + String(deviceId));
  Serial.println("Greenhouse ID: " + String(greenhouseId));
  Serial.println("Backend: " + String(backendHost) + ":" + String(backendPort));
  Serial.println("HTTPS: " + String(useHTTPS ? "Enabled" : "Disabled"));
  Serial.println("WiFi: " + String(wifiConnected ? "Connected" : "Disconnected"));
  Serial.println("Backend: " + String(backendConnected ? "Connected" : "Disconnected"));
  Serial.println("====================");
}

void printSystemStatus() {
  Serial.println("=== SYSTEM STATUS ===");
  Serial.println("WiFi: " + String(wifiConnected ? "Connected" : "Disconnected"));
  Serial.println("Backend: " + String(backendConnected ? "Connected" : "Disconnected"));
  Serial.println("Pump: " + String(pumpState ? "ON" : "OFF") + " (Auto: " + String(pumpAutoMode ? "ON" : "OFF") + ")");
  Serial.println("Window: " + String(windowState ? "OPEN" : "CLOSED") + " (Auto: " + String(windowAutoMode ? "ON" : "OFF") + ")");
  Serial.printf("Temp: %.1f°C, Humidity: %.1f%%, Moisture: %d, Light: %d\n", 
                temperature, humidity, soilMoisture, lightLevel);
  Serial.println("====================");
}
