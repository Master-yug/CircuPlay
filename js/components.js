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
        // Draw battery body
        ctx.fillStyle = this.powered ? '#4cc9f0' : '#333';
        ctx.fillRect(this.x + 2, this.y + 6, 14, 8);
        
        // Draw battery terminals
        ctx.fillStyle = this.powered ? '#4cc9f0' : '#666';
        ctx.fillRect(this.x, this.y + 8, 2, 4); // Negative terminal
        ctx.fillRect(this.x + 18, this.y + 8, 2, 4); // Positive terminal
        
        // Draw plus/minus symbols
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.fillText('+', this.x + 14, this.y + 12);
        ctx.fillText('-', this.x + 4, this.y + 12);
        
        // Power indicator
        if (this.powered) {
            ctx.strokeStyle = '#4cc9f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
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
        // Draw LED body
        ctx.fillStyle = this.powered ? this.color : '#333';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw LED legs
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x + 8, this.y + 18, 1, 2);
        ctx.fillRect(this.x + 11, this.y + 18, 1, 2);
        
        // Glow effect when powered
        if (this.powered) {
            this.glowRadius = Math.min(this.glowRadius + 0.5, 12);
            
            // Create radial gradient for glow
            const gradient = ctx.createRadialGradient(
                this.x + 10, this.y + 10, 0,
                this.x + 10, this.y + 10, this.glowRadius
            );
            gradient.addColorStop(0, this.color + '80');
            gradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 10, this.glowRadius, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            this.glowRadius = Math.max(this.glowRadius - 1, 0);
        }
        
        // Highlight when powered
        if (this.powered) {
            ctx.strokeStyle = this.color;
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
        // Draw switch terminals
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x + 2, this.y + 9, 4, 2);
        ctx.fillRect(this.x + 14, this.y + 9, 4, 2);
        
        // Draw switch lever
        ctx.strokeStyle = this.closed ? '#4cc9f0' : '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 10);
        if (this.closed) {
            ctx.lineTo(this.x + 14, this.y + 10);
        } else {
            ctx.lineTo(this.x + 14, this.y + 6);
        }
        ctx.stroke();
        
        // Switch state indicator
        ctx.fillStyle = this.closed ? '#4cc9f0' : '#ff6b6b';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 10, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Power indicator
        if (this.powered && this.closed) {
            ctx.strokeStyle = '#4cc9f0';
            ctx.lineWidth = 1;
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
        // Draw wire
        ctx.strokeStyle = this.powered ? '#4cc9f0' : '#666';
        ctx.lineWidth = this.powered ? 3 : 2;
        
        // Draw cross pattern for wire
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y + 10);
        ctx.lineTo(this.x + 18, this.y + 10);
        ctx.moveTo(this.x + 10, this.y + 2);
        ctx.lineTo(this.x + 10, this.y + 18);
        ctx.stroke();
        
        // Current flow animation
        if (this.powered) {
            ctx.fillStyle = '#4cc9f0';
            const time = Date.now() * 0.005;
            const sparkX = this.x + 10 + Math.sin(time) * 4;
            const sparkY = this.y + 10 + Math.cos(time) * 4;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1, 0, 2 * Math.PI);
            ctx.fill();
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
        // Draw gate body
        ctx.fillStyle = this.powered ? '#4cc9f0' : '#666';
        ctx.fillRect(this.x + 2, this.y + 2, 16, 16);
        
        // Draw input terminals
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y + 6, 2, 2);
        ctx.fillRect(this.x, this.y + 12, 2, 2);
        
        // Draw output terminal
        ctx.fillRect(this.x + 18, this.y + 9, 2, 2);
        
        // Power indicator
        if (this.powered) {
            ctx.strokeStyle = '#4cc9f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }
    }
}

// AND Gate
class ANDGate extends LogicGate {
    constructor(x, y) {
        super('and-gate', x, y);
    }
    
    calculate() {
        return this.inputs.length > 0 && this.inputs.every(input => input);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw AND symbol
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('&', this.x + 8, this.y + 12);
    }
}

// OR Gate
class ORGate extends LogicGate {
    constructor(x, y) {
        super('or-gate', x, y);
    }
    
    calculate() {
        return this.inputs.some(input => input);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw OR symbol
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('≥1', this.x + 6, this.y + 12);
    }
}

// NOT Gate
class NOTGate extends LogicGate {
    constructor(x, y) {
        super('not-gate', x, y);
    }
    
    calculate() {
        return this.inputs.length > 0 ? !this.inputs[0] : false;
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw NOT symbol
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('!', this.x + 9, this.y + 12);
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
            default:
                console.warn(`Unknown component type: ${type}`);
                return null;
        }
    }
}