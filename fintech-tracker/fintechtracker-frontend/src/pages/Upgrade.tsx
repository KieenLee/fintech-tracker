import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";

const Upgrade = () => {
  const { t } = useTranslation();
  const userRole = localStorage.getItem("userRole") || "customer";
  const currentSubscription = "basic"; // This would come from user data

  const plans = [
    {
      name: t("common.basic"),
      price: t("upgrade.free", "Free"),
      description: t("upgrade.perfect_getting_started"),
      features: [
        t("upgrade.track_transactions"),
        t("upgrade.basic_budgeting"),
        t("upgrade.monthly_reports"),
        t("upgrade.email_support"),
        t("upgrade.standard_security"),
      ],
      cta: t("common.current_plan"),
      ctaVariant: "outline" as const,
      popular: false,
    },
    {
      name: t("common.premium"),
      price: "$9.99",
      period: t("upgrade.monthly", "/month"),
      description: t("upgrade.advanced_features"),
      features: [
        t("upgrade.unlimited_transactions"),
        t("upgrade.advanced_budgeting"),
        t("upgrade.realtime_insights"),
        t("upgrade.priority_support"),
        t("upgrade.bank_encryption"),
        t("upgrade.investment_tracking"),
        t("upgrade.goal_planning"),
        t("upgrade.custom_reports"),
        t("upgrade.early_access"),
      ],
      cta: t("upgrade.upgrade_to_premium"),
      ctaVariant: "default" as const,
      popular: true,
    },
  ];

  const features = [
    {
      name: t("upgrade.transaction_limit"),
      basic: "100/month",
      premium: t("common.unlimited"),
    },
    {
      name: t("upgrade.budgeting_tools"),
      basic: t("common.basic"),
      premium: t("common.advanced"),
    },
    {
      name: t("upgrade.financial_insights"),
      basic: t("upgrade.monthly"),
      premium: t("upgrade.realtime"),
    },
    {
      name: t("upgrade.support"),
      basic: t("upgrade.email_support"),
      premium: t("upgrade.priority_chat"),
    },
    {
      name: t("upgrade.security"),
      basic: t("upgrade.standard_security"),
      premium: t("upgrade.bank_level"),
    },
    {
      name: t("upgrade.new_features"),
      basic: t("common.standard_release"),
      premium: t("common.early_access"),
    },
  ];

  const testimonials = [
    {
      text: t("upgrade.testimonial_1"),
      author: "Sarah M.",
      role: "Financial Analyst",
    },
    {
      text: t("upgrade.testimonial_2"),
      author: "David K.",
      role: "Entrepreneur",
    },
    {
      text: t("upgrade.testimonial_3"),
      author: "Maria L.",
      role: "Teacher",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t("upgrade.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("upgrade.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative transition-all hover:shadow-lg ${
              plan.popular ? "border-primary shadow-md" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  {t("common.most_popular")}
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="text-4xl font-bold">
                {plan.price}
                {plan.period && (
                  <span className="text-lg font-normal text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>
              <CardDescription className="text-base">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.ctaVariant}
                size="lg"
                disabled={plan.name === t("common.basic")}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Comparison */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t("upgrade.feature_comparison")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("upgrade.detailed_breakdown")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">
                    {t("common.features")}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {t("common.basic")}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      {t("common.premium")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{feature.name}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">
                      {feature.basic}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="font-medium">{feature.premium}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials */}
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-2xl font-bold mb-8">{t("upgrade.why_upgrade")}</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground mb-4">
                  "{testimonial.text}"
                </blockquote>
                <div className="border-t pt-4">
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
