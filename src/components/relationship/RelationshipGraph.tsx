import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Relationship } from '@/hooks/useRelationships';
import { Character } from '@/hooks/useCharacters';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface RelationshipGraphProps {
  relationships: Relationship[];
  characters: Character[];
  onNodeClick?: (characterId: string) => void;
  onEdgeClick?: (relationship: Relationship) => void;
}

const relationshipColors: Record<string, string> = {
  'Ally': '#10b981',
  'Rival': '#f97316',
  'Contact': '#3b82f6',
  'Friend': '#ec4899',
  'Enemy': '#ef4444',
};

const getNodeColor = (clan: string): string => {
  const clanColors: Record<string, string> = {
    'Brujah': '#ef4444',
    'Gangrel': '#22c55e',
    'Malkavian': '#a855f7',
    'Nosferatu': '#78716c',
    'Toreador': '#ec4899',
    'Tremere': '#8b5cf6',
    'Ventrue': '#3b82f6',
    'Lasombra': '#1e293b',
    'Tzimisce': '#dc2626',
    'Banu Haqim': '#7c3aed',
    'Ministry': '#eab308',
    'Hecata': '#475569',
    'Ravnos': '#f59e0b',
    'Salubri': '#06b6d4',
    'Caitiff': '#6b7280',
    'Thin-Blood': '#f87171',
    'Human': '#94a3b8',
  };
  return clanColors[clan] || '#64748b';
};

export function RelationshipGraph({ 
  relationships, 
  characters,
  onNodeClick,
  onEdgeClick 
}: RelationshipGraphProps) {
  const initialNodes: Node[] = useMemo(() => {
    // Get all unique character IDs from relationships
    const characterIds = new Set<string>();
    relationships.forEach(rel => {
      characterIds.add(rel.character_id);
      characterIds.add(rel.related_character_id);
    });

    // Create nodes for characters that have relationships
    const nodes = Array.from(characterIds)
      .map(id => characters.find(c => c.id === id))
      .filter((char): char is Character => char !== undefined)
      .map((char, index) => {
        const angle = (index / characterIds.size) * 2 * Math.PI;
        const radius = 300;
        const x = 400 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);

        return {
          id: char.id,
          type: 'default',
          position: { x, y },
          data: { 
            label: (
              <div className="flex flex-col items-center">
                <div className="font-semibold text-sm">{char.name}</div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {char.clan}
                </Badge>
              </div>
            ),
            character: char
          },
          style: {
            background: getNodeColor(char.clan),
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '120px',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        };
      });

    return nodes;
  }, [relationships, characters]);

  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map(rel => ({
      id: rel.id,
      source: rel.character_id,
      target: rel.related_character_id,
      type: 'smoothstep',
      animated: rel.intensity >= 4,
      style: { 
        stroke: relationshipColors[rel.relationship_type] || '#64748b',
        strokeWidth: rel.intensity,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: relationshipColors[rel.relationship_type] || '#64748b',
      },
      label: rel.relationship_type,
      labelStyle: { 
        fill: relationshipColors[rel.relationship_type] || '#64748b',
        fontWeight: 600,
        fontSize: 12,
      },
      labelBgStyle: { 
        fill: '#fff',
        fillOpacity: 0.9,
      },
      data: { relationship: rel },
    }));
  }, [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  const onEdgeClickHandler = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (onEdgeClick && edge.data?.relationship) {
      onEdgeClick(edge.data.relationship);
    }
  }, [onEdgeClick]);

  const getLegendItems = () => {
    return Object.entries(relationshipColors).map(([type, color]) => ({
      type,
      color,
    }));
  };

  return (
    <div className="w-full h-[600px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        onEdgeClick={onEdgeClickHandler}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="bg-card border rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold mb-2">Relationship Types</div>
          <div className="space-y-1">
            {getLegendItems().map(({ type, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-8 h-0.5" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{type}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            Line thickness = intensity
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
