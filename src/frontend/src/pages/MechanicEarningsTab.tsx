import { DollarSign, TrendingUp, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useMechanicCompletedJobs } from "../hooks/useQueries";

function formatNGN(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof DollarSign;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">
          {label}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value}
        </p>
        {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function MechanicEarningsTab() {
  const { data: completedJobs = [] } = useMechanicCompletedJobs();

  const totalEarned = completedJobs.reduce(
    (sum, job) => sum + (job.price != null ? Number(job.price) : 0),
    0,
  );
  const avgPerJob =
    completedJobs.length > 0
      ? Math.round(totalEarned / completedJobs.length)
      : 0;

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-5 pt-12 pb-5 bg-gradient-to-b from-card to-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Earnings
            </h1>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Your income summary
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Earned"
            value={formatNGN(totalEarned)}
            sub="All completed jobs"
            icon={DollarSign}
            index={0}
          />
          <StatCard
            label="Jobs Done"
            value={String(completedJobs.length)}
            sub="Total completed"
            icon={Wrench}
            index={1}
          />
          <StatCard
            label="Avg Per Job"
            value={formatNGN(avgPerJob)}
            sub="Based on all jobs"
            icon={DollarSign}
            index={2}
          />
          <StatCard
            label="Last Job"
            value={
              completedJobs.length > 0 && completedJobs[0].price != null
                ? formatNGN(Number(completedJobs[0].price))
                : "—"
            }
            sub="Most recent"
            icon={TrendingUp}
            index={3}
          />
        </div>

        {/* Job history */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-foreground">Job History</h2>
          {completedJobs.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
              <Wrench className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No completed jobs yet
              </p>
            </div>
          ) : (
            completedJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                data-ocid={`earnings.item.${i + 1}`}
                className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-semibold truncate">
                    {job.issueDescription}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {job.customerName} · {formatDate(job.createdAt)}
                  </p>
                </div>
                <span className="text-primary font-bold text-sm shrink-0">
                  {job.price != null ? formatNGN(Number(job.price)) : "—"}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
