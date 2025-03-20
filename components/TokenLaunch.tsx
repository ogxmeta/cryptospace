"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

export default function TokenLaunch({ onTokenCreated }: { onTokenCreated?: (mint: string) => void }) {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [funding, setFunding] = useState(0);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const COMPANY_WALLET = new PublicKey("5JVeU3NiPx21wkB6NTw69c96RA7zxe3tAhGeRLqtXp5W");

  const handleLaunch = async () => {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet first!");
      return;
    }

    setLoading(true);
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    try {
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint,
          space: 82, // SPL token mint size
          lamports: await connection.getMinimumBalanceForRentExemption(82),
          programId: TOKEN_PROGRAM_ID,
        }),
        createMint(
          connection,
          publicKey,
          mint,
          publicKey,
          null,
          6
        )
      );

      const signature = await sendTransaction(transaction, connection, { signers: [mintKeypair] });
      await connection.confirmTransaction(signature, "confirmed");

      const creatorATA = await getOrCreateAssociatedTokenAccount(connection, publicKey, mint, publicKey);
      await mintTo(
        connection,
        publicKey,
        mint,
        creatorATA.address,
        publicKey,
        BigInt(1_000_000_000_000_000) * BigInt(10 ** 6)
      );

      const fundingTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: COMPANY_WALLET,
          lamports: funding * LAMPORTS_PER_SOL,
        })
      );
      const fundingSig = await sendTransaction(fundingTx, connection);
      await connection.confirmTransaction(fundingSig, "confirmed");

      setMintAddress(mint.toBase58());
      if (onTokenCreated) onTokenCreated(mint.toBase58());
      alert(`Token ${tokenName} (${tokenSymbol}) launched! Mint: ${mint.toBase58()}`);
    } catch (error) {
      console.error("Launch failed:", error);
      alert(`Launch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Launch a Meme Coin</h3>
      <Input
        placeholder="Token Name"
        value={tokenName}
        onChange={(e) => setTokenName(e.target.value)}
        className="mb-4 bg-gray-700 text-white border-none"
      />
      <Input
        placeholder="Token Symbol"
        value={tokenSymbol}
        onChange={(e) => setTokenSymbol(e.target.value)}
        className="mb-4 bg-gray-700 text-white border-none"
      />
      <Input
        type="number"
        placeholder="Funding Goal (SOL)"
        value={funding}
        onChange={(e) => setFunding(parseFloat(e.target.value) || 0)}
        className="mb-4 bg-gray-700 text-white border-none"
      />
      <Button onClick={handleLaunch} disabled={!publicKey || loading}>
        {loading ? "Launching..." : "Launch Token"}
      </Button>
      {mintAddress && <p className="mt-2 text-white">Mint Address: {mintAddress}</p>}
    </div>
  );
}
