'use client';

import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, QrCode } from 'lucide-react';
import { useState } from 'react';

export default function WalletPage() {
  const [balance] = useState('0.00');
  const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';

  const transactions = [
    { id: 1, type: 'sent', amount: '0.5', to: '0xabc...def', date: '2 hours ago' },
    { id: 2, type: 'received', amount: '1.2', from: '0x123...456', date: '1 day ago' },
  ];

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Wallet</h2>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Total Balance</p>
          <h3 className="text-4xl font-bold mb-4">{balance} ETH</h3>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>Address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Copy address"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center p-6 border border-border rounded-xl hover:bg-accent transition-colors">
            <div className="p-3 rounded-full bg-green-500/10 mb-3">
              <ArrowDownLeft className="w-6 h-6 text-green-500" />
            </div>
            <span className="font-medium text-foreground">Receive</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border border-border rounded-xl hover:bg-accent transition-colors">
            <div className="p-3 rounded-full bg-blue-500/10 mb-3">
              <ArrowUpRight className="w-6 h-6 text-blue-500" />
            </div>
            <span className="font-medium text-foreground">Send</span>
          </button>
        </div>

        {/* QR Code Button */}
        <button className="w-full flex items-center justify-center gap-2 p-4 border border-border rounded-xl hover:bg-accent transition-colors">
          <QrCode className="w-5 h-5 text-foreground" />
          <span className="font-medium text-foreground">Show QR Code</span>
        </button>

        {/* Transactions */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      tx.type === 'sent' ? 'bg-red-500/10' : 'bg-green-500/10'
                    }`}
                  >
                    {tx.type === 'sent' ? (
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {tx.type === 'sent' ? 'Sent' : 'Received'} {tx.amount} ETH
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.type === 'sent' ? `To: ${tx.to}` : `From: ${tx.from}`}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{tx.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
