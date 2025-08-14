// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
});

// Utility Functions
function ipToBinary(ip) {
    return ip.split('.').map(octet => {
        return parseInt(octet).toString(2).padStart(8, '0');
    }).join('.');
}

function getBlockSize(cidr) {
    // returns increment in the octet where subnetting occurs
    if (cidr <= 8) return Math.pow(2, 8 - cidr);
    if (cidr <= 16) return Math.pow(2, 16 - cidr);
    if (cidr <= 24) return Math.pow(2, 24 - cidr);
    return Math.pow(2, 32 - cidr);
}

function alignToNetwork(ip, cidr) {
    // Given ip string and cidr, return network base IP aligned to block
    const octets = ip.split('.').map(n => parseInt(n, 10));
    const block = getBlockSize(cidr);
    let index = 0;
    if (cidr <= 8) index = 0; else if (cidr <= 16) index = 1; else if (cidr <= 24) index = 2; else index = 3;
    const base = Math.floor(octets[index] / block) * block;
    octets[index] = base;
    for (let i = index + 1; i < 4; i++) octets[i] = 0;
    return octets.join('.');
}

function buildRangeTable(networkAddress, cidr) {
    const tbody = document.querySelector('#range-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // align base network just in case
    const base = alignToNetwork(networkAddress, cidr);
    const block = getBlockSize(cidr);
    let index = 0;
    if (cidr <= 8) index = 0; else if (cidr <= 16) index = 1; else if (cidr <= 24) index = 2; else index = 3;

    const totalPerSubnet = Math.pow(2, 32 - cidr);
    const showCount = 4; // show first four ranges like example

    let current = base.split('.').map(n => parseInt(n, 10));

    for (let i = 0; i < showCount; i++) {
        const start = current.slice();
        const end = current.slice();
        end[index] = end[index] + block - 1;
        for (let j = index + 1; j < 3; j++) end[j] = 255;
        // last octet end for non-/32
        if (index < 3) end[3] = 255; else end[3] = start[3] + block - 1;

        const firstHost = cidr >= 31 ? '-' : [start[0], start[1], start[2], start[3] + 1].join('.');
        const lastHost = cidr >= 31 ? '-' : [end[0], end[1], end[2], end[3] - 1].join('.');

        const tr = document.createElement('tr');
        const netTd = document.createElement('td');
        netTd.textContent = start.join('.');
        const usableTd = document.createElement('td');
        usableTd.textContent = `${firstHost} - ${lastHost}`;
        const bcastTd = document.createElement('td');
        bcastTd.textContent = end.join('.');
        tr.appendChild(netTd);
        tr.appendChild(usableTd);
        tr.appendChild(bcastTd);
        tbody.appendChild(tr);

        // advance
        const next = current.slice();
        next[index] = next[index] + block;
        // carry overflows
        for (let k = index; k > 0; k--) {
            if (next[k] > 255) {
                next[k] = next[k] - 256;
                next[k - 1] += 1;
            }
        }
        current = next;
    }
}

// Subnetting by Host Requirements
function calculateSubnettingByHosts() {
    const baseInput = document.getElementById('host-base-cidr').value.trim();
    const hostsRequired = parseInt(document.getElementById('hosts-required').value, 10);
    const match = baseInput.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!match) {
        alert('Please enter a valid base network in CIDR, e.g., 192.168.10.0/24');
        return;
    }
    const baseNetwork = match[1];
    const baseCidr = parseInt(match[2], 10);
    if (!validateIp(baseNetwork) || baseCidr < 0 || baseCidr > 32 || isNaN(hostsRequired) || hostsRequired < 1) {
        alert('Invalid inputs.');
        return;
    }

    // required host bits for each subnet
    const reqHostBits = Math.ceil(Math.log2(hostsRequired + 2));
    const newCidr = 32 - reqHostBits;
    if (newCidr < baseCidr) {
        alert('Requested hosts per subnet do not fit into the provided base network.');
        return;
    }

    const newMask = cidrToMask(newCidr);
    const usableHosts = Math.pow(2, reqHostBits) - 2;
    const magic = getBlockSize(newCidr);
    const totalSubnetsInsideBase = Math.pow(2, newCidr - baseCidr);

    document.getElementById('host-bits-req').textContent = reqHostBits;
    document.getElementById('new-mask-req').textContent = newMask;
    document.getElementById('new-cidr-req').textContent = `/${newCidr}`;
    document.getElementById('magic-number-req').textContent = magic;
    document.getElementById('total-subnets-req').textContent = totalSubnetsInsideBase;
    document.getElementById('usable-hosts-req').textContent = usableHosts;

    // Build ranges within base
    buildHostRanges(baseNetwork, baseCidr, newCidr);
}

