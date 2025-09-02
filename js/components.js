// Component System for CircuPlay
class Component {
    constructor(type, x = 0, y = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.gridX = 0;
        this.gridY = 0;
        this.width = 20;
        this.height = 20;
        this.powered = false;
        this.connections = [];
        this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Draw component on canvas
    draw(ctx) {
        // Override in subclasses
    }
    
    // Update component state
    update() {
        // Override in subclasses
    }
    
    // Check if component can connect to another
    canConnectTo(other) {
        return true; // Default: can connect to any component
    }
    
    // Add connection to another component
    addConnection(component) {
        if (!this.connections.includes(component)) {
            this.connections.push(component);
        }
    }
    
    // Remove connection
    removeConnection(component) {
        const index = this.connections.indexOf(component);
        if (index > -1) {
            this.connections.splice(index, 1);
        }
    }
    
    // Get component properties for serialization
    getProperties() {
        return {
            powered: this.powered
        };
    }
    
    // Set properties from serialization
    setProperties(props) {
        if (props.powered !== undefined) {
            this.powered = props.powered;
        }
    }
    
    // Check if point is inside component
    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}

// Battery Component
class Battery extends Component {
    constructor(x, y) {
        super('battery', x, y);
        this.voltage = 5; // 5V battery
        this.powered = true; // Batteries are always powered
    }
    
    draw(ctx) {
        // Draw battery body with PCB-style appearance
        ctx.fillStyle = this.powered ? '#1a4d1a' : '#0d2d0d';
        ctx.fillRect(this.x + 2, this.y + 6, 14, 8);
        
        // Draw PCB-style border
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 2, this.y + 6, 14, 8);
        
        // Draw copper terminals
        ctx.fillStyle = '#cd7f32'; // Copper color
        ctx.fillRect(this.x, this.y + 8, 2, 4); // Negative terminal
        ctx.fillRect(this.x + 18, this.y + 8, 2, 4); // Positive terminal
        
        // Draw plus/minus symbols
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('+', this.x + 14, this.y + 12);
        ctx.fillText('-', this.x + 4, this.y + 12);
        
        // Power indicator with green LED style
        if (this.powered) {
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
            
            // Add power LED indicator
            ctx.fillStyle = '#00ff41';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 3, this.y + 3, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    update() {
        // Batteries provide power to connected components
        this.powered = true;
    }
}

// LED Component
class LED extends Component {
    constructor(x, y) {
        super('led', x, y);
        this.color = '#ff6b6b';
        this.glowRadius = 0;
    }
    
    draw(ctx) {
        // Draw LED body with PCB component style
        ctx.fillStyle = this.powered ? this.color : '#2a3429';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw PCB-style border
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 7, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw copper pads/legs
        ctx.fillStyle = '#cd7f32'; // Copper color
        ctx.fillRect(this.x + 8, this.y + 18, 2, 2);
        ctx.fillRect(this.x + 10, this.y + 18, 2, 2);
        
        // Glow effect when powered
        if (this.powered) {
            this.glowRadius = Math.min(this.glowRadius + 0.5, 15);
            
            // Create radial gradient for glow
            const gradient = ctx.createRadialGradient(
                this.x + 10, this.y + 10, 0,
                this.x + 10, this.y + 10, this.glowRadius
            );
            gradient.addColorStop(0, this.color + '60');
            gradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 10, this.glowRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add bright center dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 10, 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            this.glowRadius = Math.max(this.glowRadius - 1, 0);
        }
        
        // Power indicator border
        if (this.powered) {
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }
    }
}

// Resistor Component
class Resistor extends Component {
    constructor(x, y) {
        super('resistor', x, y);
        this.resistance = 100; // 100 ohms
    }
    
    draw(ctx) {
        // Draw resistor body
        ctx.fillStyle = this.powered ? '#daa520' : '#8b4513';
        ctx.fillRect(this.x + 2, this.y + 8, 16, 4);
        
        // Draw resistor bands (color coding)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 4, this.y + 7, 1, 6);
        ctx.fillRect(this.x + 7, this.y + 7, 1, 6);
        ctx.fillRect(this.x + 10, this.y + 7, 1, 6);
        ctx.fillRect(this.x + 13, this.y + 7, 1, 6);
        
        // Draw leads
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x, this.y + 9, 2, 2);
        ctx.fillRect(this.x + 18, this.y + 9, 2, 2);
        
