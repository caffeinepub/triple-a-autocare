import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddReview } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  mechanicId: string;
  mechanicName: string;
  bookingId: string;
}

export default function ReviewModal({
  open,
  onClose,
  mechanicId,
  mechanicName,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const addReview = useAddReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await addReview.mutateAsync({
        mechanicId,
        rating: BigInt(rating),
        text: reviewText,
      });
      toast.success("Review submitted!");
      onClose();
    } catch {
      toast.error("Failed to submit review");
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="review.dialog"
        className="bg-card border-border rounded-3xl max-w-[90vw] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            Rate {mechanicName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  data-ocid={`review.star.${s}`}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      s <= displayRating
                        ? "fill-primary text-primary"
                        : "fill-secondary text-secondary"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              {displayRating === 0
                ? "Tap to rate"
                : ["Terrible", "Bad", "Okay", "Good", "Excellent!"][
                    displayRating - 1
                  ]}
            </p>
          </div>

          <textarea
            data-ocid="review.textarea"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell us about your experience..."
            rows={4}
            className="w-full bg-secondary border border-border rounded-2xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />

          <button
            data-ocid="review.submit_button"
            type="submit"
            disabled={addReview.isPending || rating === 0}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 shadow-yellow"
          >
            {addReview.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            {addReview.isPending ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