function buildHostRanges(baseNetwork, baseCidr, newCidr) {
    const tbody = document.querySelector('#host-range-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const block = getBlockSize(newCidr);
    let index = 0;
    if (newCidr <= 8) index = 0; else if (newCidr <= 16) index = 1; else if (newCidr <= 24) index = 2; else index = 3;

    // start at aligned base
    let current = alignToNetwork(baseNetwork, baseCidr).split('.').map(n => parseInt(n, 10));

    const subnetsToShow = Math.min(4, Math.pow(2, newCidr - baseCidr));
    for (let i = 0; i < subnetsToShow; i++) {
        const start = current.slice();
        const end = current.slice();
        end[index] = end[index] + block - 1;
        for (let j = index + 1; j < 3; j++) end[j] = 255;
        if (index < 3) end[3] = 255; else end[3] = start[3] + block - 1;

        const firstHost = [start[0], start[1], start[2], start[3] + 1].join('.');
        const lastHost = [end[0], end[1], end[2], end[3] - 1].join('.');

        const tr = document.createElement('tr');
        const netTd = document.createElement('td');
        netTd.textContent = start.join('.');
        const usableTd = document.createElement('td');
        usableTd.textContent = `${firstHost} - ${lastHost}`;
        const bcastTd = document.createElement('td');
        bcastTd.textContent = end.join('.');
        tr.appendChild(netTd);
        tr.appendChild(usableTd);
        tr.appendChild(bcastTd);
        tbody.appendChild(tr);

        // advance subnet
        const next = current.slice();
        next[index] = next[index] + block;
        for (let k = index; k > 0; k--) {
            if (next[k] > 255) {
                next[k] = next[k] - 256;
                next[k - 1] += 1;
            }
        }
        current = next;
    }
}

// Subnetting by Network Requirements
function calculateSubnettingByNetworks() {
    const baseInput = document.getElementById('net-base-cidr').value.trim();
    const networksRequired = parseInt(document.getElementById('networks-required').value, 10);
    const match = baseInput.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!match) {
        alert('Please enter a valid base network in CIDR, e.g., 10.0.0.0/8');
        return;
    }
    const baseNetwork = match[1];
    const baseCidr = parseInt(match[2], 10);
    if (!validateIp(baseNetwork) || baseCidr < 0 || baseCidr > 32 || isNaN(networksRequired) || networksRequired < 1) {
        alert('Invalid inputs.');
        return;
    }

    // Minimum bits to satisfy required subnets
    const borrowBits = Math.ceil(Math.log2(networksRequired));
    const newCidr = baseCidr + borrowBits;
    if (newCidr > 32) {
        alert('Requested number of networks exceeds IPv4 capacity for this base.');
        return;
    }

    const newMask = cidrToMask(newCidr);
    const magic = getBlockSize(newCidr);
    const actualNetworks = Math.pow(2, borrowBits);
    const usableHosts = newCidr >= 31 ? 0 : Math.pow(2, 32 - newCidr) - 2;

    document.getElementById('net-bits').textContent = borrowBits;
    document.getElementById('net-new-mask').textContent = newMask;
    document.getElementById('net-new-cidr').textContent = `/${newCidr}`;
    document.getElementById('net-magic').textContent = magic;
    document.getElementById('net-required').textContent = networksRequired;
    document.getElementById('net-actual').textContent = actualNetworks;
    document.getElementById('net-usable-hosts').textContent = usableHosts;

    buildNetworkRanges(baseNetwork, baseCidr, newCidr);
}

