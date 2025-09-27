import { BaseAgent, AgentTask } from './BaseAgent';
import { supabase } from '@/integrations/supabase/client';

interface MarketDataEntry {
  price: number;
  volume: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown>;
}

interface ArbitrageOpportunity {
  opportunity: string;
  potential: number;
  risk: number;
  platforms: string[];
  timestamp: Date;
}

interface MarketAgentConfig {
  id: string;
  name: string;
  capabilities?: string[];
  priority?: number;
  maxConcurrentTasks?: number;
  performanceThreshold?: number;
  riskTolerance?: number;
  [key: string]: unknown;
}

export class MarketAgent extends BaseAgent {
  private marketData: Map<string, MarketDataEntry> = new Map();
  private arbitrageOpportunities: ArbitrageOpportunity[] = [];

  constructor(config: MarketAgentConfig) {
    super({
      ...config,
      type: 'market',
      capabilities: ['market_analysis', 'trend_detection', 'arbitrage_detection', 'competitive_intelligence'],
      priority: config.priority || 5,
      maxConcurrentTasks: config.maxConcurrentTasks || 10,
      performanceThreshold: config.performanceThreshold || 0.8,
      riskTolerance: config.riskTolerance || 0.5,
    });
  }

  async executeTask(task: AgentTask): Promise<Record<string, unknown>> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'analyze_market_trends':
          return await this.analyzeMarketTrends(task.payload);

        case 'detect_arbitrage_opportunities':
          return await this.detectArbitrageOpportunities(task.payload);

        case 'competitive_intelligence':
          return await this.gatherCompetitiveIntelligence(task.payload);

        case 'predict_market_changes':
          return await this.predictMarketChanges(task.payload);

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      console.error(`MarketAgent task failed:`, error);
      throw error;
    } finally {
      const executionTime = Date.now() - startTime;
      this.completeTask(task.id, true, executionTime, 0);
    }
  }

  canHandleTask(task: AgentTask): boolean {
    return ['analyze_market_trends', 'detect_arbitrage_opportunities', 'competitive_intelligence', 'predict_market_changes'].includes(task.type);
  }

  getSpecializedCapabilities(): string[] {
    return ['Real-time market analysis', 'Arbitrage opportunity detection', 'Competitive intelligence gathering', 'Market trend prediction'];
  }

  private async analyzeMarketTrends(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { data: offers } = await supabase
        .from('market_offers')
        .select('*')
        .order('performance_score', { ascending: false })
        .limit(50);

      const trends = {
        topPerformingCategories: this.identifyTopCategories(offers || []),
        emergingOpportunities: this.findEmergingOpportunities(offers || []),
        marketVolatility: this.calculateMarketVolatility(offers || []),
        recommendedActions: this.generateRecommendations(offers || [])
      };

      return {
        success: true,
        trends,
        analyzed_offers: offers?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing market trends:', error);
      throw error;
    }
  }

  private async detectArbitrageOpportunities(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      // Mock arbitrage detection - in real implementation this would analyze multiple platforms
      const opportunities = [
        {
          opportunity: 'Cross-platform price difference',
          potential: 0.15,
          risk: 0.05,
          platforms: ['Platform A', 'Platform B'],
          timestamp: new Date()
        }
      ];

      this.arbitrageOpportunities.push(...opportunities);
      
      return {
        success: true,
        opportunities,
        total_opportunities: opportunities.length
      };
    } catch (error) {
      console.error('Error detecting arbitrage opportunities:', error);
      throw error;
    }
  }

  private async gatherCompetitiveIntelligence(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      // Mock competitive intelligence gathering
      const intelligence = {
        competitors: ['Competitor A', 'Competitor B'],
        market_share_analysis: {
          our_share: 0.12,
          top_competitor_share: 0.25,
          market_growth: 0.08
        },
        pricing_strategies: ['Premium positioning', 'Volume based'],
        recommendations: ['Increase market presence', 'Optimize pricing']
      };

      return {
        success: true,
        intelligence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error gathering competitive intelligence:', error);
      throw error;
    }
  }

  private async predictMarketChanges(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      // Mock market prediction
      const predictions = {
        short_term: { direction: 'up', confidence: 0.75, timeframe: '1-7 days' },
        medium_term: { direction: 'stable', confidence: 0.65, timeframe: '1-4 weeks' },
        long_term: { direction: 'up', confidence: 0.55, timeframe: '1-6 months' }
      };

      return {
        success: true,
        predictions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error predicting market changes:', error);
      throw error;
    }
  }

  private identifyTopCategories(offers: Record<string, unknown>[]): Record<string, unknown>[] {
    const categoryPerformance = new Map();
    offers.forEach(offer => {
      const category = offer.category || 'general';
      if (!categoryPerformance.has(category)) {
        categoryPerformance.set(category, { count: 0, totalScore: 0 });
      }
      const cat = categoryPerformance.get(category);
      cat.count++;
      cat.totalScore += offer.performance_score || 0;
    });

    return Array.from(categoryPerformance.entries())
      .map(([category, data]) => ({
        category,
        avgScore: data.totalScore / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }

  private findEmergingOpportunities(offers: Record<string, unknown>[]): Record<string, unknown>[] {
    // Mock emerging opportunities detection
    return offers
      .filter(offer => offer.performance_score > 0.8)
      .slice(0, 3)
      .map(offer => ({
        title: offer.title,
        score: offer.performance_score,
        category: offer.category,
        potential: 'High'
      }));
  }

  private calculateMarketVolatility(offers: Record<string, unknown>[]): number {
    if (offers.length === 0) return 0;
    const scores = offers.map(o => o.performance_score || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  private generateRecommendations(offers: Record<string, unknown>[]): string[] {
    const recommendations = [];
    const topOffers = offers.slice(0, 5);
    
    if (topOffers.length > 0) {
      recommendations.push(`Focus on ${topOffers[0].category} category - highest performance`);
    }
    
    if (offers.length > 10) {
      recommendations.push('Diversify portfolio across multiple high-performing offers');
    }
    
    recommendations.push('Monitor market volatility for optimization opportunities');
    
    return recommendations;
  }
}
