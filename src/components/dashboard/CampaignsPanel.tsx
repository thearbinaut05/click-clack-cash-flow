import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, MousePointerClick } from "lucide-react";

export const CampaignsPanel = () => {
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, autonomous_agents(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Marketing Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {campaigns?.map((campaign) => {
            const roi = campaign.revenue && campaign.spend ? 
              ((campaign.revenue - campaign.spend) / campaign.spend * 100) : 0;
            const ctr = campaign.impressions ? 
              (campaign.clicks / campaign.impressions * 100) : 0;
            
            return (
              <div key={campaign.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{campaign.campaign_name}</h4>
                    <p className="text-xs text-muted-foreground">{campaign.campaign_type}</p>
                  </div>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      Clicks
                    </p>
                    <p className="font-semibold">{campaign.clicks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-semibold text-green-600">{campaign.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spend</p>
                    <p className="font-semibold text-destructive">${campaign.spend?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      ROI
                    </p>
                    <p className={`font-semibold ${roi > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">CTR: {ctr.toFixed(2)}%</span>
                    <span className="text-xs text-muted-foreground">
                      Budget: ${campaign.daily_budget?.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={ctr} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};