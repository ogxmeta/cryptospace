"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Bitcoin, MessageSquare, Star, TrendingUp } from "lucide-react";
import TokenLaunch from "../components/TokenLaunch";
import TokenTrading from "../components/TokenTrading";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function CryptoSocial() {
  const { data: session } = useSession();
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="hidden md:flex w-64 flex-col border-r p-4">
        <div className="flex items-center gap-2 mb-6">
          <Bitcoin className="h-8 w-8 text-yellow-500" />
          <h1 className="text-xl font-bold">CryptoSpace Arena</h1>
        </div>
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <TrendingUp className="mr-2 h-4 w-4" />
            Feed
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <MessageSquare className="mr-2 h-4 w-4" />
            Spaces
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/launch">
              <Star className="mr-2 h-4 w-4" />
              Launch Token
            </a>
          </Button>
          {!session ? (
            <Button onClick={() => signIn("twitter")}>Login with X</Button>
          ) : (
            <Button onClick={() => signOut()}>Logout {session.user?.name}</Button>
          )}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <div className="sticky top-0 bg-gray-900/95 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Home</h2>
          <WalletMultiButton className="ml-4" />
        </div>
        <div className="mt-4">
          <Input placeholder="What’s on your mind?" className="bg-gray-800 border-none text-white" />
          <Button className="mt-2">Post</Button>
        </div>
        {selectedMint && <TokenTrading mintAddress={selectedMint} />}
      </main>
      <aside className="hidden lg:block w-80 p-4">
        <TokenLaunch onTokenCreated={setSelectedMint} />
      </aside>
    </div>
  );
}
