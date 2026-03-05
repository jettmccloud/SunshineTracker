export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

interface GraphNode {
  id: string;
  label: string;
  type: 'judge' | 'court' | 'category';
  size: number;
  caseIds: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export async function GET(req: NextRequest) {
  try {
    const cases = await getMany(
      `SELECT id, case_name, court_id, court_name, judges, category
       FROM cached_cases
       WHERE court_id IS NOT NULL
       ORDER BY date_filed DESC NULLS LAST
       LIMIT 2000`,
      []
    );

    const nodeMap = new Map<string, GraphNode>();
    const edgeCounts = new Map<string, { source: string; target: string; weight: number }>();

    for (const c of cases) {
      // Court node
      const courtKey = `court:${c.court_id}`;
      if (!nodeMap.has(courtKey)) {
        nodeMap.set(courtKey, {
          id: courtKey,
          label: c.court_name || c.court_id,
          type: 'court',
          size: 0,
          caseIds: [],
        });
      }
      const courtNode = nodeMap.get(courtKey)!;
      courtNode.size++;
      courtNode.caseIds.push(c.id);

      // Category node
      if (c.category) {
        const catKey = `category:${c.category}`;
        if (!nodeMap.has(catKey)) {
          nodeMap.set(catKey, {
            id: catKey,
            label: c.category.replace(/_/g, ' '),
            type: 'category',
            size: 0,
            caseIds: [],
          });
        }
        const catNode = nodeMap.get(catKey)!;
        catNode.size++;
        catNode.caseIds.push(c.id);

        // Edge: court <-> category
        const edgeKey = [courtKey, catKey].sort().join('|');
        if (!edgeCounts.has(edgeKey)) {
          edgeCounts.set(edgeKey, { source: courtKey, target: catKey, weight: 0 });
        }
        edgeCounts.get(edgeKey)!.weight++;
      }

      // Judge nodes
      const judges = c.judges || [];
      for (const judge of judges) {
        if (!judge || judge.trim() === '') continue;
        const judgeKey = `judge:${judge.trim()}`;
        if (!nodeMap.has(judgeKey)) {
          nodeMap.set(judgeKey, {
            id: judgeKey,
            label: judge.trim(),
            type: 'judge',
            size: 0,
            caseIds: [],
          });
        }
        const judgeNode = nodeMap.get(judgeKey)!;
        judgeNode.size++;
        judgeNode.caseIds.push(c.id);

        // Edge: judge <-> court
        const jcEdgeKey = [judgeKey, courtKey].sort().join('|');
        if (!edgeCounts.has(jcEdgeKey)) {
          edgeCounts.set(jcEdgeKey, { source: judgeKey, target: courtKey, weight: 0 });
        }
        edgeCounts.get(jcEdgeKey)!.weight++;

        // Edge: judge <-> category
        if (c.category) {
          const catKey = `category:${c.category}`;
          const jcatEdgeKey = [judgeKey, catKey].sort().join('|');
          if (!edgeCounts.has(jcatEdgeKey)) {
            edgeCounts.set(jcatEdgeKey, { source: judgeKey, target: catKey, weight: 0 });
          }
          edgeCounts.get(jcatEdgeKey)!.weight++;
        }
      }
    }

    // Take top 200 nodes by degree (size)
    const allNodes = Array.from(nodeMap.values());
    allNodes.sort((a, b) => b.size - a.size);
    const topNodes = allNodes.slice(0, 200);
    const topNodeIds = new Set(topNodes.map((n) => n.id));

    // Filter edges to only include top nodes
    const edges: GraphEdge[] = [];
    const edgeValues = Array.from(edgeCounts.values());
    for (const edge of edgeValues) {
      if (topNodeIds.has(edge.source) && topNodeIds.has(edge.target)) {
        edges.push(edge);
      }
    }

    // Trim caseIds to first 10 for payload size
    const nodes = topNodes.map((n) => ({
      ...n,
      caseIds: n.caseIds.slice(0, 10),
    }));

    return NextResponse.json({
      nodes,
      edges,
      totalCases: cases.length,
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