        // Current flow indicator
        if (this.powered) {
            ctx.strokeStyle = '#4cc9f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }
    }
}

// Switch Component
class Switch extends Component {
    constructor(x, y) {
        super('switch', x, y);
        this.closed = false;
    }
    
    draw(ctx) {
        // Draw PCB-style switch body
        ctx.fillStyle = this.closed ? '#1a4d1a' : '#2a1a1a';
        ctx.fillRect(this.x + 3, this.y + 7, 14, 6);
        
        // Draw PCB-style border
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 3, this.y + 7, 14, 6);
        
        // Draw copper terminals
        ctx.fillStyle = '#cd7f32'; // Copper color
        ctx.fillRect(this.x, this.y + 9, 3, 2);
        ctx.fillRect(this.x + 17, this.y + 9, 3, 2);
        
        // Draw switch lever/actuator
        ctx.fillStyle = this.closed ? '#00ff41' : '#ff4444';
        ctx.fillRect(this.x + 8, this.y + 4, 4, 3);
        
        // Switch state indicator
        ctx.fillStyle = this.closed ? '#00ff41' : '#ff4444';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 15, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Power indicator when closed and powered
        if (this.closed && this.powered) {
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }
    }
    
    update() {
        // Switch only conducts when closed
        if (!this.closed) {
            this.powered = false;
        }
    }
    
    toggle() {
        this.closed = !this.closed;
    }
    
    getProperties() {
        return {
            ...super.getProperties(),
            closed: this.closed
        };
    }
    
    setProperties(props) {
        super.setProperties(props);
        if (props.closed !== undefined) {
            this.closed = props.closed;
        }
    }
}

// Wire Component
class Wire extends Component {
    constructor(x, y) {
        super('wire', x, y);
    }
    
    draw(ctx) {
        // Draw PCB trace-style wire
        ctx.strokeStyle = this.powered ? '#00ff41' : '#cd7f32'; // Copper color when unpowered, green when powered
        ctx.lineWidth = this.powered ? 4 : 3;
        
        // Draw cross pattern for wire (PCB trace style)
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y + 10);
        ctx.lineTo(this.x + 18, this.y + 10);
        ctx.moveTo(this.x + 10, this.y + 2);
        ctx.lineTo(this.x + 10, this.y + 18);
        ctx.stroke();
        
