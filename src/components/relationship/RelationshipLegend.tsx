import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { relationshipLegendItems } from '@/lib/relationshipStyles';

export function RelationshipLegend() {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Relationship Legend
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
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

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-md border border-border/80 bg-secondary/30 p-2.5 space-y-2">
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

          <div className="rounded-md border border-border/80 bg-secondary/30 p-2.5 space-y-1 text-[11px] text-muted-foreground">
            <div className="text-xs font-medium text-foreground mb-1">Tips</div>
            <div>• Drag nodes to rearrange</div>
            <div>• Click to view details</div>
            <div>• Double-click a node to connect from it</div>
            <div>• Press Esc to cancel connection</div>
            <div>• Focus: click = 1-hop, double-click = 2-hop</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
