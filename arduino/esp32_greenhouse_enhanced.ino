#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>

// WiFi Credentials (UPDATE WITH YOUR WIFI)
const char* ssid = "Griffo";           // Replace with your WiFi name
const char* password = "123456789";   // Replace with your WiFi password

// Backend Configuration (LIVE KOYEB DEPLOYMENT)
const char* backendHost = "open-lauryn-ina-9662925b.koyeb.app";
const int backendPort = 443;
const bool useHTTPS = true;

// Device Identification
const char* deviceId = "ESP32_GREENHOUSE_001";
const char* greenhouseId = "greenhouse-001";
const char* pincode = "123456";

// ========================================
// 📍 HARDWARE PIN DEFINITIONS
// ========================================

// Sensors
#define DHT_PIN      4    // DHT11 data pin
#define DHT_TYPE    DHT11  // DHT sensor type (DHT11 or DHT22)
#define MOISTURE_PIN 34   // Soil moisture analog pin
#define LDR_PIN      35   // Light sensor analog pin
#define TRIG_PIN     12   // Ultrasonic trigger pin
#define ECHO_PIN     14   // Ultrasonic echo pin

// Actuators
#define RELAY_PUMP_PIN  26  // Water pump relay
#define RELAY_VALVE_PIN 13  // Water valve relay (NEW)
#define FAN_MOTOR_PIN   18  // Fan motor control pin (NEW)
#define SERVO_PIN       27  // Window servo
#define LED_LIGHT_PIN   19  // LED light control (NEW)

// ========================================
//  SENSOR THRESHOLDS
// ========================================
int moistureThreshold = 500;     // Below this = pump ON
int lightThreshold = 2000;       // Below this = window OPEN
float tempThreshold = 30.0;      // Above this = window OPEN

// ========================================
//  GLOBAL VARIABLES
// ========================================
DHT dht(DHT_PIN, DHT_TYPE);
Servo windowServo;

// Device States
bool pumpState = false;
bool windowState = false;
bool fanState = false;      // NEW: Fan state tracking
bool valveState = false;    // NEW: Valve state tracking
bool lightState = false;    // NEW: LED light state tracking
bool autoMode = true;

// Sensor Readings
float temperature = 0.0;
float humidity = 0.0;
int soilMoisture = 0;
int lightLevel = 0;
int waterLevel = 0;

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastControlCheck = 0;
const unsigned long SENSOR_INTERVAL = 3000;     // Read every 3 seconds
const unsigned long DATA_SEND_INTERVAL = 5000; // Send every 5 seconds
const unsigned long CONTROL_CHECK_INTERVAL = 5000; // Check commands every 5 seconds

// Connection Status
bool wifiConnected = false;

// ========================================
//  SETUP FUNCTION
// ========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("🌱========================================");
  Serial.println("🌱 ESP32 Greenhouse Controller v2.0");
  Serial.println("🌱 Enhanced with Valve, Fan, & Window Control");
  Serial.println("🌱========================================");
  
  // Initialize Hardware
  initializeHardware();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Test Backend Connection
  testBackendConnection();
  
  Serial.println("✅ System Ready! Starting monitoring...");
  printSystemInfo();
}

// ========================================
// 🔄 MAIN LOOP
// ========================================
void loop() {
  unsigned long currentTime = millis();
  
  // Check WiFi Status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected, reconnecting...");
    connectToWiFi();
    return;
  }
  
  // Read Sensors
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readAllSensors();
    lastSensorRead = currentTime;
  }
  
  // Automatic Control
  if (autoMode) {
    automaticControl();
  }
  
  // Send Data to Backend
  if (currentTime - lastDataSend >= DATA_SEND_INTERVAL) {
    sendDataToBackend();
    lastDataSend = currentTime;
  }
  
  // Check for Remote Commands
  if (currentTime - lastControlCheck >= CONTROL_CHECK_INTERVAL) {
    checkRemoteCommands();
    lastControlCheck = currentTime;
  }
  
  delay(500); // Small delay
}

