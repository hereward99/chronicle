import { useCallback, useMemo, useEffect } from 'react';
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
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Relationship } from '@/hooks/useRelationships';
import { Character } from '@/hooks/useCharacters';
import { Faction, CharacterFaction } from '@/hooks/useFactions';
import { Badge } from '@/components/ui/badge';

interface RelationshipGraphProps {
  relationships: Relationship[];
  characters: Character[];
  factions?: Faction[];
  characterFactions?: CharacterFaction[];
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
  factions = [],
  characterFactions = [],
  onNodeClick,
  onEdgeClick 
}: RelationshipGraphProps) {
  // Group characters by faction
  const charactersByFaction = useMemo(() => {
    const grouped: Record<string, Character[]> = { 'none': [] };
    
    characters.forEach(char => {
      const charFactions = characterFactions.filter(cf => cf.character_id === char.id);
      if (charFactions.length === 0) {
        grouped['none'].push(char);
      } else {
        charFactions.forEach(cf => {
          if (!grouped[cf.faction_id]) {
            grouped[cf.faction_id] = [];
          }
          grouped[cf.faction_id].push(char);
        });
      }
    });
    
    return grouped;
  }, [characters, characterFactions]);
  const initialNodes: Node[] = useMemo(() => {
    // Get all unique character IDs from relationships
    const characterIds = new Set<string>();
    relationships.forEach(rel => {
      characterIds.add(rel.character_id);
      characterIds.add(rel.related_character_id);
    });

    const nodes: Node[] = [];
    let globalIndex = 0;

    // Process each faction group
    Object.entries(charactersByFaction).forEach(([factionId, factionChars]) => {
      const relevantChars = factionChars.filter(char => characterIds.has(char.id));
      if (relevantChars.length === 0) return;

      const faction = factions.find(f => f.id === factionId);
      const groupSize = relevantChars.length;
      
      // Calculate group position based on global index
      const groupAngle = (globalIndex / Object.keys(charactersByFaction).length) * 2 * Math.PI;
      const groupRadius = 400;
      const groupCenterX = 500 + groupRadius * Math.cos(groupAngle);
      const groupCenterY = 400 + groupRadius * Math.sin(groupAngle);

      // Position characters within their faction group
      relevantChars.forEach((char, index) => {
        const localAngle = (index / groupSize) * 2 * Math.PI;
        const localRadius = Math.min(80, 40 + groupSize * 8);
        const x = groupCenterX + localRadius * Math.cos(localAngle);
        const y = groupCenterY + localRadius * Math.sin(localAngle);

        const charFaction = characterFactions.find(cf => cf.character_id === char.id && cf.faction_id === factionId);

        nodes.push({
          id: char.id,
          type: 'default',
          position: { x, y },
          data: { 
            label: (
              <div className="flex flex-col items-center">
                <div className="font-semibold text-sm">{char.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {char.clan}
                  </Badge>
                  {faction && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: faction.color,
                        color: faction.color 
                      }}
                    >
                      {faction.name}
                    </Badge>
                  )}
                </div>
                {charFaction?.role && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {charFaction.role}
                  </Badge>
                )}
              </div>
            ),
            character: char
          },
          style: {
            background: faction ? `${faction.color}15` : getNodeColor(char.clan),
            color: faction ? faction.color : '#fff',
            border: faction ? `3px solid ${faction.color}` : '2px solid #fff',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '140px',
            fontSize: '14px',
            boxShadow: faction 
              ? `0 4px 12px -2px ${faction.color}40`
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        });
      });

      globalIndex++;
    });

    return nodes;
  }, [relationships, characters, factions, characterFactions, charactersByFaction]);

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

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        nodesDraggable={true}
        nodesConnectable={false}
      >
        <Background gap={16} />
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor={(node) => {
            const char = node.data.character as Character;
            return getNodeColor(char.clan);
          }}
          maskColor="rgb(0, 0, 0, 0.1)"
          className="bg-background border rounded"
        />
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
          <div className="text-xs text-muted-foreground mt-2">
            Click nodes to view character
          </div>
          <div className="text-xs text-muted-foreground">
            Click edges to edit relationship
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
