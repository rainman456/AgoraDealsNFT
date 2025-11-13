import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { Check, Upload, MapPin, Globe, Mail, Phone } from 'lucide-react';
import { MerchantOnboardingFlow } from '@/components/MerchantOnboardingFlow';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { merchantAPI } from '@/lib/api';

interface OnboardingData {
  businessName: string;
  businessType: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  logo?: File;
  banner?: File;
}

export const MerchantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { error, handleErrorResponse } = useErrorHandler();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    businessName: '',
    businessType: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const totalSteps = 4;

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'logo' | 'banner', file: File | null) => {
    if (!file) return;

    setFormData(prev => ({ ...prev, [field]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === 'logo') {
        setLogoPreview(reader.result as string);
      } else {
        setBannerPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.businessName || !formData.businessType || !formData.description) {
          toast.error('Please fill in all business information');
          return false;
        }
        return true;
      case 2:
        if (!formData.email || !formData.phone) {
          toast.error('Please provide contact information');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        return true;
      case 3:
        if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
          toast.error('Please complete your business address');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsSubmitting(true);

      // Call backend API to complete onboarding
      await merchantAPI.completeOnboarding({
        businessName: formData.businessName,
        businessType: formData.businessType,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      });

      toast.success('Welcome to DealChain! Your merchant account is ready.');
      navigate('/merchant');
    } catch (err: any) {
      handleErrorResponse(err, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step === currentStep
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
              <span className="text-xs mt-2 text-muted-foreground">
                {step === 1 && 'Business Info'}
                {step === 2 && 'Contact'}
                {step === 3 && 'Location'}
                {step === 4 && 'Branding'}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-all ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Tell us about your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="e.g., Joe's Coffee Shop"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="businessType">Business Type *</Label>
          <Input
            id="businessType"
            placeholder="e.g., Restaurant, Retail, Services"
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="description">Business Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe your business, what you offer, and what makes you unique..."
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be shown to customers on your merchant profile
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>How can customers reach you?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="business@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website (Optional)
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://www.yourbusiness.com"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Business Location</CardTitle>
        <CardDescription>Where is your business located?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Street Address *
          </Label>
          <Input
            id="address"
            placeholder="123 Main Street"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="San Francisco"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              placeholder="CA"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            placeholder="94102"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Assets</CardTitle>
        <CardDescription>Upload your logo and banner (optional but recommended)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="logo">Business Logo</Label>
          <div className="mt-2">
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => {
                    setLogoPreview('');
                    setFormData(prev => ({ ...prev, logo: undefined }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label
                htmlFor="logo"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload logo</span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
                <input
                  id="logo"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="banner">Banner Image</Label>
          <div className="mt-2">
            {bannerPreview ? (
              <div className="relative inline-block w-full">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setBannerPreview('');
                    setFormData(prev => ({ ...prev, banner: undefined }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label
                htmlFor="banner"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload banner</span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB (1200x400 recommended)</span>
                <input
                  id="banner"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="bg-background rounded-lg overflow-hidden border">
            {bannerPreview && (
              <img src={bannerPreview} alt="Banner" className="w-full h-24 object-cover" />
            )}
            <div className="p-4 flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">
                    {formData.businessName.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{formData.businessName || 'Your Business Name'}</p>
                <p className="text-sm text-muted-foreground">{formData.businessType || 'Business Type'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MerchantOnboardingFlow />
      </div>
    </div>
  );
};
