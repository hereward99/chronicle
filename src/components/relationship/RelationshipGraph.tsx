import { useCallback, useMemo, useEffect, useState } from 'react';
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
  Connection,
  addEdge,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Relationship } from '@/hooks/useRelationships';
import { Character } from '@/hooks/useCharacters';
import { Faction, CharacterFaction } from '@/hooks/useFactions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Info, Maximize2, ZoomIn, ZoomOut, LayoutGrid, GitBranch, Circle, Shuffle } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface RelationshipGraphProps {
  relationships: Relationship[];
  characters: Character[];
  factions?: Faction[];
  characterFactions?: CharacterFaction[];
  primaryCharacterIds?: string[];
  onNodeClick?: (characterId: string) => void;
  onEdgeClick?: (relationship: Relationship) => void;
  onCreateRelationship?: (sourceId: string, targetId: string) => void;
}

type LayoutType = 'force' | 'hierarchical' | 'circular';

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

function getLayoutedNodes(
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType,
  primaryCharacterIds: string[] = []
): Node[] {
  if (nodes.length === 0) return nodes;

  const centerX = 0;
  const centerY = 0;

  if (layout === 'circular') {
    const primaryNodes = nodes.filter(n => primaryCharacterIds.includes(n.id));
    const otherNodes = nodes.filter(n => !primaryCharacterIds.includes(n.id));
    
    const innerRadius = primaryNodes.length > 1 ? Math.max(100, primaryNodes.length * 30) : 0;
    const outerRadius = Math.max(250, (primaryNodes.length + otherNodes.length) * 35);

    return [
      ...primaryNodes.map((node, index) => ({
        ...node,
        position: {
          x: centerX + innerRadius * Math.cos((index / Math.max(primaryNodes.length, 1)) * 2 * Math.PI - Math.PI / 2),
          y: centerY + innerRadius * Math.sin((index / Math.max(primaryNodes.length, 1)) * 2 * Math.PI - Math.PI / 2),
        },
      })),
      ...otherNodes.map((node, index) => ({
        ...node,
        position: {
          x: centerX + outerRadius * Math.cos((index / Math.max(otherNodes.length, 1)) * 2 * Math.PI - Math.PI / 2),
          y: centerY + outerRadius * Math.sin((index / Math.max(otherNodes.length, 1)) * 2 * Math.PI - Math.PI / 2),
        },
      })),
    ];
  }

  if (layout === 'hierarchical') {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 });

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 180, height: 80 });
    });

    // Add invisible edges from a virtual root to primary nodes to force them to top rank
    if (primaryCharacterIds.length > 0) {
      g.setNode('__root__', { width: 0, height: 0 });
      primaryCharacterIds.forEach(id => {
        if (nodes.some(n => n.id === id)) {
          g.setEdge('__root__', id);
        }
      });
    }

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    // Remove virtual root and position nodes
    return nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 40,
        },
      };
    });
  }

  // 'force' layout — reposition with primary coterie at center
  if (primaryCharacterIds.length > 0) {
    const isPrimary = (id: string) => primaryCharacterIds.includes(id);
    const primaryNodes = nodes.filter(n => isPrimary(n.id));
    const otherNodes = nodes.filter(n => !isPrimary(n.id));

    // Place primary nodes in a tight cluster at center
    const primaryPositioned = primaryNodes.map((node, index) => {
      const angle = (index / Math.max(primaryNodes.length, 1)) * 2 * Math.PI;
      const radius = primaryNodes.length === 1 ? 0 : Math.min(120, 50 + primaryNodes.length * 15);
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });

    // Place other nodes in an outer ring, spaced further out
    const outerRadius = Math.max(400, (primaryNodes.length + otherNodes.length) * 30);
    const otherPositioned = otherNodes.map((node, index) => {
      const angle = (index / Math.max(otherNodes.length, 1)) * 2 * Math.PI;
      return {
        ...node,
        position: {
          x: centerX + outerRadius * Math.cos(angle),
          y: centerY + outerRadius * Math.sin(angle),
        },
      };
    });

    return [...primaryPositioned, ...otherPositioned];
  }

  // No primary coterie — return original faction-grouped positions
  return nodes;
}

