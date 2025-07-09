#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <WebSocketsClient.h>

// ========================================
// CONFIGURATION SETTINGS
// ========================================

// Wi-Fi credentials
const char* ssid = "Holdrine";
const char* password = "@Holdrine";

// Backend server configuration (UPDATE THESE FOR KOYEB DEPLOYMENT)
const char* backendHost = "10.139.38.63";  // Change to your Koyeb URL
const int backendPort = 3000;              // Change to your Koyeb port
const char* deviceId = "ESP32_GREENHOUSE_001";
const char* greenhouseId = "greenhouse-001";

// Authentication
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
WebSocketsClient webSocket;

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
const unsigned long SENSOR_INTERVAL = 2000;    // Read sensors every 2 seconds
const unsigned long DATA_SEND_INTERVAL = 10000; // Send data every 10 seconds
const unsigned long CONTROL_CHECK_INTERVAL = 5000; // Check for commands every 5 seconds

// Current sensor readings
float temperature = 0.0;
float humidity = 0.0;
int soilMoisture = 0;
int lightLevel = 0;
int waterLevel = 0;

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
  
  // Initialize WebSocket connection for real-time control
  initWebSocket();
  
  Serial.println("✅ ESP32 Greenhouse Controller Ready!");
  Serial.println("📊 Starting sensor monitoring...");
}

// ========================================
// MAIN LOOP
// ========================================
void loop() {
  unsigned long currentTime = millis();
  
  // Handle WebSocket events
  webSocket.loop();
  
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
  
  delay(100); // Small delay to prevent overwhelming the system
}

// ========================================
// WIFI CONNECTION
// ========================================
void connectToWiFi() {
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
  } else {
    Serial.println();
    Serial.println("❌ WiFi Connection Failed!");
  }
}

// ========================================
// WEBSOCKET INITIALIZATION
// ========================================
void initWebSocket() {
  webSocket.begin(backendHost, backendPort, "/socket.io/?EIO=4&transport=websocket");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  Serial.println("🔌 WebSocket initialized");
}

// ========================================
// WEBSOCKET EVENT HANDLER
// ========================================
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("🔌 WebSocket Disconnected");
      break;
      
    case WStype_CONNECTED:
      Serial.printf("🔌 WebSocket Connected to: %s\n", payload);
      // Join greenhouse room
      webSocket.sendTXT("{\"type\":\"join\",\"room\":\"greenhouse-" + String(greenhouseId) + "\"}");
      break;
      
    case WStype_TEXT:
      Serial.printf("📨 Received: %s\n", payload);
      handleWebSocketMessage((char*)payload);
      break;
      
    default:
      break;
  }
}

// ========================================
// HANDLE WEBSOCKET MESSAGES (DEVICE CONTROL)
// ========================================
void handleWebSocketMessage(String message) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  if (doc.containsKey("type") && doc["type"] == "deviceControl") {
    String deviceIdStr = doc["deviceId"];
    String action = doc["action"];
    
    Serial.println("🎛️ Device Control Command Received:");
    Serial.println("Device: " + deviceIdStr);
    Serial.println("Action: " + action);
    
    // Handle water pump control
    if (deviceIdStr == "WATER_PUMP_001") {
      if (action == "turn_on") {
        controlWaterPump(true);
        pumpAutoMode = false; // Disable auto mode when manually controlled
      } else if (action == "turn_off") {
        controlWaterPump(false);
        pumpAutoMode = false;
      } else if (action == "toggle") {
        controlWaterPump(!pumpState);
        pumpAutoMode = false;
      } else if (action == "set_auto_mode") {
        pumpAutoMode = doc["autoMode"];
        Serial.println("💧 Pump auto mode: " + String(pumpAutoMode ? "ON" : "OFF"));
      }
    }
    
    // Handle window servo control
    else if (deviceIdStr == "WINDOW_SERVO_001") {
      if (action == "open") {
        controlWindow(true);
        windowAutoMode = false; // Disable auto mode when manually controlled
      } else if (action == "close") {
        controlWindow(false);
        windowAutoMode = false;
      } else if (action == "toggle") {
        controlWindow(!windowState);
        windowAutoMode = false;
      } else if (action == "set_auto_mode") {
        windowAutoMode = doc["autoMode"];
        Serial.println("🪟 Window auto mode: " + String(windowAutoMode ? "ON" : "OFF"));
      }
    }
    
    // Send immediate status update
    sendDeviceStatusToBackend();
  }
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
  
  // Print sensor readings
  Serial.println("📊 Sensor Readings:");
  Serial.printf("🌡️  Temperature: %.1f°C\n", temperature);
  Serial.printf("💧 Humidity: %.1f%%\n", humidity);
  Serial.printf("🌱 Soil Moisture: %d\n", soilMoisture);
  Serial.printf("☀️  Light Level: %d\n", lightLevel);
  Serial.printf("🚰 Water Level: %d cm\n", waterLevel);
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
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected, skipping data send");
    return;
  }
  
  HTTPClient http;
  String url = "http://" + String(backendHost) + ":" + String(backendPort) + "/api/iot";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
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
    String response = http.getString();
    Serial.println("✅ Sensor data sent successfully");
    Serial.println("Response: " + response);
  } else {
    Serial.println("❌ Error sending sensor data: " + String(httpResponseCode));
  }
  
  http.end();
}

void sendDeviceStatusToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  
  // Update water pump status
  String pumpUrl = "http://" + String(backendHost) + ":" + String(backendPort) + "/api/iot/device-status";
  http.begin(pumpUrl);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument pumpDoc(512);
  pumpDoc["deviceId"] = "WATER_PUMP_001";
  pumpDoc["status"] = pumpState ? "ON" : "OFF";
  pumpDoc["autoMode"] = pumpAutoMode;
  pumpDoc["greenhouseId"] = greenhouseId;
  
  String pumpJson;
  serializeJson(pumpDoc, pumpJson);
  
  http.POST(pumpJson);
  http.end();
  
  // Update window status
  String windowUrl = "http://" + String(backendHost) + ":" + String(backendPort) + "/api/iot/device-status";
  http.begin(windowUrl);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument windowDoc(512);
  windowDoc["deviceId"] = "WINDOW_SERVO_001";
  windowDoc["status"] = windowState ? "OPEN" : "CLOSED";
  windowDoc["autoMode"] = windowAutoMode;
  windowDoc["greenhouseId"] = greenhouseId;
  
  String windowJson;
  serializeJson(windowDoc, windowJson);
  
  http.POST(windowJson);
  http.end();
  
  Serial.println("📤 Device status updated: Pump=" + String(pumpState ? "ON" : "OFF") + 
                 ", Window=" + String(windowState ? "OPEN" : "CLOSED"));
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
void printSystemStatus() {
  Serial.println("=== SYSTEM STATUS ===");
  Serial.println("WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
  Serial.println("Pump: " + String(pumpState ? "ON" : "OFF") + " (Auto: " + String(pumpAutoMode ? "ON" : "OFF") + ")");
  Serial.println("Window: " + String(windowState ? "OPEN" : "CLOSED") + " (Auto: " + String(windowAutoMode ? "ON" : "OFF") + ")");
  Serial.printf("Temp: %.1f°C, Humidity: %.1f%%, Moisture: %d, Light: %d\n", 
                temperature, humidity, soilMoisture, lightLevel);
  Serial.println("====================");
}
