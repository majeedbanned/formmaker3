"use client";

import { useState, Suspense } from "react";
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
import { motion } from "framer-motion";
import { CheckCircle2, School, UserRound, BookOpenCheck } from "lucide-react";

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

// UserType box component
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
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative cursor-pointer rounded-xl p-6 overflow-hidden transition-all duration-300 ${
      selected
        ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 border-blue-400 text-white"
        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg"
    } border-2 flex flex-col items-center justify-center gap-2`}
  >
    <div className={`text-3xl ${selected ? "text-white" : "text-blue-500"}`}>
      {icon}
    </div>
    <div className="text-lg font-medium mt-2">{label}</div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-[40px] shadow-lg"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md relative"
      >
        <div className="text-center text-white mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl font-bold"
          >
            ورود به پنل مدیریت
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-2 text-blue-100"
          >
            نسخه ۱.۲
          </motion.p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-center block text-lg font-medium text-gray-700">
                        انتخاب نوع کاربر
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="schoolCode"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-gray-700">
                          کد مدرسه
                        </FormLabel>
                        <FormControl>
                          <Input
                            dir="ltr"
                            placeholder="کد مدرسه خود را وارد کنید"
                            className="bg-white border-gray-200 focus:border-blue-500 h-11 ring-blue-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-gray-700">
                          نام کاربری
                        </FormLabel>
                        <FormControl>
                          <Input
                            dir="ltr"
                            placeholder="نام کاربری خود را وارد کنید"
                            className="bg-white border-gray-200 focus:border-blue-500 h-11 ring-blue-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-gray-700">
                          رمز عبور
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="رمز عبور خود را وارد کنید"
                            className="bg-white border-gray-200 focus:border-blue-500 h-11 ring-blue-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "در حال ورود..." : "ورود به سیستم"}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          با ورود به سیستم، شما قوانین و مقررات سایت را پذیرفته‌اید
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50">
          <div className="animate-pulse text-center">
            <div className="h-10 w-40 bg-blue-200 mx-auto rounded-md"></div>
            <div className="h-4 w-24 bg-blue-100 mx-auto mt-3 rounded-md"></div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
