import { BadgeCheck, Loader2, ShoppingBag, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useParts } from "../hooks/useQueries";

function formatNGN(amount: bigint): string {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export default function MarketplaceTab() {
  const { data: parts, isLoading } = useParts();
  const [cartCount, setCartCount] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddToCart = (id: string, name: string) => {
    setCartCount((c) => c + 1);
    setAddedIds((prev) => new Set([...prev, id]));
    toast.success(`${name} added to cart!`);
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground text-sm">
              Quality parts, trusted sellers
            </p>
          </div>
          <button
            type="button"
            data-ocid="marketplace.cart.button"
            className="relative w-11 h-11 rounded-full bg-secondary flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-5 pb-6">
        {isLoading ? (
          <div
            data-ocid="marketplace.loading_state"
            className="flex justify-center py-20"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !parts?.length ? (
          <div
            data-ocid="marketplace.empty_state"
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">No parts available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {parts.map((part, i) => (
              <motion.div
                key={part.id}
                data-ocid={`marketplace.item.${i + 1}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl p-3.5 border border-border flex flex-col gap-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                    {part.name}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 capitalize">
                    {part.category}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-primary font-bold text-base">
                    {formatNGN(part.priceNGN)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px] truncate">
                      {part.sellerName}
                    </span>
                    {part.isVerifiedSeller && (
                      <BadgeCheck
                        data-ocid={`marketplace.verified.${i + 1}`}
                        className="w-3.5 h-3.5 text-green-400 shrink-0"
                      />
                    )}
                  </div>
                  {!part.inStock && (
                    <span className="text-[10px] text-red-400">
                      Out of stock
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid={`marketplace.add_to_cart.button.${i + 1}`}
                  onClick={() => handleAddToCart(part.id, part.name)}
                  disabled={!part.inStock || addedIds.has(part.id)}
                  className={`w-full h-9 rounded-xl font-semibold text-xs transition-all active:scale-[0.97] ${
                    addedIds.has(part.id)
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-primary text-primary-foreground"
                  } disabled:opacity-50`}
                >
                  {addedIds.has(part.id) ? "Added ✓" : "Add to Cart"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