        // Add PCB-style via point in center
        ctx.fillStyle = this.powered ? '#00ff41' : '#b8860b'; // Darker copper
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Current flow animation for powered wires
        if (this.powered) {
            const time = Date.now() * 0.003;
            const pulseAlpha = (Math.sin(time) + 1) * 0.3 + 0.2;
            ctx.strokeStyle = `rgba(0, 255, 65, ${pulseAlpha})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(this.x + 2, this.y + 10);
            ctx.lineTo(this.x + 18, this.y + 10);
            ctx.moveTo(this.x + 10, this.y + 2);
            ctx.lineTo(this.x + 10, this.y + 18);
            ctx.stroke();
        }
        
        // Connection points
        ctx.fillStyle = this.powered ? '#4cc9f0' : '#333';
        ctx.fillRect(this.x + 9, this.y + 9, 2, 2);
    }
}

// Logic Gate Base Class
class LogicGate extends Component {
    constructor(type, x, y) {
        super(type, x, y);
        this.inputs = [];
        this.output = false;
        // Make logic gates 2x1 size (40x20 pixels) for better wire connections
        this.width = 20;
        this.height = 40; // 2 grid cells tall
        this.gridWidth = 1;  // 1 cell wide
        this.gridHeight = 2; // 2 cells tall
    }
    
    addInput(value) {
        this.inputs.push(value);
    }
    
    calculate() {
        // Override in subclasses
        return false;
    }
    
    update() {
        this.output = this.calculate();
        this.powered = this.output;
    }
    
    draw(ctx) {
        // Draw gate body with PCB-style appearance
        ctx.fillStyle = this.powered ? '#2a5234' : '#1a3024';
        ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        
        // Draw PCB-style border
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        
        // Draw input terminals (copper pads) - positioned for 2-cell height
        ctx.fillStyle = '#cd7f32'; // Copper color
        ctx.fillRect(this.x - 1, this.y + 8, 3, 3);   // Top input (first grid cell)
        ctx.fillRect(this.x - 1, this.y + 28, 3, 3);  // Bottom input (second grid cell)
        
        // Draw output terminal (copper pad)
        ctx.fillRect(this.x + this.width - 2, this.y + 18, 3, 3); // Center output
        
        // Power indicator with circuit board style
        if (this.powered) {
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Add power LED indicator
            ctx.fillStyle = '#00ff41';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 4, this.y + 4, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

// AND Gate
class ANDGate extends LogicGate {
    constructor(x, y) {
        super('and-gate', x, y);
    }
    
    calculate() {
        // AND gate requires exactly 2 inputs to function properly
        if (this.inputs.length < 2) return false;
        return this.inputs[0] && this.inputs[1];
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw AND symbol with better positioning for 2x1 layout
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('&', this.x + this.width/2, this.y + this.height/2 + 4);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// OR Gate
class ORGate extends LogicGate {
    constructor(x, y) {
        super('or-gate', x, y);
    }
    
    calculate() {
        // OR gate requires at least 1 input, but works best with 2
        if (this.inputs.length < 1) return false;
        return this.inputs.some(input => input);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw OR symbol with better positioning for 2x1 layout
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('≥1', this.x + this.width/2, this.y + this.height/2 + 3);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// NOT Gate
class NOTGate extends LogicGate {
    constructor(x, y) {
        super('not-gate', x, y);
    }
    
    calculate() {
        // NOT gate requires exactly 1 input
        return this.inputs.length > 0 ? !this.inputs[0] : false;
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw NOT symbol with better positioning for 2x1 layout
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', this.x + this.width/2, this.y + this.height/2 + 5);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// XOR Gate
class XORGate extends LogicGate {
    constructor(x, y) {
        super('xor-gate', x, y);
    }
    
    calculate() {
        // XOR gate requires exactly 2 inputs
        if (this.inputs.length < 2) return false;
        return this.inputs[0] !== this.inputs[1];
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw XOR symbol with better positioning for 2x1 layout
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('XOR', this.x + this.width/2, this.y + this.height/2 + 3);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// NAND Gate
class NANDGate extends LogicGate {
    constructor(x, y) {
        super('nand-gate', x, y);
    }
    
    calculate() {
        // NAND gate requires exactly 2 inputs
        if (this.inputs.length < 2) return true;
        return !(this.inputs[0] && this.inputs[1]);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw NAND symbol with better positioning for 2x1 layout
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NAND', this.x + this.width/2, this.y + this.height/2 + 3);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// NOR Gate
class NORGate extends LogicGate {
    constructor(x, y) {
        super('nor-gate', x, y);
    }
    
    calculate() {
        // NOR gate requires exactly 2 inputs
        if (this.inputs.length < 2) return true;
        return !(this.inputs[0] || this.inputs[1]);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw NOR symbol with better positioning for 2x1 layout
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NOR', this.x + this.width/2, this.y + this.height/2 + 3);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// Component Factory
class ComponentFactory {
    static create(type, x, y) {
        switch (type) {
            case 'battery':
                return new Battery(x, y);
            case 'led':
                return new LED(x, y);
            case 'resistor':
                return new Resistor(x, y);
            case 'switch':
                return new Switch(x, y);
            case 'wire':
                return new Wire(x, y);
            case 'and-gate':
                return new ANDGate(x, y);
            case 'or-gate':
                return new ORGate(x, y);
            case 'not-gate':
                return new NOTGate(x, y);
            case 'xor-gate':
                return new XORGate(x, y);
            case 'nand-gate':
                return new NANDGate(x, y);
            case 'nor-gate':
                return new NORGate(x, y);
            default:
                console.warn(`Unknown component type: ${type}`);
                return null;
        }
    }
}