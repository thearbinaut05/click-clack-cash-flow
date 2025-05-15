
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgePercent, BadgeDollarSign, MousePointerClick } from 'lucide-react';

const upgrades = [
  {
    id: 'click-power-1',
    name: 'Stronger Tap',
    description: '+1 coin per tap',
    cost: 50,
    costType: 'coins' as const,
    effect: 'clickPower' as const,
    value: 1,
  },
  {
    id: 'multiplier-1',
    name: 'Coin Multiplier',
    description: '+0.2x coin multiplier',
    cost: 100,
    costType: 'coins' as const,
    effect: 'multiplier' as const,
    value: 0.2,
  },
  {
    id: 'energy-1',
    name: 'Energy Boost',
    description: '+20 energy',
    cost: 75,
    costType: 'coins' as const,
    effect: 'energy' as const,
    value: 20,
  },
  {
    id: 'click-power-premium',
    name: 'Premium Tap',
    description: '+5 coins per tap',
    cost: 3,
    costType: 'gems' as const,
    effect: 'clickPower' as const,
    value: 5,
  },
];

const ShopSection: React.FC = () => {
  const { buyUpgrade, coins, gems, nftItems, selectNFT, selectedNFT } = useGame();
  const [activeTab, setActiveTab] = useState('upgrades');
  
  return (
    <div className="game-card p-4 mt-4">
      <h2 className="font-bold text-xl text-white mb-4">Marketplace</h2>
      
      <Tabs defaultValue="upgrades" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="upgrades" className="data-[state=active]:bg-game-orange">Upgrades</TabsTrigger>
          <TabsTrigger value="nfts" className="data-[state=active]:bg-game-purple">NFT Collection</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upgrades" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upgrades.map(upgrade => (
              <div 
                key={upgrade.id} 
                className="bg-black/20 rounded-lg p-3 cursor-pointer hover:bg-black/30 transition-colors"
                onClick={() => buyUpgrade(upgrade)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white">{upgrade.name}</h3>
                  <div className="flex items-center text-sm">
                    <span className="mr-1">{upgrade.cost}</span>
                    {upgrade.costType === 'coins' ? (
                      <BadgeDollarSign className="w-4 h-4 text-game-yellow" />
                    ) : (
                      <span className="text-game-teal">💎</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{upgrade.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="nfts" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nftItems.map(nft => {
              const isSelected = selectedNFT?.id === nft.id;
              const rarityColors = {
                common: 'bg-gray-500',
                rare: 'bg-game-teal',
                epic: 'bg-game-purple',
                legendary: 'bg-gradient-to-r from-game-yellow to-game-orange',
              };
              
              return (
                <div 
                  key={nft.id} 
                  className={`${rarityColors[nft.rarity]} rounded-lg p-3 cursor-pointer transition-all
                             ${isSelected ? 'ring-2 ring-white' : 'hover:brightness-110'}`}
                  onClick={() => selectNFT(nft)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white">{nft.name}</h3>
                      <span className="text-xs text-white/90 capitalize">{nft.rarity}</span>
                    </div>
                    {!nft.owned && (
                      <div className="flex items-center text-sm">
                        <span className="mr-1">{nft.price}</span>
                        <BadgeDollarSign className="w-4 h-4 text-game-yellow" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center">
                      <BadgePercent className="w-4 h-4 text-white mr-1" />
                      <span className="text-white text-sm">+{Math.round((nft.multiplier - 1) * 100)}% coins</span>
                    </div>
                    <div className="text-xs bg-black/30 rounded px-2 py-1 text-white">
                      {nft.owned ? (isSelected ? 'ACTIVE' : 'OWNED') : 'BUY NFT'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopSection;
