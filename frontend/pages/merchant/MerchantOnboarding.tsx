import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  FileCheck, 
  Sparkles, 
  ArrowRight, 
  Check,
  Upload,
  ChevronLeft,
  Gift,
  TrendingUp,
  Users
} from "lucide-react";

type OnboardingStep = "welcome" | "business-info" | "first-deal" | "success";

// Verification step code preserved for future use if needed
/*
Verification Screen - Business document upload and verification
To re-enable: add "verification" to OnboardingStep type and update flow
*/

const SAMPLE_TEMPLATES = [
  {
    id: "welcome-offer",
    title: "Welcome Offer: 20% Off First Purchase",
    type: "Percentage Discount",
    description: "Perfect for attracting new customers"
  },
  {
    id: "bogo",
    title: "Buy One Get One Free",
    type: "BOGO Deal",
    description: "Great for moving inventory"
  },
  {
    id: "loyalty",
    title: "Loyalty Reward: $10 Off",
    type: "Fixed Amount",
    description: "Reward your repeat customers"
  }
];

export default function MerchantOnboarding() {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !email) return;
    // Skip verification for prototype - go directly to first deal
    setStep("first-deal");
    toast({
      title: "Welcome aboard! 🎉",
      description: "Your merchant account is ready",
    });
  };

  const handleVerification = () => {
    setIsVerifying(true);
    
    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      setStep("first-deal");
      toast({
        title: "Business Verified! ✓",
        description: "Your merchant account is ready",
      });
    }, 2000);
  };

  const handleCreateDeal = () => {
    if (!selectedTemplate) return;
    
    navigate("/merchant/dashboard");
    toast({
      title: "Welcome to your dashboard! 🎉",
      description: "Start creating deals and managing your business",
    });
  };

  // Welcome Screen
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center animate-slide-up">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Store className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-heading font-bold mb-4">Welcome to DealChain for Business</h1>
            <p className="text-lg text-foreground/70 mb-8">
              Reach more customers, boost sales, and build loyalty with blockchain-powered deals
            </p>

            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-card rounded-xl border border-border">
                <Gift className="w-8 h-8 text-primary mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">Create Deals</h3>
                <p className="text-sm text-foreground/60">Launch promotions in minutes with our templates</p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <TrendingUp className="w-8 h-8 text-accent mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">Track Performance</h3>
                <p className="text-sm text-foreground/60">Real-time analytics on your campaigns</p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <Users className="w-8 h-8 text-success mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">Grow Your Base</h3>
                <p className="text-sm text-foreground/60">Reach thousands of deal-seeking customers</p>
              </div>
            </div>

            <Button
              onClick={() => setStep("business-info")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6 px-8"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Business Info Screen
  if (step === "business-info") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setStep("welcome")}
            className="p-2 hover:bg-muted rounded-lg transition-smooth"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold mb-2">Tell Us About Your Business</h2>
              <p className="text-foreground/70">We'll verify your information to get you started</p>
            </div>

            <form onSubmit={handleBusinessInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Coffee Shop"
                  className="py-6 text-base"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type *</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full py-3 px-4 rounded-lg border border-border bg-background text-foreground"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="retail">Retail Store</option>
                  <option value="service">Service Provider</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                  className="py-6 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="py-6 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6"
                size="lg"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <p className="text-xs text-foreground/60 text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* VERIFICATION SCREEN - PRESERVED FOR FUTURE USE
  // Uncomment this section if business verification is needed in production
  
  if (step === "verification") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setStep("business-info")}
            className="p-2 hover:bg-muted rounded-lg transition-smooth"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <FileCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-heading font-bold mb-2">Business Verification</h2>
              <p className="text-foreground/70">
                Upload documents to verify your business
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-smooth cursor-pointer">
                <Upload className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-foreground/70 mb-1">Upload business license or registration</p>
                <p className="text-xs text-foreground/50">PDF, JPG, or PNG (max 5MB)</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sm">Accepted Documents:</h4>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>• Business License</li>
                  <li>• Tax Registration</li>
                  <li>• Certificate of Incorporation</li>
                  <li>• DBA Registration</li>
                </ul>
              </div>

              <Button
                onClick={handleVerification}
                disabled={isVerifying}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Business
                    <Check className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-foreground/60 text-center">
                Verification typically takes 1-2 business days
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  */

  // First Deal Screen
  if (step === "first-deal") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full animate-slide-up">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-3xl font-heading font-bold mb-2">You're All Set!</h2>
              <p className="text-foreground/70">
                Let's create your first deal to attract customers
              </p>
            </div>

            {/* Sample Templates */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-lg">Choose a Template:</h3>
              {SAMPLE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{template.title}</h4>
                      <p className="text-sm text-primary mb-2">{template.type}</p>
                      <p className="text-sm text-foreground/60">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="w-6 h-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={handleCreateDeal}
              disabled={!selectedTemplate}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6 disabled:opacity-50"
              size="lg"
            >
              Create My First Deal
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-center text-sm text-foreground/60 mt-4">
              Don't worry, you can customize everything in the next step
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
