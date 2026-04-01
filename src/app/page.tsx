"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BookOpen,
  CreditCard,
  Gift,
  GraduationCap,
  PlayCircle,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { apiService } from "../service/service";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { formatDate } from "../lib/utils";

type DashboardResponse = {
  success: boolean;
  summary: {
    totalUsers: number;
    totalTutors: number;
    totalCourses: number;
    totalVideos: number;
    totalOrders: number;
    totalRevenue: number;
    totalApexPassSales: number;
    totalCorePassSales: number;
    totalReferralEarningsGenerated: number;
    totalPayoutsProcessed: number;
    successfulPayoutsCount: number;
    pendingPayoutsCount: number;
    failedPayoutsCount: number;
  };
  insights: {
    referrals: {
      totalReferralsMade: number;
      successfulReferrals: number;
      pendingReferrals: number;
      conversionRate: number;
      totalCommissionGenerated: number;
      totalCommissionPaid: number;
      pendingCommissions: number;
    };
    operations: {
      generatedReferralCodes: number;
      lowContentCourses: number;
      failedOrders: number;
      failedCourseOrders: number;
      failedBundleOrders: number;
      failedPayouts: number;
    };
  };
  charts: {
    revenueOverTime: Array<{
      month: string;
      label: string;
      revenue: number;
      orders: number;
      courseRevenue: number;
      bundleRevenue: number;
      apexSales: number;
      coreSales: number;
    }>;
    passSalesOverTime: Array<{
      month: string;
      label: string;
      apexSales: number;
      coreSales: number;
      totalSales: number;
    }>;
    apexVsCoreSales: Array<{
      type: string;
      key: string;
      count: number;
      revenue: number;
    }>;
  };
  recent: {
    purchases: Array<{
      id: string;
      orderId: string;
      title: string;
      purchaseType: "course" | "bundle";
      bundleType: string | null;
      amount: number;
      status: string;
      customerName: string;
      customerEmail: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    users: Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      activePass: string | null;
      createdAt: string;
      isActive: boolean;
    }>;
    referrals: Array<{
      id: string;
      referrerName: string;
      referrerEmail: string | null;
      referredUserName: string;
      referredUserEmail: string | null;
      title: string;
      purchaseType: string;
      bundleType: string | null;
      amount: number;
      status: string;
      referralCode: string;
      createdAt: string;
    }>;
    payouts: Array<{
      id: string;
      referralCode: string;
      title: string;
      amount: number;
      status: string;
      failureReason: string | null;
      referrerName: string;
      beneficiaryName: string;
      createdAt: string;
      processedAt: string | null;
    }>;
    courses: Array<{
      id: string;
      title: string;
      price: number;
      status: string;
      lessonsCount: number;
      instructorName: string;
      createdAt: string;
    }>;
    tutors: Array<{
      _id: string;
      name: string;
      email: string;
      createdAt: string;
    }>;
    videos: Array<{
      id: string;
      title: string;
      courseTitle: string;
      createdAt: string;
      hasThumbnail: boolean;
      hasVideo: boolean;
    }>;
  };
  rankings: {
    topSellingCourses: Array<{
      courseId: string;
      title: string;
      salesCount: number;
      revenue: number;
      lastSoldAt: string;
      instructorName: string;
    }>;
    topTutors: Array<{
      instructorId: string;
      name: string;
      email: string;
      assignedCourses: number;
      totalLessons: number;
      activityCount: number;
    }>;
  };
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);
const formatNumber = (value: number) => numberFormatter.format(value || 0);

