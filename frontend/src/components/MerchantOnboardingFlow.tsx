import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Zap, Users, TrendingUp, Check, ArrowRight } from 'lucide-react';

interface DealTemplate {
  id: string;
  category: string;
  icon: string;
  title: string;
  description: string;
  defaultDiscount: number;
  exampleTitle: string;
  exampleDescription: string;
}

const templates: DealTemplate[] = [
  {
    id: 'food',
    category: 'Food & Dining',
    icon: '🍽️',
    title: 'Restaurant Deal',
    description: 'Perfect for cafes, restaurants, and food services',
    defaultDiscount: 25,
    exampleTitle: '25% Off Your Next Meal',
    exampleDescription: 'Enjoy a delicious dining experience with 25% off your entire bill. Valid for lunch and dinner.',
  },
  {
    id: 'spa',
    category: 'Spa & Wellness',
    icon: '💆',
    title: 'Spa Package',
    description: 'Ideal for spas, salons, and wellness centers',
    defaultDiscount: 30,
    exampleTitle: '30% Off Spa Services',
    exampleDescription: 'Relax and rejuvenate with 30% off all spa treatments including massages, facials, and more.',
  },
  {
    id: 'travel',
    category: 'Travel & Hotels',
    icon: '✈️',
    title: 'Travel Deal',
    description: 'Great for hotels, tours, and travel experiences',
    defaultDiscount: 20,
    exampleTitle: '20% Off Hotel Stays',
    exampleDescription: 'Book your next getaway with 20% off all room types. Includes complimentary breakfast.',
  },
  {
    id: 'shopping',
    category: 'Shopping & Retail',
    icon: '🛍️',
    title: 'Retail Offer',
    description: 'Best for retail stores and e-commerce',
    defaultDiscount: 15,
    exampleTitle: '15% Off Storewide',
    exampleDescription: 'Shop our entire collection with 15% off. Excludes sale items and gift cards.',
  },
];

interface FormData {
  template: string;
  title: string;
  description: string;
  discount: number;
  originalPrice: number;
  quantity: number;
  expiryDays: number;
}

export const MerchantOnboardingFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<DealTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    template: '',
    title: '',
    description: '',
    discount: 25,
    originalPrice: 100,
    quantity: 100,
    expiryDays: 30,
  });
  const [predictions, setPredictions] = useState({
    expectedReach: 0,
    estimatedClaims: 0,
    projectedRevenue: 0,
  });

  // Calculate predictions in real-time
  useEffect(() => {
    if (formData.discount && formData.originalPrice && formData.quantity) {
      const baseReach = 1000;
      const discountMultiplier = formData.discount / 10;
      const expectedReach = Math.round(baseReach * discountMultiplier);
      const estimatedClaims = Math.round(expectedReach * 0.3);
      const projectedRevenue = Math.round(
        estimatedClaims * formData.originalPrice * (1 - formData.discount / 100)
      );

      setPredictions({
        expectedReach,
        estimatedClaims,
        projectedRevenue,
      });
    }
  }, [formData.discount, formData.originalPrice, formData.quantity]);

  const handleTemplateSelect = (template: DealTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      template: template.id,
      title: template.exampleTitle,
      description: template.exampleDescription,
      discount: template.defaultDiscount,
    });
    setStep(2);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const progress = (step / 3) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Create Your Deal</h2>
            <p className="text-muted-foreground">From zero to deal in 60 seconds</p>
          </div>
          <Badge className="bg-primary text-white border-0 text-base px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Step {step} of 3
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* Step 1: Template Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Choose a Template</h3>
                  <p className="text-muted-foreground mb-6">
                    Select the category that best fits your business
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className="p-6 cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="text-4xl mb-3">{template.icon}</div>
                          <h4 className="font-bold text-lg mb-2">{template.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {template.description}
                          </p>
                          <Badge variant="outline">{template.category}</Badge>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Deal Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 border-0 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">{selectedTemplate?.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedTemplate?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate?.category}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Deal Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter deal title"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your deal"
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          value={formData.discount}
                          onChange={(e) =>
                            handleInputChange('discount', parseInt(e.target.value) || 0)
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="originalPrice">Original Price ($)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          value={formData.originalPrice}
                          onChange={(e) =>
                            handleInputChange('originalPrice', parseInt(e.target.value) || 0)
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity Available</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) =>
                            handleInputChange('quantity', parseInt(e.target.value) || 0)
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiryDays">Valid For (days)</Label>
                        <Input
                          id="expiryDays"
                          type="number"
                          value={formData.expiryDays}
                          onChange={(e) =>
                            handleInputChange('expiryDays', parseInt(e.target.value) || 0)
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Review & Publish */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 border-0 shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <Check className="w-6 h-6 text-success" />
                    <h3 className="text-xl font-bold">Review Your Deal</h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Title</p>
                      <p className="font-semibold">{formData.title}</p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{formData.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Discount</p>
                        <p className="text-2xl font-bold text-primary">
                          {formData.discount}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Price</p>
                        <p className="text-2xl font-bold">
                          ${formData.originalPrice * (1 - formData.discount / 100)}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          ${formData.originalPrice}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => window.location.href = '/merchant'}>
                      <Zap className="w-4 h-4 mr-2" />
                      Publish Deal
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Preview & Predictions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Live Preview */}
          <Card className="p-6 border-0 shadow-lg sticky top-24">
            <h3 className="font-bold mb-4">Live Preview</h3>
            
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">{selectedTemplate?.icon || '🎁'}</div>
                <p className="text-sm font-semibold">
                  {formData.title || 'Your deal title'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Discount</span>
                <Badge className="bg-accent text-white border-0">
                  {formData.discount}% OFF
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <div className="text-right">
                  <p className="font-bold">
                    ${(formData.originalPrice * (1 - formData.discount / 100)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    ${formData.originalPrice}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Success Metrics */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-success/5 to-primary/5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Expected Performance
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Expected Reach</span>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-primary">
                      {predictions.expectedReach.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">users</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Estimated Claims</span>
                      <Zap className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-accent">
                      {predictions.estimatedClaims.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">deals claimed</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Projected Revenue</span>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-success">
                      ${predictions.projectedRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">estimated earnings</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
