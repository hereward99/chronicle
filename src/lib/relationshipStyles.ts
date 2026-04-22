import type { CSSProperties } from 'react';
import type { Relationship } from '@/hooks/useRelationships';

type RelationshipStyleDefinition = {
  colorVar: string;
  badgeClassName: string;
  legendHint: string;
};

export const relationshipStyleDefinitions: Record<string, RelationshipStyleDefinition> = {
  Ally: {
    colorVar: '--relationship-ally',
    badgeClassName:
      'border-[hsl(var(--relationship-ally)/0.35)] bg-[hsl(var(--relationship-ally)/0.12)] text-[hsl(var(--relationship-ally))]',
    legendHint: 'supportive ties',
  },
  Enemy: {
    colorVar: '--relationship-enemy',
    badgeClassName:
      'border-[hsl(var(--relationship-enemy)/0.35)] bg-[hsl(var(--relationship-enemy)/0.12)] text-[hsl(var(--relationship-enemy))]',
    legendHint: 'hostile ties',
  },
  Rival: {
    colorVar: '--relationship-rival',
    badgeClassName:
      'border-[hsl(var(--relationship-rival)/0.35)] bg-[hsl(var(--relationship-rival)/0.12)] text-[hsl(var(--relationship-rival))]',
    legendHint: 'competitive ties',
  },
  Friend: {
    colorVar: '--relationship-friend',
    badgeClassName:
      'border-[hsl(var(--relationship-friend)/0.35)] bg-[hsl(var(--relationship-friend)/0.12)] text-[hsl(var(--relationship-friend))]',
    legendHint: 'personal trust',
  },
  Contact: {
    colorVar: '--relationship-contact',
    badgeClassName:
      'border-[hsl(var(--relationship-contact)/0.35)] bg-[hsl(var(--relationship-contact)/0.12)] text-[hsl(var(--relationship-contact))]',
    legendHint: 'useful connections',
  },
};

const fallbackColor = 'hsl(var(--muted-foreground))';

export const getRelationshipColor = (relationshipType: string) => {
  const definition = relationshipStyleDefinitions[relationshipType];
  return definition ? `hsl(var(${definition.colorVar}))` : fallbackColor;
};

export const getRelationshipBadgeClassName = (relationshipType: string) => {
  return relationshipStyleDefinitions[relationshipType]?.badgeClassName ?? 'border-border bg-muted/50 text-muted-foreground';
};

export const getRelationshipStrokeWidth = (intensity: number) => {
  return 1.5 + Math.max(1, Math.min(intensity, 5)) * 1.1;
};

export const getRelationshipDashArray = (isMutual: Relationship['is_mutual']) => {
  return isMutual ? undefined : '7 5';
};

export const getRelationshipEdgeStyle = (relationship: Relationship): CSSProperties => ({
  stroke: getRelationshipColor(relationship.relationship_type),
  strokeWidth: getRelationshipStrokeWidth(relationship.intensity),
  strokeDasharray: getRelationshipDashArray(relationship.is_mutual),
});

export const relationshipLegendItems = Object.entries(relationshipStyleDefinitions).map(([type, definition]) => ({
  type,
  color: `hsl(var(${definition.colorVar}))`,
  hint: definition.legendHint,
}));