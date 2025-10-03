import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, DollarSign, Clock, AlertCircle } from 'lucide-react';
import RealAffiliateNetworkService, { AffiliateOffer } from '@/services/RealAffiliateNetworkService';
import { toast } from '@/hooks/use-toast';

interface OfferWallProps {
  userId: string;
  onConversionComplete?: (payout: number) => void;
}

export const OfferWall: React.FC<OfferWallProps> = ({ userId, onConversionComplete }) => {
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableBalance, setAvailableBalance] = useState(0);
  const affiliateService = RealAffiliateNetworkService.getInstance();

  useEffect(() => {
    loadOffers();
    loadBalance();
    
    // Sync conversions every 5 minutes
    const syncInterval = setInterval(() => {
      affiliateService.syncConversions().then(() => {
        loadBalance();
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [userId]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const fetchedOffers = await affiliateService.fetchAvailableOffers(userId);
      setOffers(fetchedOffers);
    } catch (error) {
      console.error('Failed to load offers:', error);
      toast({
        title: 'Failed to Load Offers',
        description: 'Could not fetch available offers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = () => {
    const balance = affiliateService.getAvailableBalance(userId);
    setAvailableBalance(balance);
  };

  const handleOfferClick = (offer: AffiliateOffer) => {
    // Open offer in new window
    window.open(offer.url, '_blank', 'width=800,height=600');
    
    // Track that user clicked the offer
    toast({
      title: 'Offer Opened',
      description: `Complete the requirements to earn $${offer.payout.toFixed(2)}`,
      variant: 'default',
    });

    // Simulate conversion tracking (in real scenario, this comes via postback URL)
    // For demo, we track after a delay
    setTimeout(async () => {
      try {
        const conversion = await affiliateService.trackConversion(
          offer.id,
          userId,
          offer.payout
        );
        
        toast({
          title: '🎉 Conversion Tracked!',
          description: `$${offer.payout.toFixed(2)} pending approval`,
          variant: 'default',
        });

        if (onConversionComplete) {
          onConversionComplete(offer.payout);
        }

        loadBalance();
      } catch (error) {
        console.error('Failed to track conversion:', error);
      }
    }, 30000); // 30 seconds demo delay
  };

  const categories = ['all', 'survey', 'gaming', 'app', 'finance', 'email'];
  
  const filteredOffers = selectedCategory === 'all' 
    ? offers 
    : offers.filter(o => o.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cpa': return 'bg-blue-500';
      case 'cpl': return 'bg-purple-500';
      case 'ppc': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>💰 Offer Wall - Earn Real Money</span>
            <Badge variant="outline" className="text-lg">
              <DollarSign className="w-4 h-4 mr-1" />
              ${availableBalance.toFixed(2)} Available
            </Badge>
          </CardTitle>
          <CardDescription>
            Complete offers to earn real money. Approved earnings can be cashed out via PayPal or Payoneer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          {/* Offers Grid */}
          {loading ? (
            <div className="text-center py-8">Loading offers...</div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p>No offers available in this category</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredOffers.map(offer => (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {offer.icon && <span className="text-2xl">{offer.icon}</span>}
                        <CardTitle className="text-lg">{offer.name}</CardTitle>
                      </div>
                      <Badge className="bg-green-600">
                        ${offer.payout.toFixed(2)}
                      </Badge>
                    </div>
                    <CardDescription>{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getTypeColor(offer.type)}>
                        {offer.type.toUpperCase()}
                      </Badge>
                      <Badge className={getDifficultyColor(offer.difficulty)}>
                        {offer.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {offer.estimatedTime}
                      </Badge>
                      <Badge variant="outline">{offer.network}</Badge>
                    </div>

                    {/* Requirements */}
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Requirements:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {offer.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full"
                      onClick={() => handleOfferClick(offer)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Start Offer
                    </Button>

                    {/* Countries */}
                    <p className="text-xs text-muted-foreground text-center">
                      Available in: {offer.countries.join(', ')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferWall;
