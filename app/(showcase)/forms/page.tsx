import { SectionHeader } from "@/components/showcase/SectionHeader"
import { ContactForm } from "@/components/forms/ContactForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function FormsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeader
        title="폼 예제"
        description="React Hook Form + Zod로 구현한 타입 안전한 폼 검증 데모입니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>문의 폼</CardTitle>
          <CardDescription>
            필수 항목을 입력하고 제출 버튼을 눌러보세요. 실시간 검증이 동작합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  )
}
