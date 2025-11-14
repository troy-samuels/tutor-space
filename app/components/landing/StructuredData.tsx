import type { LandingCopy } from "@/lib/constants/landing-copy";
import { generateOrganizationSchema, generateFAQSchema } from "@/lib/utils/structured-data";

type StructuredDataProps = {
  faq: LandingCopy["faq"];
};

export function StructuredData({ faq }: StructuredDataProps) {
  const organizationSchema = generateOrganizationSchema();
  const faqSchema = generateFAQSchema(faq.items);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

