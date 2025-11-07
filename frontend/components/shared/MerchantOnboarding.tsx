import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Users, DollarSign, Clock, Store, Image as ImageIcon, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { promotionsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  category: string;
  icon: string;
  title: string;
  description: string;
  discount: number;
  originalPrice: number;
  expectedReach: number;
}

// Templates will be loaded from API
const templates: Template[] = [];

export function MerchantOnboarding() {
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'template' | 'customize' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: 0,
    originalPrice: 0,
    maxSupply: 100,
    expiryDays: 30
  });

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      discount: template.discount,
      originalPrice: template.originalPrice,
      maxSupply: 100,
      expiryDays: 30
    });
    setStep('customize');
  };

  const handlePublishDeal = async () => {
    if (!merchant?.walletAddress) {
      toast({
        title: "Authentication Required",
        description: "Please sign in as a merchant to publish deals",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.description || formData.discount <= 0 || formData.originalPrice <= 0) {
      toast({
        title: "Invalid Data",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setPublishing(true);
      const response = await promotionsAPI.create({
        walletAddress: merchant.walletAddress,
        title: formData.title,
        description: formData.description,
        discountPercentage: formData.discount,
        price: formData.originalPrice,
        category: selectedTemplate?.category || 'general',
        maxSupply: formData.maxSupply,
        expiryDays: formData.expiryDays
      });

      if (response.success) {
        setShowSuccessModal(true);
        toast({
          title: "Success!",
          description: "Your deal has been published successfully"
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to publish deal",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to publish deal:', error);
      toast({
        title: "Error",
        description: "Failed to publish deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPublishing(false);
    }
  };

  const currentPrice = formData.originalPrice * (1 - formData.discount / 100);
  const estimatedRevenue = currentPrice * (selectedTemplate?.expectedReach || 0) * 0.15; // 15% conversion

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Deal in 60 Seconds
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-lime-100 dark:bg-lime-900/30 rounded-full">
            <Clock className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <span className="text-sm font-semibold text-lime-700 dark:text-lime-300">
              {step === 'template' ? '0:15' : step === 'customize' ? '0:35' : '0:55'}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2">
          {['template', 'customize', 'preview'].map((s, i) => (
            <div 
              key={s}
              className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                step === s || i < ['template', 'customize', 'preview'].indexOf(step)
                  ? 'bg-gradient-to-r from-lime-500 to-yellow-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {step === 'template' && (
        <div className="animate-fadeIn">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Choose a template to get started
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="group text-left p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-lime-500 dark:hover:border-lime-500 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="text-5xl mb-4">{template.icon}</div>
                <div className="mb-2">
                  <span className="text-xs font-semibold text-lime-600 dark:text-lime-400 uppercase tracking-wide">
                    {template.category}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Pre-configured for maximum engagement
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>~{template.expectedReach.toLocaleString()} reach</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Customize */}
      {step === 'customize' && selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Form */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Customize Your Deal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Edit the details or keep the template as-is
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deal Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter deal title"
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your offer"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount %
                </label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                  max={100}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Supply
                </label>
                <Input
                  type="number"
                  value={formData.maxSupply}
                  onChange={(e) => setFormData({ ...formData, maxSupply: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiry (Days)
                </label>
                <Input
                  type="number"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>

            <div className="p-4 bg-lime-50 dark:bg-lime-950/20 rounded-xl border border-lime-200 dark:border-lime-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  AI Suggestions
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Try 50-60% discount for maximum engagement<br />
                • Add "Limited Time" to create urgency<br />
                • Include specific benefits in description
              </p>
            </div>

            <Button
              onClick={() => setStep('preview')}
              className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white font-semibold py-6"
            >
              Preview Deal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Live Preview
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                See how your deal will appear to customers
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-lime-100 to-yellow-100 dark:from-lime-900/30 dark:to-yellow-900/30 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-lime-500 text-white text-xs font-bold rounded-full">
                    {formData.discount}% OFF
                  </div>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full">
                    {selectedTemplate.category}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {formData.title || 'Your Deal Title'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {formData.description || 'Your deal description will appear here'}
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-lime-600 dark:text-lime-400">
                    ${currentPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                    ${formData.originalPrice}
                  </span>
                </div>
                <Button className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 text-white">
                  Get This Deal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Metrics */}
      {step === 'preview' && selectedTemplate && (
        <div className="animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 dark:bg-lime-900/30 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              <span className="text-sm font-semibold text-lime-700 dark:text-lime-300">
                Deal Ready to Launch!
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Success Predictions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Based on similar deals in your category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Expected Reach</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {selectedTemplate.expectedReach.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">users in 7 days</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-950/30 dark:to-lime-900/30 rounded-2xl border border-lime-200 dark:border-lime-800">
              <TrendingUp className="w-8 h-8 text-lime-600 dark:text-lime-400 mb-3" />
              <p className="text-sm text-lime-700 dark:text-lime-300 mb-1">Estimated Sales</p>
              <p className="text-3xl font-bold text-lime-900 dark:text-lime-100">
                {Math.round(selectedTemplate.expectedReach * 0.15)}
              </p>
              <p className="text-xs text-lime-600 dark:text-lime-400 mt-1">~15% conversion</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-2xl border border-yellow-200 dark:border-yellow-800">
              <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-3" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Projected Revenue</p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                ${estimatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">in first week</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setStep('customize')}
              variant="outline"
              className="flex-1 py-6"
            >
              Edit Deal
            </Button>
            <Button
              onClick={handlePublishDeal}
              disabled={publishing}
              className="flex-1 bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Store className="w-5 h-5 mr-2" />
              {publishing ? 'Publishing...' : 'Publish Deal'}
            </Button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setStep('template');
                setSelectedTemplate(null);
                setFormData({
                  title: '',
                  description: '',
                  discount: 0,
                  originalPrice: 0
                });
                navigate('/merchant/dashboard');
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-lime-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3">Deal Published Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                Your deal is now live and visible to customers. You can track its performance in your dashboard.
              </p>

              <div className="bg-primary/10 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-primary mb-2">What's Next?</p>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Monitor redemptions in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>View customer analytics and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Manage your active promotions</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setStep('template');
                  setSelectedTemplate(null);
                  setFormData({
                    title: '',
                    description: '',
                    discount: 0,
                    originalPrice: 0
                  });
                  navigate('/merchant/dashboard');
                }}
                className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-semibold py-3"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