function buildNetworkRanges(baseNetwork, baseCidr, newCidr) {
    const tbody = document.querySelector('#network-range-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const block = getBlockSize(newCidr);
    let index = 0;
    if (newCidr <= 8) index = 0; else if (newCidr <= 16) index = 1; else if (newCidr <= 24) index = 2; else index = 3;

    let current = alignToNetwork(baseNetwork, baseCidr).split('.').map(n => parseInt(n, 10));
    const totalSubnets = Math.pow(2, newCidr - baseCidr);
    const toShow = Math.min(4, totalSubnets);

    for (let i = 0; i < toShow; i++) {
        const start = current.slice();
        const end = current.slice();
        end[index] = end[index] + block - 1;
        for (let j = index + 1; j < 3; j++) end[j] = 255;
        if (index < 3) end[3] = 255; else end[3] = start[3] + block - 1;

        const firstHost = newCidr >= 31 ? '-' : [start[0], start[1], start[2], start[3] + 1].join('.');
        const lastHost = newCidr >= 31 ? '-' : [end[0], end[1], end[2], end[3] - 1].join('.');

        const tr = document.createElement('tr');
        const netTd = document.createElement('td');
        netTd.textContent = start.join('.');
        const usableTd = document.createElement('td');
        usableTd.textContent = `${firstHost} - ${lastHost}`;
        const bcastTd = document.createElement('td');
        bcastTd.textContent = end.join('.');
        tr.appendChild(netTd);
        tr.appendChild(usableTd);
        tr.appendChild(bcastTd);
        tbody.appendChild(tr);

        const next = current.slice();
        next[index] = next[index] + block;
        for (let k = index; k > 0; k--) {
            if (next[k] > 255) {
                next[k] = next[k] - 256;
                next[k - 1] += 1;
            }
        }
        current = next;
    }
}

function binaryToIp(binary) {
    return binary.split('.').map(octet => {
        return parseInt(octet, 2).toString();
    }).join('.');
}

function ipToDecimal(ip) {
    return ip.split('.').reduce((acc, octet) => {
        return (acc << 8) + parseInt(octet);
    }, 0);
}

function decimalToIp(decimal) {
    return [
        (decimal >>> 24) & 255,
        (decimal >>> 16) & 255,
        (decimal >>> 8) & 255,
        decimal & 255
    ].join('.');
}

function cidrToMask(cidr) {
    const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    return decimalToIp(mask);
}

function maskToCidr(mask) {
    const binary = ipToBinary(mask).replace(/\./g, '');
    return binary.split('1').length - 1;
}

function validateIp(ip) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    const octets = ip.split('.');
    return octets.every(octet => {
        const num = parseInt(octet);
        return num >= 0 && num <= 255;
    });
}

function validateMask(mask) {
    if (!validateIp(mask)) return false;
    
    const binary = ipToBinary(mask).replace(/\./g, '');
    const ones = binary.split('1').length - 1;
    const zeros = binary.split('0').length - 1;
    
    // Check if mask has consecutive 1s followed by consecutive 0s
    return binary.indexOf('01') === -1;
}

