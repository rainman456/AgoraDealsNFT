import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Sparkles, Eye, Zap, Calendar, DollarSign, Target, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PromotionData {
  title: string;
  description: string;
  discount: number;
  category: string;
  expiry: string;
  quantity: number;
  price: number;
  image: string;
  template: string;
}

const templates = [
  { id: "flash", name: "Flash Sale", icon: "⚡", discount: 50, description: "Limited time offer" },
  { id: "seasonal", name: "Seasonal", icon: "🎄", discount: 30, description: "Holiday special" },
  { id: "bundle", name: "Bundle Deal", icon: "📦", discount: 40, description: "Buy more, save more" },
  { id: "loyalty", name: "Loyalty Reward", icon: "⭐", discount: 25, description: "For returning customers" },
];

const categories = [
  { id: "food", label: "Food & Dining", icon: "🍕" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "wellness", label: "Wellness", icon: "🧘" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "services", label: "Services", icon: "💼" },
];

export default function PromotionWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PromotionData>({
    title: "",
    description: "",
    discount: 20,
    category: "",
    expiry: "",
    quantity: 100,
    price: 0,
    image: "",
    template: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // If on first step, go back to dashboard
      navigate("/merchant/dashboard");
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setFormData({
      ...formData,
      template: templateId,
      discount: template?.discount || 20,
    });
  };

  const handleSubmit = () => {
    toast({
      title: "🎉 Deal Created!",
      description: "Your promotion is now live and visible to customers",
    });
    setTimeout(() => navigate("/merchant/dashboard"), 1500);
  };

  const calculateROI = () => {
    const revenue = formData.price * formData.quantity;
    const discountedRevenue = revenue * (1 - formData.discount / 100);
    const estimatedProfit = discountedRevenue * 0.7; // Assume 30% costs
    return {
      revenue: revenue.toFixed(0),
      discountedRevenue: discountedRevenue.toFixed(0),
      estimatedProfit: estimatedProfit.toFixed(0),
      newCustomers: Math.floor(formData.quantity * 0.6),
    };
  };

  const roi = calculateROI();

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            Create New <span className="neon-text">Deal</span>
          </h1>
          <p className="text-foreground/60">Launch your promotion in 4 simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      s < step
                        ? "bg-success text-white"
                        : s === step
                        ? "bg-primary text-white shadow-lg scale-110"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s < step ? <Check className="w-5 h-5" /> : s}
                  </div>
                  <span className="text-xs mt-2 font-medium">
                    {s === 1 && "Template"}
                    {s === 2 && "Details"}
                    {s === 3 && "Settings"}
                    {s === 4 && "Review"}
                  </span>
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                      s < step ? "bg-success" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 mb-8">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Choose a Template
              </h2>
              <p className="text-foreground/60 mb-8">Start with a proven promotion format</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-6 rounded-xl text-left transition-all duration-200 border-2 ${
                      formData.template === template.id
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border hover:border-primary/50 hover:shadow-md"
                    }`}
                  >
                    <div className="text-4xl mb-3">{template.icon}</div>
                    <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                    <p className="text-sm text-foreground/60 mb-3">{template.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">Suggested discount:</span>
                      <span className="text-lg font-bold text-primary">{template.discount}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Deal Details */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">Deal Details</h2>
              <p className="text-foreground/60 mb-8">Tell customers what makes this special</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Deal Title *</label>
                  <Input
                    placeholder="e.g., 50% Off All Menu Items"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description *</label>
                  <textarea
                    placeholder="Describe what customers get with this deal..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Category *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          formData.category === cat.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="text-xs font-medium">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Deal Image URL</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                    <Button variant="outline" size="icon">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">Deal Settings</h2>
              <p className="text-foreground/60 mb-8">Configure pricing and availability</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Discount Percentage *
                  </label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="5"
                      max="90"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                      className="text-2xl font-bold text-center"
                    />
                    <span className="text-3xl font-bold text-primary">%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })}
                    className="w-full mt-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Price Per Deal *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="text-2xl font-bold"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-foreground/50 mt-2">What customers pay to get this deal</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Total Quantity *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="text-2xl font-bold"
                  />
                  <p className="text-xs text-foreground/50 mt-2">How many deals to create</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Expiration Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.expiry}
                    onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                    className="text-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Preview */}
          {step === 4 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                Review & Launch
              </h2>
              <p className="text-foreground/60 mb-8">Preview how your deal will appear to customers</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Preview Card */}
                <div>
                  <h3 className="font-semibold mb-4">Customer Preview</h3>
                  <Card className="overflow-hidden border-2 border-primary/20">
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      {formData.image ? (
                        <img src={formData.image} alt="Deal" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-foreground/30" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold mb-2">
                        {formData.discount}% OFF
                      </div>
                      <h3 className="font-bold text-lg mb-2">{formData.title || "Your Deal Title"}</h3>
                      <p className="text-sm text-foreground/60 mb-3">{formData.description || "Your deal description will appear here"}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">${formData.price}</span>
                        <span className="text-sm text-foreground/50">per deal</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ROI Projections */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    Projected Results
                  </h3>
                  <div className="space-y-3">
                    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                      <p className="text-sm text-foreground/60 mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-primary">${roi.revenue}</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/30">
                      <p className="text-sm text-foreground/60 mb-1">After Discount</p>
                      <p className="text-3xl font-bold text-success">${roi.discountedRevenue}</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30">
                      <p className="text-sm text-foreground/60 mb-1">Estimated Profit</p>
                      <p className="text-3xl font-bold text-secondary">${roi.estimatedProfit}</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
                      <p className="text-sm text-foreground/60 mb-1">New Customers</p>
                      <p className="text-3xl font-bold text-accent">~{roi.newCustomers}</p>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <Card className="mt-6 p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Deal Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60">Category</p>
                    <p className="font-semibold">{formData.category || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Quantity</p>
                    <p className="font-semibold">{formData.quantity} deals</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Expires</p>
                    <p className="font-semibold">{formData.expiry || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Template</p>
                    <p className="font-semibold">{templates.find(t => t.id === formData.template)?.name || "Custom"}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleBack}
            disabled={step === 1}
            variant="outline"
            size="lg"
            className="min-w-[120px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              size="lg"
              className="min-w-[120px] bg-primary hover:bg-primary-dark"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              size="lg"
              className="min-w-[160px] bg-gradient-to-r from-success to-accent text-white hover:shadow-xl"
            >
              <Zap className="w-4 h-4 mr-2" />
              Launch Deal
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
