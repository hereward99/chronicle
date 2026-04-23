import { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  Panel,
  MiniMap,
  Connection,
  getNodesBounds,
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
import { Link2, Info, Maximize2, ZoomIn, ZoomOut, LayoutGrid, GitBranch, Circle, Shuffle, Focus, X, PanelRightClose, PanelRightOpen } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  getRelationshipColor,
  getRelationshipEdgeStyle,
  relationshipLegendItems,
} from '@/lib/relationshipStyles';

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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const NODE_HORIZONTAL_GAP = 220;
const NODE_VERTICAL_GAP = 120;

const getPrimaryNeighborhoodIds = (edges: Edge[], primaryCharacterIds: string[]) => {
  const visibleIds = new Set(primaryCharacterIds);

  edges.forEach((edge) => {
    if (primaryCharacterIds.includes(edge.source) || primaryCharacterIds.includes(edge.target)) {
      visibleIds.add(edge.source);
      visibleIds.add(edge.target);
    }
  });

  return visibleIds;
};

const recenterOnPrimary = (nodes: Node[], primaryCharacterIds: string[]) => {
  if (primaryCharacterIds.length === 0) return nodes;

  const primaryNodes = nodes.filter((node) => primaryCharacterIds.includes(node.id));
  if (primaryNodes.length === 0) return nodes;

  const avgX = primaryNodes.reduce((sum, node) => sum + node.position.x, 0) / primaryNodes.length;
  const avgY = primaryNodes.reduce((sum, node) => sum + node.position.y, 0) / primaryNodes.length;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - avgX,
      y: node.position.y - avgY,
    },
  }));
};

const resolveNodeCollisions = (nodes: Node[], primaryCharacterIds: string[]) => {
  const adjustedNodes = nodes.map((node) => ({
    ...node,
    position: { ...node.position },
  }));

  for (let iteration = 0; iteration < 80; iteration++) {
    let moved = false;

    for (let i = 0; i < adjustedNodes.length; i++) {
      for (let j = i + 1; j < adjustedNodes.length; j++) {
        const a = adjustedNodes[i];
        const b = adjustedNodes[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const overlapX = NODE_HORIZONTAL_GAP - Math.abs(dx);
        const overlapY = NODE_VERTICAL_GAP - Math.abs(dy);

        if (overlapX <= 0 || overlapY <= 0) continue;

        moved = true;
        const moveHorizontally = overlapX < overlapY;
        const push = (moveHorizontally ? overlapX : overlapY) / 2 + 6;
        const direction = moveHorizontally
          ? (dx === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dx))
          : (dy === 0 ? (j % 2 === 0 ? -1 : 1) : Math.sign(dy));

        const isPrimaryA = primaryCharacterIds.includes(a.id);
        const isPrimaryB = primaryCharacterIds.includes(b.id);
        const multiplierA = isPrimaryA && !isPrimaryB ? 0.35 : 1;
        const multiplierB = isPrimaryB && !isPrimaryA ? 0.35 : 1;

        if (moveHorizontally) {
          a.position.x -= push * direction * multiplierA;
          b.position.x += push * direction * multiplierB;
        } else {
          a.position.y -= push * direction * multiplierA;
          b.position.y += push * direction * multiplierB;
        }
      }
    }

    if (!moved) break;
  }

  return recenterOnPrimary(adjustedNodes, primaryCharacterIds);
};

const placeNodesInRing = (nodes: Node[], radius: number, angleOffset = -Math.PI / 2) => {
  if (nodes.length === 0) return [];

  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: 0, y: radius === 0 ? 0 : -radius } }];
  }

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: radius * Math.cos((index / nodes.length) * 2 * Math.PI + angleOffset),
      y: radius * Math.sin((index / nodes.length) * 2 * Math.PI + angleOffset),
    },
  }));
};

