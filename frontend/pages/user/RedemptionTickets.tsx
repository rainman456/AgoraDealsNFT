import { useState } from 'react';
import { QrCode, Clock, MapPin, CheckCircle, XCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RedemptionTicket {
  id: string;
  couponTitle: string;
  merchantName: string;
  ticketHash: string;
  expiresAt: string;
  status: 'active' | 'consumed' | 'expired' | 'cancelled';
  qrCode: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  generatedAt: string;
  consumedAt?: string;
}

const mockTickets: RedemptionTicket[] = [
  {
    id: '1',
    couponTitle: '50% Off Pizza',
    merchantName: "Joe's Pizza",
    ticketHash: 'a1b2c3d4e5f6',
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    status: 'active',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSI4MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48cmVjdCB4PSIxMjAiIHk9IjQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9ImJsYWNrIi8+PC9zdmc+',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY'
    },
    generatedAt: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: '2',
    couponTitle: '30% Off Coffee',
    merchantName: 'Coffee House',
    ticketHash: 'f6e5d4c3b2a1',
    expiresAt: new Date(Date.now() - 10000).toISOString(),
    status: 'expired',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI2MCIgeT0iNjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=',
    location: {
      latitude: 40.7580,
      longitude: -73.9855,
      address: '456 Park Ave, New York, NY'
    },
    generatedAt: new Date(Date.now() - 400000).toISOString()
  },
  {
    id: '3',
    couponTitle: '20% Off Spa Treatment',
    merchantName: 'Luxury Spa',
    ticketHash: '1a2b3c4d5e6f',
    expiresAt: new Date(Date.now() - 200000).toISOString(),
    status: 'consumed',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=',
    location: {
      latitude: 40.7489,
      longitude: -73.9680,
      address: '789 Wellness Blvd, New York, NY'
    },
    generatedAt: new Date(Date.now() - 500000).toISOString(),
    consumedAt: new Date(Date.now() - 300000).toISOString()
  }
];

export default function RedemptionTickets() {
  const [selectedTicket, setSelectedTicket] = useState<RedemptionTicket | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'consumed' | 'expired'>('all');

  const filteredTickets = mockTickets.filter(ticket => 
    filter === 'all' || ticket.status === filter
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      consumed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return variants[status as keyof typeof variants];
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">Redemption Tickets</h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Manage your time-limited redemption tickets
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'active', 'consumed', 'expired'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{ticket.couponTitle}</h3>
                </div>
                <Badge className={getStatusBadge(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{ticket.merchantName}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {ticket.status === 'active' 
                      ? `Expires in ${getTimeRemaining(ticket.expiresAt)}`
                      : `Expired ${new Date(ticket.expiresAt).toLocaleString()}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{ticket.location.address}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setSelectedTicket(ticket)}
                disabled={ticket.status !== 'active'}
              >
                {ticket.status === 'active' ? 'View QR Code' : 'View Details'}
              </Button>
            </Card>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Generate a ticket from your coupons to get started'
                : `No ${filter} tickets available`
              }
            </p>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.couponTitle}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                <img 
                  src={selectedTicket.qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>

              {/* Ticket Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusBadge(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ticket Hash</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {selectedTicket.ticketHash}
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Merchant</span>
                  <span className="text-sm font-medium">{selectedTicket.merchantName}</span>
                </div>

                {selectedTicket.status === 'active' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Remaining</span>
                    <span className="text-sm font-medium text-green-600">
                      {getTimeRemaining(selectedTicket.expiresAt)}
                    </span>
                  </div>
                )}

                {selectedTicket.consumedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Redeemed At</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedTicket.consumedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedTicket.status === 'active' && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Cancel Ticket
                  </Button>
                  <Button className="flex-1">
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
