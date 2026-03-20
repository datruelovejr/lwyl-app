'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// react-force-graph requires browser APIs -- dynamic import with SSR disabled
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// CSS variable values need to be read at runtime for canvas rendering
function getCSSColor(varName, fallback) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

const DISC_FALLBACKS = { D: '#C62828', I: '#FFC107', S: '#4CAF50', C: '#29B6F6' };
const FRICTION_FALLBACKS = { high: '#C62828', moderate: '#FFC107', low: '#4CAF50' };

function getDiscColor(disc) {
  return getCSSColor(`--disc-${disc.toLowerCase()}`, DISC_FALLBACKS[disc] || '#9E9E9E');
}

function getFrictionColor(tier) {
  return getCSSColor(`--friction-${tier}`, FRICTION_FALLBACKS[tier] || '#9E9E9E');
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// DISC quadrant targets (loose grouping)
const QUADRANT = {
  D: { x: 0.65, y: 0.3 },
  I: { x: 0.35, y: 0.3 },
  S: { x: 0.35, y: 0.7 },
  C: { x: 0.65, y: 0.7 },
};

/**
 * FrictionNetwork: Force-directed relationship graph.
 * Nodes = team members sized by gap load, colored by DISC.
 * Edges = relationships colored and weighted by friction tier.
 *
 * Props:
 * - nodes: [{ id, name, disc, gapLoad }]
 * - links: [{ source, target, frictionScore, tier }]
 * - width: container width
 * - height: container height
 * - onNodeClick: (node) => void
 * - onLinkClick: (link) => void
 */
export function FrictionNetwork({ nodes, links, width = 700, height = 500, onNodeClick, onLinkClick }) {
  const graphRef = useRef();
  const [revealed, setRevealed] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  // Scale node radius by gapLoad (min 14, max 28)
  const radiusScale = useCallback((gapLoad) => {
    const min = 14, max = 28;
    const clamp = Math.min(Math.max(gapLoad || 0, 0), 200);
    return min + ((clamp / 200) * (max - min));
  }, []);

  // Scale link width by friction score (min 1, max 5)
  const linkWidthScale = useCallback((score) => {
    return Math.max(1, Math.min(5, score / 4));
  }, []);

  // Trigger reveal after mount
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Pause simulation after cooldown to stop continuous CPU burn
  useEffect(() => {
    const timer = setTimeout(() => {
      if (graphRef.current) graphRef.current.pauseAnimation();
    }, 4000);
    return () => clearTimeout(timer);
  }, [nodes]);

  // Apply DISC quadrant forces after graph mounts
  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;

    // Custom forces for loose DISC quadrant grouping
    // Use d3-force directly (already installed as react-force-graph dependency) instead of full d3 bundle
    const d3 = require('d3-force');
    fg.d3Force('x', d3.forceX().x(node => {
      const q = QUADRANT[(node.disc || 'S').split('/')[0]] || QUADRANT.S;
      return q.x * width;
    }).strength(0.07));
    fg.d3Force('y', d3.forceY().y(node => {
      const q = QUADRANT[(node.disc || 'S').split('/')[0]] || QUADRANT.S;
      return q.y * height;
    }).strength(0.07));
    fg.d3Force('charge').strength(-120);

    fg.d3ReheatSimulation();
  }, [nodes, width, height]);

  // Custom node renderer (canvas)
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const r = radiusScale(node.gapLoad);
    const primaryDisc = (node.disc || 'S').split('/')[0];
    const color = getDiscColor(primaryDisc);
    const initials = getInitials(node.name);
    const fontSize = Math.max(8, r * 0.55);

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // White border
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Initials
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = primaryDisc === 'I' ? '#111' : '#fff';
    ctx.fillText(initials, node.x, node.y);
  }, [radiusScale]);

  // Node hit area
  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const r = radiusScale(node.gapLoad);
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, [radiusScale]);

  // Tooltip for hovered link
  const tooltipContent = useMemo(() => {
    if (!hoveredLink) return null;
    const src = typeof hoveredLink.source === 'object' ? hoveredLink.source : nodes.find(n => n.id === hoveredLink.source);
    const tgt = typeof hoveredLink.target === 'object' ? hoveredLink.target : nodes.find(n => n.id === hoveredLink.target);
    if (!src || !tgt) return null;
    return {
      text: `${src.name?.split(' ')[0]} & ${tgt.name?.split(' ')[0]}: ${hoveredLink.frictionScore} gap points`,
      tier: hoveredLink.tier,
    };
  }, [hoveredLink, nodes]);

  if (!nodes || nodes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-xl overflow-hidden bg-card border border-border"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        width={width}
        height={height}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeRelSize={6}
        linkColor={link => getFrictionColor(link.tier)}
        linkWidth={link => linkWidthScale(link.frictionScore)}
        linkOpacity={0.7}
        linkDirectionalParticles={0}
        d3AlphaDecay={0.02}
        cooldownTime={3000}
        enableZoomInteraction={false}
        enablePanInteraction={false}
        onNodeClick={onNodeClick}
        onLinkClick={onLinkClick}
        onLinkHover={link => setHoveredLink(link || null)}
        backgroundColor="transparent"
      />

      {/* Tooltip */}
      {tooltipContent && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-nav text-white text-xs font-semibold shadow-lg pointer-events-none">
          {tooltipContent.text}
        </div>
      )}

      {/* DISC quadrant labels */}
      <div className="absolute top-2 right-3 text-[9px] font-bold text-disc-d/40">D</div>
      <div className="absolute top-2 left-3 text-[9px] font-bold text-disc-i/40">I</div>
      <div className="absolute bottom-2 left-3 text-[9px] font-bold text-disc-s/40">S</div>
      <div className="absolute bottom-2 right-3 text-[9px] font-bold text-disc-c/40">C</div>
    </motion.div>
  );
}

export default FrictionNetwork;
