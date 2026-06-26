import { NetworkingLesson } from '../../components/network-sim/types';

const ipAddressing: NetworkingLesson = {
  id: 'ip-addressing',
  slug: 'ip-addressing',
  title: {
    en: 'IP Addressing & Communication',
    ar: 'عنونة IP والاتصالات',
  },
  description: {
    en: 'How devices are identified on a network using IPv4 addresses, and how traffic flows between private and public networks through NAT.',
    ar: 'كيف يتم تعريف الأجهزة على الشبكة باستخدام عناوين IPv4، وكيف تنتقل البيانات بين الشبكات الخاصة والعامة عبر NAT.',
  },
  order: 1,
  estimatedMinutes: 12,
  tags: ['IPv4', 'Private IP', 'Public IP', 'NAT', 'Subnets', 'Routing'],

  markdownContent: `# IP Addressing & Communication

Every device that connects to a network needs a unique identifier — an **IP address**. It works like a mailing address: without one, data has nowhere to go.

---

## What Is an IP Address?

An IP (Internet Protocol) address is a numerical label assigned to every device on a network. It serves two purposes:

1. **Host identification** — uniquely identifies a device
2. **Location addressing** — tells the network where the device is

There are two versions in use today:

| Version | Format | Example | Capacity |
|---------|--------|---------|----------|
| **IPv4** | Four octets (32-bit) | \`192.168.1.10\` | ~4.3 billion |
| **IPv6** | Eight groups (128-bit) | \`2001:db8::1\` | ~340 undecillion |

We'll focus on IPv4, which is still the backbone of most networks.

---

## IPv4 Address Structure

An IPv4 address is 32 bits, written as four decimal numbers separated by dots. Each number (octet) ranges from **0 to 255**.

\`\`\`
  192  .  168  .   1   .  10
  ───     ───     ───     ──
  8 bits  8 bits  8 bits  8 bits  =  32 bits total
\`\`\`

Every IP address has two parts:

- **Network portion** — identifies which network the device belongs to
- **Host portion** — identifies the specific device on that network

The **subnet mask** determines where the split happens. For example:

\`\`\`
IP:          192.168.1.10
Subnet mask: 255.255.255.0  (or /24)
             ─────────────  ───
             Network part    Host part

Network:     192.168.1.0    (the network)
Host:        .10            (this specific device)
\`\`\`

---

## Private vs. Public IP Addresses

Not all IP addresses are equal. Some are reserved for **internal (private)** use, while others are **publicly routable** on the internet.

### Private IP Ranges

These addresses are used inside local networks (your home, office, or lab):

| Range | CIDR | Common Use |
|-------|------|------------|
| \`10.0.0.0\` – \`10.255.255.255\` | 10.0.0.0/8 | Large enterprise networks |
| \`172.16.0.0\` – \`172.31.255.255\` | 172.16.0.0/12 | Medium networks |
| \`192.168.0.0\` – \`192.168.255.255\` | 192.168.0.0/16 | Home & small office |

### Public IP Addresses

Public IPs are **globally unique**, assigned by your Internet Service Provider (ISP). Every website, server, and online service has one.

> Your home router has one public IP. Every device behind it shares that single public address — this is possible through **NAT**.

---

## NAT — Network Address Translation

NAT is what allows dozens of devices in your home to share a single public IP address.

**How it works:**

1. Your PC sends a request using its **private IP** (e.g., \`192.168.1.10\`)
2. The router replaces the source IP with its own **public IP** (e.g., \`203.0.113.5\`)
3. The web server sees the request coming from \`203.0.113.5\`
4. When the response arrives, the router reverses the translation and forwards it to the correct internal device

This is exactly what the simulation on the right demonstrates step by step.

---

## Key Takeaways

- Every device on a network has an IP address
- IPv4 uses 32-bit addresses (e.g., \`192.168.1.10\`)
- Private IPs are used inside local networks; public IPs are used on the internet
- NAT translates private IPs to a public IP at the router
- Subnet masks define the network vs. host portions of an address
`,

  simulation: {
    id: 'ip-addressing-sim',
    zones: [
      {
        id: 'zone-lan',
        label: 'Home Network',
        sublabel: '192.168.1.0/24',
        x: 1.5,
        y: 3,
        w: 57,
        h: 94,
        color: '#00a859',
      },
      {
        id: 'zone-wan',
        label: 'Internet',
        sublabel: 'Public address space',
        x: 62,
        y: 10,
        w: 36.5,
        h: 80,
        color: '#62738f',
      },
    ],
    nodes: [
      {
        id: 'pc',
        type: 'pc',
        label: 'Desktop PC',
        x: 10,
        y: 22,
        ip: '192.168.1.10',
        sublabel: 'Private IP',
      },
      {
        id: 'laptop',
        type: 'laptop',
        label: 'Laptop',
        x: 10,
        y: 72,
        ip: '192.168.1.11',
        sublabel: 'Private IP',
      },
      {
        id: 'switch',
        type: 'switch',
        label: 'Switch',
        x: 30,
        y: 47,
      },
      {
        id: 'router',
        type: 'router',
        label: 'Home Router',
        x: 50,
        y: 47,
        ip: '192.168.1.1',
        sublabel: 'Gateway',
      },
      {
        id: 'cloud',
        type: 'cloud',
        label: 'Internet',
        x: 70,
        y: 47,
      },
      {
        id: 'server',
        type: 'server',
        label: 'Web Server',
        x: 90,
        y: 47,
        ip: '93.184.216.34',
        sublabel: 'Public IP',
      },
    ],
    edges: [
      { id: 'e1', from: 'pc', to: 'switch' },
      { id: 'e2', from: 'laptop', to: 'switch' },
      { id: 'e3', from: 'switch', to: 'router' },
      { id: 'e4', from: 'router', to: 'cloud', label: 'WAN' },
      { id: 'e5', from: 'cloud', to: 'server' },
    ],
    steps: [
      {
        title: 'The Local Network',
        description:
          'A typical home network: two devices connected to a switch, which connects to a router. Each device has a private IP in the 192.168.1.x range. These addresses only work inside this network.',
        packets: [],
        highlights: ['pc', 'laptop', 'switch', 'router'],
        annotations: {
          router: 'Public: 203.0.113.5',
        },
      },
      {
        title: 'PC Initiates a Request',
        description:
          'The desktop PC wants to load a webpage hosted on the web server (93.184.216.34). It creates a packet with source IP 192.168.1.10 and sends it toward the default gateway — the router.',
        packets: [
          {
            from: 'pc',
            to: 'switch',
            label: 'HTTP Request',
            color: '#9fef00',
            sublabel: 'src: 192.168.1.10',
          },
        ],
        highlights: ['pc'],
      },
      {
        title: 'Switch Forwards the Frame',
        description:
          'The switch operates at Layer 2 — it reads the MAC address and forwards the frame to the correct port (the router). It does not look at IP addresses.',
        packets: [
          {
            from: 'switch',
            to: 'router',
            label: 'HTTP Request',
            color: '#9fef00',
            sublabel: 'src: 192.168.1.10',
          },
        ],
        highlights: ['switch'],
        annotations: {
          switch: 'Layer 2 forwarding',
        },
      },
      {
        title: 'NAT — Private to Public',
        description:
          'The router performs NAT: it replaces the private source IP (192.168.1.10) with its own public IP (203.0.113.5). It stores a mapping so it knows where to send the response later.',
        packets: [
          {
            from: 'router',
            to: 'cloud',
            label: 'HTTP Request',
            color: '#9fef00',
            sublabel: 'src: 203.0.113.5',
          },
        ],
        highlights: ['router'],
        annotations: {
          router: 'NAT: .10 -> 203.0.113.5',
        },
      },
      {
        title: 'Packet Crosses the Internet',
        description:
          'The packet, now carrying the public source IP, traverses the internet — hopping through ISP routers until it reaches the destination network.',
        packets: [
          {
            from: 'cloud',
            to: 'server',
            label: 'HTTP Request',
            color: '#9fef00',
            sublabel: 'dst: 93.184.216.34',
          },
        ],
        highlights: ['cloud'],
      },
      {
        title: 'Server Receives the Request',
        description:
          'The web server receives the packet. From its perspective, the request came from 203.0.113.5 (the router\'s public IP) — it has no knowledge of the private IP behind the router.',
        packets: [],
        highlights: ['server'],
        annotations: {
          server: 'Sees: 203.0.113.5',
        },
      },
      {
        title: 'Server Sends Response',
        description:
          'The web server sends the HTTP response back to 203.0.113.5 — the only address it knows.',
        packets: [
          {
            from: 'server',
            to: 'cloud',
            label: 'HTTP Response',
            color: '#00a859',
            sublabel: 'dst: 203.0.113.5',
          },
        ],
        highlights: ['server'],
      },
      {
        title: 'Response Reaches the Router',
        description:
          'The response arrives at the router\'s public IP. The router checks its NAT table and finds that this connection belongs to 192.168.1.10 — the desktop PC.',
        packets: [
          {
            from: 'cloud',
            to: 'router',
            label: 'HTTP Response',
            color: '#00a859',
            sublabel: 'dst: 203.0.113.5',
          },
        ],
        highlights: ['router'],
        annotations: {
          router: 'NAT: -> 192.168.1.10',
        },
      },
      {
        title: 'Reverse NAT — Public to Private',
        description:
          'The router translates the destination IP back to the private address (192.168.1.10) and forwards the packet through the switch to the PC. The round trip is complete.',
        packets: [
          {
            from: 'router',
            to: 'switch',
            label: 'HTTP Response',
            color: '#00a859',
            sublabel: 'dst: 192.168.1.10',
          },
        ],
        highlights: ['router', 'pc'],
      },
      {
        title: 'PC Receives the Response',
        description:
          'The desktop PC receives the web page data. It never knew about NAT — from its perspective, it simply sent a request to 93.184.216.34 and got a response back.',
        packets: [
          {
            from: 'switch',
            to: 'pc',
            label: 'HTTP Response',
            color: '#00a859',
            sublabel: 'dst: 192.168.1.10',
          },
        ],
        highlights: ['pc'],
        annotations: {
          pc: 'Page loaded!',
        },
      },
    ],
  },

  quiz: [
    {
      question: 'Which of these is a private IPv4 address?',
      options: ['8.8.8.8', '192.168.1.10', '93.184.216.34'],
      correctIndex: 1,
    },
    {
      question: 'What does NAT (Network Address Translation) do?',
      options: [
        'Encrypts traffic between your PC and the server',
        'Assigns IP addresses automatically to new devices',
        "Rewrites private source IPs to the router's public IP for the internet",
      ],
      correctIndex: 2,
    },
    {
      question: 'In 192.168.1.0/24, what does the /24 mean?',
      options: [
        'The network can hold 24 devices',
        'The first 24 bits identify the network portion of the address',
        "The router's address ends in .24",
      ],
      correctIndex: 1,
    },
    {
      question: 'Which device performs NAT in a typical home network?',
      options: ['The switch', 'The DNS server', 'The router'],
      correctIndex: 2,
    },
  ],
};

export default ipAddressing;
