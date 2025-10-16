import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Cpu, CheckCircle } from "lucide-react";

export const WorkerPoolPanel = () => {
  const { data: workers } = useQuery({
    queryKey: ['revenue-workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_revenue_workers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: taskQueue } = useQuery({
    queryKey: ['task-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_revenue_task_queue')
        .select('*')
        .order('priority', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Worker Pool & Task Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Active Workers</h3>
          <div className="grid gap-2">
            {workers?.map((worker) => {
              const tasksCompleted = worker.metrics?.tasks_completed || 0;
              const tasksFailed = worker.metrics?.tasks_failed || 0;
              const tasksProcessing = worker.metrics?.tasks_processing || 0;
              const successRate = tasksCompleted + tasksFailed > 0 ? 
                (tasksCompleted / (tasksCompleted + tasksFailed) * 100) : 0;

              return (
                <div key={worker.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span className="font-medium text-sm">{worker.worker_type}</span>
                    </div>
                    <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>
                      {worker.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-semibold text-green-600">{tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processing</p>
                      <p className="font-semibold">{tasksProcessing}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-semibold text-destructive">{tasksFailed}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Success Rate
                    </span>
                    <span className="text-xs font-semibold text-green-600">{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-1 mt-1" />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Task Queue</h3>
          <div className="space-y-2">
            {taskQueue?.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{task.task_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Priority: {task.priority} • Retries: {task.retry_count}/{task.max_retries}
                  </p>
                </div>
                <Badge variant={
                  task.status === 'completed' ? 'default' :
                  task.status === 'processing' ? 'secondary' :
                  task.status === 'failed' ? 'destructive' :
                  'outline'
                }>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};