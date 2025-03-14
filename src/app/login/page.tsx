"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const formSchema = z.object({
  username: z.string().min(3, {
    message: "نام کاربری باید حداقل 3 کاراکتر باشد",
  }),
  password: z.string().min(6, {
    message: "رمز عبور باید حداقل 6 کاراکتر باشد",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

      // Redirect to the original requested URL or default to admin
      const from = searchParams.get("from") || "/admin";
      router.push(from);
      router.refresh(); // Refresh the page to update the auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ورود به سیستم");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ورود به پنل مدیریت
          </CardTitle>
          <CardDescription className="text-center">
            لطفا اطلاعات حساب کاربری خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کاربری</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        placeholder="نام کاربری خود را وارد کنید"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        type="password"
                        placeholder="رمز عبور خود را وارد کنید"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "در حال ورود..." : "ورود"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