// ========================================
// 🔧 HARDWARE INITIALIZATION
// ========================================
void initializeHardware() {
  Serial.println("🔧 Initializing hardware...");
  
  // DHT Sensor
  dht.begin();
  
  // Ultrasonic Sensor
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Relay (Water Pump)
  pinMode(RELAY_PUMP_PIN, OUTPUT);
  digitalWrite(RELAY_PUMP_PIN, HIGH); // OFF (HIGH = OFF for most relays)
  
  // Relay (Water Valve) - NEW
  pinMode(RELAY_VALVE_PIN, OUTPUT);
  digitalWrite(RELAY_VALVE_PIN, HIGH); // OFF (HIGH = OFF for most relays)
  
  // Fan Motor Control - NEW
  pinMode(FAN_MOTOR_PIN, OUTPUT);
  digitalWrite(FAN_MOTOR_PIN, LOW); // OFF
  
  // LED Light Control - NEW
  pinMode(LED_LIGHT_PIN, OUTPUT);
  digitalWrite(LED_LIGHT_PIN, LOW); // OFF
  
  // Servo Motor (Window)
  windowServo.attach(SERVO_PIN);
  windowServo.write(0); // Close window
  
  Serial.println("✅ Hardware initialized");
}

// ========================================
// 🔗 WIFI CONNECTION
// ========================================
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("🔗 Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
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
    Serial.println("❌ WiFi Failed! Check credentials.");
    wifiConnected = false;
  }
}

// ========================================
// 🌐 BACKEND CONNECTION TEST
// ========================================
void testBackendConnection() {
  if (!wifiConnected) return;
  
  Serial.println("🧪 Testing backend connection...");
  
  WiFiClientSecure client;
  client.setInsecure(); // Skip SSL verification for simplicity
  
  HTTPClient http;
  String url = String("https://") + backendHost + "/api/health";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("✅ Backend connected successfully!");
    Serial.println("📡 Response: " + response);
  } else {
    Serial.println("❌ Backend connection failed!");
    Serial.println("🔧 Error: " + String(httpCode));
  }
  
  http.end();
}

// ========================================
// 📊 SENSOR READING
// ========================================
void readAllSensors() {
  // Read DHT11 (Temperature & Humidity)
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Read Soil Moisture (analog)
  soilMoisture = analogRead(MOISTURE_PIN);
  
  // Read Light Level (analog)
  lightLevel = analogRead(LDR_PIN);
  
  // Read Water Level (ultrasonic)
  waterLevel = readWaterLevel();
  
  // Validate readings
  if (isnan(temperature)) temperature = 0.0;
  if (isnan(humidity)) humidity = 0.0;
  
  // Print sensor data
  Serial.println("📊 Sensor Readings:");
  Serial.println("   🌡️  Temperature: " + String(temperature) + "°C");
  Serial.println("   💧 Humidity: " + String(humidity) + "%");
  Serial.println("   🌱 Soil Moisture: " + String(soilMoisture));
  Serial.println("   ☀️  Light Level: " + String(lightLevel));
  Serial.println("   🚰 Water Level: " + String(waterLevel) + "cm");
}

// ========================================
// 🚰 WATER LEVEL READING (ULTRASONIC)
// ========================================
int readWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  int distance = duration * 0.034 / 2;
  
  return (distance > 0 && distance < 400) ? distance : 0;
}