const getStatusClasses = (status: string) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (["PAID", "SUCCESS", "COMPLETED"].includes(normalizedStatus)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (["FAILED", "REVERSED", "CANCELLED"].includes(normalizedStatus)) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-amber-50 text-amber-700 ring-amber-200";
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="h-full border-gray-200 bg-white">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full border-gray-200 bg-white">
      <CardHeader className="mb-0 space-y-1 pb-0">
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-gray-500">{description}</p> : null}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
        status,
      )}`}
    >
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function RevenueChart({
  data,
}: {
  data: DashboardResponse["charts"]["revenueOverTime"];
}) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="grid h-56 grid-cols-6 items-end gap-3">
        {data.map((item) => (
          <div key={item.month} className="flex h-full flex-col justify-end gap-2">
            <div className="text-center text-xs font-medium text-gray-500">
              {item.revenue > 0 ? formatCurrency(item.revenue) : "0"}
            </div>
            <div className="relative flex h-44 items-end justify-center rounded-2xl bg-gray-50 p-2">
              <div
                className="w-full rounded-xl bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{
                  height: `${Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 10 : 2)}%`,
                }}
              />
            </div>
            <div className="text-center text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {data.slice(-3).map((item) => (
          <div key={item.month} className="rounded-2xl bg-gray-50 p-3">
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {formatCurrency(item.revenue)}
            </div>
            <div className="text-xs text-gray-500">{formatNumber(item.orders)} paid orders</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PassSalesChart({
  data,
  split,
}: {
  data: DashboardResponse["charts"]["passSalesOverTime"];
  split: DashboardResponse["charts"]["apexVsCoreSales"];
}) {
  const maxSales = Math.max(...data.map((item) => item.totalSales), 1);

  return (
    <div className="space-y-5">
      <div className="grid h-56 grid-cols-6 items-end gap-3">
        {data.map((item) => {
          const apexHeight = (item.apexSales / maxSales) * 100;
          const coreHeight = (item.coreSales / maxSales) * 100;

          return (
            <div key={item.month} className="flex h-full flex-col justify-end gap-2">
              <div className="text-center text-xs text-gray-500">
                {formatNumber(item.totalSales)} sales
              </div>
              <div className="flex h-44 flex-col justify-end gap-1 rounded-2xl bg-gray-50 p-2">
                <div
                  className="rounded-xl bg-orange-500"
                  style={{ height: `${Math.max(apexHeight, item.apexSales > 0 ? 8 : 0)}%` }}
                />
                <div
                  className="rounded-xl bg-emerald-500"
                  style={{ height: `${Math.max(coreHeight, item.coreSales > 0 ? 8 : 0)}%` }}
                />
              </div>
              <div className="text-center text-xs text-gray-500">{item.label}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {split.map((item) => (
          <div key={item.key} className="rounded-2xl bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.type}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.revenue)} revenue</p>
              </div>
              <div className="text-xl font-semibold text-gray-900">{formatNumber(item.count)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Apex
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Core
        </span>
      </div>
    </div>
  );
}

function DataTable({
  title,
  headers,
  rows,
  emptyMessage,
}: {
  title?: string;
  headers: string[];
  rows: React.ReactNode[][];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3">
      {title ? <h3 className="text-sm font-semibold text-gray-800">{title}</h3> : null}
      {rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-medium text-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row, index) => (
                <tr key={index} className="align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={`${index}-${cellIndex}`} className="px-4 py-3 text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentList({
  items,
  emptyMessage,
}: {
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    meta: string;
  }>;
  emptyMessage: string;
}) {
  if (!items.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3"
        >
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900">{item.title}</div>
            <div className="truncate text-sm text-gray-500">{item.subtitle}</div>
          </div>
          <div className="shrink-0 text-xs text-gray-500">{item.meta}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getAdminDashboardOverview({ token });
        setDashboard(response);
      } catch (fetchError) {
        const typedError = fetchError as Error & { status?: number };
        if (typedError.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        setError(typedError.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, [router]);

  const summaryCards = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        title: "Total Users",
        value: formatNumber(dashboard.summary.totalUsers),
        subtitle: `${formatNumber(dashboard.insights.referrals.totalReferralsMade)} referred users tracked`,
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Total Tutors",
        value: formatNumber(dashboard.summary.totalTutors),
        subtitle: "Available instructors in catalogue",
        icon: <GraduationCap className="h-5 w-5" />,
      },
      {
        title: "Total Courses",
        value: formatNumber(dashboard.summary.totalCourses),
        subtitle: `${formatNumber(dashboard.insights.operations.lowContentCourses)} need lesson attention`,
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        title: "Total Videos",
        value: formatNumber(dashboard.summary.totalVideos),
        subtitle: "Uploaded lesson content",
        icon: <PlayCircle className="h-5 w-5" />,
      },
      {
        title: "Total Orders",
        value: formatNumber(dashboard.summary.totalOrders),
        subtitle: `${formatNumber(dashboard.insights.operations.failedOrders)} failed orders to review`,
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(dashboard.summary.totalRevenue),
        subtitle: "Paid course and pass revenue",
        icon: <BadgeIndianRupee className="h-5 w-5" />,
      },
      {
        title: "Apex Pass Sales",
        value: formatNumber(dashboard.summary.totalApexPassSales),
        subtitle: formatCurrency(
          dashboard.charts.apexVsCoreSales.find((item) => item.key === "apex_pass")?.revenue || 0,
        ),
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Core Pass Sales",
        value: formatNumber(dashboard.summary.totalCorePassSales),
        subtitle: formatCurrency(
          dashboard.charts.apexVsCoreSales.find((item) => item.key === "core_pass")?.revenue || 0,
        ),
        icon: <Wallet className="h-5 w-5" />,
      },
      {
        title: "Referral Earnings",
        value: formatCurrency(dashboard.summary.totalReferralEarningsGenerated),
        subtitle: `${dashboard.insights.referrals.conversionRate}% referral conversion`,
        icon: <Gift className="h-5 w-5" />,
      },
      {
        title: "Payouts Processed",
        value: formatNumber(dashboard.summary.totalPayoutsProcessed),
        subtitle: `${formatNumber(dashboard.summary.successfulPayoutsCount)} successful`,
        icon: <Wallet className="h-5 w-5" />,
      },
      {
        title: "Pending Payouts",
        value: formatNumber(dashboard.summary.pendingPayoutsCount),
        subtitle: formatCurrency(dashboard.insights.referrals.pendingCommissions),
        icon: <AlertTriangle className="h-5 w-5" />,
      },
      {
        title: "Failed Payouts",
        value: formatNumber(dashboard.summary.failedPayoutsCount),
        subtitle: "Needs payout retry or review",
        icon: <AlertTriangle className="h-5 w-5" />,
      },
    ];
  }, [dashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="p-6">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Dashboard unavailable</h1>
            </div>
            <p className="text-sm text-rose-700">
              {error || "Unable to load admin dashboard data right now."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Revenue, passes, referrals, payouts, and recent activity for day-to-day admin monitoring.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {formatCurrency(dashboard.insights.referrals.totalCommissionPaid)}
          </span>{" "}
          commission paid so far
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          title="Operational Warnings"
          description="A quick scan of issues that usually need admin attention."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-800">Low-content courses</div>
              <div className="mt-1 text-2xl font-semibold text-amber-900">
                {formatNumber(dashboard.insights.operations.lowContentCourses)}
              </div>
              <div className="mt-1 text-xs text-amber-700">Courses with zero lessons uploaded</div>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4">
              <div className="text-sm font-medium text-rose-800">Failed orders</div>
              <div className="mt-1 text-2xl font-semibold text-rose-900">
                {formatNumber(dashboard.insights.operations.failedOrders)}
              </div>
              <div className="mt-1 text-xs text-rose-700">
                {formatNumber(dashboard.insights.operations.failedCourseOrders)} course and{" "}
                {formatNumber(dashboard.insights.operations.failedBundleOrders)} pass orders
              </div>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-800">Referral conversions</div>
              <div className="mt-1 text-2xl font-semibold text-blue-900">
                {dashboard.insights.referrals.conversionRate}%
              </div>
              <div className="mt-1 text-xs text-blue-700">
                {formatNumber(dashboard.insights.referrals.successfulReferrals)} successful of{" "}
                {formatNumber(dashboard.insights.referrals.totalReferralsMade)} referred users
              </div>
            </div>
          </div>
        </SectionCard>
        <div className="xl:col-span-2">
          <SectionCard
            title="Referral Snapshot"
            description="Commission generation, pending exposure, and payout pressure."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Generated commission</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrency(dashboard.insights.referrals.totalCommissionGenerated)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Paid commission</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrency(dashboard.insights.referrals.totalCommissionPaid)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Pending commissions</div>
                <div className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrency(dashboard.insights.referrals.pendingCommissions)}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Revenue Over Time"
          description="Paid course and pass revenue for the last 6 months."
        >
          <RevenueChart data={dashboard.charts.revenueOverTime} />
        </SectionCard>
        <SectionCard
          title="Pass Sales Mix"
          description="Apex vs Core pass performance and monthly sales split."
        >
          <PassSalesChart
            data={dashboard.charts.passSalesOverTime}
            split={dashboard.charts.apexVsCoreSales}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Purchases"
          description="Latest course and pass orders with payment status."
        >
          <DataTable
            headers={["Customer", "Item", "Amount", "Status", "Date"]}
            emptyMessage="No recent purchases found."
            rows={dashboard.recent.purchases.map((purchase) => [
              <div key={`${purchase.id}-customer`}>
                <div className="font-medium text-gray-900">{purchase.customerName}</div>
                <div className="text-xs text-gray-500">{purchase.customerEmail || "No email"}</div>
              </div>,
              <div key={`${purchase.id}-item`}>
                <div className="font-medium text-gray-900">{purchase.title}</div>
                <div className="text-xs capitalize text-gray-500">
                  {purchase.purchaseType.replace("_", " ")}
                  {purchase.bundleType ? ` • ${purchase.bundleType.replace("_", " ")}` : ""}
                </div>
              </div>,
              <span key={`${purchase.id}-amount`} className="font-medium text-gray-900">
                {formatCurrency(purchase.amount)}
              </span>,
              <StatusBadge key={`${purchase.id}-status`} status={purchase.status} />,
              <div key={`${purchase.id}-date`} className="text-xs text-gray-500">
                {formatDate(purchase.createdAt, "DD MMM YYYY")}
              </div>,
            ])}
          />
        </SectionCard>
        <SectionCard
          title="Recent Users"
          description="Newest accounts and their current pass state."
        >
          <DataTable
            headers={["User", "Role", "Pass", "Status", "Joined"]}
            emptyMessage="No recent users found."
            rows={dashboard.recent.users.map((user) => [
              <div key={`${user._id}-user`}>
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>,
              <span key={`${user._id}-role`} className="capitalize">
                {user.role}
              </span>,
              <span key={`${user._id}-pass`} className="capitalize text-gray-700">
                {user.activePass ? user.activePass.replace("_", " ") : "No active pass"}
              </span>,
              <StatusBadge key={`${user._id}-status`} status={user.isActive ? "ACTIVE" : "INACTIVE"} />,
              <div key={`${user._id}-joined`} className="text-xs text-gray-500">
                {formatDate(user.createdAt, "DD MMM YYYY")}
              </div>,
            ])}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Referrals"
          description="Latest converted referral activity and generated commission."
        >
          <DataTable
            headers={["Referrer", "Referred User", "Item", "Commission", "Status"]}
            emptyMessage="No referral records found."
            rows={dashboard.recent.referrals.map((item) => [
              <div key={`${item.id}-referrer`}>
                <div className="font-medium text-gray-900">{item.referrerName}</div>
                <div className="text-xs text-gray-500">{item.referrerEmail || "No email"}</div>
              </div>,
              <div key={`${item.id}-buyer`}>
                <div className="font-medium text-gray-900">{item.referredUserName}</div>
                <div className="text-xs text-gray-500">
                  {item.referredUserEmail || item.referralCode}
                </div>
              </div>,
              <div key={`${item.id}-item`}>
                <div className="font-medium text-gray-900">{item.title}</div>
                <div className="text-xs capitalize text-gray-500">
                  {item.purchaseType}
                  {item.bundleType ? ` • ${item.bundleType.replace("_", " ")}` : ""}
                </div>
              </div>,
              <span key={`${item.id}-amount`} className="font-medium text-gray-900">
                {formatCurrency(item.amount)}
              </span>,
              <StatusBadge key={`${item.id}-status`} status={item.status} />,
            ])}
          />
        </SectionCard>
        <SectionCard
          title="Recent Payouts"
          description="Recent payout attempts, successes, and failures."
        >
          <DataTable
            headers={["Referrer", "Beneficiary", "Amount", "Status", "Processed"]}
            emptyMessage="No payout activity found."
            rows={dashboard.recent.payouts.map((item) => [
              <div key={`${item.id}-referrer`}>
                <div className="font-medium text-gray-900">{item.referrerName}</div>
                <div className="text-xs text-gray-500">{item.title}</div>
              </div>,
              <div key={`${item.id}-beneficiary`}>
                <div className="font-medium text-gray-900">{item.beneficiaryName}</div>
                <div className="text-xs text-gray-500">{item.referralCode}</div>
              </div>,
              <span key={`${item.id}-amount`} className="font-medium text-gray-900">
                {formatCurrency(item.amount)}
              </span>,
              <div key={`${item.id}-status`} className="space-y-1">
                <StatusBadge status={item.status} />
                {item.failureReason ? (
                  <div className="max-w-44 text-xs text-rose-600">{item.failureReason}</div>
                ) : null}
              </div>,
              <div key={`${item.id}-processed`} className="text-xs text-gray-500">
                {item.processedAt ? formatDate(item.processedAt, "DD MMM YYYY") : "Pending"}
              </div>,
            ])}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top-selling Courses"
          description="Direct paid course orders ranked by sales volume."
        >
          <RecentList
            emptyMessage="No course sales found yet."
            items={dashboard.rankings.topSellingCourses.map((course) => ({
              id: course.courseId,
              title: course.title,
              subtitle: `${formatNumber(course.salesCount)} sales • ${course.instructorName}`,
              meta: formatCurrency(course.revenue),
            }))}
          />
        </SectionCard>
        <SectionCard
          title="Top Tutors"
          description="Tutors ranked by assigned courses and course activity."
        >
          <RecentList
            emptyMessage="No tutor activity found yet."
            items={dashboard.rankings.topTutors.map((tutor) => ({
              id: tutor.instructorId,
              title: tutor.name,
              subtitle: `${formatNumber(tutor.assignedCourses)} courses • ${formatNumber(
                tutor.totalLessons,
              )} lessons • ${formatNumber(tutor.activityCount)} enrollments`,
              meta: tutor.email || "No email",
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          title="Recently Added Courses"
          description="Latest course entries and lesson completeness."
        >
          <RecentList
            emptyMessage="No recent courses found."
            items={dashboard.recent.courses.map((course) => ({
              id: course.id,
              title: course.title,
              subtitle: `${course.instructorName} • ${formatNumber(course.lessonsCount)} lessons • ${course.status}`,
              meta: formatDate(course.createdAt, "DD MMM"),
            }))}
          />
        </SectionCard>
        <SectionCard
          title="Recently Added Tutors"
          description="Latest instructor records."
        >
          <RecentList
            emptyMessage="No recent tutors found."
            items={dashboard.recent.tutors.map((tutor) => ({
              id: tutor._id,
              title: tutor.name,
              subtitle: tutor.email,
              meta: formatDate(tutor.createdAt, "DD MMM"),
            }))}
          />
        </SectionCard>
        <SectionCard
          title="Recently Uploaded Videos"
          description="Latest lesson uploads attached to courses."
        >
          <RecentList
            emptyMessage="No recent videos found."
            items={dashboard.recent.videos.map((video) => ({
              id: video.id,
              title: video.title,
              subtitle: `${video.courseTitle} • ${video.hasThumbnail ? "thumbnail" : "no thumbnail"}`,
              meta: formatDate(video.createdAt, "DD MMM"),
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Successful referrals</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatNumber(dashboard.insights.referrals.successfulReferrals)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Pending referrals</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatNumber(dashboard.insights.referrals.pendingReferrals)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Generated referral codes</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatNumber(dashboard.insights.operations.generatedReferralCodes)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
