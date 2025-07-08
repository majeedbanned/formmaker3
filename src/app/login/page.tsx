"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  School,
  UserRound,
  BookOpenCheck,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Key,
  User,
} from "lucide-react";

const formSchema = z.object({
  userType: z.enum(["school", "teacher", "student"], {
    required_error: "نوع کاربر را انتخاب کنید",
  }),
  schoolCode: z.string().min(1, {
    message: "کد مدرسه الزامی است",
  }),
  username: z.string().min(1, {
    message: "نام کاربری الزامی است",
  }),
  password: z.string().min(1, {
    message: "رمز عبور الزامی است",
  }),
});

// Floating particles component
const FloatingParticles = () => {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-white/10 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.8, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
};

// Geometric shapes for background
const GeometricShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 border-2 border-white/10 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-24 h-24 border-2 border-white/10 rotate-45"
        animate={{
          rotate: [45, 405],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute bottom-32 left-20 w-16 h-16 bg-white/5 rounded-lg"
        animate={{
          rotate: [0, 180, 360],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
      />
    </div>
  );
};

// Enhanced UserType box component with more animations
const UserTypeBox = ({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{
      y: -8,
      rotateY: 5,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative cursor-pointer rounded-2xl p-6 overflow-hidden transition-all duration-500 group ${
      selected
        ? "bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 shadow-2xl shadow-purple-500/20 border-purple-400 text-white"
        : "bg-white/80 backdrop-blur-sm border-gray-200 hover:border-purple-300 hover:shadow-xl hover:bg-white/90"
    } border-2 flex flex-col items-center justify-center gap-3`}
  >
    {/* Animated background gradient */}
    <div
      className={`absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        selected ? "opacity-100" : ""
      }`}
    />

    {/* Icon with enhanced animations */}
    <motion.div
      className={`text-4xl z-10 ${
        selected ? "text-white" : "text-purple-600 group-hover:text-purple-700"
      }`}
      animate={selected ? { scale: [1, 1.2, 1], rotate: [0, 5, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {icon}
    </motion.div>

    <div className="text-lg font-semibold mt-2 z-10 relative">{label}</div>

    {/* Enhanced selection indicator */}
    {selected && (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="absolute top-3 right-3 z-10"
      >
        <div className="relative">
          <CheckCircle2 className="h-6 w-6 text-white" />
          <motion.div
            className="absolute inset-0 bg-white/30 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    )}

    {/* Hover sparkle effect */}
    <motion.div
      className="absolute top-2 left-2 text-yellow-300 opacity-0 group-hover:opacity-100"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <Sparkles className="h-4 w-4" />
    </motion.div>
  </motion.div>
);

// Enhanced input field with icons
const EnhancedInput = ({
  icon,
  type = "text",
  showPasswordToggle = false,
  ...props
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300">
        {icon}
      </div>
      <Input
        type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
        className="pl-10 pr-12 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-purple-500 focus:bg-white h-12 ring-purple-500/20 transition-all duration-300 hover:bg-white/90"
        {...props}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors duration-300"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: "school",
      schoolCode: "",
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "خطا در ورود به سیستم");
      }

      // Redirect to the original requested URL or default to dashboard
      const from = searchParams.get("from") || "/admin/dashboard";
      router.push(from);
      router.refresh(); // Refresh the page to update the auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ورود به سیستم");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Enhanced animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-300 via-blue-300 to-indigo-300"
        animate={{
          background: [
            "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 50%, #A5B4FC 100%)",
            "linear-gradient(135deg, #DDD6FE 0%, #BFDBFE 50%, #C7D2FE 100%)",
            "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 50%, #A5B4FC 100%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Geometric shapes */}
      <GeometricShapes />

      {/* Top decorative element */}
      <motion.div
        className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-white/10 to-transparent rounded-b-[60px] backdrop-blur-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-md relative px-4"
      >
        {/* Enhanced header */}
        <div className="text-center text-white mb-12">
          {/* <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
          >
            <Shield className="h-10 w-10 text-white" />
          </motion.div> */}

          {/* <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
          >
            ورود به پنل مدیریت
          </motion.h1> */}

          {/* <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-purple-100 font-light"
          >
            سیستم مدیریت هوشمند آموزش
          </motion.p> */}
        </div>

        {/* Enhanced form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Card className="backdrop-blur-lg bg-white/10 border-white/20 border-2 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* User type selection */}
                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem className="space-y-6">
                        <FormLabel className="text-center block text-xl font-semibold text-white">
                          انتخاب نوع کاربر
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-4">
                            <UserTypeBox
                              label="مدرسه"
                              icon={<School />}
                              selected={field.value === "school"}
                              onClick={() => field.onChange("school")}
                            />
                            <UserTypeBox
                              label="معلم"
                              icon={<UserRound />}
                              selected={field.value === "teacher"}
                              onClick={() => field.onChange("teacher")}
                            />
                            <UserTypeBox
                              label="دانش آموز"
                              icon={<BookOpenCheck />}
                              selected={field.value === "student"}
                              onClick={() => field.onChange("student")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />

                  {/* School code field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <FormField
                      control={form.control}
                      name="schoolCode"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormLabel className="text-white font-semibold">
                            کد مدرسه
                          </FormLabel>
                          <FormControl>
                            <EnhancedInput
                              icon={<School className="h-4 w-4" />}
                              dir="ltr"
                              className="text-center h-12"
                              placeholder="کد مدرسه خود را وارد کنید"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Username field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormLabel className="text-white font-semibold">
                            نام کاربری
                          </FormLabel>
                          <FormControl>
                            <EnhancedInput
                              className="text-center h-12"
                              icon={<User className="h-4 w-4" />}
                              dir="ltr"
                              placeholder="نام کاربری خود را وارد کنید"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Password field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormLabel className="text-white font-semibold">
                            رمز عبور
                          </FormLabel>
                          <FormControl>
                            <EnhancedInput
                              className="text-center h-12"
                              icon={<Key className="h-4 w-4" />}
                              type="password"
                              placeholder="رمز عبور خود را وارد کنید"
                              showPasswordToggle={true}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="text-sm text-red-300 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Enhanced submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-14 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 border-0 text-white"
                      disabled={isLoading}
                    >
                      <motion.div
                        className="flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            در حال ورود...
                          </>
                        ) : (
                          <>
                            <Shield className="h-5 w-5" />
                            ورود به سیستم
                          </>
                        )}
                      </motion.div>
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-sm text-purple-600/80"
        >
          <p>با ورود به سیستم، شما قوانین و مقررات سایت را پذیرفته‌اید</p>
          {/* <p className="mt-2 text-xs text-purple-600/60">
            نسخه ۱.۲ - طراحی شده با ❤️
          </p> */}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <motion.div
              className="h-8 w-48 bg-white/20 mx-auto rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
