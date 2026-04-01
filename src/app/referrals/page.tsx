"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Gift, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { apiService } from "../../service/service";
import { formatDate } from "../../lib/utils";

type ReferralsResponse = {
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
  };
  recent: {
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

export default function Referrals() {
  const router = useRouter();
  const [data, setData] = useState<ReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReferrals = async () => {
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
        setError(typedError.message || "Unable to load referral activity.");
      } finally {
        setLoading(false);
      }
    };

    void fetchReferrals();
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
            <span>{error || "Unable to load referral data."}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = data.insights.referrals;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Referral Activity</h1>
        <p className="text-sm text-gray-500">
          Real referral conversions, generated commission, and pending reward exposure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Referrals</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatNumber(summary.totalReferralsMade)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Successful Referrals</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatNumber(summary.successfulReferrals)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Generated Commission</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(summary.totalCommissionGenerated)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Pending Commissions</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(summary.pendingCommissions)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Conversion</CardTitle>
          <p className="text-sm text-gray-500">
            {summary.conversionRate}% conversion with {formatNumber(summary.pendingReferrals)} referred users still not converted.
          </p>
        </CardHeader>
        <CardContent>
          {data.recent.referrals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No referral records found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">Referrer</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Referred User</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Commission</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.recent.referrals.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.referrerName}</div>
                        <div className="text-xs text-gray-500">{item.referrerEmail || "No email"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.referredUserName}</div>
                        <div className="text-xs text-gray-500">
                          {item.referredUserEmail || item.referralCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-xs capitalize text-gray-500">
                          {item.purchaseType}
                          {item.bundleType ? ` • ${item.bundleType.replace("_", " ")}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(item.createdAt, "DD MMM YYYY")}
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
