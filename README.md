# Networking Calculator

A professional, modern networking calculator website focused on subnetting, VLSM, and handy IP tools.

## 🌟 Features

### 1. **Subnetting Calculator (CIDR input)**
- Single input like `192.168.1.0/26`
- Outputs: Class Address, Borrowed Bits, Subnet Mask, Magic Number (increment), Total Subnets, Total Hosts
- Ranges table: Network Address • Usable Range • Broadcast Address

### 2. **Subnetting by Host Requirements**
- Input a base network (CIDR) and required hosts per subnet
- Calculates new CIDR/mask, increment, capacity, number of subnets inside the base
- Shows the first ranges within the base network

### 3. **Subnetting by Network Requirements**
- Input a base network (CIDR) and number of networks needed
- Calculates minimum borrowed bits, new CIDR/mask, increment
- Shows actual networks available inside the base and the first ranges

### 4. **VLSM (Variable Length Subnet Mask) Calculator**
- Multiple subnets with different host requirements
- Sorts by size and allocates sequentially
- Shows network/mask, first/last host, broadcast, and totals per subnet

### 5. **Networking Tools**
- **IP Address Converter**: decimal ⇄ binary + hexadecimal
- **Binary Calculator**: binary → decimal/hex
- **CIDR Calculator**: subnet mask, total/usable addresses
- **Network Range Calculator**: boundaries and usable hosts from `ip/prefix`

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Start using the networking calculators!

### Usage Examples

#### Subnetting (CIDR)
```
Input: 192.168.1.0/26
Outputs: Class C, Borrowed 2, Mask 255.255.255.192, Magic 64, Total Subnets 4, Total Hosts 62
Ranges (first rows):
192.168.1.0  | 192.168.1.1–192.168.1.62 | 192.168.1.63
192.168.1.64 | 192.168.1.65–192.168.1.126 | 192.168.1.127
```

#### Subnetting by Host Requirements
```
Base: 192.168.10.0/24, Hosts: 50 → /26, mask 255.255.255.192, inc 64, subnets inside base: 4, usable hosts: 62
```

#### Subnetting by Network Requirements
```
Base: 10.0.0.0/8, Networks: 6000 → borrow 13 bits → /21, mask 255.255.248.0, inc 8
Actual networks inside base: 8192, usable hosts/subnet: 2046
```

#### VLSM
```
Network: 192.168.1.0/24
Subnets: 50, 25, 10 hosts → /26, /27, /28 allocations with ranges
```

## 🎨 Design Features

- **Networking Studio Theme**: Deep navy backdrop with subtle grid overlay, cyan/purple accents
- **Modern UI/UX**: Clean cards, soft shadows, smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Validation**: Helpful input validation and error hints
- **Keyboard Shortcuts**: Ctrl+1 Subnetting, Ctrl+2 VLSM, Ctrl+4 Tools

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup and modern structure
- **CSS3**: Advanced styling with Flexbox, Grid, and animations
- **JavaScript (ES6+)**: Modern JavaScript with comprehensive networking algorithms
- **Font Awesome**: Professional icons for better user experience

### Core Algorithms
- **IP Address Conversion**: Binary, decimal, and hexadecimal conversions
- **Subnet Calculations**: CIDR/mask math, class detection, increments, ranges
- **VLSM Logic**: Sort-and-fit allocation per requirement

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📱 Responsive Design

The website automatically adapts to different screen sizes:
- **Desktop**: Full-featured interface with side-by-side layouts
- **Tablet**: Optimized for touch interaction
- **Mobile**: Stacked layouts for easy mobile use

## ⌨️ Keyboard Shortcuts

- **Ctrl+1**: Switch to Subnetting tab
- **Ctrl+2**: Switch to VLSM tab
- **Ctrl+4**: Switch to Tools tab

## 🧮 Calculation Examples

### Subnetting
```
Input: 192.168.1.0/24, need 100 hosts
Process: Calculate required host bits (log₂(100+2) = 7 bits)
Result: /25 subnet mask, 126 usable hosts
```

### VLSM
```
Input: 192.168.1.0/24 network
Requirements: 50, 25, 10 hosts
Result: /26, /27, /28 subnets with optimal allocation
```

## 🔍 Input Validation

The calculator includes comprehensive input validation:
- **IP Address Format**: Ensures valid IPv4 addresses
- **Subnet Mask Validation**: Verifies proper mask format
- **Host Requirements**: Validates positive numbers

## 🎯 Use Cases

### For Network Administrators
- Plan network expansions
- Calculate subnet allocations
- Optimize IP address usage
- Document network designs

### For Students and Educators
- Learn subnetting concepts
- Practice VLSM calculations
- Understand network planning
- Verify homework solutions

### For IT Professionals
- Quick network calculations
- Network documentation
- Capacity planning
- Troubleshooting assistance

## 🚧 Future Enhancements

- IPv6 support
- Topology visualization
- Export results to PDF/CSV
- Advanced routing helpers

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📞 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Verify your input values are in the correct format
3. Ensure you're using a supported browser version

---

**Built with ❤️ for the networking community**

*Professional networking tools for IT professionals, students, and enthusiasts.*

