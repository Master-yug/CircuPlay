# CircuPlay – Pixel Sandbox for Circuits

 A browser-based retro-pixel themed sandbox where users can drag & drop circuit components onto a grid and see them "come alive" with pixel animations.

## Features

### Core Features
- **Breadboard-style grid background** with retro 8-bit pixel aesthetic
- **Drag & drop components**: wires, batteries, resistors, LEDs, switches, and basic logic gates (AND, OR, NOT)
- **Real-time circuit simulation**:
  - Current flows from power → wire → component
  - LEDs light up when powered with glow effects
  - Logic gates calculate outputs instantly
  - Switches can be toggled to control flow
- **Pixel-style animations**: sparks moving along wires, LED glow effects
- **Save/Load circuits** with JSON format using localStorage
- **Export/Import JSON** for sharing circuits
- **Pre-built starter circuits** (blinking LED, basic AND gate)

### Technical Features
- **Fully client-side** - runs entirely in browser (no backend required)
- **Static hosting compatible** - perfect for GitHub Pages
- **Lightweight** - no external dependencies, pure vanilla JavaScript
- **Responsive design** - works on desktop and mobile browsers
- **Pixel-perfect rendering** with HTML5 Canvas

## How to Use

### Building Circuits
1. **Drag components** from the left toolbar onto the grid
2. **Click switches** to toggle them on/off
3. **Right-click components** to delete them
4. **Watch the magic** as LEDs light up and current flows through wires!

### Keyboard Shortcuts
- `Delete`/`Backspace`: Delete selected component
- `Escape`: Deselect component
- `Ctrl+S`: Save circuit
- `Ctrl+O`: Load circuit
- `Ctrl+C`: Clear circuit

## Components

| Component | Description | Behavior |
|-----------|-------------|----------|
|  **Battery** | Power source (5V) | Always powered, provides current to connected components |
|  **LED** | Light-emitting diode | Lights up and glows when powered |
|  **Resistor** | Current limiter | Conducts electricity (simplified model) |
|  **Switch** | On/off control | Click to toggle open/closed state |
|  **Wire** | Conductor | Carries current between components with spark animation |
|  **AND Gate** | Logic gate | Output HIGH only when both inputs are HIGH |
|  **OR Gate** | Logic gate | Output HIGH when at least one input is HIGH |
|  **NOT Gate** | Logic inverter | Output opposite of input (HIGH→LOW, LOW→HIGH) |

## File Structure

```
CircuPlayCOPILOT/
├── index.html          # Main HTML page
├── css/
│   ├── style.css       # Main retro-pixel styling
│   └── components.css  # Component-specific styles
├── js/
│   ├── main.js         # Main application logic
│   ├── grid.js         # Grid system for component placement
│   ├── components.js   # Component classes and factory
│   ├── simulation.js   # Circuit simulation engine
│   ├── ui.js          # UI controls and interactions
│   └── storage.js     # Save/load functionality
└── README.md          # This file
```

## Save/Load Format

Circuits are saved as JSON with the following structure:
```json
{
  "name": "My Circuit",
  "description": "Circuit description",
  "data": {
    "gridSize": 20,
    "components": [
      {
        "type": "battery",
        "x": 0,
        "y": 0,
        "properties": {}
      }
    ]
  },
  "timestamp": 1640995200000,
  "version": "1.0"
}
```

## Development

### Architecture
- **Grid System**: Manages component placement on a 2D grid
- **Component System**: Object-oriented component classes with inheritance
- **Simulation Engine**: Handles power flow and logic calculations
- **UI Manager**: Handles all user interactions and rendering
- **Storage Manager**: Manages save/load operations and localStorage

### Performance
- **60 FPS rendering** with requestAnimationFrame
- **Efficient grid-based collision detection**
- **Minimal DOM manipulation** (canvas-based rendering)
- **Lazy evaluation** of circuit simulation

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Acknowledgments

- Inspired by **Virtual Circuit Board** and **Turing Complete**
- Retro aesthetic inspired by classic 8-bit games
- Built with using vanilla JavaScript and HTML5 Canvas

---

**Made with wires by [Master-yug](https://github.com/Master-yug)**

*Have fun building circuits! *





