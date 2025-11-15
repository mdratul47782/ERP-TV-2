import Link from "next/link";
import { ProductionRegisterUser } from "@/app/actions";
export default function ProductionRegistrationForm() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-indigo-100">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Create Your Account
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Join HKD Outdoor Innovations Ltd.
          </p>
        </div>

        {/* Registration Form */}
        <form action={ProductionRegisterUser} className="space-y-5">
          {/* User Name */}
          <div>
            <label
              htmlFor="Production_user_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
             Production User Name
            </label>
            <input
              type="text"
              id="Production_user_name"
              name="Production_user_name"
              className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 focus:outline-none rounded-lg px-3 py-2 transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 focus:outline-none rounded-lg px-3 py-2 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 focus:outline-none rounded-lg px-3 py-2 transition-all"
              placeholder="+8801XXXXXXXXX"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 focus:outline-none rounded-lg px-3 py-2 resize-none transition-all"
              placeholder="Write a short bio about yourself..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-lg py-2 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Create Account
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/ProductionLogin"
            className="text-indigo-600 font-medium hover:underline"
          >
            Login here
          </Link>
        </div>
      </div>
    </section>
  );
}
