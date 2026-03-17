"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "~/context/cart-context";

export function CartIcon() {
  const { cartItems } = useCart();
  const count = cartItems.length;

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#3c4f3d] text-white shadow-lg transition-colors hover:bg-[#3c4f3d]/90"
      aria-label={`Triage Cart — ${count} variant${count !== 1 ? "s" : ""}`}
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
