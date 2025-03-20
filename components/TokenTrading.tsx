"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { transfer, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

export default function TokenTrading({ mintAddress }: { mintAddress: string }) {
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState(0);
  const [marketCap, setMarketCap] = useState(0);
  const [loading, setLoading] = useState(false);

  const COMPANY_WALLET = new PublicKey("5JVeU3NiPx21wkB6NTw69c96RA7zxe3tAhGeRLqtXp5W");
  const CREATOR_WALLET = publicKey!;

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const mint = new PublicKey(mintAddress);

  const calculatePrice = (amount: number, totalBought: number) => {
    const basePrice = 0.000000000000001;
    const supplyFactor = totalBought / 1_000_000_000_000_000;
    return basePrice * (1 + supplyFactor) * amount;
  };

  const handleBuy = async () => {
    if (!publicKey) {
      alert("Connect your wallet!");
      return;
    }

    setLoading(true);
    const tokensToBuy = amount * 10 ** 6;
    const totalBought = marketCap + tokensToBuy;
    const totalCost = calculatePrice(tokensToBuy, totalBought) * LAMPORTS_PER_SOL;
    const companyFee = totalCost * 0.04;
    const creatorFee = totalCost * 0.01;
    const netAmount = totalCost - companyFee - creatorFee;

    try {
      const buyerATA = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, publicKey);
      const creatorATA = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, CREATOR_WALLET);
      const companyATA = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, COMPANY_WALLET);

      const transaction = new Transaction()
        .add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: COMPANY_WALLET,
            lamports: companyFee,
          }),
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: CREATOR_WALLET,
            lamports: creatorFee,
          }),
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: CREATOR_WALLET,
            lamports: netAmount,
          })
        )
        .add(
          transfer(
            connection,
            publicKey,
            creatorATA.address,
            buyerATA.address,
            CREATOR_WALLET,
            tokensToBuy
          )
        );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const newMarketCap = totalBought * calculatePrice(1, totalBought) * LAMPORTS_PER_SOL;
      setMarketCap(totalBought);

      if (newMarketCap >= 50_000 * LAMPORTS_PER_SOL) {
        alert("Token has reached $50K market cap! Graduating to Raydium (mocked).");
      } else {
        alert(`Bought ${amount} tokens! Signature: ${signature}`);
      }
    } catch (error) {
      console.error("Buy failed:", error);
      alert(`Buy failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg mt-4">
      <h3 className="text-xl font-bold mb-4 text-white">Trade Token</h3>
      <Input
        type="number"
        placeholder="Amount to Buy"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        className="mb-4 bg-gray-700 text-white border-none"
      />
      <Button onClick={handleBuy} disabled={!publicKey || loading}>
        {loading ? "Buying..." : "Buy Tokens"}
      </Button>
      <p className="mt-2 text-white">Market Cap: {(marketCap * calculatePrice(1, marketCap)).toFixed(6)} SOL</p>
    </div>
  );
}
