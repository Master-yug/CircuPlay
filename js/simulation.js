// Circuit Simulation Engine for CircuPlay
class CircuitSimulator {
    constructor(grid) {
        this.grid = grid;
        this.running = false;
        this.components = [];
        this.powerSources = [];
        this.animationId = null;
        this.lastUpdate = 0;
        this.updateInterval = 100; // Update every 100ms
    }
    
    // Add component to simulation
    addComponent(component) {
        if (!this.components.includes(component)) {
            this.components.push(component);
            
            // Track power sources separately
            if (component.type === 'battery') {
                this.powerSources.push(component);
            }
        }
    }
    
    // Remove component from simulation
    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
        }
        
        const powerIndex = this.powerSources.indexOf(component);
        if (powerIndex > -1) {
            this.powerSources.splice(powerIndex, 1);
        }
    }
    
    // Start simulation
    start() {
        this.running = true;
        this.simulate();
    }
    
    // Stop simulation
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // Main simulation loop
    simulate() {
        if (!this.running) return;
        
        const now = Date.now();
        if (now - this.lastUpdate >= this.updateInterval) {
            this.updateCircuit();
            this.lastUpdate = now;
        }
        
        this.animationId = requestAnimationFrame(() => this.simulate());
    }
    
    // Update circuit state
    updateCircuit() {
        // Reset all component power states (except batteries)
        this.components.forEach(component => {
            if (component.type !== 'battery') {
                component.powered = false;
                if (component instanceof LogicGate) {
                    component.inputs = [];
                }
            }
        });
        
        // Propagate power from each power source
        this.powerSources.forEach(powerSource => {
            if (powerSource.powered) {
                this.propagatePower(powerSource, new Set());
            }
        });
        
        // Update all components
        this.components.forEach(component => {
            component.update();
        });
        
        // Update logic gates
        this.updateLogicGates();
    }
    
    // Propagate power through the circuit
    propagatePower(source, visited) {
        if (visited.has(source.id)) return;
        visited.add(source.id);
        
        const neighbors = this.grid.getNeighbors(source.gridX, source.gridY);
        
        for (const neighbor of neighbors) {
            const component = neighbor.component;
            
            // Skip if already visited or can't conduct
            if (visited.has(component.id) || !this.canConduct(component)) {
                continue;
            }
            
            // Power the component
            component.powered = true;
            
            // Continue propagation through wires and conductors
            if (this.shouldPropagate(component)) {
                this.propagatePower(component, visited);
            }
        }
    }
    
    // Check if component can conduct electricity
    canConduct(component) {
        switch (component.type) {
            case 'wire':
                return true;
            case 'resistor':
                return true;
            case 'led':
                return true;
            case 'switch':
                return component.closed;
            case 'and-gate':
            case 'or-gate':
            case 'not-gate':
                return true;
            case 'battery':
                return true;
            default:
                return false;
        }
    }
    
    // Check if power should continue propagating through this component
    shouldPropagate(component) {
        switch (component.type) {
            case 'wire':
                return true;
            case 'switch':
                return component.closed;
            case 'resistor':
                return true; // Simplified - resistors conduct in this model
            case 'and-gate':
            case 'or-gate':
            case 'not-gate':
                return component.output; // Only propagate if gate output is high
            default:
                return false;
        }
    }
    
    // Update logic gate inputs and outputs
    updateLogicGates() {
        const gates = this.components.filter(c => c instanceof LogicGate);
        
        gates.forEach(gate => {
            gate.inputs = [];
            
            // Get input values from neighboring components
            const neighbors = this.grid.getNeighbors(gate.gridX, gate.gridY);
            
            for (const neighbor of neighbors) {
                const component = neighbor.component;
                
                // Check if this is an input connection (left side of gate)
                if (neighbor.direction.dx === -1) { // Coming from the left
                    gate.inputs.push(component.powered);
                }
            }
            
            // Calculate gate output
            gate.update();
        });
    }
    
    // Create a simple circuit (for testing)
    createSimpleCircuit() {
        // Create a simple LED circuit: Battery -> Wire -> LED -> Wire -> Battery
        const battery = ComponentFactory.create('battery', 0, 0);
        const wire1 = ComponentFactory.create('wire', 20, 0);
        const led = ComponentFactory.create('led', 40, 0);
        const wire2 = ComponentFactory.create('wire', 60, 0);
        
        // Place components on grid
        this.grid.placeComponent(battery, 0, 0);
        this.grid.placeComponent(wire1, 1, 0);
        this.grid.placeComponent(led, 2, 0);
        this.grid.placeComponent(wire2, 3, 0);
        
        // Add to simulation
        this.addComponent(battery);
        this.addComponent(wire1);
        this.addComponent(led);
        this.addComponent(wire2);
        
        return [battery, wire1, led, wire2];
    }
    
    // Create a blinking LED circuit
    createBlinkingLED() {
        this.grid.clear();
        
        // Simple blinking LED with switch
        const battery = ComponentFactory.create('battery', 0, 0);
        const switchComp = ComponentFactory.create('switch', 20, 0);
        const led = ComponentFactory.create('led', 40, 0);
        const wire1 = ComponentFactory.create('wire', 60, 0);
        
        // Place components
        this.grid.placeComponent(battery, 0, 0);
        this.grid.placeComponent(switchComp, 1, 0);
        this.grid.placeComponent(led, 2, 0);
        this.grid.placeComponent(wire1, 3, 0);
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        this.addComponent(battery);
        this.addComponent(switchComp);
        this.addComponent(led);
        this.addComponent(wire1);
        
        // Auto-toggle switch to create blinking effect
        setInterval(() => {
            switchComp.toggle();
        }, 1000);
        
        return [battery, switchComp, led, wire1];
    }
    
    // Create a basic AND gate circuit
    createBasicANDGate() {
        this.grid.clear();
        
        // Create AND gate circuit
        const battery1 = ComponentFactory.create('battery', 0, 0);
        const battery2 = ComponentFactory.create('battery', 0, 20);
        const switch1 = ComponentFactory.create('switch', 20, 0);
        const switch2 = ComponentFactory.create('switch', 20, 20);
        const wire1 = ComponentFactory.create('wire', 40, 0);
        const wire2 = ComponentFactory.create('wire', 40, 20);
        const andGate = ComponentFactory.create('and-gate', 60, 10);
        const led = ComponentFactory.create('led', 80, 10);
        
        // Place components
        this.grid.placeComponent(battery1, 0, 0);
        this.grid.placeComponent(battery2, 0, 1);
        this.grid.placeComponent(switch1, 1, 0);
        this.grid.placeComponent(switch2, 1, 1);
        this.grid.placeComponent(wire1, 2, 0);
        this.grid.placeComponent(wire2, 2, 1);
        this.grid.placeComponent(andGate, 3, 0);
        this.grid.placeComponent(led, 4, 0);
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        [battery1, battery2, switch1, switch2, wire1, wire2, andGate, led].forEach(comp => {
            this.addComponent(comp);
        });
        
        return [battery1, battery2, switch1, switch2, wire1, wire2, andGate, led];
    }
    
    // Get circuit statistics
    getStats() {
        const stats = {
            totalComponents: this.components.length,
            poweredComponents: this.components.filter(c => c.powered).length,
            powerSources: this.powerSources.length,
            switches: this.components.filter(c => c.type === 'switch').length,
            leds: this.components.filter(c => c.type === 'led').length,
            gates: this.components.filter(c => c instanceof LogicGate).length
        };
        
        return stats;
    }
    
    // Export circuit data
    exportCircuit() {
        return this.grid.export();
    }
    
    // Import circuit data
    importCircuit(data) {
        this.stop();
        this.components = [];
        this.powerSources = [];
        this.grid.import(data);
        this.start();
    }
    
    // Validate circuit for common issues
    validateCircuit() {
        const issues = [];
        
        // Check for isolated components
        const isolatedComponents = this.components.filter(component => {
            const neighbors = this.grid.getNeighbors(component.gridX, component.gridY);
            return neighbors.length === 0 && component.type !== 'battery';
        });
        
        if (isolatedComponents.length > 0) {
            issues.push(`${isolatedComponents.length} isolated component(s) found`);
        }
        
        // Check for power sources
        if (this.powerSources.length === 0) {
            issues.push('No power sources found');
        }
        
        // Check for short circuits (simplified)
        const batteries = this.components.filter(c => c.type === 'battery');
        batteries.forEach(battery => {
            const directNeighbors = this.grid.getNeighbors(battery.gridX, battery.gridY);
            const directBatteryConnections = directNeighbors.filter(n => n.component.type === 'battery');
            if (directBatteryConnections.length > 0) {
                issues.push('Potential short circuit: batteries directly connected');
            }
        });
        
        return issues;
    }
}