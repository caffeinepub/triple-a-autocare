import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onBack: () => void;
}

const sections = [
  {
    title: "1. Information We Collect",
    content: "We may collect:",
    bullets: [
      "Name and contact details",
      "Location data",
      "Service history",
      "Device and usage data",
    ],
  },
  {
    title: "2. Purpose of Data Collection",
    content: "Your data is used to:",
    bullets: [
      "Connect you with mechanics",
      "Improve platform performance",
      "Ensure safety and prevent fraud",
    ],
  },
  {
    title: "3. Data Sharing",
    content: "We may share your information with:",
    bullets: [
      "Mechanics providing requested services",
      "Law enforcement or regulators where required",
    ],
  },
  {
    title: "4. Data Security",
    content:
      "We implement reasonable technical and organizational measures to protect your data.",
  },
  {
    title: "5. Your Rights",
    content:
      "You may request access, correction, or deletion of your personal data.",
  },
  {
    title: "6. Legal Compliance",
    content:
      "TRIPLE A complies with applicable data protection regulations under the laws of the Federal Republic of Nigeria.",
  },
  {
    title: "7. Updates",
    content:
      "We may update this policy periodically. Continued use of the Platform indicates your acceptance of any changes.",
  },
];

export default function PrivacyPolicyScreen({ onBack }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-background flex flex-col"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      data-ocid="privacy.page"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border shrink-0">
        <button
          type="button"
          data-ocid="privacy.close_button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground leading-tight truncate">
            TRIPLE A – Privacy Policy
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-24">
        {/* Effective date */}
        <p className="text-xs text-muted-foreground mb-4">
          Effective Date: 30 March 2026
        </p>

        {/* Intro */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-6">
          TRIPLE A respects your privacy and is committed to protecting your
          personal data.
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
          </div>
        ))}

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Final note */}
        <div className="border-l-4 border-primary bg-primary/10 rounded-r-xl px-4 py-4">
          <p className="text-sm text-foreground/90 leading-relaxed italic text-center">
            &ldquo;By using TRIPLE A, you consent to this Privacy Policy.&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}
