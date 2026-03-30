import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onBack: () => void;
}

const sections = [
  {
    title: "1. Nature of Service",
    content:
      "TRIPLE A is a technology platform that connects users with independent third-party mechanics.",
    extra:
      "TRIPLE A does not provide mechanical or repair services and is not responsible for the execution of any service.",
  },
  {
    title: "2. Independent Contractors",
    content:
      "All mechanics on the Platform are independent contractors and are not employees, agents, or representatives of TRIPLE A.",
  },
  {
    title: "3. Limitation of Liability",
    content:
      "To the fullest extent permitted by law, TRIPLE A shall not be liable for:",
    bullets: [
      "Any damage to vehicles",
      "Poor workmanship or negligence",
      "Personal injury or loss arising from services",
      "Any dispute between users and mechanics",
    ],
    extra: "All services are engaged at the user's sole risk.",
  },
  {
    title: "4. User Obligations",
    content: "Users agree to:",
    bullets: [
      "Provide accurate information",
      "Confirm service details before work begins",
      "Ensure a safe environment for service",
    ],
  },
  {
    title: "5. Payments",
    content:
      "TRIPLE A may facilitate payments but is not responsible for disputes arising from transactions between users and mechanics.",
  },
  {
    title: "6. Location Services",
    content:
      "Location data provided by the Platform may not be precise. Users must confirm their exact location before requesting services.",
  },
  {
    title: "7. Account Suspension",
    content:
      "TRIPLE A reserves the right to suspend or terminate accounts involved in fraud, abuse, or violation of these Terms.",
  },
  {
    title: "8. Modifications",
    content:
      "TRIPLE A reserves the right to update these Terms at any time. Continued use constitutes acceptance.",
  },
  {
    title: "9. Governing Law",
    content:
      "These Terms shall be governed by the laws of the Federal Republic of Nigeria.",
  },
];

export default function TermsOfServiceScreen({ onBack }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-background flex flex-col"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      data-ocid="terms.page"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border shrink-0">
        <button
          type="button"
          data-ocid="terms.close_button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground leading-tight truncate">
            TRIPLE A – Terms of Service
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-24">
        {/* Effective date */}
        <p className="text-xs text-muted-foreground mb-4">
          Effective Date: 30th March 2026
        </p>

        {/* Intro */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-6">
          Welcome to TRIPLE A (&ldquo;the Platform&rdquo;). By accessing or
          using our services, you agree to be bound by these Terms.
        </p>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} className="mb-7">
            <h2 className="text-sm font-bold text-foreground mb-2">
              {section.title}
            </h2>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {section.content}
            </p>
            {section.bullets && (
              <ul className="mt-2 ml-4 flex flex-col gap-1">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-sm text-foreground/85 leading-relaxed list-disc"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
            {section.extra && (
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                {section.extra}
              </p>
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Final note */}
        <div className="border-l-4 border-primary bg-primary/10 rounded-r-xl px-4 py-4">
          <p className="text-sm text-foreground/90 leading-relaxed italic text-center">
            &ldquo;By using TRIPLE A, you acknowledge that you have read,
            understood, and agreed to these Terms.&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}