// Subnetting Calculator
function calculateSubnetting() {
    const networkCidr = document.getElementById('network-cidr').value.trim();
    
    // Validation
    const cidrMatch = networkCidr.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!cidrMatch) {
        alert('Please enter a valid network address in CIDR notation (e.g., 192.168.1.0/26)');
        return;
    }
    
    const networkAddress = cidrMatch[1];
    const cidr = parseInt(cidrMatch[2]);
    
    if (!validateIp(networkAddress) || cidr < 0 || cidr > 32) {
        alert('Please enter a valid network address and CIDR (0-32)');
        return;
    }

    try {
        // Determine network class
        const firstOctet = parseInt(networkAddress.split('.')[0]);
        let networkClass = '';
        if (firstOctet >= 1 && firstOctet <= 126) {
            networkClass = 'Class A';
        } else if (firstOctet >= 128 && firstOctet <= 191) {
            networkClass = 'Class B';
        } else if (firstOctet >= 192 && firstOctet <= 223) {
            networkClass = 'Class C';
        } else if (firstOctet >= 224 && firstOctet <= 239) {
            networkClass = 'Class D (Multicast)';
        } else if (firstOctet >= 240 && firstOctet <= 255) {
            networkClass = 'Class E (Experimental)';
        } else {
            networkClass = 'Invalid';
        }
        
        // Calculate borrowed bits based on class
        let borrowedBits = 0;
        if (networkClass === 'Class A') {
            borrowedBits = cidr - 8;
        } else if (networkClass === 'Class B') {
            borrowedBits = cidr - 16;
        } else if (networkClass === 'Class C') {
            borrowedBits = cidr - 24;
        } else {
            borrowedBits = cidr;
        }
        
        // Calculate subnet mask
        const subnetMask = cidrToMask(cidr);
        
        // Calculate magic number (increment value) = block size in the subnetting octet
        // Determine which octet is the subnetting boundary and compute increment
        let magicNumber = 0;
        if (cidr <= 8) {
            // subnetting in first octet
            const hostBitsInOctet = 8 - (cidr);
            magicNumber = Math.pow(2, hostBitsInOctet);
        } else if (cidr <= 16) {
            const rem = cidr - 8; // bits used in 2nd octet
            const hostBitsInOctet = 8 - rem;
            magicNumber = Math.pow(2, hostBitsInOctet);
        } else if (cidr <= 24) {
            const rem = cidr - 16; // bits used in 3rd octet
            const hostBitsInOctet = 8 - rem;
            magicNumber = Math.pow(2, hostBitsInOctet);
        } else {
            const rem = cidr - 24; // bits used in 4th octet
            const hostBitsInOctet = 8 - rem;
            magicNumber = Math.pow(2, hostBitsInOctet);
        }
        
        // Calculate total number of subnets
        let totalSubnets = 0;
        if (networkClass === 'Class A') {
            totalSubnets = Math.pow(2, Math.max(0, cidr - 8));
        } else if (networkClass === 'Class B') {
            totalSubnets = Math.pow(2, Math.max(0, cidr - 16));
        } else if (networkClass === 'Class C') {
            totalSubnets = Math.pow(2, Math.max(0, cidr - 24));
        } else {
            totalSubnets = Math.pow(2, cidr);
        }
        
        // Calculate total number of hosts per subnet
        const totalHosts = cidr === 31 ? 0 : cidr === 32 ? 1 : Math.pow(2, 32 - cidr) - 2; // handle /31,/32 edge cases
        
        // Display results
        document.getElementById('class-address').textContent = networkClass;
        document.getElementById('borrowed-bits').textContent = borrowedBits;
        document.getElementById('subnet-mask-result').textContent = subnetMask;
        document.getElementById('magic-number').textContent = magicNumber;
        document.getElementById('total-subnets').textContent = totalSubnets;
        document.getElementById('total-hosts').textContent = totalHosts;

        // Build ranges table (show first 4 subnets like example)
        buildRangeTable(networkAddress, cidr);
            
    } catch (error) {
        alert('An error occurred during calculation. Please check your inputs.');
        console.error(error);
    }
}

// VLSM Calculator
function addSubnet() {
    const subnetList = document.getElementById('subnet-list');
    const newSubnet = document.createElement('div');
    newSubnet.className = 'subnet-input';
    newSubnet.innerHTML = `
        <input type="text" placeholder="Subnet Name" class="subnet-name" value="LAN${subnetList.children.length + 1}">
        <input type="number" placeholder="Hosts" class="subnet-hosts" value="10" min="1">
        <button class="remove-subnet" onclick="removeSubnet(this)"><i class="fas fa-trash"></i></button>
    `;
    subnetList.appendChild(newSubnet);
}

function removeSubnet(button) {
    if (document.querySelectorAll('.subnet-input').length > 1) {
        button.parentElement.remove();
    }
}

