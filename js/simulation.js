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
        
        // Update logic gates after power propagation so they can see powered inputs
        this.updateLogicGates();
        
        // Propagate power from logic gates that now have output=true
        const gates = this.components.filter(c => c instanceof LogicGate);
        gates.forEach(gate => {
            if (gate.output) {
                this.propagatePower(gate, new Set());
            }
        });
        
        // Update all components again after logic gate power propagation
        this.components.forEach(component => {
            component.update();
        });
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
        
        // Special handling for logic gates - propagate power from output terminal
        if (source instanceof LogicGate && source.output) {
            // For logic gates, also check the output position (to the right of the gate)
            const outputX = source.gridX + 1;
            const outputY = source.gridY + 1; // Middle of the 3x1 gate
            
            const outputComponent = this.grid.getComponent(outputX, outputY);
            if (outputComponent && !visited.has(outputComponent.id) && this.canConduct(outputComponent)) {
                outputComponent.powered = true;
                if (this.shouldPropagate(outputComponent)) {
                    this.propagatePower(outputComponent, visited);
                }
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
            case 'push-button':
                return component.closed;
            case 'buzzer':
                return true;
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
            case 'push-button':
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
            
            // For 3x1 gates, check inputs at first and third grid positions (skipping middle)
            const inputPositions = [
                { x: gate.gridX - 1, y: gate.gridY },     // Top input (left of first cell)
                { x: gate.gridX - 1, y: gate.gridY + 2 }  // Bottom input (left of third cell, skipping middle)
            ];
            
            inputPositions.forEach(pos => {
                const component = this.grid.getComponent(pos.x, pos.y);
                if (component && component !== gate) {
                    gate.inputs.push(component.powered);
                }
            });
            
            // Limit to 2 inputs maximum for proper gate behavior
            gate.inputs = gate.inputs.slice(0, 2);
            
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
        
        // Create AND gate circuit with proper spacing for 3x1 gate
        const battery1 = ComponentFactory.create('battery', 0, 0);
        const battery2 = ComponentFactory.create('battery', 0, 40);
        const switch1 = ComponentFactory.create('switch', 20, 0);
        const switch2 = ComponentFactory.create('switch', 20, 40);
        const wire1 = ComponentFactory.create('wire', 40, 0);
        const wire2 = ComponentFactory.create('wire', 40, 40);
        const andGate = ComponentFactory.create('and-gate', 60, 10);
        const led = ComponentFactory.create('led', 80, 20);
        
        // Place components with proper grid spacing for 3x1 AND gate
        this.grid.placeComponent(battery1, 0, 0);
        this.grid.placeComponent(battery2, 0, 2);  // Skip middle row for gap
        this.grid.placeComponent(switch1, 1, 0);
        this.grid.placeComponent(switch2, 1, 2);  // Skip middle row for gap
        this.grid.placeComponent(wire1, 2, 0);
        this.grid.placeComponent(wire2, 2, 2);    // Skip middle row for gap
        this.grid.placeComponent(andGate, 3, 0);  // 3x1 gate spans rows 0,1,2
        this.grid.placeComponent(led, 4, 1);      // Center LED at middle row
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        [battery1, battery2, switch1, switch2, wire1, wire2, andGate, led].forEach(comp => {
            this.addComponent(comp);
        });
        
        return [battery1, battery2, switch1, switch2, wire1, wire2, andGate, led];
    }
    
    // Create XOR gate demonstration circuit
    createXORDemo() {
        this.grid.clear();
        
        // Create XOR gate demonstration with two inputs and output LED
        const battery1 = ComponentFactory.create('battery', 0, 0);
        const battery2 = ComponentFactory.create('battery', 0, 40);
        const switch1 = ComponentFactory.create('switch', 20, 0);
        const switch2 = ComponentFactory.create('switch', 20, 40);
        const wire1 = ComponentFactory.create('wire', 40, 0);
        const wire2 = ComponentFactory.create('wire', 40, 40);
        const xorGate = ComponentFactory.create('xor-gate', 60, 20);
        const led = ComponentFactory.create('led', 80, 20);
        
        // Place components
        this.grid.placeComponent(battery1, 0, 0);
        this.grid.placeComponent(battery2, 0, 2);
        this.grid.placeComponent(switch1, 1, 0);
        this.grid.placeComponent(switch2, 1, 2);
        this.grid.placeComponent(wire1, 2, 0);
        this.grid.placeComponent(wire2, 2, 2);
        this.grid.placeComponent(xorGate, 3, 1);
        this.grid.placeComponent(led, 4, 1);
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        [battery1, battery2, switch1, switch2, wire1, wire2, xorGate, led].forEach(comp => {
            this.addComponent(comp);
        });
        
        return [battery1, battery2, switch1, switch2, wire1, wire2, xorGate, led];
    }
    
    // Create a full adder circuit
    createFullAdder() {
        this.grid.clear();
        
        // Full adder: A, B, Cin inputs -> Sum, Cout outputs
        // Using XOR, AND, OR gates
        const batteryA = ComponentFactory.create('battery', 0, 0);
        const batteryB = ComponentFactory.create('battery', 0, 20);
        const batteryCin = ComponentFactory.create('battery', 0, 40);
        
        const switchA = ComponentFactory.create('switch', 20, 0);
        const switchB = ComponentFactory.create('switch', 20, 20);
        const switchCin = ComponentFactory.create('switch', 20, 40);
        
        // First XOR for A ⊕ B
        const xor1 = ComponentFactory.create('xor-gate', 60, 10);
        // Second XOR for (A ⊕ B) ⊕ Cin = Sum
        const xor2 = ComponentFactory.create('xor-gate', 100, 20);
        
        // AND gates for carry logic
        const and1 = ComponentFactory.create('and-gate', 60, 30);  // A & B
        const and2 = ComponentFactory.create('and-gate', 100, 40); // (A ⊕ B) & Cin
        
        // OR gate for final carry
        const or1 = ComponentFactory.create('or-gate', 140, 35);
        
        // Output LEDs
        const sumLED = ComponentFactory.create('led', 140, 20);    // Sum output
        const carryLED = ComponentFactory.create('led', 180, 35);  // Carry output
        
        // Place components
        this.grid.placeComponent(batteryA, 0, 0);
        this.grid.placeComponent(batteryB, 0, 1);
        this.grid.placeComponent(batteryCin, 0, 2);
        this.grid.placeComponent(switchA, 1, 0);
        this.grid.placeComponent(switchB, 1, 1);
        this.grid.placeComponent(switchCin, 1, 2);
        this.grid.placeComponent(xor1, 3, 0);
        this.grid.placeComponent(xor2, 5, 1);
        this.grid.placeComponent(and1, 3, 1);
        this.grid.placeComponent(and2, 5, 2);
        this.grid.placeComponent(or1, 7, 1);
        this.grid.placeComponent(sumLED, 7, 1);
        this.grid.placeComponent(carryLED, 9, 1);
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        [batteryA, batteryB, batteryCin, switchA, switchB, switchCin, 
         xor1, xor2, and1, and2, or1, sumLED, carryLED].forEach(comp => {
            this.addComponent(comp);
        });
        
        return [batteryA, batteryB, batteryCin, switchA, switchB, switchCin, 
                xor1, xor2, and1, and2, or1, sumLED, carryLED];
    }
    
    // Create SR flip-flop circuit
    createSRFlipFlop() {
        this.grid.clear();
        
        // SR flip-flop using NOR gates
        const batteryS = ComponentFactory.create('battery', 0, 0);
        const batteryR = ComponentFactory.create('battery', 0, 40);
        
        const switchS = ComponentFactory.create('switch', 20, 0);   // Set input
        const switchR = ComponentFactory.create('switch', 20, 40);  // Reset input
        
        // NOR gates (cross-coupled)
        const nor1 = ComponentFactory.create('nor-gate', 60, 10);   // Q output
        const nor2 = ComponentFactory.create('nor-gate', 60, 30);   // Q' output
        
        // Output LEDs
        const qLED = ComponentFactory.create('led', 100, 10);       // Q output
        const qNotLED = ComponentFactory.create('led', 100, 30);    // Q' output
        
        // Place components
        this.grid.placeComponent(batteryS, 0, 0);
        this.grid.placeComponent(batteryR, 0, 2);
        this.grid.placeComponent(switchS, 1, 0);
        this.grid.placeComponent(switchR, 1, 2);
        this.grid.placeComponent(nor1, 3, 0);
        this.grid.placeComponent(nor2, 3, 1);
        this.grid.placeComponent(qLED, 5, 0);
        this.grid.placeComponent(qNotLED, 5, 1);
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        [batteryS, batteryR, switchS, switchR, nor1, nor2, qLED, qNotLED].forEach(comp => {
            this.addComponent(comp);
        });
        
        return [batteryS, batteryR, switchS, switchR, nor1, nor2, qLED, qNotLED];
    }
    
    // Create a 4-bit counter circuit
    createCounter() {
        this.grid.clear();
        
        // Simple 4-bit counter using flip-flops (simplified representation)
        const clock = ComponentFactory.create('battery', 0, 20);
        const clockSwitch = ComponentFactory.create('switch', 20, 20);
        
        // 4 flip-flops (represented as toggle switches for simplicity)
        const ff1 = ComponentFactory.create('switch', 60, 0);   // Bit 0 (LSB)
        const ff2 = ComponentFactory.create('switch', 60, 20);  // Bit 1
        const ff3 = ComponentFactory.create('switch', 60, 40);  // Bit 2
        const ff4 = ComponentFactory.create('switch', 60, 60);  // Bit 3 (MSB)
        
        // Output LEDs for each bit
        const led1 = ComponentFactory.create('led', 80, 0);
        const led2 = ComponentFactory.create('led', 80, 20);
        const led3 = ComponentFactory.create('led', 80, 40);
        const led4 = ComponentFactory.create('led', 80, 60);
        
        // Logic gates for counter operation
        const and1 = ComponentFactory.create('and-gate', 100, 10);
        const and2 = ComponentFactory.create('and-gate', 100, 30);
        const and3 = ComponentFactory.create('and-gate', 100, 50);
        
        // Place components
        this.grid.placeComponent(clock, 0, 1);
        this.grid.placeComponent(clockSwitch, 1, 1);
        this.grid.placeComponent(ff1, 3, 0);
        this.grid.placeComponent(ff2, 3, 1);
        this.grid.placeComponent(ff3, 3, 2);
        this.grid.placeComponent(ff4, 3, 3);
        this.grid.placeComponent(led1, 4, 0);
        this.grid.placeComponent(led2, 4, 1);
        this.grid.placeComponent(led3, 4, 2);
        this.grid.placeComponent(led4, 4, 3);
        this.grid.placeComponent(and1, 5, 0);
        this.grid.placeComponent(and2, 5, 1);
        this.grid.placeComponent(and3, 5, 2);
        
        // Add to simulation
        this.components = [];
        this.powerSources = [];
        [clock, clockSwitch, ff1, ff2, ff3, ff4, led1, led2, led3, led4, and1, and2, and3].forEach(comp => {
            this.addComponent(comp);
        });
        
        // Auto-increment counter for demonstration
        let count = 0;
        setInterval(() => {
            count = (count + 1) % 16; // 4-bit counter (0-15)
            
            // Update switch states to represent binary count
            ff1.closed = (count & 1) === 1;
            ff2.closed = (count & 2) === 2;
            ff3.closed = (count & 4) === 4;
            ff4.closed = (count & 8) === 8;
        }, 2000);
        
        return [clock, clockSwitch, ff1, ff2, ff3, ff4, led1, led2, led3, led4, and1, and2, and3];
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