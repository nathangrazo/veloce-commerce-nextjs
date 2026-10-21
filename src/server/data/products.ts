import type { Product } from "@/domain/types";

export const PRODUCTS_CATALOG: Product[] = [
  {
    id: "prod_aero_runner",
    slug: "aero-knit-runner",
    name: "Aero Knit Runner",
    subtitle: "Featherweight knit athletic sneakers",
    description:
      "Engineered for all-day movement with a single-piece breathable off-white knit upper, tactile suede overlays, and dual-density responsive cushioning.",
    priceCents: 14500,
    compareAtPriceCents: 17500,
    category: "Apparel",
    image: "/images/products/sneakers.jpg",
    rating: 4.9,
    reviewCount: 184,
    stock: 24,
    badge: "Best Seller",
    specs: [
      { label: "Upper", value: "Recycled breathable 3D knit + Italian suede" },
      { label: "Midsole", value: "Dual-density EVA nitrogen foam" },
      { label: "Weight", value: "265g (US 9)" },
      { label: "Fit", value: "True to size" },
    ],
  },
  {
    id: "prod_nordic_desk",
    slug: "nordic-walnut-desk",
    name: "Nordic Walnut Studio Desk",
    subtitle: "Solid walnut desktop with steel frame",
    description:
      "Architectural workspace centerpiece crafted from kiln-dried American walnut with a matte oil finish, powder-coated steel legs, and a concealed full-length cable tray.",
    priceCents: 68000,
    category: "Furniture",
    image: "/images/products/desk.jpg",
    rating: 4.8,
    reviewCount: 92,
    stock: 9,
    badge: "New Arrival",
    specs: [
      { label: "Dimensions", value: "150 × 75 × 74 cm" },
      { label: "Surface", value: "Solid FSC-certified American walnut" },
      { label: "Frame", value: "Matte black powder-coated steel" },
      { label: "Cable Management", value: "Integrated rear aluminum channel" },
    ],
  },
  {
    id: "prod_atelier_overshirt",
    slug: "atelier-cotton-overshirt",
    name: "Atelier Heavyweight Overshirt",
    subtitle: "420gsm organic brushed twill",
    description:
      "Tailored to layer effortlessly across seasons. Cut from dense Portuguese cotton twill with concealed placket stitching, matte corozo nut buttons, and structured drape.",
    priceCents: 11800,
    category: "Apparel",
    image: "/images/products/shirt.jpg",
    rating: 4.7,
    reviewCount: 127,
    stock: 32,
    specs: [
      { label: "Fabric", value: "100% Organic Cotton Twill (420 GSM)" },
      { label: "Buttons", value: "Matte charcoal corozo nut" },
      { label: "Origin", value: "Ethically crafted in Porto" },
      { label: "Care", value: "Cold machine wash, hang dry" },
    ],
  },
  {
    id: "prod_forma_chair",
    slug: "forma-ergonomic-chair",
    name: "Forma Ergonomic Task Chair",
    subtitle: "Dynamic lumbar + breathable graphite mesh",
    description:
      "Precision-tuned for deep focus sessions. Features weight-activated synchro-tilt mechanics, 4D sculpted armrests, and high-tension elastomer mesh that adapts to your posture.",
    priceCents: 49500,
    compareAtPriceCents: 56000,
    category: "Furniture",
    image: "/images/products/chair.jpg",
    rating: 4.9,
    reviewCount: 218,
    stock: 14,
    badge: "Best Seller",
    specs: [
      { label: "Mechanism", value: "Weight-sensing synchro-tilt + 4 lock angles" },
      { label: "Backrest", value: "High-tension breathable elastomer mesh" },
      { label: "Armrests", value: "4D adjustable soft-touch polyurethane" },
      { label: "Warranty", value: "10-year structural warranty" },
    ],
  },
  {
    id: "prod_kanso_sofa",
    slug: "kanso-modular-sofa",
    name: "Kanso Modular Lounge Sofa",
    subtitle: "Oatmeal bouclé linen on solid oak plinth",
    description:
      "Generously proportioned 3-seater lounge sofa pairing tactile Belgian bouclé upholstery with feather-wrapped high-resilience cushions and a low-profile solid oak plinth.",
    priceCents: 129000,
    category: "Furniture",
    image: "/images/products/sofa.jpg",
    rating: 4.8,
    reviewCount: 64,
    stock: 5,
    badge: "Limited",
    specs: [
      { label: "Dimensions", value: "228 × 96 × 72 cm" },
      { label: "Upholstery", value: "Belgian bouclé linen blend (50k rubs)" },
      { label: "Base", value: "Kiln-dried solid European white oak" },
      { label: "Delivery", value: "White-glove in-room assembly included" },
    ],
  },
  {
    id: "prod_sona_headphones",
    slug: "sona-studio-headphones",
    name: "Sona Wireless Studio Headphones",
    subtitle: "Anodized aluminum + adaptive ANC",
    description:
      "Reference-grade acoustic clarity housed in bead-blasted aluminum earcups and supple lambskin cushions. Delivers 42 hours of lossless USB-C or low-latency Bluetooth audio.",
    priceCents: 32000,
    compareAtPriceCents: 36900,
    category: "Workspace",
    image: "/images/products/headphones.jpg",
    rating: 4.9,
    reviewCount: 311,
    stock: 19,
    badge: "Best Seller",
    specs: [
      { label: "Drivers", value: "40mm custom beryllium-coated dynamic" },
      { label: "Battery Life", value: "42h ANC on / 60h ANC off" },
      { label: "Connectivity", value: "Bluetooth 5.4 Multipoint + USB-C DAC" },
      { label: "Materials", value: "Bead-blasted aluminum + lambskin leather" },
    ],
  },
  {
    id: "prod_lumen_lamp",
    slug: "lumen-cantilever-lamp",
    name: "Lumen Architectural Desk Lamp",
    subtitle: "CRI 97+ dimmable anodized aluminum",
    description:
      "Minimalist cantilevered lighting engineered for zero screen glare. Precision counterbalanced joints and stepless rotary dimming from 2700K warm ambient to 5000K task light.",
    priceCents: 16500,
    category: "Workspace",
    image: "/images/products/lamp.jpg",
    rating: 4.7,
    reviewCount: 78,
    stock: 21,
    badge: "New Arrival",
    specs: [
      { label: "Color Accuracy", value: "CRI 97+ flicker-free LED array" },
      { label: "Color Temp", value: "Stepless 2700K – 5000K dimming" },
      { label: "Finish", value: "Matte black CNC-milled aluminum" },
      { label: "Reach", value: "62 cm articulated arm" },
    ],
  },
  {
    id: "prod_tactile_keyboard",
    slug: "tactile-75-keyboard",
    name: "Tactile 75 Mechanical Keyboard",
    subtitle: "Gasket-mounted CNC aluminum chassis",
    description:
      "Compact 75% wireless mechanical keyboard milled from a solid block of 6063 aluminum. Pre-lubed tactile switches, hot-swappable PCB, and triple-mode connectivity.",
    priceCents: 21000,
    category: "Workspace",
    image: "/images/products/keyboard.jpg",
    rating: 4.9,
    reviewCount: 149,
    stock: 16,
    badge: "Limited",
    specs: [
      { label: "Case", value: "CNC 6063 anodized aluminum + brass weight" },
      { label: "Mount", value: "Poron gasket mount with hot-swap PCB" },
      { label: "Layout", value: "75% ANSI / QMK & VIA programmable" },
      { label: "Battery", value: "4000mAh (up to 180h wireless)" },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS_CATALOG.find((product) => product.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS_CATALOG.find((product) => product.slug === slug);
}
