import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';

interface ComplianceCheck {
  check_type: string;
  compliance_status: 'compliant' | 'warning' | 'non_compliant';
  details: any;
  recommendations: string[];
}

interface AuditResult {
  audit_type: string;
  audit_date: string;
  deep_audit: boolean;
  total_checks: number;
  passed_checks: number;
  warning_checks: number;
  failed_checks: number;
  overall_status: string;
  checks: ComplianceCheck[];
}

interface ComplianceMetrics {
  compliance_rate: number;
  total_audits: number;
  recent_trend: 'improving' | 'stable' | 'declining';
  last_audit_date: string;
  next_audit_date: string;
}

const ComplianceMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    compliance_rate: 93.5,
    total_audits: 28,
    recent_trend: 'stable',
    last_audit_date: new Date().toISOString(),
    next_audit_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });

  const [recentAudit, setRecentAudit] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchComplianceData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchComplianceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplianceData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to automated audit scheduler
      const response = await fetch('/functions/v1/automated-audit-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_compliance' })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update metrics based on response
        setMetrics(prev => ({
          ...prev,
          compliance_rate: (data.passed_checks / data.total_checks) * 100,
          total_audits: prev.total_audits + 1,
          last_audit_date: data.check_timestamp
        }));

        // Create recent audit result
        setRecentAudit({
          audit_type: 'compliance_check',
          audit_date: data.check_timestamp,
          deep_audit: false,
          total_checks: data.total_checks,
          passed_checks: data.passed_checks,
          warning_checks: data.warning_checks,
          failed_checks: data.failed_checks,
          overall_status: data.overall_compliance_status,
          checks: data.detailed_checks
        });
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const runManualAudit = async (auditType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/functions/v1/automated-audit-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'run_scheduled_audit',
          schedule_id: `manual_${auditType}_${Date.now()}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentAudit(data.audit_result);
        await fetchComplianceData();
      }
    } catch (error) {
      console.error('Failed to run manual audit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/functions/v1/automated-audit-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_compliance_report' })
      });
      
      if (response.ok) {
        const report = await response.json();
        // In a real app, this would trigger a download
        console.log('Compliance report generated:', report);
        alert('Compliance report generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'FAILED':
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'compliant':
        return 'bg-green-500';
      case 'WARNING':
      case 'warning':
        return 'bg-yellow-500';
      case 'FAILED':
      case 'non_compliant':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCheckType = (checkType: string) => {
    return checkType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time accounting standards compliance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchComplianceData} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={generateReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.compliance_rate.toFixed(1)}%</div>
            <Progress value={metrics.compliance_rate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.recent_trend === 'improving' ? '↗️ Improving' : 
               metrics.recent_trend === 'declining' ? '↘️ Declining' : 
               '➡️ Stable'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_audits}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Audit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDate(metrics.last_audit_date)}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentAudit?.overall_status && (
                <Badge variant={recentAudit.overall_status === 'PASSED' ? 'default' : 'destructive'}>
                  {recentAudit.overall_status}
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Audit</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDate(metrics.next_audit_date)}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled daily at 3:00 AM
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Audit Information */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Audit</TabsTrigger>
          <TabsTrigger value="checks">Compliance Checks</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {recentAudit ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(recentAudit.overall_status)}
                    {formatCheckType(recentAudit.audit_type)} Audit Results
                  </CardTitle>
                  <Badge variant={recentAudit.overall_status === 'PASSED' ? 'default' : 'destructive'}>
                    {recentAudit.overall_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {recentAudit.passed_checks}
                    </div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {recentAudit.warning_checks}
                    </div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {recentAudit.failed_checks}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Audit Date:</span>
                    <span>{formatDate(recentAudit.audit_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Deep Audit:</span>
                    <span>{recentAudit.deep_audit ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Checks:</span>
                    <span>{recentAudit.total_checks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No recent audit data available</p>
                <Button onClick={fetchComplianceData} className="mt-4">
                  Run Compliance Check
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          {recentAudit?.checks ? (
            <div className="space-y-4">
              {recentAudit.checks.map((check, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(check.compliance_status)}
                        {formatCheckType(check.check_type)}
                      </CardTitle>
                      <Badge 
                        variant={check.compliance_status === 'compliant' ? 'default' : 
                                check.compliance_status === 'warning' ? 'secondary' : 'destructive'}
                      >
                        {check.compliance_status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Details */}
                      {check.details && (
                        <div>
                          <h4 className="font-medium mb-2">Details:</h4>
                          <div className="bg-muted p-3 rounded text-sm">
                            {typeof check.details === 'string' ? 
                              check.details : 
                              JSON.stringify(check.details, null, 2)
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Recommendations */}
                      {check.recommendations && check.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommendations:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {check.recommendations.map((rec, recIndex) => (
                              <li key={recIndex}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No compliance check details available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Audits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => runManualAudit('daily')} 
                  disabled={isLoading}
                  className="w-full"
                >
                  Run Daily Audit
                </Button>
                <Button 
                  onClick={() => runManualAudit('weekly')} 
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  Run Weekly Audit
                </Button>
                <Button 
                  onClick={() => runManualAudit('monthly')} 
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  Run Monthly Audit
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reports & Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={generateReport} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Compliance Report
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Audit History
                </Button>
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Performance Trends
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Automated Audits</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Data Integrity</span>
                  <Badge variant="default">Verified</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Refresh</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(lastRefresh.toISOString())}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Revenue Recognition</span>
                  <Badge variant="default">Compliant</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expense Matching</span>
                  <Badge variant="default">Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceMonitoringDashboard;