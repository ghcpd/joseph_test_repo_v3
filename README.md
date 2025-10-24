# World Clock Map

A beautiful, interactive frontend web application that displays world times for multiple cities on an interactive map.

![World Clock Map](https://github.com/user-attachments/assets/838cfc89-698f-4657-a7d0-d241ec1ffbcc)

## Features

### Core Features
- **Interactive World Map**: SVG-based world map with clickable city markers
- **Real-time Clocks**: Times update every second for accurate timekeeping
- **10 Pre-configured Cities**: New York, London, Tokyo, Sydney, Paris, Dubai, Los Angeles, Singapore, Mumbai, and Moscow
- **Timezone Support**: Accurate timezone handling using JavaScript's Intl.DateTimeFormat API

### Interactive Features
- **Click to Add**: Click on any city marker on the map to add it to your world clock list
- **Hover Tooltips**: Hover over markers to see the city name and timezone
- **Remove Cities**: Click the × button on any city card to remove it from the list
- **Drag & Reorder**: Drag and drop city cards to reorder them (optional enhancement)

### Display Options
- **12/24-Hour Toggle**: Switch between 12-hour (AM/PM) and 24-hour time formats
- **Date & Weekday**: Each city displays the full date with weekday
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices

## Usage

### Getting Started

1. **Open the Application**: Simply open `index.html` in any modern web browser
   ```bash
   # Using a simple HTTP server (recommended)
   python3 -m http.server 8000
   # Then visit: http://localhost:8000
   
   # Or double-click the index.html file
   ```

2. **Add Cities**: Click on any city marker on the map to add it to your clock list

3. **View Times**: Watch as the times update in real-time every second

4. **Toggle Format**: Use the toggle switch to switch between 12-hour and 24-hour format

5. **Remove Cities**: Click the × button on any city card to remove it

6. **Reorder Cities**: Drag and drop city cards to reorder them

### Screenshots

**Cities with Live Clocks (12-hour format):**
![12-hour format](https://github.com/user-attachments/assets/1851600c-248f-495f-86da-a42dd1cddfee)

**Cities with Live Clocks (24-hour format):**
![24-hour format](https://github.com/user-attachments/assets/ef68d98c-69b6-49eb-9983-831e27b6272f)

## Technical Details

### Architecture
- **Single File Application**: Everything is contained in one `index.html` file
- **No Dependencies**: Uses only native browser APIs (no external libraries required)
- **Self-Contained**: Works completely offline once loaded

### Technologies Used
- **HTML5**: Structure and SVG for the world map
- **CSS3**: Modern styling with gradients, flexbox, and grid layout
- **Vanilla JavaScript**: No frameworks or libraries
- **Intl.DateTimeFormat**: For accurate timezone conversions and formatting

### Browser Compatibility
Works on all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- Intl.DateTimeFormat API
- SVG

Tested on: Chrome, Firefox, Safari, Edge

## Cities Included

| City | Timezone | Coordinates |
|------|----------|-------------|
| New York | America/New_York | 40.7128°N, 74.0060°W |
| London | Europe/London | 51.5074°N, 0.1278°W |
| Tokyo | Asia/Tokyo | 35.6895°N, 139.6917°E |
| Sydney | Australia/Sydney | 33.8688°S, 151.2093°E |
| Paris | Europe/Paris | 48.8566°N, 2.3522°E |
| Dubai | Asia/Dubai | 25.2048°N, 55.2708°E |
| Los Angeles | America/Los_Angeles | 34.0522°N, 118.2437°W |
| Singapore | Asia/Singapore | 1.3521°N, 103.8198°E |
| Mumbai | Asia/Kolkata | 19.0760°N, 72.8777°E |
| Moscow | Europe/Moscow | 55.7558°N, 37.6173°E |

## Code Structure

The code is organized into clear sections:

1. **Data Layer**: Predefined cities with coordinates and timezones
2. **State Management**: Tracking selected cities and display preferences
3. **Map Initialization**: Creating markers and handling interactions
4. **Clock Management**: Adding, removing, and displaying city clocks
5. **Time Calculation**: Using Intl.DateTimeFormat for accurate times
6. **Drag & Drop**: Reordering cities in the list
7. **UI Controls**: Time format toggle

## Customization

To add more cities, edit the `CITIES` array in the JavaScript section:

```javascript
const CITIES = [
    { name: "Your City", lat: 0.0, lng: 0.0, timezone: "Your/Timezone", x: 500, y: 250 },
    // ... more cities
];
```

## License

This project is provided as-is for educational and demonstration purposes.

## Credits

Created as a demonstration of modern web development techniques using vanilla JavaScript, HTML5, and CSS3.