// ========================================
// 🤖 AUTOMATIC CONTROL
// ========================================
void automaticControl() {
  // Auto Water Pump Control
  if (soilMoisture < moistureThreshold && !pumpState) {
    controlPump(true);
    Serial.println("🤖 AUTO: Pump ON (dry soil detected)");
  } else if (soilMoisture > (moistureThreshold + 100) && pumpState) {
    controlPump(false);
    Serial.println("🤖 AUTO: Pump OFF (soil wet enough)");
  }
  
  // Auto Window Control
  bool shouldOpenWindow = (temperature > tempThreshold) || (lightLevel < lightThreshold);
  
  if (shouldOpenWindow && !windowState) {
    controlWindow(true);
    Serial.println("🤖 AUTO: Window OPEN (too hot or dark)");
  } else if (!shouldOpenWindow && windowState) {
    controlWindow(false);
    Serial.println("🤖 AUTO: Window CLOSED (conditions good)");
  }
  
  // Auto Fan Control - NEW
  if (temperature > (tempThreshold - 2) && !fanState) {
    controlFan(true);
    Serial.println("🤖 AUTO: Fan ON (temperature high)");
  } else if (temperature < (tempThreshold - 5) && fanState) {
    controlFan(false);
    Serial.println("🤖 AUTO: Fan OFF (temperature ok)");
  }
  
  // Auto Valve Control - NEW
  if (soilMoisture < (moistureThreshold - 50) && !valveState) {
    controlValve(true);
    Serial.println("🤖 AUTO: Valve OPEN (soil very dry)");
  } else if (soilMoisture > (moistureThreshold + 50) && valveState) {
    controlValve(false);
    Serial.println("🤖 AUTO: Valve CLOSED (soil wet)");
  }
  
  // Auto LED Light Control - NEW
  // Higher LDR value means darker (less light), so we turn ON LEDs when dark
  if (lightLevel > 3000 && !lightState) {
    controlLight(true);
    Serial.println("🤖 AUTO: LED Light ON (dark conditions detected, LDR: " + String(lightLevel) + ")");
  } else if (lightLevel < 2500 && lightState) {
    controlLight(false);
    Serial.println("🤖 AUTO: LED Light OFF (sufficient natural light, LDR: " + String(lightLevel) + ")");
  }
}

// ========================================
// 💧 PUMP CONTROL
// ========================================
void controlPump(bool state) {
  pumpState = state;
  digitalWrite(RELAY_PUMP_PIN, state ? LOW : HIGH); // LOW = ON, HIGH = OFF
  Serial.println("💧 Pump: " + String(state ? "ON" : "OFF"));
}

// ========================================
// 🚰 VALVE CONTROL - NEW
// ========================================
void controlValve(bool state) {
  valveState = state;
  digitalWrite(RELAY_VALVE_PIN, state ? LOW : HIGH); // LOW = ON, HIGH = OFF
  Serial.println("🚰 Valve: " + String(state ? "OPEN" : "CLOSED"));
}

// ========================================
// 🌪️ FAN CONTROL - NEW
// ========================================
void controlFan(bool state) {
  fanState = state;
  digitalWrite(FAN_MOTOR_PIN, state ? HIGH : LOW); // HIGH = ON, LOW = OFF
  Serial.println("🌪️ Fan: " + String(state ? "ON" : "OFF"));
}

// ========================================
// 💡 LED LIGHT CONTROL - NEW
// ========================================
void controlLight(bool state) {
  lightState = state;
  digitalWrite(LED_LIGHT_PIN, state ? HIGH : LOW); // HIGH = ON, LOW = OFF
  Serial.println("💡 Light: " + String(state ? "ON" : "OFF"));
}

// ========================================
// 🪟 WINDOW CONTROL
// ========================================
void controlWindow(bool state) {
  windowState = state;
  windowServo.write(state ? 90 : 0); // 90° = OPEN, 0° = CLOSED
  Serial.println("🪟 Window: " + String(state ? "OPEN" : "CLOSED"));
}

