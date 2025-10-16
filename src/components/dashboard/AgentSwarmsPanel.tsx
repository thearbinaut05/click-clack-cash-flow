import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Bot, Zap, DollarSign } from "lucide-react";

export const AgentSwarmsPanel = () => {
  const { data: swarms } = useQuery({
    queryKey: ['agent-swarms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_swarms')
        .select('*, agent_tasks(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Agent Swarms
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {swarms?.map((swarm) => {
            const roi = swarm.roi_percentage || 0;
            const activeTasks = swarm.agent_tasks?.filter((t: any) => t.status === 'pending').length || 0;
            
            return (
              <div key={swarm.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{swarm.name}</h4>
                    <p className="text-xs text-muted-foreground">{swarm.swarm_type}</p>
                  </div>
                  <Badge variant={swarm.status === 'active' ? 'default' : 'secondary'}>
                    {swarm.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-green-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {swarm.revenue_generated?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="font-semibold text-destructive flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {swarm.total_cost?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className={`font-semibold ${roi > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {activeTasks} Active Tasks
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {swarm.vm_provider} / {swarm.vm_instance_type}
                    </span>
                  </div>
                  <Progress value={(activeTasks / 10) * 100} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};