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
  Smartphone,
  Download,
  Zap,
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

// Simplified floating particles
const FloatingParticles = () => {
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 3,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-white/10 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
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

// Simplified UserType box component
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
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative cursor-pointer rounded-xl p-5 transition-all duration-300 ${
      selected
        ? "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 text-white"
        : "bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-lg"
    } border-2 ${
      selected ? "border-purple-400" : "border-white/50 hover:border-purple-300"
    } flex flex-col items-center justify-center gap-2`}
  >
    {/* Icon */}
    <motion.div
      className={`text-3xl ${
        selected ? "text-white" : "text-purple-600"
      }`}
      animate={selected ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {icon}
    </motion.div>

    <div className="text-base font-semibold">{label}</div>

    {/* Selection indicator */}
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-2 right-2"
      >
        <CheckCircle2 className="h-5 w-5 text-white" />
      </motion.div>
    )}
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

// Enhanced Download Button Component
const DownloadButton = () => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.a
      href="https://farsamooz.ir/uploads/parsamooz-latest.apk"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="relative group"
    >
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-100" />
        
        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: isHovering ? ['-100%', '200%'] : '-100%',
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
        />

        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 blur-xl" />

        {/* Button content */}
        <div className="relative bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 px-8 py-5 rounded-2xl border-2 border-white/20 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Animated phone icon */}
            <motion.div
              animate={{
                rotate: isHovering ? [0, -10, 10, 0] : 0,
                scale: isHovering ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white/30 rounded-full blur-md" />
              <div className="relative bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              
              {/* Floating download icon */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{
                  y: isHovering ? [-2, -6, -2] : 0,
                  opacity: isHovering ? [1, 0.7, 1] : 1,
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Download className="h-4 w-4 text-yellow-300 drop-shadow-lg" />
              </motion.div>
            </motion.div>

            {/* Text content */}
            <div className="flex flex-col items-start text-right flex-1">
              <motion.div
                className="text-white font-bold text-lg flex items-center gap-2"
                animate={{
                  x: isHovering ? [0, 5, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="h-5 w-5 text-yellow-300" />
                دانلود اپلیکیشن اندروید
              </motion.div>
              <motion.p
                className="text-green-100 text-sm font-medium"
                animate={{
                  opacity: isHovering ? [0.8, 1, 0.8] : 1,
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                نصب سریع و آسان • رایگان
              </motion.p>
            </div>

            {/* Arrow icon */}
            <motion.div
              animate={{
                x: isHovering ? [0, 5, 0] : 0,
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Download className="h-6 w-6 text-white" />
            </motion.div>
          </div>

          {/* Pulsing particles */}
          {isHovering && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  initial={{
                    x: "50%",
                    y: "50%",
                    opacity: 1,
                  }}
                  animate={{
                    x: `${50 + Math.cos((i * Math.PI * 2) / 6) * 50}%`,
                    y: `${50 + Math.sin((i * Math.PI * 2) / 6) * 50}%`,
                    opacity: 0,
                    scale: [1, 2, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </>
          )}
        </div>
      </motion.div>

      {/* Floating text hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 text-xs whitespace-nowrap bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full"
      >
        کلیک کنید تا دانلود شود
      </motion.div>
    </motion.a>
  );
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hideSchoolCode, setHideSchoolCode] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: "school",
      schoolCode: "",
      username: "",
      password: "",
    },
  });

  // Check for sc query parameter and populate schoolCode field
  useEffect(() => {
    const scParam = searchParams.get("sc");
    if (scParam) {
      form.setValue("schoolCode", scParam);
      setHideSchoolCode(true);
    }
  }, [searchParams, form]);

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
      {/* Simplified animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400"
        animate={{
          background: [
            "linear-gradient(135deg, #C084FC 0%, #A78BFA 50%, #93C5FD 100%)",
            "linear-gradient(135deg, #A78BFA 0%, #93C5FD 50%, #C084FC 100%)",
            "linear-gradient(135deg, #C084FC 0%, #A78BFA 50%, #93C5FD 100%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-md relative px-4"
      >
        {/* Clean header */}
        <div className="text-center text-white mb-2">
          {/* <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl mb-5 shadow-xl"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div> */}

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl font-bold mb-2 text-white drop-shadow-lg"
          >
            پارس آموز
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base text-white/90 font-light"
          >
            سیستم مدیریت هوشمند آموزشی
          </motion.p>
        </div>

        {/* Clean form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-white/95 border-white/30 border shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="pl-7 pr-7">

            <div className="mt-0">
          <DownloadButton />
        </div>


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
                      <FormItem className="space-y-4">
                        <FormLabel className="text-center block text-lg font-semibold text-gray-700">
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
                  {!hideSchoolCode && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <FormField
                        control={form.control}
                        name="schoolCode"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-gray-700 font-medium text-sm">
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
                  )}

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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-gray-700 font-medium text-sm">
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-gray-700 font-medium text-sm">
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

                  {/* Clean submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-white"
                      disabled={isLoading}
                    >
                      <motion.div
                        className="flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.95 }}
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            در حال ورود...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
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

        {/* Download Button */}
       
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-center text-sm text-white/70"
        >
          <p>با ورود به سیستم، شما قوانین و مقررات سایت را پذیرفته‌اید</p>
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
