export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
}

export const products: Product[] = [
  {
    id: "premium-headphones",
    name: "Premium Headphones",
    price: 299,
    category: "Electronics",
    description: "Experience crystal-clear audio with our flagship premium headphones. Featuring active noise cancellation, 40-hour battery life, and premium materials for maximum comfort.",
    features: [
      "Active Noise Cancellation (ANC)",
      "40-hour battery life",
      "Premium leather ear cushions",
      "Hi-Res audio certified",
      "Bluetooth 5.2 connectivity",
      "Foldable design with carrying case"
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 40kHz",
      "Impedance": "32 Ohms",
      "Weight": "250g",
      "Bluetooth Version": "5.2",
      "Battery Life": "40 hours (ANC on)"
    }
  },
  {
    id: "smart-watch-pro",
    name: "Smart Watch Pro",
    price: 449,
    category: "Electronics",
    description: "Your ultimate fitness and productivity companion. Track your health, stay connected, and manage your day with this advanced smartwatch.",
    features: [
      "Heart rate and SpO2 monitoring",
      "GPS tracking for outdoor activities",
      "7-day battery life",
      "Water resistant up to 50m",
      "Sleep tracking and analysis",
      "Customizable watch faces"
    ],
    specifications: {
      "Display": "1.4\" AMOLED",
      "Resolution": "454 x 454",
      "Battery": "7 days typical use",
      "Water Resistance": "5ATM",
      "Sensors": "Heart rate, SpO2, GPS, Accelerometer",
      "Compatibility": "iOS 13+, Android 6.0+"
    }
  },
  {
    id: "wireless-keyboard",
    name: "Wireless Keyboard",
    price: 129,
    category: "Accessories",
    description: "Type in comfort and style with our premium wireless keyboard. Featuring mechanical switches, customizable RGB lighting, and multi-device connectivity.",
    features: [
      "Mechanical switches (Cherry MX)",
      "RGB backlighting with customization",
      "Connect up to 3 devices",
      "Rechargeable battery (90 days)",
      "Ergonomic design",
      "USB-C charging"
    ],
    specifications: {
      "Switch Type": "Cherry MX Red",
      "Layout": "Full-size (104 keys)",
      "Connectivity": "Bluetooth 5.1 + USB-C",
      "Battery Life": "Up to 90 days",
      "Dimensions": "440 x 135 x 35mm",
      "Weight": "980g"
    }
  },
  {
    id: "4k-monitor",
    name: "4K Monitor",
    price: 599,
    category: "Electronics",
    description: "Immerse yourself in stunning 4K visuals with our professional-grade monitor. Perfect for creative work, gaming, and entertainment.",
    features: [
      "4K UHD resolution (3840 x 2160)",
      "IPS panel with 99% sRGB coverage",
      "HDR10 support",
      "144Hz refresh rate",
      "AMD FreeSync and G-Sync compatible",
      "Height adjustable stand"
    ],
    specifications: {
      "Screen Size": "27 inches",
      "Resolution": "3840 x 2160 (4K UHD)",
      "Panel Type": "IPS",
      "Refresh Rate": "144Hz",
      "Response Time": "1ms (MPRT)",
      "Ports": "2x HDMI 2.1, 1x DisplayPort 1.4, 4x USB 3.0"
    }
  },
  {
    id: "gaming-mouse",
    name: "Gaming Mouse",
    price: 79,
    category: "Accessories",
    description: "Dominate the competition with our high-performance gaming mouse. Features a precise sensor, customizable buttons, and ergonomic design.",
    features: [
      "26,000 DPI optical sensor",
      "8 programmable buttons",
      "RGB lighting with 16.8M colors",
      "Lightweight design (69g)",
      "Drag-free cable",
      "Onboard memory for profiles"
    ],
    specifications: {
      "Sensor": "PixArt PAW3395",
      "Max DPI": "26,000",
      "Polling Rate": "1000Hz",
      "Buttons": "8 programmable",
      "Weight": "69g",
      "Cable Length": "2m braided cable"
    }
  },
  {
    id: "laptop-stand",
    name: "Laptop Stand",
    price: 49,
    category: "Accessories",
    description: "Improve your posture and workspace ergonomics with our adjustable laptop stand. Made from premium aluminum with a sleek, minimalist design.",
    features: [
      "Adjustable height and angle",
      "Premium aluminum construction",
      "Non-slip silicone pads",
      "Supports laptops up to 17 inches",
      "Foldable and portable",
      "Heat dissipation design"
    ],
    specifications: {
      "Material": "Aluminum alloy",
      "Height Range": "2.5\" - 6\"",
      "Max Load": "10kg (22lbs)",
      "Compatibility": "11\" - 17\" laptops",
      "Weight": "850g",
      "Dimensions": "260 x 235 x 50mm (folded)"
    }
  }
];