export function RelationshipGraph({ 
  relationships, 
  characters,
  factions = [],
  characterFactions = [],
  primaryCharacterIds = [],
  onNodeClick,
  onEdgeClick,
  onCreateRelationship 
}: RelationshipGraphProps) {
  const [connectionMode, setConnectionMode] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('force');
  const { fitView, zoomIn, zoomOut } = useReactFlow();

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

  const buildNodeData = useCallback((char: Character, faction?: Faction, charFaction?: CharacterFaction) => {
    return {
      label: (
        <div className="flex flex-col items-center select-none pointer-events-none">
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
      character: char,
      faction: faction
    };
  }, []);

  const buildNodeStyle = useCallback((char: Character, faction?: Faction) => ({
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
  }), []);

  const rawNodes: Node[] = useMemo(() => {
    const characterIds = new Set<string>();
    relationships.forEach(rel => {
      characterIds.add(rel.character_id);
      characterIds.add(rel.related_character_id);
    });

    const nodes: Node[] = [];
    const factionGroups = Object.entries(charactersByFaction).filter(([_, chars]) => 
      chars.some(char => characterIds.has(char.id))
    );
    
    const totalGroups = factionGroups.length;
    let globalIndex = 0;

    factionGroups.forEach(([factionId, factionChars]) => {
      const relevantChars = factionChars.filter(char => characterIds.has(char.id));
      if (relevantChars.length === 0) return;

      const faction = factions.find(f => f.id === factionId);
      const groupSize = relevantChars.length;
      
      const groupAngle = (globalIndex / Math.max(totalGroups, 1)) * 2 * Math.PI;
      const groupRadius = totalGroups === 1 ? 0 : 500;
      const groupCenterX = 600 + groupRadius * Math.cos(groupAngle);
      const groupCenterY = 400 + groupRadius * Math.sin(groupAngle);

      relevantChars.forEach((char, index) => {
        const localAngle = (index / Math.max(groupSize, 1)) * 2 * Math.PI;
        const localRadius = groupSize === 1 ? 0 : Math.min(150, 60 + groupSize * 15);
        const x = groupCenterX + localRadius * Math.cos(localAngle);
        const y = groupCenterY + localRadius * Math.sin(localAngle);

        const charFaction = characterFactions.find(cf => cf.character_id === char.id && cf.faction_id === factionId);
        
        nodes.push({
          id: char.id,
          type: 'default',
          position: { x, y },
          data: buildNodeData(char, faction, charFaction),
          style: buildNodeStyle(char, faction),
        });
      });

      globalIndex++;
    });

    return nodes;
  }, [relationships, characters, factions, characterFactions, charactersByFaction, buildNodeData, buildNodeStyle]);

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

  const layoutedNodes = useMemo(() => {
    return getLayoutedNodes(rawNodes, initialEdges, layout, primaryCharacterIds);
  }, [rawNodes, initialEdges, layout, primaryCharacterIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [layoutedNodes, initialEdges, setNodes, setEdges]);

  // Fit view after layout change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [layout, fitView]);

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

  const onConnect = useCallback((connection: Connection) => {
    if (connectionMode && onCreateRelationship && connection.source && connection.target) {
      onCreateRelationship(connection.source, connection.target);
      setConnectionMode(false);
    }
  }, [connectionMode, onCreateRelationship]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (!connectionMode) {
      setConnectionMode(true);
    }
  }, [connectionMode]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  const getLegendItems = () => {
    return Object.entries(relationshipColors).map(([type, color]) => ({
      type,
      color,
    }));
  };

  const layoutOptions: { value: LayoutType; label: string; icon: React.ReactNode }[] = [
    { value: 'force', label: 'Grouped', icon: <Shuffle className="w-4 h-4" /> },
    { value: 'hierarchical', label: 'Tree', icon: <GitBranch className="w-4 h-4" /> },
    { value: 'circular', label: 'Circle', icon: <Circle className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full h-[600px] border rounded-lg bg-background relative">
      {connectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Link2 className="w-4 h-4" />
          <span className="text-sm font-medium">Connection Mode Active - Click two nodes to connect</span>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => setConnectionMode(false)}
            className="ml-2"
          >
            Cancel
          </Button>
        </div>
      )}
      
      <ContextMenu>
        <ContextMenuTrigger className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClickHandler}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClickHandler}
            onConnect={onConnect}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="bottom-left"
            nodesDraggable={!connectionMode}
            nodesConnectable={connectionMode}
            elementsSelectable={true}
            panOnDrag={connectionMode}
          >
            <Background gap={16} />
            <MiniMap 
              nodeColor={(node) => {
                const char = node.data.character as Character;
                return getNodeColor(char.clan);
              }}
              maskColor="rgb(0, 0, 0, 0.1)"
              className="bg-background border rounded"
            />
            
            {/* Left panel: Connect + Zoom + Fit */}
            <Panel position="top-left" className="bg-card border rounded-lg p-2 shadow-lg">
              <div className="flex flex-col gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={connectionMode ? "default" : "outline"}
                        onClick={() => setConnectionMode(!connectionMode)}
                        className="gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        Connect
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create relationships by connecting nodes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="border-t border-border my-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => zoomIn({ duration: 200 })}>
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Zoom in</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => zoomOut({ duration: 200 })}>
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Zoom out</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleFitView}>
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Fit all nodes in view</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="border-t border-border my-1" />

                {/* Layout switcher */}
                <div className="text-xs font-medium text-muted-foreground px-1 mb-0.5">Layout</div>
                {layoutOptions.map((opt) => (
                  <TooltipProvider key={opt.value}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={layout === opt.value ? "default" : "outline"}
                          className="gap-2 justify-start"
                          onClick={() => setLayout(opt.value)}
                        >
                          {opt.icon}
                          {opt.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{opt.label} layout</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </Panel>
            
            {/* Right panel: Legend */}
            <Panel position="top-right" className="bg-card border rounded-lg p-3 shadow-lg">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Legend
              </div>
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
              <div className="text-xs text-muted-foreground mt-3 space-y-1">
                <div>• Drag nodes to rearrange</div>
                <div>• Click to view details</div>
                <div>• Double-click to connect</div>
                <div>• Right-click for menu</div>
              </div>
            </Panel>
          </ReactFlow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setConnectionMode(true)}>
            <Link2 className="w-4 h-4 mr-2" />
            Create Relationship
          </ContextMenuItem>
          <ContextMenuItem onClick={handleFitView}>
            <Maximize2 className="w-4 h-4 mr-2" />
            Fit View
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