const buildPrimaryAnchoredGroupedLayout = (nodes: Node[], edges: Edge[], primaryCharacterIds: string[]) => {
  if (primaryCharacterIds.length === 0) return nodes;

  const primaryIdSet = new Set(primaryCharacterIds);
  const firstRingIds = getPrimaryNeighborhoodIds(edges, primaryCharacterIds);
  const primaryNodes = nodes.filter((node) => primaryIdSet.has(node.id));
  const firstRingNodes = nodes.filter((node) => firstRingIds.has(node.id) && !primaryIdSet.has(node.id));
  const remainingNodes = nodes.filter((node) => !firstRingIds.has(node.id));

  const positionedPrimary = placeNodesInRing(primaryNodes, primaryNodes.length > 1 ? 90 : 0);
  const positionedFirstRing = placeNodesInRing(
    firstRingNodes,
    Math.max(250, firstRingNodes.length * 36 + 140)
  );
  const positionedOuterRing = placeNodesInRing(
    remainingNodes,
    Math.max(520, remainingNodes.length * 34 + 300),
    -Math.PI / 3
  );

  return [...positionedPrimary, ...positionedFirstRing, ...positionedOuterRing];
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

  if (layout === 'circular') {
    return resolveNodeCollisions(buildPrimaryAnchoredGroupedLayout(nodes, edges, primaryCharacterIds), primaryCharacterIds);
  }

  if (layout === 'hierarchical') {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 120, ranksep: 170 });

    nodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    // Force primary nodes to top rank by pinning them to rank 0
    if (primaryCharacterIds.length > 0) {
      // Create a subgraph / rank constraint: add a virtual root connected only to primary nodes
      // and then remove edges TO primary nodes from non-primary sources to prevent rank pull-down
      const virtualRoot = '__virtual_root__';
      g.setNode(virtualRoot, { width: 0, height: 0 });
      primaryCharacterIds.forEach(id => {
        if (nodes.some(n => n.id === id)) {
          g.setEdge(virtualRoot, id);
        }
      });
    }

    dagre.layout(g);

    const layoutedResult = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    });

    return resolveNodeCollisions(recenterOnPrimary(layoutedResult, primaryCharacterIds), primaryCharacterIds);
  }

  return resolveNodeCollisions(buildPrimaryAnchoredGroupedLayout(nodes, edges, primaryCharacterIds), primaryCharacterIds);
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
  const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutType>('force');
  const [focusMode, setFocusMode] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusDepth, setFocusDepth] = useState<1 | 2>(1);
  const [showLegend, setShowLegend] = useState(true);
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();

  // Cancel connection / focus mode with Escape
  useEffect(() => {
    if (!connectionMode && !focusMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (connectionMode) {
          setConnectionMode(false);
          setPendingSourceId(null);
        }
        if (focusMode) {
          if (focusNodeId) {
            setFocusNodeId(null);
          } else {
            setFocusMode(false);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectionMode, focusMode, focusNodeId]);

  // Reset pending source when leaving connection mode
  useEffect(() => {
    if (!connectionMode) setPendingSourceId(null);
  }, [connectionMode]);

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
      style: getRelationshipEdgeStyle(rel),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getRelationshipColor(rel.relationship_type),
      },
      label: rel.relationship_type,
      labelStyle: { 
        fill: getRelationshipColor(rel.relationship_type),
        fontWeight: 600,
        fontSize: 12,
      },
      labelBgStyle: { 
        fill: 'hsl(var(--card))',
        fillOpacity: 0.92,
      },
      data: { relationship: rel },
    }));
  }, [relationships]);

  const layoutedNodes = useMemo(() => {
    return getLayoutedNodes(rawNodes, initialEdges, layout, primaryCharacterIds);
  }, [rawNodes, initialEdges, layout, primaryCharacterIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const initialViewportNodeIds = useMemo(() => {
    if (primaryCharacterIds.length === 0) return null;
    return getPrimaryNeighborhoodIds(initialEdges, primaryCharacterIds);
  }, [initialEdges, primaryCharacterIds]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [layoutedNodes, initialEdges, setNodes, setEdges]);

  // Compute neighbor set for focus mode (BFS up to focusDepth)
  const focusedNodeIds = useMemo(() => {
    if (!focusMode || !focusNodeId) return null;
    const adjacency = new Map<string, Set<string>>();
    relationships.forEach((rel) => {
      if (!adjacency.has(rel.character_id)) adjacency.set(rel.character_id, new Set());
      if (!adjacency.has(rel.related_character_id)) adjacency.set(rel.related_character_id, new Set());
      adjacency.get(rel.character_id)!.add(rel.related_character_id);
      adjacency.get(rel.related_character_id)!.add(rel.character_id);
    });
    const visible = new Set<string>([focusNodeId]);
    let frontier = new Set<string>([focusNodeId]);
    for (let depth = 0; depth < focusDepth; depth++) {
      const next = new Set<string>();
      frontier.forEach((id) => {
        adjacency.get(id)?.forEach((n) => {
          if (!visible.has(n)) {
            visible.add(n);
            next.add(n);
          }
        });
      });
      frontier = next;
      if (frontier.size === 0) break;
    }
    return visible;
  }, [focusMode, focusNodeId, focusDepth, relationships]);

  // Apply visual feedback for connection mode + focus mode
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => {
        const baseStyle = (n.data as any)?.character
          ? buildNodeStyle((n.data as any).character, (n.data as any).faction)
          : n.style || {};

        // Focus mode dimming takes precedence visually
        if (focusedNodeIds) {
          if (focusedNodeIds.has(n.id)) {
            const isCenter = n.id === focusNodeId;
            return {
              ...n,
              style: {
                ...baseStyle,
                ...(isCenter && {
                  outline: '3px solid hsl(var(--primary))',
                  outlineOffset: '2px',
                  boxShadow: '0 0 0 6px hsl(var(--primary) / 0.25)',
                }),
              },
            };
          }
          return { ...n, style: { ...baseStyle, opacity: 0.15 } };
        }

        if (!connectionMode) {
          return { ...n, style: baseStyle };
        }
        if (pendingSourceId === n.id) {
          return {
            ...n,
            style: {
              ...baseStyle,
              outline: '3px solid hsl(var(--primary))',
              outlineOffset: '2px',
              boxShadow: '0 0 0 6px hsl(var(--primary) / 0.25)',
            },
          };
        }
        if (pendingSourceId) {
          return { ...n, style: { ...baseStyle, opacity: 0.5 } };
        }
        return { ...n, style: baseStyle };
      })
    );
  }, [connectionMode, pendingSourceId, focusedNodeIds, focusNodeId, setNodes, buildNodeStyle]);

  // Dim edges that are not between two focused nodes
  useEffect(() => {
    setEdges((current) =>
      current.map((e) => {
        if (!focusedNodeIds) {
          return { ...e, style: { ...e.style, opacity: 1 } };
        }
        const inFocus = focusedNodeIds.has(e.source) && focusedNodeIds.has(e.target);
        return {
          ...e,
          style: { ...e.style, opacity: inFocus ? 1 : 0.1 },
          labelStyle: { ...(e.labelStyle as any), opacity: inFocus ? 1 : 0.1 },
        };
      })
    );
  }, [focusedNodeIds, setEdges]);

  // Fit view after layout change, centered on primary coterie + immediate ring when available
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (initialViewportNodeIds && initialViewportNodeIds.size > 0) {
        const nodesToFrame = nodes.filter((node) => initialViewportNodeIds.has(node.id));
        if (nodesToFrame.length > 0) {
          const bounds = getNodesBounds(nodesToFrame);
          const paddingX = 180;
          const paddingY = 140;
          fitView({
            nodes: nodesToFrame.map((node) => ({ id: node.id })),
            padding: 0.25,
            duration: 450,
          });
          setViewport(
            {
              x: -(bounds.x + bounds.width / 2) + paddingX,
              y: -(bounds.y + bounds.height / 2) + paddingY,
              zoom: Math.min(1, bounds.width > 0 || bounds.height > 0 ? 0.9 : 1),
            },
            { duration: 450 }
          );
          return;
        }
      }

      fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [layout, fitView, initialViewportNodeIds, nodes, setViewport]);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    if (connectionMode) {
      if (!pendingSourceId) {
        setPendingSourceId(node.id);
        return;
      }
      if (pendingSourceId === node.id) {
        setPendingSourceId(null);
        return;
      }
      if (onCreateRelationship) {
        onCreateRelationship(pendingSourceId, node.id);
      }
      setPendingSourceId(null);
      setConnectionMode(false);
      return;
    }
    if (focusMode) {
      setFocusNodeId(node.id);
      setFocusDepth(1);
      return;
    }
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [connectionMode, pendingSourceId, onCreateRelationship, onNodeClick, focusMode]);

  const onEdgeClickHandler = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (onEdgeClick && edge.data?.relationship) {
      onEdgeClick(edge.data.relationship);
    }
  }, [onEdgeClick]);

  const onConnect = useCallback((connection: Connection) => {
    if (onCreateRelationship && connection.source && connection.target) {
      onCreateRelationship(connection.source, connection.target);
      setConnectionMode(false);
      setPendingSourceId(null);
    }
  }, [onCreateRelationship]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (focusMode) {
      setFocusNodeId(node.id);
      setFocusDepth(2);
      return;
    }
    if (!connectionMode) {
      setConnectionMode(true);
      setPendingSourceId(node.id);
    }
  }, [connectionMode, focusMode]);

  const onPaneClick = useCallback(() => {
    if (focusMode && focusNodeId) {
      setFocusNodeId(null);
    }
  }, [focusMode, focusNodeId]);

  const exitFocusMode = useCallback(() => {
    setFocusMode(false);
    setFocusNodeId(null);
    setFocusDepth(1);
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  const layoutOptions: { value: LayoutType; label: string; icon: React.ReactNode }[] = [
    { value: 'force', label: 'Grouped', icon: <Shuffle className="w-4 h-4" /> },
    { value: 'hierarchical', label: 'Tree', icon: <GitBranch className="w-4 h-4" /> },
    { value: 'circular', label: 'Circle', icon: <Circle className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full h-[600px] border rounded-lg bg-background relative">
      {connectionMode && (() => {
        const sourceName = pendingSourceId
          ? characters.find((c) => c.id === pendingSourceId)?.name
          : null;
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {sourceName
                ? `Connecting from "${sourceName}" — click target node`
                : 'Connection mode — click the source node'}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setConnectionMode(false);
                setPendingSourceId(null);
              }}
              className="ml-2"
            >
              Cancel
            </Button>
          </div>
        );
      })()}

      {focusMode && !connectionMode && (() => {
        const focusName = focusNodeId
          ? characters.find((c) => c.id === focusNodeId)?.name
          : null;
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Focus className="w-4 h-4" />
            <span className="text-sm font-medium">
              {focusName
                ? `Focused on "${focusName}" — ${focusDepth}-hop neighbors`
                : 'Focus mode — click a node to isolate it'}
            </span>
            {focusNodeId && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setFocusNodeId(null)}
                className="ml-1"
              >
                Clear
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={exitFocusMode}
              className="ml-1"
            >
              <X className="w-3 h-3 mr-1" /> Exit
            </Button>
          </div>
        );
      })()}
      
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
            onPaneClick={onPaneClick}
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

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={focusMode ? "default" : "outline"}
                        onClick={() => {
                          if (focusMode) {
                            exitFocusMode();
                          } else {
                            setFocusMode(true);
                            setConnectionMode(false);
                            setPendingSourceId(null);
                          }
                        }}
                        className="gap-2"
                      >
                        <Focus className="w-4 h-4" />
                        Focus
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click a node to dim everything except its neighbors. Double-click for 2-hop.</p>
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

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={showLegend ? "secondary" : "outline"}
                        onClick={() => setShowLegend((current) => !current)}
                        className="gap-2"
                      >
                        {showLegend ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                        Legend
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showLegend ? 'Hide legend' : 'Show legend'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
            
            {showLegend && (
              <Panel position="top-right" className="w-72 bg-card/95 border rounded-lg p-3 shadow-lg backdrop-blur-sm">
                <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Relationship Legend
                </div>
                <div className="space-y-2.5">
                  {relationshipLegendItems.map(({ type, color, hint }) => {
                    const sampleWidth = type === 'Enemy' ? 5.5 : type === 'Rival' ? 4.5 : 3.5;
                    return (
                      <div key={type} className="grid grid-cols-[44px_1fr] items-center gap-3">
                        <div className="flex items-center justify-center h-6">
                          <div
                            className="w-10 rounded-full"
                            style={{
                              borderTop: `${sampleWidth}px ${type === 'Contact' ? 'dashed' : 'solid'} ${color}`,
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-foreground">{type}</div>
                          <div className="text-[11px] text-muted-foreground">{hint}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-md border border-border/80 bg-secondary/30 p-2.5 space-y-2">
                  <div className="text-xs font-medium text-foreground">Encoding</div>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-10 border-t-2 border-foreground/70 rounded-full" />
                      <span>Thin = weak intensity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 border-t-4 border-foreground/70 rounded-full" />
                      <span>Thick = strong intensity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 border-t-2 border-dashed border-foreground/70 rounded-full" />
                      <span>Dashed = non-mutual</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  <div>• Drag nodes to rearrange</div>
                  <div>• Click to view details</div>
                  <div>• Double-click a node to connect from it</div>
                  <div>• Press Esc to cancel connection</div>
                  <div>• Focus: click = 1-hop, double-click = 2-hop</div>
                </div>
              </Panel>
            )}
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
