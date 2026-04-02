import React from "react";
import {
  Award,
  Calendar,
  CheckCircle,
  CreditCard,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import Modal from "./Modal";

type UserData = {
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  role: string;
  createdAt: string;
  updatedAt: string;
  dob?: string;
  isActive?: boolean;
  activePass?: string | null;
  referralCode?: string;
  referredBy?: string | null;
  referralEarnings?: number;
  wallet?: number;
  isVerified?: boolean;
  profilePicture?: string | null;
  purchasedCourses?: string[];
  enrolledCourses?: string[];
  bankDetails?: string[];
};

type Course = {
  id: string;
  title: string;
  description?: string;
  price: number;
  createdAt?: string;
};

type UserDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  courses: Course[];
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const buildAddress = (address?: UserData["address"]) => {
  if (!address) return "-";
  return [address.street, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ") || "-";
};

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm border-b py-2">
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="ml-auto text-right text-gray-800">{value}</span>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  courses,
}: UserDetailModalProps) {
  if (!user) return null;

  const purchasedCount = user.purchasedCourses?.length || user.enrolledCourses?.length || 0;
  const fullAddress = buildAddress(user.address);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 border-b flex justify-between items-center px-4 py-3">
          <h2 className="text-xl font-bold">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="bg-white shadow rounded-xl p-4">
            <div className="flex flex-col items-center mb-4">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover shadow-md mb-2"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-700 shadow-md mb-2 flex items-center justify-center text-3xl font-semibold">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-lg font-semibold">{user.name || "Unnamed user"}</h3>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              <div className="mt-2">
                <StatusBadge active={user.isActive !== false} />
              </div>
            </div>

            <div className="space-y-1">
              <DetailItem icon={Mail} label="Email" value={user.email || "-"} />
              <DetailItem icon={Phone} label="Phone" value={user.phone || "-"} />
              <DetailItem icon={MapPin} label="Address" value={fullAddress} />
              <DetailItem icon={Calendar} label="Date of Birth" value={formatDate(user.dob)} />
              <DetailItem
                icon={Award}
                label="Active Pass"
                value={user.activePass ? user.activePass.replace("_", " ") : "No pass"}
              />
              <DetailItem icon={Wallet} label="Wallet" value={`₹${(user.wallet || 0).toFixed(2)}`} />
              <DetailItem
                icon={CreditCard}
                label="Referral Earnings"
                value={`₹${(user.referralEarnings || 0).toFixed(2)}`}
              />
              <DetailItem icon={LinkIcon} label="Referral Code" value={user.referralCode || "-"} />
              <DetailItem icon={User} label="Referred By" value={user.referredBy || "-"} />
              <DetailItem icon={BookIcon} label="Purchased Courses" value={purchasedCount} />
              <DetailItem icon={Calendar} label="Created At" value={formatDate(user.createdAt)} />
              <DetailItem icon={Calendar} label="Updated At" value={formatDate(user.updatedAt)} />
              <DetailItem
                icon={user.isVerified ? CheckCircle : XCircle}
                label="Verified"
                value={user.isVerified ? "Yes" : "No"}
              />
            </div>
          </div>

          <div className="md:col-span-2 bg-white shadow rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Purchased Courses
            </h3>

            {courses.length === 0 ? (
              <p className="text-gray-500 text-sm">No purchased courses found.</p>
            ) : (
              <ul className="space-y-4">
                {courses.map((course) => (
                  <li
                    key={course.id}
                    className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                  >
                    <h4 className="font-semibold text-base">{course.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.description || "No course description available."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Price: ₹{(course.price || 0).toFixed(2)}</span>
                      <span>Created: {formatDate(course.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Bank Details</h4>
              <p className="text-sm text-gray-500">
                {user.bankDetails?.length
                  ? `${user.bankDetails.length} bank record(s) linked`
                  : "No bank details linked."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function BookIcon(props: React.ComponentProps<typeof CreditCard>) {
  return <CreditCard {...props} />;
}
