# ANALYTICS TRACKING SETUP
**Priority:** Critical for Day 2+ optimization  
**Status:** Ready for implementation  
**Time Required:** 30 minutes setup

---

## TRACKING INFRASTRUCTURE NEEDED

### Core Analytics Tools:
1. **Google Analytics 4** (Website traffic + conversions)
2. **UTM Parameter Tracking** (Source attribution)
3. **Calculator Event Tracking** (Tool usage + completion)
4. **Email Signup Tracking** (Lead generation)
5. **Social Media Analytics** (Content performance)

---

## COMMISSION CALCULATOR TRACKING

### Key Events to Track:
1. **Calculator Page Views** (Total traffic)
2. **Calculation Completions** (Tool usage)
3. **Shock Moments** (High loss amounts revealed)
4. **Email Signups** (Lead capture)
5. **Demo Requests** (Conversion events)
6. **Share Actions** (Viral coefficient)

### Calculator Analytics Code:
```javascript
// Google Analytics 4 Events for Calculator

// Track calculator page load
gtag('event', 'page_view', {
  page_title: 'Commission Calculator',
  page_location: 'tutorlingua.com/calculator'
});

// Track calculation completion
function trackCalculation(monthlyRevenue, commissionRate, annualLoss) {
  gtag('event', 'calculation_complete', {
    event_category: 'Calculator',
    event_label: 'Commission Loss Calculated',
    value: annualLoss,
    custom_parameters: {
      monthly_revenue: monthlyRevenue,
      commission_rate: commissionRate,
      annual_loss: annualLoss
    }
  });
}

// Track high-value shock moments (>£5,000 annual loss)
function trackShockMoment(annualLoss) {
  if (annualLoss > 5000) {
    gtag('event', 'shock_moment', {
      event_category: 'Calculator',
      event_label: 'High Loss Revelation',
      value: annualLoss
    });
  }
}

// Track email signup
function trackEmailSignup(source) {
  gtag('event', 'lead_generation', {
    event_category: 'Conversion',
    event_label: 'Email Signup',
    event_source: source
  });
}

// Track social sharing
function trackSocialShare(platform) {
  gtag('event', 'share', {
    method: platform,
    content_type: 'calculator_result',
    item_id: 'commission_calculator'
  });
}
```

---

## UTM PARAMETER STRATEGY

### Campaign Tracking Structure:
```
Base URL: tutorlingua.com/calculator
UTM Format: ?utm_source=[source]&utm_medium=[medium]&utm_campaign=[campaign]&utm_content=[content]
```

### Source Attribution Links:

#### Social Media Campaigns:
```
Twitter: ?utm_source=twitter&utm_medium=social&utm_campaign=day1_blitz&utm_content=commission_thread
LinkedIn: ?utm_source=linkedin&utm_medium=social&utm_campaign=day1_blitz&utm_content=professional_post  
Reddit: ?utm_source=reddit&utm_medium=social&utm_campaign=day1_blitz&utm_content=community_post
Instagram: ?utm_source=instagram&utm_medium=social&utm_campaign=day1_blitz&utm_content=story_sequence
```

#### Direct Outreach:
```
LinkedIn DM: ?utm_source=linkedin&utm_medium=direct_message&utm_campaign=outreach_week1&utm_content=personalized_message
Email: ?utm_source=email&utm_medium=direct_outreach&utm_campaign=outreach_week1&utm_content=commission_calculator
```

#### Content Marketing:
```
Blog Post: ?utm_source=blog&utm_medium=content&utm_campaign=seo_organic&utm_content=platform_comparison
Video: ?utm_source=youtube&utm_medium=video&utm_campaign=educational_content&utm_content=commission_explanation
```

---

## CONVERSION FUNNEL TRACKING

### Stage 1: Awareness (Social Content)
```
Metric: Content Views, Shares, Comments
Goal: Drive traffic to calculator
Tracking: Social platform analytics + UTM clicks
```

### Stage 2: Interest (Calculator Usage)
```
Metric: Calculator page views, completion rate
Goal: Demonstrate commission loss reality
Tracking: GA4 events + completion percentage
```

### Stage 3: Consideration (Email Signup)
```
Metric: Email capture rate, demo requests
Goal: Build relationship for nurturing
Tracking: Conversion rate by traffic source
```

