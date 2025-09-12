import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, TrendingUp } from "lucide-react";

const Upgrade = () => {
  const userRole = localStorage.getItem("userRole") || "customer";
  const currentSubscription = "basic"; // This would come from user data

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Track up to 100 transactions/month",
        "Basic budgeting tools",
        "Monthly financial reports",
        "Email support",
        "Standard security"
      ],
      cta: "Current Plan",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Advanced features for serious financial management",
      features: [
        "Unlimited transactions",
        "Advanced budgeting & forecasting",
        "Real-time financial insights",
        "Priority email & chat support",
        "Bank-level encryption",
        "Investment tracking",
        "Goal planning with projections",
        "Custom financial reports",
        "Early access to new features"
      ],
      cta: "Upgrade to Premium",
      ctaVariant: "default" as const,
      popular: true
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade Your Experience</h1>
        <p className="text-muted-foreground mt-2">
          Unlock powerful features to take control of your financial future
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  MOST POPULAR
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={plan.ctaVariant}
                disabled={currentSubscription === plan.name.toLowerCase()}
              >
                {currentSubscription === plan.name.toLowerCase() ? "Current Plan" : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Comparison */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Detailed breakdown of what each plan offers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3">Features</th>
                  <th className="text-center pb-3">Basic</th>
                  <th className="text-center pb-3">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">Transaction Limit</td>
                  <td className="text-center py-3">100/month</td>
                  <td className="text-center py-3">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Budgeting Tools</td>
                  <td className="text-center py-3">Basic</td>
                  <td className="text-center py-3">Advanced</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Financial Insights</td>
                  <td className="text-center py-3">Monthly</td>
                  <td className="text-center py-3">Real-time</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Investment Tracking</td>
                  <td className="text-center py-3">-</td>
                  <td className="text-center py-3">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Goal Planning</td>
                  <td className="text-center py-3">Basic</td>
                  <td className="text-center py-3">Advanced with projections</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Support</td>
                  <td className="text-center py-3">Email</td>
                  <td className="text-center py-3">Priority email & chat</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Security</td>
                  <td className="text-center py-3">Standard</td>
                  <td className="text-center py-3">Bank-level encryption</td>
                </tr>
                <tr>
                  <td className="py-3">New Features</td>
                  <td className="text-center py-3">Standard release</td>
                  <td className="text-center py-3">Early access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials */}
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">Why Our Users Upgrade</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground">
                "The premium forecasting tools helped me save an extra $200/month by identifying spending patterns I never noticed before."
              </p>
              <p className="font-medium mt-4">- Sarah K.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground">
                "Investment tracking in one place has simplified my financial management. Worth every penny of the subscription."
              </p>
              <p className="font-medium mt-4">- Michael T.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground">
                "The priority support team resolved my account sync issue in under 2 hours. That's customer service!"
              </p>
              <p className="font-medium mt-4">- Jennifer L.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;