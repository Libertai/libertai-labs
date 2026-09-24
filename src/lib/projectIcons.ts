// Inner SVG markup for each project, keyed by content id.
// Stroke icons drawn on a 24x24 viewBox using currentColor.
export const projectIcons: Record<string, string> = {
  deem:
    '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M7.2 12h4.8c2.5 0 4-1.5 5-3.5M12 12c2.5 0 4 1.5 5 3.5"/>',
  "glm53-flash":
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h8v8H8z"/><path d="M3 9h-1M3 15h-1M22 9h-1M22 15h-1M9 3v-1M15 3v-1M9 22v-1M15 22v-1"/>',
  "nvfp4-models":
    '<rect x="5" y="5" width="14" height="14" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  "consensus-search":
    '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M8 11h6M11 8v6"/>',
  "libertai-code":
    '<path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13.5 6l-3 12"/>',
  "mcp-server":
    '<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="12" cy="20" r="1.8"/><path d="M10.3 10.3 6.3 7.2M13.7 10.3l4-3.1M12 14.5v3.7"/>',
  avatar:
    '<circle cx="12" cy="8" r="4"/><path d="M5 20.5a7 7 0 0 1 14 0"/>',
  conscio:
    '<path d="M12 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7.5V17a3 3 0 0 0 5 2 3 3 0 0 0 5-2v-2.5A4 4 0 0 0 16 7a4 4 0 0 0-4-4z"/><path d="M12 7v8M9 11h6"/>',
  "post-quantum-blockchain-review":
    '<path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z"/><path d="M8.5 12h7M12 8.5v7"/><circle cx="12" cy="12" r="2.5"/>',
};

export const fallbackIcon = '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>';

export type StatusAccent = { glow: string; tile: string };

// Per-status accent: glow colour (radial) + icon-tile classes.
export const statusAccent: Record<string, StatusAccent> = {
  experiment: {
    glow: "rgba(0,210,201,0.20)",
    tile: "border-cyan-300/25 from-cyan-300/18 to-cyan-300/5 text-cyan-200",
  },
  research: {
    glow: "rgba(171,158,255,0.20)",
    tile: "border-violet-300/30 from-violet-300/18 to-violet-300/5 text-violet-300",
  },
  shipped: {
    glow: "rgba(0,210,201,0.12)",
    tile: "border-white/15 from-cyan-300/12 to-violet-500/12 text-mist-100",
  },
};

export function iconFor(id: string): string {
  return projectIcons[id] ?? fallbackIcon;
}
