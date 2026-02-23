"use client";

import { useEffect, useState } from "react";
import { CompanyUrlForm } from "@/components/onboarding/CompanyUrlForm";
import { ContextForm } from "@/components/onboarding/ContextForm";

type OrgData = {
  orgId: string;
  org: {
    id: string;
    name: string;
    slug: string;
    onboarding_status: string;
  };
};

type OrgDetails = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  industry: string | null;
  company_size: string | null;
  icp_description: string | null;
  onboarding_status: string;
};

export default function OnboardingPage() {
  const [current, setCurrent] = useState<OrgData | null>(null);
  const [details, setDetails] = useState<OrgDetails | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/orgs/current");
        if (!res.ok) return;
        const data: OrgData = await res.json();
        if (cancelled) return;
        setCurrent(data);
        const getRes = await fetch(`/api/v1/orgs/${data.orgId}`);
        if (!getRes.ok) return;
        const orgDetails: OrgDetails = await getRes.json();
        if (cancelled) return;
        setDetails(orgDetails);
        setStep(orgDetails.website_url ? 2 : 1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onUrlSuccess() {
    if (!current) return;
    const res = await fetch(`/api/v1/orgs/${current.orgId}`);
    if (res.ok) {
      const orgDetails: OrgDetails = await res.json();
      setDetails(orgDetails);
      setStep(2);
    }
  }

  if (loading || !current) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-12">
      <h1 className="mb-8 text-2xl font-semibold">Set up your workspace</h1>
      {step === 1 && (
        <CompanyUrlForm
          orgId={current.orgId}
          initialUrl={details?.website_url}
          onSuccess={onUrlSuccess}
        />
      )}
      {step === 2 && details && (
        <ContextForm
          orgId={current.orgId}
          initial={{
            industry: details.industry,
            company_size: details.company_size,
            icp_description: details.icp_description,
          }}
        />
      )}
    </div>
  );
}
