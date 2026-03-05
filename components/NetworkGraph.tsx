'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: 'judge' | 'court' | 'category';
  size: number;
  caseIds: string[];
}

interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const TYPE_COLORS: Record<string, string> = {
  judge: '#6366f1',    // indigo
  court: '#f59e0b',    // amber
  category: '#10b981', // emerald
};

const TYPE_LABELS: Record<string, string> = {
  judge: 'Judge',
  court: 'Court',
  category: 'Category',
};

export default function NetworkGraph({ nodes: initialNodes, edges: initialEdges }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(500, window.innerHeight - 300),
        });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Run simulation
  useEffect(() => {
    // Deep copy nodes/edges for d3 mutation
    const nodes: GraphNode[] = initialNodes.map((n) => ({ ...n }));
    const edges: GraphEdge[] = initialEdges.map((e) => ({ ...e }));

    nodesRef.current = nodes;
    edgesRef.current = edges;

    const sim = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(80)
          .strength((d) => Math.min(0.5, (d as GraphEdge).weight * 0.05))
      )
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', forceCollide<GraphNode>().radius((d) => nodeRadius(d.size) + 4));

    simRef.current = sim;

    sim.on('tick', () => {
      renderGraph();
    });

    return () => {
      sim.stop();
    };
  }, [initialNodes, initialEdges, dimensions]);

  function nodeRadius(size: number): number {
    return Math.max(5, Math.min(25, 3 + Math.sqrt(size) * 3));
  }

  const renderGraph = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Edges
    for (const edge of edges) {
      const source = edge.source as GraphNode;
      const target = edge.target as GraphNode;
      if (source.x == null || target.x == null) continue;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(source.x));
      line.setAttribute('y1', String(source.y));
      line.setAttribute('x2', String(target.x));
      line.setAttribute('y2', String(target.y));
      line.setAttribute('stroke', '#e2e8f0');
      line.setAttribute('stroke-width', String(Math.max(1, Math.min(4, edge.weight * 0.5))));
      line.setAttribute('stroke-opacity', '0.6');
      svg.appendChild(line);
    }

    // Nodes
    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;
      const r = nodeRadius(node.size);
      const color = TYPE_COLORS[node.type] || '#94a3b8';

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(node.x));
      circle.setAttribute('cy', String(node.y));
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('style', 'cursor: pointer');
      circle.setAttribute('data-node-id', node.id);
      svg.appendChild(circle);

      // Label for larger nodes
      if (r > 8) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(node.x));
        text.setAttribute('y', String(node.y! + r + 14));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#475569');
        text.setAttribute('font-size', '10');
        text.setAttribute('style', 'pointer-events: none');
        text.textContent = node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label;
        svg.appendChild(text);
      }
    }
  }, []);

  // Event handlers on SVG
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const nodeId = target.getAttribute?.('data-node-id');
    if (nodeId) {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node });
        return;
      }
    }
    setTooltip(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const nodeId = target.getAttribute?.('data-node-id');
    if (nodeId) {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node && node.caseIds.length > 0) {
        router.push(`/case/${node.caseIds[0]}`);
      }
    }
  }, [router]);

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-600">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          onClick={handleClick}
        />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-slate-800 text-white text-xs rounded-md px-3 py-2 pointer-events-none shadow-lg z-20"
          style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
        >
          <p className="font-semibold">{tooltip.node.label}</p>
          <p className="text-slate-300">
            {TYPE_LABELS[tooltip.node.type]} &middot; {tooltip.node.size} case{tooltip.node.size !== 1 ? 's' : ''}
          </p>
          <p className="text-slate-400 text-[10px] mt-1">Click to view a case</p>
        </div>
      )}
    </div>
  );
}
