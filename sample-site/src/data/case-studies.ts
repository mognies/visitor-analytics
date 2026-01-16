export interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  result: string;
  description: string;
  challenge: string;
  solution: string;
  impact: string[];
  testimonial: {
    quote: string;
    author: string;
    position: string;
  };
}

export const caseStudies: CaseStudy[] = [
  {
    id: "techcorp-inc",
    company: "TechCorp Inc.",
    industry: "Technology",
    result: "300% increase in conversions",
    description: "How TechCorp leveraged our analytics to triple their online sales.",
    challenge: "TechCorp was experiencing high traffic but low conversion rates on their e-commerce platform. They couldn't identify which products were attracting visitors or where users were dropping off in the purchase funnel.",
    solution: "We implemented our visitor analytics platform to track user journeys across their entire site. By analyzing time spent on different product pages and identifying common abandonment points, we helped TechCorp optimize their product pages and streamline their checkout process.",
    impact: [
      "300% increase in overall conversion rate",
      "Reduced cart abandonment by 45%",
      "Increased average order value by 35%",
      "Improved page load times by 60%"
    ],
    testimonial: {
      quote: "The insights we gained from visitor analytics completely transformed our approach to e-commerce. We now understand our customers better than ever before.",
      author: "Sarah Chen",
      position: "VP of E-commerce, TechCorp Inc."
    }
  },
  {
    id: "fashion-forward",
    company: "Fashion Forward",
    industry: "Retail",
    result: "50% reduction in cart abandonment",
    description: "Strategic insights helped optimize the checkout experience.",
    challenge: "Fashion Forward had a beautiful online store but struggled with high cart abandonment rates. Despite heavy marketing spend, they couldn't convert browsing visitors into paying customers.",
    solution: "Our analytics revealed that visitors were spending significant time comparing similar products but abandoning carts during the payment process. We helped Fashion Forward implement a streamlined checkout flow and personalized product recommendations based on browsing behavior.",
    impact: [
      "50% reduction in cart abandonment",
      "25% increase in customer lifetime value",
      "Improved mobile conversion by 80%",
      "35% increase in repeat purchase rate"
    ],
    testimonial: {
      quote: "Understanding where our customers hesitated allowed us to remove friction from the buying process. The results speak for themselves.",
      author: "Marcus Thompson",
      position: "CEO, Fashion Forward"
    }
  },
  {
    id: "global-ventures",
    company: "Global Ventures",
    industry: "Finance",
    result: "2x customer retention",
    description: "Data-driven personalization doubled customer lifetime value.",
    challenge: "Global Ventures, a fintech startup, was acquiring customers but struggling with retention. They needed to understand which features kept users engaged and which caused them to churn.",
    solution: "By tracking user behavior across different features and correlating it with retention metrics, we identified the key actions that predicted long-term engagement. Global Ventures then personalized onboarding and communication based on these insights.",
    impact: [
      "Doubled customer retention rate",
      "150% increase in feature adoption",
      "40% reduction in support tickets",
      "90% improvement in user satisfaction scores"
    ],
    testimonial: {
      quote: "The ability to predict and prevent churn has been a game-changer for our business. We're now building features our users actually want.",
      author: "Dr. Emily Rodriguez",
      position: "Chief Product Officer, Global Ventures"
    }
  },
  {
    id: "healthplus",
    company: "HealthPlus",
    industry: "Healthcare",
    result: "40% faster time to market",
    description: "Analytics accelerated product development and launch cycles.",
    challenge: "HealthPlus was developing a new patient portal but wasn't sure which features to prioritize. Traditional user research was time-consuming and expensive.",
    solution: "We implemented analytics tracking on their beta portal to observe real user behavior. This data-driven approach helped them identify which features users engaged with most and which needed improvement, dramatically accelerating their development cycle.",
    impact: [
      "40% reduction in time to market",
      "85% user satisfaction score",
      "60% increase in feature usage",
      "Saved $500K in development costs"
    ],
    testimonial: {
      quote: "Real-time user insights allowed us to iterate quickly and confidently. We launched a product our patients love in record time.",
      author: "Dr. James Park",
      position: "Director of Digital Health, HealthPlus"
    }
  },
  {
    id: "edulearn",
    company: "EduLearn",
    industry: "Education",
    result: "85% user satisfaction",
    description: "Understanding learner behavior transformed course engagement.",
    challenge: "EduLearn's online courses had high enrollment but low completion rates. They needed to understand where students were getting stuck and why they weren't finishing courses.",
    solution: "Our analytics platform tracked student engagement across video lessons, quizzes, and assignments. EduLearn used these insights to restructure courses, add support at critical drop-off points, and personalize learning paths.",
    impact: [
      "85% user satisfaction score",
      "70% increase in course completion rates",
      "3x growth in student referrals",
      "45% improvement in quiz scores"
    ],
    testimonial: {
      quote: "Seeing exactly where students struggled allowed us to provide support at the right moment. Our completion rates have never been higher.",
      author: "Prof. Lisa Williams",
      position: "Head of Curriculum, EduLearn"
    }
  },
  {
    id: "greenearth",
    company: "GreenEarth",
    industry: "Sustainability",
    result: "$2M revenue growth",
    description: "Targeted campaigns based on visitor insights drove massive growth.",
    challenge: "GreenEarth, an eco-friendly products marketplace, was struggling to differentiate their messaging. They needed to understand which sustainability topics resonated most with their audience.",
    solution: "By analyzing time spent on different product categories and content pages, we helped GreenEarth identify their most engaged audience segments. They then created targeted campaigns for each segment based on their specific interests.",
    impact: [
      "$2M in additional revenue",
      "200% increase in email engagement",
      "Triple-digit growth in social sharing",
      "Expanded to 3 new product categories"
    ],
    testimonial: {
      quote: "Understanding our visitors' values allowed us to communicate in a way that truly resonates. Our community has grown exponentially.",
      author: "Alex Martinez",
      position: "Founder & CEO, GreenEarth"
    }
  }
];
