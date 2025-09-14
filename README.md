# CircuPlay – Pixel Sandbox for Circuits

 A browser-based retro-pixel themed sandbox where users can drag & drop circuit components onto a grid and see them "come alive" with pixel animations.

 [**DemoLink**](https://master-yug.github.io/CircuPlay/)

 ![CircuPlay Screenshot](https://github.com/user-attachments/assets/26e6ea76-5b86-42b3-8263-42809d56f654)

## Features

### Core Features
- **Breadboard-style grid background** with retro 8-bit pixel aesthetic
- **Drag & drop components**: wires, batteries, resistors, LEDs, switches, push buttons, buzzer, and logic gates (AND, OR, NOT, XOR, NAND, NOR)
- **Real-time circuit simulation**:
  - Current flows from power → wire → component
  - LEDs light up when powered with glow effects
  - Logic gates calculate outputs instantly
  - Switches can be toggled to control flow
  - Push buttons provide momentary connections
  - Buzzer produces audio when powered
- **Pixel-style animations**: sparks moving along wires, LED glow effects
- **Retro 8-bit audio system**: Sound effects for interactions and feedback
- **Save/Load circuits** with JSON format using localStorage
- **Export/Import JSON** for sharing circuits
- **Pre-built starter circuits** (blinking LED, basic AND gate)
- **Audio controls**: Volume adjustment and mute toggle
- **Undo/Redo system**: Full action history with 50-action memory
- **Component rotation**: Right-click context menu to rotate components

### Technical Features
- **Fully client-side** - runs entirely in browser (no backend required)
- **Static hosting compatible** - perfect for GitHub Pages
- **Lightweight** - no external dependencies, pure vanilla JavaScript
- **Responsive design** - works on desktop and mobile browsers
- **Pixel-perfect rendering** with HTML5 Canvas
- **Web Audio API integration** - retro 8-bit sound effects system
- **Advanced undo/redo** - 50-action history with state management
- **Component rotation system** - context menus and keyboard shortcuts

## How to Use

### Building Circuits
1. **Drag components** from the left toolbar onto the grid
2. **Click switches** to toggle them on/off
3. **Hold push buttons** to create momentary connections
4. **Right-click components** to delete or rotate them
5. **Use Ctrl+Z/Y** for undo/redo actions
6. **Watch the magic** as LEDs light up, buzzers sound, and current flows through wires!

### Navigation & Zoom
- **Zoom controls**: Use +/- buttons or keyboard shortcuts to zoom in/out
- **Pan controls**: Use arrow buttons to navigate around large circuits
- **Center view**: Click the home button to reset view position
- **Audio controls**: Adjust volume or mute sound effects

### Keyboard Shortcuts
- `Delete`/`Backspace`: Delete selected component
- `Escape`: Deselect component
- `R`: Rotate selected component
- `Tab`: Select next component
- `Enter`/`Space`: Toggle switch (when switch is selected)
- `Ctrl+S`: Save circuit
- `Ctrl+O`: Load circuit
- `Ctrl+C`: Clear circuit
- `Ctrl+E`: Export circuit to JSON file
- `Ctrl+I`: Import circuit from JSON file
- `Ctrl+Z`: Undo last action
- `Ctrl+Shift+Z` or `Ctrl+Y`: Redo last undone action
- `Ctrl+M`: Toggle audio on/off
- `Ctrl+H`: Show help dialog
- `Ctrl+G`: Toggle grid visibility
- `Ctrl++`: Zoom in
- `Ctrl+-`: Zoom out
- `Ctrl+0`: Reset zoom

## 🔧 Components

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
|  **XOR Gate** | Exclusive OR gate | Output HIGH when inputs are different |
|  **NAND Gate** | NOT-AND gate | Output LOW only when both inputs are HIGH |
|  **NOR Gate** | NOT-OR gate | Output LOW when at least one input is HIGH |

## 💾 File Structure

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
│   ├── storage.js     # Save/load functionality
│   └── audio.js       # Audio system and sound effects
└── README.md          # This file
```


## 🔄 Save/Load Format

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
- **Audio System**: Web Audio API-based retro sound effects

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
- *Special Thanks* to OpenAI and COPILOT for helping create Graphics elements and all the documentation for this project.
---

**Made with wires by [Master-yug](https://github.com/Master-yug)**

*Have fun building circuits!*





