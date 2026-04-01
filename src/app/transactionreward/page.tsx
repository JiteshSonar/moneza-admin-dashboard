"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeftRight, Clock3, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { apiService } from "../../service/service";
import { formatDate } from "../../lib/utils";

type PayoutsResponse = {
  summary: {
    totalPayoutsProcessed: number;
    successfulPayoutsCount: number;
    pendingPayoutsCount: number;
    failedPayoutsCount: number;
  };
  insights: {
    referrals: {
      totalCommissionPaid: number;
      pendingCommissions: number;
    };
  };
  recent: {
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
  if (["SUCCESS", "PAID", "COMPLETED"].includes(normalizedStatus)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (["FAILED", "REVERSED"].includes(normalizedStatus)) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
};

export default function TransactionsRewards() {
  const router = useRouter();
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayouts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getAdminDashboardOverview({ token });
        setData(response);
      } catch (fetchError) {
        const typedError = fetchError as Error;
        setError(typedError.message || "Unable to load payout activity.");
      } finally {
        setLoading(false);
      }
    };

    void fetchPayouts();
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-3 p-6 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
            <span>{error || "Unable to load payout data."}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payout Activity</h1>
        <p className="text-sm text-gray-500">
          Processed, pending, and failed referral payout records from live data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Processed Payouts</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatNumber(data.summary.totalPayoutsProcessed)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Commission Paid</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(data.insights.referrals.totalCommissionPaid)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Pending Payouts</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatNumber(data.summary.pendingPayoutsCount)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Failed Payouts</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatNumber(data.summary.failedPayoutsCount)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payout Records</CardTitle>
          <p className="text-sm text-gray-500">
            Pending commission balance: {formatCurrency(data.insights.referrals.pendingCommissions)}
          </p>
        </CardHeader>
        <CardContent>
          {data.recent.payouts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No payout activity found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">Referrer</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Beneficiary</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Processed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.recent.payouts.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.referrerName}</div>
                        <div className="text-xs text-gray-500">{item.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.beneficiaryName}</div>
                        <div className="text-xs text-gray-500">{item.referralCode}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                          {item.failureReason ? (
                            <div className="max-w-44 text-xs text-rose-600">{item.failureReason}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(item.createdAt, "DD MMM YYYY")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.processedAt ? formatDate(item.processedAt, "DD MMM YYYY") : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
