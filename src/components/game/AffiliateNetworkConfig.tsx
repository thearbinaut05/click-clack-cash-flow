import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import RealAffiliateNetworkService from '@/services/RealAffiliateNetworkService';
import { toast } from '@/hooks/use-toast';

export const AffiliateNetworkConfig: React.FC = () => {
  const [apiKeys, setApiKeys] = useState({
    cpalead: '',
    ogads: '',
    adscend: '',
    cpagrip: '',
    offertoro: ''
  });
  
  const [showKeys, setShowKeys] = useState({
    cpalead: false,
    ogads: false,
    adscend: false,
    cpagrip: false,
    offertoro: false
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const affiliateService = RealAffiliateNetworkService.getInstance();

  useEffect(() => {
    // Load saved API keys from localStorage
    const storedKeys = localStorage.getItem('affiliate_api_keys');
    if (storedKeys) {
      try {
        const keys = JSON.parse(storedKeys);
        setApiKeys(prev => ({ ...prev, ...keys }));
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    }
  }, []);

  const handleSaveApiKey = (network: string) => {
    const key = apiKeys[network as keyof typeof apiKeys];
    if (!key) {
      toast({
        title: 'Error',
        description: `Please enter an API key for ${network}`,
        variant: 'destructive',
      });
      return;
    }

    affiliateService.setApiKey(network, key);
    
    toast({
      title: 'API Key Saved',
      description: `${network} API key has been configured successfully`,
      variant: 'default',
    });
  };

  const handleInputChange = (network: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [network]: value
    }));
  };

  const toggleShowKey = (network: string) => {
    setShowKeys(prev => ({
      ...prev,
      [network]: !prev[network as keyof typeof showKeys]
    }));
  };

  const networks = [
    { 
      id: 'cpalead', 
      name: 'CPALead', 
      url: 'https://cpalead.com',
      description: 'High-paying CPA offers with instant approval',
      hasKey: !!apiKeys.cpalead
    },
    { 
      id: 'ogads', 
      name: 'OGAds', 
      url: 'https://ogads.com',
      description: 'Content locking and CPA offers',
      hasKey: !!apiKeys.ogads
    },
    { 
      id: 'adscend', 
      name: 'AdscendMedia', 
      url: 'https://adscendmedia.com',
      description: 'Premium offer wall with high payouts',
      hasKey: !!apiKeys.adscend
    },
    { 
      id: 'cpagrip', 
      name: 'CPAGrip', 
      url: 'https://cpagrip.com',
      description: 'Diverse CPA offers with good fill rates',
      hasKey: !!apiKeys.cpagrip
    },
    { 
      id: 'offertoro', 
      name: 'OfferToro', 
      url: 'https://offertoro.com',
      description: 'Survey and mobile offer specialist',
      hasKey: !!apiKeys.offertoro
    }
  ];

  if (!isExpanded) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsExpanded(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Affiliate Networks (Optional)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Affiliate Network Configuration
            </CardTitle>
            <CardDescription>
              Configure API keys to enable real CPA/CPL/PPC offers and earn actual money
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Minimize
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>📘 How it works:</strong> Add your affiliate network API keys to fetch real offers. 
            Users complete offers and earn real money that can be cashed out via PayPal/Payoneer.
          </p>
        </div>

        <div className="space-y-4">
          {networks.map(network => (
            <div key={network.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{network.name}</h3>
                    {network.hasKey ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{network.description}</p>
                  <a 
                    href={network.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Sign up at {network.url}
                  </a>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`${network.id}-key`}>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`${network.id}-key`}
                      type={showKeys[network.id as keyof typeof showKeys] ? 'text' : 'password'}
                      value={apiKeys[network.id as keyof typeof apiKeys]}
                      onChange={(e) => handleInputChange(network.id, e.target.value)}
                      placeholder={`Enter ${network.name} API key`}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(network.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys[network.id as keyof typeof showKeys] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button 
                    onClick={() => handleSaveApiKey(network.id)}
                    disabled={!apiKeys[network.id as keyof typeof apiKeys]}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-300">
            <strong>⚠️ Note:</strong> Without API keys, the system will show demo offers. 
            Configure at least one network to enable real earnings and payouts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateNetworkConfig;
