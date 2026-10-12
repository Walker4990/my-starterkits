"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
  email: z.string().email("유효한 이메일을 입력해주세요."),
  message: z.string().min(10, "메시지는 10자 이상이어야 합니다.").max(500, "메시지는 500자 이하여야 합니다."),
})

type ContactFormValues = z.infer<typeof schema>

export function ContactForm() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  })

  function onSubmit(values: ContactFormValues) {
    toast.success("폼이 제출되었습니다!", {
      description: `${values.name}님의 메시지를 받았습니다.`,
    })
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" type="email" {...field} />
              </FormControl>
              <FormDescription>답변을 받을 이메일 주소를 입력하세요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메시지</FormLabel>
              <FormControl>
                <textarea
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="문의 내용을 입력하세요..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          제출하기
        </Button>
      </form>
    </Form>
  )
}