// ========================================
// 📤 SEND DATA TO BACKEND
// ========================================
void sendDataToBackend() {
  if (!wifiConnected) return;
  
  Serial.println("📤 Sending data to backend...");
  
  WiFiClientSecure client;
  client.setInsecure();
  
  HTTPClient http;
  String url = String("https://") + backendHost + "/api/iot";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
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
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("✅ Data sent successfully!");
    Serial.println("📡 Response code: " + String(httpCode));
  } else {
    Serial.println("❌ Failed to send data!");
    Serial.println("🔧 Error: " + String(httpCode));
  }
  
  http.end();
  
  // Also send device status
  sendDeviceStatus();
}

// ========================================
// 📤 SEND DEVICE STATUS
// ========================================
void sendDeviceStatus() {
  WiFiClientSecure client;
  client.setInsecure();
  
  HTTPClient http;
  String url = String("https://") + backendHost + "/api/iot/status";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  // Create status JSON
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["greenhouseId"] = greenhouseId;
  doc["pumpState"] = pumpState;
  doc["valveState"] = valveState;  // NEW: Report valve state
  doc["fanState"] = fanState;      // NEW: Report fan state  
  doc["windowState"] = windowState;
  doc["lightState"] = lightState;  // NEW: Report LED light state
  doc["autoMode"] = autoMode;
  doc["wifiConnected"] = wifiConnected;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    Serial.println("✅ Status sent successfully!");
  }
  
  http.end();
}

// ========================================
// 📥 CHECK REMOTE COMMANDS
// ========================================
void checkRemoteCommands() {
  if (!wifiConnected) return;
  
  WiFiClientSecure client;
  client.setInsecure();
  
  HTTPClient http;
  String url = String("https://") + backendHost + "/api/iot/commands/" + deviceId;
  
  http.begin(client, url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    if (doc["success"] == true && doc["commands"].size() > 0) {
      Serial.println("📥 Remote commands received!");
      
      for (JsonObject command : doc["commands"].as<JsonArray>()) {
        String action = command["action"];
        String device = command["device"];
        bool state = command["state"];
        
        Serial.println("🎮 Command: " + action + " " + device + " " + String(state ? "ON" : "OFF"));
        
        if (device == "pump") {
          controlPump(state);
        } else if (device == "valve") {
          controlValve(state);
        } else if (device == "fan") {
          controlFan(state);
        } else if (device == "light") {
          controlLight(state);
        } else if (device == "window") {
          controlWindow(state);
        } else if (action == "autoMode") {
          autoMode = state;
          Serial.println("🤖 Auto Mode: " + String(autoMode ? "ENABLED" : "DISABLED"));
        }
      }
    }
  }
  
  http.end();
}

// ========================================
// 📋 SYSTEM INFO
// ========================================
void printSystemInfo() {
  Serial.println("📋========================================");
  Serial.println("📋 SYSTEM CONFIGURATION");
  Serial.println("📋========================================");
  Serial.println("📋 Device ID: " + String(deviceId));
  Serial.println("📋 Greenhouse ID: " + String(greenhouseId));
  Serial.println("📋 Backend: " + String(backendHost));
  Serial.println("📋 WiFi SSID: " + String(ssid));
  Serial.println("📋 Auto Mode: " + String(autoMode ? "ENABLED" : "DISABLED"));
  Serial.println("📋========================================");
  Serial.println("📋 HARDWARE PINS:");
  Serial.println("📋 Water Pump: " + String(RELAY_PUMP_PIN));
  Serial.println("📋 Water Valve: " + String(RELAY_VALVE_PIN));
  Serial.println("📋 Fan Motor: " + String(FAN_MOTOR_PIN));
  Serial.println("📋 Window Servo: " + String(SERVO_PIN));
  Serial.println("📋 LED Light: " + String(LED_LIGHT_PIN));
  Serial.println("📋========================================");
  Serial.println("📋 THRESHOLDS:");
  Serial.println("📋 Moisture: " + String(moistureThreshold));
  Serial.println("📋 Light: " + String(lightThreshold));
  Serial.println("📋 Temperature: " + String(tempThreshold) + "°C");
  Serial.println("📋========================================");
}