### Stage 4: Decision (User Registration)
```
Metric: Demo attendance, signup completion
Goal: Convert to active TutorLingua user
Tracking: End-to-end attribution by source
```

---

## DAILY TRACKING DASHBOARD

### Key Metrics to Monitor:

#### Traffic Metrics:
- **Daily Calculator Visits** (Target: 50+ by Day 3)
- **Traffic Sources** (Social vs. Direct vs. Organic)
- **Geographic Distribution** (UK/EU/US focus)
- **Mobile vs. Desktop** (User experience optimization)

#### Engagement Metrics:
- **Calculation Completion Rate** (Target: 60%+)
- **Average Session Duration** (Quality indicator)
- **Bounce Rate** (Content relevance)
- **Page Depth** (Site exploration)

#### Conversion Metrics:
- **Email Signup Rate** (Target: 40% of calculator users)
- **Demo Request Rate** (Target: 60% of email signups)
- **Social Sharing Rate** (Viral coefficient)
- **Return Visitor Percentage** (Interest level)

#### Content Performance:
- **Social Media Reach** (Content distribution)
- **Engagement Rate by Platform** (Channel optimization)
- **Click-through Rate** (Content effectiveness)
- **Share Velocity** (Viral potential)

---

## ANALYTICS IMPLEMENTATION CHECKLIST

### Immediate Setup (30 minutes):
- [ ] Install Google Analytics 4 on calculator page
- [ ] Add UTM tracking to all social media links
- [ ] Implement calculator event tracking
- [ ] Set up email signup conversion tracking
- [ ] Create custom dashboard for daily monitoring

### Advanced Tracking (Day 2+):
- [ ] Social media analytics aggregation
- [ ] Customer journey mapping
- [ ] Attribution modeling setup
- [ ] A/B testing framework
- [ ] Automated reporting system

---

## REPORTING SCHEDULE

### Daily Reports (23:00 GMT):
```
**Calculator Performance:**
- Total visits: XXX
- Calculations completed: XXX (XX% completion rate)
- Email signups: XXX (XX% conversion rate)
- Average annual loss revealed: £XXX

**Traffic Sources:**
- Social media: XXX visits (XX%)
- Direct outreach: XXX visits (XX%)
- Organic/referral: XXX visits (XX%)

**Conversion Funnel:**
- Traffic → Calculator: XX%
- Calculator → Email: XX%
- Email → Demo: XX%

**Top Performing Content:**
1. [Platform]: XXX clicks, XX% CTR
2. [Platform]: XXX clicks, XX% CTR
3. [Platform]: XXX clicks, XX% CTR
```

### Weekly Analysis (Sundays):
- Trend analysis and optimization recommendations
- Traffic source performance comparison
- Content effectiveness evaluation  
- Conversion rate optimization opportunities
- User behavior insights and improvements

---

## SUCCESS BENCHMARKS

### Day 2 Targets:
- **Calculator visits:** 100+
- **Calculations completed:** 60+
- **Email signups:** 25+
- **Demo requests:** 5+

### Week 1 Targets:
- **Calculator visits:** 2,000+  
- **Calculations completed:** 1,200+
- **Email signups:** 500+
- **Demo requests:** 200+
- **User registrations:** 50+

### Performance Indicators:
- **Viral Coefficient:** Each user brings 1.2+ new visitors
- **Content ROI:** £10+ annual tutor savings per £1 content cost
- **Channel Efficiency:** LinkedIn > Email > Twitter > Reddit > Instagram
- **Message Resonance:** Commission calculator > general platform benefits

---

## OPTIMIZATION FRAMEWORK

### A/B Testing Priorities:
1. **Calculator Headlines** (Shock value vs. Professional tone)
2. **Email Capture Forms** (Top vs. bottom placement)
3. **Social Media CTAs** (Direct vs. curiosity-based)
4. **Landing Page Design** (Commission focus vs. feature focus)

### Continuous Improvements:
- **Content Messaging:** Based on engagement rates
- **Traffic Source Mix:** Focus budget on highest-converting channels
- **Conversion Optimization:** Improve weak funnel steps
- **User Experience:** Reduce friction points

---

**ANALYTICS STATUS:** Ready for implementation  
**Setup Time Required:** 30 minutes  
**First Data Available:** 24 hours after implementation  
**Daily Optimization:** Based on previous day performance**