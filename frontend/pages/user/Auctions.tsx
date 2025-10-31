import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuctionCard from "@/components/shared/AuctionCard";
import { mockAuctions } from "@/lib/mock-data";

export default function AuctionsPage() {
  const [activeTab, setActiveTab] = useState("live");

  const liveAuctions = mockAuctions.filter((a) => a.status === "live");
  const endedAuctions = mockAuctions.filter((a) => a.status === "ended");

  const displayAuctions = activeTab === "live" ? liveAuctions : endedAuctions;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Auctions</h1>
          <p className="text-lg text-muted-foreground">Bid on exclusive deals and get amazing discounts</p>
        </div>

        {/* Auction Types Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-semibold mb-2">🏛️ English Auction</h3>
            <p className="text-sm text-muted-foreground">Highest bid wins. Price increases with each bid.</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-semibold mb-2">🌷 Dutch Auction</h3>
            <p className="text-sm text-muted-foreground">Price starts high and decreases over time.</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-semibold mb-2">🔒 Sealed Bid</h3>
            <p className="text-sm text-muted-foreground">Submit your bid privately. Highest bid wins.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-8">
          {["live", "ended"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "live" ? "Live Auctions" : "Ended"}
            </button>
          ))}
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>

        {displayAuctions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔨</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
            <p className="text-muted-foreground">
              {activeTab === "live" ? "Check back soon for new live auctions" : "No ended auctions yet"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
