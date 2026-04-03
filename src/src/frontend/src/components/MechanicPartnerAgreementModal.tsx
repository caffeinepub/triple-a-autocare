import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  onClose: () => void;
}

export default function MechanicPartnerAgreementModal({ onClose }: Props) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 70 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        className="fixed left-0 right-0 bottom-0 bg-background rounded-t-3xl flex flex-col"
        style={{ zIndex: 71, maxHeight: "90vh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Mechanic Partner Agreement
            </h2>
          </div>
          <button
            type="button"
            data-ocid="mechanic_agreement.close_button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-card flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Title block */}
          <div className="mb-6">
            <h3 className="text-base font-extrabold text-foreground mb-1">
              TRIPLE A – Mechanic Partner Agreement
            </h3>
            <p className="text-xs text-muted-foreground">
              Effective Date: 30th March 2026
            </p>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            By registering as a mechanic on TRIPLE A, you agree to the
            following:
          </p>

          {/* Section 1 */}
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2">
              1. Independent Contractor Status
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are an independent contractor and not an employee of TRIPLE A.
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2">
              2. Responsibilities
            </h4>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              You are solely responsible for:
            </p>
            <ul className="flex flex-col gap-1.5 pl-2">
              {[
                "Quality of your work",
                "Tools and equipment",
                "Any damage or loss caused",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2">
              3. Professional Conduct
            </h4>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              You agree to:
            </p>
            <ul className="flex flex-col gap-1.5 pl-2">
              {[
                "Provide honest and transparent pricing",
                "Treat customers respectfully",
                "Deliver services professionally",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4 */}
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2">
              4. Liability
            </h4>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              TRIPLE A shall not be liable for:
            </p>
            <ul className="flex flex-col gap-1.5 pl-2">
              {[
                "Your actions or omissions",
                "Customer complaints or disputes",
                "Any damages arising from your services",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5 */}
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2">
              5. Ratings and Performance
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your access to the Platform may depend on user ratings and
              performance.
            </p>
          </div>

          {/* Section 6 */}
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2">
              6. Suspension or Termination
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TRIPLE A reserves the right to suspend or remove you at its
              discretion.
            </p>
          </div>

          {/* Section 7 */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-foreground mb-2">
              7. Compliance
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree to comply with all applicable laws and regulations.
            </p>
          </div>

          {/* Final quote */}
          <div className="mt-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground italic font-medium text-center leading-relaxed">
              &ldquo;By continuing on the Platform, you accept this
              Agreement.&rdquo;
            </p>
          </div>

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 safe-area-pb">
          <button
            type="button"
            data-ocid="mechanic_agreement.confirm_button"
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center shadow-yellow active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