function calculateVLSM() {
    const networkAddress = document.getElementById('vlsm-network').value.trim();
    const originalMask = document.getElementById('vlsm-mask').value.trim();
    
    if (!validateIp(networkAddress) || !validateMask(originalMask)) {
        alert('Please enter valid network address and subnet mask');
        return;
    }

    const subnetInputs = document.querySelectorAll('.subnet-input');
    const subnets = [];
    
    subnetInputs.forEach(input => {
        const name = input.querySelector('.subnet-name').value.trim();
        const hosts = parseInt(input.querySelector('.subnet-hosts').value);
        
        if (name && !isNaN(hosts) && hosts > 0) {
            subnets.push({ name, hosts });
        }
    });
    
    if (subnets.length === 0) {
        alert('Please add at least one subnet requirement');
        return;
    }
    
    // Sort subnets by host requirements (descending)
    subnets.sort((a, b) => b.hosts - a.hosts);
    
    try {
        let currentNetwork = ipToDecimal(networkAddress);
        const results = [];
        
        subnets.forEach(subnet => {
            // Calculate required host bits
            const requiredHostBits = Math.ceil(Math.log2(subnet.hosts + 2));
            const subnetBits = 32 - requiredHostBits;
            const subnetMask = cidrToMask(subnetBits);
            
            // Calculate network range
            const hostsPerSubnet = Math.pow(2, requiredHostBits) - 2;
            const networkStart = decimalToIp(currentNetwork);
            const networkEnd = decimalToIp(currentNetwork + hostsPerSubnet + 1);
            const broadcast = decimalToIp(currentNetwork + hostsPerSubnet + 1);
            
            results.push({
                name: subnet.name,
                hosts: subnet.hosts,
                network: networkStart,
                subnetMask: subnetMask,
                cidr: `/${subnetBits}`,
                firstHost: decimalToIp(currentNetwork + 1),
                lastHost: decimalToIp(currentNetwork + hostsPerSubnet),
                broadcast: broadcast,
                totalHosts: hostsPerSubnet
            });
            
            // Move to next network
            currentNetwork += Math.pow(2, requiredHostBits);
        });
        
        displayVLSMResults(results);
        
    } catch (error) {
        alert('An error occurred during VLSM calculation');
        console.error(error);
    }
}

