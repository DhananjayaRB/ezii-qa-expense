import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Monitor,
  Users,
  Bot,
  Camera,
  BarChart3,
  CreditCard,
  Settings,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Shield,
  Smartphone,
  Clock,
  TrendingUp,
  Award,
  Target
} from "lucide-react";

export default function DemoPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = [
    {
      id: 1,
      title: "Advanced Expense Management Platform",
      subtitle: "AI-Powered • Cloud-Native • Enterprise-Ready",
      type: "title",
      content: {
        mainHeading: "Transform Your Expense Management",
        subHeading: "Next-Generation AI-Powered Expense Solution",
        keyPoints: [
          "Complete Digital Transformation",
          "Intelligent Automation & OCR",
          "Real-Time Analytics & Reporting",
          "Enterprise Security & Compliance"
        ]
      }
    },
    {
      id: 2,
      title: "The Challenge",
      subtitle: "Traditional Expense Management Pain Points",
      type: "problem",
      content: {
        mainHeading: "Why Organizations Need Modern Solutions",
        problems: [
          {
            icon: Clock,
            title: "Manual Data Entry",
            description: "Hours spent typing receipt data, prone to errors and delays"
          },
          {
            icon: Users,
            title: "Complex Approvals",
            description: "Lengthy approval chains with unclear status and bottlenecks"
          },
          {
            icon: BarChart3,
            title: "Limited Visibility",
            description: "No real-time insights into spending patterns and budgets"
          },
          {
            icon: Shield,
            title: "Compliance Risks",
            description: "Difficult to maintain audit trails and policy compliance"
          }
        ]
      }
    },
    {
      id: 3,
      title: "Our Solution",
      subtitle: "Comprehensive AI-Powered Platform",
      type: "solution",
      content: {
        mainHeading: "Revolutionary Expense Management",
        features: [
          {
            icon: Bot,
            title: "AI Assistant",
            description: "Natural language processing for commands and intelligent automation",
            color: "purple"
          },
          {
            icon: Camera,
            title: "Advanced OCR",
            description: "Dual-tier processing with 95%+ accuracy for data extraction",
            color: "blue"
          },
          {
            icon: BarChart3,
            title: "Real-Time Analytics",
            description: "Live dashboards with predictive insights and cash flow projections",
            color: "green"
          },
          {
            icon: Settings,
            title: "Smart Workflows",
            description: "Configurable approval chains with automated routing and escalation",
            color: "orange"
          }
        ]
      }
    },
    {
      id: 4,
      title: "AI-Powered Intelligence",
      subtitle: "Revolutionary Automation Features",
      type: "feature",
      content: {
        mainHeading: "Intelligent Expense Assistant",
        demoContent: {
          chatExample: [
            { type: "user", message: "Show me pending claims over ₹10,000" },
            { type: "ai", message: "Found 8 pending claims over ₹10,000. Total value: ₹1,24,500. Would you like to see the details or approve them in bulk?" },
            { type: "user", message: "Approve all travel claims under ₹15,000" },
            { type: "ai", message: "Approved 5 travel claims totaling ₹52,300. Payment batch created automatically. All claimants notified." }
          ],
          features: [
            "Natural language command processing",
            "Contextual responses and suggestions",
            "Role-based access and permissions",
            "Proactive insights and recommendations"
          ]
        }
      }
    },
    {
      id: 5,
      title: "OCR Technology",
      subtitle: "Dual-Tier Processing Engine",
      type: "feature",
      content: {
        mainHeading: "Advanced Document Processing",
        ocrDemo: {
          beforeAfter: {
            before: "Manual receipt entry: 5-10 minutes per receipt",
            after: "AI extraction: Under 30 seconds with 95% accuracy"
          },
          tiers: [
            {
              name: "FREE Tier",
              technology: "Tesseract OCR",
              features: ["High accuracy text extraction", "Multi-format support", "Smart field mapping", "No usage limits"],
              color: "green"
            },
            {
              name: "PREMIUM Tier",
              technology: "OpenAI Vision",
              features: ["AI document understanding", "Advanced classification", "Confidence scoring", "Structured output"],
              color: "purple"
            }
          ]
        }
      }
    },
    {
      id: 6,
      title: "Dashboard & Analytics",
      subtitle: "Real-Time Insights & Reporting",
      type: "feature",
      content: {
        mainHeading: "Comprehensive Business Intelligence",
        widgets: [
          { name: "Expense Tracking", description: "Live expense monitoring with trend analysis" },
          { name: "Approval Queue", description: "Pending approvals with SLA tracking" },
          { name: "Cash Flow Projections", description: "AI-powered financial forecasting" },
          { name: "Compliance Monitor", description: "Policy adherence and audit readiness" },
          { name: "Vendor Analytics", description: "Spend analysis by vendor and category" },
          { name: "Team Performance", description: "Department-wise expense patterns" }
        ],
        reportTypes: [
          "User Reports", "Receipt Reports", "Control Reports", "Accountant Reports",
          "Efficient Folks Report", "Department Reports", "Card Statement Analysis", "Compliance Reports"
        ]
      }
    },
    {
      id: 7,
      title: "Workflow Automation",
      subtitle: "Intelligent Process Management",
      type: "feature",
      content: {
        mainHeading: "Smart Approval Workflows",
        workflowSteps: [
          { step: 1, title: "Submit Claim", description: "Employee submits with OCR assistance", icon: Users },
          { step: 2, title: "Auto-Validation", description: "AI checks policy compliance", icon: CheckCircle },
          { step: 3, title: "Smart Routing", description: "Intelligent approval chain routing", icon: ArrowRight },
          { step: 4, title: "Batch Processing", description: "Automated payment batch creation", icon: CreditCard },
          { step: 5, title: "Reimbursement", description: "Direct bank transfer processing", icon: Zap }
        ],
        benefits: [
          "80% reduction in processing time",
          "95% policy compliance rate",
          "60% faster approvals",
          "Automated audit trails"
        ]
      }
    },
    {
      id: 8,
      title: "Enterprise Features",
      subtitle: "Security, Scalability & Compliance",
      type: "technical",
      content: {
        mainHeading: "Enterprise-Grade Platform",
        categories: [
          {
            title: "Security & Compliance",
            items: ["JWT-based authentication", "Role-based access control", "Encrypted file storage", "Comprehensive audit trails", "GDPR compliance"]
          },
          {
            title: "Scalability & Performance",
            items: ["Cloud-native architecture", "Auto-scaling infrastructure", "10,000+ concurrent users", "99.9% uptime guarantee", "Multi-region deployment"]
          },
          {
            title: "Integration & APIs",
            items: ["RESTful API endpoints", "Webhook support", "ERP system connectors", "Single sign-on (SSO)", "Third-party integrations"]
          }
        ]
      }
    },
    {
      id: 9,
      title: "ROI & Business Impact",
      subtitle: "Quantifiable Benefits & Returns",
      type: "roi",
      content: {
        mainHeading: "Measurable Business Value",
        metrics: [
          { metric: "80%", description: "Reduction in manual data entry", icon: TrendingUp, color: "green" },
          { metric: "60%", description: "Faster approval cycles", icon: Clock, color: "blue" },
          { metric: "50%", description: "Less time on expense reporting", icon: Users, color: "purple" },
          { metric: "70%", description: "Reduction in processing errors", icon: CheckCircle, color: "orange" }
        ],
        benefits: [
          "Eliminate paper-based processes",
          "Reduce staff overhead costs",
          "Improve employee satisfaction",
          "Enhanced compliance and audit readiness",
          "Real-time spend visibility and control"
        ]
      }
    },
    {
      id: 10,
      title: "Implementation & Support",
      subtitle: "Comprehensive Deployment Services",
      type: "implementation",
      content: {
        mainHeading: "Complete Implementation Support",
        phases: [
          { phase: "Planning", duration: "1-2 weeks", activities: ["Requirements analysis", "System configuration", "Data migration planning"] },
          { phase: "Deployment", duration: "2-3 weeks", activities: ["Cloud setup", "User provisioning", "Workflow configuration"] },
          { phase: "Training", duration: "1 week", activities: ["User training", "Admin training", "Go-live support"] },
          { phase: "Support", duration: "Ongoing", activities: ["24/7 monitoring", "Regular updates", "Performance optimization"] }
        ],
        supportTiers: [
          "Standard Support: Email and documentation",
          "Premium Support: Phone, email, chat with SLA",
          "Enterprise Support: Dedicated account manager"
        ]
      }
    },
    {
      id: 11,
      title: "Live Demo",
      subtitle: "See the Platform in Action",
      type: "demo",
      content: {
        mainHeading: "Interactive Platform Demonstration",
        demoSections: [
          { title: "Employee Experience", description: "Submit claims with AI assistance", screenshot: "📸 Employee Dashboard" },
          { title: "Manager Approvals", description: "Bulk approve with intelligent filtering", screenshot: "📸 Approval Workflow" },
          { title: "AI Assistant", description: "Natural language commands", screenshot: "📸 Chat Interface" },
          { title: "OCR Processing", description: "Automatic data extraction", screenshot: "📸 Receipt Upload" },
          { title: "Analytics Dashboard", description: "Real-time insights and reports", screenshot: "📸 Analytics Widgets" }
        ]
      }
    },
    {
      id: 12,
      title: "Next Steps",
      subtitle: "Ready to Transform Your Expense Management?",
      type: "closing",
      content: {
        mainHeading: "Let's Get Started",
        callToAction: {
          primary: "Schedule a Personalized Demo",
          secondary: "Start Your Free Trial Today",
          features: [
            "30-day free trial with full features",
            "Dedicated implementation specialist",
            "Custom configuration included",
            "Training and onboarding support"
          ]
        },
        contact: {
          email: "sales@expensemanagement.com",
          phone: "+1 (555) 123-4567",
          website: "www.expensemanagement.com"
        }
      }
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPresentation = () => {
    setCurrentSlide(0);
    setIsPlaying(false);
  };

  const downloadPPT = () => {
    // In a real implementation, this would generate and download a PowerPoint file
    alert("PowerPoint download feature would be implemented to generate a .pptx file with all slides and content.");
  };

  const currentSlideData = slides[currentSlide];

  const renderSlideContent = () => {
    switch (currentSlideData.type) {
      case "title":
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {(currentSlideData.content as any).mainHeading}
              </h1>
              <p className="text-2xl text-gray-600">{(currentSlideData.content as any).subHeading}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
              {(currentSlideData.content as any).keyPoints?.map((point: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-md">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="font-semibold">{point}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "problem":
        return (
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-center text-gray-900 mb-8">
              {(currentSlideData.content as any).mainHeading}
            </h1>
            <div className="grid grid-cols-2 gap-8">
              {(currentSlideData.content as any).problems?.map((problem: any, index: number) => {
                const Icon = problem.icon;
                return (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <Icon className="w-8 h-8 text-red-500 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-red-900 mb-2">{problem.title}</h3>
                        <p className="text-red-800">{problem.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "solution":
        return (
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-center text-gray-900 mb-8">
              {(currentSlideData.content as any).mainHeading}
            </h1>
            <div className="grid grid-cols-2 gap-8">
              {(currentSlideData.content as any).features?.map((feature: any, index: number) => {
                const Icon = feature.icon;
                const colorClasses: { [key: string]: string } = {
                  purple: "bg-purple-50 border-purple-200 text-purple-900",
                  blue: "bg-blue-50 border-blue-200 text-blue-900",
                  green: "bg-green-50 border-green-200 text-green-900",
                  orange: "bg-orange-50 border-orange-200 text-orange-900"
                };
                return (
                  <div key={index} className={`${colorClasses[feature.color] || colorClasses.blue} border rounded-lg p-6`}>
                    <div className="flex items-start gap-4">
                      <Icon className="w-8 h-8 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p>{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "roi":
        return (
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-center text-gray-900 mb-8">
              {(currentSlideData.content as any).mainHeading}
            </h1>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {(currentSlideData.content as any).metrics?.map((item: any, index: number) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="text-center bg-white rounded-lg shadow-lg p-6">
                    <Icon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <div className="text-4xl font-bold text-blue-600 mb-2">{item.metric}</div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Additional Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                {(currentSlideData.content as any).benefits?.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "feature":
        if (currentSlideData.title === "AI-Powered Intelligence") {
          return (
            <div className="space-y-8">
              <h1 className="text-5xl font-bold text-center text-gray-900 mb-8">
                {(currentSlideData.content as any).mainHeading}
              </h1>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono">
                  <h3 className="text-white text-lg mb-4">AI Chat Interface</h3>
                  {(currentSlideData.content as any).demoContent?.chatExample?.map((msg: any, index: number) => (
                    <div key={index} className={`mb-3 ${msg.type === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
                      <span className="opacity-60">{msg.type === 'user' ? '> ' : '🤖 '}</span>
                      {msg.message}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Key Capabilities</h3>
                  {(currentSlideData.content as any).demoContent?.features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Bot className="w-5 h-5 text-purple-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        } else if (currentSlideData.title === "OCR Technology") {
          return (
            <div className="space-y-8">
              <h1 className="text-5xl font-bold text-center text-gray-900 mb-8">
                {(currentSlideData.content as any).mainHeading}
              </h1>
              <div className="grid grid-cols-2 gap-8">
                {(currentSlideData.content as any).ocrDemo?.tiers?.map((tier: any, index: number) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">{tier.name}</h3>
                    <p className="text-blue-800 mb-4">{tier.technology}</p>
                    <ul className="space-y-2">
                      {tier.features?.map((feature: string, fIndex: number) => (
                        <li key={fIndex} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Performance Improvement</h3>
                <div className="flex justify-center items-center gap-8">
                  <div className="text-red-600">
                    <div className="text-2xl font-bold">5-10 min</div>
                    <div className="text-sm">Manual Entry</div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-gray-400" />
                  <div className="text-green-600">
                    <div className="text-2xl font-bold">30 sec</div>
                    <div className="text-sm">AI Extraction</div>
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (currentSlideData.title === "Dashboard & Analytics") {
          return (
            <div className="space-y-8">
              <h1 className="text-5xl font-bold text-center text-gray-900 mb-8">
                {(currentSlideData.content as any).mainHeading}
              </h1>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {(currentSlideData.content as any).widgets?.map((widget: any, index: number) => (
                  <div key={index} className="bg-white border rounded-lg p-4 shadow-md">
                    <h3 className="font-semibold mb-2">{widget.name}</h3>
                    <p className="text-sm text-gray-600">{widget.description}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">8 Comprehensive Report Types</h3>
                <div className="grid grid-cols-4 gap-3">
                  {(currentSlideData.content as any).reportTypes?.map((report: string, index: number) => (
                    <Badge key={index} variant="secondary" className="p-2 text-center">
                      {report}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        break;

      default:
        return (
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{currentSlideData.title}</h1>
            <p className="text-xl text-gray-600">{currentSlideData.subtitle}</p>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header Controls */}
      {!isFullscreen && (
        <div className="bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Demo Presentation</h1>
                <p className="text-gray-600">Client demonstration slides with interactive content</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={downloadPPT} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PPT
                </Button>
                <Button variant="outline" onClick={() => setIsFullscreen(true)}>
                  <Maximize className="w-4 h-4" />
                  Fullscreen
                </Button>
                <Button variant="outline" onClick={() => window.close()}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Area */}
      <div className={`${isFullscreen ? 'h-screen' : 'h-[calc(100vh-120px)]'} flex flex-col`}>
        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl p-12">
            {renderSlideContent()}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlide === 0}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetPresentation}>
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            {/* Slide Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Slide {currentSlide + 1} of {slides.length}
              </span>
              <div className="flex gap-1">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              {isFullscreen && (
                <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
                  Exit Fullscreen
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={togglePlayback}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Auto Play'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Thumbnails (when not fullscreen) */}
      {!isFullscreen && (
        <div className="bg-gray-100 border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Presentation Outline</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`flex-shrink-0 w-48 p-3 text-left rounded-lg border transition-colors ${
                    index === currentSlide
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{slide.id}. {slide.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{slide.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}