function displayVLSMResults(results) {
    const resultsContainer = document.getElementById('vlsm-results');
    let html = '<h3>VLSM Results</h3>';
    
    results.forEach(result => {
        html += `
            <div class="subnet-result">
                <h4>${result.name} (${result.hosts} hosts needed)</h4>
                <div class="subnet-result-grid">
                    <div><strong>Network:</strong> ${result.network}${result.cidr}</div>
                    <div><strong>Subnet Mask:</strong> ${result.subnetMask}</div>
                    <div><strong>First Host:</strong> ${result.firstHost}</div>
                    <div><strong>Last Host:</strong> ${result.lastHost}</div>
                    <div><strong>Broadcast:</strong> ${result.broadcast}</div>
                    <div><strong>Total Hosts:</strong> ${result.totalHosts}</div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Network Requirements Calculator removed

// Tool Functions
function convertIP() {
    const ipInput = document.getElementById('ip-input').value.trim();
    const resultDiv = document.getElementById('ip-conversion-result');
    
    if (!validateIp(ipInput)) {
        resultDiv.innerHTML = '<span class="error">Invalid IP address format</span>';
        return;
    }
    
    try {
        const binary = ipToBinary(ipInput);
        const decimal = ipToDecimal(ipInput);
        const hex = decimal.toString(16).toUpperCase();
        
        resultDiv.innerHTML = `
            <strong>Binary:</strong> ${binary}<br>
            <strong>Decimal:</strong> ${decimal.toLocaleString()}<br>
            <strong>Hexadecimal:</strong> 0x${hex.padStart(8, '0')}
        `;
    } catch (error) {
        resultDiv.innerHTML = '<span class="error">Conversion error</span>';
    }
}

function convertBinary() {
    const binaryInput = document.getElementById('binary-input').value.trim();
    const resultDiv = document.getElementById('binary-conversion-result');
    
    if (!/^[01]+$/.test(binaryInput)) {
        resultDiv.innerHTML = '<span class="error">Please enter valid binary digits (0 or 1)</span>';
        return;
    }
    
    try {
        const decimal = parseInt(binaryInput, 2);
        const hex = decimal.toString(16).toUpperCase();
        
        resultDiv.innerHTML = `
            <strong>Decimal:</strong> ${decimal.toLocaleString()}<br>
            <strong>Hexadecimal:</strong> 0x${hex}<br>
            <strong>Binary Length:</strong> ${binaryInput.length} bits
        `;
    } catch (error) {
        resultDiv.innerHTML = '<span class="error">Conversion error</span>';
    }
}

function calculateCIDR() {
    const cidrInput = document.getElementById('cidr-input').value.trim();
    const resultDiv = document.getElementById('cidr-result');
    
    const cidrMatch = cidrInput.match(/^\/(\d{1,2})$/);
    if (!cidrMatch) {
        resultDiv.innerHTML = '<span class="error">Please enter valid CIDR notation (e.g., /24)</span>';
        return;
    }
    
    const cidr = parseInt(cidrMatch[1]);
    if (cidr < 0 || cidr > 32) {
        resultDiv.innerHTML = '<span class="error">CIDR must be between 0 and 32</span>';
        return;
    }
    
    try {
        const subnetMask = cidrToMask(cidr);
        const totalHosts = Math.pow(2, 32 - cidr);
        const usableHosts = totalHosts - 2;
        
        resultDiv.innerHTML = `
            <strong>Subnet Mask:</strong> ${subnetMask}<br>
            <strong>Total Addresses:</strong> ${totalHosts.toLocaleString()}<br>
            <strong>Usable Hosts:</strong> ${usableHosts.toLocaleString()}<br>
            <strong>Network Bits:</strong> ${cidr}<br>
            <strong>Host Bits:</strong> ${32 - cidr}
        `;
    } catch (error) {
        resultDiv.innerHTML = '<span class="error">Calculation error</span>';
    }
}

function calculateRange() {
    const rangeInput = document.getElementById('range-network').value.trim();
    const resultDiv = document.getElementById('range-result');
    
    const rangeMatch = rangeInput.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!rangeMatch) {
        resultDiv.innerHTML = '<span class="error">Please enter valid network (e.g., 192.168.1.0/24)</span>';
        return;
    }
    
    const networkAddress = rangeMatch[1];
    const cidr = parseInt(rangeMatch[2]);
    
    if (!validateIp(networkAddress) || cidr < 0 || cidr > 32) {
        resultDiv.innerHTML = '<span class="error">Invalid network address or CIDR</span>';
        return;
    }
    
    try {
        const networkDecimal = ipToDecimal(networkAddress);
        const totalHosts = Math.pow(2, 32 - cidr);
        const firstHost = decimalToIp(networkDecimal + 1);
        const lastHost = decimalToIp(networkDecimal + totalHosts - 2);
        const broadcast = decimalToIp(networkDecimal + totalHosts - 1);
        const subnetMask = cidrToMask(cidr);
        
        resultDiv.innerHTML = `
            <strong>Network Address:</strong> ${networkAddress}<br>
            <strong>Subnet Mask:</strong> ${subnetMask}<br>
            <strong>First Host:</strong> ${firstHost}<br>
            <strong>Last Host:</strong> ${lastHost}<br>
            <strong>Broadcast:</strong> ${broadcast}<br>
            <strong>Total Hosts:</strong> ${(totalHosts - 2).toLocaleString()}
        `;
    } catch (error) {
        resultDiv.innerHTML = '<span class="error">Calculation error</span>';
    }
}

// Input validation and formatting
document.addEventListener('DOMContentLoaded', function() {
    // Auto-format IP addresses and CIDR notation
    const ipInputs = document.querySelectorAll('input[type="text"]');
    ipInputs.forEach(input => {
        // Only apply IP-only validation when placeholder is an IP and not CIDR
        if (
            input.placeholder &&
            input.placeholder.includes('192.168') &&
            !input.placeholder.includes('/')
        ) {
            input.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value && !validateIp(value)) {
                    this.style.borderColor = '#e53e3e';
                } else {
                    this.style.borderColor = '#e2e8f0';
                }
            });
        }

        // Validate CIDR strings for specific inputs
        if (input.id === 'network-cidr' || input.id === 'host-base-cidr') {
            input.addEventListener('blur', function() {
                const value = this.value.trim();
                const cidrMatch = value.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
                if (value && !cidrMatch) {
                    this.style.borderColor = '#e53e3e';
                } else {
                    this.style.borderColor = '#e2e8f0';
                }
            });
        }
    });

    // Auto-format only the standalone CIDR input in Tools tab
    const standaloneCidr = document.getElementById('cidr-input');
    if (standaloneCidr) {
        standaloneCidr.addEventListener('blur', function() {
            let value = this.value.trim();
            if (value && !value.startsWith('/')) {
                value = '/' + value;
                this.value = value;
            }
        });
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                document.querySelector('[data-tab="subnetting"]').click();
                break;
            case '2':
                e.preventDefault();
                document.querySelector('[data-tab="vlsm"]').click();
                break;
            case '3':
                e.preventDefault();
                document.querySelector('[data-tab="network-req"]').click();
                break;
            case '4':
                e.preventDefault();
                document.querySelector('[data-tab="tools"]').click();
                break;
        }
    }
});
